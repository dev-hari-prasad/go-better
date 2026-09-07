import React, { useId } from 'react';
import {
  AvatarStyleId,
  getAvatarInitials,
  getAvatarPalette,
} from '../../utils/avatarUtils';

export interface UserAvatarProps {
  name: string;
  avatarStyleId?: AvatarStyleId;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | number;
  className?: string;
  showText?: boolean;
}

const SIZE_MAP = {
  xs: 'w-5.5 h-5.5 text-[9px]',
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-14 h-14 text-lg',
  xl: 'w-16 h-16 text-xl',
};

const NUMERIC_SIZE_TEXT = (px: number) => {
  if (px <= 24) return 'text-[9px]';
  if (px <= 32) return 'text-xs';
  if (px <= 44) return 'text-sm';
  if (px <= 56) return 'text-base';
  if (px <= 64) return 'text-lg';
  return 'text-xl';
};

export const UserAvatar: React.FC<UserAvatarProps> = ({
  name,
  avatarStyleId = 'gradient-smooth',
  size = 'md',
  className = '',
  showText = true,
}) => {
  const rawId = useId().replace(/[:]/g, '');
  const initials = getAvatarInitials(name);
  const palette = getAvatarPalette(name);

  const sizeClasses =
    typeof size === 'string'
      ? SIZE_MAP[size] || SIZE_MAP.md
      : `${NUMERIC_SIZE_TEXT(size)}`;

  const inlineStyles: React.CSSProperties =
    typeof size === 'number'
      ? { width: `${size}px`, height: `${size}px`, minWidth: `${size}px`, minHeight: `${size}px` }
      : {};

  const renderBackgroundContent = () => {
    switch (avatarStyleId) {
      case 'pixel-grid':
        return (
          <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full pointer-events-none">
            <defs>
              <pattern
                id={`px-pat-${rawId}`}
                width="10"
                height="10"
                patternUnits="userSpaceOnUse"
              >
                <rect x="2" y="2" width="3.5" height="3.5" fill={palette.patternFill} rx="0.5" />
                <rect x="7" y="7" width="2" height="2" fill={palette.patternFill} rx="0.5" opacity="0.6" />
              </pattern>
              <radialGradient id={`px-rad-${rawId}`} cx="50%" cy="30%" r="70%">
                <stop offset="0%" stopColor="#ffffff" stopOpacity="0.45" />
                <stop offset="50%" stopColor="#ffffff" stopOpacity="0.1" />
                <stop offset="100%" stopColor="#000000" stopOpacity="0.35" />
              </radialGradient>
            </defs>
            <rect width="100" height="100" fill={`url(#px-pat-${rawId})`} />
            <rect width="100" height="100" fill={`url(#px-rad-${rawId})`} />
          </svg>
        );

      case 'retro-rings':
        return (
          <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full pointer-events-none">
            <circle
              cx="50"
              cy="50"
              r="40"
              fill="none"
              stroke={palette.patternFill}
              strokeWidth="1.5"
              strokeDasharray="4 3"
              opacity="0.6"
            />
            <circle
              cx="50"
              cy="50"
              r="26"
              fill="none"
              stroke={palette.patternFill}
              strokeWidth="1.5"
              opacity="0.75"
            />
            <circle
              cx="50"
              cy="50"
              r="13"
              fill="none"
              stroke={palette.patternFill}
              strokeWidth="1.5"
              strokeDasharray="2 2"
              opacity="0.8"
            />
            <line
              x1="50"
              y1="0"
              x2="50"
              y2="100"
              stroke={palette.patternFill}
              strokeWidth="0.75"
              opacity="0.25"
            />
            <line
              x1="0"
              y1="50"
              x2="100"
              y2="50"
              stroke={palette.patternFill}
              strokeWidth="0.75"
              opacity="0.25"
            />
          </svg>
        );

      case 'mesh-aura':
        return (
          <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full pointer-events-none">
            <circle cx="28" cy="28" r="38" fill={palette.to} opacity="0.85" filter="blur(6px)" />
            <circle cx="72" cy="72" r="32" fill={palette.accent} opacity="0.75" filter="blur(6px)" />
            <circle cx="50" cy="50" r="18" fill="#ffffff" opacity="0.4" filter="blur(3px)" />
          </svg>
        );

      case 'geometric-cross':
        return (
          <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full pointer-events-none">
            <defs>
              <pattern
                id={`cross-pat-${rawId}`}
                width="12"
                height="12"
                patternUnits="userSpaceOnUse"
              >
                <path
                  d="M 6 3 L 6 9 M 3 6 L 9 6"
                  stroke={palette.patternFill}
                  strokeWidth="1"
                />
              </pattern>
            </defs>
            <rect width="100" height="100" fill={`url(#cross-pat-${rawId})`} />
          </svg>
        );

      case 'glass-prism':
        return (
          <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full pointer-events-none">
            <polygon points="0,0 100,0 100,45 0,85" fill={palette.to} opacity="0.45" />
            <line x1="0" y1="85" x2="100" y2="45" stroke="#ffffff" strokeWidth="2.5" opacity="0.7" />
            <circle cx="50" cy="50" r="48" fill="none" stroke="#ffffff" strokeWidth="1.5" opacity="0.3" />
          </svg>
        );

      case 'gradient-smooth':
      default:
        return (
          <div
            className="absolute inset-0 opacity-40 mix-blend-overlay pointer-events-none"
            style={{
              background: `radial-gradient(circle at 30% 30%, #ffffff 0%, transparent 70%)`,
            }}
          />
        );
    }
  };

  return (
    <div
      style={{
        ...inlineStyles,
        background: `linear-gradient(135deg, ${palette.from} 0%, ${palette.to} 100%)`,
        color: palette.textColor,
      }}
      className={`relative rounded-full flex items-center justify-center font-bold select-none overflow-hidden shrink-0 shadow-sm ${sizeClasses} ${className}`}
    >
      {/* Pattern Overlay */}
      {renderBackgroundContent()}

      {/* Initials Text */}
      {showText && (
        <span
          className="relative z-10 font-bold tracking-tight uppercase leading-none drop-shadow-[0_1px_1px_rgba(0,0,0,0.25)]"
          style={{ color: palette.textColor }}
        >
          {initials}
        </span>
      )}
    </div>
  );
};
