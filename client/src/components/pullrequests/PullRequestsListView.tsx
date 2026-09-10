import React, { useState, useRef, useEffect } from 'react';
import { MagnifyingGlassIcon, ArrowDownIcon, ArrowUpIcon } from '@heroicons/react/24/outline';
import { SlidersHorizontal, X, Table, LayoutList, GitPullRequest, ArrowRight, FolderGit2, Sparkles, CheckCircle2, AlertCircle, Clock, ShieldAlert, GitBranch, GitMerge } from 'lucide-react';
import { PullRequest, ReviewStatus } from '../../types/codeReview';
import { fetchPullRequestList, getAuthUserId } from '../../services/pullRequestApi';
import { Card } from '../ui/Card';
import { GitHubDark, GitHubLight } from '@ridemountainpig/svgl-react';
import { useAuth } from '../../context/AuthContext';

interface PullRequestsListViewProps {
  pullRequests: PullRequest[];
  onSelectPR: (pr: PullRequest) => void;
  initialStatusFilter?: string;
  onStatusFilterChange?: (status: string) => void;
}

const getStatusBadge = (status: ReviewStatus) => {
  switch (status) {
    case 'approved':
      return {
        label: 'Approved',
        icon: CheckCircle2,
        bg: 'bg-[#052e16]/80 text-[#4ade80] border-[#166534]',
        dot: 'bg-[#4ade80]',
      };
    case 'changes_requested':
      return {
        label: 'Changes Requested',
        icon: AlertCircle,
        bg: 'bg-[#3f1212]/80 text-[#f87171] border-[#7f1d1d]',
        dot: 'bg-[#f87171]',
      };
    case 'in_progress':
      return {
        label: 'In Progress',
        icon: Clock,
        bg: 'bg-[#172554]/80 text-[#60a5fa] border-[#1e40af]',
        dot: 'bg-[#60a5fa] animate-pulse',
      };
    case 'completed':
      return {
        label: 'Completed',
        icon: CheckCircle2,
        bg: 'bg-[#052e16]/80 text-[#34d399] border-[#047857]',
        dot: 'bg-[#34d399]',
      };
    case 'failed':
      return {
        label: 'Failed',
        icon: AlertCircle,
        bg: 'bg-[#3f1212]/80 text-[#f87171] border-[#7f1d1d]',
        dot: 'bg-[#f87171]',
      };
    default:
      return {
        label: 'Pending',
        icon: Clock,
        bg: 'bg-[#21262d] text-zinc-300 border-[#30363d]',
        dot: 'bg-zinc-400',
      };
  }
};

export const formatRelativeTime = (dateStr: string): string => {
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return '';

  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  const diffInSec = Math.floor(diffInMs / 1000);

  if (diffInSec < 45 && diffInSec >= 0) {
    return 'just now';
  }
  if (diffInSec < 0) {
    return 'just now';
  }

  const diffInMin = Math.floor(diffInSec / 60);
  if (diffInMin < 60) {
    return diffInMin === 1 ? '1 min ago' : `${diffInMin} mins ago`;
  }

  const diffInHours = Math.floor(diffInMin / 60);
  if (diffInHours < 24) {
    return diffInHours === 1 ? '1 hour ago' : `${diffInHours} hours ago`;
  }

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 30) {
    return diffInDays === 1 ? '1 day ago' : `${diffInDays} days ago`;
  }

  const diffInMonths = Math.floor(diffInDays / 30);
  if (diffInMonths < 12) {
    return diffInMonths === 1 ? '1 month ago' : `${diffInMonths} months ago`;
  }

  const diffInYears = Math.floor(diffInDays / 365);
  return diffInYears === 1 ? '1 year ago' : `${diffInYears} years ago`;
};

const formatPRDateTime = (dateStr: string) => {
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return { date: '—', relative: '', time: '' };
  return {
    date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    relative: formatRelativeTime(dateStr),
    time: date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
  };
};

const getPRTimestamp = (pr: PullRequest) => {
  const time = Date.parse(pr.createdAt);
  return Number.isNaN(time) ? 0 : time;
};

/* Branch merge path: source → base, shown as text + icons in one cell */
const BranchCell: React.FC<{ source: string; target: string }> = ({ source, target }) => {
  if (!source && !target) {
    return <span className="text-zinc-600">—</span>;
  }
  return (
    <div className="flex items-center gap-1.5 min-w-0 font-mono text-xs" title={`${source || '?'} → ${target || '?'}`}>
      <GitBranch className="w-3 h-3 text-zinc-500 shrink-0" />
      <span className="text-zinc-300 truncate max-w-[90px]">{source || '?'}</span>
      <GitMerge className="w-3 h-3 text-zinc-500 shrink-0" />
      <ArrowRight className="w-3 h-3 text-zinc-500 shrink-0 -ml-1" />
      <span className="text-zinc-400 truncate max-w-[80px]">{target || '?'}</span>
    </div>
  );
};

const PullRequestTableSkeletonRow: React.FC = () => (
  <div className="grid grid-cols-[85px_56px_minmax(0,1fr)_180px_170px_150px_90px] items-center gap-4 px-4 py-3 bg-[#13151f]">
    {/* Column 1: Date */}
    <div className="flex flex-col gap-1.5">
      <div className="h-3 w-12 rounded skeleton-glare" />
      <div className="h-2 w-14 rounded skeleton-glare opacity-70" />
    </div>

    {/* Column 2: ID */}
    <div className="h-3.5 w-8 rounded skeleton-glare" />

    {/* Column 3: Title */}
    <div className="h-3.5 rounded w-3/4 max-w-md skeleton-glare" />

    {/* Column 4: Repo */}
    <div className="flex items-center gap-1.5">
      <div className="w-3.5 h-3.5 rounded shrink-0 skeleton-glare" />
      <div className="h-3 w-28 rounded skeleton-glare" />
    </div>

    {/* Column 5: Branch */}
    <div className="flex items-center gap-1.5">
      <div className="w-3 h-3 rounded shrink-0 skeleton-glare" />
      <div className="h-3 w-12 rounded skeleton-glare opacity-80" />
      <div className="w-3 h-3 rounded shrink-0 skeleton-glare" />
      <div className="h-3 w-12 rounded skeleton-glare opacity-80" />
    </div>

    {/* Column 6: Status */}
    <div className="h-5 w-20 rounded-full skeleton-glare" />

    {/* Column 7: Action button */}
    <div className="flex justify-end">
      <div className="h-6 w-16 rounded-lg skeleton-glare" />
    </div>
  </div>
);

const PullRequestCardSkeletonRow: React.FC = () => (
  <div className="p-5 grid grid-cols-1 md:grid-cols-[1fr_170px_100px] items-center gap-4 bg-[#13151f]/50">
    <div className="space-y-2 min-w-0">
      <div className="flex items-center gap-2.5">
        <div className="h-3.5 w-8 rounded skeleton-glare" />
        <div className="h-4 w-3/4 max-w-md rounded skeleton-glare" />
      </div>
      <div className="flex items-center gap-3">
        <div className="h-3 w-24 rounded skeleton-glare" />
        <div className="h-3 w-28 rounded skeleton-glare opacity-80" />
        <div className="h-3 w-16 rounded skeleton-glare opacity-60" />
      </div>
    </div>
    <div className="h-5 w-20 rounded-full skeleton-glare" />
    <div className="flex justify-end">
      <div className="h-7 w-20 rounded-lg skeleton-glare" />
    </div>
  </div>
);

export const PullRequestsListView: React.FC<PullRequestsListViewProps> = ({
  pullRequests,
  onSelectPR,
  initialStatusFilter = 'all',
  onStatusFilterChange,
}) => {
  const { isAuthenticated, isGithubConnected, connectGitHub } = useAuth();
  const [apiPullRequests, setApiPullRequests] = useState<PullRequest[] | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [activeUserId, setActiveUserId] = useState<string>(() => getAuthUserId());
  const [userIdInput, setUserIdInput] = useState<string>(() => getAuthUserId());
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>(initialStatusFilter);

  useEffect(() => {
    if (initialStatusFilter) {
      setStatusFilter(initialStatusFilter);
    }
  }, [initialStatusFilter]);

  const updateStatusFilter = (newStatus: string) => {
    setStatusFilter(newStatus);
    onStatusFilterChange?.(newStatus);
  };
  const [selectedRepos, setSelectedRepos] = useState<string[]>([]);
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [repoSearchQuery, setRepoSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [knownRepos, setKnownRepos] = useState<string[]>([]);

  useEffect(() => {
    let cancelled = false;

    setIsLoading(true);

    const debounceTimer = setTimeout(() => {
      fetchPullRequestList({
        userId: activeUserId,
        search: searchQuery,
        reviewStatus: statusFilter,
        repo: selectedRepos,
        order: sortDirection,
      })
        .then((prs) => {
          if (cancelled) return;
          setApiPullRequests(prs);
          setFetchError(null);
          setKnownRepos((prev) => {
            const current = prs.map((pr) => pr.repoFullName);
            return Array.from(new Set([...prev, ...current]));
          });
        })
        .catch((err: Error) => {
          if (cancelled) return;
          setFetchError(err.message || 'Failed to load pull requests.');
        })
        .finally(() => {
          if (!cancelled) setIsLoading(false);
        });
    }, 200);

    return () => {
      cancelled = true;
      clearTimeout(debounceTimer);
    };
  }, [activeUserId, searchQuery, statusFilter, selectedRepos, sortDirection]);

  const handleSaveUserId = () => {
    const trimmed = userIdInput.trim();
    localStorage.setItem('gobe-user-id', trimmed);
    setActiveUserId(trimmed);
    // Notify other views (e.g. App-level PR fetching) in the same tab,
    // since storage events only fire across tabs
    window.dispatchEvent(new Event('gobe-user-id-changed'));
  };

  // Prefer live API data; fall back to the data passed via props when the API is unavailable
  const allPullRequests =
    apiPullRequests && apiPullRequests.length > 0 ? apiPullRequests : pullRequests;

  const uniqueRepos = Array.from(
    new Set([
      ...knownRepos,
      ...allPullRequests.map((pr) => pr.repoFullName),
      ...pullRequests.map((pr) => pr.repoFullName),
    ])
  );

  const statusOptions = [
    { value: 'all', label: 'All Statuses' },
    { value: 'completed', label: 'Completed' },
    { value: 'in_progress', label: 'In Progress' },
    { value: 'pending', label: 'Pending' },
    { value: 'approved', label: 'Approved' },
    { value: 'changes_requested', label: 'Changes Requested' },
    { value: 'failed', label: 'Failed' },
  ];

  const handleToggleRepo = (repoName: string) => {
    setSelectedRepos(prev => 
      prev.includes(repoName)
        ? prev.filter(r => r !== repoName)
        : [...prev, repoName]
    );
  };

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowFilterDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, []);

  const filteredPRs = allPullRequests.filter((pr) => {
    const matchesSearch =
      !searchQuery ||
      pr.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pr.author.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pr.author.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pr.repoFullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pr.number.toString().includes(searchQuery.toLowerCase()) ||
      pr.id.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || pr.status === statusFilter;
    const matchesRepo = selectedRepos.length === 0 || selectedRepos.includes(pr.repoFullName);
    
    return matchesSearch && matchesStatus && matchesRepo;
  });

  const sortedPRs = [...filteredPRs].sort((a, b) => {
    const timeA = getPRTimestamp(a);
    const timeB = getPRTimestamp(b);
    return sortDirection === 'asc' ? timeA - timeB : timeB - timeA;
  });

  return (
    <div className="p-8 pb-32 space-y-6 overflow-y-auto max-h-[calc(100vh-4rem)] max-w-[1400px] w-full mx-auto animate-apple-fade select-none">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-zinc-100 tracking-tight">
            Pull Requests
          </h1>
          <p className="text-sm text-zinc-400 mt-1">Manage and inspect automated AI code reviews across active pull requests.</p>
        </div>

        {/* Right side: Search & Filters */}
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto shrink-0">
          {/* Search box */}
          <div className="relative w-full sm:w-64">
            <MagnifyingGlassIcon className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search pull requests..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#16171d] border border-[#2d303d] text-zinc-200 text-xs rounded-lg pl-8 pr-3 py-1.5 focus:outline-none focus:border-zinc-500 h-8 font-sans shadow-sm"
            />
          </div>

          {/* View mode switcher (Positioned between search and filters) */}
          <div className="h-8 flex items-center bg-[#16171d] border border-[#2d303d] rounded-lg p-0.5">
            <div className="relative group">
              <button
                onClick={() => setViewMode('table')}
                className={`p-1 rounded text-xs transition-colors cursor-pointer flex items-center justify-center ${
                  viewMode === 'table' ? 'bg-[#21262d] text-zinc-100' : 'text-zinc-400 hover:text-zinc-200'
                }`}
                aria-label="Clean Table View"
              >
                <Table className="w-3.5 h-3.5" />
              </button>
              <div className="opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 bg-[#1c202e] text-zinc-200 text-[10px] px-2 py-0.5 rounded shadow-lg whitespace-nowrap border border-[#303648] z-30 font-sans">
                Clean Table View
              </div>
            </div>
            <div className="relative group">
              <button
                onClick={() => setViewMode('cards')}
                className={`p-1 rounded text-xs transition-colors cursor-pointer flex items-center justify-center ${
                  viewMode === 'cards' ? 'bg-[#21262d] text-zinc-100' : 'text-zinc-400 hover:text-zinc-200'
                }`}
                aria-label="Expanded Cards View"
              >
                <LayoutList className="w-3.5 h-3.5" />
              </button>
              <div className="opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 bg-[#1c202e] text-zinc-200 text-[10px] px-2 py-0.5 rounded shadow-lg whitespace-nowrap border border-[#303648] z-30 font-sans">
                Expanded Cards View
              </div>
            </div>
          </div>

          {/* Custom Status & Repo Dropdown Popover */}
          <div className="relative w-full sm:w-auto flex items-center" ref={dropdownRef}>
            <div className="relative group">
              <button
                onClick={() => setShowFilterDropdown(!showFilterDropdown)}
                className={`flex items-center justify-center bg-[#16171d] border hover:bg-[#21262d] rounded-lg h-8 w-8 focus:outline-none cursor-pointer transition-colors shadow-sm ${
                  statusFilter !== 'all' || selectedRepos.length > 0
                    ? 'text-[#c0f200] border-[#c0f200]/40 bg-[#c0f200]/5'
                    : 'text-zinc-300 border-[#2d303d]'
                }`}
                aria-label="Filter by status & repository"
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
              </button>
              <div className="opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 bg-[#1c202e] text-zinc-200 text-[10px] px-2 py-0.5 rounded shadow-lg whitespace-nowrap border border-[#303648] z-30 font-sans">
                Filters
              </div>

              {(statusFilter !== 'all' || selectedRepos.length > 0) && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    updateStatusFilter('all');
                    setSelectedRepos([]);
                    setRepoSearchQuery('');
                  }}
                  className="absolute -top-1 -right-1 flex items-center justify-center bg-[#21262d] hover:bg-[#30363d] text-zinc-400 hover:text-rose-400 border border-[#30363d] hover:border-rose-500/30 rounded-full w-4 h-4 shadow-sm hover:scale-105 transition-all cursor-pointer z-10"
                  title="Clear Filters"
                >
                  <X className="w-2 h-2" />
                </button>
              )}
            </div>

            {showFilterDropdown && (
              <div className="absolute right-0 top-full mt-2 w-64 bg-[#161b22] border border-[#30363d] rounded-xl shadow-2xl p-4 z-50 animate-apple-fade space-y-4 text-left max-h-[350px] overflow-y-auto">
                <div className="space-y-1.5">
                  <span className="text-[9px] font-mono uppercase tracking-wider text-zinc-500 font-semibold block">Review Status</span>
                  <div className="space-y-1">
                    {statusOptions.map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => updateStatusFilter(opt.value)}
                        className={`w-full flex items-center justify-between px-2.5 py-1 text-xs rounded transition-colors cursor-pointer ${
                          statusFilter === opt.value
                            ? 'bg-[#21262d] text-zinc-100 font-semibold'
                            : 'text-zinc-400 hover:bg-[#21262d]/30 hover:text-zinc-200'
                        }`}
                      >
                        <span>{opt.label}</span>
                        {statusFilter === opt.value && (
                          <span className="w-1.5 h-1.5 rounded-full bg-[#c0f200]"></span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5 pt-2 border-t border-[#30363d]/60">
                  <span className="text-[9px] font-mono uppercase tracking-wider text-zinc-500 font-semibold block">Repositories</span>
                  {uniqueRepos.length > 10 && (
                    <input
                      type="text"
                      placeholder="Search repos..."
                      value={repoSearchQuery}
                      onChange={(e) => setRepoSearchQuery(e.target.value)}
                      className="w-full bg-[#0d1117] border border-[#30363d] text-zinc-300 text-[11px] rounded-md px-2 py-1 focus:outline-none focus:border-[#4f4f4f] mb-1.5 font-sans"
                    />
                  )}
                  <div className="space-y-0.5 max-h-[140px] overflow-y-auto pr-1">
                    {uniqueRepos
                      .filter(repoName => repoName.toLowerCase().includes(repoSearchQuery.toLowerCase()))
                      .map((repoName) => {
                        const isSelected = selectedRepos.includes(repoName);
                        return (
                          <button
                            key={repoName}
                            onClick={() => handleToggleRepo(repoName)}
                            className={`w-full flex items-center justify-between px-2 py-1 text-[11px] rounded transition-colors cursor-pointer ${
                              isSelected
                                ? 'bg-[#21262d] text-zinc-100 font-semibold'
                                : 'text-zinc-400 hover:bg-[#21262d]/30 hover:text-zinc-200'
                            }`}
                          >
                            <span className="truncate max-w-[170px]">{repoName}</span>
                            <input
                              type="checkbox"
                              checked={isSelected}
                              readOnly
                              className="w-3 h-3 accent-[#c0f200] pointer-events-none rounded border-[#30363d] focus:ring-0 focus:ring-offset-0 bg-[#0d1117]"
                            />
                          </button>
                        );
                      })}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* GitHub Not Connected Banner */}
      {(isAuthenticated || (typeof window !== 'undefined' && Boolean(localStorage.getItem('user_profile_email') || localStorage.getItem('gobe-user-id') || localStorage.getItem('user_db_id')))) && !isGithubConnected && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-gradient-to-r from-[#161b22] to-[#1c2128] border border-[#30363d] shadow-sm animate-apple-fade">
          <div className="flex items-start sm:items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#21262d] border border-[#30363d] flex items-center justify-center shrink-0 text-zinc-300">
              <GitHubDark className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
                Connect your GitHub account
                <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  Required for automated PRs
                </span>
              </h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                Link your GitHub account to enable automated pull request reviews, repository syncing, and AI-driven PR updates.
              </p>
            </div>
          </div>
          <button
            onClick={connectGitHub}
            className="flex items-center justify-center gap-2 px-3.5 py-2 rounded-lg bg-[#c0f200] hover:bg-[#d2ff3d] text-black text-xs font-semibold transition-all cursor-pointer shadow-sm hover:scale-[1.02] active:scale-[0.98] shrink-0"
          >
            <GitHubLight className="w-3.5 h-3.5 shrink-0" />
            <span>Connect GitHub</span>
          </button>
        </div>
      )}

      {/* API status banner */}
      {fetchError && (
        <div className="flex items-center gap-2 px-4 py-2 rounded-lg border border-amber-500/30 bg-amber-500/5 text-[11px] text-amber-300 font-sans">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>
            Showing cached data — couldn't load pull requests from server ({fetchError})
          </span>
        </div>
      )}

      {/* Clean Table View */}
      {viewMode === 'table' ? (
        <div className="bg-[#13151f] border border-[#262b3a] rounded-xl overflow-hidden text-left">
          <div className="overflow-x-auto">
            <div className="min-w-[1110px]">
              {/* Table Header (Keeps crisp dark header) */}
              <div className="grid grid-cols-[85px_56px_minmax(0,1fr)_180px_170px_150px_90px] items-center gap-4 px-4 py-2.5 bg-[#0e1017] border-b border-[#262b3a] text-[12px] font-sans font-medium text-zinc-400">
                {/* Column 1: Date */}
                <button
                  onClick={() => setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc')}
                  title={sortDirection === 'desc' ? 'Sorted: Newest first (Click for Oldest)' : 'Sorted: Oldest first (Click for Newest)'}
                  className="flex items-center gap-1.5 hover:text-zinc-100 transition-colors cursor-pointer text-left focus:outline-none group/sort"
                >
                  <span className="font-medium text-zinc-300">Date</span>
                  <span className="p-0.5 rounded group-hover/sort:bg-white/5 transition-colors">
                    {sortDirection === 'desc' ? (
                      <ArrowDownIcon className="w-3 h-3 text-[#c0f200]" />
                    ) : (
                      <ArrowUpIcon className="w-3 h-3 text-[#c0f200]" />
                    )}
                  </span>
                </button>

                {/* Column 2: ID */}
                <div>ID</div>

                {/* Column 3: Title */}
                <div>Title</div>

                {/* Column 4: Repo */}
                <div className="pr-2">Repo</div>

                {/* Column 5: Branch */}
                <div>Branch</div>

                {/* Column 6: Status (Left-aligned) */}
                <div>Status</div>

                {/* Column 7: Action */}
                <div className="text-right">Action</div>
              </div>

              {/* Table Body (Clean pleasant dark bg with subtle dividers and hover state) */}
              <div className="divide-y divide-[#1f2433]">
                {isLoading ? (
                  Array.from({ length: 8 }).map((_, i) => (
                    <PullRequestTableSkeletonRow key={`table-skeleton-${i}`} />
                  ))
                ) : sortedPRs.length === 0 ? (
                  <div className="p-12 text-center text-zinc-500 text-sm">
                    No pull requests match the current filters.
                  </div>
                ) : (
                  sortedPRs.map((pr) => {
                    const dateTime = formatPRDateTime(pr.createdAt);
                    const statusObj = getStatusBadge(pr.status);

                    return (
                      <div
                        key={pr.id}
                        onClick={() => onSelectPR(pr)}
                        className="grid grid-cols-[85px_56px_minmax(0,1fr)_180px_170px_150px_90px] items-center gap-4 px-4 py-2.5 bg-[#13151f] hover:bg-[#1c212e] transition-colors cursor-pointer group"
                      >
                        {/* Column 1: Date & Relative Time Stacked */}
                        <div className="flex flex-col justify-center leading-none" title={dateTime.time ? `${dateTime.date} at ${dateTime.time}` : undefined}>
                          <span className="text-xs font-sans text-zinc-300 whitespace-nowrap">{dateTime.date}</span>
                          <span className="text-[10px] font-mono text-zinc-500 mt-1 whitespace-nowrap">{dateTime.relative || dateTime.time}</span>
                        </div>

                        {/* Column 2: ID */}
                        <div className="relative group/id min-w-0">
                          <span className="block font-mono text-xs font-bold text-zinc-400 group-hover:text-zinc-200 transition-colors truncate">
                            #{String(pr.number).slice(0, 3)}..
                          </span>
                          <div className="opacity-0 group-hover/id:opacity-100 transition-opacity pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 bg-[#1c202e] text-zinc-200 text-[10px] px-2 py-0.5 rounded shadow-lg whitespace-nowrap border border-[#303648] z-30 font-sans">
                            #{pr.number}
                          </div>
                        </div>

                        {/* Column 3: Title */}
                        <div className="min-w-0 pr-2">
                          <span className="text-xs font-medium text-zinc-200 group-hover:text-[#c0f200] transition-colors truncate block">
                            {pr.title}
                          </span>
                        </div>

                        {/* Column 4: Repo */}
                        <div className="min-w-0 flex items-center gap-1.5 text-zinc-300 pr-2">
                          <FolderGit2 className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                          <span className="text-xs font-mono truncate" title={pr.repoFullName}>
                            {pr.repoFullName}
                          </span>
                        </div>

                        {/* Column 5: Branch (source → base) */}
                        <div className="min-w-0 pr-2">
                          <BranchCell source={pr.sourceBranch} target={pr.targetBranch} />
                        </div>

                        {/* Column 6: Status (Left-aligned) */}
                        <div className="flex items-center">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-sans font-medium border ${statusObj.bg}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${statusObj.dot}`}></span>
                            <span>{statusObj.label}</span>
                          </span>
                        </div>

                        {/* Column 7: Review Button */}
                        <div className="flex justify-end">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onSelectPR(pr);
                            }}
                            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium bg-[#181c28] text-zinc-200 hover:bg-[#c0f200] hover:text-black border border-[#2d3448] hover:border-[#c0f200] transition-all cursor-pointer shadow-sm group-hover:border-zinc-500"
                          >
                            <span>Review</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Cards View */
        <Card>
          <div className="divide-y divide-[#282a36]">
            {isLoading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <PullRequestCardSkeletonRow key={`card-skeleton-${i}`} />
              ))
            ) : sortedPRs.length === 0 ? (
              <div className="p-12 text-center text-zinc-500 text-sm">
                No pull requests match the current filters.
              </div>
            ) : (
              sortedPRs.map((pr) => {
                const dateTime = formatPRDateTime(pr.createdAt);
                const statusObj = getStatusBadge(pr.status);

                return (
                  <div
                    key={pr.id}
                    onClick={() => onSelectPR(pr)}
                    className="p-5 grid grid-cols-1 md:grid-cols-[1fr_170px_100px] items-center gap-4 hover:bg-[#16171d] cursor-pointer transition-colors group"
                  >
                    {/* Col 1: ID, Title & Metadata */}
                    <div className="space-y-1.5 min-w-0">
                      <div className="flex items-center gap-2.5">
                        <span className="text-sm font-mono font-bold text-zinc-500">#{pr.number}</span>
                        <h3 className="text-[14px] font-semibold text-zinc-200 group-hover:text-[#c0f200] transition-colors truncate">
                          {pr.title}
                        </h3>
                      </div>

                      <div className="flex items-center gap-3 text-xs text-zinc-400 font-sans flex-wrap">
                        <div className="flex items-center gap-1.5 font-mono text-zinc-300">
                          <FolderGit2 className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                          <span>{pr.repoFullName}</span>
                        </div>
                        {(pr.sourceBranch || pr.targetBranch) && (
                          <>
                            <span>•</span>
                            <BranchCell source={pr.sourceBranch} target={pr.targetBranch} />
                          </>
                        )}
                        <span>•</span>
                        <span className="text-zinc-500" title={dateTime.time ? `${dateTime.date} at ${dateTime.time}` : undefined}>
                          {dateTime.date} {dateTime.relative ? `• ${dateTime.relative}` : dateTime.time}
                        </span>
                      </div>
                    </div>

                    {/* Col 2: Status at a fixed dedicated column */}
                    <div className="flex items-center">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-sans font-medium border ${statusObj.bg}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${statusObj.dot}`}></span>
                        <span>{statusObj.label}</span>
                      </span>
                    </div>

                    {/* Col 3: Review Button */}
                    <div className="flex justify-end">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectPR(pr);
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-[#1a202c] text-zinc-200 hover:bg-[#c0f200] hover:text-black border border-[#2d3345] hover:border-[#c0f200] transition-all cursor-pointer shadow-sm"
                      >
                        <span>Review</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </Card>
      )}

      {/* Temporary User ID switcher (dev helper) */}
      <div className="fixed bottom-4 right-4 z-50 flex items-center gap-2 bg-[#16171d]/95 border border-[#2d303d] rounded-lg pl-3 pr-1.5 py-1.5 shadow-xl backdrop-blur">
        <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 whitespace-nowrap">
          Temp User ID
        </span>
        <input
          type="text"
          placeholder="user uuid..."
          value={userIdInput}
          onChange={(e) => setUserIdInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSaveUserId();
          }}
          className="w-52 bg-[#0d1117] border border-[#30363d] text-zinc-300 text-[11px] font-mono rounded-md px-2 py-1 focus:outline-none focus:border-[#c0f200]/60 placeholder:text-zinc-600"
        />
        <button
          onClick={handleSaveUserId}
          disabled={!userIdInput.trim() || userIdInput.trim() === activeUserId}
          className="px-2.5 py-1 rounded-md text-[11px] font-medium bg-[#c0f200] text-black hover:bg-[#d4ff33] disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer whitespace-nowrap"
          title="Save & reload pull requests"
        >
          Apply
        </button>
      </div>
    </div>
  );
};
