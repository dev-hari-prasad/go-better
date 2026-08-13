import React, { useState } from 'react';
import {
  XMarkIcon,
  SparklesIcon,
  ClipboardDocumentIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  CodeBracketIcon,
  ArrowsUpDownIcon,
} from '@heroicons/react/24/outline';
import { DiffFile, AIFinding, DiffLine } from '../../types/codeReview';
import { SeverityBadge } from '../ui/Badge';

/* ─── design tokens (same as PullRequestReviewView) ─── */
const S = {
  base: '#0d1117',
  raised: '#111318',
  overlay: '#161a21',
  border: 'rgba(255,255,255,0.07)',
  borderStrong: 'rgba(255,255,255,0.12)',
  accent: '#c0f200',
  accentMuted: 'rgba(192,242,0,0.08)',
  accentBorder: 'rgba(192,242,0,0.2)',
};

interface CodeDiffViewerProps {
  file: DiffFile;
  findings: AIFinding[];
  onDismissFinding: (findingId: string) => void;
  expandAllSignal?: boolean;
}

export const CodeDiffViewer: React.FC<CodeDiffViewerProps> = ({
  file,
  findings,
  onDismissFinding,
  expandAllSignal,
}) => {
  const [viewMode, setViewMode] = useState<'unified' | 'split'>(() => {
    return (localStorage.getItem('gobe-diff-view-mode') as 'unified' | 'split') || 'unified';
  });

  React.useEffect(() => {
    const handleViewModeChange = (e: Event) => {
      const ce = e as CustomEvent<'unified' | 'split'>;
      if (ce.detail) setViewMode(ce.detail);
    };
    window.addEventListener('gobe-view-mode-change', handleViewModeChange);
    return () => window.removeEventListener('gobe-view-mode-change', handleViewModeChange);
  }, []);

  const changeViewMode = (mode: 'unified' | 'split') => {
    setViewMode(mode);
    localStorage.setItem('gobe-diff-view-mode', mode);
    window.dispatchEvent(new CustomEvent('gobe-view-mode-change', { detail: mode }));
  };
  const [isFileCollapsed, setIsFileCollapsed] = useState(true);
  const [expandedComments, setExpandedComments] = useState<Record<string, boolean>>({});
  const [expandedHunks, setExpandedHunks] = useState<Record<number, boolean>>({});
  const [copiedPatchId, setCopiedPatchId] = useState<string | null>(null);

  React.useEffect(() => {
    if (expandAllSignal !== undefined) {
      setIsFileCollapsed(!expandAllSignal);
    }
  }, [expandAllSignal]);

  const toggleComment = (findingId: string) => {
    setExpandedComments((prev) => ({ ...prev, [findingId]: !prev[findingId] }));
  };

  const toggleHunkContext = (hunkIdx: number) => {
    setExpandedHunks((prev) => ({ ...prev, [hunkIdx]: !prev[hunkIdx] }));
  };

  const handleCopyPatch = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedPatchId(id);
    setTimeout(() => setCopiedPatchId(null), 2000);
  };

  const mockContextLines: DiffLine[] = [
    { type: 'unchanged', oldLineNumber: 15, newLineNumber: 15, content: '  // Verifies user session claims against security policy' },
    { type: 'unchanged', oldLineNumber: 16, newLineNumber: 16, content: '  const sessionConfig = getWorkspaceSecurityPolicy();' },
    { type: 'unchanged', oldLineNumber: 17, newLineNumber: 17, content: '  if (!sessionConfig.allowAnonymousAccess) {' },
  ];

  return (
    <div
      style={{
        background: S.overlay,
        border: `1px solid ${S.border}`,
        borderRadius: 12,
        overflow: 'hidden',
        fontFamily: 'var(--font-mono)',
        fontSize: 12,
        transition: 'border-color 0.2s',
      }}
    >
      {/* File header */}
      <div
        onClick={() => setIsFileCollapsed(!isFileCollapsed)}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 14px',
          background: S.raised,
          borderBottom: isFileCollapsed ? 'none' : `1px solid ${S.border}`,
          fontFamily: 'inherit',
          cursor: 'pointer',
        }}
      >
        {/* Left: expand/collapse + filename */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
          <button
            onClick={() => setIsFileCollapsed(!isFileCollapsed)}
            title={isFileCollapsed ? 'Expand' : 'Collapse'}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 22,
              height: 22,
              borderRadius: 6,
              background: 'rgba(255,255,255,0.04)',
              border: `1px solid ${S.border}`,
              color: 'rgba(255,255,255,0.35)',
              cursor: 'pointer',
              outline: 'none',
              transition: 'color 0.15s, background 0.15s',
              flexShrink: 0,
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = '#fff'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.35)'; }}
          >
            {isFileCollapsed
              ? <ChevronRightIcon style={{ width: 12, height: 12 }} />
              : <ChevronDownIcon style={{ width: 12, height: 12 }} />}
          </button>

          <CodeBracketIcon style={{ width: 13, height: 13, color: 'rgba(255,255,255,0.3)', flexShrink: 0 }} />
          <span
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: 'rgba(255,255,255,0.8)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {file.filename}
          </span>

          {/* +/- pills */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span
              style={{
                padding: '1px 6px',
                borderRadius: 5,
                fontSize: 10,
                fontWeight: 700,
                background: 'rgba(52,211,153,0.08)',
                color: '#34d399',
                border: '1px solid rgba(52,211,153,0.18)',
              }}
            >
              +{file.additions}
            </span>
            <span
              style={{
                padding: '1px 6px',
                borderRadius: 5,
                fontSize: 10,
                fontWeight: 700,
                background: 'rgba(248,113,113,0.08)',
                color: '#f87171',
                border: '1px solid rgba(248,113,113,0.18)',
              }}
            >
              -{file.deletions}
            </span>
          </div>

          {file.findingsCount > 0 && (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                padding: '2px 8px',
                borderRadius: 100,
                fontSize: 10,
                fontWeight: 600,
                background: S.accentMuted,
                color: S.accent,
                border: `1px solid ${S.accentBorder}`,
              }}
            >
              <SparklesIcon style={{ width: 10, height: 10 }} />
              {file.findingsCount} notes
            </span>
          )}
        </div>

        {/* Right: view mode toggle */}
        <div
          onClick={e => e.stopPropagation()}
          style={{
            display: 'flex',
            background: 'rgba(255,255,255,0.03)',
            border: `1px solid ${S.border}`,
            borderRadius: 8,
            padding: 2,
            gap: 2,
          }}
        >
          {(['unified', 'split'] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => changeViewMode(mode)}
              style={{
                padding: '3px 10px',
                borderRadius: 6,
                fontSize: 11,
                fontWeight: viewMode === mode ? 600 : 400,
                color: viewMode === mode ? '#fff' : 'rgba(255,255,255,0.35)',
                background: viewMode === mode ? 'rgba(255,255,255,0.08)' : 'transparent',
                border: `1px solid ${viewMode === mode ? S.borderStrong : 'transparent'}`,
                cursor: 'pointer',
                transition: 'all 0.15s',
                outline: 'none',
                whiteSpace: 'nowrap',
                fontFamily: 'var(--font-sans)',
              }}
            >
              {mode.charAt(0).toUpperCase() + mode.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Hunks */}
      <div
        style={{
          display: 'grid',
          gridTemplateRows: isFileCollapsed ? '0fr' : '1fr',
          transition: 'grid-template-rows 0.3s ease-in-out',
        }}
      >
        <div style={{ overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            {file.hunks.map((hunk, hunkIdx) => {
            const isHunkExpanded = !!expandedHunks[hunkIdx];
            const activeLines = isHunkExpanded ? [...mockContextLines, ...hunk.lines] : hunk.lines;

            return (
              <div key={hunkIdx}>
                {/* Hunk header */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '5px 14px',
                    background: S.base,
                    borderTop: `1px solid ${S.border}`,
                    borderBottom: `1px solid ${S.border}`,
                    fontFamily: 'var(--font-mono)',
                    fontSize: 10,
                    color: 'rgba(255,255,255,0.3)',
                    userSelect: 'none',
                  }}
                >
                  <span style={{ fontWeight: 500 }}>{hunk.header}</span>
                  <button
                    onClick={() => toggleHunkContext(hunkIdx)}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                      padding: '3px 8px',
                      borderRadius: 6,
                      fontSize: 10,
                      fontWeight: 500,
                      color: 'rgba(255,255,255,0.45)',
                      background: 'rgba(255,255,255,0.04)',
                      border: `1px solid ${S.border}`,
                      cursor: 'pointer',
                      outline: 'none',
                      fontFamily: 'var(--font-sans)',
                      transition: 'color 0.15s, background 0.15s',
                    }}
                    onMouseEnter={e => {
                      (e.currentTarget as HTMLButtonElement).style.color = '#fff';
                      (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.07)';
                    }}
                    onMouseLeave={e => {
                      (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.45)';
                      (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.04)';
                    }}
                  >
                    <ArrowsUpDownIcon style={{ width: 10, height: 10, color: S.accent }} />
                    {isHunkExpanded ? 'Hide context' : 'Expand 15 lines'}
                  </button>
                </div>

                {/* Unified view */}
                {viewMode === 'unified' ? (
                  <div>
                    {activeLines.map((line, lineIdx) => {
                      const associatedFinding = findings.find(
                        (f) => f.filename === file.filename && f.lineNumber === line.newLineNumber
                      );
                      const isFindingExpanded = associatedFinding && expandedComments[associatedFinding.id] !== false;
                      const isAdd = line.type === 'add';
                      const isDelete = line.type === 'delete';

                      return (
                        <React.Fragment key={lineIdx}>
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'stretch',
                              lineHeight: '22px',
                              background: isAdd
                                ? 'rgba(52,211,153,0.07)'
                                : isDelete
                                ? 'rgba(248,113,113,0.07)'
                                : 'transparent',
                              borderLeft: `2px solid ${isAdd ? '#34d399' : isDelete ? '#f87171' : 'transparent'}`,
                              transition: 'background 0.2s ease, border-left-color 0.2s ease',
                            }}
                          >
                            {/* Old line no */}
                            <div
                              style={{
                                width: 44,
                                padding: '2px 8px',
                                textAlign: 'right',
                                color: 'rgba(255,255,255,0.2)',
                                fontSize: 10,
                                flexShrink: 0,
                                borderRight: `1px solid ${S.border}`,
                                background: 'rgba(0,0,0,0.2)',
                                userSelect: 'none',
                              }}
                            >
                              {line.oldLineNumber || ''}
                            </div>
                            {/* New line no */}
                            <div
                              style={{
                                width: 44,
                                padding: '2px 8px',
                                textAlign: 'right',
                                color: 'rgba(255,255,255,0.2)',
                                fontSize: 10,
                                flexShrink: 0,
                                borderRight: `1px solid ${S.border}`,
                                background: 'rgba(0,0,0,0.2)',
                                userSelect: 'none',
                              }}
                            >
                              {line.newLineNumber || ''}
                            </div>
                            {/* Marker */}
                            <div
                              style={{
                                width: 22,
                                textAlign: 'center',
                                fontSize: 11,
                                fontWeight: 700,
                                flexShrink: 0,
                                color: isAdd ? '#34d399' : isDelete ? '#f87171' : 'transparent',
                                userSelect: 'none',
                              }}
                            >
                              {isAdd ? '+' : isDelete ? '-' : ' '}
                            </div>
                            {/* Content */}
                            <div
                              style={{
                                padding: '2px 12px',
                                whiteSpace: 'pre',
                                flex: 1,
                                overflow: 'hidden',
                                minWidth: 0,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                color: isAdd ? 'rgba(187,247,208,0.85)' : isDelete ? 'rgba(254,202,202,0.7)' : 'rgba(255,255,255,0.6)',
                              }}
                            >
                              <span>{line.content}</span>
                            </div>
                          </div>

                          {/* Inline finding card */}
                          {associatedFinding && (
                            <div style={{ padding: '0 12px' }}>
                              <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                                <button
                                  onClick={() => toggleComment(associatedFinding.id)}
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: 6,
                                    padding: '4px 10px',
                                    margin: '4px 0',
                                    borderRadius: 6,
                                    fontSize: 10,
                                    fontWeight: 600,
                                    background: isFindingExpanded ? 'rgba(255,255,255,0.05)' : S.accentMuted,
                                    color: isFindingExpanded ? 'rgba(255,255,255,0.5)' : S.accent,
                                    border: `1px solid ${isFindingExpanded ? 'rgba(255,255,255,0.1)' : S.accentBorder}`,
                                    cursor: 'pointer',
                                    fontFamily: 'var(--font-sans)',
                                    transition: 'all 0.15s',
                                  }}
                                  onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = isFindingExpanded ? 'rgba(255,255,255,0.1)' : 'rgba(192,242,0,0.14)'; }}
                                  onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = isFindingExpanded ? 'rgba(255,255,255,0.05)' : S.accentMuted; }}
                                >
                                  <SparklesIcon style={{ width: 12, height: 12 }} />
                                  {isFindingExpanded ? 'Collapse AI Note' : 'View AI Note'}
                                </button>
                              </div>
                              <div
                                style={{
                                  display: 'grid',
                                  gridTemplateRows: isFindingExpanded ? '1fr' : '0fr',
                                  transition: 'grid-template-rows 0.3s ease-in-out, opacity 0.3s ease-in-out',
                                  opacity: isFindingExpanded ? 1 : 0,
                                }}
                              >
                              <div style={{ overflow: 'hidden' }}>
                                <div
                                  style={{
                                    margin: isFindingExpanded ? '8px 12px' : '0 12px',
                                    padding: '12px 14px',
                                    background: S.raised,
                                    borderLeft: `3px solid ${S.accent}`,
                                    borderRadius: '0 10px 10px 0',
                                    border: `1px solid ${S.border}`,
                                    borderLeftColor: S.accent,
                                    fontFamily: 'var(--font-sans)',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: 10,
                                    transition: 'margin 0.3s ease-in-out',
                                  }}
                                >
                              <div
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'space-between',
                                  flexWrap: 'wrap',
                                  gap: 8,
                                }}
                              >
                                <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                                  <SeverityBadge severity={associatedFinding.severity} size="sm" />
                                  <span style={{ fontSize: 12, fontWeight: 600, color: '#fff' }}>
                                    {associatedFinding.title}
                                  </span>
                                </div>
                                <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', fontFamily: 'var(--font-mono)' }}>
                                  Line {associatedFinding.lineNumber}
                                </span>
                              </div>

                              <p style={{ margin: 0, fontSize: 12, color: 'rgba(255,255,255,0.6)', lineHeight: 1.6 }}>
                                {associatedFinding.explanation}
                              </p>

                              {associatedFinding.impact && (
                                <div
                                  style={{
                                    padding: '8px 10px',
                                    background: S.base,
                                    borderRadius: 7,
                                    border: `1px solid ${S.border}`,
                                    fontSize: 11,
                                    color: 'rgba(255,255,255,0.45)',
                                  }}
                                >
                                  <strong style={{ color: 'rgba(255,255,255,0.65)', fontWeight: 500 }}>Impact: </strong>
                                  {associatedFinding.impact}
                                </div>
                              )}

                              {associatedFinding.suggestedFix && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)', fontFamily: 'var(--font-mono)' }}>
                                      Suggested patch
                                    </span>
                                    <button
                                      onClick={() => handleCopyPatch(associatedFinding.id, associatedFinding.suggestedFix!.patch)}
                                      style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: 4,
                                        fontSize: 10,
                                        color: copiedPatchId === associatedFinding.id ? S.accent : 'rgba(255,255,255,0.3)',
                                        background: 'none',
                                        border: 'none',
                                        cursor: 'pointer',
                                        outline: 'none',
                                        fontFamily: 'var(--font-mono)',
                                        transition: 'color 0.15s',
                                      }}
                                    >
                                      <ClipboardDocumentIcon style={{ width: 11, height: 11 }} />
                                      {copiedPatchId === associatedFinding.id ? 'Copied!' : 'Copy'}
                                    </button>
                                  </div>
                                  <pre
                                    style={{
                                      margin: 0,
                                      padding: '10px 12px',
                                      background: S.base,
                                      border: `1px solid ${S.border}`,
                                      borderRadius: 8,
                                      fontSize: 11,
                                      color: 'rgba(255,255,255,0.6)',
                                      overflowX: 'auto',
                                      lineHeight: 1.6,
                                      fontFamily: 'var(--font-mono)',
                                    }}
                                  >
                                    {associatedFinding.suggestedFix.patch}
                                  </pre>
                                </div>
                              )}

                              <div
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'space-between',
                                  paddingTop: 8,
                                  borderTop: `1px solid ${S.border}`,
                                }}
                              >
                                <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.22)', fontFamily: 'var(--font-mono)' }}>
                                  {associatedFinding.category}
                                </span>
                                <button
                                  onClick={() => onDismissFinding(associatedFinding.id)}
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: 4,
                                    fontSize: 11,
                                    fontWeight: 500,
                                    color: 'rgba(255,255,255,0.3)',
                                    background: 'rgba(255,255,255,0.03)',
                                    border: `1px solid ${S.border}`,
                                    borderRadius: 7,
                                    padding: '4px 10px',
                                    cursor: 'pointer',
                                    outline: 'none',
                                    fontFamily: 'var(--font-sans)',
                                    transition: 'all 0.15s',
                                  }}
                                  onMouseEnter={e => {
                                    (e.currentTarget as HTMLButtonElement).style.color = '#f87171';
                                    (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(248,113,113,0.25)';
                                  }}
                                  onMouseLeave={e => {
                                    (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.3)';
                                    (e.currentTarget as HTMLButtonElement).style.borderColor = S.border;
                                  }}
                                >
                                  <XMarkIcon style={{ width: 11, height: 11 }} />
                                  Dismiss
                                </button>
                              </div>
                                </div>
                              </div>
                            </div>
                            </div>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </div>
                ) : (
                  /* Split view */
                  <div>
                    {activeLines.map((line, lineIdx) => {
                      const isAdd = line.type === 'add';
                      const isDelete = line.type === 'delete';
                      const isNormal = line.type === 'unchanged';
                      const associatedFinding = findings.find(
                        (f) => f.filename === file.filename && f.lineNumber === line.newLineNumber
                      );
                      const isFindingExpanded = associatedFinding && expandedComments[associatedFinding.id] !== false;

                      const cellStyle = (active: boolean): React.CSSProperties => ({
                        display: 'flex',
                        alignItems: 'stretch',
                        minWidth: 0,
                        flex: 1,
                        borderRight: `1px solid ${S.border}`,
                        background: isDelete && active ? 'rgba(248,113,113,0.07)' : isAdd && active ? 'rgba(52,211,153,0.07)' : 'transparent',
                      });

                      return (
                        <React.Fragment key={lineIdx}>
                          <div
                            style={{
                              display: 'grid',
                            gridTemplateColumns: '1fr 1fr',
                            lineHeight: '22px',
                            transition: 'background 0.2s ease',
                          }}
                        >
                          {/* Old */}
                          <div style={cellStyle(isDelete)}>
                            <div style={{ width: 36, padding: '2px 6px', textAlign: 'right', color: 'rgba(255,255,255,0.2)', fontSize: 10, flexShrink: 0, borderRight: `1px solid ${S.border}`, background: 'rgba(0,0,0,0.2)', userSelect: 'none' }}>
                              {isDelete || isNormal ? line.oldLineNumber : ''}
                            </div>
                            <div style={{ width: 18, textAlign: 'center', fontWeight: 700, fontSize: 11, flexShrink: 0, color: '#f87171', userSelect: 'none' }}>
                              {isDelete ? '-' : ''}
                            </div>
                            <div style={{ padding: '2px 10px', whiteSpace: 'pre', flex: 1, overflow: 'hidden', minWidth: 0, color: isDelete ? 'rgba(254,202,202,0.7)' : 'rgba(255,255,255,0.55)' }}>
                              {isDelete || isNormal ? line.content : ''}
                            </div>
                          </div>

                          {/* New */}
                          <div style={cellStyle(isAdd)}>
                            <div style={{ width: 36, padding: '2px 6px', textAlign: 'right', color: 'rgba(255,255,255,0.2)', fontSize: 10, flexShrink: 0, borderRight: `1px solid ${S.border}`, background: 'rgba(0,0,0,0.2)', userSelect: 'none' }}>
                              {isAdd || isNormal ? line.newLineNumber : ''}
                            </div>
                            <div style={{ width: 18, textAlign: 'center', fontWeight: 700, fontSize: 11, flexShrink: 0, color: '#34d399', userSelect: 'none' }}>
                              {isAdd ? '+' : ''}
                            </div>
                            <div style={{ padding: '2px 10px', whiteSpace: 'pre', flex: 1, overflow: 'hidden', minWidth: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: isAdd ? 'rgba(187,247,208,0.85)' : 'rgba(255,255,255,0.55)' }}>
                              <span>{isAdd || isNormal ? line.content : ''}</span>
                            </div>
                          </div>
                        </div>

                          {/* Inline finding card */}
                          {associatedFinding && (
                            <div style={{ padding: '0 12px' }}>
                              <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                                <button
                                  onClick={() => toggleComment(associatedFinding.id)}
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: 6,
                                    padding: '4px 10px',
                                    margin: '4px 0',
                                    borderRadius: 6,
                                    fontSize: 10,
                                    fontWeight: 600,
                                    background: isFindingExpanded ? 'rgba(255,255,255,0.05)' : S.accentMuted,
                                    color: isFindingExpanded ? 'rgba(255,255,255,0.5)' : S.accent,
                                    border: `1px solid ${isFindingExpanded ? 'rgba(255,255,255,0.1)' : S.accentBorder}`,
                                    cursor: 'pointer',
                                    fontFamily: 'var(--font-sans)',
                                    transition: 'all 0.15s',
                                  }}
                                  onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = isFindingExpanded ? 'rgba(255,255,255,0.1)' : 'rgba(192,242,0,0.14)'; }}
                                  onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = isFindingExpanded ? 'rgba(255,255,255,0.05)' : S.accentMuted; }}
                                >
                                  <SparklesIcon style={{ width: 12, height: 12 }} />
                                  {isFindingExpanded ? 'Collapse AI Note' : 'View AI Note'}
                                </button>
                              </div>
                              <div
                                style={{
                                  display: 'grid',
                                  gridTemplateRows: isFindingExpanded ? '1fr' : '0fr',
                                  transition: 'grid-template-rows 0.3s ease-in-out, opacity 0.3s ease-in-out',
                                  opacity: isFindingExpanded ? 1 : 0,
                                }}
                              >
                              <div style={{ overflow: 'hidden' }}>
                                <div
                                  style={{
                                    margin: isFindingExpanded ? '8px 12px' : '0 12px',
                                    padding: '12px 14px',
                                    background: S.raised,
                                    borderLeft: `3px solid ${S.accent}`,
                                    borderRadius: '0 10px 10px 0',
                                    border: `1px solid ${S.border}`,
                                    borderLeftColor: S.accent,
                                    fontFamily: 'var(--font-sans)',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: 10,
                                    transition: 'margin 0.3s ease-in-out',
                                  }}
                                >
                                  <div
                                    style={{
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'space-between',
                                      flexWrap: 'wrap',
                                      gap: 8,
                                    }}
                                  >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                                      <SeverityBadge severity={associatedFinding.severity} size="sm" />
                                      <span style={{ fontSize: 12, fontWeight: 600, color: '#fff' }}>
                                        {associatedFinding.title}
                                      </span>
                                    </div>
                                    <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', fontFamily: 'var(--font-mono)' }}>
                                      Line {associatedFinding.lineNumber}
                                    </span>
                                  </div>

                                  <p style={{ margin: 0, fontSize: 12, color: 'rgba(255,255,255,0.6)', lineHeight: 1.6 }}>
                                    {associatedFinding.explanation}
                                  </p>

                                  {associatedFinding.impact && (
                                    <div
                                      style={{
                                        padding: '8px 10px',
                                        background: S.base,
                                        borderRadius: 7,
                                        border: `1px solid ${S.border}`,
                                        fontSize: 11,
                                        color: 'rgba(255,255,255,0.45)',
                                      }}
                                    >
                                      <strong style={{ color: 'rgba(255,255,255,0.65)', fontWeight: 500 }}>Impact: </strong>
                                      {associatedFinding.impact}
                                    </div>
                                  )}

                                  {associatedFinding.suggestedFix && (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                        <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)', fontFamily: 'var(--font-mono)' }}>
                                          Suggested patch
                                        </span>
                                        <button
                                          onClick={() => handleCopyPatch(associatedFinding.id, associatedFinding.suggestedFix!.patch)}
                                          style={{
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: 4,
                                            fontSize: 10,
                                            color: copiedPatchId === associatedFinding.id ? S.accent : 'rgba(255,255,255,0.3)',
                                            background: 'none',
                                            border: 'none',
                                            cursor: 'pointer',
                                            outline: 'none',
                                            fontFamily: 'var(--font-mono)',
                                            transition: 'color 0.15s',
                                          }}
                                        >
                                          <ClipboardDocumentIcon style={{ width: 11, height: 11 }} />
                                          {copiedPatchId === associatedFinding.id ? 'Copied!' : 'Copy'}
                                        </button>
                                      </div>
                                      <pre
                                        style={{
                                          margin: 0,
                                          padding: '10px 12px',
                                          background: S.base,
                                          border: `1px solid ${S.border}`,
                                          borderRadius: 8,
                                          fontSize: 11,
                                          color: 'rgba(255,255,255,0.6)',
                                          overflowX: 'auto',
                                          lineHeight: 1.6,
                                          fontFamily: 'var(--font-mono)',
                                        }}
                                      >
                                        {associatedFinding.suggestedFix.patch}
                                      </pre>
                                    </div>
                                  )}

                                  <div
                                    style={{
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'space-between',
                                      paddingTop: 8,
                                      borderTop: `1px solid ${S.border}`,
                                    }}
                                  >
                                    <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.22)', fontFamily: 'var(--font-mono)' }}>
                                      {associatedFinding.category}
                                    </span>
                                    <button
                                      onClick={() => onDismissFinding(associatedFinding.id)}
                                      style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: 4,
                                        fontSize: 11,
                                        fontWeight: 500,
                                        color: 'rgba(255,255,255,0.3)',
                                        background: 'rgba(255,255,255,0.03)',
                                        border: `1px solid ${S.border}`,
                                        borderRadius: 7,
                                        padding: '4px 10px',
                                        cursor: 'pointer',
                                        outline: 'none',
                                        fontFamily: 'var(--font-sans)',
                                        transition: 'all 0.15s',
                                      }}
                                      onMouseEnter={e => {
                                        (e.currentTarget as HTMLButtonElement).style.color = '#f87171';
                                        (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(248,113,113,0.25)';
                                      }}
                                      onMouseLeave={e => {
                                        (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.3)';
                                        (e.currentTarget as HTMLButtonElement).style.borderColor = S.border;
                                      }}
                                    >
                                      <XMarkIcon style={{ width: 11, height: 11 }} />
                                      Dismiss
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </div>
                            </div>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
          </div>
        </div>
      </div>
    </div>
  );
};
