import React from 'react';
import { Calendar, Download } from 'lucide-react';

export const DataExportView = () => {
  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h2 className="text-base font-semibold text-zinc-100 mb-1">Review Metrics</h2>
        <p className="text-[13px] text-zinc-400">
          Download review metrics for each merged pull request. See <a href="#" className="text-zinc-300 underline underline-offset-2">documentation</a> for field details.
        </p>
      </div>

      <div className="bg-[#16171d] border border-[#232530] rounded-xl p-6">
        <div className="flex items-center justify-between mb-6">
          <span className="text-[13px] font-medium text-zinc-300">Date range</span>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-[#161b22] border border-[#30363d] rounded-md text-sm text-zinc-300 cursor-pointer hover:border-zinc-500 transition-colors">
            <Calendar className="w-4 h-4 text-zinc-400" />
            <span>Date range</span>
            <span className="bg-[#21262d] px-2 py-0.5 rounded text-xs ml-2">Aug 6 - Aug 12</span>
          </div>
        </div>

        <div className="flex justify-end border-t border-[#232530] pt-4">
          <button className="flex items-center gap-2 px-4 py-2 bg-transparent border border-[#30363d] hover:bg-[#21262d] rounded-lg text-sm text-zinc-300 transition-colors">
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
      </div>
    </div>
  );
};
