import React, { useState } from 'react';
import { MapIcon } from '@heroicons/react/24/outline';
import {
  CheckCircle2,
  CircleDashed,
  Clock,
  SignalHigh,
  SignalMedium,
  SignalLow,
  ChevronDown,
  ChevronRight,
  ArrowRight,
} from 'lucide-react';
import { GitFork } from '@phosphor-icons/react';
import { GitHubDark } from '@ridemountainpig/svgl-react';
import { isPublicReposTabEnabled } from '../../config/clientConfig';
import roadmapData from '../../data/roadmap.json';

export type RoadmapStatus = 'in-progress' | 'planned' | 'shipped';
export type Priority = 'urgent' | 'high' | 'medium' | 'low';

export interface RoadmapItem {
  key: string;
  title: string;
  description: string;
  status: RoadmapStatus;
  priority: Priority;
  category: string;
}

const ROADMAP_ITEMS = roadmapData as RoadmapItem[];

const GROUPS: { status: RoadmapStatus; label: string; icon: React.FC<{ className?: string }>; color: string }[] = [
  {
    status: 'shipped',
    label: 'Shipped',
    icon: CheckCircle2,
    color: 'text-emerald-400',
  },
  {
    status: 'in-progress',
    label: 'In Progress',
    icon: Clock,
    color: 'text-[#c0f200]',
  },
  {
    status: 'planned',
    label: 'Planned',
    icon: CircleDashed,
    color: 'text-indigo-400',
  },
];

const PriorityBadge: React.FC<{ priority: Priority }> = ({ priority }) => {
  switch (priority) {
    case 'urgent':
      return (
        <span className="flex items-center gap-1 text-[11px] font-mono text-rose-400 shrink-0" title="Urgent Priority">
          <SignalHigh className="w-3.5 h-3.5 text-rose-400" />
          <span className="capitalize hidden sm:inline">Urgent</span>
        </span>
      );
    case 'high':
      return (
        <span className="flex items-center gap-1 text-[11px] font-mono text-amber-400 shrink-0" title="High Priority">
          <SignalHigh className="w-3.5 h-3.5 text-amber-400" />
          <span className="capitalize hidden sm:inline">High</span>
        </span>
      );
    case 'medium':
      return (
        <span className="flex items-center gap-1 text-[11px] font-mono text-zinc-400 shrink-0" title="Medium Priority">
          <SignalMedium className="w-3.5 h-3.5 text-zinc-400" />
          <span className="capitalize hidden sm:inline">Medium</span>
        </span>
      );
    case 'low':
    default:
      return (
        <span className="flex items-center gap-1 text-[11px] font-mono text-zinc-500 shrink-0" title="Low Priority">
          <SignalLow className="w-3.5 h-3.5 text-zinc-500" />
          <span className="capitalize hidden sm:inline">Low</span>
        </span>
      );
  }
};

interface RoadmapViewProps {
  onNavigateToTryPublic?: () => void;
}

export const RoadmapView: React.FC<RoadmapViewProps> = ({ onNavigateToTryPublic }) => {
  const [expandedKeys, setExpandedKeys] = useState<Set<string>>(new Set());

  const toggleExpand = (key: string) => {
    setExpandedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  return (
    <div className="flex-1 overflow-y-auto bg-[#0d1117] min-h-full font-sans">
      <div className="max-w-4xl mx-auto py-10 px-8 space-y-8 animate-apple-fade">
        {/* Header with Sidebar MapIcon and Project Roadmap title */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <MapIcon className="w-6 h-6 text-zinc-300 shrink-0" />
            <h1 className="text-2xl font-semibold text-zinc-100 tracking-tight">Project Roadmap</h1>
          </div>

          <a
            href="https://github.com/dev-hari-prasad/go-better/issues"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-[#16171d] hover:bg-[#20222a] border border-white/10 hover:border-white/20 text-xs text-zinc-300 hover:text-white transition-all cursor-pointer font-sans shadow-xs active:scale-[0.98] group"
          >
            <GitHubDark className="w-3.5 h-3.5 shrink-0 group-hover:scale-110 transition-transform" />
            <span className="font-medium">Request a feature</span>
          </a>
        </div>

        {/* Spotlight Banner: Try GoBetter with Public Repos */}
        {isPublicReposTabEnabled() && (
          <div className="relative overflow-hidden rounded-2xl border border-[#232734] bg-[#12151f] p-5 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
              <div className="space-y-1.5">
                <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-[#1a1f2c] text-zinc-300 border border-[#2b3345] uppercase">
                  <GitFork size={12} weight="duotone" />
                  <span>Sandbox</span>
                </div>
                <h3 className="text-base font-bold text-white tracking-tight">
                  Try GoBetter with a Public Repository
                </h3>
                <p className="text-xs text-zinc-400 max-w-lg leading-relaxed">
                  Load and explore public GitHub repositories like React, Go, or Codex without connecting your account.
                </p>
              </div>

              <button
                onClick={onNavigateToTryPublic}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#1c212d] hover:bg-[#252c3c] text-zinc-200 hover:text-white font-medium text-xs tracking-tight transition-all border border-[#2d3648] hover:border-zinc-500 cursor-pointer shrink-0 self-start sm:self-center"
              >
                <span>Explore Public Repos</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Task List Grouped by Status */}
        <div className="space-y-6">
          {GROUPS.map((group) => {
            const items = ROADMAP_ITEMS.filter((item) => item.status === group.status);
            const Icon = group.icon;

            return (
              <div key={group.status} className="space-y-2">
                {/* Group Heading */}
                <div className="flex items-center gap-2 px-1">
                  <Icon className={`w-4 h-4 ${group.color}`} />
                  <h2 className="text-xs font-semibold text-zinc-300 font-mono tracking-wide">
                    {group.label}
                  </h2>
                  <span className="px-1.5 py-0.5 rounded bg-[#21262d] text-zinc-400 font-mono text-[10px]">
                    {items.length}
                  </span>
                </div>

                {/* Task List Container */}
                <div className="border border-[#30363d] rounded-xl overflow-hidden bg-[#161b22]/30 divide-y divide-[#21262d]">
                  {items.length === 0 ? (
                    <div className="py-5 text-center text-xs text-zinc-600 font-mono">
                      Nothing here yet
                    </div>
                  ) : (
                    items.map((item) => {
                      const isExpanded = expandedKeys.has(item.key);

                      return (
                        <div
                          key={item.key}
                          className="hover:bg-[#161b22] transition-colors cursor-pointer group select-none"
                          onClick={() => toggleExpand(item.key)}
                        >
                          {/* Compact Row without description */}
                          <div className="px-3.5 py-3 flex items-center justify-between gap-4">
                            <div className="flex items-center gap-3 min-w-0 flex-1">
                              <span className="text-zinc-500 group-hover:text-zinc-300 transition-colors shrink-0">
                                <ChevronRight
                                  className={`w-3.5 h-3.5 transition-transform duration-200 ease-out ${
                                    isExpanded ? 'rotate-90 text-zinc-300' : 'rotate-0'
                                  }`}
                                />
                              </span>
                              <span className="font-mono text-xs text-zinc-500 shrink-0 font-medium">
                                {item.key}
                              </span>
                              <h3 className="text-sm font-medium text-zinc-200 group-hover:text-zinc-100 truncate">
                                {item.title}
                              </h3>
                            </div>

                            {/* Category & Priority Metadata (Category left, Priority right) */}
                            <div className="flex items-center gap-3 shrink-0">
                              <span className="px-2 py-0.5 text-[10px] font-mono rounded bg-[#21262d] text-zinc-400 border border-zinc-700/50">
                                {item.category}
                              </span>
                              <PriorityBadge priority={item.priority} />
                            </div>
                          </div>

                          {/* Smooth Animated Description */}
                          <div
                            className={`grid transition-[grid-template-rows,opacity] duration-200 ease-[cubic-bezier(0.4,0,0.2,1)] ${
                              isExpanded ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
                            }`}
                          >
                            <div className="overflow-hidden">
                              <div className="px-10 py-3 text-xs text-zinc-400 leading-relaxed border-t border-[#21262d]/50 bg-[#0d1117]/30 flex items-center min-h-[42px]">
                                <p className="m-0">{item.description}</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
