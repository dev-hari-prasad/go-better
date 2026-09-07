import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ShieldCheckIcon, LightBulbIcon, DocumentTextIcon } from '@heroicons/react/24/outline';
import {
  MessageSquare,
  ChevronDown,
  Bot,
  CircleDashed,
  GitPullRequest,
  ArrowUp,
  BrainCircuit,
} from 'lucide-react';
import { GobeAiLogo } from '../ui/GobeAiLogo';
import { PullRequest, Repository, AIFinding, LatestCodeReview } from '../../types/codeReview';
import { PrSummaryDropdown } from '../ui/PrSummaryDropdown';
import { PullRequestSummary, fetchLatestReviews, LatestReviewItem, getAuthUserId } from '../../services/pullRequestApi';
import { ModelPickerButton } from '../chat/ModelPickerButton';
import { useModelPicker } from '../../hooks/useModelPicker';
import { getChatGreeting } from '../../utils/greetings';
import { ChatBottomLightBeam } from '../chat/ChatBottomLightBeam';

interface OverviewDashboardProps {
  repositories: Repository[];
  pullRequests: PullRequest[];
  findings?: AIFinding[];
  activities?: any[];
  isLoading?: boolean;
  authUserId?: string;
  onSelectPR: (pr: PullRequest) => void;
  onNavigateToTab: (tab: any, filter?: string) => void;
}

const PullRequestSkeletonRow: React.FC = () => (
  <div className="p-4 flex items-start gap-3 bg-[#111318]/50">
    <div className="w-4 h-4 mt-0.5 rounded shrink-0 skeleton-glare" />
    <div className="flex-1 min-w-0 space-y-2">
      <div className="h-4 rounded w-3/4 max-w-md skeleton-glare" />
      <div className="h-3 rounded w-1/2 max-w-xs skeleton-glare opacity-70" />
    </div>
    <div className="w-8 h-4 rounded shrink-0 skeleton-glare opacity-80" />
  </div>
);

const ReviewSkeletonRow: React.FC = () => (
  <div className="p-4 flex items-center gap-3 bg-[#111318]/50">
    <div className="w-4 h-4 rounded shrink-0 skeleton-glare" />
    <div className="flex-1 min-w-0 space-y-2">
      <div className="h-4 rounded w-3/4 max-w-md skeleton-glare" />
      <div className="h-3 rounded w-1/3 max-w-xs skeleton-glare opacity-70" />
    </div>
    <div className="flex flex-col items-end gap-1.5 shrink-0 self-center">
      <div className="w-8 h-3.5 rounded skeleton-glare opacity-80" />
      <div className="w-14 h-2.5 rounded skeleton-glare opacity-60" />
    </div>
  </div>
);

function formatRelativeTime(dateStr?: string): string {
  if (!dateStr) return 'recently';
  if (dateStr.toLowerCase().includes('ago') || dateStr.toLowerCase().includes('yesterday')) {
    return dateStr;
  }
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;
  const now = new Date();
  const diffSec = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (diffSec < 60) return 'just now';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
}

export const OverviewDashboard: React.FC<OverviewDashboardProps> = ({
  pullRequests,
  isLoading = false,
  authUserId,
  onSelectPR,
  onNavigateToTab,
}) => {
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
    logoBlinkTimerRef.current = setTimeout(() => {
      setIsLogoBlinking(false);
    }, 1900);
    return () => {
      if (logoBlinkTimerRef.current) clearTimeout(logoBlinkTimerRef.current);
    };
  }, []);

  const [selectedPrChat, setSelectedPrChat] = useState<PullRequestSummary | null>(null);
  const [chatInput, setChatInput] = useState('');
  const [latestReviews, setLatestReviews] = useState<LatestReviewItem[]>([]);
  const [isLoadingReviews, setIsLoadingReviews] = useState<boolean>(true);
  const { activeModel } = useModelPicker();

  useEffect(() => {
    let mounted = true;
    const currentUserId = authUserId || getAuthUserId();

    if (!currentUserId) {
      setLatestReviews([]);
      setIsLoadingReviews(false);
      return;
    }

    setIsLoadingReviews(true);
    fetchLatestReviews(currentUserId)
      .then((items) => {
        if (mounted) {
          setLatestReviews(items);
        }
      })
      .catch(() => {
        if (mounted) {
          setLatestReviews([]);
        }
      })
      .finally(() => {
        if (mounted) {
          setIsLoadingReviews(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, [authUserId]);

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSendMessage = () => {
    const message = chatInput.trim();
    if (!message) return;
    const customModelData = activeModel ? {
      id: activeModel.id,
      name: activeModel.name,
      providerId: activeModel.providerId,
      providerLabel: activeModel.providerLabel,
      baseURL: activeModel.baseURL,
      isCustom: Boolean(activeModel.isCustom || activeModel.providerId === 'custom'),
    } : undefined;

    const payload = {
      message,
      llmModel: activeModel?.id,
      modelName: activeModel?.name,
      customModel: Boolean(activeModel?.isCustom || activeModel?.providerId === 'custom'),
      customModelData,
      prContext: selectedPrChat?.title,
      prId: selectedPrChat ? String(selectedPrChat.prId || selectedPrChat.id) : undefined,
      prTitle: selectedPrChat?.title,
    };
    sessionStorage.setItem('gobe-pending-chat', JSON.stringify(payload));
    window.dispatchEvent(new CustomEvent('start-ai-chat', { detail: payload }));
    setChatInput('');
    onNavigateToTab('ai-chat');
  };

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
      textareaRef.current.style.height = `${Math.max(52, Math.min(textareaRef.current.scrollHeight, 220))}px`;
    }
  }, [chatInput]);

  const displayedPRs = pullRequests.slice(0, 4);
  const oldPRs = pullRequests.slice().reverse().slice(0, 2); // mock old PRs from existing data

  return (
    <div className="flex-1 overflow-y-auto bg-[#0d1117] min-h-full">
      <div className="max-w-[1000px] mx-auto pt-10 sm:pt-12 px-4 sm:px-8 pb-8 animate-apple-fade">
        {/* Center Greeting & Logo (Single line with Instrument Serif, no tooltip, refreshable) */}
        <div className="flex flex-col items-center justify-center w-full mb-8 sm:mb-10">
          <button
            type="button"
            onClick={() => {
              setGreeting(getChatGreeting());
              triggerLogoBlink();
            }}
            className="flex items-center justify-center gap-3.5 cursor-pointer group select-none transition-transform active:scale-[0.98]"
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
        </div>

        {/* Centered Chat Bar strictly inside with clean border & slow-poweron glow */}
        <div className="w-full max-w-[760px] mx-auto bg-[#161b22] border border-[#30363d] rounded-[24px] p-3 flex flex-col transition-all relative min-h-[110px] sm:min-h-[116px]">
          {/* Chromatic Rim & Moving Aurora (Strictly Inside) */}
          <ChatBottomLightBeam active={true} />

          {/* Textarea on top */}
          <textarea
            ref={textareaRef}
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
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
                selectedPr={selectedPrChat}
                onSelectPr={setSelectedPrChat}
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
                  chatInput.trim()
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
        <div className="flex flex-row items-center justify-center gap-2.5 w-full max-w-[760px] mx-auto mt-4 flex-wrap mb-12">
          <button
            onClick={() => setChatInput('Summarize my active PRs')}
            className="flex items-center justify-center gap-2 px-3.5 py-2 bg-[#16171d] hover:bg-[#1a1b22] border border-[#232530] hover:border-zinc-500 rounded-xl text-xs text-zinc-300 transition-colors cursor-pointer whitespace-nowrap"
          >
            <GitPullRequest className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
            <span>Summarize my active PRs</span>
          </button>
          <button
            onClick={() => setChatInput('Check for security vulnerabilities')}
            className="flex items-center justify-center gap-2 px-3.5 py-2 bg-[#16171d] hover:bg-[#1a1b22] border border-[#232530] hover:border-zinc-500 rounded-xl text-xs text-zinc-300 transition-colors cursor-pointer whitespace-nowrap"
          >
            <ShieldCheckIcon className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
            <span>Check for security vulnerabilities</span>
          </button>
          <button
            onClick={() => setChatInput('Generate unit tests for this pull request')}
            className="flex items-center justify-center gap-2 px-3.5 py-2 bg-[#16171d] hover:bg-[#1a1b22] border border-[#232530] hover:border-zinc-500 rounded-xl text-xs text-zinc-300 transition-colors cursor-pointer whitespace-nowrap"
          >
            <LightBulbIcon className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
            <span>Generate unit tests for this pull request</span>
          </button>
        </div>

        <div className="space-y-8">
          {/* Latest code reviews - Horizontal Segmented Cards */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-[13px] font-semibold text-zinc-400">Latest code reviews</h2>
              <button 
                onClick={() => onNavigateToTab('pull-requests', 'completed')} 
                className="text-xs text-[#4493f8] hover:text-[#58a6ff] transition-colors font-medium cursor-pointer"
              >
                View all
              </button>
            </div>
            <div className="border border-[#30363d] rounded-xl overflow-hidden bg-transparent divide-y divide-[#30363d]">
              {isLoadingReviews ? (
                <>
                  <ReviewSkeletonRow />
                  <ReviewSkeletonRow />
                  <ReviewSkeletonRow />
                </>
              ) : latestReviews.length === 0 ? (
                <div className="p-6 text-center text-xs text-zinc-500">
                  No code reviews found.
                </div>
              ) : (
                latestReviews.slice(0, 3).map((review) => {
                  const targetPrId = review.pullRequestId || ('prId' in review ? (review as any).prId : undefined) || review.id;
                  const matchedPr = pullRequests.find(
                    (p) => String(p.id) === String(targetPrId) || p.number === review.prNumber
                  );
                  return (
                    <div
                      key={review.id}
                      onClick={() => {
                        if (matchedPr) {
                          onSelectPR(matchedPr);
                        } else {
                          onSelectPR({
                            id: String(targetPrId),
                            number: review.prNumber,
                            title: review.prTitle,
                            repositoryId: 'repo-1',
                            repoFullName: review.repoFullName,
                            author: { name: 'dev-hari-prasad', username: 'dev-hari-prasad', avatarUrl: '' },
                            sourceBranch: 'feature/branch',
                            targetBranch: 'main',
                            status: (review.status as any) || 'in_progress',
                            additions: 142,
                            deletions: 38,
                            changedFilesCount: 3,
                            createdAt: review.reviewedAt,
                            updatedAt: review.reviewedAt,
                            aiReviewSummary: {
                              overview: review.summary,
                              score: review.score ?? 90,
                              criticalCount: review.criticalCount,
                              warningCount: review.warningCount,
                              suggestionCount: review.suggestionCount,
                              infoCount: 0,
                              keyTakeaways: [],
                            },
                          });
                        }
                        onNavigateToTab('reviews');
                      }}
                      className="p-4 flex items-center gap-3 hover:bg-[#161b22] cursor-pointer transition-colors group"
                    >
                      <BrainCircuit className="w-4 h-4 text-zinc-400 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <h3 className="text-[15px] font-semibold text-[#e6edf3] group-hover:text-white transition-colors truncate mb-1">
                          {review.prTitle}
                        </h3>
                        <p className="text-xs text-[#7d8590] truncate">
                          {review.repoFullName}#{review.prNumber} • Reviewed {formatRelativeTime(review.reviewedAt)}
                        </p>
                      </div>
                      <div className="flex flex-col items-end shrink-0 gap-1 select-none self-center">
                        {review.score != null && (
                          <span className="px-1.5 py-0.5 text-[10px] font-mono font-medium rounded bg-[#21262d] text-zinc-300 border border-[#30363d] leading-none">
                            {review.score}%
                          </span>
                        )}
                        <span className={`text-[11px] font-mono ${review.criticalCount > 0 ? 'text-rose-400 font-medium' : 'text-zinc-400'}`}>
                          {review.criticalCount > 0
                            ? `${review.criticalCount} critical issue`
                            : `${review.totalFindings} findings`}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Latest pull requests */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-[13px] font-semibold text-zinc-400">Latest pull requests</h2>
              {pullRequests.length > 4 && (
                <button 
                  onClick={() => onNavigateToTab('pull-requests')} 
                  className="text-xs text-[#4493f8] hover:text-[#58a6ff] transition-colors font-medium cursor-pointer"
                >
                  View all
                </button>
              )}
            </div>
            <div className="border border-[#30363d] rounded-xl overflow-hidden bg-transparent divide-y divide-[#30363d]">
              {isLoading ? (
                <>
                  <PullRequestSkeletonRow />
                  <PullRequestSkeletonRow />
                  <PullRequestSkeletonRow />
                  <PullRequestSkeletonRow />
                </>
              ) : displayedPRs.length === 0 ? (
                <div className="p-6 text-center text-xs text-zinc-500">
                  No pull requests found.
                </div>
              ) : (
                displayedPRs.map((pr, idx) => (
                  <div 
                    key={pr.id} 
                    onClick={() => {
                      onSelectPR(pr);
                      onNavigateToTab('reviews');
                    }}
                    className="p-4 flex items-start gap-3 hover:bg-[#161b22] cursor-pointer transition-colors"
                  >
                    <GitPullRequest className="w-4 h-4 mt-0.5 text-[#3fb950] shrink-0" />
                    <div className="flex-1 min-w-0">
                      <h3 className="text-[15px] font-semibold text-[#e6edf3] mb-1 leading-tight">{pr.title}</h3>
                      <p className="text-xs text-[#7d8590] truncate">
                        {pr.repoFullName}#{pr.number} • Opened by {pr.author.name} • Updated 1 hour ago
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-[#7d8590] shrink-0 font-medium">
                      <MessageSquare className="w-3.5 h-3.5" /> {(idx === 1 ? 3 : 1)}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Old PRs needing attention */}
          <div>
            <div className="flex items-center justify-between mb-3 mt-8">
              <h2 className="text-[13px] font-semibold text-amber-500/80">Old PRs needing attention</h2>
            </div>
            <div className="border border-[#30363d] rounded-xl overflow-hidden bg-transparent divide-y divide-[#30363d]">
              {isLoading ? (
                <>
                  <PullRequestSkeletonRow />
                  <PullRequestSkeletonRow />
                </>
              ) : oldPRs.length === 0 ? (
                <div className="p-6 text-center text-xs text-zinc-500">
                  No old pull requests needing attention.
                </div>
              ) : (
                oldPRs.map((pr) => (
                  <div 
                    key={`old-${pr.id}`} 
                    onClick={() => {
                      onSelectPR(pr);
                      onNavigateToTab('reviews');
                    }}
                    className="p-4 flex items-start gap-3 hover:bg-[#161b22] cursor-pointer transition-colors"
                  >
                    <CircleDashed className="w-4 h-4 mt-0.5 text-amber-500 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <h3 className="text-[15px] font-semibold text-[#e6edf3] mb-1 leading-tight opacity-90">{pr.title}</h3>
                      <p className="text-xs text-[#7d8590] truncate">
                        {pr.repoFullName}#{pr.number} • Opened by {pr.author.name} • Updated 14 days ago
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-[#7d8590] shrink-0 font-medium opacity-80">
                      <MessageSquare className="w-3.5 h-3.5" /> 0
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
