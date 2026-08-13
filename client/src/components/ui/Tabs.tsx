import React from 'react';

export interface TabItem {
  id: string;
  label: string;
  count?: number;
  icon?: React.ReactNode;
  badge?: React.ReactNode;
}

interface TabsProps {
  tabs: TabItem[];
  activeTab: string;
  onChange: (tabId: string) => void;
  className?: string;
  rightContent?: React.ReactNode;
}

export const Tabs: React.FC<TabsProps> = ({ tabs, activeTab, onChange, className = '', rightContent }) => {
  return (
    <div className={`flex items-center justify-between border-b border-[#232530] px-4 bg-[#111216] ${className}`}>
      {/* Left Tabs */}
      <div className="flex items-center gap-4 overflow-x-auto">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onChange(tab.id)}
              className={`relative flex items-center gap-2 py-2.5 text-xs transition-all duration-150 whitespace-nowrap cursor-pointer select-none apple-button ${
                isActive
                  ? 'text-zinc-100 font-semibold'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              {tab.icon && <span className="shrink-0">{tab.icon}</span>}
              <span>{tab.label}</span>
              {typeof tab.count === 'number' && (
                <span
                  className={`px-1.5 py-0.2 rounded text-[10px] font-mono transition-colors ${
                    isActive ? 'bg-[#c0f200]/20 text-[#c0f200] font-semibold' : 'bg-zinc-800 text-zinc-400'
                  }`}
                >
                  {tab.count}
                </span>
              )}
              {/* OpenRouter style volt-green bottom indicator line */}
              {isActive && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#c0f200] rounded-full" />
              )}
            </button>
          );
        })}
      </div>

      {/* Right Content / Actions */}
      {rightContent && (
        <div className="flex items-center gap-2.5 shrink-0 py-1.5 pl-4">
          {rightContent}
        </div>
      )}
    </div>
  );
};
