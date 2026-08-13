import React from 'react';

interface LoadingStateProps {
  message?: string;
  step?: string;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  message = 'AI Code Reviewing in Progress',
  step = 'Executing static AST analysis and review rules...',
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-12 bg-[#1e2028] border border-[#2d303d] rounded-2xl my-6 text-center shadow-xl max-w-lg mx-auto">
      <div className="relative w-14 h-14 mb-5">
        <div className="absolute inset-0 rounded-full border-2 border-[#c0f200]/20 border-t-[#c0f200] animate-spin"></div>
        <div className="absolute inset-2 rounded-full border-2 border-emerald-500/20 border-b-emerald-500 animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
      </div>
      <h4 className="text-base font-bold text-zinc-100">{message}</h4>
      <p className="text-xs text-zinc-400 font-mono mt-1.5 animate-pulse">{step}</p>

      <div className="w-56 bg-[#16171d] rounded-full h-1.5 mt-5 overflow-hidden border border-[#2d303d]">
        <div className="bg-[#c0f200] h-full rounded-full animate-pulse w-3/4"></div>
      </div>
    </div>
  );
};
