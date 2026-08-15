import React, { useEffect } from 'react';
import {
  ShieldCheck,
  Lightning,
  Lock,
  Cpu,
  Shield,
  GitPullRequest,
  Eye,
  Stack,
  Sparkle,
  Code,
  ArrowRight
} from '@phosphor-icons/react';
import { WhyChooseSection } from '../dashboard/WhyChooseSection';
import { ArchitectureScaleSection } from '../dashboard/ArchitectureScaleSection';

interface LandingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

/* ─── Marquee Feature Item ─── */
const MarqueeItem: React.FC<{ icon: React.ReactNode; text: string }> = ({ icon, text }) => (
  <div className="flex items-center gap-2.5 px-6 shrink-0 font-sans">
    <div className="text-[#c0f200]">{icon}</div>
    <span className="text-xs text-zinc-200 font-medium tracking-wide whitespace-nowrap">{text}</span>
  </div>
);

export const LandingModal: React.FC<LandingModalProps> = ({ isOpen, onClose }) => {
  useEffect(() => {
    if (!isOpen) return;
    const fn = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', fn);
    return () => window.removeEventListener('keydown', fn);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const featureItems = [
    {
      icon: <ShieldCheck size={18} weight="duotone" />,
      text: 'Defend against critical security vulnerabilities',
    },
    {
      icon: <Lightning size={18} weight="duotone" />,
      text: 'Predictable BYOK execution without surprises',
    },
    {
      icon: <Lock size={18} weight="duotone" />,
      text: 'Identity-aware Zero Trust AST code isolation',
    },
    {
      icon: <Cpu size={18} weight="duotone" />,
      text: 'Battle-tested agentic review pipeline',
    },
  ];

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 md:p-6 animate-apple-fade select-none">
      {/* Modal Backdrop */}
      <div
        className="absolute inset-0 cursor-pointer bg-black/75 backdrop-blur-md transition-opacity"
        onClick={onClose}
      />

      {/* Marquee Keyframe Styles */}
      <style>{`
        @keyframes marqueeScroll {
          0% { transform: translateX(-50%); }
          100% { transform: translateX(0%); }
        }
        .animate-marquee-track {
          display: flex;
          width: max-content;
          animation: marqueeScroll 42s linear infinite;
        }
        .animate-marquee-track:hover {
          animation-play-state: paused;
        }
      `}</style>

      {/* Modal Container */}
      <div
        className="relative z-10 w-full max-w-[1100px] max-h-[90vh] overflow-y-auto rounded-3xl p-6 md:p-8"
        style={{
          background: '#080a0f',
          border: '1px solid rgba(255,255,255,0.08)',
          boxShadow: '0 40px 120px rgba(0,0,0,0.85)',
          scrollbarWidth: 'none',
        }}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-6 top-6 z-50 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full transition-colors"
          style={{
            border: '1px solid rgba(255,255,255,0.12)',
            background: 'rgba(255,255,255,0.06)',
            color: '#aaa',
          }}
        >
          <svg width="12" height="12" viewBox="0 0 11 11" fill="none">
            <path d="M1 1l9 9M10 1L1 10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
        </button>

        {/* ════════════════════════════════════════════════════
            1. 3-COLUMN CONTAINERS (Cloudflare Containers Grid)
        ════════════════════════════════════════════════════ */}
        <div
          className="grid grid-cols-1 md:grid-cols-3 overflow-hidden rounded-2xl border border-[#1e1e22] bg-[#0c0e15]"
        >
          {/* Column 1: Intro / CTA */}
          <div className="p-6 md:p-8 flex flex-col justify-between" style={{ borderRight: '1px solid #1e1e22' }}>
            <div className="space-y-4">
              {/* Dashed pill badge */}
              <div
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-mono font-semibold"
                style={{
                  border: '1px dashed rgba(192,242,0,0.4)',
                  background: 'rgba(192,242,0,0.08)',
                  color: '#c0f200',
                }}
              >
                <Sparkle size={14} weight="duotone" />
                <span>GoBetter AI</span>
              </div>

              <h2 style={{ fontSize: 'clamp(22px, 2.5vw, 30px)', fontWeight: 800, color: '#fff', letterSpacing: '-0.02em', lineHeight: 1.15, fontFamily: "'Manrope', sans-serif" }}>
                You can use GoBetter AI to:
              </h2>

              <p style={{ fontSize: 13, color: '#777', lineHeight: 1.6, fontFamily: "'Manrope', sans-serif" }}>
                See real-world capabilities of automated agentic code reviews.
              </p>
            </div>

            <div className="mt-6">
              <button
                onClick={onClose}
                className="cursor-pointer group flex items-center gap-2 transition-all font-sans"
                style={{
                  padding: '10px 20px',
                  borderRadius: 999,
                  border: '1px solid rgba(255,255,255,0.15)',
                  background: 'transparent',
                  color: '#fff',
                  fontSize: 13,
                  fontWeight: 600,
                }}
              >
                <span>See more</span>
                <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>

          {/* Column 2: Run AI generated code securely */}
          <div
            className="p-6 md:p-8 flex flex-col space-y-6 transition-colors hover:bg-[#11141e]"
            style={{ borderRight: '1px solid #1e1e22' }}
          >
            <div className="space-y-6">
              {/* Mock terminal graphic */}
              <div
                className="w-full rounded-xl p-3 flex flex-col justify-between relative overflow-hidden group"
                style={{ height: 176, border: '1px solid #1e1e22', background: '#141722' }}
              >
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ background: 'rgba(244,63,94,0.7)' }} />
                  <span className="w-2.5 h-2.5 rounded-full" style={{ background: 'rgba(245,158,11,0.7)' }} />
                  <span className="w-2.5 h-2.5 rounded-full" style={{ background: 'rgba(16,185,129,0.7)' }} />
                </div>

                <div className="my-auto flex items-center justify-center">
                  <div
                    className="p-4 rounded-2xl group-hover:scale-110 transition-transform"
                    style={{ border: '1px solid rgba(192,242,0,0.25)', background: 'rgba(192,242,0,0.08)', color: '#c0f200' }}
                  >
                    <Lock size={32} weight="duotone" />
                  </div>
                </div>

                <div style={{ fontSize: 10, fontFamily: 'monospace', color: '#555', textAlign: 'center' }}>
                  Isolated Sandbox Context • AES-256
                </div>
              </div>

              {/* Description */}
              <div>
                <h3 style={{ fontSize: 15, fontWeight: 700, color: '#fff', marginBottom: 6, letterSpacing: '-0.01em', fontFamily: "'Manrope', sans-serif" }}>
                  Run AI generated code securely
                </h3>
                <p style={{ fontSize: 13, color: '#666', lineHeight: 1.6, fontFamily: "'Manrope', sans-serif" }}>
                  Execute untrusted code diff checks in a fully isolated environment per session or per user. Give your AI agents the ability to generate and apply constant-time security patches.
                </p>
              </div>
            </div>
          </div>

          {/* Column 3: Latency sensitive checks */}
          <div className="p-6 md:p-8 flex flex-col space-y-6 transition-colors hover:bg-[#11141e]">
            <div className="space-y-6">
              {/* Mock terminal graphic */}
              <div
                className="w-full rounded-xl p-3 flex flex-col justify-between relative overflow-hidden group"
                style={{ height: 176, border: '1px solid #1e1e22', background: '#141722' }}
              >
                <div className="flex items-center justify-between pb-2" style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ background: '#444' }} />
                    <span className="w-2.5 h-2.5 rounded-full" style={{ background: '#444' }} />
                    <span className="w-2.5 h-2.5 rounded-full" style={{ background: '#444' }} />
                  </div>
                  <span style={{ fontSize: 9, fontFamily: 'monospace', color: '#555' }}>ast-worker.ts</span>
                </div>

                <div className="space-y-1.5 p-1" style={{ fontFamily: 'monospace', fontSize: 10, color: '#888' }}>
                  <div className="flex items-center gap-2">
                    <span style={{ color: '#c0f200' }}>$</span>
                    <span style={{ color: '#ddd' }}>go-better scan --target=pr-142</span>
                  </div>
                  <div style={{ color: '#4ade80', fontSize: 9, paddingLeft: 12 }}>✓ 18 security rules passed (42ms)</div>
                  <div style={{ color: '#fbbf24', fontSize: 9, paddingLeft: 12 }}>⚡ Edge worker routed: node-ams3</div>
                </div>

                <div style={{ fontSize: 10, fontFamily: 'monospace', color: '#555', textAlign: 'right' }}>
                  sub-100ms response latency
                </div>
              </div>

              {/* Description */}
              <div>
                <h3 style={{ fontSize: 15, fontWeight: 700, color: '#fff', marginBottom: 6, letterSpacing: '-0.01em', fontFamily: "'Manrope', sans-serif" }}>
                  Run latency sensitive checks close to end users
                </h3>
                <p style={{ fontSize: 13, color: '#666', lineHeight: 1.6, fontFamily: "'Manrope', sans-serif" }}>
                  Deploy AST-level static inspection workloads that run near users for optimal performance. GoBetter AI automatically places each instance in the optimal edge location across our network.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ════ 2. WHY CHOOSE SECTION ════ */}
        <div className="mt-8">
          <WhyChooseSection />
        </div>

        {/* ════ 3. GLOBAL ARCHITECTURE & SCALE SECTION ════ */}
        <div className="mt-8">
          <ArchitectureScaleSection />
        </div>

        {/* ════════════════════════════════════════════════════
            4. HERO CTA PANEL (MOVED TO THE END OF POPUP)
        ════════════════════════════════════════════════════ */}
        <div
          className="relative overflow-hidden rounded-3xl mt-8 border border-[#c0f200]/25 shadow-[0_0_20px_rgba(192,242,0,0.07)]"
          style={{
            background: 'linear-gradient(165deg, #0e1509 0%, #17260d 45%, #1c2e0e 70%, #0d1407 100%)',
          }}
        >
          {/* Dense Technical Dot Matrix Background Texture */}
          <div
            className="absolute inset-0 pointer-events-none opacity-14 z-0"
            style={{
              backgroundImage: 'radial-gradient(rgba(255, 255, 255, 0.35) 1px, transparent 1px)',
              backgroundSize: '12px 12px',
            }}
          />

          {/* Bottom Radial Sun-like Glow (Luminous Brand Arc) */}
          <div
            className="absolute pointer-events-none z-0"
            style={{
              bottom: '20px',
              left: '50%',
              transform: 'translateX(-50%)',
              width: '85%',
              height: '210px',
              background: 'radial-gradient(ellipse 75% 85% at 50% 100%, rgba(192, 242, 0, 0.42) 0%, rgba(192, 242, 0, 0.16) 45%, transparent 80%)',
              filter: 'blur(45px)',
            }}
          />
          <div
            className="absolute pointer-events-none z-0"
            style={{
              bottom: '0px',
              left: '50%',
              transform: 'translateX(-50%)',
              width: '55%',
              height: '110px',
              background: 'radial-gradient(ellipse 60% 100% at 50% 100%, rgba(255, 255, 220, 0.6) 0%, rgba(192, 242, 0, 0.25) 50%, transparent 80%)',
              filter: 'blur(22px)',
            }}
          />

          {/* Hero Content Center Stack */}
          <div className="relative z-20 max-w-2xl mx-auto text-center pt-12 pb-14 px-6 md:pt-16 md:pb-18 md:px-12">
            {/* Heading — Tight, Dense, Engineered Framer/Cloudflare Typography */}
            <h1
              className="text-white font-extrabold mx-auto mb-3"
              style={{
                fontFamily: "'Manrope', sans-serif",
                fontSize: 'clamp(28px, 4.2vw, 44px)',
                letterSpacing: '-0.04em',
                lineHeight: 1.08,
                maxWidth: '520px',
              }}
            >
              Ship code without compromise
            </h1>

            {/* Supporting Paragraph — Controlled Centered Text Column */}
            <p
              className="font-sans mx-auto mb-8"
              style={{
                fontFamily: "'Manrope', sans-serif",
                fontSize: 'clamp(13px, 1.25vw, 15px)',
                fontWeight: 400,
                color: 'rgba(255, 255, 255, 0.75)',
                lineHeight: 1.55,
                maxWidth: '460px',
              }}
            >
              Join thousands of developers who've eliminated review complexity and deployed globally with GoBetter AI. Start reviewing for free — no credit card required.
            </p>

            {/* Coherent CTA Buttons Group */}
            <div className="flex flex-wrap items-center justify-center gap-3.5">
              {/* Primary Button */}
              <button
                onClick={onClose}
                className="px-7 py-3.5 rounded-full bg-[#c0f200] text-black font-bold text-xs md:text-sm font-sans tracking-tight hover:bg-[#d4ff1a] hover:scale-[1.02] active:scale-[0.98] transition-all shadow-[0_4px_24px_rgba(192,242,0,0.35)] cursor-pointer"
              >
                Start reviewing for free
              </button>

              {/* Secondary Button */}
              <button
                onClick={onClose}
                className="px-7 py-3.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white font-semibold text-xs md:text-sm font-sans tracking-tight hover:bg-white/20 hover:border-white/30 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
              >
                View docs
              </button>
            </div>
          </div>

          {/* Integrated Bottom Feature Strip with Continuous Horizontal Marquee */}
          <div className="relative z-20 w-full border-t border-white/12 bg-black/40 backdrop-blur-md py-3.5 overflow-hidden rounded-b-[23px]">
            {/* Gradient Edge Vignette Masks */}
            <div className="absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-black/60 to-transparent z-30 pointer-events-none" />
            <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-black/60 to-transparent z-30 pointer-events-none" />

            {/* Continuous Infinite Marquee Track */}
            <div className="animate-marquee-track">
              {/* Duplicate the array to form a seamless infinite loop */}
              {[...featureItems, ...featureItems, ...featureItems].map((item, idx) => (
                <MarqueeItem key={idx} icon={item.icon} text={item.text} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
