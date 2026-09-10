import React, { useEffect, useState, useRef } from 'react';
import {
  ShieldCheck,
  Lightning,
  Lock,
  Cpu,
  BookOpen,
  GithubLogo,
  FileText,
  SignIn,
  ArrowRight,
  Sparkle,
  CheckCircle,
} from '@phosphor-icons/react';
import { ArchitectureScaleSection } from '../dashboard/ArchitectureScaleSection';
import { HexagonPattern } from '../ui/hexagon-pattern';
import { GobeAiLogo } from '../ui/GobeAiLogo';
import { ReviewComparisonTable } from './ReviewComparisonTable';
import { navigateTo } from '../../router/routes';
import { Squircle } from '@squircle-js/react';
import { GitHubDark } from '@ridemountainpig/svgl-react';
import { useAuth } from '../../context/AuthContext';

interface LandingModalProps {
  isOpen: boolean;
  onClose: () => void;
  isSidebarCollapsed?: boolean;
  onOpenAuth?: (mode: 'signup' | 'login') => void;
  isAuthed?: boolean;
}

/* ─── Marquee Feature Item ─── */
const MarqueeItem: React.FC<{ icon: React.ReactNode; text: string }> = ({ icon, text }) => (
  <div className="flex items-center gap-2.5 px-6 shrink-0 font-sans">
    <div className="text-[#c0f200]">{icon}</div>
    <span className="text-xs text-zinc-200 font-medium tracking-wide whitespace-nowrap">{text}</span>
  </div>
);

export const LandingModal: React.FC<LandingModalProps> = ({
  isOpen,
  onClose,
  isSidebarCollapsed = false,
  onOpenAuth,
  isAuthed: propIsAuthed,
}) => {
  const { isAuthenticated } = useAuth();
  const isAuthed = propIsAuthed ?? (
    isAuthenticated ||
    (typeof window !== 'undefined' &&
    (localStorage.getItem('showMarketingPopup') === 'false' || Boolean(localStorage.getItem('session_id')) || Boolean(localStorage.getItem('user_db_id'))))
  );

  useEffect(() => {
    if (!isOpen || !isAuthed) return;
    const fn = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', fn);
    return () => window.removeEventListener('keydown', fn);
  }, [isOpen, isAuthed, onClose]);

  const [isHeaderVisible, setIsHeaderVisible] = useState(true);
  const [isHeaderHovered, setIsHeaderHovered] = useState(false);
  const lastScrollY = useRef(0);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const currentY = e.currentTarget.scrollTop;
    const diff = currentY - lastScrollY.current;

    if (currentY > 40) {
      if (diff > 5) {
        // Scrolling down -> hide header
        setIsHeaderVisible(false);
      } else if (diff < -5) {
        // Scrolling up -> reveal header
        setIsHeaderVisible(true);
      }
    } else {
      // Near top of modal -> always reveal
      setIsHeaderVisible(true);
    }
    lastScrollY.current = currentY;
  };

  const showHeader = isHeaderVisible || isHeaderHovered;

  const handleAuthClick = (mode: 'signup' | 'login') => {
    if (onOpenAuth) {
      onOpenAuth(mode);
    } else {
      window.dispatchEvent(new CustomEvent('open-auth-modal', { detail: { mode } }));
    }
  };

  if (!isOpen || isAuthed) return null;

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
        className={`absolute inset-0 bg-black/80 backdrop-blur-md transition-opacity ${isAuthed ? 'cursor-pointer' : 'cursor-default'}`}
        onClick={() => {
          if (isAuthed) onClose();
        }}
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

      {/* Modal Positioning Shell */}
      <div 
        className="relative z-10 w-full max-w-[1100px]"
        style={{ filter: 'drop-shadow(0 30px 80px rgba(0,0,0,0.9))' }}
      >
        {/* Exit Close Button — ONLY shown when user is logged in */}
        {isAuthed && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 md:-right-12 md:top-4 z-50 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full transition-all bg-white/10 hover:bg-white/20 border border-white/20 text-zinc-300 hover:text-white shadow-xl hover:scale-105"
            title="Close (Esc)"
            aria-label="Close"
          >
            <svg width="12" height="12" viewBox="0 0 11 11" fill="none">
              <path d="M1 1l9 9M10 1L1 10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          </button>
        )}

        {/* Modal Container with 1px Apple-style Squircle Border */}
        <Squircle
          cornerRadius={24}
          cornerSmoothing={1}
          defaultWidth={1100}
          defaultHeight={750}
          className="relative w-full max-h-[85vh] p-[1px] bg-white/[0.10] overflow-hidden"
          style={{
            boxShadow: '0 40px 120px rgba(0,0,0,0.85)',
          }}
        >
          <Squircle
            cornerRadius={23}
            cornerSmoothing={1}
            defaultWidth={1100}
            defaultHeight={750}
            onScroll={handleScroll}
            className="relative w-full max-h-[calc(85vh-2px)] overflow-y-auto overflow-x-hidden"
            style={{
              background: '#080a0f',
              scrollbarWidth: 'none',
            }}
          >
            {/* Invisible sticky top hover sensor to reveal header on hover even when scrolled down */}
            <div
              className="sticky top-0 left-0 right-0 h-6 -mb-6 z-40 pointer-events-auto"
              onMouseEnter={() => setIsHeaderHovered(true)}
              onMouseLeave={() => setIsHeaderHovered(false)}
            />

            {/* ════ 0. TOP NAVBAR / HEADER ════ */}
            <header
              onMouseEnter={() => setIsHeaderHovered(true)}
              onMouseLeave={() => setIsHeaderHovered(false)}
              className="sticky top-0 z-40 w-full px-5 py-2 md:px-7 md:py-2.5 flex items-center justify-between border-b border-white/[0.08] bg-[#070906]/90 backdrop-blur-xl rounded-t-[23px] will-change-transform"
              style={{
                transform: showHeader ? 'translateY(0)' : 'translateY(-100%)',
                opacity: showHeader ? 1 : 0,
                transition: 'transform 0.35s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.25s ease',
              }}
            >
              {/* Left: Brand Logo & Name (Larger logo & wordmark) */}
              <div className="flex items-center gap-2.5 select-none">
                <GobeAiLogo size={22} className="shrink-0" variant="brand" />
                <span className="text-[16px] md:text-[17px] font-medium tracking-tight font-sans">
                  <span className="text-[#f4f4f5]">Go</span><span className="text-[#c0f200]">Better</span>
                </span>
              </div>

            {/* Center: Navigation Links with Phosphor Icons */}
            <nav className="flex items-center gap-4 sm:gap-6">
              <a
                href="https://docs.gobetter.dev"
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center gap-1.5 text-xs text-zinc-300 hover:text-[#c0f200] transition-colors font-medium font-sans"
              >
                <BookOpen size={14} weight="duotone" className="text-zinc-400 group-hover:text-[#c0f200] transition-colors" />
                <span>Docs</span>
              </a>
              <a
                href="https://github.com/dev-hari-prasad/go-better"
                target="_blank"
                rel="noreferrer"
                className="group flex items-center gap-1.5 text-xs text-zinc-300 hover:text-[#c0f200] transition-colors font-medium font-sans"
              >
                <GitHubDark className="w-3.5 h-3.5 shrink-0 opacity-80 group-hover:opacity-100 transition-opacity" />
                <span>Github</span>
              </a>
              <a
                href="/terms"
                onClick={(e) => {
                  e.preventDefault();
                  onClose();
                  navigateTo('terms');
                }}
                className="group flex items-center gap-1.5 text-xs text-zinc-300 hover:text-[#c0f200] transition-colors font-medium font-sans cursor-pointer"
              >
                <FileText size={14} weight="duotone" className="text-zinc-400 group-hover:text-[#c0f200] transition-colors" />
                <span>Terms</span>
              </a>
              <a
                href="/privacy-policy"
                onClick={(e) => {
                  e.preventDefault();
                  onClose();
                  navigateTo('privacy-policy');
                }}
                className="group flex items-center gap-1.5 text-xs text-zinc-300 hover:text-[#c0f200] transition-colors font-medium font-sans cursor-pointer"
              >
                <ShieldCheck size={14} weight="duotone" className="text-zinc-400 group-hover:text-[#c0f200] transition-colors" />
                <span>Privacy</span>
              </a>
            </nav>

            {/* Right: Separate Login and Sign up Buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleAuthClick('login')}
                className="px-3 py-1 rounded-full bg-white/10 hover:bg-white/[0.18] text-zinc-200 hover:text-white border border-white/15 text-xs font-medium font-sans transition-all cursor-pointer shadow-xs active:scale-[0.98]"
              >
                Log in
              </button>
              <button
                onClick={() => handleAuthClick('signup')}
                className="flex items-center gap-1 px-3.5 py-1 rounded-full bg-[#c0f200] hover:bg-[#d4ff1a] text-black text-xs font-semibold font-sans tracking-tight hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer shadow-sm"
              >
                <span>Sign up</span>
              </button>
            </div>
          </header>

          {/* ════ 1. HERO CTA PANEL (ATTACHED TO SIDES & TOP, NO BOTTOM RADIUS) ════ */}
          <div
            className="relative overflow-hidden w-full border-b border-white/[0.08] shadow-[0_0_20px_rgba(192,242,0,0.03)]"
            style={{
              background: 'linear-gradient(165deg, #070906 0%, #0b1007 45%, #0e1408 70%, #050804 100%)',
            }}
          >
            {/* Background Hexagon Pattern - ultra-faint dashed honeycomb watermark */}
            <HexagonPattern
              radius={22}
              gap={2.5}
              strokeDasharray="4 2.5"
              strokeWidth={1}
              className="absolute inset-0 h-full w-full pointer-events-none z-0"
              style={{
                color: 'rgba(192, 242, 0, 0.018)',
              }}
            />

            {/* Hero Content Center Stack with Elevated Height */}
            <div className="relative z-20 max-w-2xl mx-auto text-center min-h-[400px] md:min-h-[440px] flex flex-col justify-center pt-16 pb-16 px-6 md:pt-20 md:pb-20 md:px-12">
              {/* Heading — Tight, Dense, Engineered Framer/Cloudflare Typography */}
              <h1
                className="text-white font-medium mx-auto mb-3.5"
                style={{
                  fontFamily: "'Manrope', sans-serif",
                  fontSize: 'clamp(32px, 4.4vw, 48px)',
                  fontWeight: 500,
                  letterSpacing: '-0.035em',
                  lineHeight: 1.1,
                  maxWidth: '600px',
                }}
              >
                Ship code without compromise
              </h1>

              {/* Supporting Paragraph — Controlled Centered Text Column */}
              <p
                className="font-sans mx-auto mb-8"
                style={{
                  fontFamily: "'Manrope', sans-serif",
                  fontSize: 'clamp(15px, 1.5vw, 18px)',
                  fontWeight: 400,
                  color: 'rgba(255, 255, 255, 0.80)',
                  lineHeight: 1.55,
                  maxWidth: '490px',
                }}
              >
                Automate pull request reviews, eliminate bottlenecks, and ship secure code faster.
              </p>

              {/* Luma-style High-Converting Hero CTA */}
              <div className="flex flex-col items-center justify-center gap-3.5 max-w-lg mx-auto">
                {/* Primary Action Button */}
                <button
                  onClick={() => handleAuthClick('signup')}
                  className="group inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-full bg-[#c0f200] hover:bg-[#d4ff1a] text-black font-semibold text-xs md:text-sm font-sans tracking-tight hover:scale-[1.03] active:scale-[0.98] transition-all duration-200 cursor-pointer shadow-lg hover:shadow-xl"
                >
                  <span>Start reviewing for free</span>
                  <ArrowRight size={15} weight="bold" className="transition-transform duration-200 group-hover:translate-x-1" />
                </button>

                {/* Friction-reducer & Social Proof Micro-row */}
                <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 text-xs text-zinc-400 font-sans mt-0.5">
                  <span className="flex items-center gap-1.5">
                    <Sparkle size={13} weight="fill" className="text-[#c0f200]" />
                    <span>Bring your own key</span>
                  </span>
                  <span className="text-zinc-600 hidden sm:inline">•</span>
                  <span className="flex items-center gap-1.5">
                    <CheckCircle size={13} weight="fill" className="text-[#c0f200]" />
                    <span>No credit card required</span>
                  </span>
                  <span className="text-zinc-600 hidden sm:inline">•</span>
                  <span className="flex items-center gap-1.5">
                    <Lightning size={13} weight="fill" className="text-[#c0f200]" />
                    <span>30-second setup</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Integrated Bottom Feature Strip with Continuous Horizontal Marquee (Flat Bottom) */}
            <div className="relative z-20 w-full border-t border-white/[0.08] bg-black/40 backdrop-blur-md py-4 overflow-hidden">
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

          {/* ════ 2. SUBSEQUENT CONTENT (PADDED) ════ */}
          <div className="px-6 pb-8 md:px-8 md:pb-12 space-y-8 rounded-b-[23px]">
            <ReviewComparisonTable />
            <ArchitectureScaleSection />
          </div>
          </Squircle>
        </Squircle>
      </div>
    </div>
  );
};
