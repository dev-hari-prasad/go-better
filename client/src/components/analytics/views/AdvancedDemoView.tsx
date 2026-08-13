import React from 'react';
import AdvancedLoadingState from '../../ui/advanced/LoadingState';
import StreamingText from '../../ui/advanced/StreamingText';
import TaskRows from '../../ui/advanced/TaskRows';
import RecommendationCard from '../../ui/advanced/RecommendationCard';
import FilterTable from '../../ui/advanced/FilterTable';

export const AdvancedDemoView = () => {
  return (
    <div className="space-y-12 pb-20">
      <div>
        <h2 className="text-lg font-semibold text-zinc-100 mb-4 border-b border-[#232530] pb-2">Filter Table</h2>
        <FilterTable />
      </div>

      <div>
        <h2 className="text-lg font-semibold text-zinc-100 mb-4 border-b border-[#232530] pb-2">Task Rows</h2>
        <TaskRows />
      </div>

      <div>
        <h2 className="text-lg font-semibold text-zinc-100 mb-4 border-b border-[#232530] pb-2">Recommendation Card</h2>
        <RecommendationCard />
      </div>

      <div>
        <h2 className="text-lg font-semibold text-zinc-100 mb-4 border-b border-[#232530] pb-2">Streaming Text</h2>
        <StreamingText />
      </div>

      <div>
        <h2 className="text-lg font-semibold text-zinc-100 mb-4 border-b border-[#232530] pb-2">Loading States</h2>
        <div className="flex flex-col gap-6 p-6 bg-[#16171d] border border-[#232530] rounded-xl w-fit">
          <AdvancedLoadingState label="Drive Wavefront" variant="Drive" />
          <AdvancedLoadingState label="Dots Wavefront" variant="Dots" />
          <AdvancedLoadingState label="Orbit Comet" variant="Orbit" />
        </div>
      </div>
    </div>
  );
};
