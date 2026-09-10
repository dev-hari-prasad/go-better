const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://api.gobetter.dev';

// Shape of one row returned by GET /conversation
export interface ConversationListItem {
  id: string;
  title: string;
  updatedAt: string;
}

// Shape of one row returned by POST /conversation/chat/:id
export interface ConversationMessageItem {
  id?: string;
  messageid?: number | string;
  inputMessage: string | null;
  outputMessage: string | null;
  usedToolCalls?: unknown;
  thumbsFeedback?: unknown;
  messageCount?: number;
  llmModel?: string;
  inputTokens?: number | null;
  noCacheInputTokens?: number | null;
  cacheInputReadTokens?: number | null;
  cacheInputWriteTokens?: number | null;
  outputToken?: number | null;
  outputTextTokens?: number | null;
  outputReasoningTokens?: number | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface AiChatPreviousContextEntry {
  role: 'user' | 'assistant';
  content: string;
}

export interface CustomModelData {
  id: string;
  name?: string;
  providerId?: string;
  providerLabel?: string;
  baseURL?: string;
  isCustom?: boolean;
}

export interface AiChatRequestBody {
  message: string;
  conversationId?: string;
  prId?: string;
  prTitle?: string;
  previousContext?: AiChatPreviousContextEntry[] | null;
  llmModel?: string;
  modelName?: string;
  customModel?: boolean;
  customModelData?: CustomModelData;
}

export interface ToolCallEvent {
  toolName: string;
  toolCallId: string;
  input?: any;
}

export interface ToolResultEvent {
  toolName: string;
  toolCallId: string;
  output?: any;
}

interface AiChatStreamHandlers {
  onConversationId?: (id: string) => void;
  onContent?: (chunk: string) => void;
  onToolCall?: (event: ToolCallEvent) => void;
  onToolResult?: (event: ToolResultEvent) => void;
  signal?: AbortSignal;
}

const extractErrorDetail = async (response: Response): Promise<string> => {
  const body: unknown = await response.json().catch(() => null);
  if (body && typeof body === 'object') {
    const obj = body as Record<string, unknown>;
    if (typeof obj.message === 'string' && obj.message) return obj.message;
    if (typeof obj.error === 'string' && obj.error) return obj.error;
  }
  return `Request failed with status ${response.status}`;
};

// GET /conversation — cursor paginated list of recent conversations
export async function fetchRecentConversations(
  lastUpdatedAt?: string,
  signal?: AbortSignal
): Promise<ConversationListItem[]> {
  const url = new URL(`${API_BASE_URL}/conversation`);
  if (lastUpdatedAt) url.searchParams.set('lastUpdatedAt', lastUpdatedAt);

  let response: Response;

  try {
    response = await fetch(url.toString(), {
      method: 'GET',
      credentials: 'include',
      signal,
    });
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') throw err;
    throw new Error('Could not reach the server. Is the backend running?');
  }

  // The backend answers 204 when the user has no conversations yet
  if (response.status === 204) return [];

  if (!response.ok) {
    throw new Error(await extractErrorDetail(response));
  }

  const body: unknown = await response.json().catch(() => null);

  if (!Array.isArray(body)) {
    throw new Error('Unexpected response format from conversations endpoint.');
  }

  return body as ConversationListItem[];
}

// POST /conversation/chat/:id — saved messages for a conversation
export async function fetchConversationMessages(
  conversationId: string,
  updatedAt?: string,
  signal?: AbortSignal
): Promise<ConversationMessageItem[]> {
  let response: Response;

  try {
    response = await fetch(
      `${API_BASE_URL}/conversation/chat/${encodeURIComponent(conversationId)}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(updatedAt ? { updatedAt } : {}),
        signal,
      }
    );
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') throw err;
    throw new Error('Could not reach the server. Is the backend running?');
  }

  // The backend answers 204 when the conversation has no messages yet
  if (response.status === 204) return [];

  if (!response.ok) {
    throw new Error(await extractErrorDetail(response));
  }

  const body: unknown = await response.json().catch(() => null);

  if (!Array.isArray(body)) {
    throw new Error('Unexpected response format from conversation history endpoint.');
  }

  return body as ConversationMessageItem[];
}

// POST /conversation/chat — consumes the NDJSON stream:
// an optional first line {"conversationId": "..."} followed by
// {"type": "content", "content": "..."} chunks until the stream closes.
export async function streamAiChat(
  payload: AiChatRequestBody,
  handlers: AiChatStreamHandlers
): Promise<void> {
  let response: Response;

  try {
    response = await fetch(`${API_BASE_URL}/conversation/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(payload),
      signal: handlers.signal,
    });
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') throw err;
    throw new Error('Could not reach the server. Is the backend running?');
  }

  if (!response.ok) {
    throw new Error(await extractErrorDetail(response));
  }

  if (!response.body) {
    throw new Error('Streaming is not supported in this browser.');
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  const handleLine = (line: string) => {
    const trimmed = line.trim();
    if (!trimmed) return;

    let event: unknown;
    try {
      event = JSON.parse(trimmed);
    } catch {
      return;
    }

    if (!event || typeof event !== 'object') return;
    const obj = event as Record<string, unknown>;

    if (typeof obj.conversationId === 'string' && obj.conversationId) {
      handlers.onConversationId?.(obj.conversationId);
    }
    if (obj.type === 'tool-call') {
      handlers.onToolCall?.({
        toolName: String(obj.toolName || ''),
        toolCallId: String(obj.toolCallId || ''),
        input: obj.input,
      });
    }
    if (obj.type === 'tool-result') {
      handlers.onToolResult?.({
        toolName: String(obj.toolName || ''),
        toolCallId: String(obj.toolCallId || ''),
        output: obj.output,
      });
    }
    if (obj.type === 'content' && typeof obj.content === 'string') {
      handlers.onContent?.(obj.content);
    }
  };

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';
      lines.forEach(handleLine);
    }
    buffer += decoder.decode();
    if (buffer) handleLine(buffer);
  } finally {
    reader.releaseLock();
  }
}

export type ThumbsFeedback = 'postive' | 'negitive' | null;

export interface MessageFeedbackPayload {
  messageId: string;
  userFeedback?: ThumbsFeedback;
  regeneratedMsg?: boolean;
}

// PATCH /conversation/feedback — submit thumbs feedback or regenerated flag
export async function submitMessageFeedback(
  payload: MessageFeedbackPayload,
  signal?: AbortSignal
): Promise<{ message: string }> {
  let response: Response;

  try {
    response = await fetch(`${API_BASE_URL}/conversation/feedback`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(payload),
      signal,
    });
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') throw err;
    throw new Error('Could not reach the server. Is the backend running?');
  }

  if (!response.ok) {
    throw new Error(await extractErrorDetail(response));
  }

  return (await response.json().catch(() => ({ message: 'updated' }))) as { message: string };
}
