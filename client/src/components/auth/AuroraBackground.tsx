import React from 'react';

/**
 * AuroraSilkBackground
 * Sculptural monochrome silk drapery background featuring:
 * - Clean top-right silk folds with soft ambient depth
 * - Multi-layered feathered specular glint sweeping across the crest
 * - Clean, open bottom-left quadrant
 */
export const AuroraSilkBackground: React.FC = () => {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none select-none bg-[#0d1117]">
      {/* ── Scoped CSS for Multi-Layered Feathered Glint with High-Luminance Shine ── */}
      <style>{`
        /* Top-Right Shard: Concentric synchronized motion */
        @keyframes glintSlideTop1 {
          0% { stroke-dashoffset: 146; opacity: 0; }
          12% { opacity: 0.35; }
          82% { opacity: 0.35; }
          100% { stroke-dashoffset: -46; opacity: 0; }
        }
        @keyframes glintSlideTop2 {
          0% { stroke-dashoffset: 139; opacity: 0; }
          12% { opacity: 0.85; }
          82% { opacity: 0.85; }
          100% { stroke-dashoffset: -53; opacity: 0; }
        }
        @keyframes glintSlideTop3 {
          0% { stroke-dashoffset: 133; opacity: 0; }
          12% { opacity: 1; }
          82% { opacity: 1; }
          100% { stroke-dashoffset: -59; opacity: 0; }
        }

        /* Top-Right Classes */
        .glint-top-feather {
          stroke-dasharray: 38 100;
          stroke: #c0f200;
          stroke-width: 0.9px;
          stroke-linecap: round;
          animation: glintSlideTop1 7s cubic-bezier(0.4, 0, 0.2, 1) infinite;
        }
        .glint-top-body {
          stroke-dasharray: 24 100;
          stroke: #c0f200;
          stroke-width: 1.3px;
          stroke-linecap: round;
          filter: drop-shadow(0 0 5px #c0f200) drop-shadow(0 0 12px rgba(192, 242, 0, 0.75));
          animation: glintSlideTop2 7s cubic-bezier(0.4, 0, 0.2, 1) infinite;
        }
        .glint-top-core {
          stroke-dasharray: 12 100;
          stroke: #ffffff;
          stroke-width: 1.6px;
          stroke-linecap: round;
          filter: drop-shadow(0 0 2px #ffffff) drop-shadow(0 0 6px #c0f200) drop-shadow(0 0 16px #c0f200);
          animation: glintSlideTop3 7s cubic-bezier(0.4, 0, 0.2, 1) infinite;
        }

        /* Top-Right Middle Shard (Shard 2): Cascading fluid glint */
        @keyframes glintSlideTopMiddle1 {
          0% { stroke-dashoffset: 146; opacity: 0; }
          12% { opacity: 0.35; }
          82% { opacity: 0.35; }
          100% { stroke-dashoffset: -46; opacity: 0; }
        }
        @keyframes glintSlideTopMiddle2 {
          0% { stroke-dashoffset: 139; opacity: 0; }
          12% { opacity: 0.85; }
          82% { opacity: 0.85; }
          100% { stroke-dashoffset: -53; opacity: 0; }
        }
        @keyframes glintSlideTopMiddle3 {
          0% { stroke-dashoffset: 133; opacity: 0; }
          12% { opacity: 1; }
          82% { opacity: 1; }
          100% { stroke-dashoffset: -59; opacity: 0; }
        }

        .glint-top-middle-feather {
          stroke-dasharray: 38 100;
          stroke: #c0f200;
          stroke-width: 0.85px;
          stroke-linecap: round;
          animation: glintSlideTopMiddle1 7s cubic-bezier(0.4, 0, 0.2, 1) infinite 0.3s;
        }
        .glint-top-middle-body {
          stroke-dasharray: 24 100;
          stroke: #c0f200;
          stroke-width: 1.2px;
          stroke-linecap: round;
          filter: drop-shadow(0 0 5px #c0f200) drop-shadow(0 0 12px rgba(192, 242, 0, 0.75));
          animation: glintSlideTopMiddle2 7s cubic-bezier(0.4, 0, 0.2, 1) infinite 0.3s;
        }
        .glint-top-middle-core {
          stroke-dasharray: 12 100;
          stroke: #ffffff;
          stroke-width: 1.5px;
          stroke-linecap: round;
          filter: drop-shadow(0 0 2px #ffffff) drop-shadow(0 0 6px #c0f200) drop-shadow(0 0 16px #c0f200);
          animation: glintSlideTopMiddle3 7s cubic-bezier(0.4, 0, 0.2, 1) infinite 0.3s;
        }

        /* Top-Right Rightmost Shard: Cascading fluid glint */
        @keyframes glintSlideTopRight1 {
          0% { stroke-dashoffset: 146; opacity: 0; }
          12% { opacity: 0.35; }
          82% { opacity: 0.35; }
          100% { stroke-dashoffset: -46; opacity: 0; }
        }
        @keyframes glintSlideTopRight2 {
          0% { stroke-dashoffset: 139; opacity: 0; }
          12% { opacity: 0.85; }
          82% { opacity: 0.85; }
          100% { stroke-dashoffset: -53; opacity: 0; }
        }
        @keyframes glintSlideTopRight3 {
          0% { stroke-dashoffset: 133; opacity: 0; }
          12% { opacity: 1; }
          82% { opacity: 1; }
          100% { stroke-dashoffset: -59; opacity: 0; }
        }

        .glint-top-right-feather {
          stroke-dasharray: 38 100;
          stroke: #c0f200;
          stroke-width: 0.85px;
          stroke-linecap: round;
          animation: glintSlideTopRight1 7s cubic-bezier(0.4, 0, 0.2, 1) infinite 0.6s;
        }
        .glint-top-right-body {
          stroke-dasharray: 24 100;
          stroke: #c0f200;
          stroke-width: 1.2px;
          stroke-linecap: round;
          filter: drop-shadow(0 0 5px #c0f200) drop-shadow(0 0 12px rgba(192, 242, 0, 0.75));
          animation: glintSlideTopRight2 7s cubic-bezier(0.4, 0, 0.2, 1) infinite 0.6s;
        }
        .glint-top-right-core {
          stroke-dasharray: 12 100;
          stroke: #ffffff;
          stroke-width: 1.5px;
          stroke-linecap: round;
          filter: drop-shadow(0 0 2px #ffffff) drop-shadow(0 0 6px #c0f200) drop-shadow(0 0 16px #c0f200);
          animation: glintSlideTopRight3 7s cubic-bezier(0.4, 0, 0.2, 1) infinite 0.6s;
        }

        /* Bottom-Left Wing Shard: Asynchronous sweeping glint */
        @keyframes glintSlideBottom1 {
          0% { stroke-dashoffset: 146; opacity: 0; }
          12% { opacity: 0.35; }
          82% { opacity: 0.35; }
          100% { stroke-dashoffset: -46; opacity: 0; }
        }
        @keyframes glintSlideBottom2 {
          0% { stroke-dashoffset: 139; opacity: 0; }
          12% { opacity: 0.85; }
          82% { opacity: 0.85; }
          100% { stroke-dashoffset: -53; opacity: 0; }
        }
        @keyframes glintSlideBottom3 {
          0% { stroke-dashoffset: 133; opacity: 0; }
          12% { opacity: 1; }
          82% { opacity: 1; }
          100% { stroke-dashoffset: -59; opacity: 0; }
        }

        .glint-bottom-feather {
          stroke-dasharray: 38 100;
          stroke: #c0f200;
          stroke-width: 0.9px;
          stroke-linecap: round;
          animation: glintSlideBottom1 8s cubic-bezier(0.4, 0, 0.2, 1) infinite 1.2s;
        }
        .glint-bottom-body {
          stroke-dasharray: 24 100;
          stroke: #c0f200;
          stroke-width: 1.3px;
          stroke-linecap: round;
          filter: drop-shadow(0 0 5px #c0f200) drop-shadow(0 0 12px rgba(192, 242, 0, 0.75));
          animation: glintSlideBottom2 8s cubic-bezier(0.4, 0, 0.2, 1) infinite 1.2s;
        }
        .glint-bottom-core {
          stroke-dasharray: 12 100;
          stroke: #ffffff;
          stroke-width: 1.6px;
          stroke-linecap: round;
          filter: drop-shadow(0 0 2px #ffffff) drop-shadow(0 0 6px #c0f200) drop-shadow(0 0 16px #c0f200);
          animation: glintSlideBottom3 8s cubic-bezier(0.4, 0, 0.2, 1) infinite 1.2s;
        }

        /* Bottom-Left Horizontal Terrace: Slower ambient ripple glint */
        @keyframes glintSlideTerrace1 {
          0% { stroke-dashoffset: 146; opacity: 0; }
          12% { opacity: 0.25; }
          82% { opacity: 0.25; }
          100% { stroke-dashoffset: -46; opacity: 0; }
        }
        @keyframes glintSlideTerrace2 {
          0% { stroke-dashoffset: 139; opacity: 0; }
          12% { opacity: 0.70; }
          82% { opacity: 0.70; }
          100% { stroke-dashoffset: -53; opacity: 0; }
        }
        @keyframes glintSlideTerrace3 {
          0% { stroke-dashoffset: 133; opacity: 0; }
          12% { opacity: 0.90; }
          82% { opacity: 0.90; }
          100% { stroke-dashoffset: -59; opacity: 0; }
        }

        .glint-terrace-feather {
          stroke-dasharray: 38 100;
          stroke: #c0f200;
          stroke-width: 0.8px;
          stroke-linecap: round;
          animation: glintSlideTerrace1 10s cubic-bezier(0.4, 0, 0.2, 1) infinite 4.2s;
        }
        .glint-terrace-body {
          stroke-dasharray: 22 100;
          stroke: #c0f200;
          stroke-width: 1.1px;
          stroke-linecap: round;
          filter: drop-shadow(0 0 4px #c0f200) drop-shadow(0 0 10px rgba(192, 242, 0, 0.6));
          animation: glintSlideTerrace2 10s cubic-bezier(0.4, 0, 0.2, 1) infinite 4.2s;
        }
        .glint-terrace-core {
          stroke-dasharray: 10 100;
          stroke: #ffffff;
          stroke-width: 1.4px;
          stroke-linecap: round;
          filter: drop-shadow(0 0 2px #ffffff) drop-shadow(0 0 5px #c0f200);
          animation: glintSlideTerrace3 10s cubic-bezier(0.4, 0, 0.2, 1) infinite 4.2s;
        }
      `}</style>

      {/* ── Shared Defs for Titanium Silk Shards & Ambient Shadows ── */}
      <svg className="absolute w-0 h-0" aria-hidden="true" focusable="false">
        <defs>
          {/* Resting Crest Stroke Gradient */}
          <linearGradient id="silk-resting-rim" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#c0f200" stopOpacity="0.04" />
            <stop offset="50%" stopColor="#cbd5e1" stopOpacity="0.18" />
            <stop offset="100%" stopColor="#c0f200" stopOpacity="0.04" />
          </linearGradient>

          {/* Neutral Liquid Titanium Silk Gradients (Softened, low-contrast) */}
          <linearGradient id="silk-titanium-primary" x1="55%" y1="0%" x2="95%" y2="85%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.65" />
            <stop offset="18%" stopColor="#f8fafc" stopOpacity="0.45" />
            <stop offset="35%" stopColor="#e2e8f0" stopOpacity="0.28" />
            <stop offset="60%" stopColor="#94a3b8" stopOpacity="0.14" />
            <stop offset="85%" stopColor="#334155" stopOpacity="0.05" />
            <stop offset="100%" stopColor="#0d1117" stopOpacity="0" />
          </linearGradient>

          <linearGradient id="silk-titanium-secondary" x1="65%" y1="0%" x2="100%" y2="75%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.45" />
            <stop offset="25%" stopColor="#cbd5e1" stopOpacity="0.25" />
            <stop offset="55%" stopColor="#64748b" stopOpacity="0.12" />
            <stop offset="85%" stopColor="#1e293b" stopOpacity="0.04" />
            <stop offset="100%" stopColor="#0d1117" stopOpacity="0" />
          </linearGradient>

          <linearGradient id="silk-titanium-tertiary" x1="76%" y1="0%" x2="100%" y2="52%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.30" />
            <stop offset="35%" stopColor="#94a3b8" stopOpacity="0.12" />
            <stop offset="70%" stopColor="#334155" stopOpacity="0.04" />
            <stop offset="100%" stopColor="#0d1117" stopOpacity="0" />
          </linearGradient>

          {/* Deep Under-Crevice Velvet Shadow */}
          <linearGradient id="silk-void-shadow" x1="50%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#000000" stopOpacity="0.95" />
            <stop offset="50%" stopColor="#05070c" stopOpacity="0.70" />
            <stop offset="100%" stopColor="#0d1117" stopOpacity="0" />
          </linearGradient>

          {/* Ambient Radial Backlight Glow with Subtle Warmth */}
          <radialGradient id="silk-backlight-glow" cx="80%" cy="15%" r="55%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.09" />
            <stop offset="30%" stopColor="#c0f200" stopOpacity="0.03" />
            <stop offset="60%" stopColor="#64748b" stopOpacity="0.015" />
            <stop offset="100%" stopColor="#0d1117" stopOpacity="0" />
          </radialGradient>

          <filter id="silk-glow-blur" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="45" />
          </filter>

          {/* Bottom-Left Titanium Silk Gradients */}
          <linearGradient id="silk-titanium-bl-primary" x1="15%" y1="85%" x2="80%" y2="25%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.58" />
            <stop offset="22%" stopColor="#f8fafc" stopOpacity="0.38" />
            <stop offset="45%" stopColor="#cbd5e1" stopOpacity="0.22" />
            <stop offset="75%" stopColor="#64748b" stopOpacity="0.08" />
            <stop offset="100%" stopColor="#0d1117" stopOpacity="0" />
          </linearGradient>

          <linearGradient id="silk-titanium-bl-secondary" x1="12%" y1="76%" x2="70%" y2="95%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.48" />
            <stop offset="22%" stopColor="#cbd5e1" stopOpacity="0.24" />
            <stop offset="55%" stopColor="#475569" stopOpacity="0.09" />
            <stop offset="100%" stopColor="#0d1117" stopOpacity="0" />
          </linearGradient>

          <linearGradient id="silk-bl-void" x1="10%" y1="90%" x2="70%" y2="40%">
            <stop offset="0%" stopColor="#000000" stopOpacity="0.90" />
            <stop offset="50%" stopColor="#05070c" stopOpacity="0.60" />
            <stop offset="100%" stopColor="#0d1117" stopOpacity="0" />
          </linearGradient>

          <radialGradient id="silk-backlight-glow-bl" cx="20%" cy="75%" r="55%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.07" />
            <stop offset="35%" stopColor="#c0f200" stopOpacity="0.025" />
            <stop offset="65%" stopColor="#64748b" stopOpacity="0.01" />
            <stop offset="100%" stopColor="#0d1117" stopOpacity="0" />
          </radialGradient>
        </defs>
      </svg>

      {/* ── Top-Right High-Definition Silk Drapery (Smaller size: ~50vw x 62vh) ── */}
      <svg
        className="absolute top-0 right-0 w-[50vw] sm:w-[54vw] max-w-[760px] h-[60vh] sm:h-[65vh] transition-opacity duration-700"
        viewBox="0 0 1000 900"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="xMaxYMin meet"
      >
        {/* Soft, less visible shard bodies group */}
        <g opacity="0.36">
          {/* Ambient soft backlight */}
          <circle cx="800" cy="180" r="340" fill="url(#silk-backlight-glow)" filter="url(#silk-glow-blur)" />

          {/* Deep under-crevice shadow */}
          <path
            d="M 540 0 C 580 140, 680 300, 780 500 C 860 640, 930 770, 1000 860 L 1000 0 Z"
            fill="url(#silk-void-shadow)"
          />

          {/* Shard 2: Secondary wave / valley behind main crest */}
          <path
            d="M 670 0 C 710 130, 800 270, 880 430 C 940 550, 975 660, 1000 740 L 1000 0 Z"
            fill="url(#silk-titanium-secondary)"
          />

          {/* Shard 3: Tertiary fluting ripple along upper-right corner */}
          <path
            d="M 770 0 C 815 140, 880 300, 945 460 C 970 515, 995 560, 1000 575 L 1000 0 Z"
            fill="url(#silk-titanium-tertiary)"
          />

          {/* Shard 1: Primary Sculptural Silk Fold */}
          <path
            d="M 540 0 C 580 150, 690 330, 790 530 C 870 670, 940 790, 1000 880 L 1000 740 C 920 610, 820 440, 730 260 C 660 140, 600 0, 540 0 Z"
            fill="url(#silk-titanium-primary)"
          />
        </g>

        {/* Resting subtle crest rim */}
        <path
          d="M 540 0 C 580 150, 690 330, 790 530 C 870 670, 940 790, 1000 880"
          stroke="url(#silk-resting-rim)"
          strokeWidth="0.8"
          fill="none"
        />

        {/* ── MULTI-LAYERED FEATHERED GLINT: Ultra-shiny with edges dissolving into 0 opacity ── */}
        {/* Layer 1: Feathered Head & Tail Tips */}
        <path
          d="M 540 0 C 580 150, 690 330, 790 530 C 870 670, 940 790, 1000 880"
          pathLength="100"
          className="glint-top-feather"
          fill="none"
        />
        {/* Layer 2: Radiant Primary Neon Body with Drop-Shadow */}
        <path
          d="M 540 0 C 580 150, 690 330, 790 530 C 870 670, 940 790, 1000 880"
          pathLength="100"
          className="glint-top-body"
          fill="none"
        />
        {/* Layer 3: Ultra-Shiny Specular White Core with Triple Neon Bloom */}
        <path
          d="M 540 0 C 580 150, 690 330, 790 530 C 870 670, 940 790, 1000 880"
          pathLength="100"
          className="glint-top-core"
          fill="none"
        />

        {/* Resting subtle crest rim for Middle Shard (Shard 2) */}
        <path
          d="M 670 0 C 710 130, 800 270, 880 430 C 940 550, 975 660, 1000 740"
          stroke="url(#silk-resting-rim)"
          strokeWidth="0.75"
          fill="none"
        />

        {/* ── Crest 2 (Middle Shard) Traveling Glint ── */}
        {/* Layer 1: Feathered Head & Tail Tips */}
        <path
          d="M 670 0 C 710 130, 800 270, 880 430 C 940 550, 975 660, 1000 740"
          pathLength="100"
          className="glint-top-middle-feather"
          fill="none"
        />
        {/* Layer 2: Radiant Primary Neon Body with Drop-Shadow */}
        <path
          d="M 670 0 C 710 130, 800 270, 880 430 C 940 550, 975 660, 1000 740"
          pathLength="100"
          className="glint-top-middle-body"
          fill="none"
        />
        {/* Layer 3: Ultra-Shiny Specular White Core with Triple Neon Bloom */}
        <path
          d="M 670 0 C 710 130, 800 270, 880 430 C 940 550, 975 660, 1000 740"
          pathLength="100"
          className="glint-top-middle-core"
          fill="none"
        />

        {/* Resting subtle crest rim for Rightmost Shard (Shard 3) */}
        <path
          d="M 770 0 C 815 140, 880 300, 945 460 C 970 515, 995 560, 1000 575"
          stroke="url(#silk-resting-rim)"
          strokeWidth="0.75"
          fill="none"
        />

        {/* ── Crest 3 (Rightmost Shard) Traveling Glint ── */}
        {/* Layer 1: Feathered Head & Tail Tips */}
        <path
          d="M 770 0 C 815 140, 880 300, 945 460 C 970 515, 995 560, 1000 575"
          pathLength="100"
          className="glint-top-right-feather"
          fill="none"
        />
        {/* Layer 2: Radiant Primary Neon Body with Drop-Shadow */}
        <path
          d="M 770 0 C 815 140, 880 300, 945 460 C 970 515, 995 560, 1000 575"
          pathLength="100"
          className="glint-top-right-body"
          fill="none"
        />
        {/* Layer 3: Ultra-Shiny Specular White Core with Triple Neon Bloom */}
        <path
          d="M 770 0 C 815 140, 880 300, 945 460 C 970 515, 995 560, 1000 575"
          pathLength="100"
          className="glint-top-right-core"
          fill="none"
        />
      </svg>

      {/* ── Bottom-Left Sculptural Silk Shards (Different Shapes: Angular Wing & Fluted Terrace) ── */}
      <svg
        className="absolute bottom-0 left-0 w-[40vw] sm:w-[44vw] max-w-[600px] h-[48vh] sm:h-[52vh] transition-opacity duration-700"
        viewBox="0 0 1000 900"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="xMinYMax meet"
      >
        {/* Soft Shard Bodies Group */}
        <g opacity="0.35">
          {/* Ambient soft backlight */}
          <circle cx="200" cy="720" r="320" fill="url(#silk-backlight-glow-bl)" filter="url(#silk-glow-blur)" />

          {/* Deep under-crevice occlusion shadow */}
          <path
            d="M 0 540 C 110 480, 230 460, 330 500 C 410 535, 480 600, 530 690 L 0 730 Z"
            fill="url(#silk-bl-void)"
          />

          {/* Shard 2: Low Horizontal Fluted Terrace / Base Shelf (Distinct horizontal morphology) */}
          <path
            d="M 0 740 C 140 700, 280 685, 440 715 C 580 745, 680 775, 760 825 L 780 900 L 0 900 Z"
            fill="url(#silk-titanium-bl-secondary)"
          />

          {/* Shard 1: Sculpted Angular Wing / Faceted Blade Fold (Distinct ascending angular morphology) */}
          <path
            d="M 0 500 C 100 440, 220 420, 320 460 C 400 495, 470 560, 520 650 L 460 710 C 360 620, 230 565, 0 625 Z"
            fill="url(#silk-titanium-bl-primary)"
          />
        </g>

        {/* Resting subtle crest rims */}
        <path
          d="M 0 500 C 100 440, 220 420, 320 460 C 400 495, 470 560, 520 650"
          stroke="url(#silk-resting-rim)"
          strokeWidth="0.8"
          fill="none"
        />
        <path
          d="M 0 740 C 140 700, 280 685, 440 715 C 580 745, 680 775, 760 825"
          stroke="url(#silk-resting-rim)"
          strokeWidth="0.8"
          fill="none"
        />

        {/* ── Crest 1 Traveling Glint: Multi-Layered Feathered Specular Neon ── */}
        <path
          d="M 0 500 C 100 440, 220 420, 320 460 C 400 495, 470 560, 520 650"
          pathLength="100"
          className="glint-bottom-feather"
          fill="none"
        />
        <path
          d="M 0 500 C 100 440, 220 420, 320 460 C 400 495, 470 560, 520 650"
          pathLength="100"
          className="glint-bottom-body"
          fill="none"
        />
        <path
          d="M 0 500 C 100 440, 220 420, 320 460 C 400 495, 470 560, 520 650"
          pathLength="100"
          className="glint-bottom-core"
          fill="none"
        />

        {/* ── Crest 2 Traveling Glint: Slower Ambient Terrace Ripple ── */}
        <path
          d="M 0 740 C 140 700, 280 685, 440 715 C 580 745, 680 775, 760 825"
          pathLength="100"
          className="glint-terrace-feather"
          fill="none"
        />
        <path
          d="M 0 740 C 140 700, 280 685, 440 715 C 580 745, 680 775, 760 825"
          pathLength="100"
          className="glint-terrace-body"
          fill="none"
        />
        <path
          d="M 0 740 C 140 700, 280 685, 440 715 C 580 745, 680 775, 760 825"
          pathLength="100"
          className="glint-terrace-core"
          fill="none"
        />
      </svg>

      {/* ── Fine-Grain Noise Texture for Organic Micro-Detail ── */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none mix-blend-overlay"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* ── Centered Vignette: Keeps center auth area crisp & legible ── */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at 50% 50%, rgba(13,17,23,0.3) 30%, rgba(13,17,23,0.85) 100%)',
        }}
      />
    </div>
  );
};
