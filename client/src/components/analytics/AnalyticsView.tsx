import React, { useState } from 'react';
import { 
  ChevronDown, 
  Search,
  Clock,
  RefreshCw
} from 'lucide-react';
import { SummaryView } from './views/SummaryView';
import { TimeMetricsView } from './views/TimeMetricsView';
import { DataExportView } from './views/DataExportView';
import { AdvancedDemoView } from './views/AdvancedDemoView';
import { AISpendingView } from './views/AISpendingView';
import { TokenUsageView } from './views/TokenUsageView';

type AnalyticsTab = 
  | 'summary'
  | 'time-metrics'
  | 'data-export'
  | 'ai-spending'
  | 'token-usage'
  | 'advanced-components';

const TABS: { id: AnalyticsTab; label: string }[] = [
  { id: 'summary', label: 'Summary' },
  { id: 'time-metrics', label: 'Time Metrics' },
  { id: 'ai-spending', label: 'AI Spending' },
  { id: 'token-usage', label: 'Token Usage' },
  { id: 'advanced-components', label: 'Advanced Components' },
  { id: 'data-export', label: 'Data Export' },
];

export const AnalyticsView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<AnalyticsTab>('summary');
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
              className={`relative z-10 flex items-center px-4 py-1.5 rounded-lg text-[13px] font-medium transition-colors cursor-pointer ${
                activeTab === tab.id
                  ? 'text-zinc-100'
                  : 'text-zinc-400 hover:text-zinc-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Main Content Area */}
        <div className="flex-1 px-6 pb-6 overflow-y-auto bg-[#0d1117]">
          {activeTab === 'summary' && <SummaryView />}
          {activeTab === 'time-metrics' && <TimeMetricsView />}
          {activeTab === 'data-export' && <DataExportView />}
          {activeTab === 'ai-spending' && <AISpendingView />}
          {activeTab === 'token-usage' && <TokenUsageView />}
          {activeTab === 'advanced-components' && <AdvancedDemoView />}
          
          {/* Placeholder for un-implemented tabs */}
          {!['summary', 'time-metrics', 'data-export', 'ai-spending', 'token-usage', 'advanced-components'].includes(activeTab) && (
            <div className="flex items-center justify-center h-full text-zinc-500 font-mono text-sm">
              {TABS.find(t => t.id === activeTab)?.label} Metrics coming soon...
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
