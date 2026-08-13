import React from 'react';

export const DriveWavefront: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div className={`grid grid-cols-4 gap-[2px] w-fit ${className}`}>
      {[...Array(16)].map((_, i) => {
        const row = Math.floor(i / 4);
        const col = i % 4;
        const delay = (row + col) * 0.12;
        return (
          <div
            key={i}
            className="w-1 h-1 bg-zinc-500 rounded-[1px] opacity-20"
            style={{
              animation: `wavefront 1.2s infinite ease-in-out`,
              animationDelay: `${delay}s`,
            }}
          />
        );
      })}
      <style>{`
        @keyframes wavefront {
          0%, 100% { opacity: 0.2; transform: scale(0.8); }
          50% { opacity: 1; transform: scale(1); background-color: #c0f200; }
        }
      `}</style>
    </div>
  );
};
