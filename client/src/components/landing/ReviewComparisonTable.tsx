import React from 'react';
import type { Icon } from '@phosphor-icons/react';
import {
  Lightning,
  ShieldCheck,
  GitDiff,
  Cpu,
  Hourglass,
  Key,
  Check,
  X,
} from '@phosphor-icons/react';
import { GobeAiLogo } from '../ui/GobeAiLogo';

interface ComparisonFeature {
  id: string;
  icon: Icon;
  title: string;
  humanOnly: boolean;
  aiAssisted: boolean;
}

const COMPARISON_FEATURES: ComparisonFeature[] = [
  {
    id: 'turnaround',
    icon: Lightning,
    title: 'Sub-30s PR turnaround time',
    humanOnly: false,
    aiAssisted: true,
  },
  {
    id: 'security',
    icon: ShieldCheck,
    title: 'Zero-day AST vulnerability detection',
    humanOnly: false,
    aiAssisted: true,
  },
  {
    id: 'patches',
    icon: GitDiff,
    title: 'Auto-generated runnable code patches',
    humanOnly: false,
    aiAssisted: true,
  },
  {
    id: 'context',
    icon: Cpu,
    title: 'Full-repository semantic context reasoning',
    humanOnly: false,
    aiAssisted: true,
  },
  {
    id: 'availability',
    icon: Hourglass,
    title: '24/7 review availability without engineer burnout',
    humanOnly: false,
    aiAssisted: true,
  },
  {
    id: 'byok',
    icon: Key,
    title: 'Predictable BYOK privacy & zero data retention',
    humanOnly: false,
    aiAssisted: true,
  },
];

export const ReviewComparisonTable: React.FC = () => {
  return (
    <section className="w-full my-12 md:my-16 select-none animate-apple-fade">
      {/* Section Headline */}
      <div className="text-center mb-8 md:mb-10">
        <h2
          className="text-2xl sm:text-3xl md:text-[34px] font-medium text-white tracking-tight leading-[1.15] mb-3"
          style={{ fontFamily: "'Manrope', sans-serif", letterSpacing: '-0.03em' }}
        >
          Traditional code reviews are <br className="hidden sm:inline" />
          holding you back
        </h2>
        <p className="text-xs sm:text-sm md:text-[15px] text-zinc-400 font-sans max-w-lg mx-auto leading-relaxed">
          See why AI-assisted pull request reviews eliminate bottlenecks and ship secure code faster.
        </p>
      </div>

      {/* Comparison Table Container — Bulletproof HTML Table Layout */}
      <div className="max-w-[840px] mx-auto rounded-2xl border border-white/10 bg-[#090c10]/85 backdrop-blur-md overflow-hidden shadow-2xl">
        <table className="w-full text-left border-collapse table-fixed">
          {/* Table Header */}
          <thead>
            <tr className="border-b border-white/10 bg-white/[0.02]">
              {/* Column 1: Feature Title (Empty / subtle label) */}
              <th className="py-4 px-6 md:px-8 text-xs font-mono uppercase tracking-wider text-zinc-500 w-[56%]">
                Capabilities
              </th>

              {/* Column 2: Human-only Reviews */}
              <th className="py-4 px-4 text-center text-xs md:text-sm font-medium text-zinc-400 border-l border-white/10 w-[22%]">
                Human-only
              </th>

              {/* Column 3: GoBetter AI */}
              <th className="py-4 px-4 text-center border-l border-white/10 w-[22%]">
                <div className="flex items-center justify-center gap-1.5 text-xs md:text-sm font-semibold text-white">
                  <GobeAiLogo className="w-4 h-4 shrink-0" variant="brand" />
                  <span>GoBetter AI</span>
                </div>
              </th>
            </tr>
          </thead>

          {/* Table Body Rows */}
          <tbody className="divide-y divide-white/[0.06]">
            {COMPARISON_FEATURES.map((item) => {
              const IconComp = item.icon;
              return (
                <tr
                  key={item.id}
                  className="transition-colors hover:bg-white/[0.02] group"
                >
                  {/* Feature Name & Icon */}
                  <td className="py-4 px-6 md:px-8">
                    <div className="flex items-center gap-3">
                      <IconComp
                        size={17}
                        weight="duotone"
                        className="text-zinc-400 group-hover:text-zinc-200 transition-colors shrink-0"
                      />
                      <span className="text-xs md:text-sm font-medium text-zinc-200 group-hover:text-white font-sans transition-colors truncate sm:whitespace-normal">
                        {item.title}
                      </span>
                    </div>
                  </td>

                  {/* Human-only Review Column */}
                  <td className="py-4 px-4 text-center border-l border-white/10">
                    <div className="flex items-center justify-center">
                      {item.humanOnly ? (
                        <Check size={16} weight="bold" className="text-emerald-400" />
                      ) : (
                        <X size={15} weight="bold" className="text-rose-500/80" />
                      )}
                    </div>
                  </td>

                  {/* GoBetter AI Column */}
                  <td className="py-4 px-4 text-center border-l border-white/10">
                    <div className="flex items-center justify-center">
                      {item.aiAssisted ? (
                        <Check size={18} weight="bold" className="text-[#c0f200]" />
                      ) : (
                        <X size={15} weight="bold" className="text-rose-500/80" />
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Handwritten Footer Callout (Matching the design example) */}
      <div className="flex items-center justify-center gap-2.5 mt-7 select-none">
        <span
          className="text-sm md:text-base italic text-zinc-400 hover:text-zinc-300 transition-colors"
          style={{ fontFamily: "'Caveat', 'Playfair Display', Georgia, serif" }}
        >
          There's more but... it's better experienced than explained.
        </span>
        <svg
          width="34"
          height="30"
          viewBox="0 0 34 30"
          fill="none"
          className="text-zinc-500 hover:text-zinc-400 shrink-0 transition-colors -translate-y-1.5"
        >
          {/* Upward hand-drawn curve pointing up towards table */}
          <path
            d="M 3 24 C 14 26, 26 19, 23 5"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
          {/* Upward-pointing arrowhead */}
          <path
            d="M 16 9 L 23 5 L 27 11"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    </section>
  );
};
