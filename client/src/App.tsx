import React, { useState, useEffect, useRef } from 'react';
import { ArrowPathIcon } from '@heroicons/react/24/outline';
import { Sidebar } from './components/layout/Sidebar';
import { NavTab, parseRoute, navigateTo, TAB_TO_PATH, TAB_TITLES } from './router/routes';
import { HeaderBar } from './components/layout/HeaderBar';
import { OverviewDashboard } from './components/dashboard/OverviewDashboard';
import { PullRequestsListView } from './components/pullrequests/PullRequestsListView';
import { PullRequestReviewView } from './components/review/PullRequestReviewView';
import { RepositoriesView } from './components/repositories/RepositoriesView';
import { ActivityLogView } from './components/activity/ActivityLogView';
import { RoadmapView } from './components/roadmap/RoadmapView';
import { TryPublicRepoView } from './components/explore/TryPublicRepoView';
import { isPublicReposTabEnabled, subscribeToConfigChange } from './config/clientConfig';
import { WorkspaceSettingsView } from './components/settings/WorkspaceSettingsView';
import { BYOKKeysView } from './components/settings/BYOKKeysView';
import { AIChatView } from './components/chat/AIChatView';
import { SearchModal } from './components/search/SearchModal';
import { GlobalModelPickerModal } from './components/chat/GlobalModelPickerModal';
import { LandingModal } from './components/landing/LandingModal';
import { AuthModal, AuthMode } from './components/auth/AuthModal';
import { LegalView } from './components/legal/LegalView';
import { LoadingState } from './components/ui/LoadingState';
import { AnalyticsView } from './components/analytics/AnalyticsView';
import { GlobalTooltip } from './components/ui/GlobalTooltip';
import { GobeAiLogo } from './components/ui/GobeAiLogo';
import { Toaster, toast } from 'sonner';
import { getCurrentSession } from './services/authApi';
import { useAuth } from './context/AuthContext';
import {
  mockRepositories,
  mockDiffFiles,
  mockFindings,
  mockActivityEvents,
  mockUserSettings,
} from './mockData/codeReviewData';
import { PullRequest, AIFinding, UserSettings, Repository, DiffFile } from './types/codeReview';
import {
  fetchPullRequestList,
  fetchPullRequestReview,
  triggerPullRequestReview,
  getAuthUserId,
  parseUnifiedDiff,
  normalizeReviewJSON,
  mapReviewJSONToFindings,
  cleanOverviewText,
  RawReviewRow,
  RawReviewJSON,
} from './services/pullRequestApi';

const REVIEW_STATUS_MAP: Record<string, PullRequest['status']> = {
  pending: 'pending',
  running: 'in_progress',
  in_progress: 'in_progress',
  completed: 'completed',
  approved: 'approved',
  failed: 'changes_requested',
};

const mapRawReviewToPullRequestPatch = (
  row: RawReviewRow,
  reviewJson: RawReviewJSON | null
): Partial<PullRequest> => {
  const comments = Array.isArray(reviewJson?.comments) ? reviewJson.comments : [];
  const countBy = (sev: string) =>
    comments.filter((c) => String(c.severity ?? '').toUpperCase() === sev).length;

  const rawOverview = reviewJson?.summary?.overview || row.reviewSummary || '';
  const cleanOverview = cleanOverviewText(rawOverview);

  const hasRealReview = Boolean(cleanOverview) || comments.length > 0;

  return {
    title:
      typeof row.prTitle === 'string' && row.prTitle.length > 0
        ? row.prTitle
        : undefined,
    sourceBranch: row.prHeadBranch ?? '',
    targetBranch: row.prBaseBranch ?? '',
    status:
      row.reviewStatus && REVIEW_STATUS_MAP[row.reviewStatus]
        ? REVIEW_STATUS_MAP[row.reviewStatus]
        : undefined,
    additions: Number(row.prAddtions ?? 0),
    deletions: Number(row.prDeletions ?? 0),
    changedFilesCount: Number(row.changedFiles ?? 0),
    updatedAt:
      typeof row.prUpdatedAt === 'string' ? row.prUpdatedAt : undefined,
    htmlUrl:
      (typeof row.prHtmlUrl === 'string' && row.prHtmlUrl.length > 0 && row.prHtmlUrl) ||
      (typeof row.htmlUrl === 'string' && row.htmlUrl.length > 0 && row.htmlUrl) ||
      undefined,
    agenticFixPrompt:
      reviewJson?.agenticFixPrompt ??
      (typeof row.reviewRawJSON === 'object' && row.reviewRawJSON && 'agenticFixPrompt' in (row.reviewRawJSON as object)
        ? ((row.reviewRawJSON as Record<string, unknown>).agenticFixPrompt as string | null)
        : null),
    aiReviewSummary: hasRealReview ? {
      overview: cleanOverview || (comments.length > 0 ? `Found ${comments.length} issue(s).` : ''),
      score: Math.round(Number(reviewJson?.confidence?.overall ?? 85)),
      criticalCount: countBy('CRITICAL'),
      warningCount: countBy('MAJOR'),
      suggestionCount: countBy('MINOR'),
      infoCount: countBy('INFO'),
      keyTakeaways: [],
      agenticFixPrompt:
        reviewJson?.agenticFixPrompt ??
        (typeof row.reviewRawJSON === 'object' && row.reviewRawJSON && 'agenticFixPrompt' in (row.reviewRawJSON as object)
          ? ((row.reviewRawJSON as Record<string, unknown>).agenticFixPrompt as string | null)
          : null),
    } : undefined,
  };
};

export const App: React.FC = () => {
  const initialRoute = useRef(parseRoute()).current;
  const [activeTab, setActiveTabState] = useState<NavTab>(() => initialRoute.tab);
  const [prStatusFilter, setPrStatusFilter] = useState<string>(() => initialRoute.filter || 'all');
  const [pendingPrId, setPendingPrId] = useState<string | undefined>(() => initialRoute.prId);
  const [selectedRepoId, setSelectedRepoId] = useState<string>('all');
  const [selectedPR, setSelectedPR] = useState<PullRequest | null>(null);
  const [repositories] = useState<Repository[]>(mockRepositories);
  const [pullRequests, setPullRequests] = useState<PullRequest[]>([]);
  const [isLoadingPullRequests, setIsLoadingPullRequests] = useState<boolean>(true);
  // Tracks the temp user id used by the PR list view so we refetch when it changes
  const [authUserId, setAuthUserId] = useState<string>(() => getAuthUserId());
  const [findings, setFindings] = useState<AIFinding[]>([]);
  const [activities] = useState(mockActivityEvents);
  const [settings, setSettings] = useState<UserSettings>(mockUserSettings);

  const { isAuthenticated } = useAuth();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);
  const [isGlobalModelPickerOpen, setIsGlobalModelPickerOpen] = useState<boolean>(false);
  const [isLandingModalOpen, setIsLandingModalOpen] = useState<boolean>(() => {
    if (initialRoute.authMode) return false;
    return localStorage.getItem('showMarketingPopup') !== 'false';
  });
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(() => Boolean(initialRoute.authMode));
  const [authModalMode, setAuthModalMode] = useState<AuthMode>(() => initialRoute.authMode || 'signup');
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [scanStep, setScanStep] = useState<string>('');

  // Keep isLandingModalOpen synchronized with auth status
  useEffect(() => {
    if (isAuthenticated) {
      setIsLandingModalOpen(false);
    } else if (!initialRoute.authMode) {
      setIsLandingModalOpen(true);
    }
  }, [isAuthenticated, initialRoute.authMode]);

  // Route-aware active tab switcher: updates internal state and URL bar
  const setActiveTab = (
    tab: NavTab,
    options?: { prId?: string; filter?: string; replace?: boolean }
  ) => {
    const isAuthed = localStorage.getItem('showMarketingPopup') === 'false';
    const isLegalTab = tab === 'terms' || tab === 'privacy-policy' || tab === 'subprocessors';
    if (!isAuthed && !isLegalTab) {
      toast.info('Please sign in or create an account to access workspace features');
      setAuthModalMode('signup');
      setIsAuthModalOpen(true);
      return;
    }

    setActiveTabState(tab);
    if (options?.filter) {
      setPrStatusFilter(options.filter);
    }
    if (options?.prId) {
      setPendingPrId(options.prId);
    }
    navigateTo(tab, {
      prId: options?.prId,
      filter: options?.filter || (tab === 'pull-requests' && prStatusFilter !== 'all' ? prStatusFilter : undefined),
      replace: options?.replace,
    });
  };

  // Two-way synchronization with browser URL (popstate for Back/Forward and deep links)
  useEffect(() => {
    const syncFromUrl = () => {
      const route = parseRoute();
      setActiveTabState(route.tab);
      if (route.filter) {
        setPrStatusFilter(route.filter);
      }
      if (route.prId) {
        setPendingPrId(route.prId);
      }
      if (route.authMode) {
        setAuthModalMode(route.authMode);
        setIsAuthModalOpen(true);
        document.title =
          route.authMode === 'login'
            ? 'Log In | GoBetter AI'
            : route.authMode === 'forgot-password'
            ? 'Forgot Password | GoBetter AI'
            : route.authMode === 'reset-password'
            ? 'Reset Password | GoBetter AI'
            : 'Create Account | GoBetter AI';
      } else {
        setIsAuthModalOpen(false);
        document.title = TAB_TITLES[route.tab] || 'GoBetter AI';
      }
    };

    window.addEventListener('popstate', syncFromUrl);
    window.addEventListener('app-route-change', syncFromUrl);

    // Initial title update
    if (initialRoute.authMode) {
      document.title =
        initialRoute.authMode === 'login'
          ? 'Log In | GoBetter AI'
          : initialRoute.authMode === 'forgot-password'
          ? 'Forgot Password | GoBetter AI'
          : initialRoute.authMode === 'reset-password'
          ? 'Reset Password | GoBetter AI'
          : 'Create Account | GoBetter AI';
    } else {
      document.title = TAB_TITLES[initialRoute.tab] || 'GoBetter AI';
    }

    // Normalize root '/' or legacy '/overview' to canonical '/dashboard'
    if (window.location.pathname === '/' || window.location.pathname === '/overview') {
      window.history.replaceState({ tab: 'overview' }, '', '/dashboard');
    }

    return () => {
      window.removeEventListener('popstate', syncFromUrl);
      window.removeEventListener('app-route-change', syncFromUrl);
    };
  }, []);

  useEffect(() => {
    const handleOpenLanding = () => setIsLandingModalOpen(true);
    window.addEventListener('open-landing-modal', handleOpenLanding);
    return () => window.removeEventListener('open-landing-modal', handleOpenLanding);
  }, []);

  // Sync active backend session with client credentials on mount
  useEffect(() => {
    getCurrentSession().then((session) => {
      if (session?.userId) {
        localStorage.setItem('user_db_id', session.userId);
        localStorage.setItem('user_id', session.userId);
        window.dispatchEvent(new Event('user-profile-updated'));
      }
    }).catch(() => {});
  }, []);

  useEffect(() => {
    const handleOpenAuthModal = (e: Event) => {
      const customEvent = e as CustomEvent<{ mode?: AuthMode }>;
      const mode = customEvent.detail?.mode || 'signup';
      setAuthModalMode(mode);
      setIsAuthModalOpen(true);
      if (window.location.pathname !== `/${mode}`) {
        window.history.pushState({ auth: mode }, '', `/${mode}`);
        document.title =
          mode === 'login'
            ? 'Log In | GoBetter AI'
            : mode === 'forgot-password'
            ? 'Forgot Password | GoBetter AI'
            : mode === 'reset-password'
            ? 'Reset Password | GoBetter AI'
            : 'Create Account | GoBetter AI';
      }
    };
    window.addEventListener('open-auth-modal', handleOpenAuthModal);
    return () => window.removeEventListener('open-auth-modal', handleOpenAuthModal);
  }, []);

  // Review detail fetched from GET /review/:id
  const [diffFiles, setDiffFiles] = useState<DiffFile[]>([]);
  const [reviewError, setReviewError] = useState<string | null>(null);
  const [isReviewLoading, setIsReviewLoading] = useState<boolean>(false);
  const lastRequestedIdRef = useRef<string | null>(null);

  // Explicitly loads the review detail for a PR id (called on click)
  const loadReviewDetail = (prId: string) => {
    lastRequestedIdRef.current = prId;
    setIsReviewLoading(true);
    setReviewError(null);
    setFindings([]);
    setDiffFiles([]);

    fetchPullRequestReview(prId)
      .then((row) => {
        if (lastRequestedIdRef.current !== prId) return;

        if (!row || (!row.reviewRawJSON && !row.reviewSummary && !row.reviewStatus)) {
          // No review completed for this PR yet — cleanly reset to non-reviewed state
          setSelectedPR((prev) =>
            prev && prev.id === prId
              ? {
                  ...prev,
                  status: (row?.reviewStatus && REVIEW_STATUS_MAP[row.reviewStatus]) || prev.status || 'pending',
                  aiReviewSummary: undefined,
                  agenticFixPrompt: null,
                }
              : prev
          );
          setFindings([]);
          setDiffFiles(row?.prDiff ? parseUnifiedDiff(row.prDiff) : []);
          return;
        }

        const reviewJson = normalizeReviewJSON(row.reviewRawJSON || row.reviewSummary);
        const patch = mapRawReviewToPullRequestPatch(row, reviewJson);
        setSelectedPR((prev) =>
          prev && prev.id === prId
            ? {
                ...prev,
                ...patch,
                aiReviewSummary: patch.aiReviewSummary ?? undefined,
                agenticFixPrompt: patch.agenticFixPrompt ?? null,
              }
            : prev
        );
        if (reviewJson) {
          setFindings(mapReviewJSONToFindings(reviewJson, prId));
        } else {
          setFindings([]);
        }
        setDiffFiles(
          row.prDiff ? parseUnifiedDiff(row.prDiff) : []
        );
      })
      .catch((err: unknown) => {
        if (lastRequestedIdRef.current !== prId) return;
        setReviewError(
          err instanceof Error ? err.message : 'Failed to load review.'
        );
        setDiffFiles([]);
        setFindings([]);
      })
      .finally(() => {
        if (lastRequestedIdRef.current === prId) setIsReviewLoading(false);
      });
  };

  // Opens a PR: selects it, switches to the review view and fetches its review
  const openPullRequest = (pr: PullRequest) => {
    // Reset previous review summary/findings to avoid showing cached data
    setSelectedPR({
      ...pr,
      aiReviewSummary: pr.aiReviewSummary?.overview ? pr.aiReviewSummary : undefined,
    });
    setPendingPrId(String(pr.id));
    setFindings([]);
    setDiffFiles([]);
    setActiveTab('reviews', { prId: String(pr.id) });
    loadReviewDetail(pr.id);
  };

  // Fallback: also fetch when the review view is opened without a fresh click
  useEffect(() => {
    if (activeTab !== 'reviews' || !selectedPR) return;
    if (lastRequestedIdRef.current === selectedPR.id) return;
    loadReviewDetail(selectedPR.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, selectedPR?.id]);

  // Sync selectedPR if pendingPrId changes (from route navigation or deep link)
  useEffect(() => {
    if (!pendingPrId || pullRequests.length === 0) return;
    const found = pullRequests.find(
      (p) => String(p.id) === String(pendingPrId) || String(p.number) === String(pendingPrId)
    );
    if (found && selectedPR?.id !== found.id) {
      setSelectedPR(found);
      loadReviewDetail(found.id);
    }
  }, [pendingPrId, pullRequests]);

  // Fetch the live PR list once at the app level
  useEffect(() => {
    let cancelled = false;
    setIsLoadingPullRequests(true);

    fetchPullRequestList(authUserId)
      .then((prs) => {
        if (cancelled) return;
        setPullRequests(prs);
        if (prs.length > 0) {
          const matchedByRoute = pendingPrId
            ? prs.find(
                (p) => String(p.id) === String(pendingPrId) || String(p.number) === String(pendingPrId)
              )
            : undefined;
          setSelectedPR((prev) => matchedByRoute ?? prev ?? prs[0]);
        }
      })
      .catch(() => {
        // Empty on failure
      })
      .finally(() => {
        if (!cancelled) setIsLoadingPullRequests(false);
      });

    return () => {
      cancelled = true;
    };
  }, [authUserId]);

  // Pick up changes to the temp user id saved by the PR list view
  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'gobe-user-id') setAuthUserId(getAuthUserId());
    };
    const handleUserChange = () => setAuthUserId(getAuthUserId());

    window.addEventListener('storage', handleStorage);
    window.addEventListener('gobe-user-id-changed', handleUserChange);
    window.addEventListener('user-changed', handleUserChange);
    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('gobe-user-id-changed', handleUserChange);
      window.removeEventListener('user-changed', handleUserChange);
    };
  }, []);

  // Handle Cmd+K (Search) and Ctrl+/ or Cmd+/ (Model Picker) keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd+K / Ctrl+K -> Search Modal
      if ((e.metaKey || e.ctrlKey) && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
        return;
      }

      // Ctrl+/ / Cmd+/ -> Model Picker
      if ((e.metaKey || e.ctrlKey) && (e.key === '/' || e.code === 'Slash' || e.code === 'NumpadDivide')) {
        e.preventDefault();
        e.stopPropagation();

        const customEvent = new CustomEvent('gobe-toggle-model-picker', {
          detail: { handled: false },
        });
        window.dispatchEvent(customEvent);

        // If no visible in-page button was mounted to handle the toggle, open global modal
        if (!customEvent.detail.handled) {
          setIsGlobalModelPickerOpen((prev) => !prev);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown, { capture: true });
    return () => window.removeEventListener('keydown', handleKeyDown, { capture: true });
  }, []);

  // Redirect if currently on try-public tab and it gets switched off
  useEffect(() => {
    if (!isPublicReposTabEnabled() && activeTab === 'try-public') {
      setActiveTab('overview');
    }
    return subscribeToConfigChange(() => {
      if (!isPublicReposTabEnabled() && activeTab === 'try-public') {
        setActiveTab('overview');
      }
    });
  }, [activeTab]);

  const handleDismissFinding = (findingId: string) => {
    setFindings((prev) =>
      prev.map((f) => (f.id === findingId ? { ...f, status: 'dismissed' as const } : f))
    );
  };

  const [reviewCountdown, setReviewCountdown] = useState<number | null>(null);
  const [isCheckingStatus, setIsCheckingStatus] = useState<boolean>(false);
  const countdownTimerRef = useRef<number | null>(null);
  const pollTimerRef = useRef<number | null>(null);

  const startReviewPollingCountdown = (targetPrId: string) => {
    if (countdownTimerRef.current) {
      window.clearInterval(countdownTimerRef.current);
      countdownTimerRef.current = null;
    }
    if (pollTimerRef.current) {
      window.clearInterval(pollTimerRef.current);
      pollTimerRef.current = null;
    }

    setReviewCountdown(30);
    let remainingSeconds = 30;

    countdownTimerRef.current = window.setInterval(() => {
      remainingSeconds -= 1;
      if (remainingSeconds <= 0) {
        if (countdownTimerRef.current) {
          window.clearInterval(countdownTimerRef.current);
          countdownTimerRef.current = null;
        }
        setReviewCountdown(null);

        // Begin polling the server for review completion
        const maxAttempts = 40;
        let attempts = 0;

        pollTimerRef.current = window.setInterval(async () => {
          attempts += 1;
          try {
            const row = await fetchPullRequestReview(targetPrId, authUserId);
            if (row && (row.reviewStatus === 'completed' || row.reviewRawJSON || row.reviewSummary)) {
              if (pollTimerRef.current) {
                window.clearInterval(pollTimerRef.current);
                pollTimerRef.current = null;
              }
              if (lastRequestedIdRef.current !== targetPrId) return;

              const reviewJson = normalizeReviewJSON(row.reviewRawJSON || row.reviewSummary);
              const patch = mapRawReviewToPullRequestPatch(row, reviewJson);
              setSelectedPR((prev) =>
                prev && prev.id === targetPrId ? { ...prev, ...patch, status: 'completed' as const } : prev
              );
              if (reviewJson) {
                setFindings(mapReviewJSONToFindings(reviewJson, targetPrId));
              } else {
                setFindings([]);
              }
              if (row.prDiff) {
                setDiffFiles(parseUnifiedDiff(row.prDiff));
              }
              setIsReviewLoading(false);
              toast.success('AI Review Ready', {
                description: `Review for #${selectedPR?.number || targetPrId} has completed.`,
              });

              fetchPullRequestList(authUserId)
                .then((prs) => {
                  if (prs.length > 0) setPullRequests(prs);
                })
                .catch(() => {});
            } else if (attempts >= maxAttempts) {
              if (pollTimerRef.current) {
                window.clearInterval(pollTimerRef.current);
                pollTimerRef.current = null;
              }
              // Still reviewing: continue polling with fresh countdown
              startReviewPollingCountdown(targetPrId);
            }
          } catch {
            if (attempts >= maxAttempts) {
              if (pollTimerRef.current) {
                window.clearInterval(pollTimerRef.current);
                pollTimerRef.current = null;
              }
              startReviewPollingCountdown(targetPrId);
            }
          }
        }, 3000);
      } else {
        setReviewCountdown(remainingSeconds);
      }
    }, 1000);
  };

  const checkReviewStatusNow = async (prId?: string) => {
    const targetPrId = prId || selectedPR?.id;
    if (!targetPrId || isCheckingStatus) return;

    setIsCheckingStatus(true);

    try {
      const row = await fetchPullRequestReview(targetPrId, authUserId);
      if (row && (row.reviewStatus === 'completed' || row.reviewRawJSON || row.reviewSummary)) {
        if (countdownTimerRef.current) {
          window.clearInterval(countdownTimerRef.current);
          countdownTimerRef.current = null;
        }
        if (pollTimerRef.current) {
          window.clearInterval(pollTimerRef.current);
          pollTimerRef.current = null;
        }
        setReviewCountdown(null);

        if (lastRequestedIdRef.current !== targetPrId) return;

        const reviewJson = normalizeReviewJSON(row.reviewRawJSON || row.reviewSummary);
        const patch = mapRawReviewToPullRequestPatch(row, reviewJson);
        setSelectedPR((prev) =>
          prev && prev.id === targetPrId ? { ...prev, ...patch, status: 'completed' as const } : prev
        );
        if (reviewJson) {
          setFindings(mapReviewJSONToFindings(reviewJson, targetPrId));
        } else {
          setFindings([]);
        }
        if (row.prDiff) {
          setDiffFiles(parseUnifiedDiff(row.prDiff));
        }
        setIsReviewLoading(false);
        toast.success('AI Review Ready', {
          description: `Review for #${selectedPR?.number || targetPrId} is ready.`,
        });

        fetchPullRequestList(authUserId)
          .then((prs) => {
            if (prs.length > 0) setPullRequests(prs);
          })
          .catch(() => {});
      } else {
        // Review not ready yet — notify user and continue polling smoothly
        toast.info('AI Review In Progress', {
          description: 'The review is still generating. Continuing to check in background…',
        });
        startReviewPollingCountdown(targetPrId);
      }
    } catch {
      // Backend error or not ready — continue polling smoothly
      toast.info('AI Review In Progress', {
        description: 'Analysis is still in progress. Continuing to check in background…',
      });
      startReviewPollingCountdown(targetPrId);
    } finally {
      setIsCheckingStatus(false);
    }
  };

  const handleTriggerReview = async (prId?: string) => {
    const isAuthed = localStorage.getItem('showMarketingPopup') === 'false';
    if (!isAuthed) {
      toast.error('Please sign in or create an account to run code reviews');
      setAuthModalMode('signup');
      setIsAuthModalOpen(true);
      return;
    }

    const targetPrId = prId || selectedPR?.id;
    if (!targetPrId) return;

    lastRequestedIdRef.current = targetPrId;
    setIsReviewLoading(true);
    setReviewError(null);

    // Optimistically mark PR as in_progress
    setSelectedPR((prev) =>
      prev && prev.id === targetPrId ? { ...prev, status: 'in_progress' as const } : prev
    );
    setPullRequests((prev) =>
      prev.map((pr) =>
        pr.id === targetPrId ? { ...pr, status: 'in_progress' as const } : pr
      )
    );

    try {
      // 1. Call POST /review/:prId API to start review job
      await triggerPullRequestReview(targetPrId, authUserId);

      // 2. Start polling countdown (30s initial countdown then background polling)
      startReviewPollingCountdown(targetPrId);
    } catch (err) {
      if (lastRequestedIdRef.current === targetPrId) {
        setIsReviewLoading(false);
        setReviewCountdown(null);
        setReviewError(
          err instanceof Error ? err.message : 'Failed to trigger review.'
        );
      }
    }
  };

  const selectedRepo = repositories.find((r) => r.id === selectedRepoId) || null;

  // Standalone Legal Pages (/terms, /privacy-policy, /subprocessors) matching Resend document layout
  if (activeTab === 'terms' || activeTab === 'privacy-policy' || activeTab === 'subprocessors') {
    return (
      <div className="fixed inset-0 overflow-y-auto bg-[#0d1117] text-zinc-100 font-sans antialiased">
        <LegalView
          initialTab={activeTab}
          onBackToDashboard={() => setActiveTab('overview')}
        />
        <AuthModal
          isOpen={isAuthModalOpen}
          onClose={() => {
            setIsAuthModalOpen(false);
            if (['/login', '/signup', '/forgot-password', '/reset-password'].includes(window.location.pathname)) {
              const canonicalUrl = TAB_TO_PATH[activeTab] || '/terms';
              window.history.pushState(null, '', canonicalUrl);
              document.title = TAB_TITLES[activeTab] || 'GoBetter AI';
            }
          }}
          initialMode={authModalMode}
          onModeChange={(mode) => setAuthModalMode(mode)}
          onAuthSuccess={() => {
            setAuthUserId(getAuthUserId());
          }}
        />
        <Toaster
          position="bottom-right"
          theme="dark"
          richColors
          duration={4000}
          closeButton
          swipeDirections={['bottom', 'right']}
          toastOptions={{
            classNames: {
              toast: 'sonner-toast-custom',
              icon: 'sonner-icon-custom',
              title: 'sonner-title-custom',
              description: 'sonner-description-custom',
            },
          }}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-[#16171d] text-zinc-100 font-sans overflow-hidden antialiased">
      <HeaderBar
        currentTab={activeTab}
        selectedRepo={selectedRepo}
        selectedPR={selectedPR}
        repositories={repositories}
        pullRequests={pullRequests}
        findings={findings}
        onSelectPR={openPullRequest}
        onSelectRepo={(id) => {
          setSelectedRepoId(id);
          setActiveTab('repositories');
        }}
        isSidebarCollapsed={isSidebarCollapsed}
        onToggleSidebar={() => setIsSidebarCollapsed((prev) => !prev)}
        onOpenSearch={() => setIsSearchOpen(true)}
        onTabChange={setActiveTab}
        onOpenLanding={() => setIsLandingModalOpen(true)}
        onOpenAuth={(mode) => {
          setAuthModalMode(mode);
          setIsAuthModalOpen(true);
        }}
      />

      <div className="flex flex-1 overflow-hidden min-h-0">
        {/* Sidebar Navigation */}
        <Sidebar
          activeTab={activeTab}
          onTabChange={setActiveTab}
          repositories={repositories}
          selectedRepoId={selectedRepoId}
          onSelectRepo={setSelectedRepoId}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed((prev) => !prev)}
          onSimulateReview={() => handleTriggerReview(selectedPR?.id)}
        />

        {/* View Router */}
        <main className="flex-1 flex flex-col overflow-hidden relative bg-[#0d1117]">
          {!isAuthenticated && (
            <div className="absolute inset-0 z-40 bg-[#0d1117]/85 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center animate-apple-fade select-none">
              <div className="max-w-md w-full bg-[#16171d] border border-[#232530] rounded-2xl p-8 shadow-2xl flex flex-col items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-[#c0f200]/10 flex items-center justify-center border border-[#c0f200]/20 text-[#c0f200]">
                  <GobeAiLogo className="w-7 h-7" variant="brand" />
                </div>
                <div className="space-y-1">
                  <h2 className="text-lg font-semibold text-white">Sign In to Access Workspace</h2>
                  <p className="text-xs text-zinc-400">
                    Sign in or create an account to view code reviews, repositories, and AI diagnostics.
                  </p>
                </div>
                <div className="flex items-center gap-3 w-full mt-2">
                  <button
                    onClick={() => {
                      setAuthModalMode('login');
                      setIsAuthModalOpen(true);
                    }}
                    className="flex-1 py-2.5 rounded-lg border border-[#30363d] bg-[#21262d] hover:bg-[#30363d] text-white text-xs font-semibold transition-all cursor-pointer"
                  >
                    Log In
                  </button>
                  <button
                    onClick={() => {
                      setAuthModalMode('signup');
                      setIsAuthModalOpen(true);
                    }}
                    className="flex-1 py-2.5 rounded-lg bg-[#c0f200] hover:bg-[#d4ff1a] text-black text-xs font-semibold transition-all cursor-pointer shadow-md"
                  >
                    Sign Up
                  </button>
                </div>
                <button
                  onClick={() => setIsLandingModalOpen(true)}
                  className="text-xs text-[#c0f200] hover:underline transition-colors cursor-pointer mt-1"
                >
                  View GoBetter AI Overview
                </button>
              </div>
            </div>
          )}
          <>
              {activeTab === 'overview' && (
                <OverviewDashboard
                  repositories={repositories}
                  pullRequests={pullRequests}
                  findings={findings}
                  activities={activities}
                  isLoading={isLoadingPullRequests}
                  authUserId={authUserId}
                  onSelectPR={setSelectedPR}
                  onNavigateToTab={(tab, filter) => {
                    if (filter) setPrStatusFilter(filter);
                    setActiveTab(tab);
                  }}
                />
              )}

              {activeTab === 'ai-chat' && (
                <AIChatView
                  pullRequests={pullRequests}
                  repositories={repositories}
                  onSelectPR={openPullRequest}
                />
              )}

              {activeTab === 'pull-requests' && (
                <PullRequestsListView
                  pullRequests={pullRequests}
                  onSelectPR={openPullRequest}
                  initialStatusFilter={prStatusFilter}
                  onStatusFilterChange={setPrStatusFilter}
                />
              )}

              {activeTab === 'reviews' && (
                selectedPR ? (
                  <PullRequestReviewView
                    pullRequest={selectedPR}
                    diffFiles={diffFiles}
                    findings={findings}
                    isLoading={isReviewLoading}
                    isCheckingStatus={isCheckingStatus}
                    reviewCountdown={reviewCountdown}
                    onApplyFix={() => {}}
                    onDismissFinding={handleDismissFinding}
                    onReTriggerReview={() => handleTriggerReview(selectedPR?.id)}
                    onCheckStatusNow={() => checkReviewStatusNow(selectedPR?.id)}
                    onBackToPullRequests={() => setActiveTab('pull-requests')}
                  />
                ) : (
                  <div style={{ padding: '60px 20px', textAlign: 'center', color: 'rgba(255,255,255,0.45)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 12 }}>
                    <p style={{ margin: 0, fontSize: 14 }}>No pull request selected</p>
                    <button
                      onClick={() => setActiveTab('pull-requests')}
                      style={{ padding: '6px 14px', borderRadius: 6, fontSize: 12, fontWeight: 600, background: '#c0f200', color: '#0d1117', border: 'none', cursor: 'pointer' }}
                    >
                      Browse Pull Requests
                    </button>
                  </div>
                )
              )}

              {activeTab === 'repositories' && <RepositoriesView repositories={repositories} />}

              {activeTab === 'activity' && <ActivityLogView activities={activities} />}

              {activeTab === 'roadmap' && (
                <RoadmapView onNavigateToTryPublic={() => setActiveTab('try-public')} />
              )}

              {activeTab === 'try-public' && isPublicReposTabEnabled() && (
                <TryPublicRepoView onNavigateToPRs={() => setActiveTab('pull-requests')} />
              )}

              {activeTab === 'byok' && (
                <BYOKKeysView settings={settings} onSaveSettings={setSettings} />
              )}

              {activeTab === 'analytics' && <AnalyticsView />}

              {activeTab === 'settings' && (
                <WorkspaceSettingsView settings={settings} onSaveSettings={setSettings} />
              )}
            </>
        </main>
      </div>

      {/* Code Review Loading Overlay */}
      {isScanning && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm animate-apple-fade">
          <div className="bg-[#16171d] border border-[#232530] rounded-2xl p-8 max-w-md w-full shadow-2xl animate-apple-scale">
            <LoadingState message="CodeRabbit AI Review Running" step={scanStep} />
          </div>
        </div>
      )}

      {/* Global Cmd+K Search Modal */}
      <SearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        findings={findings}
        pullRequests={pullRequests}
        onSelectFinding={() => {
          setActiveTab('reviews');
        }}
      />

      {/* Global Ctrl+/ Model Picker Modal */}
      <GlobalModelPickerModal
        isOpen={isGlobalModelPickerOpen}
        onClose={() => setIsGlobalModelPickerOpen(false)}
      />

      {/* Landing Page Marketing Modal */}
      <LandingModal
        isOpen={isLandingModalOpen}
        onClose={() => {
          const isAuthed = localStorage.getItem('showMarketingPopup') === 'false';
          if (!isAuthed) {
            setAuthModalMode('signup');
            setIsAuthModalOpen(true);
          }
          setIsLandingModalOpen(false);
        }}
        isSidebarCollapsed={isSidebarCollapsed}
        onOpenAuth={(mode) => {
          setAuthModalMode(mode);
          setIsAuthModalOpen(true);
          window.history.pushState({ auth: mode }, '', `/${mode}`);
          document.title = mode === 'login' ? 'Log In | GoBetter AI' : 'Create Account | GoBetter AI';
        }}
      />

      {/* GoBetter Branded Authentication & Signup Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => {
          setIsAuthModalOpen(false);
          const isAuthed = localStorage.getItem('showMarketingPopup') === 'false';
          if (!isAuthed) {
            setIsLandingModalOpen(true);
          }
          if (['/login', '/signup', '/forgot-password', '/reset-password'].includes(window.location.pathname)) {
            const canonicalUrl = TAB_TO_PATH[activeTab] || '/dashboard';
            window.history.pushState(null, '', canonicalUrl);
            document.title = TAB_TITLES[activeTab] || 'GoBetter AI';
          }
        }}
        initialMode={authModalMode}
        onModeChange={(mode) => setAuthModalMode(mode)}
        onAuthSuccess={() => {
          setAuthUserId(getAuthUserId());
          setIsLandingModalOpen(false);
        }}
      />

      {/* Global Animated Tooltip System */}
      <GlobalTooltip />

      {/* Sonner Toast Notification Center */}
      <Toaster
        position="bottom-right"
        theme="dark"
        richColors
        duration={4000}
        closeButton
        swipeDirections={['bottom', 'right']}
        toastOptions={{
          classNames: {
            toast: 'sonner-toast-custom',
            icon: 'sonner-icon-custom',
            title: 'sonner-title-custom',
            description: 'sonner-description-custom',
          },
        }}
      />
    </div>
  );
};
