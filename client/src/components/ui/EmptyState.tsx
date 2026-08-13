import React from 'react';
import { Button } from './Button';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  actionLabel,
  onAction,
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center bg-zinc-900/30 border border-dashed border-zinc-800/80 rounded-xl my-4">
      {icon && <div className="p-3 bg-zinc-800/50 rounded-lg text-zinc-400 mb-3">{icon}</div>}
      <h3 className="text-sm font-semibold text-zinc-200">{title}</h3>
      <p className="text-xs text-zinc-400 max-w-sm mt-1 mb-4 leading-relaxed">{description}</p>
      {actionLabel && onAction && (
        <Button variant="primary" size="sm" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
};
