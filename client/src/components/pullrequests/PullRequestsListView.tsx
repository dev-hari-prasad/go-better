import React, { useState, useRef, useEffect } from 'react';
import { CodeBracketSquareIcon, MagnifyingGlassIcon, FunnelIcon, DocumentMagnifyingGlassIcon, PlusIcon, ChevronRightIcon, ChevronDownIcon, ArrowDownIcon, ArrowUpIcon } from '@heroicons/react/24/outline';
import { SlidersHorizontal, X } from 'lucide-react';
import { PullRequest, ReviewStatus } from '../../types/codeReview';
import { Card, CardBody } from '../ui/Card';
import { StatusBadge } from '../ui/Badge';
import { Button } from '../ui/Button';

interface PullRequestsListViewProps {
  pullRequests: PullRequest[];
  onSelectPR: (pr: PullRequest) => void;
}

const getGoBetterStatus = (status: ReviewStatus, prNumber: number) => {
  switch (status) {
    case 'changes_requested':
      if (prNumber === 142) {
        return {
          label: 'Security Risk Detected',
          bg: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
        };
      }
      if (prNumber === 137) {
        return {
          label: 'Critical Blockers Found',
          bg: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
        };
      }
      return {
        label: 'Awaiting Contributor Response',
        bg: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
      };
    case 'approved':
      return {
        label: 'Review Positive',
        bg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
      };
    case 'completed':
      return {
        label: 'Completed',
        bg: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20',
      };
    case 'in_progress':
      return {
        label: 'Reviewing...',
        bg: 'bg-[#c0f200]/10 text-[#c0f200] border-[#c0f200]/20',
      };
    default:
      if (prNumber === 139) {
        return {
          label: 'Awaiting Contributor Response',
          bg: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
        };
      }
      return {
        label: 'Reviewed',
        bg: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
      };
  }
};

const getMockCalendarDate = (createdAtStr: string) => {
  const now = new Date();
  
  if (createdAtStr.includes('hour') || createdAtStr.includes('minute') || createdAtStr.includes('now')) {
    const formatted = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    return { calendar: formatted, relative: createdAtStr };
  }
  
  if (createdAtStr.includes('day')) {
    const match = createdAtStr.match(/(\d+)/);
    const daysAgo = match ? parseInt(match[0], 10) : 1;
    const targetDate = new Date();
    targetDate.setDate(now.getDate() - daysAgo);
    const formatted = targetDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    return { calendar: formatted, relative: createdAtStr };
  }

  return { calendar: 'Aug 10, 2026', relative: createdAtStr };
};

const getMockTimestamp = (createdAtStr: string) => {
  const now = new Date();
  if (createdAtStr.includes('hour') || createdAtStr.includes('minute') || createdAtStr.includes('now')) {
    const match = createdAtStr.match(/(\d+)/);
    const hoursAgo = match ? parseInt(match[0], 10) : 0;
    return now.getTime() - hoursAgo * 60 * 60 * 1000;
  }
  if (createdAtStr.includes('day')) {
    const match = createdAtStr.match(/(\d+)/);
    const daysAgo = match ? parseInt(match[0], 10) : 1;
    return now.getTime() - daysAgo * 24 * 60 * 60 * 1000;
  }
  return now.getTime() - 10 * 24 * 60 * 60 * 1000;
};

export const PullRequestsListView: React.FC<PullRequestsListViewProps> = ({ pullRequests, onSelectPR }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedRepos, setSelectedRepos] = useState<string[]>([]);
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [repoSearchQuery, setRepoSearchQuery] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Extract unique repositories
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
      pr.repoFullName.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || pr.status === statusFilter;
    
    const matchesRepo = selectedRepos.length === 0 || selectedRepos.includes(pr.repoFullName);
    
    return matchesSearch && matchesStatus && matchesRepo;
  });

  const sortedPRs = [...filteredPRs].sort((a, b) => {
    const timeA = getMockTimestamp(a.createdAt);
    const timeB = getMockTimestamp(b.createdAt);
    return sortDirection === 'asc' ? timeA - timeB : timeB - timeA;
  });

  return (
    <div className="p-8 pb-32 space-y-8 overflow-y-auto max-h-[calc(100vh-4rem)] max-w-[1300px] w-full mx-auto animate-apple-fade select-none">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-zinc-100 tracking-tight">Pull Requests</h1>
          <p className="text-sm text-zinc-400 mt-1">Manage automated AI code reviews across active pull requests.</p>
        </div>

        {/* Right side: Search & Custom Dropdown Filter */}
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto shrink-0">
          {/* Search box */}
          <div className="relative w-full sm:w-64">
            <MagnifyingGlassIcon className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search pull requests..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#16171d] border border-[#2d303d] text-zinc-200 text-sm rounded-lg pl-10 pr-4 py-2.5 focus:outline-none focus:border-zinc-500 h-10 font-sans shadow-sm"
            />
          </div>

          {/* Custom Status & Repo Dropdown Popover */}
          <div className="relative w-full sm:w-auto flex items-center" ref={dropdownRef}>
            <div className="relative">
              <button
                onClick={() => setShowFilterDropdown(!showFilterDropdown)}
                className={`flex items-center justify-center bg-[#16171d] border hover:bg-[#21262d] rounded-lg p-2.5 h-10 w-10 focus:outline-none cursor-pointer transition-colors shadow-sm ${
                  statusFilter !== 'all' || selectedRepos.length > 0
                    ? 'text-[#c0f200] border-[#c0f200]/40 bg-[#c0f200]/5'
                    : 'text-zinc-300 border-[#2d303d]'
                }`}
                title="Filters"
              >
                <SlidersHorizontal className="w-4 h-4" />
              </button>

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
                {/* Status Selection */}
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

                {/* Repo Selection (Multi-select) */}
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

      {/* PR Table */}
      <Card>
        <div className="divide-y divide-[#282a36]">
          {/* Header Row for Table */}
          <div className="hidden md:grid grid-cols-[150px_450px_180px_1fr_160px] items-center gap-4 px-5 py-3 bg-[#111216]/50 border-b border-[#2d303d] text-[10px] font-mono font-bold text-zinc-500 uppercase tracking-wider">
            <button
              onClick={() => setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc')}
              className="flex items-center gap-1 hover:text-zinc-300 transition-colors cursor-pointer select-none text-left focus:outline-none"
            >
              <span>Date</span>
              {sortDirection === 'desc' ? (
                <ArrowUpIcon className="w-3 h-3 text-zinc-500" />
              ) : (
                <ArrowDownIcon className="w-3 h-3 text-zinc-500" />
              )}
            </button>
            <div>Pull Request</div>
            <div>Diff Stats</div>
            <div>Go Better Status</div>
            <div className="text-right">Action</div>
          </div>

          {sortedPRs.map((pr) => (
            <div
              key={pr.id}
              onClick={() => onSelectPR(pr)}
              className="openrouter-row grid grid-cols-12 md:grid-cols-[150px_450px_180px_1fr_160px] items-center gap-4 p-5 group cursor-pointer"
            >
              {/* Column 1: Date Info */}
              <div className="col-span-6 md:col-span-1 flex flex-col justify-center">
                {(() => {
                  const dateInfo = getMockCalendarDate(pr.createdAt);
                  return (
                    <>
                      <span className="text-xs font-mono font-medium text-zinc-300">
                        {dateInfo.calendar}
                      </span>
                      <span className="text-[10px] font-mono text-zinc-500 mt-0.5">
                        {dateInfo.relative}
                      </span>
                    </>
                  );
                })()}
              </div>

              {/* Column 2: PR details */}
              <div className="col-span-12 md:col-span-1 space-y-1.5 min-w-0">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <span className="text-sm font-mono font-bold text-zinc-500">#{pr.number}</span>
                  <h3 className="text-[14px] font-semibold text-zinc-200 group-hover:text-[#c0f200] transition-colors truncate">
                    {pr.title}
                  </h3>
                </div>
                <div className="flex items-center gap-2.5 text-xs text-zinc-500 font-mono">
                  <span>{pr.repoFullName}</span>
                  <span className="text-zinc-700">•</span>
                  <div className="flex items-center gap-1.5">
                    <img src={pr.author.avatarUrl} alt={pr.author.name} className="w-3.5 h-3.5 rounded-full" />
                    <span className="text-zinc-400">{pr.author.name}</span>
                  </div>
                </div>
              </div>

              {/* Column 3: Diff Stats */}
              <div className="col-span-6 md:col-span-1 flex items-center gap-1.5 text-xs font-mono">
                <span className="text-emerald-400 font-bold">+{pr.additions}</span>
                <span className="text-rose-400 font-bold">-{pr.deletions}</span>
                <span className="text-zinc-600 text-[10px] ml-1">({pr.changedFilesCount} files)</span>
              </div>

              {/* Column 4: Go Better Status */}
              <div className="col-span-6 md:col-span-1 flex items-center">
                {(() => {
                  const gbStatus = getGoBetterStatus(pr.status, pr.number);
                  return (
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold border whitespace-nowrap shrink-0 ${gbStatus.bg}`}>
                      {gbStatus.label}
                    </span>
                  );
                })()}
              </div>

              {/* Column 5: Action */}
              <div className="col-span-12 md:col-span-1 flex justify-end">
                <button className="px-2.5 py-1.5 rounded-md text-[11px] font-semibold border border-zinc-700 text-zinc-300 hover:text-white hover:border-zinc-500 hover:bg-zinc-800 transition-all flex items-center gap-1 cursor-pointer">
                  Inspect Review
                  <ChevronRightIcon className="w-3 h-3 shrink-0" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};
