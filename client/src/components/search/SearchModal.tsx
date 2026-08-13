import React, { useState } from 'react';
import { MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { AIFinding, PullRequest } from '../../types/codeReview';
import { SeverityBadge } from '../ui/Badge';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  findings: AIFinding[];
  pullRequests: PullRequest[];
  onSelectFinding: (finding: AIFinding) => void;
}

export const SearchModal: React.FC<SearchModalProps> = ({
  isOpen,
  onClose,
  findings,
  pullRequests,
  onSelectFinding,
}) => {
  const [query, setQuery] = useState('');

  if (!isOpen) return null;

  const filteredFindings = findings.filter(
    (f) =>
      f.title.toLowerCase().includes(query.toLowerCase()) ||
      f.explanation.toLowerCase().includes(query.toLowerCase()) ||
      f.filename.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-md flex items-start justify-center pt-24 px-4 z-50 animate-apple-fade" onClick={onClose}>
      <div 
        className="bg-[#16171d] border border-[#232530] rounded-2xl max-w-xl w-full overflow-hidden shadow-2xl space-y-0 font-sans animate-apple-scale"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search input bar */}
        <div className="flex items-center px-4 py-3 border-b border-[#232530]">
          <MagnifyingGlassIcon className="w-5 h-5 text-zinc-500 shrink-0 mr-3" />
          <input
            type="text"
            autoFocus
            placeholder="Search files, code, findings..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-transparent text-[15px] text-zinc-100 placeholder-zinc-600 focus:outline-none"
          />
          <button 
            onClick={onClose} 
            className="w-7 h-7 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition-colors cursor-pointer shrink-0 ml-3"
          >
            <XMarkIcon className="w-4 h-4" />
          </button>
        </div>

        {/* Results list */}
        <div className="max-h-[60vh] overflow-y-auto p-3">
          {filteredFindings.length === 0 ? (
            <div className="py-8 text-center text-sm text-zinc-500">
              No matching results found for "{query}".
            </div>
          ) : (
            <div className="space-y-1">
              <div className="px-3 pb-2 text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">
                AI Findings
              </div>
              {filteredFindings.map((finding) => (
                <div
                  key={finding.id}
                  onClick={() => {
                    onSelectFinding(finding);
                    onClose();
                  }}
                  className="px-4 py-3 bg-transparent hover:bg-white/5 rounded-2xl cursor-pointer transition-colors flex items-start gap-4 group"
                >
                  <div className="mt-0.5">
                    <SeverityBadge severity={finding.severity} size="sm" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium text-zinc-200 group-hover:text-white transition-colors truncate">{finding.title}</h4>
                    <p className="text-[13px] text-zinc-500 mt-0.5 line-clamp-1">{finding.explanation}</p>
                  </div>
                  <div className="text-[11px] font-mono text-zinc-600 group-hover:text-zinc-400 transition-colors pt-1">
                    {finding.filename}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer shortcuts */}
        <div className="px-4 py-3 bg-[#111216] flex items-center justify-between text-[11px] text-zinc-500 font-mono">
          <div className="flex items-center gap-2">
            <span>Press</span>
            <kbd className="px-1.5 py-0.5 rounded-md bg-[#21262d] border border-[#30363d] text-zinc-300">ESC</kbd>
            <span>to close</span>
          </div>
          <span>{filteredFindings.length} results</span>
        </div>
      </div>
    </div>
  );
};
