import React, { useState, useRef, useEffect } from 'react';
import { ShieldCheckIcon, LightBulbIcon } from '@heroicons/react/24/outline';
import {
  MessageSquare,
  ChevronDown,
  Send,
  Bot,
  CircleDashed,
  GitPullRequest,
  GitBranch,
  XCircle,
  Cloud,
  Check,
  ChevronRight,
  ListFilter,
  Settings,
  Bug,
  ArrowUp,
  BrainCircuit
} from 'lucide-react';
import { PullRequest, Repository, AIFinding } from '../../types/codeReview';

interface OverviewDashboardProps {
  repositories: Repository[];
  pullRequests: PullRequest[];
  findings: AIFinding[];
  activities: any[];
  onSelectPR: (pr: PullRequest) => void;
  onNavigateToTab: (tab: any) => void;
}

export const OverviewDashboard: React.FC<OverviewDashboardProps> = ({
  pullRequests,
  findings,
  onSelectPR,
  onNavigateToTab,
}) => {
  const [showAllFindings, setShowAllFindings] = useState(false);
  const [showAllPRs, setShowAllPRs] = useState(false);
  const [showModelMenu, setShowModelMenu] = useState(false);
  const [showPrMenu, setShowPrMenu] = useState(false);
  const [selectedPrChat, setSelectedPrChat] = useState<string | null>(null);
  const [chatInput, setChatInput] = useState('');

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSendMessage = () => {
    if (chatInput.trim()) {
      window.dispatchEvent(new CustomEvent('start-ai-chat', { detail: { message: chatInput, prContext: selectedPrChat } }));
      onNavigateToTab('ai-chat');
    }
  };

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [chatInput]);

  const displayedFindings = showAllFindings ? findings : findings.slice(0, 4);
  const displayedPRs = showAllPRs ? pullRequests : pullRequests.slice(0, 4);
  const oldPRs = pullRequests.slice().reverse().slice(0, 2); // mock old PRs from existing data

  return (
    <div className="flex-1 overflow-y-auto bg-[#0d1117] min-h-full">
      <div className="max-w-[1000px] mx-auto pt-14 px-8 pb-8 animate-apple-fade">
        {/* Header Section */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BrainCircuit className="w-6 h-6 text-zinc-300" />
            <h1 className="text-2xl font-semibold text-zinc-100 tracking-tight">Good afternoon, dev-hari-prasad!</h1>
          </div>
        </div>

        {/* Input Box Area */}
        <div className="bg-[#161b22] border border-[#30363d] rounded-[24px] p-2 mb-2 flex items-end gap-2 focus-within:border-zinc-500 transition-colors shadow-sm relative w-full mx-auto">
          
          {/* Select PR Dropdown (Compact) on Left */}
          <div className="relative shrink-0">
            <button 
              onClick={() => setShowPrMenu(!showPrMenu)}
              title={selectedPrChat ? `Selected: ${selectedPrChat}` : 'Select PR'}
              className={`flex items-center justify-center w-9 h-9 transition-colors rounded-full border cursor-pointer ${
                selectedPrChat 
                  ? 'bg-[#c0f200]/10 text-[#c0f200] border-[#c0f200]/30 hover:bg-[#c0f200]/20' 
                  : 'bg-[#21262d] text-zinc-400 hover:text-zinc-200 border-transparent'
              }`}
            >
              <GitPullRequest className="w-4.5 h-4.5" />
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
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            rows={1}
            placeholder="Ask anything..."
            className="flex-1 bg-transparent text-zinc-200 placeholder:text-zinc-500 resize-none outline-none max-h-[200px] text-[15px] font-sans py-1.5 leading-relaxed overflow-x-hidden overflow-y-auto mb-[2px]"
          />
          
          <div className="flex items-center gap-2 shrink-0">
            <button 
              onClick={() => setShowModelMenu(!showModelMenu)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-medium text-zinc-400 hover:text-zinc-200 hover:bg-[#21262d] transition-colors cursor-pointer"
            >
              <Bot className="w-4 h-4" />
              <span className="hidden sm:inline">GPT-4o</span>
              <ChevronDown className="w-3.5 h-3.5" />
            </button>
            
            {showModelMenu && (
              <div className="absolute top-full right-10 mt-2 w-48 bg-[#161b22] border border-[#30363d] rounded-xl shadow-xl p-1 z-10 animate-apple-fade">
                <button onClick={() => setShowModelMenu(false)} className="w-full text-left px-3 py-2 text-xs text-zinc-300 hover:bg-[#21262d] rounded-lg transition-colors cursor-pointer">GPT-4o</button>
                <button onClick={() => setShowModelMenu(false)} className="w-full text-left px-3 py-2 text-xs text-zinc-300 hover:bg-[#21262d] rounded-lg transition-colors cursor-pointer">Claude 3.5 Sonnet</button>
              </div>
            )}

            <button onClick={handleSendMessage} className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors shrink-0 shadow-sm border cursor-pointer ${chatInput.trim() ? 'bg-[#c0f200] text-black border-[#c0f200]' : 'bg-[#21262d] hover:bg-[#30363d] text-zinc-400 border-transparent'}`}>
              <ArrowUp className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Suggestion Buttons */}
        <div className="flex flex-row items-center justify-center gap-3 w-full mx-auto mb-10">
          <button onClick={() => setChatInput('Summarize my active PRs')} className="flex items-center justify-center gap-2 px-6 py-3 bg-[#16171d] hover:bg-[#1a1b22] border border-[#232530] hover:border-zinc-500 rounded-xl text-xs text-zinc-300 transition-colors cursor-pointer">
            <GitPullRequest className="w-4 h-4 text-zinc-500 shrink-0" />
            <span className="truncate">Summarize my active PRs</span>
          </button>
          <button onClick={() => setChatInput('Check for security vulnerabilities')} className="flex items-center justify-center gap-2 px-6 py-3 bg-[#16171d] hover:bg-[#1a1b22] border border-[#232530] hover:border-zinc-500 rounded-xl text-xs text-zinc-300 transition-colors cursor-pointer">
            <ShieldCheckIcon className="w-4 h-4 text-zinc-500 shrink-0" />
            <span className="truncate">Check for security vulnerabilities</span>
          </button>
          <button onClick={() => setChatInput('Generate unit tests for this pull request')} className="flex items-center justify-center gap-2 px-6 py-3 bg-[#16171d] hover:bg-[#1a1b22] border border-[#232530] hover:border-zinc-500 rounded-xl text-xs text-zinc-300 transition-colors cursor-pointer">
            <LightBulbIcon className="w-4 h-4 text-zinc-500 shrink-0" />
            <span className="truncate">Generate unit tests for this pull request</span>
          </button>
        </div>

        {/* Separator */}
        <hr className="border-t border-[#30363d] opacity-40 w-full mb-5" />

        <div className="space-y-8">
          {/* Active reviews */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-[13px] font-semibold text-zinc-400">Active Code Reviews</h2>
              {!showAllFindings && findings.length > 4 && (
                <button 
                  onClick={() => setShowAllFindings(true)} 
                  className="text-xs text-[#4493f8] hover:text-[#58a6ff] transition-colors font-medium cursor-pointer"
                >
                  View all
                </button>
              )}
            </div>
            <div className="border border-[#30363d] rounded-xl overflow-hidden bg-transparent">
              {displayedFindings.map((finding, idx) => (
                <div key={finding.id} className={`p-4 flex items-start gap-3 hover:bg-[#161b22] cursor-pointer transition-colors ${idx !== displayedFindings.length - 1 ? 'border-b border-[#30363d]' : ''}`}>
                  {finding.severity === 'critical' ? (
                    <XCircle className="w-4 h-4 mt-0.5 text-[#f85149] shrink-0" />
                  ) : finding.severity === 'warning' ? (
                    <GitBranch className="w-4 h-4 mt-0.5 text-[#a371f7] shrink-0" />
                  ) : (
                    <Check className="w-4 h-4 mt-0.5 text-[#3fb950] shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-[15px] font-semibold text-[#e6edf3] mb-1 leading-tight">{finding.title}</h3>
                    <p className="text-xs text-[#7d8590] truncate">
                      dev-hari-prasad/{finding.filename} • {finding.status === 'open' ? 'Started on May 30 • Timed out' : 'Completed 15 hours ago • Merged'}
                    </p>
                  </div>
                  <div className="flex items-center gap-4 text-xs font-mono shrink-0">
                    {finding.severity === 'warning' && (
                      <span className="flex items-center gap-1.5 text-[11px]">
                        <span className="text-[#3fb950]">+10,313</span>
                        <span className="text-[#f85149]">-529</span>
                      </span>
                    )}
                    <ChevronRight className="w-4 h-4 text-[#7d8590]" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Latest pull requests */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-[13px] font-semibold text-zinc-400">Latest pull requests</h2>
              {!showAllPRs && pullRequests.length > 4 && (
                <button 
                  onClick={() => setShowAllPRs(true)} 
                  className="text-xs text-[#4493f8] hover:text-[#58a6ff] transition-colors font-medium cursor-pointer"
                >
                  View all
                </button>
              )}
            </div>
            <div className="border border-[#30363d] rounded-xl overflow-hidden bg-transparent">
              {displayedPRs.map((pr, idx) => (
                <div 
                  key={pr.id} 
                  onClick={() => {
                    onSelectPR(pr);
                    onNavigateToTab('reviews');
                  }}
                  className={`p-4 flex items-start gap-3 hover:bg-[#161b22] cursor-pointer transition-colors ${idx !== displayedPRs.length - 1 ? 'border-b border-[#30363d]' : ''}`}
                >
                  <GitPullRequest className="w-4 h-4 mt-0.5 text-[#3fb950] shrink-0" />
                  <div className="flex-1 min-w-0">
                    <h3 className="text-[15px] font-semibold text-[#e6edf3] mb-1 leading-tight">{pr.title}</h3>
                    <p className="text-xs text-[#7d8590] truncate">
                      {pr.repoFullName}#{pr.number} • Opened by {pr.author.name} • Updated 1 hour ago
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-[#7d8590] shrink-0 font-medium">
                    <MessageSquare className="w-3.5 h-3.5" /> {(idx === 1 ? 3 : 1)}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Old PRs needing attention */}
          <div>
            <div className="flex items-center justify-between mb-3 mt-8">
              <h2 className="text-[13px] font-semibold text-amber-500/80">Old PRs needing attention</h2>
            </div>
            <div className="border border-[#30363d] rounded-xl overflow-hidden bg-transparent">
              {oldPRs.map((pr, idx) => (
                <div 
                  key={`old-${pr.id}`} 
                  onClick={() => {
                    onSelectPR(pr);
                    onNavigateToTab('reviews');
                  }}
                  className={`p-4 flex items-start gap-3 hover:bg-[#161b22] cursor-pointer transition-colors ${idx !== oldPRs.length - 1 ? 'border-b border-[#30363d]' : ''}`}
                >
                  <CircleDashed className="w-4 h-4 mt-0.5 text-amber-500 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <h3 className="text-[15px] font-semibold text-[#e6edf3] mb-1 leading-tight opacity-90">{pr.title}</h3>
                    <p className="text-xs text-[#7d8590] truncate">
                      {pr.repoFullName}#{pr.number} • Opened by {pr.author.name} • Updated 14 days ago
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-[#7d8590] shrink-0 font-medium opacity-80">
                    <MessageSquare className="w-3.5 h-3.5" /> {0}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
