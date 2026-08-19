import React, { useState } from 'react';
import { 
  Clock,
  Sparkles
} from 'lucide-react';
import { SummaryView } from './views/SummaryView';
import { TimeMetricsView } from './views/TimeMetricsView';
import { DataExportView } from './views/DataExportView';
import { AdvancedDemoView } from './views/AdvancedDemoView';
import { AISpendingView } from './views/AISpendingView';
import { TokenUsageView } from './views/TokenUsageView';

type AnalyticsTab = 
  | 'ai-spending'
  | 'token-usage'
  | 'advanced-components'
  | 'data-export'
  | 'summary'
  | 'time-metrics';

const TABS: { id: AnalyticsTab; label: string; comingSoon?: boolean }[] = [
  { id: 'ai-spending', label: 'AI Spending' },
  { id: 'token-usage', label: 'Token Usage' },
  { id: 'advanced-components', label: 'Advanced Components' },
  { id: 'data-export', label: 'Data Export' },
  { id: 'summary', label: 'Summary', comingSoon: true },
  { id: 'time-metrics', label: 'Time Metrics', comingSoon: true },
];

const ComingSoonView: React.FC<{ title: string; description: string }> = ({ title, description }) => (
  <div className="flex flex-col items-center justify-center min-h-[380px] p-8 text-center bg-[#13151f] border border-[#262b3a] rounded-2xl max-w-xl mx-auto mt-6 animate-apple-fade">
    <div className="p-3.5 rounded-2xl bg-[#1a1e2a] text-[#c0f200] border border-[#283042] mb-3 shadow-lg">
      <Clock className="w-6 h-6" />
    </div>
    <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-[#c0f200]/10 text-[#c0f200] border border-[#c0f200]/30 mb-2.5">
      <span>COMING SOON</span>
    </div>
    <h2 className="text-lg font-bold text-zinc-100 tracking-tight">{title}</h2>
    <p className="text-xs text-zinc-400 mt-1.5 max-w-sm leading-relaxed">
      {description}
    </p>
  </div>
);

export const AnalyticsView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<AnalyticsTab>('ai-spending');
  const tabsRef = React.useRef<(HTMLButtonElement | null)[]>([]);
  const [activeTabStyle, setActiveTabStyle] = useState({ left: 0, width: 0, opacity: 0 });

  React.useEffect(() => {
    const activeIndex = TABS.findIndex(t => t.id === activeTab);
    const activeEl = tabsRef.current[activeIndex];
    if (activeEl) {
      setActiveTabStyle({
        left: activeEl.offsetLeft,
        width: activeEl.offsetWidth,
        opacity: 1
      });
    }
  }, [activeTab]);

  return (
    <div className="flex flex-col h-full bg-[#0d1117]">
      {/* Top Pill Tabs */}
      <div className="px-6 py-4 flex items-center justify-between shrink-0">
        <div className="relative flex items-center gap-1 bg-[#16171d] p-1 rounded-xl border border-[#232530]">
          {/* Animated Background Indicator */}
          <div
            className="absolute top-1 bottom-1 bg-[#21262d] rounded-lg shadow-sm transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]"
            style={{
              left: activeTabStyle.left,
              width: activeTabStyle.width,
              opacity: activeTabStyle.opacity,
            }}
          />
          {TABS.map((tab, idx) => (
            <button
              key={tab.id}
              ref={el => tabsRef.current[idx] = el}
              onClick={() => setActiveTab(tab.id)}
              className={`relative z-10 flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                activeTab === tab.id
                  ? 'text-zinc-100'
                  : 'text-zinc-400 hover:text-zinc-300'
              }`}
            >
              <span>{tab.label}</span>
              {tab.comingSoon && (
                <span className="text-[9px] font-mono font-medium px-1.5 py-0.2 rounded bg-[#1e2330] text-zinc-400 border border-[#2b3345]">
                  Soon
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Main Content Area */}
        <div className="flex-1 px-6 pb-6 overflow-y-auto bg-[#0d1117]">
          {activeTab === 'ai-spending' && <AISpendingView />}
          {activeTab === 'token-usage' && <TokenUsageView />}
          {activeTab === 'advanced-components' && <AdvancedDemoView />}
          {activeTab === 'data-export' && <DataExportView />}
          {activeTab === 'summary' && (
            <ComingSoonView
              title="Summary Dashboard"
              description="Executive overview metrics, active PR review velocity, and aggregated quality scores are coming in the next release."
            />
          )}
          {activeTab === 'time-metrics' && (
            <ComingSoonView
              title="Time & Velocity Metrics"
              description="Detailed turnaround time breakdown, cycle time to merge, and review latency tracking will be available soon."
            />
          )}
        </div>
      </div>
    </div>
  );
};
