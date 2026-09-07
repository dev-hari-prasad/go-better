import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import Prism from 'prismjs';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-jsx';
import 'prismjs/components/prism-tsx';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-json';
import 'prismjs/components/prism-bash';
import 'prismjs/components/prism-markdown';
import 'prismjs/components/prism-css';
import 'prismjs/components/prism-sql';
import 'prismjs/components/prism-go';
import 'prismjs/components/prism-rust';
import 'prismjs/components/prism-yaml';
import 'prismjs/components/prism-docker';
import { 
  ClipboardDocumentIcon,
  CheckIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';
import { ThumbsUp, ThumbsDown } from '@phosphor-icons/react';
import { Sparkles, Copy, GitPullRequest, FileCode, FileText, FolderTree, Wrench } from 'lucide-react';
import { DriveWavefront } from './DriveWavefront';
import { THINKING_PHRASES } from '../../constants/thinkingPhrases';

export function renderToolIcon(toolName: string) {
  const name = (toolName || '').toLowerCase();
  if (name.includes('pr') || name.includes('pullrequest')) {
    return <GitPullRequest className="w-3.5 h-3.5 text-[#c0f200] shrink-0" />;
  }
  if (name.includes('diff')) {
    return <FileCode className="w-3.5 h-3.5 text-[#c0f200] shrink-0" />;
  }
  if (name.includes('file')) {
    return <FileText className="w-3.5 h-3.5 text-[#c0f200] shrink-0" />;
  }
  if (name.includes('tree') || name.includes('folder') || name.includes('repo') || name.includes('dir')) {
    return <FolderTree className="w-3.5 h-3.5 text-[#c0f200] shrink-0" />;
  }
  return <Wrench className="w-3.5 h-3.5 text-[#c0f200] shrink-0" />;
}

export interface MessageSource {
  id: string;
  name: string;
  icon?: React.ReactNode;
}

export interface ToolCallItem {
  toolCallId: string;
  toolName: string;
  status: 'calling' | 'result';
  input?: any;
  output?: any;
  label: string;
}

export interface ChatMessage {
  id: string;
  dbMessageId?: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
  codeSnippet?: string;
  prContext?: string;
  isStreaming?: boolean;
  title?: string;
  sources?: MessageSource[];
  followUps?: string[];
  thumbsFeedback?: 'postive' | 'negitive' | null;
  toolCalls?: ToolCallItem[];
  llmModel?: string;
  inputTokens?: number;
  outputTokens?: number;
  reasoningTokens?: number;
  cachedTokens?: number;
}

interface AIChatMessageProps {
  message: ChatMessage;
  onCopySnippet: (id: string, code: string) => void;
  copiedCodeId: string | null;
  onFollowUpClick?: (text: string) => void;
  onFeedback?: (messageId: string, feedback: 'postive' | 'negitive' | null) => void;
  isLatest?: boolean;
}

const MarkdownCodeBlock: React.FC<{ language?: string; value: string }> = ({
  language,
  value,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const highlightedHtml = React.useMemo(() => {
    const lang = language ? language.toLowerCase() : '';
    const langMap: Record<string, string> = {
      js: 'javascript',
      ts: 'typescript',
      jsx: 'jsx',
      tsx: 'tsx',
      py: 'python',
      sh: 'bash',
      shell: 'bash',
      yml: 'yaml',
    };
    const mappedLang = langMap[lang] || lang;
    const grammar = Prism.languages[mappedLang] || Prism.languages.javascript;
    try {
      if (grammar) {
        return Prism.highlight(value, grammar, mappedLang);
      }
    } catch {
      // fallback
    }
    return null;
  }, [language, value]);

  return (
    <div className="my-3.5 rounded-lg border border-[#232530] overflow-hidden bg-[#0d1117] text-left">
      <div className="flex items-center justify-between px-3.5 py-1.5 bg-[#161b22] border-b border-[#232530] text-[12px] font-mono text-zinc-400 select-none">
        <span className="text-zinc-300 font-medium">{language || 'code'}</span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 text-[12px] text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer"
        >
          {copied ? (
            <>
              <CheckIcon className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-emerald-400 font-sans font-medium">Copied!</span>
            </>
          ) : (
            <>
              <ClipboardDocumentIcon className="w-3.5 h-3.5" />
              <span className="font-sans font-medium">Copy</span>
            </>
          )}
        </button>
      </div>
      <pre className="p-4 overflow-x-auto text-[13.5px] font-mono leading-relaxed text-[#e6edf3] bg-[#0d1117] m-0">
        {highlightedHtml ? (
          <code
            className={`language-${language || 'text'}`}
            dangerouslySetInnerHTML={{ __html: highlightedHtml }}
          />
        ) : (
          <code>{value}</code>
        )}
      </pre>
    </div>
  );
};

export const AIChatMessage: React.FC<AIChatMessageProps> = ({
  message,
  onCopySnippet,
  copiedCodeId,
  onFollowUpClick,
  onFeedback,
  isLatest = false,
}) => {
  const [copied, setCopied] = useState(false);
  const [sourcesOpen, setSourcesOpen] = useState(false);
  const [phraseIndex, setPhraseIndex] = useState(() =>
    Math.floor(Math.random() * THINKING_PHRASES.length)
  );

  const isStreamingActive: boolean = !!message.isStreaming;
  const displayedText = message.text || '';

  useEffect(() => {
    if (!isStreamingActive) return;
    const interval = setInterval(() => {
      setPhraseIndex((prev) => {
        const step = Math.floor(Math.random() * (THINKING_PHRASES.length - 1)) + 1;
        return (prev + step) % THINKING_PHRASES.length;
      });
    }, 2400);
    return () => clearInterval(interval);
  }, [isStreamingActive]);

  const handleCopyMessage = () => {
    navigator.clipboard.writeText(message.text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const done = !isStreamingActive;

  const hasStartedResponding = Boolean(displayedText && displayedText.length > 0);
  const toolCalls = message.toolCalls || [];
  const hasToolCalls = toolCalls.length > 0;
  // Initial thinking: streaming, no text received yet, and no tool calls received yet
  const isInitialThinking = isStreamingActive && !hasStartedResponding && !hasToolCalls;

  return (
    <div className="flex flex-col max-w-3xl w-full text-zinc-200 animate-apple-fade group relative">
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
        @keyframes slotSwitch {
          0% {
            opacity: 0;
            transform: translateY(14px);
          }
          60% {
            opacity: 1;
            transform: translateY(-1px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .slot-switch {
          display: inline-flex;
          align-items: center;
          animation: slotSwitch 0.16s cubic-bezier(0.16, 1, 0.3, 1) both;
        }

        /* GitHub Dark Syntax Highlighting */
        .token.comment,
        .token.prolog,
        .token.doctype,
        .token.cdata {
          color: #8b949e;
          font-style: italic;
        }
        .token.punctuation {
          color: #c9d1d9;
        }
        .token.property,
        .token.tag,
        .token.boolean,
        .token.number,
        .token.constant,
        .token.symbol,
        .token.deleted {
          color: #79c0ff;
        }
        .token.selector,
        .token.attr-name,
        .token.string,
        .token.char,
        .token.builtin,
        .token.inserted {
          color: #a5d6ff;
        }
        .token.operator,
        .token.entity,
        .token.url,
        .language-css .token.string,
        .style .token.string {
          color: #79c0ff;
        }
        .token.atrule,
        .token.attr-value,
        .token.keyword {
          color: #ff7b72;
          font-weight: 500;
        }
        .token.function,
        .token.class-name {
          color: #d2a8ff;
        }
        .token.regex,
        .token.important,
        .token.variable {
          color: #ffa657;
        }
      `}</style>

      {/* 1. Initial Waiting / Thinking State (Dot grid + Shimmering text only in the very beginning) */}
      {isInitialThinking && (
        <div className="flex items-center gap-2.5 mb-3 min-h-[22px]">
          <div className="w-4 h-4 flex items-center justify-center shrink-0">
            <DriveWavefront />
          </div>
          {/* Ticker Switching Box */}
          <div className="h-5 overflow-hidden flex items-center relative">
            <div key={phraseIndex} className="slot-switch h-full items-center">
              <span className="text-shimmer-laser text-[13px] font-mono tracking-wide select-none">
                {THINKING_PHRASES[phraseIndex]}
              </span>
            </div>
          </div>
          {message.title && (
            <span className="text-xs text-zinc-500 font-normal truncate max-w-[200px]">
              • {message.title}
            </span>
          )}
        </div>
      )}

      {/* 2. Tool Calls Section */}
      {hasToolCalls && (
        <div className="mb-2">
          {/* When actively executing tools and AI hasn't started responding with text yet */}
          {!hasStartedResponding && isStreamingActive ? (
            <div className="space-y-1.5 mb-2">
              {toolCalls.map((tool) =>
                tool.status === 'calling' ? (
                  <div key={tool.toolCallId} className="flex items-center gap-2 min-h-[22px] animate-apple-fade">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#c0f200] animate-ping shrink-0" />
                    <span className="text-shimmer-laser text-[13px] font-mono tracking-wide select-none">
                      {tool.label}
                    </span>
                  </div>
                ) : (
                  <div
                    key={tool.toolCallId}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#16171d] border border-[#232530] rounded-lg text-xs font-mono text-zinc-300 mr-2 select-none animate-apple-fade"
                  >
                    {renderToolIcon(tool.toolName)}
                    <span>{tool.label}</span>
                  </div>
                )
              )}
            </div>
          ) : (
            /* Once AI starts responding or is done, render clean completed tool badges */
            <div className="flex flex-wrap gap-2 mb-2.5">
              {toolCalls.map((tool) => (
                <div
                  key={tool.toolCallId}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#16171d] border border-[#232530] rounded-lg text-xs font-mono text-zinc-300 select-none animate-apple-fade"
                >
                  {renderToolIcon(tool.toolName)}
                  <span>{tool.label}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 3. Static Title (When complete and title exists) */}
      {!isStreamingActive && message.title && (
        <div className="flex items-center gap-2 mb-2.5">
          <h3 className="text-base font-semibold text-zinc-100 tracking-tight">
            {message.title}
          </h3>
        </div>
      )}

      {/* Message Body (renders markdown live while streaming and once complete) */}
      <div className="text-[15px] sm:text-[15.5px] leading-[1.75] text-zinc-200">
        {displayedText ? (
          <div className="prose prose-invert prose-base max-w-none prose-code:before:content-none prose-code:after:content-none">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                pre({ children }) {
                  return <>{children}</>;
                },
                code({ inline, className, children, ...props }: any) {
                  const match = /language-(\w+)/.exec(className || '');
                  const codeText = String(children).replace(/\n$/, '');
                  if (!inline && (match || codeText.includes('\n'))) {
                    return (
                      <MarkdownCodeBlock
                        language={match ? match[1] : undefined}
                        value={codeText}
                      />
                    );
                  }
                  return (
                    <code
                      className="bg-[#161b22] text-[#e6edf3] border border-[#30363d] px-1.5 py-0.5 rounded-[5px] font-mono text-[13.5px] font-normal before:content-none after:content-none"
                      {...props}
                    >
                      {children}
                    </code>
                  );
                },
                strong({ children }) {
                  return <strong className="font-semibold text-zinc-100">{children}</strong>;
                },
                em({ children }) {
                  return <em className="italic text-zinc-200">{children}</em>;
                },
                h1({ children }) {
                  return <h1 className="text-xl font-bold text-zinc-100 mt-3.5 mb-2 first:mt-0">{children}</h1>;
                },
                h2({ children }) {
                  return <h2 className="text-lg font-bold text-zinc-100 mt-3 mb-1.5 first:mt-0">{children}</h2>;
                },
                h3({ children }) {
                  return <h3 className="text-base font-semibold text-zinc-100 mt-2.5 mb-1 first:mt-0">{children}</h3>;
                },
                hr() {
                  return <hr className="my-3 border-0 border-t border-white/[0.08]" />;
                },
                p({ children }) {
                  return <p className="mb-2.5 last:mb-0 leading-[1.75] text-[15px] sm:text-[15.5px] text-zinc-200">{children}</p>;
                },
                ul({ children }) {
                  return <ul className="list-disc list-outside pl-5 space-y-1.5 mb-2.5 text-[15px] sm:text-[15.5px] text-zinc-200">{children}</ul>;
                },
                ol({ children }) {
                  return <ol className="list-decimal list-outside pl-5 space-y-1.5 mb-2.5 text-[15px] sm:text-[15.5px] text-zinc-200">{children}</ol>;
                },
                li({ children }) {
                  return <li className="leading-[1.75] text-[15px] sm:text-[15.5px] text-zinc-200">{children}</li>;
                },
                table({ children }) {
                  return (
                    <div className="my-4 overflow-x-auto rounded-lg border border-[#30363d] bg-[#0d1117]">
                      <table className="w-full text-left text-[14px] border-collapse font-sans">
                        {children}
                      </table>
                    </div>
                  );
                },
                thead({ children }) {
                  return <thead className="bg-[#161b22] text-zinc-200 border-b border-[#30363d] font-semibold">{children}</thead>;
                },
                tbody({ children }) {
                  return <tbody className="divide-y divide-[#21262d]">{children}</tbody>;
                },
                tr({ children }) {
                  return <tr className="hover:bg-[#161b22]/50 transition-colors">{children}</tr>;
                },
                th({ children }) {
                  return <th className="px-4 py-2.5 font-medium text-zinc-100">{children}</th>;
                },
                td({ children }) {
                  return <td className="px-4 py-2.5 text-zinc-200">{children}</td>;
                },
                blockquote({ children }) {
                  return (
                    <blockquote className="my-3.5 pl-4 border-l-2 border-zinc-600 bg-[#161b22]/50 py-2 pr-3.5 rounded-r-md text-[14.5px] leading-relaxed text-zinc-300 italic">
                      {children}
                    </blockquote>
                  );
                },
                a({ href, children }) {
                  return (
                    <a
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#58a6ff] hover:underline underline-offset-2 font-medium"
                    >
                      {children}
                    </a>
                  );
                },
                input({ type, checked, ...props }: any) {
                  if (type === 'checkbox') {
                    return (
                      <input
                        type="checkbox"
                        checked={checked}
                        readOnly
                        className="mr-2.5 rounded border-[#30363d] bg-[#161b22] text-[#c0f200] accent-[#c0f200] focus:ring-0 cursor-default"
                        {...props}
                      />
                    );
                  }
                  return <input type={type} checked={checked} {...props} />;
                },
              }}
            >
              {displayedText}
            </ReactMarkdown>
          </div>
        ) : null}
        {isStreamingActive && displayedText.length > 0 && (
          <span
            className="mt-1 inline-block h-3.5 w-1 rounded-full bg-[#c0f200] animate-pulse"
          />
        )}

        {/* Inline Source Pill */}
        {done && message.sources && message.sources.length === 1 && (
          <span 
            className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-[#16171d] border border-[#232530] rounded-md text-[11px] font-medium text-[#c0f200] ml-2 align-middle"
            style={{ animation: 'pop-in 250ms cubic-bezier(0.23,1,0.32,1) both' }}
          >
            <DocumentTextIcon className="w-3 h-3 text-[#c0f200]" />
            {message.sources[0].name}
          </span>
        )}
      </div>

      {/* Code Snippet (Fades in when complete) */}
      {done && message.codeSnippet && (
        <div 
          className="mt-4 text-left"
          style={{ animation: 'fade-up 350ms cubic-bezier(0.23,1,0.32,1) both' }}
        >
          <div className="flex items-center justify-between text-[11px] font-mono text-zinc-400 bg-[#16171d] px-3 py-1.5 rounded-t-lg border-x border-t border-[#232530]">
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-3 h-3 text-[#c0f200]" />
              Code Recommendation
            </span>
            <button
              onClick={() => onCopySnippet(message.id, message.codeSnippet!)}
              className="hover:text-zinc-200 flex items-center gap-1 cursor-pointer whitespace-nowrap transition-colors"
            >
              <ClipboardDocumentIcon className="w-3.5 h-3.5 shrink-0" />
              <span>{copiedCodeId === message.id ? 'Copied!' : 'Copy'}</span>
            </button>
          </div>
          <pre className="p-3.5 bg-[#0d1117] border border-[#232530] rounded-b-lg font-mono text-xs text-zinc-200 overflow-x-auto leading-relaxed">
            {message.codeSnippet}
          </pre>
        </div>
      )}

      {/* Action Bar (Only shows when hovered or on the latest AI message, maintaining reserved height to prevent jitter) */}
      <div 
        className={`flex items-center gap-1 mt-1.5 min-h-[26px] text-zinc-500 transition-opacity duration-150 ${
          isLatest || sourcesOpen || message.thumbsFeedback
            ? 'opacity-100'
            : 'opacity-0 group-hover:opacity-100'
        }`}
        style={{ pointerEvents: done ? 'auto' : 'none' }}
      >
        {/* Copy Message Button */}
        <button 
          onClick={handleCopyMessage} 
          className="group/btn relative p-1.5 hover:bg-[#21262d] hover:text-zinc-300 rounded-md transition-colors cursor-pointer"
          aria-label="Copy message"
        >
          {copied ? <CheckIcon className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
          <span className="absolute -top-7 left-1/2 -translate-x-1/2 opacity-0 group-hover/btn:opacity-100 transition-opacity bg-[#16171d] border border-[#30363d] text-[10px] font-medium text-zinc-200 px-2 py-1 rounded-md whitespace-nowrap pointer-events-none shadow-md z-50">
            {copied ? 'Copied' : 'Copy'}
          </span>
        </button>

        {/* Thumbs Up (Like) Button */}
        <button
          onClick={() => {
            const targetId = message.dbMessageId || message.id;
            if (targetId && onFeedback) {
              const next = message.thumbsFeedback === 'postive' ? null : 'postive';
              onFeedback(targetId, next);
            }
          }}
          className={`group/btn relative p-1.5 rounded-md transition-colors cursor-pointer hover:bg-[#21262d] ${
            message.thumbsFeedback === 'postive'
              ? 'text-zinc-100 bg-[#21262d]'
              : 'text-zinc-500 hover:text-zinc-300'
          }`}
          aria-label="Good response"
        >
          <ThumbsUp 
            size={14} 
            weight={message.thumbsFeedback === 'postive' ? "fill" : "regular"} 
            className={message.thumbsFeedback === 'postive' ? "text-zinc-100" : "text-zinc-400 group-hover/btn:text-zinc-200 transition-colors"} 
          />
          <span className="absolute -top-7 left-1/2 -translate-x-1/2 opacity-0 group-hover/btn:opacity-100 transition-opacity bg-[#16171d] border border-[#30363d] text-[10px] font-medium text-zinc-200 px-2 py-1 rounded-md whitespace-nowrap pointer-events-none shadow-md z-50">
            Good response
          </span>
        </button>

        {/* Thumbs Down (Dislike) Button */}
        <button
          onClick={() => {
            const targetId = message.dbMessageId || message.id;
            if (targetId && onFeedback) {
              const next = message.thumbsFeedback === 'negitive' ? null : 'negitive';
              onFeedback(targetId, next);
            }
          }}
          className={`group/btn relative p-1.5 rounded-md transition-colors cursor-pointer hover:bg-[#21262d] ${
            message.thumbsFeedback === 'negitive'
              ? 'text-zinc-100 bg-[#21262d]'
              : 'text-zinc-500 hover:text-zinc-300'
          }`}
          aria-label="Bad response"
        >
          <ThumbsDown 
            size={14} 
            weight={message.thumbsFeedback === 'negitive' ? "fill" : "regular"} 
            className={message.thumbsFeedback === 'negitive' ? "text-zinc-100" : "text-zinc-400 group-hover/btn:text-zinc-200 transition-colors"} 
          />
          <span className="absolute -top-7 left-1/2 -translate-x-1/2 opacity-0 group-hover/btn:opacity-100 transition-opacity bg-[#16171d] border border-[#30363d] text-[10px] font-medium text-zinc-200 px-2 py-1 rounded-md whitespace-nowrap pointer-events-none shadow-md z-50">
            Bad response
          </span>
        </button>

        {/* Sources Stack */}
        {message.sources && message.sources.length > 1 && (
          <div 
            onClick={() => setSourcesOpen(!sourcesOpen)}
            className="flex items-center gap-2 ml-2 pl-3 border-l border-[#232530] cursor-pointer hover:opacity-80 transition-opacity"
          >
            <div className="flex -space-x-1.5">
              {message.sources.slice(0, 3).map((src, idx) => (
                <div key={idx} className={`w-5 h-5 rounded-full border border-[#0d1117] flex items-center justify-center text-[8px] font-bold shadow-sm ${
                  idx === 0 ? 'bg-emerald-500 text-black' : idx === 1 ? 'bg-blue-500 text-white' : 'bg-orange-500 text-white'
                }`}>
                  {src.name.substring(0, 1).toUpperCase()}
                </div>
              ))}
            </div>
            <span className="text-xs font-medium text-zinc-400">
              {message.sources.length} sources
            </span>
          </div>
        )}

        {/* Token Usage Badge */}
        {((message.inputTokens != null && message.inputTokens > 0) || (message.outputTokens != null && message.outputTokens > 0)) && (
          <div className="flex items-center gap-1.5 ml-auto text-[11px] font-mono text-zinc-500 bg-[#161b22] px-2 py-0.5 rounded border border-[#30363d]/60 select-none">
            {message.llmModel && (
              <span className="text-zinc-400 font-sans truncate max-w-[110px]" title={message.llmModel}>
                {message.llmModel.split('/').pop()}
              </span>
            )}
            {message.inputTokens != null && message.outputTokens != null && (
              <>
                <span className="text-zinc-600">•</span>
                <span title={`Prompt: ${message.inputTokens.toLocaleString()} | Completion: ${message.outputTokens.toLocaleString()}${message.reasoningTokens ? ` | Reasoning: ${message.reasoningTokens.toLocaleString()}` : ''}${message.cachedTokens ? ` | Cached: ${message.cachedTokens.toLocaleString()}` : ''}`}>
                  {(message.inputTokens + message.outputTokens).toLocaleString()} tok
                </span>
              </>
            )}
          </div>
        )}
      </div>

      {/* Expandable Sources Dropdown */}
      {done && sourcesOpen && message.sources && message.sources.length > 1 && (
        <div 
          className="mt-2 flex flex-col rounded-lg bg-[#16171d] border border-[#232530] p-1.5 shadow-xl animate-apple-scale"
        >
          {message.sources.map((source, idx) => (
            <div
              key={idx}
              className="flex items-center gap-2 px-2 py-1.5 text-xs text-zinc-300 hover:bg-[#21262d] rounded-md transition-colors"
            >
              <DocumentTextIcon className="w-3.5 h-3.5 text-zinc-500" />
              <span>{source.name}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
