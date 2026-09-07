import React, { useState, useEffect } from 'react';
import { Copy, Check } from '@phosphor-icons/react';
import {
  AnthropicDark,
  Cloudflare,
  DigitalOcean,
  GitHubDark,
  Google,
  Neon,
  OpenAIDark,
  OpenRouterDark,
  RailwayDark,
  Redis,
  ResendDark,
  Upstash,
  VercelDark,
} from '@ridemountainpig/svgl-react';
import { InceptionLogo } from '../ui/icons/BrandLogos';
import { GobeAiLogo } from '../ui/GobeAiLogo';
import { navigateTo, NavTab } from '../../router/routes';
import { toast } from 'sonner';

interface LegalViewProps {
  initialTab?: 'terms' | 'privacy-policy' | 'subprocessors';
  onBackToDashboard?: () => void;
}

export interface SimpleSubprocessor {
  name: string;
  purpose: string;
  icon: React.ReactNode;
}

export const SUBPROCESSORS_LIST: SimpleSubprocessor[] = [
  {
    name: 'DigitalOcean',
    purpose: 'Database and server',
    icon: <DigitalOcean className="w-4 h-4 shrink-0" />,
  },
  {
    name: 'Railway',
    purpose: 'Server and in-memory store',
    icon: <RailwayDark className="w-4 h-4 shrink-0" />,
  },
  {
    name: 'Vercel Inc.',
    purpose: 'Frontend and data hosting',
    icon: <VercelDark className="w-4 h-4 shrink-0" />,
  },
  {
    name: 'Neon',
    purpose: 'Database',
    icon: <Neon className="w-4 h-4 shrink-0" />,
  },
  {
    name: 'OpenRouter',
    purpose: 'Dynamic LLM inference routing & failover',
    icon: <OpenRouterDark className="w-4 h-4 shrink-0" />,
  },
  {
    name: 'Vercel AI',
    purpose: 'Edge LLM inference & routing',
    icon: <VercelDark className="w-4 h-4 shrink-0" />,
  },
  {
    name: 'Google',
    purpose: 'LLM inference (Gemini / PaLM)',
    icon: <Google className="w-4 h-4 shrink-0" />,
  },
  {
    name: 'Inception Labs',
    purpose: 'LLM inference (Mercury-2)',
    icon: <InceptionLogo className="w-4 h-4 shrink-0" />,
  },
  {
    name: 'OpenAI',
    purpose: 'LLM inference and code review',
    icon: <OpenAIDark className="w-4 h-4 shrink-0" />,
  },
  {
    name: 'Anthropic',
    purpose: 'LLM inference and code review',
    icon: <AnthropicDark className="w-4 h-4 shrink-0" />,
  },
  {
    name: 'GitHub',
    purpose: 'Authentication and repository code access',
    icon: <GitHubDark className="w-4 h-4 shrink-0" />,
  },
  {
    name: 'Resend',
    purpose: 'Transactional email',
    icon: <ResendDark className="w-4 h-4 shrink-0" />,
  },
  {
    name: 'Redis / Upstash',
    purpose: 'Queue and in-memory caching',
    icon: (
      <div className="flex items-center gap-1 shrink-0">
        <Redis className="w-4 h-4 shrink-0" />
        <span className="text-zinc-600 text-xs">/</span>
        <Upstash className="w-3.5 h-3.5 shrink-0" />
      </div>
    ),
  },
  {
    name: 'Cloudflare',
    purpose: 'DNS and edge network security',
    icon: <Cloudflare className="w-4 h-4 shrink-0" />,
  },
];

export const LegalView: React.FC<LegalViewProps> = ({
  initialTab = 'terms',
  onBackToDashboard,
}) => {
  const [activeLegalTab, setActiveLegalTab] = useState<'terms' | 'privacy-policy' | 'subprocessors'>(initialTab);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setActiveLegalTab(initialTab);
  }, [initialTab]);

  const handleTabSwitch = (tab: 'terms' | 'privacy-policy' | 'subprocessors') => {
    setActiveLegalTab(tab);
    navigateTo(tab as NavTab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    toast.success('Link copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleBack = () => {
    if (onBackToDashboard) {
      onBackToDashboard();
    } else {
      navigateTo('overview');
    }
  };

  return (
    <div className="w-full min-h-full bg-[#0d1117] text-zinc-300 font-sans selection:bg-[#c0f200]/20 selection:text-[#c0f200]">
      {/* ── Top Navigation Bar matching GoBetter Header Style ── */}
      <header className="sticky top-0 z-50 w-full border-b border-white/[0.08] bg-[#0d1117]/90 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-6 sm:px-10 h-14 flex items-center justify-between">
          {/* Left: Brand */}
          <div className="flex items-center gap-2.5">
            <button
              onClick={handleBack}
              className="flex items-center gap-2.5 group cursor-pointer text-left focus:outline-none"
              title="Return to GoBetter App"
            >
              <GobeAiLogo size={24} variant="brand" />
              <span className="font-semibold text-white tracking-tight text-sm group-hover:text-[#c0f200] transition-colors">
                GoBetter
              </span>
            </button>
            <span className="text-zinc-600 text-xs">/</span>
            <span className="text-xs text-zinc-400 font-medium">Legal</span>
          </div>

          {/* Center: Segmented Navigation Toggle */}
          <div className="flex items-center bg-[#16171d] border border-white/10 rounded-lg p-0.5 shadow-xs">
            <button
              type="button"
              onClick={() => handleTabSwitch('terms')}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-all cursor-pointer ${
                activeLegalTab === 'terms'
                  ? 'bg-[#222530] text-white shadow-xs font-semibold'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Terms
            </button>
            <button
              type="button"
              onClick={() => handleTabSwitch('privacy-policy')}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-all cursor-pointer ${
                activeLegalTab === 'privacy-policy'
                  ? 'bg-[#222530] text-white shadow-xs font-semibold'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Privacy Policy
            </button>
            <button
              type="button"
              onClick={() => handleTabSwitch('subprocessors')}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-all cursor-pointer ${
                activeLegalTab === 'subprocessors'
                  ? 'bg-[#222530] text-white shadow-xs font-semibold'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Subprocessors
            </button>
          </div>

          {/* Right: GitHub Repository Link with SVGL Icon */}
          <a
            href="https://github.com/dev-hari-prasad/go-better"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="GitHub Repository"
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#16171d] hover:bg-[#20222a] border border-white/10 hover:border-white/20 text-xs text-zinc-300 hover:text-white transition-all cursor-pointer font-sans shadow-xs active:scale-[0.98] group"
          >
            <GitHubDark className="w-4 h-4 shrink-0 group-hover:scale-110 transition-transform" />
            <span className="font-medium hidden sm:inline">GitHub</span>
          </a>
        </div>
      </header>

      {/* ── Document Container ── */}
      <main className="max-w-6xl mx-auto px-6 sm:px-10 py-12 sm:py-16">
        {/* Document Header */}
        <div className="mb-12 pb-6 border-b border-white/[0.08]">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight font-sans">
              {activeLegalTab === 'terms'
                ? 'Terms of Service'
                : activeLegalTab === 'privacy-policy'
                ? 'Privacy Policy'
                : 'Third-Party Subprocessors'}
            </h1>
            <button
              onClick={handleCopyLink}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#16171d] hover:bg-[#20222a] border border-white/10 text-xs text-zinc-300 hover:text-white transition-colors cursor-pointer"
            >
              {copied ? <Check size={14} weight="bold" className="text-[#c0f200]" /> : <Copy size={14} />}
              <span>{copied ? 'Copied' : 'Share'}</span>
            </button>
          </div>
          <p className="text-sm text-zinc-400 font-sans mt-2.5">
            Last updated: September 2026 &bull; Open Source under MIT-0 License
          </p>
        </div>

        {activeLegalTab === 'terms' ? (
          /* ═════════════════════════════════════════════════════════════
             TERMS OF SERVICE
             ═════════════════════════════════════════════════════════════ */
          <div className="space-y-10 text-[15px] sm:text-base leading-relaxed text-zinc-300">
            {/* Section 1 */}
            <section className="space-y-3.5">
              <h2 className="text-lg sm:text-xl font-semibold text-white tracking-tight">
                1. Acceptance of Terms
              </h2>
              <p>
                By accessing or using GoBetter (&ldquo;Service&rdquo;), you agree to be bound by these Terms of Service (&ldquo;Terms&rdquo;). If you do not agree to these terms, please do not access or use the Service.
              </p>
            </section>

            {/* Section 2: Sample Service & Strict Do Not Depend Warning */}
            <section className="space-y-3.5">
              <h2 className="text-lg sm:text-xl font-semibold text-white tracking-tight">
                2. Nature of Service: Hosted Sample Demonstration &mdash; Zero Business Reliance
              </h2>
              <div className="p-5 rounded-xl bg-[#16171d] border border-rose-500/25 bg-rose-500/[0.02] space-y-3">
                <p className="text-white font-medium text-sm sm:text-base">
                  This hosted deployment is strictly an experimental sample showcase intended solely to give you a taste of what GoBetter can do &mdash; it is NOT an enterprise or production platform for your business.
                </p>
                <p className="text-sm sm:text-[15px] text-zinc-300 leading-relaxed">
                  <strong className="text-rose-400 font-semibold uppercase tracking-wider">Do NOT depend on this hosted sample service:</strong> This hosted environment is for trial, experimentation, and preview purposes only. Under no circumstances should your company, business, mission-critical workflows, or production deployments rely on or depend upon this hosted sample service.
                </p>
                <p className="text-sm sm:text-[15px] text-zinc-300 leading-relaxed">
                  If your business relies on this hosted sample service and you experience any loss, injury, or damage of any kind whatsoever &mdash; whether <strong className="text-white">loss of business opportunity, financial loss, lost revenue or profits, business interruption, operational standstill, delayed product releases, missed pull request reviews, reputational harm, data loss, code corruption, or security incidents</strong> &mdash; it is purely, entirely, and exclusively because you made the independent decision to rely on a hosted sample version that was only ever provided as a temporary taste of the service. We bear absolutely zero responsibility, zero liability, and zero obligation to you or any third party for any such damages or losses.
                </p>
                <p className="text-sm sm:text-[15px] text-zinc-300 leading-relaxed">
                  If you require uptime, stability, privacy, or production SLAs, you must <strong className="text-[#c0f200] font-semibold">host this service yourself</strong> on your own private infrastructure.
                </p>
                <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed pt-2 border-t border-white/10">
                  <strong className="text-zinc-200">Same nature when self-hosted:</strong> Please be aware that this open-source software carries this exact same nature and limitation when hosted by yourself. As provided under the MIT-0 license, the software is strictly &ldquo;AS IS&rdquo; with no guarantees, warranties, or liabilities of any nature whatsoever.
                </p>
              </div>
              <p className="text-sm sm:text-[15px] text-zinc-400">
                The hosted sample service may experience immediate downtime, maintenance breaks, rate limits, breaking updates, or permanent discontinuation at any time without notice.
              </p>
            </section>

            {/* Section 3: Account Termination Without Prior Notice */}
            <section className="space-y-3.5">
              <h2 className="text-lg sm:text-xl font-semibold text-white tracking-tight">
                3. Termination of Account Without Notice
              </h2>
              <div className="p-5 rounded-xl bg-[#16171d] border border-white/10 space-y-2.5">
                <p className="text-white font-medium text-sm sm:text-base">
                  We reserve the absolute right to terminate, suspend, or revoke your account, API access, tokens, or any associated data at any time, for any reason or for no reason at all, without any prior notification, warning, or liability.
                </p>
                <p className="text-sm sm:text-[15px] text-zinc-400 leading-relaxed">
                  We have no obligation to maintain backup data, provide advance notice of account deactivation, or furnish post-termination data exports.
                </p>
              </div>
            </section>

            {/* Section 4: Disclaimer of Warranties */}
            <section className="space-y-3.5">
              <h2 className="text-lg sm:text-xl font-semibold text-white tracking-tight">
                4. Disclaimer of Warranties: No Guarantee of Any Kind
              </h2>
              <div className="p-5 rounded-xl bg-[#121318] border border-white/10 font-mono text-xs sm:text-sm text-zinc-300 uppercase leading-relaxed tracking-wide">
                THE SERVICE IS PROVIDED &ldquo;AS IS&rdquo; AND &ldquo;AS AVAILABLE&rdquo;, WITHOUT WARRANTY OF ANY KIND, EXPRESS, IMPLIED, OR STATUTORY, INCLUDING BUT NOT LIMITED TO WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, UPTIME, AVAILABILITY, OR NON-INFRINGEMENT.
              </div>
              <p>
                We make no warranty or guarantee that the Service will meet your requirements, be uninterrupted, timely, secure, error-free, or that defects will be corrected.
              </p>
            </section>

            {/* Section 5: AI Models & LLM Error Disclaimers */}
            <section className="space-y-3.5">
              <h2 className="text-lg sm:text-xl font-semibold text-white tracking-tight">
                5. AI Models &amp; LLM Mistakes: Not Our Liability
              </h2>
              <p>
                GoBetter utilizes artificial intelligence, Large Language Models (&ldquo;LLMs&rdquo;), and automated heuristics to analyze code diffs, score pull requests, and propose code suggestions. You expressly acknowledge and agree:
              </p>
              <ul className="space-y-3 list-disc pl-6 text-zinc-300 text-sm sm:text-[15px] leading-relaxed">
                <li>
                  <strong className="text-white">AI output is probabilistic:</strong> LLMs produce hallucinations, false positives, flawed recommendations, syntactical bugs, and can overlook critical issues.
                </li>
                <li>
                  <strong className="text-white">Mandatory human review:</strong> Any review comment, summary, or code patch generated by the Service must be independently vetted, tested, and reviewed by qualified human software engineers prior to merging or deploying.
                </li>
                <li>
                  <strong className="text-white">Zero liability for AI actions:</strong> Any mistakes, bugs, regressions, security vulnerabilities, or outages arising from AI models, LLMs, automated agents, or platform features are strictly <span className="text-[#c0f200] font-semibold underline underline-offset-4">not our liability</span>.
                </li>
              </ul>
            </section>

            {/* Section 6: Limitation of Liability */}
            <section className="space-y-3.5">
              <h2 className="text-lg sm:text-xl font-semibold text-white tracking-tight">
                6. Complete Limitation of Liability
              </h2>
              <div className="p-5 rounded-xl bg-[#121318] border border-white/10 text-xs sm:text-sm text-zinc-300 leading-relaxed font-mono tracking-wide">
                TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, IN NO EVENT SHALL GOBETTER, ITS CONTRIBUTORS, AUTHORS, OR MAINTAINERS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, PUNITIVE, OR CONSEQUENTIAL DAMAGES &mdash; INCLUDING BUT NOT LIMITED TO LOSS OF BUSINESS OPPORTUNITY, FINANCIAL LOSS, LOSS OF PROFITS, LOSS OF REVENUE, LOSS OF GOODWILL, BUSINESS INTERRUPTION, LOSS OF DATA, CODE CORRUPTION, OR SYSTEM DOWNTIME &mdash; ARISING OUT OF OR IN CONNECTION WITH THE SERVICE, WHETHER RUNNING ON THE HOSTED SAMPLE VERSION OR A SELF-HOSTED DEPLOYMENT.
              </div>
              <p className="text-sm sm:text-[15px] text-zinc-400">
                You agree that your sole and exclusive remedy for dissatisfaction with the Service is to discontinue using it or to deploy a self-hosted instance entirely at your own risk.
              </p>
            </section>

            {/* Section 7: MIT-0 License Spirit */}
            <section className="space-y-3.5">
              <h2 className="text-lg sm:text-xl font-semibold text-white tracking-tight">
                7. MIT-0 License: Zero Attribution, Do Whatever You Want
              </h2>
              <p>
                The software is open source and licensed under the MIT No Attribution (MIT-0) License:
              </p>
              <div className="p-5 rounded-xl bg-[#121318] border border-white/10 font-mono text-xs sm:text-sm text-zinc-300 leading-relaxed overflow-x-auto space-y-3">
                <p className="text-[#c0f200] font-semibold">MIT-0 License &bull; Copyright (c) 2026 GoBetter Contributors</p>
                <p>
                  Permission is hereby granted, free of charge, to any person obtaining a copy
                  of this software and associated documentation files (the &ldquo;Software&rdquo;), to deal
                  in the Software without restriction, including without limitation the rights
                  to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
                  copies of the Software, and to permit persons to whom the Software is
                  furnished to do so.
                </p>
                <p className="text-zinc-400">
                  THE SOFTWARE IS PROVIDED &ldquo;AS IS&rdquo;, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
                  IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
                  FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
                  AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
                  LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
                  OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
                  SOFTWARE.
                </p>
              </div>
              <p className="text-sm sm:text-[15px] text-zinc-300">
                <strong className="text-white">In short:</strong> Under MIT-0, you are completely free to do whatever you want with this codebase &mdash; fork it, modify it, redistribute it, commercialize it, or self-host it &mdash; with zero attribution required. However, there is zero warranty and zero liability of any kind against the authors.
              </p>
            </section>

            {/* Section 8 */}
            <section className="space-y-3.5">
              <h2 className="text-lg sm:text-xl font-semibold text-white tracking-tight">
                8. Acceptable Use
              </h2>
              <p className="text-sm sm:text-[15px] text-zinc-300">
                You agree not to abuse the Service, launch denial-of-service attacks, reverse-engineer proprietary components, or use the hosted sample deployment for unlawful purposes.
              </p>
            </section>

            {/* Section 9 */}
            <section className="space-y-3.5">
              <h2 className="text-lg sm:text-xl font-semibold text-white tracking-tight">
                9. Contact
              </h2>
              <p className="text-sm sm:text-[15px] text-zinc-300">
                Inquiries regarding these terms can be sent to{' '}
                <a href="mailto:harii.codess@gmail.com" className="text-[#c0f200] hover:underline font-medium">
                  harii.codess@gmail.com
                </a>
                .
              </p>
            </section>
          </div>
        ) : activeLegalTab === 'privacy-policy' ? (
          /* ═════════════════════════════════════════════════════════════
             PRIVACY POLICY
             ═════════════════════════════════════════════════════════════ */
          <div className="space-y-10 text-[15px] sm:text-base leading-relaxed text-zinc-300">
            {/* Section 1 */}
            <section className="space-y-3.5">
              <h2 className="text-lg sm:text-xl font-semibold text-white tracking-tight">
                1. Overview
              </h2>
              <p>
                GoBetter is built on developer-first privacy principles. This policy describes how data is handled when you use the GoBetter platform.
              </p>
            </section>

            {/* Section 2 */}
            <section className="space-y-3.5">
              <h2 className="text-lg sm:text-xl font-semibold text-white tracking-tight">
                2. Information We Collect
              </h2>
              <div className="space-y-3.5">
                <div className="p-4 sm:p-5 rounded-xl bg-[#16171d] border border-white/10 space-y-1.5">
                  <h4 className="text-white font-semibold text-sm sm:text-base">Account &amp; OAuth Data</h4>
                  <p className="text-sm text-zinc-300 leading-relaxed">
                    Email address and GitHub username/ID for authentication and authorization.
                  </p>
                </div>
                <div className="p-4 sm:p-5 rounded-xl bg-[#16171d] border border-white/10 space-y-1.5">
                  <h4 className="text-white font-semibold text-sm sm:text-base">Code &amp; PR Diffs</h4>
                  <p className="text-sm text-zinc-300 leading-relaxed">
                    Git diffs, file names, branch names, and commit hashes submitted for review.
                  </p>
                </div>
                <div className="p-4 sm:p-5 rounded-xl bg-[#16171d] border border-white/10 space-y-1.5">
                  <h4 className="text-white font-semibold text-sm sm:text-base">BYOK (Bring Your Own Key) Credentials</h4>
                  <p className="text-sm text-zinc-300 leading-relaxed">
                    API keys configured in BYOK are kept in your browser&rsquo;s local storage and are transmitted directly for inference. We do not store or persist your private API keys on our servers.
                  </p>
                </div>
              </div>
            </section>

            {/* Section 3 */}
            <section className="space-y-3.5">
              <h2 className="text-lg sm:text-xl font-semibold text-white tracking-tight">
                3. Zero AI Training on Private Code
              </h2>
              <div className="p-5 rounded-xl bg-[#16171d] border border-[#c0f200]/20 bg-[#c0f200]/[0.02]">
                <p className="text-sm sm:text-base text-zinc-200 leading-relaxed">
                  We <strong className="text-[#c0f200] font-semibold">never</strong> use your proprietary repository code or pull request diffs to train, fine-tune, or retrain public foundation AI models.
                </p>
              </div>
            </section>

            {/* Section 4 */}
            <section className="space-y-3.5">
              <h2 className="text-lg sm:text-xl font-semibold text-white tracking-tight">
                4. Self-Hosting for 100% Data Sovereignty
              </h2>
              <p className="text-sm sm:text-[15px] text-zinc-300 leading-relaxed">
                When you self-host GoBetter on your own private cloud or internal network, 100% of your code diffs, database records, and LLM requests remain strictly within your perimeter. No data or telemetry is sent back to our servers.
              </p>
            </section>

            {/* Section 5 */}
            <section className="space-y-3.5">
              <h2 className="text-lg sm:text-xl font-semibold text-white tracking-tight">
                5. Third-Party Subprocessors
              </h2>
              <p className="text-sm sm:text-[15px] text-zinc-300 leading-relaxed">
                On the hosted demo, pull request diffs are forwarded securely via TLS to configured AI inference endpoints (including OpenRouter, Vercel AI, Google, Inception Labs, OpenAI, and Anthropic, depending on availability and pricing) and infrastructure providers solely to produce code reviews. You can view our full{' '}
                <button
                  type="button"
                  onClick={() => handleTabSwitch('subprocessors')}
                  className="text-[#c0f200] hover:underline font-medium cursor-pointer"
                >
                  subprocessors list
                </button>
                .
              </p>
              <p className="text-sm sm:text-[15px] text-zinc-300 leading-relaxed">
                By using our service you also acknowledge and agree that your data will be processed by these third-party subprocessors solely to the extent necessary to provide the service.
              </p>
            </section>

            {/* Section 6 */}
            <section className="space-y-3.5">
              <h2 className="text-lg sm:text-xl font-semibold text-white tracking-tight">
                6. Data Deletion
              </h2>
              <p className="text-sm sm:text-[15px] text-zinc-300 leading-relaxed">
                You can request complete deletion of your account and associated review data at any time by emailing{' '}
                <a href="mailto:harii.codess@gmail.com" className="text-[#c0f200] hover:underline font-medium">
                  harii.codess@gmail.com
                </a>
                .
              </p>
            </section>
          </div>
        ) : (
          /* ═════════════════════════════════════════════════════════════
             SUBPROCESSORS
             ═════════════════════════════════════════════════════════════ */
          <div className="space-y-8 text-[15px] sm:text-base leading-relaxed text-zinc-300">
            <div className="p-4 sm:p-5 rounded-xl bg-[#16171d] border border-white/10 space-y-2">
              <span className="text-[11px] font-mono uppercase tracking-wider text-[#c0f200] font-semibold block">
                Hosted Sample Version Only
              </span>
              <p className="text-white font-medium text-sm sm:text-base">
                Please note: The subprocessor and model routing details below apply strictly and solely to the <strong>hosted sample version</strong> of GoBetter.
              </p>
              <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
                GoBetter uses third-party subprocessors to operate the hosted sample service and provide AI-assisted code reviews. Depending on platform availability and pricing, LLM inference requests on the hosted sample version are dynamically routed across multiple model providers. (If you self-host GoBetter, all LLM inference communicates directly with your own configured providers or private models without any third-party routing through GoBetter.)
              </p>
            </div>

            <div className="max-w-2xl mx-auto overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b border-white/10 text-zinc-400 font-medium text-xs uppercase tracking-wider">
                    <th className="py-3 pr-6 w-48 sm:w-56">Subprocessor</th>
                    <th className="py-3">Purpose</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.08] text-zinc-300">
                  {SUBPROCESSORS_LIST.map((sp) => (
                    <tr key={sp.name} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-3 pr-6 font-medium text-white whitespace-nowrap">
                        <div className="flex items-center gap-2.5">
                          {sp.icon}
                          <span>{sp.name}</span>
                        </div>
                      </td>
                      <td className="py-3 text-zinc-400">{sp.purpose}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <p className="text-zinc-300 pt-2 leading-relaxed">
              We strive to locate our services in the US itself, but some subprocessors might process your request from elsewhere which is not in our control, such as dynamic LLM routers. 

              <br/>
              <br/>

              This may, in some cases, involve data being processed or hosted in countries where regulatory or governmental requirements regarding data residency, privacy, or access may differ from those applicable in the United States.

              <br/>
              <br/>

              If data residency or jurisdictional requirements are important to you, we recommend first trying our self-hosted version, which is available through our public repositories, to evaluate the software in an environment where you retain control over where your data is processed and stored. You may then use our open source self hosted version with only those subprocessors and service providers whose data-processing practices and jurisdictions are acceptable for your requirements.
            </p>

            <p className="text-zinc-300 leading-relaxed">
              By using our service you also acknowledge and agree that your data will be processed by these third-party subprocessors solely to the extent necessary to provide the service.
            </p>
          </div>
        )}

        {/* Document Footer */}
        <div className="mt-20 pt-8 border-t border-white/[0.08] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs sm:text-sm text-zinc-500">
          <span>&copy; 2026 GoBetter AI &bull; Open Source under MIT-0</span>
          <div className="flex items-center flex-wrap gap-4 sm:gap-6">
            <button
              onClick={() => handleTabSwitch('terms')}
              className={`transition-colors cursor-pointer ${
                activeLegalTab === 'terms' ? 'text-white font-medium' : 'hover:text-zinc-300'
              }`}
            >
              Terms
            </button>
            <button
              onClick={() => handleTabSwitch('privacy-policy')}
              className={`transition-colors cursor-pointer ${
                activeLegalTab === 'privacy-policy' ? 'text-white font-medium' : 'hover:text-zinc-300'
              }`}
            >
              Privacy Policy
            </button>
            <button
              onClick={() => handleTabSwitch('subprocessors')}
              className={`transition-colors cursor-pointer ${
                activeLegalTab === 'subprocessors' ? 'text-white font-medium' : 'hover:text-zinc-300'
              }`}
            >
              Subprocessors
            </button>
            <a
              href="https://github.com/dev-hari-prasad/go-better"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-zinc-400 hover:text-white transition-colors cursor-pointer"
            >
              <GitHubDark className="w-4 h-4 shrink-0" />
              <span>GitHub</span>
            </a>
            <button
              onClick={handleBack}
              className="text-[#c0f200] hover:underline cursor-pointer font-medium"
            >
              Dashboard
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};
