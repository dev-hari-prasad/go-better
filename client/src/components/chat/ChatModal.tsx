import React, { useState, useRef, useEffect } from 'react';
import { 
  XMarkIcon, 
  ArrowsPointingOutIcon,
  MinusIcon,
  Square2StackIcon,
  PlusIcon,
  ChevronDownIcon,
  LightBulbIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline';
import { Bot, ArrowUp, ChevronDown, GitPullRequest, History, Plus } from 'lucide-react';
import { AIChatMessage, ChatMessage } from './AIChatMessage';
import { SparklesIcon } from '@heroicons/react/24/outline';

interface ChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  onMaximize?: () => void;
}

export const ChatModal: React.FC<ChatModalProps> = ({ isOpen, onClose, onMaximize }) => {
  const [shouldRender, setShouldRender] = useState(isOpen);
  const [isClosing, setIsClosing] = useState(false);
  const [input, setInput] = useState('');
  const [showModelMenu, setShowModelMenu] = useState(false);
  const [showPrMenu, setShowPrMenu] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [selectedPrChat, setSelectedPrChat] = useState<string | null>(null);
  
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [copiedCodeId, setCopiedCodeId] = useState<string | null>(null);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
    }, 300);
  };

  const handleMaximize = () => {
    setIsClosing(true);
    setTimeout(() => {
      onMaximize?.();
    }, 300);
  };

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleCopySnippet = (id: string, code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCodeId(id);
    setTimeout(() => setCopiedCodeId(null), 2000);
  };

  const handleSendMessage = () => {
    if (!input.trim()) return;
    
    const queryText = input;
    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: queryText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      prContext: selectedPrChat || undefined
    };

    setChatHistory(prev => [...prev, userMsg]);
    setInput('');
    setIsAiThinking(true);

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
        text: `Regarding your query about "${queryText}": I analyzed the repository structure and active branches. The AST type checking verifies 100% compliance with strict null checks.`,
        isStreaming: false,
        title: 'Analysis Complete',
        codeSnippet: queryText.toLowerCase().includes('code') || queryText.toLowerCase().includes('fix')
          ? `// Automated Code Recommendation\nexport function verifyToken(a: string, b: string): boolean {\n  return a === b;\n}`
          : undefined,
        sources: [{ id: '1', name: 'src/utils.ts' }],
        followUps: ['Generate tests for this', 'Check for memory leaks']
      } : m));
    }, 1200);
  };

  useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
      setIsClosing(false);
    } else if (shouldRender) {
      setIsClosing(true);
      const timer = setTimeout(() => {
        setShouldRender(false);
        setIsClosing(false);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen, shouldRender]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [input]);

  if (!shouldRender) return null;

  return (
    <div className={`fixed inset-0 z-50 flex items-start justify-end p-4 pt-16 ${isClosing ? 'opacity-0 transition-opacity duration-300' : ''}`} onClick={onClose}>
      <div 
        className={`relative flex flex-col bg-[#0d1117] border border-[#232530] rounded-2xl shadow-2xl w-full max-w-[440px] h-[calc(100vh-5rem)] overflow-hidden ${isClosing ? 'animate-apple-scale-out' : 'animate-apple-scale'}`}
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-transparent shrink-0 relative z-20">
          <div className="flex items-center gap-4 text-zinc-500">
            <button 
              onClick={() => setChatHistory([])} 
              className="hover:text-zinc-200 transition-colors flex items-center justify-center h-5 w-5" 
              title="New Chat"
            >
              <Plus className="w-4 h-4" />
            </button>
            <div className="relative flex items-center">
              <button 
                onClick={() => setShowHistory(!showHistory)} 
                className="hover:text-zinc-200 transition-colors flex items-center justify-center h-5 w-5" 
                title="Recent Chats"
              >
                <History className="w-4 h-4" />
              </button>
              {showHistory && (
                <div className="absolute top-full left-0 mt-2 w-48 bg-[#161b22] border border-[#30363d] rounded-xl shadow-xl p-1.5 z-10 animate-apple-fade">
                  <div className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider px-2 py-1 mb-1">Recent Chats</div>
                  <button onClick={() => setShowHistory(false)} className="w-full text-left px-2 py-1.5 text-xs text-zinc-300 hover:bg-[#21262d] rounded-lg transition-colors truncate">Fix race condition in queue...</button>
                  <button onClick={() => setShowHistory(false)} className="w-full text-left px-2 py-1.5 text-xs text-zinc-300 hover:bg-[#21262d] rounded-lg transition-colors truncate">Prisma performance issues</button>
                  <button onClick={() => setShowHistory(false)} className="w-full text-left px-2 py-1.5 text-xs text-zinc-300 hover:bg-[#21262d] rounded-lg transition-colors truncate">Generate auth tests</button>
                </div>
              )}
            </div>
          </div>
          
          <div className="text-xs font-semibold text-zinc-300 select-none">
            New Chat
          </div>
          
          <div className="flex items-center gap-4 text-zinc-500">
            <button onClick={handleMaximize} className="hover:text-zinc-200 transition-colors cursor-pointer">
              <ArrowsPointingOutIcon className="w-4 h-4" />
            </button>
            <button onClick={handleClose} className="hover:text-zinc-200 transition-colors cursor-pointer">
              <MinusIcon className="w-4 h-4" />
            </button>
            <button onClick={handleClose} className="hover:text-zinc-200 transition-colors cursor-pointer">
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Chat Body */}
        <div className="flex-1 overflow-y-auto p-4 px-6 flex flex-col">
          {chatHistory.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 rounded-3xl bg-[#16171d] border border-[#232530] flex items-center justify-center mb-5 shadow-sm">
                <Bot className="w-8 h-8 text-zinc-600" />
              </div>
              <h2 className="text-xl font-semibold text-zinc-200 tracking-tight mb-2">How can I help you today?</h2>
              <p className="text-[13px] text-zinc-500 max-w-xs mb-6">
                Ask Gobe AI to explain code, generate tests, or debug errors in your repositories.
              </p>
              <div className="flex flex-col gap-2 w-full max-w-[280px]">
                <button onClick={() => setInput('Summarize my active PRs')} className="flex items-center gap-2 px-3.5 py-2.5 bg-[#16171d] hover:bg-[#1a1b22] border border-[#232530] hover:border-zinc-500 rounded-xl text-xs text-zinc-300 transition-colors text-left cursor-pointer">
                  <GitPullRequest className="w-4 h-4 text-zinc-500 shrink-0" />
                  Summarize my active PRs
                </button>
                <button onClick={() => setInput('Check for security vulnerabilities')} className="flex items-center gap-2 px-3.5 py-2.5 bg-[#16171d] hover:bg-[#1a1b22] border border-[#232530] hover:border-zinc-500 rounded-xl text-xs text-zinc-300 transition-colors text-left cursor-pointer">
                  <ShieldCheckIcon className="w-4 h-4 text-zinc-500 shrink-0" />
                  Check for security vulnerabilities
                </button>
                <button onClick={() => setInput('Generate unit tests for this pull request')} className="flex items-center gap-2 px-3.5 py-2.5 bg-[#16171d] hover:bg-[#1a1b22] border border-[#232530] hover:border-zinc-500 rounded-xl text-xs text-zinc-300 transition-colors text-left cursor-pointer">
                  <LightBulbIcon className="w-4 h-4 text-zinc-500 shrink-0" />
                  Generate unit tests for this pull request
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-6 w-full pb-4">
              {chatHistory.map((msg) => (
                <div key={msg.id}>
                  {msg.sender === 'user' ? (
                    <div className="flex items-start gap-3 flex-row-reverse">
                      <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-amber-500 to-rose-500 flex items-center justify-center text-[10px] font-bold text-black shrink-0">
                        AM
                      </div>
                      <div className="space-y-1.5 max-w-[85%] text-right">
                        {msg.prContext && (
                          <div className="flex items-center justify-end">
                            <span className="px-1.5 py-0.5 bg-[#1a1b22] border border-[#232530] rounded text-[9px] font-mono text-zinc-500">
                              {msg.prContext}
                            </span>
                          </div>
                        )}
                        <div className="text-[14px] leading-relaxed whitespace-pre-wrap px-4 py-2.5 bg-[#21262d] text-zinc-200 rounded-2xl font-medium shadow-sm inline-block">
                          {msg.text}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <AIChatMessage 
                      message={msg} 
                      onCopySnippet={handleCopySnippet} 
                      copiedCodeId={copiedCodeId}
                      onFollowUpClick={(text) => setInput(text)}
                    />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="p-4 pt-0 shrink-0">
          <div className="bg-[#161b22] border border-[#30363d] rounded-[24px] p-1.5 flex items-end gap-2 focus-within:border-zinc-500 transition-colors shadow-sm relative">
            
            <div className="relative shrink-0">
              <button 
                onClick={() => setShowPrMenu(!showPrMenu)}
                title={selectedPrChat ? `Selected: ${selectedPrChat}` : 'Select PR'}
                className={`flex items-center justify-center w-7 h-7 transition-colors rounded-full border cursor-pointer ${
                  selectedPrChat 
                    ? 'bg-[#c0f200]/10 text-[#c0f200] border-[#c0f200]/30 hover:bg-[#c0f200]/20' 
                    : 'bg-[#21262d] text-zinc-400 hover:text-zinc-200 border-transparent'
                }`}
              >
                <GitPullRequest className="w-3.5 h-3.5" />
              </button>

              {showPrMenu && (
                <div className="absolute bottom-full left-0 mb-2 w-48 bg-[#161b22] border border-[#30363d] rounded-xl shadow-xl p-1 z-10 animate-apple-fade">
                  <button onClick={() => { setSelectedPrChat('PR #12'); setShowPrMenu(false); }} className="w-full text-left px-3 py-1.5 text-xs text-zinc-300 hover:bg-[#21262d] rounded-md transition-colors cursor-pointer">PR #12</button>
                  <button onClick={() => { setSelectedPrChat('PR #141'); setShowPrMenu(false); }} className="w-full text-left px-3 py-1.5 text-xs text-zinc-300 hover:bg-[#21262d] rounded-md transition-colors cursor-pointer">PR #141</button>
                  <button onClick={() => { setSelectedPrChat(null); setShowPrMenu(false); }} className="w-full text-left px-3 py-1.5 text-xs text-zinc-500 hover:bg-[#21262d] rounded-md transition-colors cursor-pointer mt-1 border-t border-[#30363d] pt-1">Clear Selection</button>
                </div>
              )}
            </div>
            
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              rows={1}
              placeholder="Ask anything..."
              className="flex-1 bg-transparent text-zinc-200 placeholder:text-zinc-500 resize-none outline-none max-h-[150px] text-[13px] font-sans py-1 leading-relaxed overflow-x-hidden overflow-y-auto mb-[1px]"
            />
            
            <div className="flex items-center gap-1.5 shrink-0 mb-0.5">

              <button 
                onClick={() => setShowModelMenu(!showModelMenu)}
                className="flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-medium text-zinc-400 hover:text-zinc-200 hover:bg-[#21262d] transition-colors cursor-pointer"
              >
                <Bot className="w-3 h-3" />
                <span>GPT-4o</span>
                <ChevronDown className="w-3 h-3" />
              </button>
              
              {showModelMenu && (
                <div className="absolute bottom-full right-8 mb-2 w-48 bg-[#161b22] border border-[#30363d] rounded-xl shadow-xl p-1 z-10 animate-apple-fade">
                  <button onClick={() => setShowModelMenu(false)} className="w-full text-left px-3 py-1.5 text-xs text-zinc-300 hover:bg-[#21262d] rounded-md transition-colors cursor-pointer">GPT-4o</button>
                  <button onClick={() => setShowModelMenu(false)} className="w-full text-left px-3 py-1.5 text-xs text-zinc-300 hover:bg-[#21262d] rounded-md transition-colors cursor-pointer">Claude 3.5 Sonnet</button>
                </div>
              )}

              <button onClick={handleSendMessage} className={`w-6 h-6 rounded-full flex items-center justify-center transition-colors shrink-0 shadow-sm border cursor-pointer ${input.trim() ? 'bg-[#c0f200] text-black border-[#c0f200]' : 'bg-[#21262d] hover:bg-[#30363d] text-zinc-400 border-transparent'}`}>
                <ArrowUp className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
