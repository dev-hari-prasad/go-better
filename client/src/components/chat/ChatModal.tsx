import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  XMarkIcon, 
  ArrowsPointingOutIcon,
  MinusIcon,
  LightBulbIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline';
import { Bot, ArrowUp, ChevronDown, GitPullRequest, History, Plus } from 'lucide-react';
import { GobeAiLogo } from '../ui/GobeAiLogo';
import { AIChatMessage } from './AIChatMessage';
import { useAiChat } from '../../hooks/useAiChat';
import { ConversationListItem } from '../../services/aiChatApi';
import { PullRequest } from '../../types/codeReview';
import { PullRequestSummary } from '../../services/pullRequestApi';
import { PrSummaryDropdown } from '../ui/PrSummaryDropdown';
import { ModelPickerButton } from './ModelPickerButton';
import { useModelPicker } from '../../hooks/useModelPicker';
import { getChatGreeting } from '../../utils/greetings';
import { ChatBottomLightBeam } from './ChatBottomLightBeam';

interface ChatModalProps {
  isOpen: boolean;
  pullRequests?: PullRequest[];
  /** When provided, the modal opens bound to this existing conversation */
  initialConversation?: ConversationListItem | null;
  /** When provided, auto-attaches this PR to the chat */
  initialPr?: PullRequestSummary | null;
  onClose: () => void;
  onMaximize?: () => void;
}

export const ChatModal: React.FC<ChatModalProps> = ({
  isOpen,
  pullRequests = [],
  initialConversation = null,
  initialPr = null,
  onClose,
  onMaximize,
}) => {
  const [shouldRender, setShouldRender] = useState(isOpen);
  const [isClosing, setIsClosing] = useState(false);
  const [input, setInput] = useState('');
  const [showHistory, setShowHistory] = useState(false);
  const [selectedPr, setSelectedPr] = useState<PullRequestSummary | null>(initialPr);
  const [copiedSnippetId, setCopiedSnippetId] = useState<string | null>(null);

  const [greeting, setGreeting] = useState<string>(() => getChatGreeting());
  const [isLogoBlinking, setIsLogoBlinking] = useState(true);
  const [logoBlinkKey, setLogoBlinkKey] = useState(0);
  const logoBlinkTimerRef = useRef<NodeJS.Timeout | null>(null);

  const triggerLogoBlink = useCallback(() => {
    if (logoBlinkTimerRef.current) {
      clearTimeout(logoBlinkTimerRef.current);
    }
    setIsLogoBlinking(false);
    requestAnimationFrame(() => {
      setIsLogoBlinking(true);
      setLogoBlinkKey((k) => k + 1);
      logoBlinkTimerRef.current = setTimeout(() => {
        setIsLogoBlinking(false);
      }, 1900);
    });
  }, []);

  useEffect(() => {
    if (isOpen) {
      setIsLogoBlinking(true);
      setLogoBlinkKey((k) => k + 1);
      logoBlinkTimerRef.current = setTimeout(() => {
        setIsLogoBlinking(false);
      }, 1900);
    }
    return () => {
      if (logoBlinkTimerRef.current) clearTimeout(logoBlinkTimerRef.current);
    };
  }, [isOpen]);

  const {
    messages: chatHistory,
    isThinking,
    isLoadingMessages,
    error,
    clearError,
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
  } = useAiChat();

  const { activeModel } = useModelPicker();

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const latestUserMessageRef = useRef<HTMLDivElement>(null);
  const lastScrolledUserMsgIdRef = useRef<string | null>(null);

  // When a user message is sent, smoothly align it near the top
  useEffect(() => {
    const userMessages = chatHistory.filter((m) => m.sender === 'user');
    const latestUserMsg = userMessages[userMessages.length - 1];

    if (latestUserMsg && latestUserMsg.id !== lastScrolledUserMsgIdRef.current) {
      lastScrolledUserMsgIdRef.current = latestUserMsg.id;
      const timer = setTimeout(() => {
        if (scrollContainerRef.current && latestUserMessageRef.current) {
          const container = scrollContainerRef.current;
          const target = latestUserMessageRef.current;
          const containerRect = container.getBoundingClientRect();
          const targetRect = target.getBoundingClientRect();
          const relativeTop = targetRect.top - containerRect.top + container.scrollTop;

          container.scrollTo({
            top: Math.max(0, relativeTop - 16),
            behavior: 'smooth',
          });
        }
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [chatHistory]);

  // Fetch conversation history whenever the popover opens
  useEffect(() => {
    if (showHistory) {
      void loadConversations();
    }
  }, [showHistory, loadConversations]);

  // Bind to the requested conversation (or start fresh) each time the modal opens
  const wasOpenRef = useRef(false);
  useEffect(() => {
    if (isOpen && !wasOpenRef.current) {
      if (initialConversation) {
        selectConversation(initialConversation);
      } else {
        resetChat();
      }
      if (initialPr) {
        setSelectedPr(initialPr);
      }
    }
    wasOpenRef.current = isOpen;
  }, [isOpen, initialConversation, initialPr, selectConversation, resetChat]);

  // Also listen for runtime open-gobe-chat events
  useEffect(() => {
    const handleOpenGobeChat = (e: Event) => {
      const customEvent = e as CustomEvent<{
        pr?: PullRequestSummary;
        prId?: string | number;
        prTitle?: string;
      }>;
      const pr = customEvent.detail?.pr || (customEvent.detail?.prId ? {
        id: String(customEvent.detail.prId),
        prId: customEvent.detail.prId,
        title: customEvent.detail.prTitle || `PR #${customEvent.detail.prId}`,
      } : null);
      if (pr) {
        setSelectedPr(pr);
      }
    };
    window.addEventListener('open-gobe-chat', handleOpenGobeChat);
    return () => window.removeEventListener('open-gobe-chat', handleOpenGobeChat);
  }, []);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
    }, 200);
  };

  const handleMaximize = () => {
    if (activeConversation) {
      window.dispatchEvent(
        new CustomEvent('select-ai-chat-conversation', { detail: { conversation: activeConversation } })
      );
    }
    if (input.trim() || selectedPr) {
      const payload = {
        message: input,
        prId: selectedPr ? String(selectedPr.prId || selectedPr.id) : undefined,
        prTitle: selectedPr?.title,
      };
      sessionStorage.setItem('gobe-pending-chat', JSON.stringify(payload));
      window.dispatchEvent(new CustomEvent('start-ai-chat', { detail: payload }));
    }

    setIsClosing(true);
    setTimeout(() => {
      onMaximize?.();
    }, 150);
  };

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleCopySnippet = (id: string, code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedSnippetId(id);
    setTimeout(() => setCopiedSnippetId(null), 2000);
  };

  const handleSendMessage = async () => {
    if (!input.trim()) return;

    const queryText = input;
    setInput('');

    const customModelData = activeModel ? {
      id: activeModel.id,
      name: activeModel.name,
      providerId: activeModel.providerId,
      providerLabel: activeModel.providerLabel,
      baseURL: activeModel.baseURL,
      isCustom: Boolean(activeModel.isCustom || activeModel.providerId === 'custom'),
    } : undefined;

    await sendMessage({
      text: queryText,
      llmModel: activeModel?.id,
      modelName: activeModel?.name,
      customModel: Boolean(activeModel?.isCustom || activeModel?.providerId === 'custom'),
      customModelData,
      ...(selectedPr ? { prId: String(selectedPr.prId || selectedPr.id), prTitle: selectedPr.title } : {}),
    });
  };

  useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
      setIsClosing(false);
    } else if (shouldRender) {
      setIsClosing(true);
      const timer = setTimeout(() => {
        setShouldRender(false);
        setIsClosing(false);
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [isOpen, shouldRender]);

  useEffect(() => {
    const handleFocus = () => {
      textareaRef.current?.focus();
    };
    window.addEventListener('focus-chat-input', handleFocus);
    return () => window.removeEventListener('focus-chat-input', handleFocus);
  }, []);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.max(44, Math.min(textareaRef.current.scrollHeight, 160))}px`;
    }
  }, [input]);

  if (!shouldRender) return null;

  return (
    <div 
      className={`fixed inset-0 z-50 flex items-start justify-end p-4 pt-16 transition-opacity duration-200 ${
        isClosing ? 'opacity-0' : 'opacity-100'
      }`} 
      onClick={onClose}
    >
      <div 
        data-gobe-chat-modal="true"
        className={`relative flex flex-col bg-[#0d1117] border border-[#232530] rounded-2xl shadow-2xl w-full max-w-[440px] h-[calc(100vh-5rem)] overflow-hidden ${
          isClosing ? 'animate-apple-scale-out' : 'animate-apple-scale'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-transparent shrink-0 relative z-20">
          <div className="flex items-center gap-4 text-zinc-500">
            <button 
              onClick={resetChat} 
              className="hover:text-zinc-200 transition-colors flex items-center justify-center h-5 w-5 cursor-pointer" 
              title="New Chat"
            >
              <Plus className="w-4 h-4" />
            </button>
            <div className="relative flex items-center">
              <button 
                onClick={() => setShowHistory(!showHistory)} 
                className="hover:text-zinc-200 transition-colors flex items-center justify-center h-5 w-5 cursor-pointer" 
                title="Recent Chats"
              >
                <History className="w-4 h-4" />
              </button>
              {showHistory && (
                <div className="absolute top-full left-0 mt-2 w-64 bg-[#161b22] border border-[#30363d] rounded-xl shadow-xl p-1.5 z-50 animate-apple-fade">
                  <div className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider px-2 py-1 mb-1">Recent Chats</div>
                  {isLoadingConversations ? (
                    <div className="px-2 py-1.5 text-xs text-zinc-500">Loading…</div>
                  ) : conversations.length === 0 ? (
                    <div className="px-2 py-1.5 text-xs text-zinc-500">No previous chats yet</div>
                  ) : (
                    <>
                      <div className="max-h-64 overflow-y-auto space-y-0.5">
                        {conversations.map((conversation) => (
                          <button
                            key={conversation.id}
                            onClick={() => {
                              selectConversation(conversation);
                              setShowHistory(false);
                            }}
                            className={`w-full text-left px-2 py-1.5 text-xs rounded-lg transition-colors truncate cursor-pointer ${
                              activeConversation?.id === conversation.id
                                ? 'text-[#c0f200] bg-[#c0f200]/10'
                                : 'text-zinc-300 hover:bg-[#21262d]'
                            }`}
                          >
                            {conversation.title}
                          </button>
                        ))}
                      </div>
                      {hasMoreConversations && (
                        <button
                          onClick={() => void loadMoreConversations()}
                          disabled={isLoadingMoreConversations}
                          className="w-full mt-1 pt-1.5 border-t border-[#30363d] px-2 py-1.5 text-[11px] text-zinc-500 hover:text-zinc-300 disabled:opacity-50 transition-colors cursor-pointer"
                        >
                          {isLoadingMoreConversations ? 'Loading…' : 'Load older chats'}
                        </button>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
          
          <div className="text-xs font-semibold text-zinc-300 select-none truncate max-w-[40%]">
            {activeConversation?.title || 'New Chat'}
          </div>
          
          <div className="flex items-center gap-4 text-zinc-500">
            <button onClick={handleMaximize} className="hover:text-zinc-200 transition-colors cursor-pointer" title="Expand Chat">
              <ArrowsPointingOutIcon className="w-4 h-4" />
            </button>
            <button onClick={handleClose} className="hover:text-zinc-200 transition-colors cursor-pointer" title="Minimize">
              <MinusIcon className="w-4 h-4" />
            </button>
            <button onClick={handleClose} className="hover:text-zinc-200 transition-colors cursor-pointer" title="Close">
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Chat Body */}
        <div ref={scrollContainerRef} className="flex-1 overflow-y-auto p-4 px-6 flex flex-col">
          {isLoadingMessages ? (
            <div className="flex-1 flex items-center justify-center text-xs text-zinc-500 gap-2">
              <span className="w-3.5 h-3.5 border-2 border-zinc-600 border-t-[#c0f200] rounded-full animate-spin" />
              Loading chat…
            </div>
          ) : chatHistory.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-4">
              {/* Greeting & Logo: Horizontal single-line with Instrument Serif, refreshable & blinking */}
              <button
                type="button"
                onClick={() => {
                  setGreeting(getChatGreeting());
                  triggerLogoBlink();
                }}
                className="mb-8 flex items-center justify-center gap-3 cursor-pointer group select-none transition-transform active:scale-[0.98]"
              >
                <div
                  key={logoBlinkKey}
                  className={`inline-flex items-center justify-center shrink-0 pointer-events-none group-hover:scale-105 transition-transform ${
                    isLogoBlinking ? 'animate-gobe-blink' : ''
                  }`}
                >
                  <GobeAiLogo className="w-8 h-8 sm:w-9 sm:h-9 overflow-visible" />
                </div>
                <h1 className="font-instrument font-normal text-2xl sm:text-[26px] tracking-tight leading-none text-zinc-100 group-hover:text-white transition-colors">
                  {greeting}
                </h1>
              </button>

              {/* Suggestion Prompts (subheading removed as requested) */}
              <div className="flex flex-col gap-2 w-full max-w-[320px]">
                <button
                  onClick={() => setInput('Summarize my active PRs')}
                  className="flex items-center gap-2.5 px-3.5 py-2.5 bg-[#16171d] hover:bg-[#1a1b22] border border-[#232530] hover:border-zinc-500 rounded-xl text-xs text-zinc-300 transition-colors text-left cursor-pointer"
                >
                  <GitPullRequest className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                  <span className="truncate">Summarize my active PRs</span>
                </button>
                <button
                  onClick={() => setInput('Check for security vulnerabilities')}
                  className="flex items-center gap-2.5 px-3.5 py-2.5 bg-[#16171d] hover:bg-[#1a1b22] border border-[#232530] hover:border-zinc-500 rounded-xl text-xs text-zinc-300 transition-colors text-left cursor-pointer"
                >
                  <ShieldCheckIcon className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                  <span className="truncate">Check for security vulnerabilities</span>
                </button>
                <button
                  onClick={() => setInput('Generate unit tests for this pull request')}
                  className="flex items-center gap-2.5 px-3.5 py-2.5 bg-[#16171d] hover:bg-[#1a1b22] border border-[#232530] hover:border-zinc-500 rounded-xl text-xs text-zinc-300 transition-colors text-left cursor-pointer"
                >
                  <LightBulbIcon className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                  <span className="truncate">Generate unit tests for this pull request</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3.5 w-full pb-[40vh]">
              {chatHistory.map((msg, index) => {
                const isLatestUserMessage =
                  msg.sender === 'user' && index >= chatHistory.length - 2;
                const isLatestAiMessage =
                  msg.sender === 'ai' && (
                    index === chatHistory.length - 1 || 
                    !chatHistory.slice(index + 1).some((m) => m.sender === 'ai')
                  );

                return (
                  <div 
                    key={msg.id}
                    ref={isLatestUserMessage ? latestUserMessageRef : undefined}
                  >
                    {msg.sender === 'user' ? (
                      <div className="flex items-start gap-3 flex-row-reverse">
                        <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-amber-500 to-rose-500 flex items-center justify-center text-[10px] font-bold text-black shrink-0">
                          AM
                        </div>
                        <div className="space-y-1.5 max-w-[85%] text-right">
                          {msg.prContext && (
                            <div className="flex items-center justify-end">
                              <span className="px-1.5 py-0.5 bg-[#1a1b22] border border-[#232530] rounded text-[9px] font-mono text-zinc-500">
                                {msg.prContext}
                              </span>
                            </div>
                          )}
                          <div className="text-[14px] leading-relaxed whitespace-pre-wrap px-3.5 py-2 bg-[#21262d] text-zinc-200 rounded-2xl font-medium shadow-sm inline-block text-left">
                            {msg.text}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <AIChatMessage 
                        message={msg} 
                        onCopySnippet={handleCopySnippet} 
                        copiedCodeId={copiedSnippetId}
                        onFollowUpClick={(text) => setInput(text)}
                        onFeedback={sendFeedback}
                        isLatest={isLatestAiMessage}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="p-4 pt-0 shrink-0">
          {error && (
            <div className="mb-2 px-3 py-2 bg-red-500/10 border border-red-500/30 rounded-lg text-[11px] text-red-300 flex items-center justify-between gap-2">
              <span className="truncate">{error}</span>
              <button onClick={clearError} className="shrink-0 hover:text-red-200 cursor-pointer" title="Dismiss">
                <XMarkIcon className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
          <div className="w-full bg-[#161b22] border border-[#30363d] rounded-[24px] p-3 flex flex-col transition-all relative min-h-[96px] sm:min-h-[104px]">
            {/* Chromatic Rim & Moving Aurora (Stationary / toned down, only visible before messages exist) */}
            <ChatBottomLightBeam active={chatHistory.length === 0} showBump={chatHistory.length === 0} />

            {/* Textarea on top: more height permanently */}
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              rows={2}
              placeholder="Ask anything..."
              className="w-full flex-1 bg-transparent text-zinc-200 placeholder:text-zinc-500 resize-none outline-none text-[13px] sm:text-[14px] font-sans px-1.5 pt-0.5 pb-1 leading-relaxed overflow-x-hidden overflow-y-auto min-h-[44px] max-h-[160px] relative z-10"
            />

            {/* Bottom Toolbar Row: Pinned to bottom of the card */}
            <div className="flex items-center justify-between px-0.5 pt-1.5 border-t border-transparent relative z-10">
              {/* Left: PR Context Selection */}
              <div className="relative">
                <PrSummaryDropdown
                  selectedPr={selectedPr}
                  onSelectPr={setSelectedPr}
                  buttonSize="sm"
                  fallbackList={pullRequests.map((pr) => ({
                    id: pr.id,
                    prId: pr.number,
                    title: pr.title,
                    createdAt: pr.createdAt,
                  }))}
                />
              </div>

              {/* Right: Model Picker (No Ctrl /) & Send */}
              <div className="flex items-center gap-1.5 shrink-0">
                <ModelPickerButton size="sm" placement="top" align="right" showShortcutBadge={false} />
                <button
                  onClick={handleSendMessage}
                  className={`w-7 h-7 rounded-full flex items-center justify-center transition-all shrink-0 shadow-sm border cursor-pointer ${
                    input.trim()
                      ? 'bg-[#c0f200] text-black border-[#c0f200] hover:brightness-110'
                      : 'bg-[#21262d] hover:bg-[#30363d] text-zinc-400 border-transparent'
                  }`}
                  title="Send message"
                >
                  <ArrowUp className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
