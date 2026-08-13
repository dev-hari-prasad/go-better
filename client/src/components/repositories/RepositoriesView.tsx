import React, { useState, useEffect } from 'react';
import {
  MagnifyingGlassIcon,
  PlusIcon,
  ArrowPathIcon,
  AdjustmentsHorizontalIcon,
  CheckCircleIcon,
  CodeBracketIcon,
  ShieldCheckIcon,
  ChevronRightIcon,
  XMarkIcon,
  ChevronDownIcon
} from '@heroicons/react/24/outline';
import { Book, GitBranch } from 'lucide-react';
import { Repository } from '../../types/codeReview';
import { Card, CardHeader, CardBody } from '../ui/Card';
import { Popover } from '../ui/Popover';
import { Button } from '../ui/Button';

interface RepositoriesViewProps {
  repositories: Repository[];
}

export const RepositoriesView: React.FC<RepositoriesViewProps> = ({ repositories: initialRepos }) => {
  const [repos, setRepos] = useState<Repository[]>(initialRepos);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newRepoName, setNewRepoName] = useState('');
  const [isSyncingAll, setIsSyncingAll] = useState(false);
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const [openBranchDropdownId, setOpenBranchDropdownId] = useState<string | null>(null);
  const [repoBranchTriggers, setRepoBranchTriggers] = useState<Record<string, 'All branches' | 'Default branch' | 'Protected branches'>>({});

  useEffect(() => {
    const handleCloseAllDropdowns = () => {
      setOpenDropdownId(null);
      setOpenBranchDropdownId(null);
    };
    window.addEventListener('click', handleCloseAllDropdowns);
    return () => window.removeEventListener('click', handleCloseAllDropdowns);
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

  const handleSyncAll = () => {
    setIsSyncingAll(true);
    setTimeout(() => setIsSyncingAll(false), 1500);
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
      lastSyncedAt: new Date().toISOString(),
      provider: 'github',
    };

    setRepos([newRepo, ...repos]);
    setNewRepoName('');
    setIsAddModalOpen(false);
  };



  return (
    <div className="p-8 space-y-8 overflow-y-auto max-h-[calc(100vh-3rem)] max-w-[1300px] w-full mx-auto animate-apple-fade select-none">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-zinc-100 tracking-tight">Connected Repositories</h1>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto shrink-0">
          <Button
            variant="outline"
            size="sm"
            leftIcon={<PlusIcon className="w-4 h-4" />}
            onClick={() => setIsAddModalOpen(true)}
          >
            Add Repository
          </Button>
        </div>
      </div>

      {/* Repository List */}
      <div className="flex flex-col gap-2">
        {repos.map((repo) => {
          const isDropdownOpen = openDropdownId === repo.id || openBranchDropdownId === repo.id;
          return (
            <div
              key={repo.id}
              className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-[#16171d] border border-[#232530] rounded-xl hover:border-zinc-500 transition-colors cursor-pointer gap-4"
              style={{
                position: 'relative',
                zIndex: isDropdownOpen ? 30 : 1,
              }}
            >
            {/* Left: Icon & Name */}
            <div className="flex items-center gap-3 w-full sm:w-1/3 min-w-0">
              <div className="p-2 rounded-lg bg-[#232530] text-[#c0f200] border border-zinc-700/60 shrink-0">
                <Book className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <h3 className="text-[13px] font-bold text-zinc-100 truncate">{repo.name}</h3>
                <p className="text-[11px] text-zinc-400 font-mono truncate mt-0.5">{repo.fullName}</p>
              </div>
            </div>

            {/* Middle: Stats */}
            <div className="flex items-center sm:justify-center gap-6 text-[11px] font-mono text-zinc-400 w-full sm:w-1/3">
              <div className="flex items-center gap-1.5">
                <CodeBracketIcon className="w-4 h-4 text-zinc-500" />
                <span><strong className="text-zinc-200">{repo.defaultBranch}</strong></span>
              </div>
              <div className="flex items-center gap-1.5">
                <ShieldCheckIcon className="w-4 h-4 text-zinc-500" />
                <span><strong className="text-[#c0f200]">{repo.activePullRequestsCount}</strong> PRs</span>
              </div>
              <div className="flex items-center gap-1.5 relative">
                <GitBranch className="w-3.5 h-3.5 text-zinc-500" />
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
                      className="hover:text-zinc-200 cursor-pointer flex items-center gap-1 border-b border-dashed border-zinc-600 pb-0.5 transition-colors"
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
            </div>

            {/* Right: Actions */}
            <div className="flex items-center justify-between sm:justify-end gap-5 w-full sm:w-1/3 shrink-0">
              <div className="flex items-center gap-3">
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
                <div className="relative">
                  <Popover
                    isOpen={openDropdownId === repo.id}
                    onClose={() => setOpenDropdownId(null)}
                    width="w-48"
                    align="right"
                    trigger={
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenBranchDropdownId(null);
                          setOpenDropdownId(openDropdownId === repo.id ? null : repo.id);
                        }}
                        disabled={!repo.autoReviewEnabled}
                        className={`flex items-center justify-between gap-2 px-2.5 py-1.5 bg-[#111216] border border-[#232530] hover:border-zinc-500 rounded-md text-[11px] font-medium transition-colors w-24 shadow-sm ${
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
                            <span className="font-semibold">{mode}</span>
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
            </div>
          </div>
          );
        })}
      </div>

      {/* Add Repository Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-apple-fade">
          <div className="bg-[#16171d] border border-[#232530] rounded-2xl max-w-md w-full p-6 space-y-5 shadow-2xl animate-apple-scale">
            <div className="flex items-center justify-between border-b border-[#232530] pb-4">
              <h3 className="text-base font-bold text-zinc-100">Add Repository</h3>
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
