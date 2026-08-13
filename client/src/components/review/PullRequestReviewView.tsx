import React, { useState } from 'react';
import {
  ShieldExclamationIcon,
  SparklesIcon,
  ArrowPathIcon,
  XMarkIcon,
  ClipboardDocumentIcon,
  ArrowLeftIcon,
  CodeBracketIcon,
  ShieldCheckIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  FunnelIcon,
} from '@heroicons/react/24/outline';
import { BrainCircuit } from 'lucide-react';
import { PullRequest, DiffFile, AIFinding } from '../../types/codeReview';
import { StatusBadge, SeverityBadge } from '../ui/Badge';
import { CodeDiffViewer } from './CodeDiffViewer';

interface PullRequestReviewViewProps {
  pullRequest: PullRequest;
  diffFiles: DiffFile[];
  findings: AIFinding[];
  onApplyFix: (findingId: string) => void;
  onDismissFinding: (findingId: string) => void;
  onReTriggerReview: () => void;
  onBackToPullRequests?: () => void;
}

/* ─── surface tokens ─── */
const S = {
  base:          '#0d1117',
  raised:        '#111318',
  overlay:       '#161a21',
  border:        'rgba(255,255,255,0.07)',
  borderStrong:  'rgba(255,255,255,0.11)',
  accent:        '#c0f200',
  accentMuted:   'rgba(192,242,0,0.07)',
  accentBorder:  'rgba(192,242,0,0.18)',
};

const CONTENT_MAX = 1400; // centered max-width for all tab content

/* ─── micro-components ─── */
const SectionLabel: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.07em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.28)', fontFamily: 'var(--font-mono)' }}>
    {children}
  </span>
);

/* Metric card — neutral surface, only icon is coloured */
interface MetricCardProps { label: string; value: string; status: 'pass' | 'warn' | 'fail' }
const MetricCard: React.FC<MetricCardProps> = ({ label, value, status }) => {
  const iconColor = status === 'pass' ? '#34d399' : status === 'warn' ? '#fbbf24' : '#f87171';
  const Icon = status === 'pass' ? CheckCircleIcon : ExclamationTriangleIcon;
  return (
    <div style={{ padding: '11px 14px', background: S.base, border: `1px solid ${S.border}`, borderRadius: 6, display: 'flex', flexDirection: 'column', gap: 7 }}>
      <SectionLabel>{label}</SectionLabel>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <Icon style={{ width: 11, height: 11, color: iconColor, flexShrink: 0 }} />
        <span style={{ fontSize: 12, fontWeight: 500, color: 'rgba(255,255,255,0.75)' }}>{value}</span>
      </div>
    </div>
  );
};

/* Tab button */
interface LumaTabProps { label: string; icon: React.ReactNode; count?: number; active: boolean; onClick: () => void }
const LumaTab = React.forwardRef<HTMLButtonElement, LumaTabProps>(({ label, icon, count, active, onClick }, ref) => (
  <button
    ref={ref}
    onClick={onClick}
    style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '8px 2px', fontSize: 12, fontWeight: active ? 600 : 400, color: active ? '#fff' : 'rgba(255,255,255,0.35)', background: 'none', border: 'none', borderBottom: '2px solid transparent', cursor: 'pointer', transition: 'color 0.15s', whiteSpace: 'nowrap', outline: 'none', userSelect: 'none' }}
    onMouseEnter={e => { if (!active) (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.6)'; }}
    onMouseLeave={e => { if (!active) (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.35)'; }}
  >
    <span style={{ opacity: active ? 0.9 : 0.5, display: 'flex' }}>{icon}</span>
    <span>{label}</span>
    {typeof count === 'number' && (
      <span style={{ padding: '1px 5px', borderRadius: 3, fontSize: 10, fontWeight: 600, background: active ? S.accentMuted : 'rgba(255,255,255,0.05)', color: active ? S.accent : 'rgba(255,255,255,0.3)', border: `1px solid ${active ? S.accentBorder : 'rgba(255,255,255,0.07)'}` }}>
        {count}
      </span>
    )}
  </button>
));

/* Ghost button */
const GhostBtn: React.FC<{ children: React.ReactNode; onClick?: () => void; icon?: React.ReactNode }> = ({ children, onClick, icon }) => (
  <button
    onClick={onClick}
    style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '5px 10px', borderRadius: 6, fontSize: 11, fontWeight: 600, background: 'transparent', color: 'rgba(255,255,255,0.55)', border: `1px solid ${S.border}`, cursor: 'pointer', transition: 'border-color 0.15s, color 0.15s', outline: 'none', whiteSpace: 'nowrap', userSelect: 'none' }}
    onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = '#fff'; (e.currentTarget as HTMLButtonElement).style.borderColor = S.borderStrong; }}
    onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.55)'; (e.currentTarget as HTMLButtonElement).style.borderColor = S.border; }}
  >
    {icon && <span style={{ display: 'flex' }}>{icon}</span>}
    {children}
  </button>
);

/* Severity filter chip */
const SevChip: React.FC<{ label: string; active: boolean; onClick: () => void }> = ({ label, active, onClick }) => (
  <button onClick={onClick}
    style={{ padding: '3px 8px', borderRadius: 4, fontSize: 11, fontWeight: active ? 600 : 400, background: active ? 'rgba(255,255,255,0.08)' : 'transparent', color: active ? '#fff' : 'rgba(255,255,255,0.3)', border: `1px solid ${active ? S.borderStrong : 'transparent'}`, cursor: 'pointer', transition: 'all 0.12s', outline: 'none', textTransform: 'capitalize' }}
    onMouseEnter={e => { if (!active) (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.55)'; }}
    onMouseLeave={e => { if (!active) (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.3)'; }}
  >{label}</button>
);

/* ─── Main ─── */
export const PullRequestReviewView: React.FC<PullRequestReviewViewProps> = ({
  pullRequest,
  diffFiles,
  findings,
  onDismissFinding,
  onReTriggerReview,
  onBackToPullRequests,
}) => {
  const [activeTab, setActiveTab]         = useState<string>('summary');
  const [selectedFileId, setSelectedFileId] = useState<string>('all');
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [copiedPatchId, setCopiedPatchId]   = useState<string | null>(null);
  const [expandAllSignal, setExpandAllSignal] = useState<boolean>(false);

  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 });
  const tabsRef = React.useRef<(HTMLButtonElement | null)[]>([]);

  React.useEffect(() => {
    const activeIndex = activeTab === 'summary' ? 0 : 1;
    const activeEl = tabsRef.current[activeIndex];
    if (activeEl) {
      setIndicatorStyle({
        left: activeEl.offsetLeft,
        width: activeEl.offsetWidth,
      });
    }
  }, [activeTab]);

  const openFindingsCount = findings.filter(f => f.status === 'open').length;
  const filteredFindings  = severityFilter === 'all' ? findings : findings.filter(f => f.severity === severityFilter);
  const filteredFiles     = selectedFileId === 'all' ? diffFiles : diffFiles.filter(f => f.id === selectedFileId);
  const confidenceScore   = 92;

  // Score colour — green ≥80, yellow 60-79, red <60
  const scoreColor  = confidenceScore >= 80 ? '#34d399' : confidenceScore >= 60 ? '#fbbf24' : '#f87171';
  const scoreBg     = confidenceScore >= 80 ? 'rgba(52,211,153,0.08)' : confidenceScore >= 60 ? 'rgba(251,191,36,0.08)' : 'rgba(248,113,113,0.08)';
  const scoreBorder = confidenceScore >= 80 ? 'rgba(52,211,153,0.2)'  : confidenceScore >= 60 ? 'rgba(251,191,36,0.2)'  : 'rgba(248,113,113,0.2)';

  const handleCopyPatch = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedPatchId(id);
    setTimeout(() => setCopiedPatchId(null), 2000);
  };

  const openGobeChat = () => window.dispatchEvent(new Event('open-gobe-chat'));

  /* centred content wrapper */
  const Center: React.FC<{ children: React.ReactNode; pad?: string }> = ({ children, pad = '24px 48px' }) => (
    <div style={{ flex: 1, overflowY: 'auto', padding: pad }}>
      <div style={{ maxWidth: CONTENT_MAX, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
        {children}
      </div>
    </div>
  );

  return (
    <div className="animate-apple-fade" style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 3rem)', background: S.base, overflow: 'hidden' }}>

      {/* ── Header ── */}
      <div style={{ padding: '9px 16px', background: S.raised, borderBottom: `1px solid ${S.border}`, flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>

          {/* Left: breadcrumb + title */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0, flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              {onBackToPullRequests && (
                <button onClick={onBackToPullRequests} title="Back"
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 24, height: 24, borderRadius: 5, background: 'rgba(255,255,255,0.04)', border: `1px solid ${S.border}`, color: 'rgba(255,255,255,0.35)', cursor: 'pointer', outline: 'none', flexShrink: 0 }}
                  onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = '#fff'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.35)'; }}>
                  <ArrowLeftIcon style={{ width: 12, height: 12 }} />
                </button>
              )}
              <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', fontFamily: 'var(--font-mono)' }}>{pullRequest.repoFullName}</span>
              <span style={{ color: 'rgba(255,255,255,0.12)' }}>/</span>
              <span style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.55)', fontFamily: 'var(--font-mono)' }}>#{pullRequest.number}</span>
              <StatusBadge status={pullRequest.status} size="sm" />
            </div>
            <h1 style={{ fontSize: 13, fontWeight: 600, color: '#fff', letterSpacing: '-0.01em', margin: 0, lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {pullRequest.title}
            </h1>
          </div>

          {/* Right: meta row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <img src={pullRequest.author.avatarUrl} alt={pullRequest.author.name} style={{ width: 16, height: 16, borderRadius: '50%', border: `1px solid ${S.border}` }} />
              <span style={{ fontSize: 11, fontWeight: 500, color: 'rgba(255,255,255,0.6)' }}>{pullRequest.author.name}</span>
            </div>
            <span style={{ color: 'rgba(255,255,255,0.1)' }}>·</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 3, fontFamily: 'var(--font-mono)', fontSize: 11 }}>
              <span style={{ color: '#34d399', fontWeight: 700 }}>+{pullRequest.additions}</span>
              <span style={{ color: '#f87171', fontWeight: 700 }}>-{pullRequest.deletions}</span>
            </div>
            <span style={{ color: 'rgba(255,255,255,0.1)' }}>·</span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 7px', borderRadius: 4, fontSize: 10, fontWeight: 500, color: 'rgba(255,255,255,0.4)', background: 'rgba(255,255,255,0.04)', border: `1px solid ${S.border}`, fontFamily: 'var(--font-mono)', whiteSpace: 'nowrap' }}>
              <CodeBracketIcon style={{ width: 10, height: 10 }} />
              {pullRequest.sourceBranch} → {pullRequest.targetBranch}
            </span>
          </div>
        </div>
      </div>

      {/* ── Tab Bar ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px', background: S.raised, borderBottom: `1px solid ${S.border}`, flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, position: 'relative' }}>
          <LumaTab ref={el => tabsRef.current[0] = el} label="AI Review"  icon={<SparklesIcon style={{ width: 13, height: 13 }} />}      active={activeTab === 'summary'} onClick={() => setActiveTab('summary')} />
          <LumaTab ref={el => tabsRef.current[1] = el} label="Code Diff"  icon={<CodeBracketIcon style={{ width: 13, height: 13 }} />}   count={diffFiles.length} active={activeTab === 'diff'} onClick={() => setActiveTab('diff')} />
          <div style={{ position: 'absolute', bottom: 0, left: indicatorStyle.left, width: indicatorStyle.width, height: 2, background: S.accent, transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)' }} />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 0' }}>
          {/* Re-run — ghost outline */}
          <GhostBtn onClick={onReTriggerReview} icon={<ArrowPathIcon style={{ width: 11, height: 11 }} />}>
            Re-run Review
          </GhostBtn>

          {/* Separator */}
          <div style={{ width: 1, height: 16, background: 'rgba(255,255,255,0.08)', flexShrink: 0 }} />

          {/* View on GitHub — ghost */}
          <GhostBtn
            onClick={() => window.open(`https://github.com/${pullRequest.repoFullName}/pull/${pullRequest.number}`, '_blank')}
            icon={<svg style={{ width: 11, height: 11 }} fill="currentColor" viewBox="0 0 24 24"><path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" /></svg>}
          >
            View on GitHub
          </GhostBtn>

          {/* Ask Gobe AI — pure outline accent */}
          <button
            onClick={openGobeChat}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '5px 10px', borderRadius: 6, fontSize: 11, fontWeight: 600, background: 'transparent', color: S.accent, border: `1px solid ${S.accentBorder}`, cursor: 'pointer', transition: 'background 0.15s, border-color 0.15s', outline: 'none', whiteSpace: 'nowrap', userSelect: 'none' }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = S.accentMuted; (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(192,242,0,0.35)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; (e.currentTarget as HTMLButtonElement).style.borderColor = S.accentBorder; }}
          >
            <BrainCircuit style={{ width: 13, height: 13 }} />
            Ask Gobe AI
          </button>
        </div>
      </div>

      {/* ── Content ── */}
      <div style={{ flex: 1, overflow: 'hidden', display: 'flex' }}>

        {/* ── TAB: AI Review (summary + findings together) ── */}
        {activeTab === 'summary' && (
          <Center>
            {/* Summary card */}
            <div style={{ background: S.overlay, border: `1px solid ${S.border}`, borderRadius: 10, overflow: 'hidden' }}>

              {/* Card header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '15px 20px', borderBottom: `1px solid ${S.border}` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
                  <div style={{ width: 32, height: 32, borderRadius: 7, background: S.accentMuted, border: `1px solid ${S.accentBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: S.accent, flexShrink: 0 }}>
                    <SparklesIcon style={{ width: 15, height: 15 }} />
                  </div>
                  <div>
                    <h2 style={{ fontSize: 13, fontWeight: 600, color: '#fff', margin: 0, letterSpacing: '-0.01em' }}>AI Code Review Summary</h2>
                    <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.28)', margin: '2px 0 0', fontFamily: 'var(--font-mono)' }}>
                      Claude 3.5 Sonnet (BYOK) · AST Static Inspection
                    </p>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 5, background: scoreBg, border: `1px solid ${scoreBorder}`, color: scoreColor, fontSize: 11, fontWeight: 700, fontFamily: 'var(--font-mono)', flexShrink: 0 }}>
                  <ShieldCheckIcon style={{ width: 12, height: 12 }} />
                  {confidenceScore}/100
                </div>
              </div>

              {/* Metrics */}
              <div style={{ padding: '14px 20px', display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10 }}>
                <MetricCard label="Security Risk"  value="Pass (98/100)"     status="pass" />
                <MetricCard label="Type Safety"    value="Optimal (92/100)"  status="pass" />
                <MetricCard label="Performance"    value="Warning (78/100)"  status="warn" />
                <MetricCard label="Test Coverage"  value="+4.2% Delta"       status="pass" />
              </div>

              {/* Overview */}
              <div style={{ padding: '0 20px 18px' }}>
                <div style={{ marginBottom: 7 }}><SectionLabel>Technical Architecture Overview</SectionLabel></div>
                <div style={{ padding: '12px 15px', background: S.base, border: `1px solid ${S.border}`, borderLeft: `2px solid ${S.accent}`, borderRadius: '0 6px 6px 0', fontSize: 12, color: 'rgba(255,255,255,0.62)', lineHeight: 1.65 }}>
                  {pullRequest.aiReviewSummary.overview}
                </div>
              </div>
            </div>

            {/* ── AI Review Notes (inline below summary) ── */}
            <div>
              {/* Section header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <ShieldExclamationIcon style={{ width: 13, height: 13, color: 'rgba(255,255,255,0.3)' }} />
                  <SectionLabel>AI Review Notes</SectionLabel>
                  <span style={{ padding: '1px 6px', borderRadius: 3, fontSize: 10, fontWeight: 600, background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.3)', border: `1px solid ${S.border}` }}>
                    {openFindingsCount}
                  </span>
                </div>
                {/* Severity filter */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                  <FunnelIcon style={{ width: 11, height: 11, color: 'rgba(255,255,255,0.2)', marginRight: 3 }} />
                  {['all', 'critical', 'warning', 'suggestion'].map(sev => (
                    <SevChip key={sev} label={sev} active={severityFilter === sev} onClick={() => setSeverityFilter(sev)} />
                  ))}
                </div>
              </div>

              {/* Finding cards */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {filteredFindings.map(finding => (
                  <div key={finding.id} style={{ background: S.overlay, border: `1px solid ${S.border}`, borderRadius: 8, overflow: 'hidden' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '9px 14px', borderBottom: `1px solid ${S.border}`, gap: 10 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 7, minWidth: 0 }}>
                        <SeverityBadge severity={finding.severity} size="sm" />
                        <h3 style={{ fontSize: 12, fontWeight: 600, color: '#fff', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{finding.title}</h3>
                      </div>
                      <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.2)', fontFamily: 'var(--font-mono)', flexShrink: 0 }}>
                        {finding.filename}:{finding.lineNumber}
                      </span>
                    </div>

                    <div style={{ padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: 9 }}>
                      <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.58)', lineHeight: 1.6, margin: 0 }}>{finding.explanation}</p>

                      {finding.suggestedFix && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <SectionLabel>Suggested Patch</SectionLabel>
                            <button onClick={() => handleCopyPatch(finding.id, finding.suggestedFix!.patch)}
                              style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 10, color: copiedPatchId === finding.id ? S.accent : 'rgba(255,255,255,0.28)', background: 'none', border: 'none', cursor: 'pointer', outline: 'none', fontFamily: 'var(--font-mono)', padding: 0, transition: 'color 0.12s' }}>
                              <ClipboardDocumentIcon style={{ width: 11, height: 11 }} />
                              {copiedPatchId === finding.id ? 'Copied!' : 'Copy'}
                            </button>
                          </div>
                          <pre style={{ margin: 0, padding: '8px 11px', background: S.base, border: `1px solid ${S.border}`, borderRadius: 5, fontFamily: 'var(--font-mono)', fontSize: 11, color: 'rgba(255,255,255,0.6)', overflowX: 'auto', lineHeight: 1.55 }}>
                            {finding.suggestedFix.patch}
                          </pre>
                        </div>
                      )}

                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 8, borderTop: `1px solid ${S.border}` }}>
                        <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.18)', fontFamily: 'var(--font-mono)' }}>{finding.category}</span>
                        <button onClick={() => onDismissFinding(finding.id)}
                          style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 500, color: 'rgba(255,255,255,0.28)', background: 'rgba(255,255,255,0.03)', border: `1px solid ${S.border}`, borderRadius: 5, padding: '3px 9px', cursor: 'pointer', transition: 'all 0.12s', outline: 'none' }}
                          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = '#f87171'; (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(248,113,113,0.22)'; }}
                          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.28)'; (e.currentTarget as HTMLButtonElement).style.borderColor = S.border; }}>
                          <XMarkIcon style={{ width: 10, height: 10 }} />
                          Dismiss
                        </button>
                      </div>
                    </div>
                  </div>
                ))}

                {filteredFindings.length === 0 && (
                  <div style={{ padding: '32px 0', textAlign: 'center', color: 'rgba(255,255,255,0.2)', fontSize: 12 }}>
                    No notes match the selected filter.
                  </div>
                )}
              </div>
            </div>
          </Center>
        )}

        {/* ── TAB: Code Diff ── */}
        {activeTab === 'diff' && (
          <Center pad="20px 48px">
            {/* Toolbar */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <SectionLabel>Showing</SectionLabel>
                <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', fontFamily: 'var(--font-mono)' }}>
                  {diffFiles.length} files · +{pullRequest.additions} −{pullRequest.deletions}
                </span>
              </div>
              
              {/* Centered Expand All Toggle Pill */}
              <div style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)', display: 'flex', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(255,255,255,0.03)', border: `1px solid ${S.border}`, borderRadius: 6, padding: 2 }}>
                  <button 
                    onClick={() => setExpandAllSignal(false)}
                    style={{ padding: '3px 10px', borderRadius: 4, fontSize: 10, fontWeight: !expandAllSignal ? 600 : 400, color: !expandAllSignal ? '#fff' : 'rgba(255,255,255,0.4)', background: !expandAllSignal ? 'rgba(255,255,255,0.1)' : 'transparent', border: 'none', cursor: 'pointer', transition: 'all 0.15s', outline: 'none' }}
                  >
                    Collapse All
                  </button>
                  <button 
                    onClick={() => setExpandAllSignal(true)}
                    style={{ padding: '3px 10px', borderRadius: 4, fontSize: 10, fontWeight: expandAllSignal ? 600 : 400, color: expandAllSignal ? '#fff' : 'rgba(255,255,255,0.4)', background: expandAllSignal ? 'rgba(255,255,255,0.1)' : 'transparent', border: 'none', cursor: 'pointer', transition: 'all 0.15s', outline: 'none' }}
                  >
                    Expand All
                  </button>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <SectionLabel>Jump to file</SectionLabel>
                <select value={selectedFileId} onChange={e => setSelectedFileId(e.target.value)}
                  style={{ background: S.overlay, border: `1px solid ${S.border}`, color: 'rgba(255,255,255,0.55)', fontSize: 11, borderRadius: 5, padding: '4px 8px', outline: 'none', cursor: 'pointer', fontFamily: 'var(--font-mono)' }}>
                  <option value="all">All files</option>
                  {diffFiles.map(f => <option key={f.id} value={f.id}>{f.filename}</option>)}
                </select>
              </div>
            </div>

            {filteredFiles.map(file => (
              <CodeDiffViewer key={file.id} file={file} findings={findings.filter(fi => fi.filename === file.filename)} onDismissFinding={onDismissFinding} expandAllSignal={expandAllSignal} />
            ))}
          </Center>
        )}
      </div>
    </div>
  );
};
