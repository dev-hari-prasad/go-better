import React, { useState, useRef, useEffect } from 'react';
import { MagnifyingGlassIcon, ArrowDownIcon, ArrowUpIcon } from '@heroicons/react/24/outline';
import { SlidersHorizontal, X, Settings, Table, LayoutList } from 'lucide-react';
import { PullRequest, ReviewStatus } from '../../types/codeReview';
import { Card } from '../ui/Card';

interface PullRequestsListViewProps {
  pullRequests: PullRequest[];
  onSelectPR: (pr: PullRequest) => void;
}

const NvidiaLogoIcon: React.FC<{ className?: string }> = ({ className = "w-3.5 h-3.5" }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={`${className} text-[#76b900] shrink-0`}>
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1.8 14.5v-9l6.5 4.5-6.5 4.5z"/>
  </svg>
);

const getStatusCode = (status: ReviewStatus, prNumber: number) => {
  switch (status) {
    case 'approved':
    case 'completed':
      return {
        code: '200',
        bg: 'bg-[#052e16] text-[#4ade80] border-[#166534]',
        label: 'Review Positive'
      };
    case 'changes_requested':
      if (prNumber === 142) {
        return {
          code: '200',
          bg: 'bg-[#052e16] text-[#4ade80] border-[#166534]',
          label: 'Security Risk Detected'
        };
      }
      return {
        code: '200',
        bg: 'bg-[#052e16] text-[#4ade80] border-[#166534]',
        label: 'Awaiting Response'
      };
    case 'in_progress':
      return {
        code: '200',
        bg: 'bg-[#052e16] text-[#4ade80] border-[#166534]',
        label: 'Reviewing...'
      };
    default:
      return {
        code: '200',
        bg: 'bg-[#052e16] text-[#4ade80] border-[#166534]',
        label: 'Reviewed'
      };
  }
};

const getMockDateString = (createdAtStr: string, prNumber: number) => {
  const timeMap: Record<number, string> = {
    142: 'Aug 13 04:29 PM',
    141: 'Aug 13 04:22 PM',
    140: 'Aug 13 04:17 PM',
    139: 'Aug 13 04:04 PM',
    138: 'Aug 13 04:04 PM',
    137: 'Aug 13 04:03 PM',
    136: 'Aug 13 04:02 PM',
    135: 'Aug 13 03:50 PM',
    134: 'Aug 13 03:49 PM',
    133: 'Aug 13 03:48 PM',
    132: 'Aug 13 03:48 PM',
    131: 'Aug 13 03:47 PM',
  };
  if (timeMap[prNumber]) return timeMap[prNumber];
  return 'Aug 13 03:45 PM';
};

const getMockGenerationId = (prNumber: number) => {
  const genMap: Record<number, string> = {
    142: 'gen-1786618796-D9hN3GwxuyP0S8Ti5rqP',
    141: 'gen-1786618371-XB4ROuOaSASH8JZnR4jZW',
    140: 'gen-1786618062-H8RMSGn8rzs9T06KfcAp',
    139: 'gen-1786617260-AXwH7PEt6rxBzKY20Ngu',
    138: 'gen-1786617242-MV18142p17mJd9nhcY0K',
    137: 'gen-1786617208-gfMJus3hEZ6gUgFajYwH',
    136: 'gen-1786617147-BfmiH9IB8ixgvNnekaUd',
    135: 'gen-1786616404-tTcILDBC3doqy4gKHc2W',
    134: 'gen-1786616383-FO0lrQcb1iqgP1eyapb0',
    133: 'gen-1786616302-STGu0LJOvTcdgFEUfOUs',
    132: 'gen-1786616292-b5wCQw198B76KR2aJLYO',
    131: 'gen-1786616277-ml1v9bfUpWHEIvgpo1XN',
  };
  return genMap[prNumber] || `gen-178661${prNumber}00-x9K0qL2mP8N1`;
};

const getMockLatency = (prNumber: number) => {
  const latencyMap: Record<number, string> = {
    142: '582ms',
    141: '378ms',
    140: '485ms',
    139: '370ms',
    138: '395ms',
    137: '365ms',
    136: '427ms',
    135: '379ms',
    134: '221ms',
    133: '220ms',
    132: '213ms',
    131: '369ms',
  };
  return latencyMap[prNumber] || '350ms';
};

const getMockTimestamp = (prNumber: number) => {
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
      pr.repoFullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      getMockGenerationId(pr.number).toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || pr.status === statusFilter;
    const matchesRepo = selectedRepos.length === 0 || selectedRepos.includes(pr.repoFullName);
    
    return matchesSearch && matchesStatus && matchesRepo;
  });

  const sortedPRs = [...filteredPRs].sort((a, b) => {
    const timeA = getMockTimestamp(a.number);
    const timeB = getMockTimestamp(b.number);
    return sortDirection === 'asc' ? timeA - timeB : timeB - timeA;
  });

  return (
    <div className="p-8 pb-32 space-y-6 overflow-y-auto max-h-[calc(100vh-4rem)] max-w-[1400px] w-full mx-auto animate-apple-fade select-none">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-zinc-100 tracking-tight">Pull Requests</h1>
          <p className="text-sm text-zinc-400 mt-1">Manage automated AI code reviews across active pull requests.</p>
        </div>

        {/* Right side: Search & Filters */}
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto shrink-0">
          {/* View mode switcher */}
          <div className="flex items-center bg-[#16171d] border border-[#2d303d] rounded-lg p-1">
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded text-xs transition-colors cursor-pointer ${
                viewMode === 'table' ? 'bg-[#21262d] text-zinc-100' : 'text-zinc-400 hover:text-zinc-200'
              }`}
              title="Clean Table View"
            >
              <Table className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('cards')}
              className={`p-1.5 rounded text-xs transition-colors cursor-pointer ${
                viewMode === 'cards' ? 'bg-[#21262d] text-zinc-100' : 'text-zinc-400 hover:text-zinc-200'
              }`}
              title="Expanded Cards View"
            >
              <LayoutList className="w-4 h-4" />
            </button>
          </div>

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

      {/* Clean Table (OpenRouter style) */}
      {viewMode === 'table' ? (
        <div className="bg-[#090a0f] border border-[#1c202c] rounded-xl shadow-2xl overflow-hidden text-left">
          {/* Header Row */}
          <div className="hidden lg:grid grid-cols-[140px_180px_130px_1fr_80px_70px_60px_90px_40px] items-center gap-3 px-4 py-3 bg-[#0d0e14] border-b border-[#1c202c] text-[12px] font-sans font-medium text-zinc-400">
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
            <div>Model</div>
            <div>Final Provider</div>
            <div>Generation ID</div>
            <div className="text-center">Status</div>
            <div className="text-center">Attempts</div>
            <div className="text-center">Key</div>
            <div className="text-right">Latency</div>
            <div className="flex justify-end">
              <Settings className="w-3.5 h-3.5 text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer" />
            </div>
          </div>

          {/* Table Body */}
          <div className="divide-y divide-[#151822]">
            {sortedPRs.map((pr) => {
              const dateStr = getMockDateString(pr.createdAt, pr.number);
              const genId = getMockGenerationId(pr.number);
              const latency = getMockLatency(pr.number);
              const statusObj = getStatusCode(pr.status, pr.number);

              return (
                <div
                  key={pr.id}
                  onClick={() => onSelectPR(pr)}
                  className="grid grid-cols-1 lg:grid-cols-[140px_180px_130px_1fr_80px_70px_60px_90px_40px] items-center gap-3 px-4 py-3 hover:bg-[#131622] transition-colors cursor-pointer group"
                >
                  {/* Column 1: Date */}
                  <div className="text-xs font-sans text-zinc-300 whitespace-nowrap">
                    {dateStr}
                  </div>

                  {/* Column 2: Model */}
                  <div className="flex items-center gap-1.5 min-w-0">
                    <NvidiaLogoIcon className="w-3.5 h-3.5 shrink-0" />
                    <span className="text-xs font-semibold text-zinc-200 truncate">
                      Nemotron 3.5 Lightning
                    </span>
                  </div>

                  {/* Column 3: Final Provider */}
                  <div className="flex items-center">
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-[#072412] text-[#4ade80] border border-[#14532d]">
                      <NvidiaLogoIcon className="w-3 h-3 text-[#4ade80]" />
                      NVIDIA
                    </span>
                  </div>

                  {/* Column 4: Generation ID */}
                  <div className="min-w-0 flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-zinc-200 group-hover:text-[#c0f200] transition-colors truncate">
                      {genId}
                    </span>
                  </div>

                  {/* Column 5: Status */}
                  <div className="flex lg:justify-center">
                    <span className={`inline-flex items-center justify-center min-w-[38px] px-2 py-0.5 rounded-full text-[11px] font-mono font-bold border ${statusObj.bg}`}>
                      {statusObj.code}
                    </span>
                  </div>

                  {/* Column 6: Attempts */}
                  <div className="lg:text-center font-mono text-xs text-zinc-400">
                    1
                  </div>

                  {/* Column 7: Key */}
                  <div className="flex lg:justify-center">
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-[#181c26] border border-[#2b3242] text-zinc-300">
                      OR
                    </span>
                  </div>

                  {/* Column 8: Latency */}
                  <div className="lg:text-right font-mono text-xs text-zinc-400">
                    {latency}
                  </div>

                  {/* Column 9: Action Settings */}
                  <div className="flex justify-end">
                    <Settings className="w-3.5 h-3.5 text-zinc-500 group-hover:text-zinc-300 transition-colors" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* Cards View (Alternative View) */
        <Card>
          <div className="divide-y divide-[#282a36]">
            {sortedPRs.map((pr) => (
              <div
                key={pr.id}
                onClick={() => onSelectPR(pr)}
                className="p-5 flex items-center justify-between hover:bg-[#16171d] cursor-pointer transition-colors group"
              >
                <div className="space-y-1.5 min-w-0">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span className="text-sm font-mono font-bold text-zinc-500">#{pr.number}</span>
                    <h3 className="text-[14px] font-semibold text-zinc-200 group-hover:text-[#c0f200] transition-colors truncate">
                      {pr.title}
                    </h3>
                  </div>
                  <div className="flex items-center gap-2.5 text-xs text-zinc-500 font-mono">
                    <span>{pr.repoFullName}</span>
                    <span>•</span>
                    <span className="text-zinc-400">{pr.author.name}</span>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-xs font-mono text-emerald-400 font-bold">+{pr.additions}</span>
                  <span className="text-xs font-mono text-rose-400 font-bold">-{pr.deletions}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
};
