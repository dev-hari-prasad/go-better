import React, { useId } from 'react';

export interface GobeAiLogoProps extends React.SVGProps<SVGSVGElement> {
  size?: number | string;
  className?: string;
  variant?: 'brand' | 'monochrome' | 'outline' | 'outline-to-brand';
  showBorderBeam?: boolean;
  disableAnimation?: boolean;
}

export const GobeAiLogo: React.FC<GobeAiLogoProps> = ({
  size,
  className = '',
  variant = 'brand',
  showBorderBeam = false,
  disableAnimation = false,
  style,
  ...props
}) => {
  const id = useId();
  const leftGradId = `gobe-logo-left-${id.replace(/:/g, '')}`;
  const rightGradId = `gobe-logo-right-${id.replace(/:/g, '')}`;
  const bottomGradId = `gobe-logo-bottom-${id.replace(/:/g, '')}`;
  const beamGradId = `gobe-logo-beam-${id.replace(/:/g, '')}`;
  const beamFilterId = `gobe-logo-filter-${id.replace(/:/g, '')}`;
  const beamMaskId = `gobe-logo-mask-${id.replace(/:/g, '')}`;

  const hasSizeClass = /\b(w-|h-)/.test(className);
  const resolvedSize = size !== undefined ? size : hasSizeClass ? undefined : 24;

  if (variant === 'outline-to-brand') {
    return (
      <span
        className={`relative inline-flex items-center justify-center shrink-0 pointer-events-none select-none ${className}`}
        style={
          resolvedSize !== undefined
            ? {
                width: resolvedSize,
                height: resolvedSize,
                minWidth: resolvedSize,
                minHeight: resolvedSize,
                ...style,
              }
            : style
        }
      >
        {/* Outline layer (visible by default, fades on group hover) */}
        <svg
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          width={resolvedSize}
          height={resolvedSize}
          className="w-full h-full transition-opacity duration-200 group-hover:opacity-0 group-hover/quick-chat:opacity-0 group-hover/topbar-logo:opacity-0 group-hover/gobe-logo:opacity-0 pointer-events-none"
        >
          <path
            d="M12 2.59009V13.6101L2.65 20.1501C1.8 19.1401 1.75 17.6101 2.7 15.9001L5.82 10.2901L8.76 5.00009C9.65 3.40009 10.82 2.59009 12 2.59009Z"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
          <path
            d="M21.3504 20.1501C20.7004 20.9401 19.5704 21.4101 18.0604 21.4101H5.94039C4.43039 21.4101 3.30039 20.9401 2.65039 20.1501L12.0004 13.6101L21.3504 20.1501Z"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
          <path
            d="M21.35 20.1501L12 13.6101V2.59009C13.18 2.59009 14.35 3.40009 15.24 5.00009L18.18 10.2901L21.3 15.9001C22.25 17.6101 22.2 19.1401 21.35 20.1501Z"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        </svg>

        {/* Brand filled layer (hidden by default, appears on group hover) */}
        <svg
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          width={resolvedSize}
          height={resolvedSize}
          className="w-full h-full absolute inset-0 transition-opacity duration-200 opacity-0 group-hover:opacity-100 group-hover/quick-chat:opacity-100 group-hover/topbar-logo:opacity-100 group-hover/gobe-logo:opacity-100 pointer-events-none"
        >
          <defs>
            <linearGradient id={leftGradId} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#d8ff43" />
              <stop offset="100%" stopColor="#c0f200" />
            </linearGradient>
            <linearGradient id={rightGradId} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#a5d800" />
              <stop offset="100%" stopColor="#769d00" />
            </linearGradient>
            <linearGradient id={bottomGradId} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#88b300" />
              <stop offset="100%" stopColor="#516e00" />
            </linearGradient>
          </defs>
          <path
            d="M12 2.59009V13.6101L2.65 20.1501C1.8 19.1401 1.75 17.6101 2.7 15.9001L5.82 10.2901L8.76 5.00009C9.65 3.40009 10.82 2.59009 12 2.59009Z"
            fill={`url(#${leftGradId})`}
            className="gobe-facet-left"
          />
          <path
            d="M21.3504 20.1501C20.7004 20.9401 19.5704 21.4101 18.0604 21.4101H5.94039C4.43039 21.4101 3.30039 20.9401 2.65039 20.1501L12.0004 13.6101L21.3504 20.1501Z"
            fill={`url(#${bottomGradId})`}
            className="gobe-facet-bottom"
          />
          <path
            d="M21.35 20.1501L12 13.6101V2.59009C13.18 2.59009 14.35 3.40009 15.24 5.00009L18.18 10.2901L21.3 15.9001C22.25 17.6101 22.2 19.1401 21.35 20.1501Z"
            fill={`url(#${rightGradId})`}
            className="gobe-facet-right"
          />
        </svg>
      </span>
    );
  }

  if (variant === 'outline') {
    return (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        width={resolvedSize || 24}
        height={resolvedSize || 24}
        className={className}
        style={style}
        {...props}
      >
        <path
          d="M12 2.59009V13.6101L2.65 20.1501C1.8 19.1401 1.75 17.6101 2.7 15.9001L5.82 10.2901L8.76 5.00009C9.65 3.40009 10.82 2.59009 12 2.59009Z"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        <path
          d="M21.3504 20.1501C20.7004 20.9401 19.5704 21.4101 18.0604 21.4101H5.94039C4.43039 21.4101 3.30039 20.9401 2.65039 20.1501L12.0004 13.6101L21.3504 20.1501Z"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        <path
          d="M21.35 20.1501L12 13.6101V2.59009C13.18 2.59009 14.35 3.40009 15.24 5.00009L18.18 10.2901L21.3 15.9001C22.25 17.6101 22.2 19.1401 21.35 20.1501Z"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      </svg>
    );
  }

  if (variant === 'monochrome') {
    return (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        width={resolvedSize || 24}
        height={resolvedSize || 24}
        className={className}
        style={style}
        {...props}
      >
        <path
          d="M12 2.59009V13.6101L2.65 20.1501C1.8 19.1401 1.75 17.6101 2.7 15.9001L5.82 10.2901L8.76 5.00009C9.65 3.40009 10.82 2.59009 12 2.59009Z"
          fill="currentColor"
        />
        <path
          opacity="0.65"
          d="M21.3504 20.1501C20.7004 20.9401 19.5704 21.4101 18.0604 21.4101H5.94039C4.43039 21.4101 3.30039 20.9401 2.65039 20.1501L12.0004 13.6101L21.3504 20.1501Z"
          fill="currentColor"
        />
        <path
          opacity="0.45"
          d="M21.35 20.1501L12 13.6101V2.59009C13.18 2.59009 14.35 3.40009 15.24 5.00009L18.18 10.2901L21.3 15.9001C22.25 17.6101 22.2 19.1401 21.35 20.1501Z"
          fill="currentColor"
        />
      </svg>
    );
  }

  return (
    <svg
      viewBox="1.8 2.2 20.4 19.4"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      width={resolvedSize || 24}
      height={resolvedSize || 24}
      className={className}
      style={style}
      {...props}
    >
      <defs>
        <linearGradient id={leftGradId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#d8ff43" />
          <stop offset="100%" stopColor="#c0f200" />
        </linearGradient>
        <linearGradient id={rightGradId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#a5d800" />
          <stop offset="100%" stopColor="#769d00" />
        </linearGradient>
        <linearGradient id={bottomGradId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#88b300" />
          <stop offset="100%" stopColor="#516e00" />
        </linearGradient>
        {showBorderBeam && (
          <mask id={beamMaskId}>
            <path
              d="M12 2.59009C13.18 2.59009 14.35 3.40009 15.24 5.00009L18.18 10.2901L21.3 15.9001C22.25 17.6101 22.2 19.1401 21.35 20.1501C20.7004 20.9401 19.5704 21.4101 18.0604 21.4101H5.94039C4.43039 21.4101 3.30039 20.9401 2.65039 20.1501C1.8 19.1401 1.75 17.6101 2.7 15.9001L5.82 10.2901L8.76 5.00009C9.65 3.40009 10.82 2.59009 12 2.59009Z"
              fill="none"
              stroke="white"
              strokeWidth="1.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </mask>
        )}
      </defs>
      {/* Left primary facet (bright illumination) */}
      <path
        d="M12 2.59009V13.6101L2.65 20.1501C1.8 19.1401 1.75 17.6101 2.7 15.9001L5.82 10.2901L8.76 5.00009C9.65 3.40009 10.82 2.59009 12 2.59009Z"
        fill={`url(#${leftGradId})`}
        className={disableAnimation ? undefined : "gobe-facet-left"}
      />
      {/* Bottom base facet (grounding depth) */}
      <path
        d="M21.3504 20.1501C20.7004 20.9401 19.5704 21.4101 18.0604 21.4101H5.94039C4.43039 21.4101 3.30039 20.9401 2.65039 20.1501L12.0004 13.6101L21.3504 20.1501Z"
        fill={`url(#${bottomGradId})`}
        className={disableAnimation ? undefined : "gobe-facet-bottom"}
      />
      {/* Right shaded facet (faceted 3D geometry) */}
      <path
        d="M21.35 20.1501L12 13.6101V2.59009C13.18 2.59009 14.35 3.40009 15.24 5.00009L18.18 10.2901L21.3 15.9001C22.25 17.6101 22.2 19.1401 21.35 20.1501Z"
        fill={`url(#${rightGradId})`}
        className={disableAnimation ? undefined : "gobe-facet-right"}
      />
      {/* Smooth Fading Comet Tail Masked Along Triangle Outline */}
      {showBorderBeam && (
        <g
          mask={`url(#${beamMaskId})`}
          className="opacity-0 group-hover:opacity-100 group-hover/gobe-logo:opacity-100 group-hover/topbar-logo:opacity-100 group-hover/quick-chat:opacity-100 transition-opacity duration-300 pointer-events-none"
        >
          <foreignObject x="-10" y="-10" width="44" height="44">
            <div
              className="w-full h-full animate-rockstar-beam"
              style={{
                background:
                  'conic-gradient(from 0deg, transparent 0deg, transparent 180deg, rgba(192,242,0,0) 200deg, rgba(192,242,0,0.12) 240deg, rgba(192,242,0,0.45) 290deg, #c0f200 340deg, #ffffff 360deg)',
                filter: 'drop-shadow(0 0 3px #c0f200)',
              }}
            />
          </foreignObject>
        </g>
      )}
    </svg>
  );
};
