import React, { useState, useEffect } from 'react';
import {
  PlusIcon,
  CheckCircleIcon,
  XMarkIcon,
  ChevronDownIcon
} from '@heroicons/react/24/outline';
import { Book, GitBranch, FolderGit2 } from 'lucide-react';
import { Repository } from '../../types/codeReview';
import { Popover } from '../ui/Popover';
import { Button } from '../ui/Button';

interface RepositoriesViewProps {
  repositories: Repository[];
}

export const RepositoriesView: React.FC<RepositoriesViewProps> = ({ repositories: initialRepos }) => {
  const [repos, setRepos] = useState<Repository[]>(initialRepos);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newRepoName, setNewRepoName] = useState('');
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const [openBranchDropdownId, setOpenBranchDropdownId] = useState<string | null>(null);
  const [repoBranchTriggers, setRepoBranchTriggers] = useState<Record<string, 'All branches' | 'Default branch' | 'Protected branches'>>({});

  useEffect(() => {
    const handleCloseAllDropdowns = () => {
      setOpenDropdownId(null);
      setOpenBranchDropdownId(null);
    };
    document.addEventListener('click', handleCloseAllDropdowns);
    return () => document.removeEventListener('click', handleCloseAllDropdowns);
  }, []);

  const toggleAutoReview = (repoId: string) => {
    setRepos((prev) =>
      prev.map((r) => (r.id === repoId ? { ...r, autoReviewEnabled: !r.autoReviewEnabled } : r))
    );
  };

  const setReviewMode = (repoId: string, mode: 'Auto' | 'Quick' | 'Focused' | 'Deep Dive') => {
    setRepos((prev) =>
      prev.map((r) => (r.id === repoId ? { ...r, reviewMode: mode } : r))
    );
    setOpenDropdownId(null);
  };

  const setBranchTrigger = (repoId: string, trigger: 'All branches' | 'Default branch' | 'Protected branches') => {
    setRepoBranchTriggers((prev) => ({ ...prev, [repoId]: trigger }));
    setOpenBranchDropdownId(null);
  };

  const handleAddRepository = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRepoName.trim()) return;

    const ownerName = newRepoName.includes('/') ? newRepoName.split('/')[0] : 'acme-corp';
    const repoName = newRepoName.includes('/') ? newRepoName.split('/')[1] : newRepoName;

    const newRepo: Repository = {
      id: `repo-${Date.now()}`,
      name: repoName,
      owner: ownerName,
      fullName: newRepoName.includes('/') ? newRepoName : `acme-corp/${newRepoName}`,
      defaultBranch: 'main',
      isPrivate: false,
      autoReviewEnabled: true,
      activePullRequestsCount: 0,
      openFindingsCount: 0,
      lastSyncedAt: 'Just now',
      provider: 'github',
    };

    setRepos([newRepo, ...repos]);
    setNewRepoName('');
    setIsAddModalOpen(false);
  };

  return (
    <div className="p-8 pb-32 space-y-6 overflow-y-auto max-h-[calc(100vh-4rem)] max-w-[1400px] w-full mx-auto animate-apple-fade select-none">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-zinc-100 tracking-tight">Connected Repositories</h1>
          <p className="text-sm text-zinc-400 mt-1">Manage repository integrations and automated AI code review settings.</p>
        </div>

        {/* Right side: Connect button */}
        <div className="flex items-center shrink-0">
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#1a202c] text-zinc-200 hover:bg-[#c0f200] hover:text-black border border-[#2e3648] hover:border-[#c0f200] transition-all duration-150 shadow-sm cursor-pointer h-8 whitespace-nowrap"
          >
            <PlusIcon className="w-3.5 h-3.5" />
            <span>Connect Repository</span>
          </button>
        </div>
      </div>

      {/* Clean Table View */}
      <div className="bg-[#13151f] border border-[#262b3a] rounded-xl overflow-hidden text-left">
        <div className="overflow-x-auto">
          <div className="min-w-[800px]">
            {/* Table Header */}
            <div className="grid grid-cols-[1fr_200px_150px_160px] items-center gap-4 px-5 py-2.5 bg-[#0e1017] border-b border-[#262b3a] text-[12px] font-sans font-medium text-zinc-400">
              <div>Repository</div>
              <div>Target Branches</div>
              <div>Auto Review</div>
              <div>Review Mode</div>
            </div>

            {/* Table Body */}
            <div className="divide-y divide-[#1f2433]">
              {repos.length === 0 ? (
                <div className="p-12 text-center text-zinc-500 text-sm">
                  No repositories connected yet.
                </div>
              ) : (
                repos.map((repo) => {
                  const isDropdownOpen = openDropdownId === repo.id || openBranchDropdownId === repo.id;

                  return (
                    <div
                      key={repo.id}
                      className="grid grid-cols-[1fr_200px_150px_160px] items-center gap-4 px-5 py-3 bg-[#13151f] hover:bg-[#1c212e] transition-colors group"
                      style={{
                        position: 'relative',
                        zIndex: isDropdownOpen ? 30 : 1,
                      }}
                    >
                      {/* Column 1: Repository */}
                      <div className="flex items-center gap-3 min-w-0 pr-4">
                        <div className="p-2 rounded-lg bg-[#1a1e2a] text-[#c0f200] border border-[#283042] shrink-0">
                          <FolderGit2 className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <h3 className="text-xs font-semibold text-zinc-200 group-hover:text-[#c0f200] transition-colors truncate">
                            {repo.name}
                          </h3>
                          <p className="text-[11px] text-zinc-500 font-mono truncate mt-0.5">
                            {repo.fullName}
                          </p>
                        </div>
                      </div>

                      {/* Column 2: Target Branches */}
                      <div className="flex items-center gap-1.5 relative text-[11px] font-mono text-zinc-300">
                        <GitBranch className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                        <Popover
                          isOpen={openBranchDropdownId === repo.id}
                          onClose={() => setOpenBranchDropdownId(null)}
                          width="w-44"
                          align="left"
                          trigger={
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setOpenDropdownId(null);
                                setOpenBranchDropdownId(openBranchDropdownId === repo.id ? null : repo.id);
                              }}
                              className="hover:text-zinc-100 cursor-pointer flex items-center gap-1 border-b border-dashed border-zinc-600 pb-0.5 transition-colors"
                            >
                              <span>{repoBranchTriggers[repo.id] || 'All branches'}</span>
                              <ChevronDownIcon className="w-2.5 h-2.5 text-zinc-500" />
                            </button>
                          }
                          content={
                            <>
                              <div className="px-2 py-1 text-[9px] font-semibold text-zinc-500 uppercase tracking-widest border-b border-[#30363d] mb-1">
                                Trigger Target
                              </div>
                              {(['All branches', 'Default branch', 'Protected branches'] as const).map((trigger) => (
                                <div
                                  key={trigger}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setBranchTrigger(repo.id, trigger);
                                    setOpenBranchDropdownId(null);
                                  }}
                                  className={`flex flex-col px-2 py-1.5 rounded text-xs cursor-pointer ${
                                    (repoBranchTriggers[repo.id] || 'All branches') === trigger
                                      ? 'bg-[#21262d] text-zinc-100 font-semibold'
                                      : 'text-zinc-400 hover:bg-[#21262d] hover:text-zinc-200'
                                  }`}
                                >
                                  <span className="font-semibold">{trigger}</span>
                                  <span className="text-[9px] mt-0.5 opacity-60 leading-normal font-sans font-normal">
                                    {trigger === 'All branches' && 'Run review on any branch.'}
                                    {trigger === 'Default branch' && 'Only target main or master.'}
                                    {trigger === 'Protected branches' && 'Target main, develop, release/*.'}
                                  </span>
                                </div>
                              ))}
                            </>
                          }
                        />
                      </div>

                      {/* Column 3: Auto Review Toggle */}
                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleAutoReview(repo.id);
                          }}
                          className={`relative inline-flex h-4 w-7 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                            repo.autoReviewEnabled ? 'bg-[#c0f200]' : 'bg-zinc-800'
                          }`}
                        >
                          <span
                            className={`inline-block h-3 w-3 transform rounded-full bg-black shadow-xs transition duration-200 ease-in-out ${
                              repo.autoReviewEnabled ? 'translate-x-3' : 'translate-x-0'
                            }`}
                          />
                        </button>
                        <span className="text-[11px] font-sans text-zinc-400">
                          {repo.autoReviewEnabled ? 'Enabled' : 'Disabled'}
                        </span>
                      </div>

                      {/* Column 4: Review Mode Dropdown */}
                      <div className="relative">
                        <Popover
                          isOpen={openDropdownId === repo.id}
                          onClose={() => setOpenDropdownId(null)}
                          width="w-48"
                          align="left"
                          trigger={
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setOpenBranchDropdownId(null);
                                setOpenDropdownId(openDropdownId === repo.id ? null : repo.id);
                              }}
                              disabled={!repo.autoReviewEnabled}
                              className={`flex items-center justify-between gap-2 px-2.5 py-1 bg-[#161a24] border border-[#283042] hover:border-zinc-500 rounded-md text-[11px] font-medium transition-colors w-28 shadow-sm ${
                                !repo.autoReviewEnabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                              }`}
                            >
                              <span className={`truncate ${repo.autoReviewEnabled ? 'text-zinc-200' : 'text-zinc-500'}`}>
                                {repo.autoReviewEnabled ? (repo.reviewMode || 'Auto') : 'OFF'}
                              </span>
                              <ChevronDownIcon className="w-3 h-3 text-zinc-500" />
                            </button>
                          }
                          content={
                            <>
                              <div className="px-2 py-1.5 text-[10px] font-semibold text-zinc-500 uppercase tracking-widest border-b border-[#30363d] mb-1">
                                Review Mode
                              </div>
                              {(['Auto', 'Quick', 'Focused', 'Deep Dive'] as const).map(mode => (
                                <div
                                  key={mode}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setReviewMode(repo.id, mode as any);
                                    setOpenDropdownId(null);
                                  }}
                                  className={`flex flex-col px-2 py-1.5 rounded text-xs cursor-pointer ${
                                    (repo.reviewMode || 'Auto') === mode ? 'bg-[#21262d] text-zinc-100' : 'text-zinc-400 hover:bg-[#21262d] hover:text-zinc-200'
                                  }`}
                                >
                                  <div className="flex items-center justify-between gap-1">
                                    <span className="font-semibold">{mode}</span>
                                    {mode === 'Auto' && (
                                      <span className="text-[9px] font-mono px-1.5 py-0.5 bg-[#c0f200]/15 text-[#c0f200] border border-[#c0f200]/30 rounded font-medium">
                                        Suggested
                                      </span>
                                    )}
                                  </div>
                                  <span className="text-[9px] mt-0.5 opacity-70">
                                    {mode === 'Auto' && 'AI determines depth based on PR size.'}
                                    {mode === 'Quick' && 'Fast surface-level linting & basic checks.'}
                                    {mode === 'Focused' && 'Balanced review of logic & style.'}
                                    {mode === 'Deep Dive' && 'Deep architectural & security analysis.'}
                                  </span>
                                </div>
                              ))}
                            </>
                          }
                        />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Connect Repository Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-apple-fade">
          <div className="bg-[#16171d] border border-[#232530] rounded-2xl max-w-md w-full p-6 space-y-5 shadow-2xl animate-apple-scale">
            <div className="flex items-center justify-between border-b border-[#232530] pb-4">
              <h3 className="text-base font-bold text-zinc-100">Connect Repository</h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-zinc-400 hover:text-zinc-200 p-1 rounded-md"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddRepository} className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-zinc-200">
                  Repository Name (Org/Repo)
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. acme-corp/api-gateway"
                  value={newRepoName}
                  onChange={(e) => setNewRepoName(e.target.value)}
                  className="w-full bg-[#0d1117] border border-[#232530] rounded-lg px-4 py-2.5 text-xs text-zinc-200 font-mono focus:outline-none focus:border-zinc-500"
                />
              </div>

              <div className="p-3 bg-[#0d1117] border border-[#232530] rounded-lg text-xs text-zinc-400 space-y-1">
                <p className="font-semibold text-zinc-200">Automated Webhook Integration</p>
                <p>CodeRabbit will automatically install PR webhooks and run reviews on new commits.</p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsAddModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  leftIcon={<CheckCircleIcon className="w-4 h-4 text-black" />}
                >
                  Connect & Enable
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
