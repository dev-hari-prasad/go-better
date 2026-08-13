import React from 'react';
import { Info, Plus, ChevronDown, ListFilter } from 'lucide-react';

const MetricCard = ({ title, value, subValues, colSpan = 1 }: { title: string, value?: string, subValues?: { label: string, value: string }[], colSpan?: number }) => (
  <div className={`bg-[#16171d] border border-[#232530] rounded-xl p-5 flex flex-col relative h-[250px] ${colSpan === 2 ? 'col-span-2' : 'col-span-1'}`}>
    <div className="flex justify-between items-start mb-2">
      <h3 className="text-sm font-medium text-zinc-300">{title}</h3>
      <div className="flex items-center gap-2">
        <Info className="w-4 h-4 text-zinc-500 cursor-pointer hover:text-zinc-300" />
        <ListFilter className="w-4 h-4 text-zinc-500 cursor-pointer hover:text-zinc-300" />
      </div>
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

export const TimeMetricsView = () => {
  return (
    <div className="space-y-6 pt-2">
      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <MetricCard title="Time to Merge" value="0" />
        <MetricCard title="Weekly Review-Ready -> Merge Time" value="No data" colSpan={2} />
        
        <MetricCard title="Time to Last Human Review" value="0" />
        <MetricCard title="Weekly Review-Ready -> Last Human Review Time" value="No data" colSpan={2} />
      </div>
    </div>
  );
};
