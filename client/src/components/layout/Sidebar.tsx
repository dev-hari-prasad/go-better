import React, { useState } from 'react';
import {
  HomeIcon,
  KeyIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
  PencilSquareIcon,
  MapIcon,
} from '@heroicons/react/24/outline';
import { GitPullRequest, Book, RotateCw, Info } from 'lucide-react';
import { GitFork, UserPlus } from '@phosphor-icons/react';
import { GobeAiLogo } from '../ui/GobeAiLogo';
import { GitHubDark } from '@ridemountainpig/svgl-react';
import { Repository } from '../../types/codeReview';
import { ProfileEditModal } from '../settings/ProfileEditModal';
import { UserAvatar } from '../ui/UserAvatar';
import { AvatarStyleId } from '../../utils/avatarUtils';
import { isPublicReposTabEnabled, subscribeToConfigChange } from '../../config/clientConfig';
import { fetchUserUsage, UsageData } from '../../services/usageApi';
import { logout } from '../../services/authApi';
import { toast } from 'sonner';
import { useAuth } from '../../context/AuthContext';

import { NavTab, TAB_TO_PATH } from '../../router/routes';
export type { NavTab };

interface SidebarProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  repositories?: Repository[];
  selectedRepoId?: string;
  onSelectRepo?: (repoId: string) => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  onSimulateReview?: () => void;
  isScanning?: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onTabChange,
  repositories = [],
  selectedRepoId,
  onSelectRepo,
  isCollapsed = false,
  onToggleCollapse,
  onSimulateReview,
  isScanning = false,
}) => {
  const { isAuthenticated, isGithubConnected, githubProfile, connectGitHub } = useAuth();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [userName, setUserName] = useState(() => localStorage.getItem('user_profile_name') || 'Alex Mercer');
  const [userEmail, setUserEmail] = useState(() => localStorage.getItem('user_profile_email') || 'alexmercer@acme.io');
  const [avatarStyleId, setAvatarStyleId] = useState<AvatarStyleId>(() => (localStorage.getItem('user_avatar_style') as AvatarStyleId) || 'gradient-smooth');
  const [publicReposEnabled, setPublicReposEnabled] = useState(isPublicReposTabEnabled);
  const [usage, setUsage] = useState<UsageData | null>(null);
  const [isRefreshingUsage, setIsRefreshingUsage] = useState<boolean>(false);

  const loadUsage = React.useCallback(async () => {
    setIsRefreshingUsage(true);
    try {
      const data = await fetchUserUsage();
      setUsage(data);
    } catch (err) {
      console.warn('Failed to fetch usage:', err);
    } finally {
      setIsRefreshingUsage(false);
    }
  }, []);

  // Fetch usage only on initial page reload / mount as requested
  React.useEffect(() => {
    void loadUsage();
  }, [loadUsage]);

  const utilizedCost = usage?.utilizedCost ?? 0;
  const spendLimit = usage?.allowedExpenditureLimit ?? 0.30;
  const usagePercent = spendLimit > 0 ? Math.min(100, Math.max(0, (utilizedCost / spendLimit) * 100)) : 0;

  React.useEffect(() => {
    return subscribeToConfigChange(() => {
      setPublicReposEnabled(isPublicReposTabEnabled());
    });
  }, []);

  React.useEffect(() => {
    const handleProfileUpdated = (e?: any) => {
      const detail = e?.detail;
      if (detail && detail.name) {
        setUserName(detail.name);
        if (detail.email) setUserEmail(detail.email);
        if (detail.avatarStyleId) setAvatarStyleId(detail.avatarStyleId);
      } else {
        const storedName = localStorage.getItem('user_profile_name');
        const storedEmail = localStorage.getItem('user_profile_email');
        const storedAvatar = localStorage.getItem('user_avatar_style') as AvatarStyleId;
        if (storedName) setUserName(storedName);
        if (storedEmail) setUserEmail(storedEmail);
        if (storedAvatar) setAvatarStyleId(storedAvatar);
      }
      void loadUsage();
    };
    window.addEventListener('user-profile-updated', handleProfileUpdated);
    window.addEventListener('user-changed', handleProfileUpdated);
    window.addEventListener('storage', handleProfileUpdated);
    return () => {
      window.removeEventListener('user-profile-updated', handleProfileUpdated);
      window.removeEventListener('user-changed', handleProfileUpdated);
      window.removeEventListener('storage', handleProfileUpdated);
    };
  }, [loadUsage]);

  interface NavItem {
    id: NavTab;
    label: string;
    icon: React.ElementType;
    tooltip: string;
    path: string;
    count?: number;
    isHighlighted?: boolean;
    badge?: string;
  }

  const workspaceItems: NavItem[] = [
    { id: 'overview', label: 'Dashboard', icon: HomeIcon, tooltip: 'Dashboard', path: TAB_TO_PATH['overview'] },
    { id: 'ai-chat', label: 'Gobe AI', icon: GobeAiLogo, tooltip: 'Gobe AI', path: TAB_TO_PATH['ai-chat'] },
    { id: 'pull-requests', label: 'Pull Requests', icon: GitPullRequest, tooltip: 'Pull Requests', path: TAB_TO_PATH['pull-requests'] },
    { id: 'repositories', label: 'Repositories', icon: Book, tooltip: 'Repositories', path: TAB_TO_PATH['repositories'] },
    { id: 'roadmap', label: 'Roadmap', icon: MapIcon, tooltip: 'Project Roadmap', path: TAB_TO_PATH['roadmap'] },
    {
      id: 'try-public',
      label: 'Try Public Repo',
      icon: GitFork,
      tooltip: 'Try Public Repo (Sandbox)',
      path: TAB_TO_PATH['try-public'],
    },
  ];

  const visibleWorkspaceItems = publicReposEnabled
    ? workspaceItems
    : workspaceItems.filter((item) => item.id !== 'try-public');

  const settingItems: NavItem[] = [
    { id: 'settings', label: 'Workspace Settings', icon: Cog6ToothIcon, tooltip: 'Workspace Settings', path: TAB_TO_PATH['settings'] },
    { id: 'byok', label: 'BYOK & Keys', icon: KeyIcon, tooltip: 'Bring Your Own Keys', path: TAB_TO_PATH['byok'] },
  ];

  return (
    <aside
      className={`bg-[#0d1117] border-r border-[#232530] flex flex-col h-full transition-[width] duration-200 ease-in-out shrink-0 select-none relative z-30 overflow-visible ${
        isCollapsed ? 'w-12' : 'w-52'
      }`}
    >
      {/* Top Section */}
      <div className="flex flex-col gap-0.5 p-1.5 mt-1.5">
        {/* Workspace Navigation Links */}
        <nav className="flex flex-col gap-0.5">
          {visibleWorkspaceItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              activeTab === item.id || (activeTab === 'reviews' && item.id === 'pull-requests');
            const isHighlighted = item.isHighlighted;

            return (
              <div key={item.id} className="relative group">
                <a
                  href={item.path}
                  onClick={(e) => {
                    if (!e.ctrlKey && !e.metaKey && !e.shiftKey && !e.altKey && e.button === 0) {
                      e.preventDefault();
                      onTabChange(item.id);
                    }
                  }}
                  className={`h-8 flex items-center rounded-lg text-xs transition-colors cursor-pointer relative z-10 no-underline ${
                    isCollapsed ? 'w-8 mx-auto justify-center px-0 aspect-square' : 'w-full px-2'
                  } ${
                    isHighlighted
                      ? 'animate-shiny-glare-thrice border border-[#c0f200]/60 hover:border-[#c0f200]'
                      : ''
                  } ${
                    isActive
                      ? 'text-[#c0f200] font-semibold bg-[#c0f200]/15'
                      : isHighlighted
                      ? 'text-[#c0f200] hover:bg-[#1a1b22]'
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-[#1a1b22]'
                  }`}
                >
                  {/* Fixed-width Icon Container so icon never shifts */}
                  <div className="w-4 h-4 flex items-center justify-center shrink-0 relative">
                    {item.id === 'ai-chat' ? (
                      <GobeAiLogo
                        className={`w-4 h-4 shrink-0 ${isActive ? '' : 'text-zinc-400'}`}
                        variant={isActive ? 'brand' : 'outline-to-brand'}
                      />
                    ) : item.id === 'try-public' ? (
                      <GitFork
                        size={15}
                        weight="duotone"
                        className={`shrink-0 ${isActive ? 'text-[#c0f200]' : 'text-zinc-400'}`}
                      />
                    ) : (
                      <Icon
                        className={`w-4 h-4 shrink-0 ${
                          isActive ? 'text-[#c0f200]' : 'text-zinc-400'
                        }`}
                      />
                    )}
                    {isCollapsed && isHighlighted && (
                      <span className="absolute -top-1 -right-1 w-1.5 h-1.5 rounded-full bg-[#c0f200]" />
                    )}
                  </div>

                  {/* Smooth Label Transition without unmounting */}
                  <span
                    className={`ml-2.5 truncate font-medium transition-all duration-200 text-left ${
                      isHighlighted ? 'text-[#c0f200]' : ''
                    } ${
                      isCollapsed ? 'opacity-0 w-0 overflow-hidden ml-0 pointer-events-none' : 'opacity-100 flex-1'
                    }`}
                  >
                    {item.label}
                  </span>

                  {item.badge && !isCollapsed && (
                    <span className="ml-auto px-1.5 py-0.5 rounded text-[8px] font-mono font-medium tracking-wider text-[#c0f200] bg-[#c0f200]/10 border border-[#c0f200]/25 shrink-0 uppercase">
                      {item.badge}
                    </span>
                  )}

                  {typeof item.count === 'number' && (
                    <span
                      className={`ml-auto px-1.5 py-0.5 rounded text-[10px] font-mono transition-opacity duration-150 ${
                        isCollapsed ? 'opacity-0 hidden' : 'opacity-100'
                      } ${
                        isActive
                          ? 'bg-[#c0f200]/20 text-[#c0f200] font-semibold'
                          : 'bg-zinc-800 text-zinc-400'
                      }`}
                    >
                      {item.count}
                    </span>
                  )}
                </a>

                {/* Floating Tooltip only when collapsed */}
                {isCollapsed && (
                  <div className="opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-150 absolute left-full top-1/2 -translate-y-1/2 ml-2.5 px-2.5 py-1 bg-[#161822] text-zinc-100 text-xs font-medium rounded-md shadow-2xl border border-[#272938] whitespace-nowrap z-[100] drop-shadow-xl flex items-center gap-1.5">
                    <span>{item.tooltip}</span>
                    {item.badge && (
                      <span className="px-1 py-0.2 rounded text-[8px] font-mono font-medium text-[#c0f200] bg-[#c0f200]/15 border border-[#c0f200]/30">
                        {item.badge}
                      </span>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </nav>
      </div>

      {/* Bottom Container with Settings and Profile */}
      <div className="mt-auto flex flex-col gap-0.5">
        {/* Usage Card (On top of Settings) */}
        {!isCollapsed ? (
          <div className="px-2 pt-1 pb-1">
            <div className="p-2.5 rounded-xl bg-[#14161f] border border-[#232532] flex flex-col gap-2.5 shadow-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-zinc-300">
                  <span className="text-[11px] font-medium text-zinc-300">Usage limit</span>
                  <div className="relative group/info flex items-center">
                    <Info className="w-2.5 h-2.5 text-zinc-500 hover:text-zinc-300 transition-colors cursor-help" />
                    <div className="opacity-0 group-hover/info:opacity-100 pointer-events-none transition-all duration-150 absolute bottom-full left-[-30px] mb-1.5 w-60 p-2.5 bg-[#181a24] text-zinc-200 text-[11px] leading-relaxed rounded-lg shadow-2xl border border-[#2e3142] z-[100] drop-shadow-2xl normal-case font-normal text-left">
                      <div className="font-semibold text-zinc-100 mb-0.5 text-xs">Complimentary Platform Allowance</div>
                      Free usage limit provided by GoBetter AI, credited towards your AI requests including automated pull request reviews and AI chat sessions. Once exhausted, you can configure your own provider keys in BYOK &amp; Keys.
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={loadUsage}
                  disabled={isRefreshingUsage}
                  className="p-1 rounded hover:bg-[#232532] text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer disabled:opacity-50"
                  title="Refresh usage"
                >
                  <RotateCw className={`w-3 h-3 ${isRefreshingUsage ? 'animate-spin text-[#c0f200]' : ''}`} />
                </button>
              </div>

              <div className="flex flex-col gap-1.5">
                <div className="flex items-baseline justify-between">
                  <div className="flex items-baseline gap-1">
                    <span className="font-mono text-zinc-300 text-xs">
                      ${utilizedCost.toFixed(3)}
                    </span>
                    <span className="font-mono text-[10px] text-zinc-500">
                      / ${spendLimit.toFixed(2)}
                    </span>
                  </div>
                  <span className="font-mono text-[10px] text-zinc-400">
                    {usagePercent.toFixed(0)}%
                  </span>
                </div>

                {/* Filling bar */}
                <div className="w-full h-1.5 bg-[#232532] rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 rounded-full ${
                      usagePercent >= 90
                        ? 'bg-rose-500'
                        : usagePercent >= 70
                        ? 'bg-amber-400'
                        : 'bg-[#c0f200]'
                    }`}
                    style={{ width: `${usagePercent}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="px-1.5 py-1 flex justify-center">
            <div className="relative group">
              <button
                type="button"
                onClick={loadUsage}
                disabled={isRefreshingUsage}
                className="w-8 h-8 rounded-lg bg-[#14161f] border border-[#232532] hover:border-zinc-500 flex flex-col items-center justify-center p-1 cursor-pointer transition-colors"
                title="Usage Limit"
              >
                <div className="w-4 h-4 flex items-center justify-center">
                  <RotateCw
                    className={`w-3 h-3 ${
                      isRefreshingUsage ? 'animate-spin text-[#c0f200]' : 'text-zinc-400 group-hover:text-[#c0f200]'
                    }`}
                  />
                </div>
                <div className="w-5 h-1 bg-[#232532] rounded-full overflow-hidden mt-0.5">
                  <div
                    className={`h-full rounded-full ${
                      usagePercent >= 90
                        ? 'bg-rose-500'
                        : usagePercent >= 70
                        ? 'bg-amber-400'
                        : 'bg-[#c0f200]'
                    }`}
                    style={{ width: `${usagePercent}%` }}
                  />
                </div>
              </button>

              <div className="opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-150 absolute left-full top-1/2 -translate-y-1/2 ml-2.5 px-3 py-2 bg-[#181a24] text-zinc-200 text-xs rounded-lg shadow-2xl border border-[#2e3142] z-[100] drop-shadow-2xl flex flex-col gap-1 w-56">
                <div className="flex items-center justify-between text-[11px] font-semibold text-zinc-200">
                  <span>Usage Limit</span>
                  <span className="text-[#c0f200] font-mono">
                    ${utilizedCost.toFixed(3)} / ${spendLimit.toFixed(2)}
                  </span>
                </div>
                <p className="text-[10px] text-zinc-400 leading-relaxed font-normal">
                  Free platform credit applied against your automated PR reviews and chat requests. Click to refresh.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Settings options */}
        <div className="flex flex-col gap-0.5 px-1.5 py-1">
          <div
            className={`px-2 text-[10px] font-semibold text-zinc-500 tracking-widest uppercase transition-all duration-200 ${
              isCollapsed ? 'opacity-0 h-0 overflow-hidden my-0 py-0' : 'opacity-100 mt-1.5 mb-1'
            }`}
          >
            Settings
          </div>

          <nav className="flex flex-col gap-0.5">
            {settingItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;

              return (
                <div key={item.id} className="relative group">
                  <a
                    href={item.path}
                    onClick={(e) => {
                      if (!e.ctrlKey && !e.metaKey && !e.shiftKey && !e.altKey && e.button === 0) {
                        e.preventDefault();
                        onTabChange(item.id);
                      }
                    }}
                    className={`h-8 flex items-center rounded-lg text-xs transition-colors cursor-pointer relative z-10 no-underline ${
                      isCollapsed ? 'w-8 mx-auto justify-center px-0 aspect-square' : 'w-full px-2'
                    } ${
                      isActive
                        ? 'text-[#c0f200] font-semibold bg-[#c0f200]/15'
                        : 'text-zinc-400 hover:text-zinc-200 hover:bg-[#1a1b22]'
                    }`}
                  >
                    {/* Fixed-width Icon Container */}
                    <div className="w-4 h-4 flex items-center justify-center shrink-0">
                      <Icon
                        className={`w-4 h-4 shrink-0 ${isActive ? 'text-[#c0f200]' : 'text-zinc-400'}`}
                      />
                    </div>

                    {/* Smooth Label Transition */}
                    <span
                      className={`ml-2.5 truncate font-medium transition-all duration-200 text-left ${
                        isCollapsed ? 'opacity-0 w-0 overflow-hidden ml-0 pointer-events-none' : 'opacity-100 flex-1'
                      }`}
                    >
                      {item.label}
                    </span>
                  </a>

                  {/* Floating Tooltip only when collapsed */}
                  {isCollapsed && (
                    <div className="opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-150 absolute left-full top-1/2 -translate-y-1/2 ml-2.5 px-2.5 py-1 bg-[#161822] text-zinc-100 text-xs font-medium rounded-md shadow-2xl border border-[#272938] whitespace-nowrap z-[100] drop-shadow-xl">
                      {item.tooltip}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>
        </div>

        {/* Profile Section at the bottom */}
        <div className="px-1.5 py-1.5 border-t border-[#232530]">
          <div className="relative group flex items-center">
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="w-full h-8 px-1 flex items-center gap-2 rounded-lg text-left hover:bg-[#1a1b22] transition-colors cursor-pointer"
            >
              <UserAvatar
                name={userName}
                avatarStyleId={avatarStyleId}
                size={22}
                className="shrink-0 ml-0.5 border border-zinc-700/60"
              />
              <div
                className={`flex flex-col items-start min-w-0 transition-all duration-200 ${
                  isCollapsed ? 'opacity-0 w-0 overflow-hidden ml-0 pointer-events-none' : 'opacity-100 flex-1'
                }`}
              >
                <span className="text-[11px] font-semibold text-zinc-200 truncate w-full leading-tight">
                  {userName}
                </span>
                <span className="text-[9px] text-zinc-500 font-mono truncate w-full leading-tight">
                  {userEmail}
                </span>
              </div>
            </button>

            {isCollapsed && !showProfileMenu && (
              <div className="opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-150 absolute left-full top-1/2 -translate-y-1/2 ml-2.5 px-2.5 py-1 bg-[#161822] text-zinc-100 text-xs font-medium rounded-md shadow-2xl border border-[#272938] whitespace-nowrap z-[100] drop-shadow-xl">
                Profile
              </div>
            )}

            {/* Profile Popover Menu */}
            {showProfileMenu && (
              <div
                className={`absolute bottom-full mb-2 bg-[#1a1b22] border border-[#232530] rounded-lg shadow-2xl p-1 space-y-0.5 z-50 animate-apple-scale ${
                  isCollapsed ? 'left-full ml-2 w-48' : 'left-0 w-full'
                }`}
              >
                <button
                  onClick={() => {
                    setShowProfileMenu(false);
                    setShowProfileModal(true);
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded text-xs text-zinc-300 hover:text-zinc-100 hover:bg-[#252733] transition-colors cursor-pointer"
                >
                  <PencilSquareIcon className="w-3.5 h-3.5 text-zinc-400" />
                  <span>Edit Profile</span>
                </button>

                {isAuthenticated ? (
                  isGithubConnected ? (
                    <div className="w-full flex items-center justify-between px-2.5 py-1.5 rounded text-xs text-emerald-400 bg-emerald-500/10">
                      <div className="flex items-center gap-2 truncate">
                        <GitHubDark className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">GitHub: @{githubProfile || 'Connected'}</span>
                      </div>
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                    </div>
                  ) : (
                    <button
                      onClick={() => {
                        setShowProfileMenu(false);
                        connectGitHub();
                      }}
                      className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded text-xs text-[#c0f200] hover:bg-[#c0f200]/10 transition-colors cursor-pointer"
                    >
                      <GitHubDark className="w-3.5 h-3.5 shrink-0" />
                      <span>Connect GitHub</span>
                    </button>
                  )
                ) : (
                  <button
                    onClick={() => {
                      setShowProfileMenu(false);
                      window.dispatchEvent(new CustomEvent('open-auth-modal', { detail: { mode: 'signup' } }));
                    }}
                    className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded text-xs text-[#c0f200] hover:bg-[#c0f200]/10 transition-colors cursor-pointer"
                  >
                    <GitHubDark className="w-3.5 h-3.5 shrink-0" />
                    <span>Login/Sign up</span>
                  </button>
                )}

                {isAuthenticated && (
                  <button
                    onClick={async () => {
                      setShowProfileMenu(false);
                      try {
                        await logout();
                      } catch (err) {
                        console.warn('Server logout failed:', err);
                      }
                      localStorage.removeItem('gobe-user-id');
                      localStorage.removeItem('user_db_id');
                      localStorage.removeItem('user_id');
                      localStorage.removeItem('session_id');
                      localStorage.removeItem('user_profile_name');
                      localStorage.removeItem('user_profile_email');
                      localStorage.removeItem('user_auth_provider');
                      setUserName('Guest');
                      setUserEmail('guest@gobetter.dev');
                      window.dispatchEvent(new Event('user-profile-updated'));
                      window.dispatchEvent(new Event('user-changed'));
                      toast.info('Signed out successfully');
                      window.dispatchEvent(new CustomEvent('open-auth-modal', { detail: { mode: 'login' } }));
                    }}
                    className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-colors cursor-pointer"
                  >
                    <ArrowRightOnRectangleIcon className="w-3.5 h-3.5" />
                    <span>Logout</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <ProfileEditModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
      />
    </aside>
  );
};
