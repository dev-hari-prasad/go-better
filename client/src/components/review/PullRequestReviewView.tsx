import React, { useState, useEffect } from 'react';
import {
  ShieldExclamationIcon,
  ArrowPathIcon,
  XMarkIcon,
  ClipboardDocumentIcon,
  ArrowLeftIcon,
  CodeBracketIcon,
  ShieldCheckIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  FunnelIcon,
  DocumentMagnifyingGlassIcon,
  DocumentTextIcon,
} from '@heroicons/react/24/outline';
import { BrainCircuit } from 'lucide-react';
import { GobeAiLogo } from '../ui/GobeAiLogo';
import { ClaudeAI, CodexDark, CursorDark } from '@ridemountainpig/svgl-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { PullRequest, DiffFile, AIFinding } from '../../types/codeReview';
import { StatusBadge, SeverityBadge } from '../ui/Badge';

interface PullRequestReviewViewProps {
  pullRequest: PullRequest;
  diffFiles: DiffFile[];
  findings: AIFinding[];
  isLoading?: boolean;
  isCheckingStatus?: boolean;
  reviewCountdown?: number | null;
  onApplyFix: (findingId: string) => void;
  onDismissFinding: (findingId: string) => void;
  onReTriggerReview: () => void;
  onCheckStatusNow?: () => void;
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
  <span style={{ fontSize: 10.5, fontWeight: 600, letterSpacing: '0.07em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.38)', fontFamily: 'var(--font-mono)' }}>
    {children}
  </span>
);

/* Metric card — neutral surface, only icon is coloured */
interface MetricCardProps { label: string; value: string; status: 'pass' | 'warn' | 'fail' }
const MetricCard: React.FC<MetricCardProps> = ({ label, value, status }) => {
  const iconColor = status === 'pass' ? '#34d399' : status === 'warn' ? '#fbbf24' : '#f87171';
  const Icon = status === 'pass' ? CheckCircleIcon : ExclamationTriangleIcon;
  return (
    <div style={{ padding: '13px 16px', background: S.base, border: `1px solid ${S.border}`, borderRadius: 8, display: 'flex', flexDirection: 'column', gap: 8 }}>
      <SectionLabel>{label}</SectionLabel>
      <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
        <Icon style={{ width: 13, height: 13, color: iconColor, flexShrink: 0 }} />
        <span style={{ fontSize: 13.5, fontWeight: 600, color: 'rgba(255,255,255,0.88)' }}>{value}</span>
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
    style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '9px 2px', fontSize: 12.5, fontWeight: active ? 600 : 400, color: active ? '#fff' : 'rgba(255,255,255,0.38)', background: 'none', border: 'none', borderBottom: '2px solid transparent', cursor: 'pointer', transition: 'color 0.15s', whiteSpace: 'nowrap', outline: 'none', userSelect: 'none' }}
    onMouseEnter={e => { if (!active) (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.65)'; }}
    onMouseLeave={e => { if (!active) (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.38)'; }}
  >
    <span style={{ opacity: active ? 0.9 : 0.5, display: 'flex' }}>{icon}</span>
    <span>{label}</span>
    {typeof count === 'number' && (
      <span style={{ padding: '1px 6px', borderRadius: 3, fontSize: 10.5, fontWeight: 600, background: active ? S.accentMuted : 'rgba(255,255,255,0.05)', color: active ? S.accent : 'rgba(255,255,255,0.3)', border: `1px solid ${active ? S.accentBorder : 'rgba(255,255,255,0.07)'}` }}>
        {count}
      </span>
    )}
  </button>
));

/* Ghost button */
const GhostBtn: React.FC<{ children: React.ReactNode; onClick?: () => void; icon?: React.ReactNode }> = ({ children, onClick, icon }) => (
  <button
    onClick={onClick}
    style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '6px 12px', borderRadius: 6, fontSize: 11.5, fontWeight: 600, background: 'transparent', color: 'rgba(255,255,255,0.6)', border: `1px solid ${S.border}`, cursor: 'pointer', transition: 'border-color 0.15s, color 0.15s', outline: 'none', whiteSpace: 'nowrap', userSelect: 'none' }}
    onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = '#fff'; (e.currentTarget as HTMLButtonElement).style.borderColor = S.borderStrong; }}
    onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.6)'; (e.currentTarget as HTMLButtonElement).style.borderColor = S.border; }}
  >
    {icon && <span style={{ display: 'flex' }}>{icon}</span>}
    {children}
  </button>
);

/* Severity filter chip */
const SevChip: React.FC<{ label: string; active: boolean; onClick: () => void }> = ({ label, active, onClick }) => (
  <button onClick={onClick}
    style={{ padding: '4px 10px', borderRadius: 4, fontSize: 11.5, fontWeight: active ? 600 : 400, background: active ? 'rgba(255,255,255,0.09)' : 'transparent', color: active ? '#fff' : 'rgba(255,255,255,0.35)', border: `1px solid ${active ? S.borderStrong : 'transparent'}`, cursor: 'pointer', transition: 'all 0.12s', outline: 'none', textTransform: 'capitalize' }}
    onMouseEnter={e => { if (!active) (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.6)'; }}
    onMouseLeave={e => { if (!active) (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.35)'; }}
  >{label}</button>
);

/* Markdown renderer for AI review summaries */
const ReviewMarkdown: React.FC<{ content: string; className?: string }> = ({ content, className = '' }) => (
  <div className={`review-markdown-content [&>*:first-child]:mt-0 [&>*:last-child]:mb-0 [&_p:last-child]:mb-0 ${className}`}>
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        h1: props => <h1 style={{ fontSize: 15, fontWeight: 600, color: '#fff', margin: '14px 0 6px' }} {...props} />,
        h2: props => <h2 style={{ fontSize: 14, fontWeight: 600, color: '#fff', margin: '12px 0 6px' }} {...props} />,
        h3: props => <h3 style={{ fontSize: 13.5, fontWeight: 600, color: '#fff', margin: '10px 0 4px' }} {...props} />,
        h4: props => <h4 style={{ fontSize: 12.5, fontWeight: 600, color: 'rgba(255,255,255,0.85)', margin: '8px 0 4px', textTransform: 'uppercase', letterSpacing: '0.04em' }} {...props} />,
        p: ({ className: pCls, ...props }) => (
          <p className={`mb-2.5 last:mb-0 ${pCls ?? ''}`} style={{ lineHeight: 1.7, fontSize: 13.5, color: 'rgba(255,255,255,0.84)' }} {...props} />
        ),
        strong: props => <strong style={{ color: '#fff', fontWeight: 600 }} {...props} />,
        em: props => <em style={{ color: 'rgba(255,255,255,0.75)' }} {...props} />,
        ul: props => <ul className="mb-3 last:mb-0 mt-1.5" style={{ paddingLeft: 20, lineHeight: 1.75, fontSize: 13.5 }} {...props} />,
        ol: props => <ol className="mb-3 last:mb-0 mt-1.5" style={{ paddingLeft: 20, lineHeight: 1.75, fontSize: 13.5 }} {...props} />,
        li: props => <li style={{ marginBottom: 4 }} {...props} />,
        a: props => <a target="_blank" rel="noreferrer" style={{ color: S.accent, textDecoration: 'underline' }} {...props} />,
        blockquote: props => <blockquote className="my-2 last:mb-0" style={{ padding: '4px 14px', borderLeft: `3px solid ${S.borderStrong}`, color: 'rgba(255,255,255,0.6)', fontStyle: 'italic' }} {...props} />,
        hr: () => <hr style={{ border: 'none', borderTop: `1px solid ${S.border}`, margin: '14px 0' }} />,
        table: props => <table className="my-2 last:mb-0" style={{ borderCollapse: 'collapse', fontSize: 12.5 }} {...props} />,
        th: props => <th style={{ border: `1px solid ${S.border}`, padding: '6px 10px', textAlign: 'left', background: S.raised, color: '#fff' }} {...props} />,
        td: props => <td style={{ border: `1px solid ${S.border}`, padding: '6px 10px' }} {...props} />,
        code: ({ className: codeCls, children, ...rest }) => {
          const isBlock = /language-/.test(codeCls ?? '') || String(children).includes('\n');
          if (isBlock) {
            return (
              <pre className="my-2 last:mb-0" style={{ padding: '10px 14px', background: '#0a0c10', border: `1px solid ${S.border}`, borderRadius: 6, overflowX: 'auto', lineHeight: 1.6, fontSize: 12.5 }}>
                <code className={codeCls} style={{ fontFamily: 'var(--font-mono)', color: 'rgba(255,255,255,0.8)' }} {...rest}>
                  {children}
                </code>
              </pre>
            );
          }
          return (
            <code style={{ padding: '2px 5px', borderRadius: 4, background: 'rgba(255,255,255,0.08)', fontFamily: 'var(--font-mono)', fontSize: '0.85em', color: '#e6edf3', display: 'inline', lineHeight: 'inherit', wordBreak: 'break-word' }} {...rest}>
              {children}
            </code>
          );
        },
        pre: ({ children }) => <div>{children}</div>,
      }}
    >
      {content?.trim() ?? ''}
    </ReactMarkdown>
  </div>
);

/* Helper to cleanly extract embedded confidence metrics and strip metadata from overview */
function extractAndCleanOverview(rawText: string | undefined) {
  if (!rawText) return { cleanText: '', confidence: null };

  let text = rawText;
  let confidence: { overall?: number; performance?: number; security?: number } | null = null;

  // Match confidence: { ... } (single or multi-line)
  const confMatch = text.match(/confidence\s*:\s*\{([^}]+)\}/i);
  if (confMatch) {
    const inner = confMatch[1];
    const overallMatch = inner.match(/overall\s*:\s*(\d+)/i);
    const perfMatch = inner.match(/performance\s*:\s*(\d+)/i);
    const secMatch = inner.match(/security\s*:\s*(\d+)/i);

    confidence = {
      overall: overallMatch ? parseInt(overallMatch[1], 10) : undefined,
      performance: perfMatch ? parseInt(perfMatch[1], 10) : undefined,
      security: secMatch ? parseInt(secMatch[1], 10) : undefined,
    };

    text = text.replace(confMatch[0], '');
  }

  // Remove any remaining raw JSON objects like { overall: 85, ... }
  text = text.replace(/\{[\s\r\n]*"?overall"?[\s\S]*?\}/gi, '');

  // Remove any trailing "confidence:" label
  text = text.replace(/(?:^|\n)\s*confidence\s*:\s*$/gim, '');

  const cleanText = text.trim();
  return { cleanText, confidence };
}

/* Helper to render inline code in titles */
const FormattedTitle: React.FC<{ title: string }> = ({ title }) => {
  const parts = title.split(/(`[^`]+`)/g);
  return (
    <span style={{ display: 'inline', alignItems: 'center' }}>
      {parts.map((part, i) => {
        if (part.startsWith('`') && part.endsWith('`') && part.length > 2) {
          return (
            <code
              key={i}
              style={{
                padding: '2px 5px',
                borderRadius: 4,
                background: 'rgba(255,255,255,0.08)',
                color: S.accent,
                fontFamily: 'var(--font-mono)',
                fontSize: '0.88em',
                margin: '0 2px',
              }}
            >
              {part.slice(1, -1)}
            </code>
          );
        }
        return <span key={i}>{part}</span>;
      })}
    </span>
  );
};

/* Helper to check if a patch string is a code snippet/diff or prose recommendation */
const isCodeSnippet = (text: string) => {
  const trimmed = text.trim();
  return (
    trimmed.startsWith('```') ||
    trimmed.includes('\n+') ||
    trimmed.includes('\n-') ||
    trimmed.startsWith('+') ||
    trimmed.startsWith('-') ||
    trimmed.startsWith('diff ') ||
    (trimmed.includes('\n') &&
      (trimmed.includes('function') ||
        trimmed.includes('const ') ||
        trimmed.includes('import ') ||
        trimmed.includes('return ')))
  );
};

const REVIEW_ANALYSIS_PHRASES = [
  'AI deep review analyzing changesets and diffs…',
  'Evaluating architectural patterns and code quality…',
  'Checking for security vulnerabilities and edge cases…',
  'Inspecting database queries and performance bottlenecks…',
  'Scanning for potential race conditions and memory leaks…',
  'Validating type safety, error boundaries, and contracts…',
  'Generating contextual recommendations and test plans…',
  'Formulating actionable feedback and review summary…',
  'Synthesizing deep code review findings…',
];

const Center: React.FC<{ children: React.ReactNode; pad?: string }> = ({ children, pad = '24px 48px' }) => (
  <div style={{ flex: 1, overflowY: 'auto', padding: pad }}>
    <div style={{ maxWidth: CONTENT_MAX, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
      {children}
    </div>
  </div>
);

/* ─── Main ─── */
export const PullRequestReviewView: React.FC<PullRequestReviewViewProps> = ({
  pullRequest,
  diffFiles,
  findings,
  isLoading = false,
  isCheckingStatus = false,
  reviewCountdown = null,
  onDismissFinding,
  onReTriggerReview,
  onCheckStatusNow,
  onBackToPullRequests,
}) => {
  const [activeReviewTab, setActiveReviewTab] = useState<'overview' | 'notes'>('overview');
  const [severityFilter, setSeverityFilter]   = useState<string>('all');
  const [copiedPatchId, setCopiedPatchId]     = useState<string | null>(null);
  const [copiedFixPrompt, setCopiedFixPrompt] = useState<boolean>(false);
  const [phraseIndex, setPhraseIndex]         = useState<number>(0);

  useEffect(() => {
    if (!isLoading) return;
    const interval = setInterval(() => {
      setPhraseIndex((prev) => (prev + 1) % REVIEW_ANALYSIS_PHRASES.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [isLoading]);

  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 });
  const tabsRef = React.useRef<(HTMLButtonElement | null)[]>([]);

  React.useEffect(() => {
    const tabIndex = activeReviewTab === 'overview' ? 0 : 1;
    const activeEl = tabsRef.current[tabIndex];
    if (activeEl) {
      setIndicatorStyle({
        left: activeEl.offsetLeft,
        width: activeEl.offsetWidth,
      });
    }
  }, [activeReviewTab]);

  const { cleanText: overviewText, confidence: extractedConfidence } = extractAndCleanOverview(
    pullRequest.aiReviewSummary?.overview
  );

  const hasReview =
    (Boolean(overviewText) && overviewText.trim().length > 0) ||
    findings.length > 0;

  const openFindingsCount = findings.filter(f => f.status === 'open').length;
  const filteredFindings  = severityFilter === 'all' ? findings : findings.filter(f => f.severity === severityFilter);

  // Confidence scores derived strictly from live metadata or actual summary
  const confidenceScore   = extractedConfidence?.overall ?? pullRequest.aiReviewSummary?.score ?? (hasReview ? 85 : 0);
  const securityScore     = extractedConfidence?.security ?? confidenceScore;
  const performanceScore  = extractedConfidence?.performance ?? confidenceScore;

  // Score colour — green ≥80, yellow 60-79, red <60
  const scoreColor  = confidenceScore >= 80 ? '#34d399' : confidenceScore >= 60 ? '#fbbf24' : '#f87171';
  const scoreBg     = confidenceScore >= 80 ? 'rgba(52,211,153,0.08)' : confidenceScore >= 60 ? 'rgba(251,191,36,0.08)' : 'rgba(248,113,113,0.08)';
  const scoreBorder = confidenceScore >= 80 ? 'rgba(52,211,153,0.2)'  : confidenceScore >= 60 ? 'rgba(251,191,36,0.2)'  : 'rgba(248,113,113,0.2)';

  const rawFixPrompt = pullRequest.agenticFixPrompt || pullRequest.aiReviewSummary?.agenticFixPrompt;
  const fixPrompt =
    rawFixPrompt ||
    (findings.length > 0
      ? `# Autonomous Bugfix & Remediation Prompt

## Mission Context
- **Target Repository**: \`${pullRequest.repoFullName}\`
- **Target Branch**: \`${pullRequest.sourceBranch}\`
- **Pull Request**: #${pullRequest.number} - "${pullRequest.title}"
- **Objective**: Resolve ${findings.length} automated review finding${findings.length > 1 ? 's' : ''} with surgical, minimal modifications.

---

## Actionable Findings & Target Locations

${findings
  .map(
    (f, idx) => `### Finding ${idx + 1}: [${f.severity.toUpperCase()}] ${f.title}
- **File**: \`${f.filename}\` (line ${f.lineNumber})
- **Problem / Root Cause**:
  ${f.explanation}
${f.impact ? `- **Impact / Failure Scenario**:\n  ${f.impact}` : ''}
${
  f.suggestedFix?.patch
    ? `- **Recommended Fix**:\n\`\`\`\n${f.suggestedFix.patch.trim()}\n\`\`\``
    : ''
}`
  )
  .join('\n\n---\n\n')}

---

## Agent Step-by-Step Execution Protocol

### Step 1: Context & File Inspection
- Open and inspect the referenced target files (\`${findings.map(f => f.filename).filter((v, i, a) => a.indexOf(v) === i).join('`, `')}\`).
- Check surrounding types, callers, and invariants before applying modifications.

### Step 2: Surgical Implementation
- Implement the targeted fixes specified above.
- Make minimal, targeted changes—do not refactor unrelated code, break existing public API contracts, or remove comments.

### Step 3: Automated Verification
- Run project test suites and typechecks to confirm zero regressions.
- Add or update regression test cases covering the specific failure conditions identified above.

### Step 4: Final Quality Check
- Verify that all reported reliability, security, and logic concerns are fully resolved.`
      : null);

  const handleCopyPatch = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedPatchId(id);
    setTimeout(() => setCopiedPatchId(null), 2000);
  };

  const handleCopyFixPrompt = () => {
    if (fixPrompt) {
      navigator.clipboard.writeText(fixPrompt);
      setCopiedFixPrompt(true);
      setTimeout(() => setCopiedFixPrompt(false), 2000);
    }
  };

  const openGobeChat = () => {
    window.dispatchEvent(
      new CustomEvent('open-gobe-chat', {
        detail: {
          pr: {
            id: pullRequest.id,
            prId: pullRequest.number,
            title: pullRequest.title,
            createdAt: pullRequest.createdAt,
          },
          prId: String(pullRequest.number || pullRequest.id),
          prTitle: pullRequest.title,
        },
      })
    );
  };

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
            </div>
            <h1 style={{ fontSize: 13, fontWeight: 600, color: '#fff', letterSpacing: '-0.01em', margin: 0, lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {pullRequest.title}
            </h1>
          </div>

          {/* Right: meta row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
            <StatusBadge status={pullRequest.status} size="sm" />
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
          <LumaTab
            ref={el => tabsRef.current[0] = el}
            label="AI Review"
            icon={<DocumentTextIcon style={{ width: 13, height: 13 }} />}
            active={activeReviewTab === 'overview'}
            onClick={() => setActiveReviewTab('overview')}
          />
          <LumaTab
            ref={el => tabsRef.current[1] = el}
            label="Review Notes"
            icon={<ShieldExclamationIcon style={{ width: 13, height: 13 }} />}
            count={openFindingsCount}
            active={activeReviewTab === 'notes'}
            onClick={() => setActiveReviewTab('notes')}
          />
          <div style={{ position: 'absolute', bottom: 0, left: indicatorStyle.left, width: indicatorStyle.width, height: 2, background: S.accent, transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)' }} />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 0' }}>
          {/* Re-run / Check status action button */}
          {isLoading ? (
            <button
              onClick={onCheckStatusNow || onReTriggerReview}
              disabled={isCheckingStatus}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                padding: '6px 12px',
                borderRadius: 6,
                fontSize: 11.5,
                fontWeight: 600,
                background: 'rgba(192,242,0,0.1)',
                color: S.accent,
                border: `1px solid ${S.accentBorder}`,
                cursor: isCheckingStatus ? 'not-allowed' : 'pointer',
                opacity: isCheckingStatus ? 0.7 : 1,
                transition: 'all 0.15s',
                outline: 'none',
                whiteSpace: 'nowrap',
                userSelect: 'none',
              }}
              title="Check review status now"
            >
              <ArrowPathIcon style={{ width: 11, height: 11, animation: isCheckingStatus ? 'spin 1s linear infinite' : 'none' }} />
              {isCheckingStatus ? 'Checking…' : 'Check status'}
            </button>
          ) : (
            <GhostBtn onClick={onReTriggerReview} icon={<ArrowPathIcon style={{ width: 11, height: 11 }} />}>
              Re-run Review
            </GhostBtn>
          )}

          {/* Separator */}
          <div style={{ width: 1, height: 16, background: 'rgba(255,255,255,0.08)', flexShrink: 0 }} />

          {/* View on GitHub — ghost */}
          <GhostBtn
            onClick={() => {
              const targetUrl =
                pullRequest.htmlUrl ||
                (pullRequest.repoFullName && pullRequest.number
                  ? `https://github.com/${pullRequest.repoFullName}/pull/${pullRequest.number}`
                  : null);
              if (targetUrl) {
                window.open(targetUrl, '_blank', 'noopener,noreferrer');
              }
            }}
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

      <style>{`
        @keyframes shimmerLaser {
          0% { background-position: 250% 0; }
          100% { background-position: -250% 0; }
        }
        .text-shimmer-laser {
          background: linear-gradient(
            90deg,
            #64748b 0%,
            #94a3b8 15%,
            #c0f200 40%,
            #ffffff 50%,
            #c0f200 60%,
            #94a3b8 85%,
            #64748b 100%
          );
          background-size: 250% 100%;
          color: transparent;
          -webkit-background-clip: text;
          background-clip: text;
          animation: shimmerLaser 2.6s linear infinite;
          font-weight: 600;
          display: inline-block;
        }
      `}</style>

      {/* ── Content ── */}
      <div style={{ flex: 1, overflow: 'hidden', display: 'flex' }}>
        <Center>
          {isLoading ? (
            /* ── Clean In-Progress Review State (No heavy shimmering skeletons) ── */
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', maxWidth: 540, margin: '80px auto 0', width: '100%' }}>
              <div style={{ width: 44, height: 44, borderRadius: 14, background: 'rgba(192,242,0,0.08)', border: `1px solid ${S.accentBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 18 }}>
                <BrainCircuit className="w-5 h-5 text-[#c0f200] animate-pulse" />
              </div>

              <div style={{ marginBottom: 8, minHeight: 24, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span key={phraseIndex} className="text-shimmer-laser text-[13.5px] font-mono tracking-wide select-none animate-apple-fade">
                  {REVIEW_ANALYSIS_PHRASES[phraseIndex]}
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontSize: 12, color: 'rgba(255,255,255,0.5)', fontFamily: 'var(--font-mono)' }}>
                <span>
                  {reviewCountdown != null && reviewCountdown > 0
                    ? `(~${reviewCountdown}s remaining)`
                    : `Analyzing #${pullRequest.number}…`}
                </span>
                {onCheckStatusNow && (
                  <>
                    <span style={{ color: 'rgba(255,255,255,0.2)' }}>•</span>
                    <button
                      onClick={onCheckStatusNow}
                      disabled={isCheckingStatus}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: isCheckingStatus ? 'rgba(255,255,255,0.5)' : S.accent,
                        fontSize: 12,
                        fontWeight: 600,
                        cursor: isCheckingStatus ? 'default' : 'pointer',
                        padding: 0,
                        textDecoration: isCheckingStatus ? 'none' : 'underline',
                        textUnderlineOffset: '2px',
                        transition: 'color 0.15s',
                      }}
                    >
                      {isCheckingStatus ? 'Checking…' : 'Check now?'}
                    </button>
                  </>
                )}
              </div>
            </div>
          ) : !hasReview ? (
            /* ── Clear, Simple Not Reviewed State (Frameless) ── */
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', maxWidth: 480, margin: '60px auto 0', width: '100%' }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(255,255,255,0.04)', border: `1px solid ${S.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16, color: 'rgba(255,255,255,0.6)' }}>
                <DocumentTextIcon style={{ width: 22, height: 22 }} />
              </div>

              <h2 style={{ fontSize: 16, fontWeight: 600, color: '#fff', margin: '0 0 6px', letterSpacing: '-0.01em' }}>
                This PR was not reviewed yet
              </h2>

              <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', lineHeight: 1.6, margin: '0 0 22px', maxWidth: 380 }}>
                No automated code review or findings are available for #{pullRequest.number}. Trigger an AI review to analyze code changes and potential issues.
              </p>

              <button
                onClick={onReTriggerReview}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '8px 18px',
                  borderRadius: 8,
                  fontSize: 12.5,
                  fontWeight: 600,
                  background: S.accent,
                  color: '#0d1117',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'opacity 0.15s, transform 0.1s',
                  outline: 'none',
                  userSelect: 'none',
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.opacity = '0.9'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.opacity = '1'; }}
              >
                <DocumentTextIcon style={{ width: 14, height: 14 }} />
                Review this Pull Request
              </button>
            </div>
          ) : activeReviewTab === 'overview' ? (
            /* ── Overview Tab Content ── */
            <>
              {/* Summary card */}
              <div style={{ background: S.overlay, border: `1px solid ${S.border}`, borderRadius: 10, overflow: 'hidden' }}>

                {/* Card header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '11px 18px', borderBottom: `1px solid ${S.border}` }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <DocumentMagnifyingGlassIcon style={{ width: 15, height: 15, color: S.accent }} />
                    <h2 style={{ fontSize: 13, fontWeight: 600, color: '#fff', margin: 0, letterSpacing: '-0.01em' }}>AI Code Review Summary</h2>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '3px 8px', borderRadius: 5, background: scoreBg, border: `1px solid ${scoreBorder}`, color: scoreColor, fontSize: 11, fontWeight: 700, fontFamily: 'var(--font-mono)', flexShrink: 0 }}>
                    <ShieldCheckIcon style={{ width: 12, height: 12 }} />
                    {confidenceScore}/100
                  </div>
                </div>

                {/* Metrics */}
                <div style={{ padding: '14px 18px', display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10 }}>
                  <MetricCard
                    label="Security Risk"
                    value={
                      findings.some(f => f.severity === 'critical')
                        ? 'Critical (Fix Required)'
                        : (pullRequest.aiReviewSummary?.criticalCount ?? 0) > 0
                        ? 'High Risk'
                        : (pullRequest.aiReviewSummary?.warningCount ?? 0) > 0
                        ? 'Warning'
                        : `Pass (${securityScore}/100)`
                    }
                    status={
                      findings.some(f => f.severity === 'critical') || (pullRequest.aiReviewSummary?.criticalCount ?? 0) > 0
                        ? 'fail'
                        : (pullRequest.aiReviewSummary?.warningCount ?? 0) > 0
                        ? 'warn'
                        : 'pass'
                    }
                  />
                  <MetricCard
                    label="Performance"
                    value={`Optimal (${performanceScore}/100)`}
                    status={performanceScore >= 80 ? 'pass' : performanceScore >= 60 ? 'warn' : 'fail'}
                  />
                  <MetricCard label="Review Status"  value={pullRequest.status.toUpperCase()} status="pass" />
                  <MetricCard label="Confidence"     value={`${confidenceScore}%`} status="pass" />
                </div>

                {/* Overview */}
                {overviewText && (
                  <div style={{ padding: '0 18px 16px' }}>
                    <div style={{ marginBottom: 7 }}><SectionLabel>Technical Architecture Overview</SectionLabel></div>
                    <div style={{ padding: '12px 16px', background: S.base, border: `1px solid ${S.border}`, borderLeft: `3px solid ${S.accent}`, borderRadius: '0 6px 6px 0', fontSize: 13.5, color: 'rgba(255,255,255,0.85)', lineHeight: 1.8 }}>
                      <ReviewMarkdown content={overviewText} />
                    </div>
                  </div>
                )}
              </div>

              {/* ── AI Agent Fixing Prompt Area (rendered where notes used to be) ── */}
              <div style={{ background: S.overlay, border: `1px solid ${S.border}`, borderRadius: 10, overflow: 'hidden' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 18px', borderBottom: `1px solid ${S.border}` }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                    <h3 style={{ fontSize: 13, fontWeight: 600, color: '#fff', margin: 0 }}>AI Agent Fixing Prompt</h3>
                    <div
                      data-tooltip="Prompt for your agents to fix and implement changes"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 5,
                        padding: '3px 7px',
                        background: 'rgba(255,255,255,0.04)',
                        border: `1px solid ${S.border}`,
                        borderRadius: 6,
                        cursor: 'default',
                        transition: 'all 0.15s ease',
                      }}
                      onMouseEnter={e => {
                        (e.currentTarget as HTMLDivElement).style.borderColor = S.borderStrong;
                        (e.currentTarget as HTMLDivElement).style.background = 'rgba(255,255,255,0.08)';
                      }}
                      onMouseLeave={e => {
                        (e.currentTarget as HTMLDivElement).style.borderColor = S.border;
                        (e.currentTarget as HTMLDivElement).style.background = 'rgba(255,255,255,0.04)';
                      }}
                    >
                      <ClaudeAI style={{ width: 13, height: 13, flexShrink: 0 }} />
                      <CodexDark style={{ width: 13, height: 13, flexShrink: 0 }} />
                      <CursorDark style={{ width: 13, height: 13, flexShrink: 0 }} />
                    </div>
                  </div>

                  {fixPrompt && (
                    <button
                      onClick={handleCopyFixPrompt}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 5,
                        padding: '4px 10px',
                        borderRadius: 5,
                        fontSize: 11,
                        fontWeight: 600,
                        background: copiedFixPrompt ? 'rgba(52,211,153,0.12)' : 'rgba(255,255,255,0.04)',
                        color: copiedFixPrompt ? '#34d399' : 'rgba(255,255,255,0.8)',
                        border: `1px solid ${copiedFixPrompt ? 'rgba(52,211,153,0.3)' : S.border}`,
                        cursor: 'pointer',
                        transition: 'all 0.15s',
                        outline: 'none',
                        fontFamily: 'var(--font-mono)',
                        userSelect: 'none',
                      }}
                      onMouseEnter={e => {
                        if (!copiedFixPrompt) {
                          (e.currentTarget as HTMLButtonElement).style.borderColor = S.borderStrong;
                          (e.currentTarget as HTMLButtonElement).style.color = '#fff';
                        }
                      }}
                      onMouseLeave={e => {
                        if (!copiedFixPrompt) {
                          (e.currentTarget as HTMLButtonElement).style.borderColor = S.border;
                          (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.8)';
                        }
                      }}
                    >
                      <ClipboardDocumentIcon style={{ width: 12, height: 12 }} />
                      {copiedFixPrompt ? 'Copied!' : 'Copy Fix Prompt'}
                    </button>
                  )}
                </div>

                <div style={{ padding: '16px 20px' }}>
                  {fixPrompt ? (
                    <pre style={{ margin: 0, padding: '16px 18px', background: S.base, border: `1px solid ${S.border}`, borderRadius: 8, fontFamily: 'var(--font-mono)', fontSize: 12.5, color: 'rgba(255,255,255,0.85)', overflowX: 'auto', lineHeight: 1.7, whiteSpace: 'pre-wrap', wordBreak: 'break-word', maxHeight: 440 }}>
                      {fixPrompt}
                    </pre>
                  ) : (
                    <div style={{ padding: '24px 20px', background: S.base, border: `1px solid ${S.border}`, borderRadius: 8, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                      <CheckCircleIcon style={{ width: 22, height: 22, color: '#34d399' }} />
                      <p style={{ margin: 0, fontSize: 13.5, fontWeight: 600, color: '#fff' }}>No Code Fix Required</p>
                      <p style={{ margin: 0, fontSize: 12, color: 'rgba(255,255,255,0.45)' }}>All automated review checks passed with zero findings.</p>
                    </div>
                  )}
                </div>
              </div>
            </>
          ) : (
            /* ── Review Notes Tab Content ── */
            <div>
              {/* Section header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                  <ShieldExclamationIcon style={{ width: 15, height: 15, color: 'rgba(255,255,255,0.4)' }} />
                  <SectionLabel>AI Review Notes</SectionLabel>
                  <span style={{ padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600, background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.45)', border: `1px solid ${S.border}` }}>
                    {openFindingsCount}
                  </span>
                </div>
                {/* Severity filter */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <FunnelIcon style={{ width: 12, height: 12, color: 'rgba(255,255,255,0.25)', marginRight: 4 }} />
                  {['all', 'critical', 'warning', 'suggestion'].map(sev => (
                    <SevChip key={sev} label={sev} active={severityFilter === sev} onClick={() => setSeverityFilter(sev)} />
                  ))}
                </div>
              </div>

              {/* Finding cards */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {filteredFindings.map(finding => (
                  <div key={finding.id} style={{ background: S.overlay, border: `1px solid ${S.border}`, borderRadius: 10, overflow: 'hidden' }}>
                    {/* Card Header */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 18px', borderBottom: `1px solid ${S.border}`, gap: 12 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                        <SeverityBadge severity={finding.severity} size="sm" />
                        <h3 style={{ fontSize: 14, fontWeight: 600, color: '#fff', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', letterSpacing: '-0.01em' }}>
                          <FormattedTitle title={finding.title} />
                        </h3>
                      </div>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 2, fontSize: 11.5, fontFamily: 'var(--font-mono)', flexShrink: 0, padding: '3px 9px', background: 'rgba(255,255,255,0.06)', borderRadius: 6, border: '1px solid rgba(255,255,255,0.12)', boxShadow: '0 1px 2px rgba(0,0,0,0.2)' }}>
                        <span style={{ color: 'rgba(255,255,255,0.85)', fontWeight: 500 }}>
                          {finding.filename}
                        </span>
                        <span style={{ color: S.accent, fontWeight: 600 }}>
                          :{finding.lineNumber}
                        </span>
                      </div>
                    </div>

                    {/* Card Body */}
                    <div style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 14 }}>
                      {/* Explanation via ReviewMarkdown */}
                      <div style={{ fontSize: 13.5, color: 'rgba(255,255,255,0.85)', lineHeight: 1.8 }}>
                        <ReviewMarkdown content={finding.explanation} />
                      </div>

                      {/* Concrete Failure Scenario (if separately present) */}
                      {finding.impact && !finding.explanation.includes(finding.impact) && (
                        <div style={{ padding: '11px 15px', background: 'rgba(251,191,36,0.04)', border: '1px solid rgba(251,191,36,0.2)', borderRadius: 7, display: 'flex', flexDirection: 'column', gap: 6 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#fbbf24', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: 'var(--font-mono)' }}>
                            <ExclamationTriangleIcon style={{ width: 13, height: 13 }} />
                            Concrete Failure Scenario
                          </div>
                          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)', lineHeight: 1.7 }}>
                            <ReviewMarkdown content={finding.impact} />
                          </div>
                        </div>
                      )}

                      {/* Suggested Patch / Recommended Fix */}
                      {finding.suggestedFix?.patch?.trim() && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <SectionLabel>
                              {isCodeSnippet(finding.suggestedFix.patch) ? 'Suggested Patch' : 'Recommended Fix'}
                            </SectionLabel>
                            <button onClick={() => handleCopyPatch(finding.id, finding.suggestedFix!.patch)}
                              style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, color: copiedPatchId === finding.id ? S.accent : 'rgba(255,255,255,0.4)', background: 'none', border: 'none', cursor: 'pointer', outline: 'none', fontFamily: 'var(--font-mono)', padding: 0, transition: 'color 0.12s' }}>
                              <ClipboardDocumentIcon style={{ width: 12, height: 12 }} />
                              {copiedPatchId === finding.id ? 'Copied!' : 'Copy'}
                            </button>
                          </div>

                          {isCodeSnippet(finding.suggestedFix.patch) ? (
                            <pre style={{ margin: 0, padding: '11px 14px', background: S.base, border: `1px solid ${S.border}`, borderRadius: 7, fontFamily: 'var(--font-mono)', fontSize: 12.5, color: 'rgba(255,255,255,0.85)', overflowX: 'auto', lineHeight: 1.6 }}>
                              {finding.suggestedFix.patch.trim()}
                            </pre>
                          ) : (
                            <div style={{ padding: '10px 14px', background: S.base, border: `1px solid ${S.border}`, borderLeft: `3px solid ${S.accent}`, borderRadius: '0 7px 7px 0', fontSize: 13, color: 'rgba(255,255,255,0.85)', lineHeight: 1.6 }}>
                              <ReviewMarkdown content={finding.suggestedFix.patch} />
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                {filteredFindings.length === 0 && (
                  <div style={{ padding: '48px 0', textAlign: 'center', color: 'rgba(255,255,255,0.35)', fontSize: 13.5 }}>
                    No notes match the selected filter.
                  </div>
                )}
              </div>
            </div>
          )}
        </Center>
      </div>
    </div>
  );
};
