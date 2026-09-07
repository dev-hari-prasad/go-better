import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import {
  ShieldCheckIcon,
  LightBulbIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { ArrowUp, Bot, ChevronDown, GitPullRequest, Plus, PanelLeft } from 'lucide-react';
import { GobeAiLogo } from '../ui/GobeAiLogo';
import { PullRequest, Repository } from '../../types/codeReview';
import { AIChatMessage } from './AIChatMessage';
import { useAiChat } from '../../hooks/useAiChat';
import { PrSummaryDropdown } from '../ui/PrSummaryDropdown';
import { PullRequestSummary } from '../../services/pullRequestApi';
import { ChatHistorySidebar } from './ChatHistorySidebar';
import { ModelPickerButton } from './ModelPickerButton';
import { useModelPicker } from '../../hooks/useModelPicker';
import { getChatGreeting } from '../../utils/greetings';
import { ChatBottomLightBeam } from './ChatBottomLightBeam';

interface AIChatViewProps {
  pullRequests: PullRequest[];
  repositories: Repository[];
  onSelectPR?: (pr: PullRequest) => void;
}

const PENDING_CHAT_STORAGE_KEY = 'gobe-pending-chat';
const SIDEBAR_STORAGE_KEY = 'gobe-ai-sidebar-open';

export const AIChatView: React.FC<AIChatViewProps> = ({
  pullRequests,
}) => {
  const [inputText, setInputText] = useState<string>('');
  const [copiedCodeId, setCopiedCodeId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(() => {
    try {
      return localStorage.getItem(SIDEBAR_STORAGE_KEY) !== 'false';
    } catch {
      return true;
    }
  });
  const [selectedPr, setSelectedPr] = useState<PullRequestSummary | null>(null);
  // True only when the user just picked a PR from the dropdown (explicit attach).
  // A leftover selection from a previous message is not explicit.
  const [prExplicitlySelected, setPrExplicitlySelected] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem(SIDEBAR_STORAGE_KEY, String(isSidebarOpen));
    } catch {
      // Ignore
    }
  }, [isSidebarOpen]);

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

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const latestUserMessageRef = useRef<HTMLDivElement>(null);
  const lastScrolledUserMsgIdRef = useRef<string | null>(null);

  useEffect(() => {
    const handleFocus = () => {
      textareaRef.current?.focus();
    };
    window.addEventListener('focus-chat-input', handleFocus);
    return () => window.removeEventListener('focus-chat-input', handleFocus);
  }, []);

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
    // Automatically turn off initial mount blink after animation completes
    logoBlinkTimerRef.current = setTimeout(() => {
      setIsLogoBlinking(false);
    }, 1900);
    return () => {
      if (logoBlinkTimerRef.current) clearTimeout(logoBlinkTimerRef.current);
    };
  }, []);

  const [isMultiLine, setIsMultiLine] = useState(false);

  useEffect(() => {
    if (chatHistory.length === 0) {
      setIsMultiLine(true);
      return;
    }
    if (!inputText) {
      setIsMultiLine(false);
      return;
    }
    if (inputText.includes('\n')) {
      setIsMultiLine(true);
      return;
    }
    if (textareaRef.current) {
      setIsMultiLine(textareaRef.current.scrollHeight > 38);
    }
  }, [inputText, chatHistory.length]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      if (chatHistory.length === 0) {
        textareaRef.current.style.height = `${Math.max(52, Math.min(textareaRef.current.scrollHeight, 220))}px`;
      } else if (isMultiLine) {
        textareaRef.current.style.height = `${Math.max(48, Math.min(textareaRef.current.scrollHeight, 200))}px`;
      } else {
        textareaRef.current.style.height = '26px';
      }
    }
  }, [inputText, chatHistory.length, isMultiLine]);

  // When a user message is sent, smoothly align it near the top like ChatGPT/Claude,
  // and keep viewport fixed so the user can read downwards without auto-scrolling
  useEffect(() => {
    const userMessages = chatHistory.filter((m) => m.sender === 'user');
    const latestUserMsg = userMessages[userMessages.length - 1];

    if (latestUserMsg && latestUserMsg.id !== lastScrolledUserMsgIdRef.current) {
      lastScrolledUserMsgIdRef.current = latestUserMsg.id;
      // Anchor the latest user message to the top
      const timer = setTimeout(() => {
        if (scrollContainerRef.current && latestUserMessageRef.current) {
          const container = scrollContainerRef.current;
          const target = latestUserMessageRef.current;
          const containerRect = container.getBoundingClientRect();
          const targetRect = target.getBoundingClientRect();
          const relativeTop = targetRect.top - containerRect.top + container.scrollTop;

          container.scrollTo({
            top: Math.max(0, relativeTop - 20),
            behavior: 'smooth',
          });
        }
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [chatHistory]);

  // Pre-load conversation history when view mounts
  useEffect(() => {
    void loadConversations();
  }, [loadConversations]);

  // Consume a message forwarded from the dashboard input once this view mounts
  useEffect(() => {
    const raw = sessionStorage.getItem(PENDING_CHAT_STORAGE_KEY);
    if (!raw) return;
    sessionStorage.removeItem(PENDING_CHAT_STORAGE_KEY);
    let message: string | undefined;
    let prContext: string | undefined | null;
    let prId: string | undefined;
    let prTitle: string | undefined;
    try {
      const parsed = JSON.parse(raw) as {
        message?: string;
        prContext?: string | null;
        prId?: string;
        prTitle?: string;
      };
      message = parsed.message;
      prContext = parsed.prContext;
      prId = parsed.prId;
      prTitle = parsed.prTitle;
    } catch {
      return;
    }
    if (message?.trim()) {
      void sendMessage({
        text: message,
        prContext: prContext || prTitle,
        prId,
        prTitle,
        prExplicitlyAttached: true,
      });
    }
  }, [sendMessage]);

  useEffect(() => {
    const handleNewChat = () => {
      resetChat();
      setSelectedPr(null);
      setPrExplicitlySelected(false);
    };

    const handleStartChat = (e: any) => {
      const { message, prContext, prId, prTitle, llmModel, modelName, customModel, customModelData } = ((e as CustomEvent).detail ?? {}) as {
        message?: string;
        prContext?: string;
        prId?: string;
        prTitle?: string;
        llmModel?: string;
        modelName?: string;
        customModel?: boolean;
        customModelData?: any;
      };
      if (!message || !message.trim()) return;
      sessionStorage.removeItem(PENDING_CHAT_STORAGE_KEY);

      const resolvedCustomModelData = customModelData || (activeModel ? {
        id: activeModel.id,
        name: activeModel.name,
        providerId: activeModel.providerId,
        providerLabel: activeModel.providerLabel,
        baseURL: activeModel.baseURL,
        isCustom: Boolean(activeModel.isCustom || activeModel.providerId === 'custom'),
      } : undefined);

      void sendMessage({
        text: message,
        llmModel: llmModel || activeModel?.id,
        modelName: modelName || activeModel?.name,
        customModel: customModel ?? Boolean(activeModel?.isCustom || activeModel?.providerId === 'custom'),
        customModelData: resolvedCustomModelData,
        prContext: prContext || prTitle,
        prId,
        prTitle,
        prExplicitlyAttached: true,
      });
    };

    // Fired by the header Quick Chat dropdown while this view is active
    const handleSelectConversation = (e: Event) => {
      const { conversation } = (e as CustomEvent).detail ?? {};
      if (conversation) {
        selectConversation(conversation);
        setSelectedPr(null);
        setPrExplicitlySelected(false);
      }
    };

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
        setPrExplicitlySelected(true);
      }
    };

    window.addEventListener('new-ai-chat', handleNewChat);
    window.addEventListener('start-ai-chat', handleStartChat);
    window.addEventListener('open-gobe-chat', handleOpenGobeChat);
    window.addEventListener('select-ai-chat-conversation', handleSelectConversation);
    return () => {
      window.removeEventListener('new-ai-chat', handleNewChat);
      window.removeEventListener('start-ai-chat', handleStartChat);
      window.removeEventListener('open-gobe-chat', handleOpenGobeChat);
      window.removeEventListener('select-ai-chat-conversation', handleSelectConversation);
    };
  }, [resetChat, sendMessage, selectConversation]);

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim()) return;

    const queryText = inputText;
    setInputText('');

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
      ...(selectedPr
        ? { prId: String(selectedPr.prId || selectedPr.id), prTitle: selectedPr.title, prExplicitlyAttached: prExplicitlySelected }
        : {}),
    });
    // The sticky selection no longer counts as explicit after one send;
    // re-picking the PR from the dropdown makes it explicit again
    setPrExplicitlySelected(false);
  };

  const handleCopySnippet = (id: string, code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCodeId(id);
    setTimeout(() => setCopiedCodeId(null), 2000);
  };

  const hasSentFirstMessage = chatHistory.some((m) => m.sender === 'user');

  return (
    <div className="flex h-full bg-[#0d1117] overflow-hidden relative animate-apple-fade">
      {/* Sliding Disconnected History Sidebar */}
      <ChatHistorySidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        conversations={conversations}
        activeConversation={activeConversation}
        onSelectConversation={(conversation) => {
          selectConversation(conversation);
          setSelectedPr(null);
          setPrExplicitlySelected(false);
        }}
        onNewChat={() => {
          resetChat();
          setSelectedPr(null);
          setPrExplicitlySelected(false);
          setGreeting(getChatGreeting());
        }}
        onRefresh={() => void loadConversations(true)}
        isLoading={isLoadingConversations}
        isLoadingMore={isLoadingMoreConversations}
        hasMore={hasMoreConversations}
        onLoadMore={() => void loadMoreConversations()}
      />

      {/* Main Center AI Chat Area */}
      <div className="flex-1 flex flex-col h-full bg-[#0d1117] overflow-hidden min-w-0 transition-all duration-300">
        {/* Header Bar */}
        <div className="px-4 py-1.5 bg-[#111216] border-b border-[#232530] flex items-center justify-between shrink-0 font-sans relative min-h-[38px]">
          
          {/* Action Buttons (Left Side: Sidebar Toggle + New Chat) */}
          <div className="flex items-center gap-1.5 w-1/3">
            <button
              onClick={() => setIsSidebarOpen((prev) => !prev)}
              className={`w-7 h-7 border rounded-[8px] transition-all cursor-pointer flex items-center justify-center shrink-0 ${
                isSidebarOpen
                  ? 'bg-[#1e222d] border-[#383b48] text-[#c0f200]'
                  : 'bg-[#16171d] hover:bg-[#21262d] border-[#232530] hover:border-zinc-500 text-zinc-300 hover:text-white'
              }`}
              title={isSidebarOpen ? 'Close sidebar' : 'Open history sidebar'}
            >
              <PanelLeft className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={() => {
                resetChat();
                setSelectedPr(null);
                setPrExplicitlySelected(false);
                setGreeting(getChatGreeting());
              }}
              className="h-7 flex items-center gap-1.5 px-2.5 bg-[#16171d] hover:bg-[#21262d] border border-[#232530] hover:border-[#c0f200]/40 text-[#c0f200] rounded-[8px] text-xs font-medium transition-all cursor-pointer group shrink-0"
              title="Start a new chat"
            >
              <Plus className="w-3.5 h-3.5 text-[#c0f200] group-hover:rotate-90 transition-transform duration-200" />
              <span>New chat</span>
            </button>
          </div>

          {/* Title (Center) */}
          <div className="flex items-center justify-center w-1/3 min-w-0">
            <h1 className="text-xs sm:text-sm font-semibold text-zinc-300 truncate">
              {activeConversation?.title || 'New Session'}
            </h1>
          </div>
          
          {/* Model Select (Right Side) */}
          <div className="w-1/3 flex justify-end">
            <ModelPickerButton size="md" placement="bottom" align="right" enableShortcut={false} showShortcutBadge={false} />
          </div>
        </div>

        {/* Message Stream or Empty State */}
        <div ref={scrollContainerRef} className="flex-1 overflow-y-auto p-4 flex flex-col items-center w-full">
          {isLoadingMessages ? (
            <div className="flex-1 flex items-center justify-center text-xs text-zinc-500 gap-2">
              <span className="w-3.5 h-3.5 border-2 border-zinc-600 border-t-[#c0f200] rounded-full animate-spin" />
              Loading chat…
            </div>
          ) : chatHistory.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center p-4 w-full max-w-3xl my-auto animate-apple-fade -translate-y-14 sm:-translate-y-16">
              {/* Center Greeting & Logo (Single line with Instrument Serif, no tooltip, larger gap) */}
              <button
                type="button"
                onClick={() => {
                  setGreeting(getChatGreeting());
                  triggerLogoBlink();
                }}
                className="mb-8 sm:mb-10 flex items-center justify-center gap-3.5 cursor-pointer group select-none transition-transform active:scale-[0.98]"
              >
                <div
                  key={logoBlinkKey}
                  className={`inline-flex items-center justify-center shrink-0 pointer-events-none group-hover:scale-105 transition-transform ${
                    isLogoBlinking ? 'animate-gobe-blink' : ''
                  }`}
                >
                  <GobeAiLogo className="w-10 h-10 sm:w-11 sm:h-11 md:w-[46px] md:h-[46px] overflow-visible" />
                </div>
                <h1 className="font-instrument font-normal text-2xl sm:text-3xl md:text-[35px] tracking-tight leading-none text-zinc-100 group-hover:text-white transition-colors">
                  {greeting}
                </h1>
              </button>

              {/* Error banner if present */}
              {error && (
                <div className="w-full max-w-[760px] mx-auto mb-3 px-3 py-2 bg-red-500/10 border border-red-500/30 rounded-lg text-[11px] text-red-300 flex items-center justify-between gap-2">
                  <span className="truncate">{error}</span>
                  <button onClick={clearError} className="shrink-0 hover:text-red-200 cursor-pointer" title="Dismiss">
                    <XMarkIcon className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* Centered Chat Bar strictly inside with clean border */}
              <div
                className="w-full max-w-[760px] mx-auto bg-[#161b22] border border-[#30363d] rounded-[24px] p-3 flex flex-col transition-all relative min-h-[110px] sm:min-h-[116px]"
              >
                {/* Chromatic Rim & Moving Aurora (Strictly Inside) */}
                <ChatBottomLightBeam active={true} />

                {/* Textarea on top */}
                <textarea
                  ref={textareaRef}
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  rows={2}
                  placeholder="How can I help you today?"
                  className="w-full flex-1 bg-transparent text-zinc-200 placeholder:text-zinc-500 resize-none outline-none text-[14px] sm:text-[15px] font-sans px-2 pt-1 pb-1 leading-relaxed overflow-x-hidden overflow-y-auto min-h-[52px] max-h-[220px] relative z-10"
                />

                {/* Bottom Toolbar Row: Pinned to bottom of the card */}
                <div className="flex items-center justify-between px-1 pt-1.5 border-t border-transparent relative z-10">
                  {/* Left: PR Context Selection */}
                  <div className="relative">
                    <PrSummaryDropdown
                      selectedPr={selectedPr}
                      onSelectPr={(pr) => {
                        setSelectedPr(pr);
                        setPrExplicitlySelected(Boolean(pr));
                      }}
                      buttonSize="sm"
                      fallbackList={pullRequests.map((pr) => ({
                        id: pr.id,
                        prId: pr.number,
                        title: pr.title,
                        createdAt: pr.createdAt,
                      }))}
                    />
                  </div>

                  {/* Right: Model Picker & Send */}
                  <div className="flex items-center gap-2 shrink-0">
                    <ModelPickerButton size="sm" placement="left-up" showShortcutBadge={false} />
                    <button
                      onClick={handleSendMessage}
                      className={`w-8 h-8 rounded-full flex items-center justify-center transition-all shrink-0 shadow-sm border cursor-pointer ${
                        inputText.trim()
                          ? 'bg-[#c0f200] text-black border-[#c0f200] hover:brightness-110'
                          : 'bg-[#21262d] hover:bg-[#30363d] text-zinc-400 border-transparent'
                      }`}
                      title="Send message"
                    >
                      <ArrowUp className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Suggestion Prompts below the centered box */}
              <div className="flex flex-row items-center justify-center gap-2.5 w-full max-w-[760px] mx-auto mt-4 flex-wrap">
                <button
                  onClick={() => setInputText('Summarize my active PRs')}
                  className="flex items-center justify-center gap-2 px-3.5 py-2 bg-[#16171d] hover:bg-[#1a1b22] border border-[#232530] hover:border-zinc-500 rounded-xl text-xs text-zinc-300 transition-colors cursor-pointer whitespace-nowrap"
                >
                  <GitPullRequest className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                  <span>Summarize my active PRs</span>
                </button>
                <button
                  onClick={() => setInputText('Check for security vulnerabilities')}
                  className="flex items-center justify-center gap-2 px-3.5 py-2 bg-[#16171d] hover:bg-[#1a1b22] border border-[#232530] hover:border-zinc-500 rounded-xl text-xs text-zinc-300 transition-colors cursor-pointer whitespace-nowrap"
                >
                  <ShieldCheckIcon className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                  <span>Check for security vulnerabilities</span>
                </button>
                <button
                  onClick={() => setInputText('Generate unit tests for this pull request')}
                  className="flex items-center justify-center gap-2 px-3.5 py-2 bg-[#16171d] hover:bg-[#1a1b22] border border-[#232530] hover:border-zinc-500 rounded-xl text-xs text-zinc-300 transition-colors cursor-pointer whitespace-nowrap"
                >
                  <LightBulbIcon className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                  <span>Generate unit tests for this pull request</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3.5 max-w-[800px] w-full mx-auto pb-[50vh]">
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
                    className="scroll-mt-4"
                  >
                  {msg.sender === 'user' ? (
                    <div className="flex justify-end w-full">
                      <div className="space-y-1 max-w-2xl text-right">
                        {msg.prContext && (
                          <div className="flex items-center justify-end">
                            <span className="px-1.5 py-0.5 bg-[#1a1b22] border border-[#232530] rounded text-[9px] font-mono text-zinc-500">
                              {msg.prContext}
                            </span>
                          </div>
                        )}
                        <div className="text-[15px] leading-relaxed whitespace-pre-wrap px-4 py-2 bg-[#21262d] text-zinc-200 rounded-2xl font-medium shadow-sm inline-block text-left">
                          {msg.text}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <AIChatMessage 
                      message={msg} 
                      onCopySnippet={handleCopySnippet} 
                      copiedCodeId={copiedCodeId}
                      onFollowUpClick={(text) => setInputText(text)}
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

        {/* Input Bar Footer (Rendered once messages exist, docked at bottom) */}
        {chatHistory.length > 0 && (
          <div className="p-4 shrink-0 font-sans">
            {error && (
              <div className="w-full max-w-[800px] mx-auto mb-3 px-3 py-2 bg-red-500/10 border border-red-500/30 rounded-lg text-[11px] text-red-300 flex items-center justify-between gap-2">
                <span className="truncate">{error}</span>
                <button onClick={clearError} className="shrink-0 hover:text-red-200 cursor-pointer" title="Dismiss">
                  <XMarkIcon className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
            {!isMultiLine ? (
              /* Single Line Pill Bar (Matching media_1788721543789.png) */
              <div className="w-full max-w-[800px] mx-auto bg-[#161b22] border border-[#30363d] rounded-[24px] p-1.5 flex items-center gap-2 relative">
                {/* Shiny Edges & Chromatic Rim (Stationary, No Moving Glow) */}
                <ChatBottomLightBeam active={true} showBump={false} />

                {/* Select PR Dropdown (Summary + Search) on Left */}
                <div className="relative shrink-0 z-10">
                  <PrSummaryDropdown
                    selectedPr={selectedPr}
                    onSelectPr={(pr) => {
                      setSelectedPr(pr);
                      setPrExplicitlySelected(Boolean(pr));
                    }}
                    buttonSize="sm"
                    fallbackList={pullRequests.map((pr) => ({
                      id: pr.id,
                      prId: pr.number,
                      title: pr.title,
                      createdAt: pr.createdAt,
                    }))}
                  />
                </div>

                {/* Single line textarea */}
                <textarea
                  ref={textareaRef}
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  rows={1}
                  placeholder="Ask anything..."
                  className="flex-1 bg-transparent text-zinc-200 placeholder:text-zinc-500 resize-none outline-none text-[14px] font-sans py-1 leading-normal overflow-hidden relative z-10"
                  style={{ height: '26px' }}
                />

                <div className="flex items-center gap-1.5 shrink-0 relative z-10">
                  <ModelPickerButton size="sm" placement="top" align="right" showShortcutBadge={false} />
                  <button 
                    onClick={handleSendMessage}
                    className={`w-7 h-7 rounded-full flex items-center justify-center transition-colors shrink-0 shadow-sm border cursor-pointer ${
                      inputText.trim()
                        ? 'bg-[#c0f200] text-black border-[#c0f200]'
                        : 'bg-[#21262d] hover:bg-[#30363d] text-zinc-400 border-transparent'
                    }`}
                    title="Send message"
                  >
                    <ArrowUp className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ) : (
              /* Multi-line Layout (Matching media_1788721557977.png) */
              <div className="w-full max-w-[800px] mx-auto bg-[#161b22] border border-[#30363d] rounded-[24px] p-2.5 flex flex-col relative">
                {/* Shiny Edges & Chromatic Rim (Stationary, No Moving Glow) */}
                <ChatBottomLightBeam active={true} showBump={false} />

                {/* Multi-line textarea starting at top-left */}
                <textarea
                  ref={textareaRef}
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  rows={2}
                  placeholder="Ask anything..."
                  className="w-full bg-transparent text-zinc-200 placeholder:text-zinc-500 resize-none outline-none max-h-[200px] text-[14px] font-sans px-2 pt-1 pb-1 leading-relaxed overflow-x-hidden overflow-y-auto relative z-10"
                  style={{ minHeight: '48px' }}
                />

                {/* Bottom Toolbar Row pinned to bottom of the card */}
                <div className="flex items-center justify-between px-1 pt-1.5 relative z-10">
                  <div className="relative">
                    <PrSummaryDropdown
                      selectedPr={selectedPr}
                      onSelectPr={(pr) => {
                        setSelectedPr(pr);
                        setPrExplicitlySelected(Boolean(pr));
                      }}
                      buttonSize="sm"
                      fallbackList={pullRequests.map((pr) => ({
                        id: pr.id,
                        prId: pr.number,
                        title: pr.title,
                        createdAt: pr.createdAt,
                      }))}
                    />
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <ModelPickerButton size="sm" placement="top" align="right" showShortcutBadge={false} />
                    <button 
                      onClick={handleSendMessage}
                      className={`w-7 h-7 rounded-full flex items-center justify-center transition-colors shrink-0 shadow-sm border cursor-pointer ${
                        inputText.trim()
                          ? 'bg-[#c0f200] text-black border-[#c0f200]'
                          : 'bg-[#21262d] hover:bg-[#30363d] text-zinc-400 border-transparent'
                      }`}
                      title="Send message"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
