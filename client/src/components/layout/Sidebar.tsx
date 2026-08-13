import React, { useState } from 'react';
import {
  HomeIcon,
  FolderIcon,
  CodeBracketSquareIcon,
  KeyIcon,
  SparklesIcon,
  CodeBracketIcon,
  ChartBarIcon,
  Cog6ToothIcon,
  AdjustmentsHorizontalIcon,
  ArrowRightOnRectangleIcon,
  PencilSquareIcon,
  CubeIcon,
  QueueListIcon
} from '@heroicons/react/24/outline';
import { GitPullRequest, Book, BrainCircuit } from 'lucide-react';
import { Repository } from '../../types/codeReview';
import { ProfileEditModal } from '../settings/ProfileEditModal';

export type NavTab = 'overview' | 'repositories' | 'pull-requests' | 'reviews' | 'activity' | 'settings' | 'byok' | 'ai-chat' | 'analytics';

interface SidebarProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  repositories: Repository[];
  selectedRepoId: string;
  onSelectRepo: (repoId: string) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  onSimulateReview: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onTabChange,
  isCollapsed,
  onSimulateReview,
}) => {
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);

  const [indicatorStyle, setIndicatorStyle] = useState({ top: 0, left: 0, width: 0, height: 0, opacity: 0 });
  const asideRef = React.useRef<HTMLElement>(null);
  const itemRefs = React.useRef<{ [key: string]: HTMLButtonElement | null }>({});

  React.useEffect(() => {
    const updateIndicator = () => {
      const activeKey = activeTab === 'reviews' ? 'pull-requests' : activeTab;
      const activeEl = itemRefs.current[activeKey];
      const asideEl = asideRef.current;

      if (activeEl && asideEl) {
        const activeRect = activeEl.getBoundingClientRect();
        const asideRect = asideEl.getBoundingClientRect();
        setIndicatorStyle({
          top: activeRect.top - asideRect.top,
          left: activeRect.left - asideRect.left,
          width: activeRect.width,
          height: activeRect.height,
          opacity: 1,
        });
      } else {
        setIndicatorStyle(prev => ({ ...prev, opacity: 0 }));
      }
    };

    updateIndicator();
    // Re-calculate after CSS transitions complete or on window resize
    const timeout = setTimeout(updateIndicator, 250); 
    window.addEventListener('resize', updateIndicator);
    return () => {
      clearTimeout(timeout);
      window.removeEventListener('resize', updateIndicator);
    };
  }, [activeTab, isCollapsed]);

  const workspaceItems = [
    { id: 'overview' as NavTab, label: 'Dashboard', icon: HomeIcon, tooltip: 'Dashboard' },
    { id: 'ai-chat' as NavTab, label: 'Gobe AI', icon: BrainCircuit, tooltip: 'Gobe AI' },
    { id: 'pull-requests' as NavTab, label: 'Pull Requests', icon: GitPullRequest, count: 3, tooltip: 'Pull Requests' },
    { id: 'repositories' as NavTab, label: 'Repositories', icon: Book, tooltip: 'Repositories' },
    { id: 'analytics' as NavTab, label: 'Analytics', icon: ChartBarIcon, tooltip: 'Analytics Dashboard' },
  ];

  const settingItems = [
    { id: 'settings' as NavTab, label: 'Workspace Settings', icon: Cog6ToothIcon, tooltip: 'Workspace Settings' },
    { id: 'byok' as NavTab, label: 'BYOK & Keys', icon: KeyIcon, tooltip: 'Bring Your Own Keys' },
  ];

  return (
    <aside ref={asideRef} className={`bg-[#0d1117] border-r border-[#232530] flex flex-col h-full transition-all duration-200 shrink-0 select-none relative z-0 ${
      isCollapsed ? 'w-12' : 'w-52'
    }`}>
      {/* Animated Sliding Background Indicator */}
      <div
        className="absolute bg-[#c0f200]/15 transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] pointer-events-none z-0"
        style={{
          top: indicatorStyle.top,
          left: indicatorStyle.left,
          width: indicatorStyle.width,
          height: indicatorStyle.height,
          opacity: indicatorStyle.opacity,
          borderRadius: isCollapsed ? '10px' : '14px',
        }}
      />
      {/* Top Section */}
      <div className="flex flex-col gap-2 p-2 overflow-visible mt-2">
        {/* Workspace Navigation Links */}
        <nav className="flex flex-col gap-1">
          {workspaceItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id || (activeTab === 'reviews' && item.id === 'pull-requests');
            return (
              <div key={item.id} className="relative group">
                <button
                  ref={el => itemRefs.current[item.id] = el}
                  onClick={() => onTabChange(item.id)}
                  className={`flex items-center transition-colors cursor-pointer apple-button relative z-10 ${
                    isCollapsed
                      ? 'w-8 h-8 mx-auto justify-center rounded-[10px] p-0'
                      : 'w-full justify-between px-3.5 py-2.5 rounded-[14px] text-xs font-medium'
                  } ${
                    isActive
                      ? 'text-[#c0f200] font-semibold'
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-[#1a1b22]'
                  }`}
                >
                  <div className={`flex items-center gap-2.5 ${isCollapsed ? 'justify-center' : 'min-w-0'}`}>
                    <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-[#c0f200]' : 'text-zinc-400'}`} />
                    {!isCollapsed && <span className="truncate">{item.label}</span>}
                  </div>
                  {!isCollapsed && typeof item.count === 'number' && (
                    <span
                      className={`px-1.5 py-0.2 rounded text-[10px] font-mono ${
                        isActive ? 'bg-[#c0f200]/20 text-[#c0f200] font-semibold' : 'bg-zinc-800 text-zinc-400'
                      }`}
                    >
                      {item.count}
                    </span>
                  )}
                </button>

                {/* Floating Tooltip only when collapsed */}
                {isCollapsed && (
                  <div className="opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-150 absolute left-full top-1/2 -translate-y-1/2 ml-2 px-2.5 py-1 bg-[#1a1b22] text-zinc-100 text-xs font-medium rounded shadow-xl border border-[#232530] whitespace-nowrap z-50">
                    {item.tooltip}
                  </div>
                )}
              </div>
            );
          })}
        </nav>
      </div>

      {/* Bottom Container with Settings and Profile */}
      <div className="mt-auto flex flex-col gap-1">
        {/* Settings options */}
        <div className="flex flex-col gap-1 px-2 py-1 overflow-visible">
          {!isCollapsed && (
            <div className="px-3.5 mt-1 mb-0 text-[10px] font-semibold text-zinc-500 tracking-widest uppercase">
              Settings
            </div>
          )}

          <nav className="flex flex-col gap-1">
            {settingItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <div key={item.id} className="relative group">
                  <button
                    ref={el => itemRefs.current[item.id] = el}
                    onClick={() => onTabChange(item.id)}
                    className={`flex items-center transition-colors cursor-pointer apple-button relative z-10 ${
                      isCollapsed
                        ? 'w-8 h-8 mx-auto justify-center rounded-[10px] p-0'
                        : 'w-full justify-between px-3.5 py-2.5 rounded-[14px] text-xs font-medium'
                    } ${
                      isActive
                        ? 'text-[#c0f200] font-semibold'
                        : 'text-zinc-400 hover:text-zinc-200 hover:bg-[#1a1b22]'
                    }`}
                  >
                    <div className={`flex items-center gap-2.5 ${isCollapsed ? 'justify-center' : 'min-w-0'}`}>
                      <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-[#c0f200]' : 'text-zinc-400'}`} />
                      {!isCollapsed && <span className="truncate">{item.label}</span>}
                    </div>
                  </button>

                  {/* Floating Tooltip only when collapsed */}
                  {isCollapsed && (
                    <div className="opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-150 absolute left-full top-1/2 -translate-y-1/2 ml-2 px-2.5 py-1 bg-[#1a1b22] text-zinc-100 text-xs font-medium rounded shadow-xl border border-[#232530] whitespace-nowrap z-50">
                      {item.tooltip}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>
        </div>

        {/* Profile Section at the bottom */}
        <div className="px-2 py-1.5 border-t border-[#232530]">
          <div className="relative group flex items-center justify-center sm:justify-start">
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className={`flex items-center gap-2 ${isCollapsed ? 'justify-center w-8 h-8 rounded-full' : 'w-full px-2 py-1 rounded-lg justify-start text-left hover:bg-[#1a1b22]'} transition-colors cursor-pointer`}
            >
              <div className="flex items-center justify-center w-7 h-7 rounded-full bg-gradient-to-tr from-indigo-600 to-[#c0f200] text-black font-bold text-xs border border-zinc-700 shrink-0">
                AM
              </div>
              {!isCollapsed && (
                <div className="flex flex-col items-start min-w-0 text-left">
                  <span className="text-[11px] font-semibold text-zinc-200 truncate w-full">Alex Mercer</span>
                  <span className="text-[9px] text-zinc-500 font-mono truncate w-full">alexmercer@acme.io</span>
                </div>
              )}
            </button>

            {isCollapsed && !showProfileMenu && (
              <div className="opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-150 absolute left-full top-1/2 -translate-y-1/2 ml-2 px-2.5 py-1 bg-[#1a1b22] text-zinc-100 text-xs font-medium rounded shadow-xl border border-[#232530] whitespace-nowrap z-50">
                Profile
              </div>
            )}

            {/* Profile Popover Menu */}
            {showProfileMenu && (
              <div className={`absolute bottom-full mb-2 bg-[#1a1b22] border border-[#232530] rounded-lg shadow-2xl p-1 space-y-0.5 z-50 animate-apple-scale ${isCollapsed ? 'left-full ml-2 w-48' : 'left-0 w-full'}`}>
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

                <button
                  onClick={() => {
                    setShowProfileMenu(false);
                    alert('Signed out successfully');
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-colors cursor-pointer"
                >
                  <ArrowRightOnRectangleIcon className="w-3.5 h-3.5" />
                  <span>Logout</span>
                </button>
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
