import React, { useState, useEffect } from 'react';
import { AlertTriangle, Check, ShieldAlert, Zap, Lock, Terminal, Activity, MessageSquare } from 'lucide-react';

const METRICS_LIST = [
  'Onboarded 5,000 engineers today',
  'Onboarded 20,000 engineers today',
  'Pushed 47 new security patches today',
  'Prevented 3,420 critical vulnerabilities today',
  'Merged 18,900 pull requests today',
];

export const WhyChooseSection: React.FC = () => {
  const [metricIndex, setMetricIndex] = useState(0);
  const [fade, setFade] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setFade(false);
      setTimeout(() => {
        setMetricIndex((prev) => (prev + 1) % METRICS_LIST.length);
        setFade(true);
      }, 300);
    }, 2800);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full my-12 animate-apple-fade select-none">
      {/* Header */}
      <div className="text-center mb-8">
        <h2 className="text-3xl md:text-5xl font-black text-white tracking-tight mb-2">
          Why choose GoBetter AI
        </h2>
        <p className="text-sm md:text-base text-zinc-400 font-sans max-w-xl mx-auto">
          Everything needed to automate + secure your pull requests, codebases & developer teams
        </p>
      </div>

      {/* 2-Card Split Comparison Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-[1240px] mx-auto">
        
        {/* ── LEFT CARD: Fighting code reviews without GoBetter AI (Chaotic Dark Card) ── */}
        <div className="relative min-h-[420px] rounded-3xl p-8 bg-[#0a080d] border border-rose-500/20 overflow-hidden flex flex-col justify-between shadow-2xl group">
          {/* Animated Background Soundwave Grid */}
          <div className="absolute inset-0 opacity-15 pointer-events-none flex items-end justify-between px-4 pb-2">
            {[35, 65, 40, 85, 30, 95, 50, 75, 45, 90, 60, 40, 80, 55, 70, 30, 85, 60, 40, 90, 50].map((h, i) => (
              <div
                key={i}
                className="w-1.5 bg-rose-500 rounded-t transition-all duration-500"
                style={{
                  height: `${h}%`,
                  animation: `pulseWave 1.8s infinite ease-in-out ${i * 0.1}s alternate`,
                }}
              />
            ))}
          </div>

          {/* Top Status Alert Badge */}
          <div className="relative z-10 flex justify-end">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md border border-rose-500/40 bg-rose-500/10 text-rose-400 text-xs font-mono font-bold tracking-wider animate-pulse">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>STATUS: UNRESOLVED</span>
            </div>
          </div>

          {/* Main Title */}
          <div className="relative z-10 text-center my-6">
            <h3 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight leading-tight">
              Fighting code reviews with <br />
              <span className="text-rose-400 font-sans italic font-bold">"manual chaos"</span>
            </h3>
          </div>

          {/* Floating Problem Bubbles (Animated Drifting Elements) */}
          <div className="relative z-10 space-y-3">
            {/* Complaint Bubble 1 */}
            <div className="max-w-[340px] p-3 rounded-xl border border-rose-500/30 bg-[#160e12]/90 backdrop-blur-md text-[11px] font-mono text-zinc-300 shadow-lg animate-float-slow">
              <div className="flex items-center gap-2 text-rose-400 font-bold mb-1">
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>Critical Vulnerability</span>
              </div>
              <p className="text-zinc-400 leading-snug">
                "Timing attack leaked to production — HMAC string comparison in auth.ts!"
              </p>
            </div>

            {/* Complaint Bubble 2 */}
            <div className="max-w-[380px] ml-auto p-3 rounded-xl border border-amber-500/30 bg-[#17120a]/90 backdrop-blur-md text-[11px] font-mono text-zinc-300 shadow-lg animate-float-reverse">
              <div className="flex items-center justify-between text-amber-400 font-bold mb-1">
                <span className="flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5" />
                  <span>High Latency Alert</span>
                </span>
                <span className="px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-400 text-[9px]">P0</span>
              </div>
              <p className="text-zinc-400 leading-snug">
                ~150–250ms RTT per request • 2,931 Open review comments pending
              </p>
            </div>

            {/* Complaint Bubble 3 */}
            <div className="max-w-[320px] p-2.5 rounded-xl border border-zinc-700/60 bg-[#121217]/90 backdrop-blur-md text-[10.5px] font-sans text-zinc-400 shadow-md">
              <div className="flex items-center gap-1.5 text-zinc-300">
                <MessageSquare className="w-3 h-3 text-zinc-500" />
                <span>"Review stalled for 4 days. Can someone please approve PR #142?"</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── RIGHT CARD: Shipping with GoBetter AI (Vibrant Solution Card) ── */}
        <div className="relative min-h-[420px] rounded-3xl p-8 bg-[#c0f200] text-black overflow-hidden flex flex-col justify-between shadow-2xl group transition-transform hover:scale-[1.01]">
          {/* Subtle Background Pattern */}
          <div className="absolute inset-0 opacity-10 pointer-events-none bg-[radial-gradient(#000_1px,transparent_1px)] [background-size:16px_16px]" />

          {/* Top Logo / Icon */}
          <div className="relative z-10 flex justify-end">
            <div className="p-2.5 rounded-full bg-black/10 text-black border border-black/10">
              <Zap className="w-5 h-5 fill-current" />
            </div>
          </div>

          {/* Main Title */}
          <div className="relative z-10 text-center my-auto py-8">
            <h3 className="text-4xl md:text-5xl font-black text-black tracking-tight leading-tight">
              Shipping with <br />
              GoBetter AI
            </h3>
          </div>

          {/* Dynamic Animated Metric Pill at Bottom (Matching the Screenshots!) */}
          <div className="relative z-10 pt-4 border-t border-black/10 flex justify-center">
            <div className="inline-flex items-center gap-2.5 px-6 py-3 rounded-full bg-black/10 border border-black/15 text-black font-semibold text-xs md:text-sm backdrop-blur-sm shadow-md">
              <div className="flex h-5 w-5 items-center justify-center rounded-full bg-black text-[#c0f200]">
                <Check className="w-3.5 h-3.5 stroke-[3]" />
              </div>
              <span className={`transition-opacity duration-300 ${fade ? 'opacity-100' : 'opacity-0'}`}>
                {METRICS_LIST[metricIndex]}
              </span>
            </div>
          </div>
        </div>

      </div>

      {/* Inline Keyframe Animations */}
      <style>{`
        @keyframes pulseWave {
          0%, 100% { transform: scaleY(0.4); opacity: 0.3; }
          50% { transform: scaleY(1.1); opacity: 0.9; }
        }
        @keyframes float-slow {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-6px); }
        }
        @keyframes float-reverse {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(6px); }
        }
        .animate-float-slow {
          animation: float-slow 4s ease-in-out infinite;
        }
        .animate-float-reverse {
          animation: float-reverse 4.5s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};
