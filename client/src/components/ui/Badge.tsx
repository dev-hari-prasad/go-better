import React from 'react';
import { FindingSeverity, ReviewStatus } from '../../types/codeReview';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'critical' | 'warning' | 'suggestion' | 'info' | 'approved' | 'changes_requested' | 'in_progress' | 'neutral' | 'outline';
  size?: 'sm' | 'md';
  className?: string;
  icon?: React.ReactNode;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'neutral',
  size = 'sm',
  className = '',
  icon,
}) => {
  const baseStyles = 'inline-flex items-center gap-1.5 font-medium rounded-full tracking-tight transition-colors select-none';

  const sizeStyles = {
    sm: 'px-2 py-0.2 text-[11px]',
    md: 'px-2.5 py-0.5 text-xs font-medium',
  };

  const variantStyles = {
    critical: 'bg-rose-500/10 text-rose-400 border border-rose-500/20',
    warning: 'bg-amber-500/10 text-amber-400 border border-amber-500/20',
    suggestion: 'bg-[#c0f200]/10 text-[#c0f200] border border-[#c0f200]/20',
    info: 'bg-sky-500/10 text-sky-400 border border-sky-500/20',
    approved: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
    changes_requested: 'bg-rose-500/10 text-rose-400 border border-rose-500/20',
    in_progress: 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20',
    neutral: 'bg-zinc-800/80 text-zinc-400 border border-zinc-700/60',
    outline: 'bg-transparent text-zinc-400 border border-zinc-700/60',
  };

  return (
    <span className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}>
      {icon && <span className="shrink-0">{icon}</span>}
      <span>{children}</span>
    </span>
  );
};

export const SeverityBadge: React.FC<{ severity: FindingSeverity; size?: 'sm' | 'md' }> = ({ severity, size = 'sm' }) => {
  const config = {
    critical: { label: 'Critical', variant: 'critical' as const },
    warning: { label: 'Warning', variant: 'warning' as const },
    suggestion: { label: 'Suggestion', variant: 'suggestion' as const },
    info: { label: 'Info', variant: 'info' as const },
  };

  const current = config[severity];

  return (
    <Badge variant={current.variant} size={size}>
      <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
      {current.label}
    </Badge>
  );
};

export const StatusBadge: React.FC<{ status: ReviewStatus; size?: 'sm' | 'md' }> = ({ status, size = 'sm' }) => {
  const config = {
    pending: { label: 'Pending AI Review', variant: 'neutral' as const },
    in_progress: { label: 'Review in Progress', variant: 'in_progress' as const },
    changes_requested: { label: 'Changes Requested', variant: 'changes_requested' as const },
    approved: { label: 'Approved', variant: 'approved' as const },
    completed: { label: 'Review Completed', variant: 'approved' as const },
  };

  const current = config[status];

  return (
    <Badge variant={current.variant} size={size}>
      {current.label}
    </Badge>
  );
};
