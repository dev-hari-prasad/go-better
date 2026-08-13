import React, { useState, useEffect } from 'react';

/* ─────────────────────────────────────────────────────────────────────────────
   Types & constants
───────────────────────────────────────────────────────────────────────────── */
interface LandingModalProps { isOpen: boolean; onClose: () => void; }

const STEPS = [
  { title: 'Fetching git diff & AST tree',        sub: 'acme-corp/hono-rabbit · PR #142' },
  { title: 'Running 18 security rules',            sub: 'crypto · Zod schemas · N+1 patterns' },
  { title: 'Generating review with Claude 3.5',   sub: '1 critical · 2 warnings · 3 suggestions' },
  { title: 'Posting findings to pull request',     sub: 'PR comment posted · Slack notified' },
];

/* ─────────────────────────────────────────────────────────────────────────────
   Tiny primitives
───────────────────────────────────────────────────────────────────────────── */
const IOSToggle: React.FC<{ on: boolean; onChange: () => void }> = ({ on, onChange }) => (
  <button
    onClick={e => { e.stopPropagation(); onChange(); }}
    className="relative shrink-0 cursor-pointer focus:outline-none"
    style={{ width: 32, height: 18 }}
  >
    <span className="absolute inset-0 rounded-full transition-colors duration-200" style={{ background: on ? '#c0f200' : 'rgba(255,255,255,0.08)' }} />
    <span className="absolute top-[3px] h-3 w-3 rounded-full bg-white shadow transition-transform duration-200" style={{ transform: on ? 'translateX(17px)' : 'translateX(3px)' }} />
  </button>
);

/* Laurel SVG – pure vectors, no icons */
const Laurel: React.FC<{ side: 'left' | 'right' }> = ({ side }) => (
  <svg width="34" height="60" viewBox="0 0 34 60" fill="none" style={{ transform: side === 'right' ? 'scaleX(-1)' : undefined }}>
    <path d="M28 54 C22 42 18 30 22 14" stroke="rgba(255,255,255,0.18)" strokeWidth="1.3" strokeLinecap="round" fill="none"/>
    {[[22,14],[16,4],[8,10]].map(([cx,cy],i)=>(
      <ellipse key={i} cx={cx} cy={cy} rx={5} ry={3} transform={`rotate(${-30+i*25} ${cx} ${cy})`} fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth="1.1"/>
    ))}
    {[[25,27],[21,39],[19,50]].map(([cx,cy],i)=>(
      <ellipse key={i} cx={cx} cy={cy} rx={4.5} ry={2.5} transform={`rotate(${10+i*15} ${cx} ${cy})`} fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth="1.1"/>
    ))}
  </svg>
);

/* Integration icon pill */
const AppBadge: React.FC<{ name: string; color: string; char: string }> = ({ name, color, char }) => (
  <div className="flex items-center gap-1.5 rounded-full px-2.5 py-1 border" style={{ borderColor: 'rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.03)' }}>
    <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[8px] font-black" style={{ background: color + '28', color }}>{char}</span>
    <span className="text-[10px] font-semibold text-zinc-400">{name}</span>
  </div>
);

/* Model bubble */
const ModelBubble: React.FC<{ label: string; color: string; size?: 'sm' | 'md' }> = ({ label, color, size = 'md' }) => {
  const dim = size === 'md' ? 40 : 32;
  return (
    <div className="flex items-center justify-center rounded-full border font-black" style={{ width: dim, height: dim, background: color + '16', borderColor: color + '40', color, fontSize: size === 'md' ? 12 : 10 }}>
      {label}
    </div>
  );
};

/* ─────────────────────────────────────────────────────────────────────────────
   Main component
───────────────────────────────────────────────────────────────────────────── */
export const LandingModal: React.FC<LandingModalProps> = ({ isOpen, onClose }) => {
  const [step, setStep] = useState(0);
  const [pct, setPct] = useState(0);
  const [patched, setPatched] = useState(false);
  const [patching, setPatching] = useState(false);
  const [rules, setRules] = useState([
    { id: 1, label: 'Flag raw string == on HMAC signatures', on: true },
    { id: 2, label: 'Require Zod schema validation on every route', on: true },
    { id: 3, label: 'Ban untyped "any" without justification comment', on: false },
    { id: 4, label: 'Enforce .catch() on top-level async calls', on: true },
  ]);

  useEffect(() => {
    if (!isOpen) return;
    const id = setInterval(() => {
      setPct(p => {
        if (p >= 100) { setStep(s => (s + 1) % 4); return 0; }
        return p + 2.8;
      });
    }, 55);
    return () => clearInterval(id);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const fn = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', fn);
    return () => window.removeEventListener('keydown', fn);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const patch = () => {
    if (patched) { setPatched(false); return; }
    setPatching(true);
    setTimeout(() => { setPatching(false); setPatched(true); }, 650);
  };

  /* shared card style */
  const card = {
    background: 'rgba(255,255,255,0.024)',
    border: '1px solid rgba(255,255,255,0.065)',
    borderRadius: 18,
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4" style={{ userSelect: 'none' }}>

      {/* ── Backdrop ── */}
      <div className="absolute inset-0 cursor-pointer" style={{ background: 'rgba(0,0,0,0.14)', backdropFilter: 'blur(3px)' }} onClick={onClose} />

      {/* ── Shell ── */}
      <div
        className="relative z-10 w-full overflow-y-auto"
        style={{
          maxWidth: 940,
          maxHeight: '88vh',
          background: 'linear-gradient(155deg,#111420 0%,#08090f 100%)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 24,
          boxShadow: '0 40px 120px rgba(0,0,0,0.65), inset 0 1px 0 rgba(255,255,255,0.07)',
        }}
      >
        {/* Close btn */}
        <button
          onClick={onClose}
          className="absolute right-5 top-5 z-50 flex cursor-pointer items-center justify-center rounded-full transition-colors hover:bg-white/[0.08]"
          style={{ width: 30, height: 30, border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.03)' }}
        >
          <svg width="11" height="11" viewBox="0 0 11 11" fill="none"><path d="M1 1l9 9M10 1L1 10" stroke="rgba(255,255,255,0.5)" strokeWidth="1.4" strokeLinecap="round"/></svg>
        </button>

        {/* ════ HERO ════ */}
        <div className="flex flex-col items-center pt-16 pb-10 px-8 text-center relative overflow-hidden">
          {/* Ambient glow */}
          <div className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 rounded-full opacity-25" style={{ width: 480, height: 200, background: 'radial-gradient(ellipse, #3730a3, transparent 70%)', filter: 'blur(50px)' }} />

          {/* Join badge */}
          <div className="mb-6 inline-flex cursor-default items-center gap-2 rounded-full px-3 py-1.5" style={{ border: '1px solid rgba(255,255,255,0.07)', background: 'rgba(255,255,255,0.025)' }}>
            <div className="flex -space-x-1">
              {['1534528741775-53994a69daeb', '1507003211169-0a1dd7228f2d', '1438761681033-6461ffad8d80'].map((id, i) => (
                <img key={i} src={`https://images.unsplash.com/photo-${id}?w=50&auto=format&fit=crop&q=80`} className="h-[18px] w-[18px] rounded-full object-cover" style={{ border: '1.5px solid #08090f' }} alt="" />
              ))}
            </div>
            <span className="text-[11px] font-medium text-zinc-500">Join 50,000+ engineers shipping better code</span>
          </div>

          {/* Headline */}
          <h1 className="text-white" style={{ fontSize: 'clamp(34px,5.5vw,56px)', fontWeight: 800, lineHeight: 1.02, letterSpacing: '-0.042em', maxWidth: 580, marginBottom: 18 }}>
            Every code review.<br/>
            <span style={{ color: '#c0f200' }}>One automated agent.</span>
          </h1>

          <p className="mb-7 max-w-[420px] text-[13px] leading-relaxed text-zinc-500" style={{ letterSpacing: '-0.01em' }}>
            Stop waiting for peer feedback. CodeRabbit catches security holes, bugs, and anti-patterns the moment you push.
          </p>

          {/* CTAs */}
          <div className="flex items-center gap-2.5">
            <button
              onClick={onClose}
              className="cursor-pointer rounded-full text-[13px] font-semibold text-black transition-opacity hover:opacity-90 active:scale-[0.97]"
              style={{ padding: '10px 26px', background: 'white', boxShadow: '0 2px 12px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.5)', letterSpacing: '-0.01em' }}
            >
              Get Started →
            </button>
            <button
              onClick={onClose}
              className="cursor-pointer rounded-full text-[13px] font-medium text-zinc-400 transition hover:text-white active:scale-[0.97]"
              style={{ padding: '10px 22px', border: '1px solid rgba(255,255,255,0.09)', background: 'rgba(255,255,255,0.03)', letterSpacing: '-0.01em' }}
            >
              Explore Sandbox
            </button>
          </div>

          {/* Brand strip */}
          <div className="mt-10 flex flex-col items-center gap-3">
            <p className="text-[9.5px] font-bold uppercase tracking-[0.14em] text-zinc-700">Used by engineers at</p>
            <div className="flex flex-wrap items-center justify-center gap-7 opacity-35">
              {['GitHub','Vercel','Prisma','Supabase','Netlify','Hono'].map(b => (
                <span key={b} className="text-[11px] font-bold tracking-tight text-zinc-300">{b}</span>
              ))}
            </div>
          </div>
        </div>

        {/* ════ BENTO GRID ════ */}
        <div className="grid grid-cols-3 gap-3 px-5 pb-5">

          {/* ── A: Stepper (2 col) ── */}
          <div className="col-span-2 flex flex-col p-6" style={card}>
            <p className="text-[11px] font-bold uppercase tracking-widest text-zinc-600 mb-3">Live Agent</p>
            <h3 className="text-[18px] font-bold text-white mb-1" style={{ letterSpacing: '-0.03em' }}>Your agent does the work</h3>
            <p className="text-[12px] text-zinc-500 leading-relaxed mb-6">
              Set a goal. CodeRabbit fetches the diff, runs rules, then posts findings to your PR and Slack.
            </p>

            <div className="flex flex-col gap-0 mt-auto">
              {STEPS.map((s, i) => {
                const done  = i < step;
                const active = i === step;
                return (
                  <div key={i} className="flex gap-4">
                    {/* Track */}
                    <div className="flex flex-col items-center" style={{ width: 18, minWidth: 18 }}>
                      <div
                        className="flex items-center justify-center rounded-full transition-all duration-500 shrink-0"
                        style={{
                          width: 18, height: 18, marginTop: 3,
                          background: done ? '#c0f200' : active ? 'transparent' : 'rgba(255,255,255,0.04)',
                          border: done ? '1.5px solid #c0f200' : active ? '1.5px solid rgba(255,255,255,0.4)' : '1.5px solid rgba(255,255,255,0.08)',
                          boxShadow: active ? '0 0 0 3px rgba(192,242,0,0.08)' : undefined,
                        }}
                      >
                        {done ? (
                          <svg width="8" height="8" viewBox="0 0 8 8" fill="none"><path d="M1.5 4L3.2 5.7L6.5 2.3" stroke="#000" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
                        ) : (
                          <span style={{ fontSize: 8, fontWeight: 700, fontFamily: 'monospace', color: active ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.15)' }}>{i+1}</span>
                        )}
                      </div>
                      {i < 3 && <div className="flex-1 w-[1px] my-1" style={{ background: done ? 'rgba(192,242,0,0.2)' : 'rgba(255,255,255,0.05)', minHeight: 14 }} />}
                    </div>

                    {/* Content */}
                    <div className="pb-4 flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[12.5px] font-semibold truncate transition-colors duration-300" style={{ letterSpacing: '-0.02em', color: done ? '#3f3f46' : active ? '#f4f4f5' : '#27272a' }}>
                          {s.title}
                        </span>
                        {active && (
                          <span className="shrink-0 rounded px-1.5 py-0.5 text-[9px] font-mono font-bold" style={{ background: 'rgba(192,242,0,0.08)', color: '#c0f200' }}>
                            {Math.round(pct)}%
                          </span>
                        )}
                      </div>
                      <p className="text-[10.5px] mt-0.5 truncate transition-colors duration-300" style={{ color: active ? '#52525b' : '#27272a' }}>{s.sub}</p>
                      {active && (
                        <div className="mt-2 h-[2px] w-full overflow-hidden rounded-full" style={{ background: 'rgba(255,255,255,0.05)' }}>
                          <div className="h-full rounded-full transition-all duration-75" style={{ width: `${pct}%`, background: 'linear-gradient(90deg, #4f46e5, #c0f200)' }} />
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── B: 4.9 Rating (1 col) ── */}
          <div className="col-span-1 flex flex-col items-center justify-center p-6" style={{ ...card, gap: 0 }}>
            {/* Laurel + number */}
            <div className="flex items-center gap-1" style={{ animation: 'float 4s ease-in-out infinite' }}>
              <Laurel side="left" />
              <span className="font-black text-white" style={{ fontSize: 62, lineHeight: 1, letterSpacing: '-0.05em' }}>4.9</span>
              <Laurel side="right" />
            </div>
            {/* Stars */}
            <div className="mt-2 flex gap-0.5">
              {[...Array(5)].map((_, i) => (
                <svg key={i} width="13" height="13" viewBox="0 0 13 13" fill="#f59e0b"><path d="M6.5 1L8 4.5L12 5L9 7.8L9.8 12L6.5 10.2L3.2 12L4 7.8L1 5L5 4.5L6.5 1Z"/></svg>
              ))}
            </div>
            <p className="mt-3 max-w-[140px] text-center text-[11px] leading-relaxed text-zinc-600">
              The average rating from thousands of reviews.
            </p>
          </div>

          {/* ── C: Models (1 col) ── */}
          <div className="col-span-1 flex flex-col p-6" style={card}>
            <p className="text-[11px] font-bold uppercase tracking-widest text-zinc-600 mb-3">Model Switch</p>
            <h3 className="text-[16px] font-bold text-white mb-1" style={{ letterSpacing: '-0.03em' }}>350+ AI models, one home</h3>
            <p className="text-[11px] text-zinc-500 leading-relaxed mb-5">
              Switch models mid-review. Claude, GPT-4o, Gemini, Grok — bring your own keys.
            </p>

            {/* Spatial model bubbles */}
            <div className="relative flex-1 flex items-center justify-center" style={{ minHeight: 100 }}>
              {/* Center core */}
              <div className="relative flex items-center justify-center rounded-full z-10 shrink-0" style={{ width: 44, height: 44, background: 'rgba(255,255,255,0.04)', border: '1.5px solid rgba(255,255,255,0.12)' }}>
                <span style={{ fontSize: 22 }}>🐰</span>
                <div className="absolute inset-0 rounded-full" style={{ border: '1px dashed rgba(255,255,255,0.06)', animation: 'spin 20s linear infinite', borderRadius: '50%', scale: '1.5' }} />
                <div className="absolute inset-0 rounded-full" style={{ border: '1px solid rgba(255,255,255,0.04)', borderRadius: '50%', scale: '2.1' }} />
              </div>
              {/* Orbiting models */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2"><ModelBubble label="Cl" color="#e48c44" size="sm" /></div>
              <div className="absolute bottom-0 left-4"><ModelBubble label="G" color="#4f8ef7" size="sm" /></div>
              <div className="absolute bottom-0 right-4"><ModelBubble label="AI" color="#10b981" size="sm" /></div>
              <div className="absolute top-1/2 -translate-y-1/2 left-0"><ModelBubble label="X" color="#a855f7" size="sm" /></div>
              <div className="absolute top-1/2 -translate-y-1/2 right-0"><ModelBubble label="Or" color="#f43f5e" size="sm" /></div>
            </div>
          </div>

          {/* ── D: Code (2 col) – white card ── */}
          <div className="col-span-2 flex flex-col overflow-hidden" style={{ ...card, background: 'white', border: '1px solid rgba(0,0,0,0.08)' }}>
            <div className="flex items-start justify-between p-5 pb-3">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-widest text-zinc-400 mb-2">Interactive Sandbox</p>
                <h3 className="text-[17px] font-bold text-zinc-950" style={{ letterSpacing: '-0.035em', lineHeight: 1.15 }}>
                  Write and ship real code.<br/>Fix errors on the fly.
                </h3>
              </div>
              <span className="shrink-0 rounded-full px-2.5 py-1 text-[9px] font-bold uppercase" style={patched
                ? { background: '#d1fae5', color: '#065f46', border: '1px solid #6ee7b7' }
                : { background: '#fff1f2', color: '#9f1239', border: '1px solid #fda4af', animation: 'pulse 2s ease-in-out infinite' }
              }>
                {patched ? '✓ Fixed' : '⚠ Timing Attack'}
              </span>
            </div>

            {/* Code block */}
            <div className="mx-5 mb-3 rounded-xl overflow-hidden" style={{ background: '#0d1117', border: '1px solid rgba(255,255,255,0.06)', fontFamily: "'JetBrains Mono', monospace", fontSize: 11 }}>
              <div className="flex items-center gap-1.5 border-b border-white/[0.05] px-4 py-2.5">
                <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
                <span className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" />
                <span className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
                <span className="ml-3 text-[10px] text-zinc-600">src/service/auth.ts</span>
              </div>
              <div className="p-4 leading-[1.7]">
                <div><span className="text-zinc-600">// ─── Signature verification ───</span></div>
                <div><span className="text-indigo-400">const</span> <span className="text-zinc-300">expected</span> <span className="text-zinc-500">=</span> <span className="text-emerald-400">crypto</span><span className="text-zinc-400">.createHmac(</span><span className="text-amber-300">"sha256"</span><span className="text-zinc-400">, secret)</span></div>
                <div className="pl-4"><span className="text-zinc-400">.update(payload).digest(</span><span className="text-amber-300">"hex"</span><span className="text-zinc-400">);</span></div>

                {patching ? (
                  <div className="mt-1 text-indigo-400" style={{ animation: 'pulse 1s ease-in-out infinite' }}>↻ &nbsp;Generating constant-time patch…</div>
                ) : patched ? (
                  <div className="mt-1 rounded px-2 py-1.5" style={{ background: 'rgba(16,185,129,0.08)', borderLeft: '2px solid #10b981' }}>
                    <div><span className="text-emerald-400">+</span> <span className="text-emerald-300">const</span> <span className="text-zinc-300">bufA</span> <span className="text-zinc-500">=</span> <span className="text-emerald-400">Buffer</span><span className="text-zinc-400">.from(signature, </span><span className="text-amber-300">"hex"</span><span className="text-zinc-400">);</span></div>
                    <div><span className="text-emerald-400">+</span> <span className="text-emerald-300">const</span> <span className="text-zinc-300">bufB</span> <span className="text-zinc-500">=</span> <span className="text-emerald-400">Buffer</span><span className="text-zinc-400">.from(expected, </span><span className="text-amber-300">"hex"</span><span className="text-zinc-400">);</span></div>
                    <div><span className="text-emerald-400">+ if</span> <span className="text-zinc-400">(!</span><span className="text-emerald-400">crypto</span><span className="text-zinc-400">.timingSafeEqual(bufA, bufB)) </span><span className="text-indigo-400">throw</span> <span className="text-zinc-300">err;</span></div>
                  </div>
                ) : (
                  <div className="mt-1 rounded px-2 py-1.5" style={{ background: 'rgba(239,68,68,0.08)', borderLeft: '2px solid #ef4444' }}>
                    <div style={{ textDecoration: 'line-through', color: '#f87171' }}>- if (signature !== expected) {'{'} throw err; {'}'}</div>
                    <div className="text-[9.5px] mt-1 text-rose-500 flex gap-1.5 items-start">
                      <span>⚠</span><span>Timing side-channel — attackers can leak bytes by measuring response time.</span>
                    </div>
                  </div>
                )}

                <div className="mt-0.5"><span className="text-indigo-400">return</span> <span className="text-emerald-400">grantAccess</span><span className="text-zinc-400">(session);</span></div>
              </div>
            </div>

            <div className="flex justify-end px-5 pb-4">
              <button
                onClick={patch}
                disabled={patching}
                className="cursor-pointer rounded-full text-[11.5px] font-semibold transition-all hover:opacity-85 active:scale-[0.97]"
                style={{ padding: '7px 18px', ...(patched
                  ? { background: '#f4f4f5', color: '#18181b', border: '1px solid #e4e4e7' }
                  : { background: '#18181b', color: 'white', border: '1px solid rgba(255,255,255,0.1)' }
                ) }}
              >
                {patching ? 'Patching…' : patched ? 'Revert ↩' : '✦ Apply Patch'}
              </button>
            </div>
          </div>

          {/* ── E: Integrations (1 col) ── */}
          <div className="col-span-1 flex flex-col p-6 overflow-hidden" style={card}>
            <p className="text-[11px] font-bold uppercase tracking-widest text-zinc-600 mb-3">Integrations</p>
            <h3 className="text-[16px] font-bold text-white mb-1" style={{ letterSpacing: '-0.03em' }}>Works inside your apps</h3>
            <p className="text-[11px] text-zinc-500 leading-relaxed mb-5">
              Connect GitHub, GitLab, Slack, Discord, and hundreds more.
            </p>

            {/* App badges */}
            <div className="flex flex-wrap gap-1.5 mt-auto">
              {[
                { name: 'GitHub', color: '#e2e8f0', char: 'G' },
                { name: 'GitLab', color: '#fb923c', char: 'GL' },
                { name: 'Slack', color: '#22c55e', char: 'S' },
                { name: 'Discord', color: '#818cf8', char: 'D' },
                { name: 'Vercel', color: '#f4f4f5', char: 'V' },
                { name: 'Linear', color: '#818cf8', char: 'L' },
              ].map(a => <AppBadge key={a.name} {...a} />)}
            </div>
          </div>

          {/* ── F: Custom Rules (1 col) ── */}
          <div className="col-span-1 flex flex-col p-6" style={card}>
            <p className="text-[11px] font-bold uppercase tracking-widest text-zinc-600 mb-3">Custom Rules</p>
            <h3 className="text-[16px] font-bold text-white mb-1" style={{ letterSpacing: '-0.03em' }}>A marketplace of superpowers</h3>
            <p className="text-[11px] text-zinc-500 leading-relaxed mb-4">
              Add custom guidelines, enforce conventions, flip rules per repo.
            </p>

            <div className="flex flex-col gap-0.5">
              {rules.map(r => (
                <div
                  key={r.id}
                  onClick={() => setRules(p => p.map(x => x.id === r.id ? { ...x, on: !x.on } : x))}
                  className="flex cursor-pointer items-center justify-between gap-2 rounded-lg px-2.5 py-2 transition-colors hover:bg-white/[0.03]"
                >
                  <span className="text-[10.5px] text-zinc-500 leading-tight truncate" style={{ ...(!r.on ? { textDecoration: 'line-through', opacity: 0.35 } : {}) }}>
                    {r.label}
                  </span>
                  <IOSToggle on={r.on} onChange={() => setRules(p => p.map(x => x.id === r.id ? { ...x, on: !x.on } : x))} />
                </div>
              ))}
            </div>
          </div>

          {/* ── G: Private (1 col) ── */}
          <div className="col-span-1 flex flex-col p-6" style={card}>
            <p className="text-[11px] font-bold uppercase tracking-widest text-zinc-600 mb-3">Security</p>
            <h3 className="text-[16px] font-bold text-white mb-1" style={{ letterSpacing: '-0.03em' }}>Private by design</h3>
            <p className="text-[11px] text-zinc-500 leading-relaxed mb-5">
              Your diffs route directly to your API keys. We never log or train on your code.
            </p>

            <div className="flex flex-col gap-2 mt-auto">
              {[
                'AES-256 key encryption',
                'Zero-log API gateway',
                'No model training on code',
                'SOC 2 compliant infra',
              ].map(item => (
                <div key={item} className="flex items-center gap-2">
                  <div className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full" style={{ background: 'rgba(192,242,0,0.1)', border: '1px solid rgba(192,242,0,0.2)' }}>
                    <svg width="7" height="7" viewBox="0 0 7 7" fill="none"><path d="M1 3.5L2.8 5.3L6 1.5" stroke="#c0f200" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </div>
                  <span className="text-[11px] text-zinc-500">{item}</span>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* ════ FOOTER CTA ════ */}
        <div className="mx-5 mb-5 flex flex-col items-center rounded-2xl px-8 py-10 text-center" style={{ background: 'rgba(255,255,255,0.015)', border: '1px solid rgba(255,255,255,0.05)' }}>
          <h2 className="text-[26px] font-black text-white" style={{ letterSpacing: '-0.04em', lineHeight: 1 }}>
            Everything, finally in one place.
          </h2>
          <p className="mx-auto mt-2.5 max-w-sm text-[12px] leading-relaxed text-zinc-600">
            Your repositories, AI agents, and team notifications — connected and automated from one workspace.
          </p>
          <button
            onClick={onClose}
            className="mt-6 cursor-pointer rounded-full text-[13px] font-semibold text-black transition hover:opacity-90 active:scale-[0.97]"
            style={{ padding: '11px 28px', background: 'white', boxShadow: '0 2px 12px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.5)', letterSpacing: '-0.01em' }}
          >
            Enter CodeRabbit →
          </button>
        </div>

      </div>

      <style>{`
        @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-5px)} }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }
      `}</style>
    </div>
  );
};
