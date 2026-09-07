import { useCallback, useRef, useState } from 'react';
import {
  ConversationListItem,
  fetchConversationMessages,
  fetchRecentConversations,
  streamAiChat,
  submitMessageFeedback,
  ThumbsFeedback,
  CustomModelData,
} from '../services/aiChatApi';

export interface ToolCallState {
  toolCallId: string;
  toolName: string;
  status: 'calling' | 'result';
  input?: any;
  output?: any;
  label: string;
}

export function formatToolLabel(
  toolName: string,
  status: 'calling' | 'result',
  input?: any,
  output?: any
): string {
  if (toolName === 'getPRList') {
    if (status === 'calling') {
      return 'Fetching recent pull requests...';
    }
    const count = Array.isArray(output) ? output.length : 0;
    return count > 0 ? `Read ${count} recent pull requests` : 'Read recent pull requests';
  }
  if (toolName === 'getDiff') {
    const prId = input?.prId ? `#${input.prId}` : '';
    if (status === 'calling') {
      return `Reading diff for PR ${prId}...`;
    }
    return `Read diff for PR ${prId}`;
  }
  if (toolName === 'getFile') {
    const filePath = input?.path || input?.file || '';
    if (status === 'calling') {
      return `Reading file ${filePath}...`;
    }
    return `Read file ${filePath}`;
  }
  if (toolName === 'getTree') {
    if (status === 'calling') {
      return 'Inspecting repository tree...';
    }
    return 'Inspected repository tree';
  }

  const cleanName = toolName.replace(/([A-Z])/g, ' $1').toLowerCase().trim();
  if (status === 'calling') {
    return `Executing ${cleanName}...`;
  }
  return `Executed ${cleanName}`;
}

export interface ChatMessage {
  id: string;
  dbMessageId?: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
  prContext?: string;
  isStreaming?: boolean;
  thumbsFeedback?: ThumbsFeedback;
  toolCalls?: ToolCallState[];
  llmModel?: string;
  inputTokens?: number;
  outputTokens?: number;
  reasoningTokens?: number;
  cachedTokens?: number;
}

// Must match the backend's per-page limit on GET /conversation
const CONVERSATIONS_PAGE_SIZE = 20;
const CONVERSATIONS_STORAGE_KEY = 'gobe-conversations-cache';

export interface SendMessageOptions {
  text: string;
  llmModel?: string;
  modelName?: string;
  customModel?: boolean;
  customModelData?: CustomModelData;
  prId?: string;
  prTitle?: string;
  prContext?: string;
  // True when the user just picked this PR from the dropdown for THIS message.
  // When false, a prId already attached earlier in the conversation is skipped.
  prExplicitlyAttached?: boolean;
}

// Shape sent as body.previousContext so the backend has prior turns for context
export interface PreviousContextEntry {
  role: 'user' | 'assistant';
  content: string;
}

export const useAiChat = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [activeConversation, setActiveConversation] =
    useState<ConversationListItem | null>(null);
  const [isThinking, setIsThinking] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [conversations, setConversations] = useState<ConversationListItem[]>(() => {
    try {
      const raw = localStorage.getItem(CONVERSATIONS_STORAGE_KEY);
      return raw ? (JSON.parse(raw) as ConversationListItem[]) : [];
    } catch {
      return [];
    }
  });
  const [isLoadingConversations, setIsLoadingConversations] = useState(false);
  const [isLoadingMoreConversations, setIsLoadingMoreConversations] = useState(false);
  const [hasMoreConversations, setHasMoreConversations] = useState(false);

  // Guards against out-of-order stream updates when messages are sent quickly
  const streamingIdRef = useRef<string | null>(null);
  // Guards against out-of-order history loads when switching conversations fast
  const loadingConversationIdRef = useRef<string | null>(null);
  // Holds the loaded conversation history, forwarded as previousContext on /chat
  const previousContextRef = useRef<PreviousContextEntry[]>([]);
  // PR ids already attached during the active conversation, so the same PR
  // is not attached again unless the user explicitly re-selects it
  const attachedPrIdsRef = useRef<Set<string>>(new Set());

  const appendContentToMessage = useCallback(
    (messageId: string, chunk: string) => {
      setMessages((prev) =>
        prev.map((m) => (m.id === messageId ? { ...m, text: m.text + chunk } : m))
      );
    },
    []
  );

  const loadConversations = useCallback(async (force = false) => {
    // If not forced and we already have cached items, avoid refetching
    if (!force) {
      try {
        const raw = localStorage.getItem(CONVERSATIONS_STORAGE_KEY);
        if (raw) {
          const cached = JSON.parse(raw) as ConversationListItem[];
          if (cached.length > 0) {
            setConversations(cached);
            setHasMoreConversations(cached.length >= CONVERSATIONS_PAGE_SIZE);
            return;
          }
        }
      } catch {
        // Fall through to network fetch
      }
    }

    setIsLoadingConversations(true);
    setError(null);
    try {
      const items = await fetchRecentConversations();
      setConversations(items);
      setHasMoreConversations(items.length >= CONVERSATIONS_PAGE_SIZE);
      try {
        localStorage.setItem(CONVERSATIONS_STORAGE_KEY, JSON.stringify(items));
      } catch {
        // Ignore storage quota errors
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load conversations.');
    } finally {
      setIsLoadingConversations(false);
    }
  }, []);

  const loadMoreConversations = useCallback(async () => {
    if (isLoadingMoreConversations || conversations.length === 0) return;
    setIsLoadingMoreConversations(true);
    try {
      const cursor = conversations[conversations.length - 1].updatedAt;
      const items = await fetchRecentConversations(cursor);
      setConversations((prev) => {
        const updated = [...prev, ...items];
        try {
          localStorage.setItem(CONVERSATIONS_STORAGE_KEY, JSON.stringify(updated));
        } catch {
          // Ignore
        }
        return updated;
      });
      setHasMoreConversations(items.length >= CONVERSATIONS_PAGE_SIZE);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load conversations.');
    } finally {
      setIsLoadingMoreConversations(false);
    }
  }, [conversations, isLoadingMoreConversations]);

  const resetChat = useCallback(() => {
    loadingConversationIdRef.current = null;
    previousContextRef.current = [];
    attachedPrIdsRef.current = new Set();
    setIsLoadingMessages(false);
    setMessages([]);
    setActiveConversation(null);
    setIsThinking(false);
    setError(null);
  }, []);

  // Binds to an existing conversation and fetches its saved messages
  const selectConversation = useCallback(
    async (conversation: ConversationListItem) => {
      const conversationId = conversation.id;
      loadingConversationIdRef.current = conversationId;
      previousContextRef.current = [];
      attachedPrIdsRef.current = new Set();

      setMessages([]);
      setActiveConversation(conversation);
      setIsThinking(false);
      setError(null);
      setIsLoadingMessages(true);

      try {
        const history = await fetchConversationMessages(conversationId);

        // A newer selection/reset happened while this request was in flight
        if (loadingConversationIdRef.current !== conversationId) return;

        const restored: ChatMessage[] = [];
        const context: PreviousContextEntry[] = [];
        history.forEach((row, index) => {
          const rawDate = row.updatedAt || row.createdAt || new Date().toISOString();
          const timestamp = new Date(rawDate).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          });
          const baseId = row.id || row.messageid || `msg-${index}`;
          const dbId = row.id ? String(row.id) : undefined;
          if (row.inputMessage) {
            restored.push({
              id: `${baseId}-user`,
              dbMessageId: dbId,
              sender: 'user',
              text: row.inputMessage,
              timestamp,
            });
            context.push({ role: 'user', content: row.inputMessage });
          }
          if (row.outputMessage) {
            const restoredToolCalls: ToolCallState[] = Array.isArray(row.usedToolCalls)
              ? row.usedToolCalls.map((name, i) => ({
                  toolCallId: `history-tool-${i}`,
                  toolName: String(name),
                  status: 'result',
                  label: formatToolLabel(String(name), 'result'),
                }))
              : [];

            restored.push({
              id: `${baseId}-ai`,
              dbMessageId: dbId,
              thumbsFeedback: (row.thumbsFeedback as ThumbsFeedback) ?? null,
              sender: 'ai',
              text: row.outputMessage,
              timestamp,
              toolCalls: restoredToolCalls.length > 0 ? restoredToolCalls : undefined,
              llmModel: row.llmModel || undefined,
              inputTokens: row.inputTokens != null ? Number(row.inputTokens) : undefined,
              outputTokens: row.outputToken != null ? Number(row.outputToken) : undefined,
              reasoningTokens: row.outputReasoningTokens != null ? Number(row.outputReasoningTokens) : undefined,
              cachedTokens: row.cacheInputReadTokens != null ? Number(row.cacheInputReadTokens) : undefined,
            });
            context.push({ role: 'assistant', content: row.outputMessage });
          }
        });

        setMessages(restored);
        previousContextRef.current = context;
      } catch (err) {
        if (loadingConversationIdRef.current !== conversationId) return;
        setError(
          err instanceof Error ? err.message : 'Failed to load chat history.'
        );
      } finally {
        if (loadingConversationIdRef.current === conversationId) {
          loadingConversationIdRef.current = null;
          setIsLoadingMessages(false);
        }
      }
    },
    []
  );

  const sendMessage = useCallback(
    async ({
      text,
      llmModel,
      modelName,
      customModel,
      customModelData,
      prId,
      prTitle,
      prContext,
      prExplicitlyAttached,
    }: SendMessageOptions) => {
      const trimmed = text.trim();
      if (!trimmed) return;

      setError(null);

      // Attach a PR only when it has not been attached in this conversation
      // already — unless the user explicitly picked it again for this message
      const shouldAttachPr =
        !!prId && (prExplicitlyAttached === true || !attachedPrIdsRef.current.has(prId));
      if (shouldAttachPr && prId) {
        attachedPrIdsRef.current.add(prId);
      }

      const effectiveModelId = llmModel || customModelData?.id;

      const userMsg: ChatMessage = {
        id: `user-${Date.now()}`,
        sender: 'user',
        text: trimmed,
        timestamp: new Date().toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        }),
        prContext:
          prContext ??
          (shouldAttachPr ? (prTitle ?? (prId ? `PR #${prId}` : undefined)) : undefined),
        llmModel: effectiveModelId,
      };

      const aiMsgId = `ai-${Date.now()}`;
      const aiMsg: ChatMessage = {
        id: aiMsgId,
        sender: 'ai',
        text: '',
        timestamp: new Date().toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        }),
        isStreaming: true,
        toolCalls: [],
        llmModel: effectiveModelId,
      };

      setMessages((prev) => [...prev, userMsg, aiMsg]);
      setIsThinking(true);
      streamingIdRef.current = aiMsgId;

      let createdConversationId: string | null = null;
      let assistantReply = '';

      try {
        await streamAiChat(
          {
            message: trimmed,
            llmModel: effectiveModelId,
            modelName: modelName || customModelData?.name,
            customModel: customModel ?? customModelData?.isCustom,
            customModelData,
            ...(activeConversation ? { conversationId: activeConversation.id } : {}),
            // Existing conversation: forward loaded history so the backend
            // can build a context-aware reply. Null for brand new chats.
            previousContext: activeConversation && previousContextRef.current.length > 0
              ? previousContextRef.current
              : null,
            ...(shouldAttachPr ? { prId } : {}),
            ...(shouldAttachPr && prTitle ? { prTitle } : {}),
          },
          {
            onConversationId: (id) => {
              createdConversationId = id;
              setActiveConversation((prev) => prev ?? { id, title: 'New Session', updatedAt: '' });
            },
            onToolCall: (event) => {
              setMessages((prev) =>
                prev.map((m) => {
                  if (m.id !== aiMsgId) return m;
                  const currentTools = m.toolCalls ? [...m.toolCalls] : [];
                  const existingIdx = currentTools.findIndex((t) => t.toolCallId === event.toolCallId);
                  const label = formatToolLabel(event.toolName, 'calling', event.input);
                  const newToolItem: ToolCallState = {
                    toolCallId: event.toolCallId,
                    toolName: event.toolName,
                    status: 'calling',
                    input: event.input,
                    label,
                  };
                  if (existingIdx >= 0) {
                    currentTools[existingIdx] = newToolItem;
                  } else {
                    currentTools.push(newToolItem);
                  }
                  return { ...m, toolCalls: currentTools };
                })
              );
            },
            onToolResult: (event) => {
              setMessages((prev) =>
                prev.map((m) => {
                  if (m.id !== aiMsgId) return m;
                  const currentTools = m.toolCalls ? [...m.toolCalls] : [];
                  const existingIdx = currentTools.findIndex((t) => t.toolCallId === event.toolCallId);
                  const label = formatToolLabel(
                    event.toolName,
                    'result',
                    existingIdx >= 0 ? currentTools[existingIdx].input : undefined,
                    event.output
                  );
                  if (existingIdx >= 0 && currentTools[existingIdx]) {
                    currentTools[existingIdx] = {
                      ...currentTools[existingIdx]!,
                      status: 'result',
                      output: event.output,
                      label,
                    };
                  } else {
                    currentTools.push({
                      toolCallId: event.toolCallId,
                      toolName: event.toolName,
                      status: 'result',
                      output: event.output,
                      label,
                    });
                  }
                  return { ...m, toolCalls: currentTools };
                })
              );
            },
            onContent: (chunk) => {
              setIsThinking(false);
              assistantReply += chunk;
              appendContentToMessage(aiMsgId, chunk);
            },
          }
        );

        // Track this exchange so subsequent sends include it in previousContext
        if (activeConversation && assistantReply) {
          previousContextRef.current = [
            ...previousContextRef.current,
            { role: 'user', content: trimmed },
            { role: 'assistant', content: assistantReply },
          ];
        }

        setMessages((prev) =>
          prev.map((m) => (m.id === aiMsgId ? { ...m, isStreaming: false } : m))
        );

        // A brand new conversation was created — refresh the history so the
        // generated title shows up in the list and in the header
        if (createdConversationId) {
          try {
            const items = await fetchRecentConversations();
            setConversations(items);
            setHasMoreConversations(items.length >= CONVERSATIONS_PAGE_SIZE);
            try {
              localStorage.setItem(CONVERSATIONS_STORAGE_KEY, JSON.stringify(items));
            } catch {
              // Ignore
            }
            const created = items.find((c) => c.id === createdConversationId);
            if (created) {
              setActiveConversation(created);
            }
          } catch {
            // History refresh is best-effort; the chat itself already succeeded
          }
        }
      } catch (err) {
        const detail =
          err instanceof Error ? err.message : 'Something went wrong while chatting.';
        setError(detail);
        setMessages((prev) =>
          prev.map((m) =>
            m.id === aiMsgId
              ? {
                  ...m,
                  isStreaming: false,
                  text:
                    m.text ||
                    `Sorry, I could not generate a response. ${detail}`,
                }
              : m
          )
        );
      } finally {
        setIsThinking(false);
        streamingIdRef.current = null;
      }
    },
    [activeConversation, appendContentToMessage]
  );

  const sendFeedback = useCallback(
    async (messageId: string, feedback: ThumbsFeedback) => {
      // Optimistically update message state
      setMessages((prev) =>
        prev.map((m) =>
          m.id === messageId || m.dbMessageId === messageId
            ? { ...m, thumbsFeedback: feedback }
            : m
        )
      );

      try {
        await submitMessageFeedback({
          messageId,
          userFeedback: feedback,
        });
      } catch (err) {
        console.error('Failed to submit message feedback:', err);
      }
    },
    []
  );

  return {
    messages,
    isThinking,
    isLoadingMessages,
    error,
    clearError: useCallback(() => setError(null), []),
    activeConversation,
    sendMessage,
    sendFeedback,
    resetChat,
    selectConversation,
    conversations,
    isLoadingConversations,
    isLoadingMoreConversations,
    hasMoreConversations,
    loadConversations,
    loadMoreConversations,
  };
};

