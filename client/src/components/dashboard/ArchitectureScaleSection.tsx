import React from 'react';
import { Queue, Gauge, GlobeHemisphereWest } from '@phosphor-icons/react';
import { Globe } from '../ui/Globe';

export const ArchitectureScaleSection: React.FC = () => {
  return (
    <section className="w-full my-16 select-none">
      {/* ── UNIFIED 2-COLUMN CONTAINER ── */}
      <div
        className="max-w-[1100px] mx-auto rounded-3xl border border-[#1e1e22] bg-[#0c0e12] overflow-hidden shadow-2xl grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-[#1e1e22]"
      >
        {/* ════════════════════════════════════════════════════
            BOX 1: Run at Massive Scale + Globe (Left Box)
        ════════════════════════════════════════════════════ */}
        <div className="relative overflow-hidden flex flex-col justify-between p-8 md:p-12 min-h-[460px] bg-gradient-to-b from-[#0c0e12] via-[#0e1509] to-[#14220b]">
          {/* Top Heading Content */}
          <div className="relative z-20">
            {/* Prominent Heading Chip Tag with gap below */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm md:text-base font-bold font-mono border border-[#c0f200]/35 bg-[#c0f200]/12 text-[#c0f200] shadow-[0_0_20px_rgba(192,242,0,0.15)] mb-3.5">
              <GlobeHemisphereWest size={16} weight="duotone" />
              <span>Run AI review at massive scale</span>
            </div>

            {/* Subheading */}
            <p
              className="text-xs md:text-sm text-zinc-400 leading-relaxed max-w-[440px]"
              style={{ fontFamily: "'Manrope', sans-serif" }}
            >
              Deploy zero-latency static analysis and automated code reviews across your entire engineering organization without capacity limits.
            </p>
          </div>

          {/* Soft Sun-like Glow Behind Globe */}
          <div
            className="absolute pointer-events-none z-0"
            style={{
              bottom: '-10px',
              left: '50%',
              transform: 'translateX(-50%)',
              width: '95%',
              height: '220px',
              background: 'radial-gradient(ellipse 80% 90% at 50% 100%, rgba(192, 242, 0, 0.48) 0%, rgba(192, 242, 0, 0.18) 50%, transparent 80%)',
              filter: 'blur(35px)',
            }}
          />

          {/* Globe at bottom of Box 1 — Enlarged scale */}
          <div className="relative z-10 w-[140%] -ml-[20%] mt-2 -mb-24">
            <Globe />
          </div>
        </div>

        {/* ════════════════════════════════════════════════════
            BOX 2: Queue Architecture & Observability (Right Box)
        ════════════════════════════════════════════════════ */}
        <div className="p-8 md:p-12 flex flex-col justify-center space-y-10 bg-[#0c0e12]">
          {/* Item 1: Queue-based architecture */}
          <div className="space-y-3">
            <Queue size={34} weight="duotone" color="#c0f200" />
            <h3
              className="text-xl font-bold text-white tracking-tight"
              style={{ fontFamily: "'Manrope', sans-serif" }}
            >
              Queue-based architecture
            </h3>
            <p
              className="text-xs md:text-sm text-zinc-400 leading-relaxed max-w-[440px]"
              style={{ fontFamily: "'Manrope', sans-serif" }}
            >
              BullMQ queues and Redis backpressure handle massive parallel PR review workloads effortlessly. Never drop a webhook or hit concurrency limits even during major release spikes.
            </p>
          </div>

          <div className="border-t border-[#1e1e22] pt-10 space-y-3">
            {/* Item 2: Built-in observability */}
            <Gauge size={34} weight="duotone" color="#c0f200" />
            <h3
              className="text-xl font-bold text-white tracking-tight"
              style={{ fontFamily: "'Manrope', sans-serif" }}
            >
              Built-in observability
            </h3>
            <p
              className="text-xs md:text-sm text-zinc-400 leading-relaxed max-w-[440px]"
              style={{ fontFamily: "'Manrope', sans-serif" }}
            >
              Full system monitoring with Prometheus metrics, Grafana dashboards, and OpenTelemetry tracing out of the box. Complete end-to-end visibility into every step of the review pipeline.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
