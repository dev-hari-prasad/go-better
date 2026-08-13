import React, { useState, useRef, useEffect } from 'react';
import {
  MagnifyingGlassIcon,
  ClockIcon,
  ShieldCheckIcon,
  Bars3Icon,
  SparklesIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { PullRequest, Repository, AIFinding } from '../../types/codeReview';
import { ChatModal } from '../chat/ChatModal';
import { SeverityBadge } from '../ui/Badge';
import { BrainCircuit } from 'lucide-react';

interface HeaderBarProps {
  currentTab: string;
  selectedRepo: Repository | null;
  selectedPR: PullRequest | null;
  pullRequests: PullRequest[];
  findings: AIFinding[];
  onSelectPR: (pr: PullRequest) => void;
  isSidebarCollapsed: boolean;
  onToggleSidebar: () => void;
  onOpenSearch: () => void;
  onTabChange?: (tab: any) => void;
  onOpenLanding: () => void;
}

export const HeaderBar: React.FC<HeaderBarProps> = ({
  currentTab,
  pullRequests,
  findings,
  onSelectPR,
  isSidebarCollapsed,
  onToggleSidebar,
  onOpenSearch,
  onTabChange,
  onOpenLanding,
}) => {
  const [showChatModal, setShowChatModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Handle Cmd+K / Ctrl+K focus
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
        setShowDropdown(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Listen for 'open-gobe-chat' event dispatched by child components
  useEffect(() => {
    const handleOpenGobeChat = () => setShowChatModal(true);
    window.addEventListener('open-gobe-chat', handleOpenGobeChat);
    return () => window.removeEventListener('open-gobe-chat', handleOpenGobeChat);
  }, []);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      setShowDropdown(false);
      searchInputRef.current?.blur();
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
      default: return 'Dashboard';
    }
  };

  const displayedFindings = searchQuery.trim() === ''
    ? findings.slice(0, 3)
    : findings.filter(
        (f) =>
          f.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          f.explanation.toLowerCase().includes(searchQuery.toLowerCase()) ||
          f.filename.toLowerCase().includes(searchQuery.toLowerCase())
      ).slice(0, 5);

  const displayedPRs = searchQuery.trim() === ''
    ? pullRequests.slice(0, 2)
    : pullRequests.filter(
        (pr) =>
          pr.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          pr.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
          pr.author.name.toLowerCase().includes(searchQuery.toLowerCase())
      ).slice(0, 3);

  return (
    <>
      <header className="h-11 bg-[#0d1117] border-b border-[#232530] px-3 flex items-center justify-between shrink-0 select-none">
        {/* Left section: Collapse Button, Logo, Dynamic Title */}
        <div className="flex items-center gap-4 flex-1">
          {/* Collapse Button, Logo and Label */}
          <div className="flex items-center gap-3 w-52 shrink-0">
            <button
              onClick={onToggleSidebar}
              className="p-1 border border-[#30363d] text-zinc-400 hover:text-zinc-100 hover:bg-[#1a1b22] rounded transition-colors cursor-pointer shrink-0"
              title={isSidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
            >
              <Bars3Icon className="w-4 h-4" />
            </button>
            <div className="flex items-center justify-center w-5 h-5 rounded bg-[#c0f200] text-black font-bold text-xs shrink-0">
              <svg className="w-3 h-3 text-black" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
              </svg>
            </div>
            <span className="text-xs font-semibold text-zinc-100 tracking-tight truncate flex-1">
              {getTabLabel()}
            </span>
          </div>
        </div>

        {/* Right section: Inline Search and Quick Chat */}
        <div className="flex items-center gap-1.5 justify-end">
          <div className="relative" ref={searchContainerRef}>
            <div className="flex items-center justify-between gap-2 px-2.5 h-8 bg-[#16171d] border border-[#30363d] focus-within:border-zinc-500 rounded-lg text-xs text-zinc-400 transition-colors w-64 shadow-sm">
              <div className="flex items-center gap-1.5 flex-1 min-w-0">
                <MagnifyingGlassIcon className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Search findings, PRs..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setShowDropdown(true);
                  }}
                  onFocus={() => setShowDropdown(true)}
                  onKeyDown={handleInputKeyDown}
                  className="w-full bg-transparent text-[11px] text-zinc-200 placeholder-zinc-500 focus:outline-none"
                />
              </div>
              {searchQuery ? (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    searchInputRef.current?.focus();
                  }}
                  className="p-0.5 hover:text-zinc-200 cursor-pointer flex items-center justify-center shrink-0"
                >
                  <XMarkIcon className="w-3.5 h-3.5 text-zinc-500" />
                </button>
              ) : (
                <div className="flex items-center justify-center px-1.5 py-0.5 rounded border border-[#30363d] bg-[#21262d] text-zinc-500 text-[9px] font-medium uppercase tracking-widest shadow-sm shrink-0">
                  ⌘K
                </div>
              )}
            </div>

            {/* Inline Dropdown for search results */}
            {showDropdown && (
              <div className="absolute top-full right-0 mt-1.5 w-72 sm:w-80 bg-[#161b22] border border-[#30363d] rounded-xl shadow-2xl p-2 z-[60] max-h-[460px] overflow-y-auto animate-apple-fade">
                {displayedPRs.length > 0 && (
                  <div className="mb-3">
                    <div className="px-3 py-1 text-[9px] font-bold text-zinc-500 uppercase tracking-widest border-b border-[#30363d]/40 mb-1">
                      Pull Requests
                    </div>
                    {displayedPRs.map((pr) => (
                      <div
                        key={pr.id}
                        onClick={() => {
                          onSelectPR(pr);
                          onTabChange && onTabChange('reviews');
                          setShowDropdown(false);
                          setSearchQuery('');
                        }}
                        className="px-3 py-2 bg-transparent hover:bg-white/5 rounded-lg cursor-pointer transition-colors flex items-center justify-between group"
                      >
                        <div className="flex-1 min-w-0 mr-2">
                          <h4 className="text-xs font-semibold text-zinc-200 group-hover:text-white transition-colors truncate">
                            {pr.title}
                          </h4>
                          <p className="text-[10px] text-zinc-500 mt-0.5">
                            {pr.id} • by {pr.author.name}
                          </p>
                        </div>
                        <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-zinc-800 text-zinc-400 group-hover:text-zinc-300 capitalize">
                          {pr.status}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {displayedFindings.length > 0 && (
                  <div>
                    <div className="px-3 py-1 text-[9px] font-bold text-zinc-500 uppercase tracking-widest border-b border-[#30363d]/40 mb-1">
                      AI Findings
                    </div>
                    {displayedFindings.map((finding) => (
                      <div
                        key={finding.id}
                        onClick={() => {
                          onTabChange && onTabChange('reviews');
                          setShowDropdown(false);
                          setSearchQuery('');
                        }}
                        className="px-3 py-2 bg-transparent hover:bg-white/5 rounded-lg cursor-pointer transition-colors flex items-start gap-2.5 group"
                      >
                        <div className="mt-0.5 shrink-0">
                          <SeverityBadge severity={finding.severity} size="sm" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-xs font-semibold text-zinc-200 group-hover:text-white transition-colors truncate">
                            {finding.title}
                          </h4>
                          <p className="text-[10px] text-zinc-500 mt-0.5 truncate">
                            {finding.filename}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {displayedPRs.length === 0 && displayedFindings.length === 0 && (
                  <div className="py-6 text-center text-xs text-zinc-500">
                    No results found for "{searchQuery}"
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="relative group flex items-center justify-center">
            <button
              onClick={onOpenLanding}
              className="flex items-center justify-center w-8 h-8 rounded-lg bg-[#16171d] border border-[#30363d] hover:border-zinc-500 hover:bg-[#1a1b22] text-[#c0f200] transition-colors cursor-pointer shadow-sm animate-pulse hover:animate-none"
            >
              <SparklesIcon className="w-4 h-4" />
            </button>
            <div className="opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-150 absolute top-full mt-2 px-2.5 py-1 bg-[#1a1b22] text-zinc-100 text-xs font-medium rounded shadow-xl border border-[#232530] whitespace-nowrap z-50">
              Product Tour
            </div>
          </div>

          <div className="relative group flex items-center justify-center">
            <button
              onClick={() => {
                if (currentTab === 'ai-chat') {
                  window.dispatchEvent(new Event('new-ai-chat'));
                } else {
                  setShowChatModal(true);
                }
              }}
              className="flex items-center justify-center w-8 h-8 rounded-lg bg-[#16171d] border border-[#30363d] hover:border-zinc-500 hover:bg-[#1a1b22] text-[#c0f200] transition-colors cursor-pointer shadow-sm"
            >
              <BrainCircuit className="w-4 h-4" />
            </button>
            <div className="opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-150 absolute top-full mt-2 px-2.5 py-1 bg-[#1a1b22] text-zinc-100 text-xs font-medium rounded shadow-xl border border-[#232530] whitespace-nowrap z-50">
              Quick Chat
            </div>
          </div>
        </div>
      </header>

      <ChatModal 
        isOpen={showChatModal} 
        onClose={() => setShowChatModal(false)}
        onMaximize={() => {
          setShowChatModal(false);
          onTabChange && onTabChange('ai-chat');
        }}
      />
    </>
  );
};
