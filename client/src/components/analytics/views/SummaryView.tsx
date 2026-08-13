import React from 'react';
import { Info, Plus, ChevronDown } from 'lucide-react';

const MetricCard = ({ title, value, subValues }: { title: string, value?: string, subValues?: { label: string, value: string }[] }) => (
  <div className="bg-[#16171d] border border-[#232530] rounded-xl p-5 flex flex-col relative h-[140px]">
    <div className="flex justify-between items-start mb-2">
      <h3 className="text-sm font-medium text-zinc-300">{title}</h3>
      <Info className="w-4 h-4 text-zinc-500 cursor-pointer hover:text-zinc-300" />
    </div>
    <div className="flex-1 flex items-center justify-center">
      {subValues ? (
        <div className="flex w-full justify-around items-center h-full">
          {subValues.map((sv, idx) => (
            <div key={idx} className="flex flex-col items-center gap-1">
              <span className="text-xs text-zinc-400">{sv.label}</span>
              <span className="text-4xl font-semibold text-zinc-100">{sv.value}</span>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-5xl font-semibold text-zinc-100">{value}</div>
      )}
    </div>
  </div>
);

export const SummaryView = () => {
  return (
    <div className="space-y-6 pt-2">
      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <MetricCard title="Active Repositories" value="0" />
        <MetricCard title="Merged Pull Requests" subValues={[{ label: 'Total Merged', value: '0' }, { label: 'Avg per User', value: '0' }]} />
        <MetricCard title="Active Users" subValues={[{ label: 'Assigned', value: '0' }, { label: 'Unassigned', value: '0' }]} />
        
        <MetricCard title="Chat Usage" value="0" />
        <MetricCard title="Median Time" value="0" />
        <MetricCard title="Reviewer Time Saved" value="No data" />
        
        <MetricCard title="CodeRabbit Review Comments" value="0" />
        <MetricCard title="Review Comments by Severity" value="No data" />
        <MetricCard title="Severity Distribution" value="No data" />
      </div>
    </div>
  );
};
