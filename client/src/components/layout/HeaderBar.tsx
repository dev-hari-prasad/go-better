import React, { useState, useRef, useEffect } from 'react';
import {
  ClockIcon,
  ShieldCheckIcon,
  Bars3Icon,
  SparklesIcon,
} from '@heroicons/react/24/outline';
import { PullRequest, Repository, AIFinding } from '../../types/codeReview';
import { ChatModal } from '../chat/ChatModal';
import { ConversationListItem, fetchRecentConversations } from '../../services/aiChatApi';
import { PullRequestSummary } from '../../services/pullRequestApi';
import { SeverityBadge } from '../ui/Badge';
import { Github, GitPullRequest, Book, Plus } from 'lucide-react';
import { ChatTeardrop } from '@phosphor-icons/react';
import { GobeAiLogo } from '../ui/GobeAiLogo';
import { GitHubDark } from '@ridemountainpig/svgl-react';

interface HeaderBarProps {
  currentTab: string;
  selectedRepo: Repository | null;
  selectedPR: PullRequest | null;
  repositories?: Repository[];
  pullRequests: PullRequest[];
  findings: AIFinding[];
  onSelectPR: (pr: PullRequest) => void;
  onSelectRepo?: (repoId: string) => void;
  isSidebarCollapsed: boolean;
  onToggleSidebar: () => void;
  onOpenSearch: () => void;
  onTabChange?: (tab: any) => void;
  onOpenLanding?: () => void;
  onOpenAuth?: (mode: 'signup' | 'login') => void;
}

export const HeaderBar: React.FC<HeaderBarProps> = ({
  currentTab,
  selectedRepo,
  repositories = [],
  pullRequests,
  findings,
  onSelectPR,
  onSelectRepo,
  isSidebarCollapsed,
  onToggleSidebar,
  onOpenSearch,
  onTabChange,
  onOpenLanding,
  onOpenAuth,
}) => {
  const [showChatModal, setShowChatModal] = useState(false);

  // Quick Chat recent conversations (GET /conversation)
  const [showQuickChats, setShowQuickChats] = useState(false);
  const [quickChats, setQuickChats] = useState<ConversationListItem[]>([]);
  const [isLoadingQuickChats, setIsLoadingQuickChats] = useState(false);
  const [pendingConversation, setPendingConversation] = useState<ConversationListItem | null>(null);
  const quickChatRef = useRef<HTMLDivElement>(null);

  const [pendingPr, setPendingPr] = useState<PullRequestSummary | null>(null);

  const [userProfile, setUserProfile] = useState(() => ({
    name: localStorage.getItem('user_profile_name') || '',
    email: localStorage.getItem('user_profile_email') || '',
    userId: localStorage.getItem('user_db_id') || localStorage.getItem('user_id') || '',
    provider: localStorage.getItem('user_auth_provider') || '',
  }));

  useEffect(() => {
    const syncProfile = () => {
      setUserProfile({
        name: localStorage.getItem('user_profile_name') || '',
        email: localStorage.getItem('user_profile_email') || '',
        userId: localStorage.getItem('user_db_id') || localStorage.getItem('user_id') || '',
        provider: localStorage.getItem('user_auth_provider') || '',
      });
    };
    window.addEventListener('user-profile-updated', syncProfile);
    window.addEventListener('user-changed', syncProfile);
    return () => {
      window.removeEventListener('user-profile-updated', syncProfile);
      window.removeEventListener('user-changed', syncProfile);
    };
  }, []);

  // Listen for 'open-gobe-chat' event dispatched by child components
  useEffect(() => {
    const handleOpenGobeChat = (e: Event) => {
      const customEvent = e as CustomEvent<{
        pr?: PullRequestSummary;
        prId?: string | number;
        prTitle?: string;
      }>;
      const prDetail = customEvent.detail?.pr || (customEvent.detail?.prId ? {
        id: String(customEvent.detail.prId),
        prId: customEvent.detail.prId,
        title: customEvent.detail.prTitle || `PR #${customEvent.detail.prId}`,
      } : null);

      if (prDetail) {
        setPendingPr(prDetail);
      }
      setShowChatModal(true);
    };
    window.addEventListener('open-gobe-chat', handleOpenGobeChat);
    return () => window.removeEventListener('open-gobe-chat', handleOpenGobeChat);
  }, []);

  const loadQuickChats = async () => {
    setIsLoadingQuickChats(true);
    try {
      setQuickChats(await fetchRecentConversations());
    } catch {
      setQuickChats([]);
    } finally {
      setIsLoadingQuickChats(false);
    }
  };

  // Close the Quick Chats dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (quickChatRef.current && !quickChatRef.current.contains(e.target as Node)) {
        setShowQuickChats(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const openChatWith = (conversation: ConversationListItem | null) => {
    setShowQuickChats(false);
    if (currentTab === 'ai-chat') {
      // Main chat view is already mounted — tell it to bind to this conversation
      window.dispatchEvent(
        new CustomEvent('select-ai-chat-conversation', { detail: { conversation } })
      );
    } else {
      setPendingConversation(conversation);
      setShowChatModal(true);
    }
  };

  // Dynamic label based on active tab
  const getTabLabel = () => {
    switch (currentTab) {
      case 'overview': return 'Dashboard';
      case 'ai-chat': return 'Gobe AI';
      case 'pull-requests': return 'Pull Requests';
      case 'reviews': return 'Code Reviews';
      case 'repositories': return 'Repositories';
      case 'activity': return 'Activity & Logs';
      case 'settings': return 'Settings';
      case 'byok': return 'BYOK & Keys';
      case 'analytics': return 'Analytics';
      case 'roadmap': return 'Project Roadmap';
      case 'try-public': return 'Try Public Repo';
      default: return 'Dashboard';
    }
  };

  return (
    <>
      <header className="h-11 bg-[#0d1117] border-b border-[#232530] px-3 flex items-center justify-between shrink-0 select-none">
        {/* Left section: Collapse Button, Logo, Dynamic Title */}
        <div className="flex items-center gap-4 flex-1">
          {/* Collapse Button, Logo and Label */}
          <div className="flex items-center gap-3 w-52 shrink-0">
            <div className="relative group flex items-center shrink-0">
              <button
                onClick={onToggleSidebar}
                className="p-1 border border-[#30363d] text-zinc-400 hover:text-zinc-100 hover:bg-[#1a1b22] rounded transition-colors cursor-pointer shrink-0"
              >
                <Bars3Icon className="w-4 h-4" />
              </button>
              <div className="opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-150 absolute left-0 top-full mt-2 px-2.5 py-1 bg-[#1a1b22] text-zinc-100 text-xs font-medium rounded shadow-xl border border-[#232530] whitespace-nowrap z-50">
                {isSidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
              </div>
            </div>
            <button
              type="button"
              onClick={onOpenLanding}
              className="flex items-center gap-2 min-w-0 group/topbar-logo cursor-pointer select-none text-left bg-transparent border-0 p-0 focus:outline-none"
              title="Open GoBetter AI Overview"
              aria-label="Open GoBetter AI Overview"
            >
              <GobeAiLogo className="w-5 h-5 shrink-0 transition-transform duration-200 group-hover/topbar-logo:scale-105" variant="brand" />
              <span className="text-xs font-semibold text-zinc-100 tracking-tight truncate flex-1 group-hover/topbar-logo:text-zinc-200 transition-colors">
                {getTabLabel()}
              </span>
            </button>
          </div>
        </div>

        {/* Right section: User session indicator / Sign In and Quick Chat */}
        <div className="flex items-center gap-2 justify-end">
          {!(localStorage.getItem('showMarketingPopup') === 'false' && (userProfile.userId || userProfile.email)) && (
            <div className="relative group flex items-center justify-center">
              <button
                onClick={() => {
                  if (onOpenAuth) {
                    onOpenAuth('signup');
                  } else {
                    window.dispatchEvent(new CustomEvent('open-auth-modal', { detail: { mode: 'signup' } }));
                  }
                }}
                className="flex items-center gap-1.5 px-3 h-8 rounded-lg bg-[#c0f200] hover:bg-[#d2ff3d] text-black text-xs font-semibold transition-all cursor-pointer shadow-sm hover:scale-[1.02] active:scale-[0.98] group"
                title="Sign in or link your account"
              >
                <GitHubDark className="w-3.5 h-3.5 shrink-0 transition-transform group-hover:scale-110" />
                <span>Login/Sign up</span>
              </button>
            </div>
          )}

          <div ref={quickChatRef} className="relative group/quick-chat flex items-center justify-center">
            <button
              onClick={() => {
                setShowQuickChats((prev) => !prev);
                void loadQuickChats();
              }}
              className={`group/quick-chat flex items-center justify-center w-8 h-8 rounded-lg border transition-colors cursor-pointer shadow-sm ${
                showQuickChats
                  ? 'bg-[#c0f200]/10 border-[#c0f200]/40 text-[#c0f200]'
                  : 'bg-[#16171d] border-[#30363d] hover:border-zinc-500 hover:bg-[#1a1b22] text-zinc-400'
              }`}
            >
              <GobeAiLogo
                className="w-[18px] h-[18px]"
                variant={showQuickChats ? 'brand' : 'outline-to-brand'}
              />
            </button>

            {/* Recent conversations from GET /conversation */}
            {showQuickChats && (
              <div className="absolute top-full right-0 mt-2 w-72 bg-[#161b22] border border-[#30363d] rounded-xl shadow-2xl p-2 z-50 animate-apple-fade">
                {/* Start a new chat button at TOP */}
                <button
                  onClick={() => {
                    setShowQuickChats(false);
                    setPendingConversation(null);
                    if (currentTab === 'ai-chat') {
                      window.dispatchEvent(new Event('new-ai-chat'));
                    } else {
                      setShowChatModal(true);
                    }
                  }}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-[#16171d] hover:bg-[#21262d] border border-[#282b37] hover:border-[#c0f200]/40 text-[#c0f200] rounded-lg text-xs font-medium transition-all cursor-pointer group shadow-sm mb-2.5"
                >
                  <Plus className="w-3.5 h-3.5 text-[#c0f200] group-hover:rotate-90 transition-transform duration-200" />
                  <span>Start a new chat</span>
                </button>

                <div className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider px-1.5 py-1 mb-1">
                  Recent Chats
                </div>
                {isLoadingQuickChats ? (
                  <div className="px-2 py-4 text-xs text-zinc-500 text-center">Loading…</div>
                ) : quickChats.length === 0 ? (
                  <div className="px-2 py-4 text-xs text-zinc-500 text-center">No previous chats yet</div>
                ) : (
                  <div className="max-h-64 overflow-y-auto space-y-0.5 custom-scrollbar pr-0.5">
                    {quickChats.map((chat) => (
                      <button
                        key={chat.id}
                        onClick={() => openChatWith(chat)}
                        className="w-full flex items-center gap-2 text-left px-2.5 py-1.5 text-xs text-zinc-300 hover:bg-[#21262d] hover:text-zinc-100 rounded-lg transition-colors truncate cursor-pointer group"
                      >
                        <ChatTeardrop size={14} weight="regular" className="shrink-0 text-zinc-500 group-hover:text-zinc-300 transition-colors" />
                        <span className="truncate flex-1">{chat.title}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {!showQuickChats && (
              <div className="opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-150 absolute top-full mt-2 px-2.5 py-1 bg-[#1a1b22] text-zinc-100 text-xs font-medium rounded shadow-xl border border-[#232530] whitespace-nowrap z-40">
                Quick Chat
              </div>
            )}
          </div>
        </div>
      </header>

      <ChatModal 
        isOpen={showChatModal} 
        pullRequests={pullRequests}
        initialConversation={pendingConversation}
        initialPr={pendingPr}
        onClose={() => {
          setShowChatModal(false);
          setPendingConversation(null);
          setPendingPr(null);
        }}
        onMaximize={() => {
          setShowChatModal(false);
          onTabChange && onTabChange('ai-chat');
        }}
      />
    </>
  );
};
