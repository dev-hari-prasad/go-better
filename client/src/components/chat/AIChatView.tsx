import React, { useState, useRef, useEffect } from 'react';
import {
  SparklesIcon,
  PaperAirplaneIcon,
  PlusIcon,
  ChatBubbleLeftRightIcon,
  CpuChipIcon,
  ShieldCheckIcon,
  ClipboardDocumentIcon,
  CommandLineIcon,
  ChevronDownIcon,
  ArrowPathIcon,
  LightBulbIcon,
} from '@heroicons/react/24/outline';
import { ArrowUp, Bot, ChevronDown, GitPullRequest, Settings, Bug, Plus, History, MessageSquare } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { PullRequest, Repository } from '../../types/codeReview';
import { Card, CardHeader, CardBody } from '../ui/Card';
import { Button } from '../ui/Button';
import { AIChatMessage, MessageSource } from './AIChatMessage';

interface AIChatViewProps {
  pullRequests: PullRequest[];
  repositories: Repository[];
  onSelectPR?: (pr: PullRequest) => void;
}

interface ChatMessage {
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

export const AIChatView: React.FC<AIChatViewProps> = ({
  pullRequests,
  repositories,
  onSelectPR,
}) => {
  const [selectedContext, setSelectedContext] = useState<string>('pr-141');
  const [selectedModel, setSelectedModel] = useState<string>('claude-3.5-sonnet');
  const [inputText, setInputText] = useState<string>('');
  const [copiedCodeId, setCopiedCodeId] = useState<string | null>(null);
  const [showModelMenu, setShowModelMenu] = useState(false);
  const [showPrMenu, setShowPrMenu] = useState(false);
  const [showHistoryMenu, setShowHistoryMenu] = useState(false);
  const [selectedPrChat, setSelectedPrChat] = useState<string | null>(null);
  const [activeChatTitle, setActiveChatTitle] = useState('New Session');

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [inputText]);

  useEffect(() => {
    const handleNewChat = () => {
      setChatHistory([]);
      setActiveChatTitle('New Session');
    };
    
    const handleStartChat = (e: any) => {
      const { message, prContext } = e.detail;
      setActiveChatTitle('New Session');
      
      const userMsg: ChatMessage = {
        id: `user-${Date.now()}`,
        sender: 'user',
        text: message,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        prContext: prContext || undefined,
      };
      
      setChatHistory([userMsg]);
      setIsAiThinking(true);
      
      setTimeout(() => {
        setIsAiThinking(false);
        const aiReply: ChatMessage = {
          id: `ai-${Date.now()}`,
          sender: 'ai',
          text: `Regarding your query about "${message}": I analyzed the repository structure and active branches. The AST type checking verifies 100% compliance with strict null checks, and no un-sanitized user inputs reach Prisma query parameters.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        setChatHistory((prev) => [...prev, aiReply]);
      }, 1200);
    };

    window.addEventListener('new-ai-chat', handleNewChat);
    window.addEventListener('start-ai-chat', handleStartChat);
    return () => {
      window.removeEventListener('new-ai-chat', handleNewChat);
      window.removeEventListener('start-ai-chat', handleStartChat);
    };
  }, []);

  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([
    {
      id: 'msg-1',
      sender: 'ai',
      text: 'Hello Alex! I am your CodeRabbit AI Assistant powered by Claude 3.5 Sonnet. I have indexed all your repositories and active pull requests. How can I assist your code reviews today?',
      timestamp: '10:42 AM',
    },
    {
      id: 'msg-2',
      sender: 'user',
      text: 'Can you summarize the potential security risks in PR #141 (Optimize Prisma query batching)?',
      timestamp: '10:43 AM',
      prContext: 'PR #141',
    },
    {
      id: 'msg-3',
      sender: 'ai',
      text: 'I conducted a static AST scan of PR #141 (`perf/prisma-batching → main`). Here is the security breakdown:\n\n1. **Timing Attack Vulnerability (Critical)** in `src/service/auth.ts`: Line 22 uses standard string comparison `!token || token.length < 16` which leaks execution duration.\n2. **Database Connection Pool Exhaustion**: Connection pool max limit is set to 20 without serverless timeout limits.',
      timestamp: '10:43 AM',
      codeSnippet: `// Suggested Security Fix for src/service/auth.ts\nimport { timingSafeEqual } from 'crypto';\n\nexport function verifyToken(a: string, b: string): boolean {\n  const bufA = Buffer.from(a);\n  const bufB = Buffer.from(b);\n  return bufA.length === bufB.length && timingSafeEqual(bufA, bufB);\n}`,
      title: 'Security Scan Completed',
      sources: [{ id: '1', name: 'src/service/auth.ts' }],
      followUps: ['Generate unit tests for verifyToken', 'How to configure serverless Prisma timeout?']
    },
  ]);

  const [isAiThinking, setIsAiThinking] = useState(false);

  const handleSendMessage = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim()) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: inputText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setChatHistory((prev) => [...prev, userMsg]);
    const queryText = inputText;
    setInputText('');
    setIsAiThinking(true);
    // Add a streaming dummy message
    const streamingId = `ai-${Date.now()}`;
    setChatHistory((prev) => [...prev, {
      id: streamingId,
      sender: 'ai',
      text: 'Analyzing repository context...',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isStreaming: true,
      title: 'Streaming Text'
    }]);

    setTimeout(() => {
      setIsAiThinking(false);
      setChatHistory((prev) => prev.map(m => m.id === streamingId ? {
        ...m,
        text: `Regarding your query about "${queryText}": I analyzed the repository structure and active branches. The AST type checking verifies 100% compliance with strict null checks, and no un-sanitized user inputs reach Prisma query parameters.`,
        isStreaming: false,
        title: 'Analysis Complete',
        codeSnippet: queryText.toLowerCase().includes('code') || queryText.toLowerCase().includes('fix')
          ? `// Automated Code Recommendation\nexport async function optimizedBatchQuery(ids: string[]) {\n  return prisma.user.findMany({\n    where: { id: { in: ids } },\n    select: { id: true, email: true, role: true }\n  });\n}`
          : undefined,
        sources: [{ id: '1', name: 'prisma/schema.prisma' }],
        followUps: ['Show me the Prisma schema', 'How do I test this batch query?']
      } : m));
    }, 1200);
  };

  const handleCopySnippet = (id: string, code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCodeId(id);
    setTimeout(() => setCopiedCodeId(null), 2000);
  };

  const promptSuggestions = [
    'Summarize security risks in PR #141',
    'How can I optimize Redis cache eviction?',
    'Check if authRouter.ts has timing attacks',
    'Generate unit tests for verifySessionToken()',
  ];

  return (
    <div className="flex h-full bg-[#0d1117] overflow-hidden animate-apple-fade">
      {/* Main Center AI Chat Area */}
      <div className="flex-1 flex flex-col h-full bg-[#0d1117] overflow-hidden">
        {/* Header Bar */}
        <div className="px-6 py-1.5 bg-[#111216] border-b border-[#232530] flex items-center justify-between shrink-0 font-sans relative">
          
          {/* Action Buttons (Left Side) */}
          <div className="flex items-center gap-2 w-1/3">
            <div className="relative flex items-center">
              <button
                onClick={() => setShowHistoryMenu(!showHistoryMenu)}
                className="p-1.5 bg-[#16171d] hover:bg-[#21262d] border border-[#232530] text-zinc-300 rounded-md transition-colors cursor-pointer"
                title="Chat History"
              >
                <History className="w-4 h-4" />
              </button>

              {/* Chat History Popover */}
              {showHistoryMenu && (
                <div className="absolute top-full left-0 mt-2 w-80 bg-[#161b22] border border-[#30363d] rounded-xl shadow-2xl p-2 z-50 animate-apple-fade">
                  <div className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 font-semibold px-2 pb-2 mb-1 border-b border-[#30363d]">
                    Previous Chats
                  </div>
                  <div className="space-y-1 max-h-[350px] overflow-y-auto">
                    <button onClick={() => setShowHistoryMenu(false)} className="w-full flex items-center gap-2 text-left px-2 py-2 text-xs text-zinc-300 hover:bg-[#21262d] rounded-lg transition-colors cursor-pointer group">
                      <MessageSquare className="w-3.5 h-3.5 text-zinc-500 group-hover:text-zinc-300" />
                      <span className="truncate">Prisma Query Batching Security</span>
                    </button>
                    <button onClick={() => setShowHistoryMenu(false)} className="w-full flex items-center gap-2 text-left px-2 py-2 text-xs text-zinc-300 hover:bg-[#21262d] rounded-lg transition-colors cursor-pointer group">
                      <MessageSquare className="w-3.5 h-3.5 text-zinc-500 group-hover:text-zinc-300" />
                      <span className="truncate">Next.js middleware debug</span>
                    </button>
                    <button onClick={() => setShowHistoryMenu(false)} className="w-full flex items-center gap-2 text-left px-2 py-2 text-xs text-zinc-300 hover:bg-[#21262d] rounded-lg transition-colors cursor-pointer group">
                      <MessageSquare className="w-3.5 h-3.5 text-zinc-500 group-hover:text-zinc-300" />
                      <span className="truncate">CodeRabbit config help</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
            
            <button
              onClick={() => {
                setChatHistory([]);
                setActiveChatTitle('New Session');
              }}
              className="p-1.5 bg-[#16171d] hover:bg-[#21262d] border border-[#232530] text-zinc-300 rounded-md transition-colors cursor-pointer"
              title="New Chat"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {/* Title (Center) */}
          <div className="flex items-center justify-center w-1/3">
            <h1 className="text-sm font-semibold text-zinc-300 truncate">
              {activeChatTitle}
            </h1>
          </div>
          
          {/* Empty Right Side for Balance */}
          <div className="w-1/3 flex justify-end">
          </div>
        </div>

        {/* Message Stream or Empty State */}
        <div className="flex-1 overflow-y-auto p-4 flex flex-col items-center w-full">
          {chatHistory.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-6 w-full max-w-2xl">
              <div className="w-16 h-16 rounded-3xl bg-[#16171d] border border-[#232530] flex items-center justify-center mb-5 shadow-sm">
                <Bot className="w-8 h-8 text-zinc-600" />
              </div>
              <h2 className="text-xl font-semibold text-zinc-200 tracking-tight mb-2">How can I help you today?</h2>
              <p className="text-[13px] text-zinc-500 max-w-xs mb-6">
                Ask Gobe AI to explain code, generate tests, or debug errors in your repositories.
              </p>
            </div>
          ) : (
            <div className="space-y-6 max-w-[800px] w-full mx-auto">
              {chatHistory.map((msg) => (
                <div key={msg.id}>
                  {msg.sender === 'user' ? (
                    <div className="flex items-start gap-3 flex-row-reverse">
                      <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-amber-500 to-rose-500 flex items-center justify-center text-[10px] font-bold text-black shrink-0">
                        AM
                      </div>
                      <div className="space-y-1.5 max-w-2xl text-right">
                        {msg.prContext && (
                          <div className="flex items-center justify-end">
                            <span className="px-1.5 py-0.5 bg-[#1a1b22] border border-[#232530] rounded text-[9px] font-mono text-zinc-500">
                              {msg.prContext}
                            </span>
                          </div>
                        )}
                        <div className="text-[14px] leading-relaxed whitespace-pre-wrap px-4 py-3 bg-[#21262d] text-zinc-200 rounded-2xl font-medium shadow-sm inline-block">
                          {msg.text}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <AIChatMessage 
                      message={msg} 
                      onCopySnippet={handleCopySnippet} 
                      copiedCodeId={copiedCodeId}
                      onFollowUpClick={(text) => setInputText(text)}
                    />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Input Bar Footer */}
        <div className="p-4 shrink-0 font-sans">
          {chatHistory.length === 0 && !inputText.trim() && (
            <div className="flex flex-row items-center justify-center gap-3 w-full max-w-[800px] mx-auto mb-3">
              <button onClick={() => setInputText('Summarize my active PRs')} className="flex items-center justify-center gap-2 px-4 py-3 bg-[#16171d] hover:bg-[#1a1b22] border border-[#232530] hover:border-zinc-500 rounded-xl text-xs text-zinc-300 transition-colors cursor-pointer flex-1 whitespace-nowrap">
                <GitPullRequest className="w-4 h-4 text-zinc-500 shrink-0" />
                <span className="truncate">Summarize my active PRs</span>
              </button>
              <button onClick={() => setInputText('Check for security vulnerabilities')} className="flex items-center justify-center gap-2 px-4 py-3 bg-[#16171d] hover:bg-[#1a1b22] border border-[#232530] hover:border-zinc-500 rounded-xl text-xs text-zinc-300 transition-colors cursor-pointer flex-1 whitespace-nowrap">
                <ShieldCheckIcon className="w-4 h-4 text-zinc-500 shrink-0" />
                <span className="truncate">Check for security vulnerabilities</span>
              </button>
              <button onClick={() => setInputText('Generate unit tests for this pull request')} className="flex items-center justify-center gap-2 px-4 py-3 bg-[#16171d] hover:bg-[#1a1b22] border border-[#232530] hover:border-zinc-500 rounded-xl text-xs text-zinc-300 transition-colors cursor-pointer flex-1 whitespace-nowrap">
                <LightBulbIcon className="w-4 h-4 text-zinc-500 shrink-0" />
                <span className="truncate">Generate unit tests for this pull request</span>
              </button>
            </div>
          )}
          <div className="w-full max-w-[800px] mx-auto bg-[#161b22] border border-[#30363d] rounded-[24px] p-1.5 flex items-end gap-2 focus-within:border-zinc-500 transition-colors shadow-sm relative">
            
            {/* Select PR Dropdown (Compact) on Left */}
            <div className="relative shrink-0">
              <button 
                onClick={() => setShowPrMenu(!showPrMenu)}
                title={selectedPrChat ? `Selected: ${selectedPrChat}` : 'Select PR'}
                className={`flex items-center justify-center w-8 h-8 transition-colors rounded-full border cursor-pointer ${
                  selectedPrChat 
                    ? 'bg-[#c0f200]/10 text-[#c0f200] border-[#c0f200]/30 hover:bg-[#c0f200]/20' 
                    : 'bg-[#21262d] text-zinc-400 hover:text-zinc-200 border-transparent'
                }`}
              >
                <GitPullRequest className="w-4 h-4" />
              </button>

              {showPrMenu && (
                <div className="absolute bottom-full left-0 mb-3 w-48 bg-[#161b22] border border-[#30363d] rounded-xl shadow-xl p-1 z-10 animate-apple-fade">
                  <button onClick={() => { setSelectedPrChat('PR #12'); setShowPrMenu(false); }} className="w-full text-left px-3 py-2 text-xs text-zinc-300 hover:bg-[#21262d] rounded-lg transition-colors cursor-pointer">PR #12</button>
                  <button onClick={() => { setSelectedPrChat('PR #141'); setShowPrMenu(false); }} className="w-full text-left px-3 py-2 text-xs text-zinc-300 hover:bg-[#21262d] rounded-lg transition-colors cursor-pointer">PR #141</button>
                  <button onClick={() => { setSelectedPrChat(null); setShowPrMenu(false); }} className="w-full text-left px-3 py-2 text-xs text-zinc-500 hover:bg-[#21262d] rounded-lg transition-colors cursor-pointer mt-1 border-t border-[#30363d] pt-2">Clear Selection</button>
                </div>
              )}
            </div>
            
            <textarea
              ref={textareaRef}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              rows={1}
              placeholder="Ask anything..."
              className="flex-1 bg-transparent text-zinc-200 placeholder:text-zinc-500 resize-none outline-none max-h-[200px] text-[14px] font-sans py-1 leading-relaxed overflow-x-hidden overflow-y-auto mb-[1px]"
            />
            
            <div className="flex items-center gap-2 shrink-0">

              {/* Model Select */}
              <button 
                onClick={() => setShowModelMenu(!showModelMenu)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-[11px] font-medium text-zinc-400 hover:text-zinc-200 hover:bg-[#21262d] transition-colors cursor-pointer"
              >
                <Bot className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">GPT-4o</span>
                <ChevronDown className="w-3 h-3" />
              </button>

              {showModelMenu && (
                <div className="absolute bottom-full right-10 mb-3 w-48 bg-[#161b22] border border-[#30363d] rounded-xl shadow-xl p-1 z-10 animate-apple-fade">
                  <button onClick={() => setShowModelMenu(false)} className="w-full text-left px-3 py-2 text-xs text-zinc-300 hover:bg-[#21262d] rounded-lg transition-colors cursor-pointer">GPT-4o</button>
                  <button onClick={() => setShowModelMenu(false)} className="w-full text-left px-3 py-2 text-xs text-zinc-300 hover:bg-[#21262d] rounded-lg transition-colors cursor-pointer">Claude 3.5 Sonnet</button>
                </div>
              )}

              <button 
                onClick={handleSendMessage}
                className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors shrink-0 shadow-sm border cursor-pointer ${inputText.trim() ? 'bg-[#c0f200] text-black border-[#c0f200]' : 'bg-[#21262d] hover:bg-[#30363d] text-zinc-400 border-transparent'}`}
              >
                <ArrowUp className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
