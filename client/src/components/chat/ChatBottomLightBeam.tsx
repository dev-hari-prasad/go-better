import React from 'react';

interface ChatBottomLightBeamProps {
  /** Whether the light beam is active (visible until the first message is sent, or always when mounted in initial states) */
  active?: boolean;
  /** Whether to show the moving aurora wave bump (default: true). Set false to display only the stationary shiny edge rim */
  showBump?: boolean;
}

/**
 * ChatBottomLightBeam / ChatShinyEdges
 * Renders the luminous chromatic aurora light strictly INSIDE the chat box:
 * 1. Corner radius coverage: Curves up into the bottom-left and bottom-right rounded corners.
 * 2. Internal shifting light: The colors gently shift and shimmer within the light itself (animate-aurora-shimmer).
 * 3. Soft traveling wave: A gentle, super thin light wave glides along the bottom inside curve.
 * 4. Refined subtle visibility: Kept gentle, elegant, and non-distracting (no harsh glare or outside bleed).
 */
export const ChatBottomLightBeam: React.FC<ChatBottomLightBeamProps> = ({ active = true, showBump = true }) => {
  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none absolute inset-0 rounded-[24px] overflow-hidden select-none z-0 transition-opacity duration-500 ease-out ${
        active ? 'opacity-100' : 'opacity-0'
      }`}
    >
      {/* 1. Subtle Inner Rim Tint (Strictly Inset - Non-bumpy light powers on slowly) */}
      <div
        className="absolute inset-0 rounded-[24px] pointer-events-none animate-light-poweron"
        style={{
          boxShadow:
            'inset 0 0 8px 0 rgba(6, 182, 212, 0.04), inset 0 -1px 2px 0 rgba(192, 242, 0, 0.08)',
        }}
      />

      {/* 2. Chromatic Light hugging the bottom and curving up into the border-radius corners */}
      <div
        className="absolute bottom-0 inset-x-0 h-[20px] rounded-b-[24px] pointer-events-none overflow-hidden"
        style={{
          maskImage: 'linear-gradient(to top, black 30%, transparent 100%)',
          WebkitMaskImage: 'linear-gradient(to top, black 30%, transparent 100%)',
        }}
      >
        {/* NON-BUMPY GLOWS: Inner curves, specular rim, and baseline power on slowly */}
        <div className="absolute inset-0 rounded-b-[24px] pointer-events-none animate-light-poweron">
          {/* Soft chromatic diffuse glow following the bottom & corner curves */}
          <div
            className="absolute inset-0 rounded-b-[24px] pointer-events-none opacity-25 animate-aurora-shimmer"
            style={{
              borderBottom: '1.5px solid rgba(192, 242, 0, 0.4)',
              borderLeft: '1.5px solid rgba(168, 85, 247, 0.35)',
              borderRight: '1.5px solid rgba(16, 185, 129, 0.35)',
              filter: 'blur(1.5px)',
            }}
          />

          {/* Crisp specular rim tracing the bottom and corner radius curves */}
          <div
            className="absolute inset-0 rounded-b-[24px] pointer-events-none opacity-35 animate-aurora-shimmer"
            style={{
              borderBottom: '1px solid rgba(192, 242, 0, 0.45)',
              borderLeft: '1px solid rgba(236, 72, 153, 0.35)',
              borderRight: '1px solid rgba(16, 185, 129, 0.35)',
            }}
          />

          {/* Shimmering chromatic gradient baseline across the bottom rim */}
          <div
            className="absolute bottom-0 inset-x-0 h-[2px] opacity-35 animate-aurora-shimmer"
            style={{
              background:
                'linear-gradient(90deg, transparent 0%, rgba(147, 51, 234, 0.3) 4%, rgba(236, 72, 153, 0.4) 18%, rgba(6, 182, 212, 0.45) 48%, rgba(255, 255, 255, 0.4) 56%, rgba(192, 242, 0, 0.5) 76%, rgba(16, 185, 129, 0.4) 94%, transparent 100%)',
              filter: 'blur(0.8px)',
            }}
          />
        </div>

        {/* BUMPY GLOW: Super thin moving aurora wave bump (powers on slowly, rendered only when showBump is true) */}
        {showBump && (
          <div className="absolute inset-0 pointer-events-none animate-light-poweron-bumpy">
            <div className="absolute bottom-0 left-1/2 w-[180px] max-w-[35%] h-[2px] pointer-events-none animate-aurora-glide">
              {/* Soft Traveling Aura Halo (super thin hairline) */}
              <div
                className="absolute bottom-0 inset-x-0 h-[1.4px] rounded-full blur-[0.8px] opacity-25 animate-aurora-shimmer"
                style={{
                  background:
                    'linear-gradient(90deg, transparent 0%, rgba(147, 51, 234, 0.25) 15%, rgba(236, 72, 153, 0.3) 30%, rgba(6, 182, 212, 0.35) 50%, rgba(192, 242, 0, 0.4) 70%, rgba(16, 185, 129, 0.3) 85%, transparent 100%)',
                }}
              />

              {/* Luminous Core of the traveling wave (super thin filament) */}
              <div
                className="absolute bottom-0 inset-x-[8%] h-[0.7px] rounded-full opacity-35 animate-aurora-shimmer"
                style={{
                  background:
                    'linear-gradient(90deg, transparent 0%, rgba(236, 72, 153, 0.3) 18%, rgba(6, 182, 212, 0.4) 42%, #ffffff 52%, rgba(192, 242, 0, 0.45) 68%, rgba(16, 185, 129, 0.3) 82%, transparent 100%)',
                }}
              />

              {/* Feathered Focal Glint (super thin soft glint) */}
              <div
                className="absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-[0.7px] rounded-full opacity-30 blur-[0.4px]"
                style={{
                  background:
                    'linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.25) 35%, #ffffff 50%, rgba(192, 242, 0, 0.3) 65%, transparent 100%)',
                }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export const ChatShinyEdges = ChatBottomLightBeam;
