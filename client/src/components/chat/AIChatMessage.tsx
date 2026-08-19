import React, { useState, useEffect, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { 
  ClipboardDocumentIcon,
  CheckIcon,
  ArrowPathIcon,
  HandThumbUpIcon,
  HandThumbDownIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';
import { Bot, Sparkles } from 'lucide-react';
import { DriveWavefront } from './DriveWavefront';

export interface MessageSource {
  id: string;
  name: string;
  icon?: React.ReactNode;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
  codeSnippet?: string;
  prContext?: string;
  isStreaming?: boolean;
  title?: string;
  sources?: MessageSource[];
  followUps?: string[];
}

interface AIChatMessageProps {
  message: ChatMessage;
  onCopySnippet: (id: string, code: string) => void;
  copiedCodeId: string | null;
  onFollowUpClick?: (text: string) => void;
}

export const AIChatMessage: React.FC<AIChatMessageProps> = ({
  message,
  onCopySnippet,
  copiedCodeId,
  onFollowUpClick,
}) => {
  const [copied, setCopied] = useState(false);
  const [sourcesOpen, setSourcesOpen] = useState(false);
  const words = useMemo(() => message.text.split(' '), [message.text]);
  const [displayedWordCount, setDisplayedWordCount] = useState<number>(() => message.isStreaming ? 0 : words.length);
  const [isStreamingActive, setIsStreamingActive] = useState<boolean>(() => !!message.isStreaming);

  useEffect(() => {
    if (!message.isStreaming) {
      setDisplayedWordCount(words.length);
      setIsStreamingActive(false);
      return;
    }

    setDisplayedWordCount(0);
    setIsStreamingActive(true);

    let currentIndex = 0;
    const interval = setInterval(() => {
      currentIndex++;
      setDisplayedWordCount(currentIndex);
      if (currentIndex >= words.length) {
        clearInterval(interval);
        setIsStreamingActive(false);
      }
    }, 45); // 45ms per word, matching the Advanced Components StreamingText speed

    return () => clearInterval(interval);
  }, [message.isStreaming, message.text, words.length]);

  const handleCopyMessage = () => {
    navigator.clipboard.writeText(message.text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const done = !isStreamingActive;

  return (
    <div className="flex flex-col max-w-3xl w-full text-zinc-200 animate-apple-fade group relative">
      {/* Header Area */}
      <div className="flex items-center gap-3 mb-3">
        {isStreamingActive ? (
          <div className="w-6 h-6 flex items-center justify-center shrink-0 rounded-full border border-transparent">
            <DriveWavefront />
          </div>
        ) : (
          <div className="w-6 h-6 rounded-md bg-[#16171d] border border-[#232530] flex items-center justify-center shrink-0 shadow-sm">
            <Bot className="w-3.5 h-3.5 text-[#c0f200]" />
          </div>
        )}
        {message.title && (
          <h3 className="text-sm font-semibold text-zinc-100 tracking-tight flex items-center gap-2">
            <span>{message.title}</span>
            {isStreamingActive && (
              <span className="text-[10px] font-mono font-medium px-1.5 py-0.5 rounded bg-[#c0f200]/10 text-[#c0f200] border border-[#c0f200]/30 animate-pulse">
                Streaming...
              </span>
            )}
          </h3>
        )}
      </div>

      {/* Message Body with Stream-In Blur-To-Focus Animation */}
      <div className="text-[14px] leading-relaxed text-zinc-200">
        {isStreamingActive ? (
          <div className="font-sans whitespace-pre-wrap">
            {words.slice(0, displayedWordCount).map((word, i) => (
              <span
                key={i}
                className="inline [will-change:filter,opacity]"
                style={{ animation: 'stream-in 420ms cubic-bezier(0.22,0.61,0.25,1) both' }}
              >
                {word}{' '}
              </span>
            ))}
            <span
              className="ml-0.5 inline-block h-3.5 w-1 translate-y-0.5 rounded-full bg-[#c0f200]"
              style={{ animation: 'fade-in 150ms ease-out both' }}
            />
          </div>
        ) : (
          <div className="prose prose-invert prose-sm max-w-none prose-p:leading-relaxed prose-pre:bg-[#0d1117] prose-pre:border prose-pre:border-[#232530]">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {message.text}
            </ReactMarkdown>
          </div>
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

      {/* Action Bar (Smoothly fades in once streaming finishes) */}
      <div 
        className="flex items-center gap-1 mt-4 text-zinc-500 transition-opacity duration-300"
        style={{ opacity: done ? 1 : 0, pointerEvents: done ? 'auto' : 'none' }}
      >
        <button 
          onClick={handleCopyMessage} 
          className="group/btn relative p-1.5 hover:bg-[#21262d] hover:text-zinc-300 rounded-md transition-colors cursor-pointer"
          title="Copy message"
        >
          {copied ? <CheckIcon className="w-4 h-4 text-emerald-400" /> : <ClipboardDocumentIcon className="w-4 h-4" />}
          <span className="absolute -top-7 left-1/2 -translate-x-1/2 opacity-0 group-hover/btn:opacity-100 transition-opacity bg-[#16171d] border border-[#30363d] text-[10px] font-medium text-zinc-200 px-2 py-1 rounded-md whitespace-nowrap pointer-events-none shadow-md z-50">
            {copied ? 'Copied' : 'Copy'}
          </span>
        </button>
        <button 
          className="group/btn relative p-1.5 hover:bg-[#21262d] hover:text-zinc-300 rounded-md transition-colors cursor-pointer"
          title="Regenerate response"
        >
          <ArrowPathIcon className="w-4 h-4" />
          <span className="absolute -top-7 left-1/2 -translate-x-1/2 opacity-0 group-hover/btn:opacity-100 transition-opacity bg-[#16171d] border border-[#30363d] text-[10px] font-medium text-zinc-200 px-2 py-1 rounded-md whitespace-nowrap pointer-events-none shadow-md z-50">
            Regenerate
          </span>
        </button>
        <button 
          className="group/btn relative p-1.5 hover:bg-[#21262d] hover:text-zinc-300 rounded-md transition-colors cursor-pointer"
          title="Good response"
        >
          <HandThumbUpIcon className="w-4 h-4" />
          <span className="absolute -top-7 left-1/2 -translate-x-1/2 opacity-0 group-hover/btn:opacity-100 transition-opacity bg-[#16171d] border border-[#30363d] text-[10px] font-medium text-zinc-200 px-2 py-1 rounded-md whitespace-nowrap pointer-events-none shadow-md z-50">
            Helpful
          </span>
        </button>
        <button 
          className="group/btn relative p-1.5 hover:bg-[#21262d] hover:text-zinc-300 rounded-md transition-colors cursor-pointer"
          title="Poor response"
        >
          <HandThumbDownIcon className="w-4 h-4" />
          <span className="absolute -top-7 left-1/2 -translate-x-1/2 opacity-0 group-hover/btn:opacity-100 transition-opacity bg-[#16171d] border border-[#30363d] text-[10px] font-medium text-zinc-200 px-2 py-1 rounded-md whitespace-nowrap pointer-events-none shadow-md z-50">
            Not helpful
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
