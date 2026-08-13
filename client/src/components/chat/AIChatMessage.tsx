import React, { useState } from 'react';
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
import { Bot } from 'lucide-react';
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

  const handleCopyMessage = () => {
    navigator.clipboard.writeText(message.text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col max-w-3xl w-full text-zinc-200 animate-apple-fade group relative">
      {/* Header Area */}
      <div className="flex items-center gap-3 mb-3">
        {message.isStreaming ? (
          <div className="w-6 h-6 flex items-center justify-center shrink-0 rounded-full border border-transparent">
            <DriveWavefront />
          </div>
        ) : (
          <div className="w-6 h-6 rounded-md bg-[#16171d] border border-[#232530] flex items-center justify-center shrink-0">
            <Bot className="w-3.5 h-3.5 text-zinc-300" />
          </div>
        )}
        {message.title && (
          <h3 className="text-base font-semibold text-zinc-100 tracking-tight">
            {message.title}
          </h3>
        )}
      </div>

      {/* Message Body */}
      <div className="prose prose-invert prose-sm max-w-none prose-p:leading-relaxed prose-pre:bg-[#0d1117] prose-pre:border prose-pre:border-[#232530] text-[14.5px]">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>
          {message.text}
        </ReactMarkdown>

        {/* Inline Source Example if single source. The screenshot shows inline chip: `[icon] scoopdata.io` */}
        {message.sources && message.sources.length === 1 && (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-[#16171d] border border-[#232530] rounded-md text-[11px] font-medium text-emerald-400 ml-2 align-middle">
            <DocumentTextIcon className="w-3 h-3" />
            {message.sources[0].name}
          </span>
        )}
      </div>

      {/* Code Snippet */}
      {message.codeSnippet && (
        <div className="mt-4 text-left">
          <div className="flex items-center justify-between text-[11px] font-mono text-zinc-400 bg-[#16171d] px-3 py-1.5 rounded-t-lg border-x border-t border-[#232530]">
            <span>Code Suggestion</span>
            <button
              onClick={() => onCopySnippet(message.id, message.codeSnippet!)}
              className="hover:text-zinc-200 flex items-center gap-1 cursor-pointer whitespace-nowrap"
            >
              <ClipboardDocumentIcon className="w-3.5 h-3.5 shrink-0" />
              <span>{copiedCodeId === message.id ? 'Copied!' : 'Copy'}</span>
            </button>
          </div>
          <pre className="p-3 bg-[#0d1117] border border-[#232530] rounded-b-lg font-mono text-xs text-zinc-200 overflow-x-auto leading-relaxed">
            {message.codeSnippet}
          </pre>
        </div>
      )}

      {/* Action Bar */}
      <div className="flex items-center gap-0.5 mt-4 text-zinc-500 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
        <button onClick={handleCopyMessage} className="group/btn relative p-1.5 hover:bg-[#21262d] hover:text-zinc-300 rounded-md transition-colors cursor-pointer">
          {copied ? <CheckIcon className="w-4 h-4 text-emerald-400" /> : <ClipboardDocumentIcon className="w-4 h-4" />}
          <span className="absolute -top-7 left-1/2 -translate-x-1/2 opacity-0 group-hover/btn:opacity-100 transition-opacity bg-[#16171d] border border-[#30363d] text-[10px] font-medium text-zinc-200 px-2 py-1 rounded-md whitespace-nowrap pointer-events-none shadow-md z-50">
            {copied ? 'Copied' : 'Copy'}
          </span>
        </button>
        <button className="group/btn relative p-1.5 hover:bg-[#21262d] hover:text-zinc-300 rounded-md transition-colors cursor-pointer">
          <ArrowPathIcon className="w-4 h-4" />
          <span className="absolute -top-7 left-1/2 -translate-x-1/2 opacity-0 group-hover/btn:opacity-100 transition-opacity bg-[#16171d] border border-[#30363d] text-[10px] font-medium text-zinc-200 px-2 py-1 rounded-md whitespace-nowrap pointer-events-none shadow-md z-50">
            Regenerate
          </span>
        </button>
        <button className="group/btn relative p-1.5 hover:bg-[#21262d] hover:text-zinc-300 rounded-md transition-colors cursor-pointer">
          <HandThumbUpIcon className="w-4 h-4" />
          <span className="absolute -top-7 left-1/2 -translate-x-1/2 opacity-0 group-hover/btn:opacity-100 transition-opacity bg-[#16171d] border border-[#30363d] text-[10px] font-medium text-zinc-200 px-2 py-1 rounded-md whitespace-nowrap pointer-events-none shadow-md z-50">
            Helpful
          </span>
        </button>
        <button className="group/btn relative p-1.5 hover:bg-[#21262d] hover:text-zinc-300 rounded-md transition-colors cursor-pointer">
          <HandThumbDownIcon className="w-4 h-4" />
          <span className="absolute -top-7 left-1/2 -translate-x-1/2 opacity-0 group-hover/btn:opacity-100 transition-opacity bg-[#16171d] border border-[#30363d] text-[10px] font-medium text-zinc-200 px-2 py-1 rounded-md whitespace-nowrap pointer-events-none shadow-md z-50">
            Not helpful
          </span>
        </button>

        {/* Sources Stack */}
        {message.sources && message.sources.length > 1 && (
          <div className="flex items-center gap-2 ml-2 pl-3 border-l border-[#232530] cursor-pointer hover:opacity-80 transition-opacity">
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

      {/* Follow-ups Hidden As Requested */}
    </div>
  );
};
