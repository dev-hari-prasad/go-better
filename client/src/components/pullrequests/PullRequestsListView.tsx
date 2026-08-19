import React, { useState, useRef, useEffect } from 'react';
import { MagnifyingGlassIcon, ArrowDownIcon, ArrowUpIcon } from '@heroicons/react/24/outline';
import { SlidersHorizontal, X, Table, LayoutList, GitPullRequest, ArrowRight, FolderGit2, Sparkles, CheckCircle2, AlertCircle, Clock, ShieldAlert } from 'lucide-react';
import { PullRequest, ReviewStatus } from '../../types/codeReview';
import { Card } from '../ui/Card';

interface PullRequestsListViewProps {
  pullRequests: PullRequest[];
  onSelectPR: (pr: PullRequest) => void;
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
    default:
      return {
        label: 'Pending',
        icon: Clock,
        bg: 'bg-[#21262d] text-zinc-300 border-[#30363d]',
        dot: 'bg-zinc-400',
      };
  }
};

const formatPRDateTime = (dateStr: string, prNumber: number) => {
  const timeMap: Record<number, { date: string; time: string }> = {
    142: { date: 'Aug 13', time: '04:29 PM' },
    141: { date: 'Aug 13', time: '04:22 PM' },
    140: { date: 'Aug 13', time: '04:17 PM' },
    139: { date: 'Aug 13', time: '04:04 PM' },
    138: { date: 'Aug 13', time: '04:04 PM' },
    137: { date: 'Aug 13', time: '04:03 PM' },
    136: { date: 'Aug 13', time: '04:02 PM' },
    135: { date: 'Aug 13', time: '03:50 PM' },
    134: { date: 'Aug 13', time: '03:49 PM' },
    133: { date: 'Aug 13', time: '03:48 PM' },
    132: { date: 'Aug 13', time: '03:48 PM' },
    131: { date: 'Aug 13', time: '03:47 PM' },
  };
  if (timeMap[prNumber]) return timeMap[prNumber];
  return { date: 'Aug 13', time: '03:45 PM' };
};

const getPRTimestamp = (prNumber: number) => {
  return 1000 - prNumber;
};

export const PullRequestsListView: React.FC<PullRequestsListViewProps> = ({ pullRequests, onSelectPR }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedRepos, setSelectedRepos] = useState<string[]>([]);
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [repoSearchQuery, setRepoSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const dropdownRef = useRef<HTMLDivElement>(null);

  const uniqueRepos = Array.from(new Set(pullRequests.map(pr => pr.repoFullName)));

  const statusOptions = [
    { value: 'all', label: 'All Statuses' },
    { value: 'changes_requested', label: 'Changes Requested' },
    { value: 'approved', label: 'Approved' },
    { value: 'in_progress', label: 'In Progress' }
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

  const filteredPRs = pullRequests.filter((pr) => {
    const matchesSearch =
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
    const timeA = getPRTimestamp(a.number);
    const timeB = getPRTimestamp(b.number);
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
                title="Clean Table View"
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
                title="Expanded Cards View"
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
                title="Filter by status & repository"
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
                    setStatusFilter('all');
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
                  <span className="text-[9px] font-mono uppercase tracking-wider text-zinc-500 font-semibold block">Status</span>
                  <div className="space-y-1">
                    {statusOptions.map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => setStatusFilter(opt.value)}
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

      {/* Clean Table View */}
      {viewMode === 'table' ? (
        <div className="bg-[#13151f] border border-[#262b3a] rounded-xl overflow-hidden text-left">
          <div className="overflow-x-auto">
            <div className="min-w-[960px]">
              {/* Table Header (Keeps crisp dark header) */}
              <div className="grid grid-cols-[85px_60px_1fr_210px_120px_150px_90px] items-center gap-4 px-4 py-2.5 bg-[#0e1017] border-b border-[#262b3a] text-[12px] font-sans font-medium text-zinc-400">
                {/* Column 1: Date */}
                <button
                  onClick={() => setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc')}
                  className="flex items-center gap-1 hover:text-zinc-200 transition-colors cursor-pointer text-left focus:outline-none"
                >
                  <span>Date</span>
                  {sortDirection === 'desc' ? (
                    <ArrowUpIcon className="w-3 h-3 text-zinc-500" />
                  ) : (
                    <ArrowDownIcon className="w-3 h-3 text-zinc-500" />
                  )}
                </button>

                {/* Column 2: ID */}
                <div>ID</div>

                {/* Column 3: Title */}
                <div>Title</div>

                {/* Column 4: Repo */}
                <div className="pr-4">Repo</div>

                {/* Column 5: Diff */}
                <div className="pl-4">Diff</div>

                {/* Column 6: Status (Left-aligned) */}
                <div>Status</div>

                {/* Column 7: Action */}
                <div className="text-right">Action</div>
              </div>

              {/* Table Body (Clean pleasant dark bg with subtle dividers and hover state) */}
              <div className="divide-y divide-[#1f2433]">
                {sortedPRs.length === 0 ? (
                  <div className="p-12 text-center text-zinc-500 text-sm">
                    No pull requests match the current filters.
                  </div>
                ) : (
                  sortedPRs.map((pr) => {
                    const dateTime = formatPRDateTime(pr.createdAt, pr.number);
                    const statusObj = getStatusBadge(pr.status);

                    return (
                      <div
                        key={pr.id}
                        onClick={() => onSelectPR(pr)}
                        className="grid grid-cols-[85px_60px_1fr_210px_120px_150px_90px] items-center gap-4 px-4 py-2.5 bg-[#13151f] hover:bg-[#1c212e] transition-colors cursor-pointer group"
                      >
                        {/* Column 1: Date & Time Stacked */}
                        <div className="flex flex-col justify-center leading-none">
                          <span className="text-xs font-sans text-zinc-300 whitespace-nowrap">{dateTime.date}</span>
                          <span className="text-[10px] font-mono text-zinc-500 mt-1 whitespace-nowrap">{dateTime.time}</span>
                        </div>

                        {/* Column 2: ID */}
                        <div className="font-mono text-xs font-bold text-zinc-400 group-hover:text-zinc-200 transition-colors">
                          #{pr.number}
                        </div>

                        {/* Column 3: Title */}
                        <div className="min-w-0 pr-2">
                          <span className="text-xs font-medium text-zinc-200 group-hover:text-[#c0f200] transition-colors truncate block">
                            {pr.title}
                          </span>
                        </div>

                        {/* Column 4: Repo */}
                        <div className="min-w-0 flex items-center gap-1.5 text-zinc-300 pr-4">
                          <FolderGit2 className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                          <span className="text-xs font-mono truncate" title={pr.repoFullName}>
                            {pr.repoFullName}
                          </span>
                        </div>

                        {/* Column 5: Diff */}
                        <div className="flex items-center gap-2 font-mono text-xs pl-4">
                          <span className="text-emerald-400 font-semibold">+{pr.additions}</span>
                          <span className="text-rose-400 font-semibold">-{pr.deletions}</span>
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
            {sortedPRs.length === 0 ? (
              <div className="p-12 text-center text-zinc-500 text-sm">
                No pull requests match the current filters.
              </div>
            ) : (
              sortedPRs.map((pr) => {
                const dateTime = formatPRDateTime(pr.createdAt, pr.number);
                const statusObj = getStatusBadge(pr.status);

                return (
                  <div
                    key={pr.id}
                    onClick={() => onSelectPR(pr)}
                    className="p-5 grid grid-cols-1 md:grid-cols-[1fr_170px_100px_100px] items-center gap-4 hover:bg-[#16171d] cursor-pointer transition-colors group"
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
                        <span>•</span>
                        <span className="text-zinc-500">{dateTime.date} {dateTime.time}</span>
                      </div>
                    </div>

                    {/* Col 2: Status at a fixed dedicated column */}
                    <div className="flex items-center">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-sans font-medium border ${statusObj.bg}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${statusObj.dot}`}></span>
                        <span>{statusObj.label}</span>
                      </span>
                    </div>

                    {/* Col 3: Diff */}
                    <div className="flex items-center gap-2 font-mono text-xs">
                      <span className="text-emerald-400 font-semibold">+{pr.additions}</span>
                      <span className="text-rose-400 font-semibold">-{pr.deletions}</span>
                    </div>

                    {/* Col 4: Review Button */}
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
    </div>
  );
};
