import React from 'react';

export const OpenRouterLogo: React.FC<{ className?: string }> = ({ className = 'w-5 h-5' }) => {
  return (
    <img
      src="/openrouter.png"
      alt="OpenRouter"
      className={`${className} object-contain`}
      draggable={false}
    />
  );
};
