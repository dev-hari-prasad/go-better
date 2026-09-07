import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GitPullRequest, Search, X, Loader2 } from 'lucide-react';
import {
  fetchPullRequestSummaryList,
  PullRequestSummary,
} from '../../services/pullRequestApi';

export interface PrSummaryDropdownProps {
  selectedPr: PullRequestSummary | null;
  onSelectPr: (pr: PullRequestSummary | null) => void;
  buttonSize?: 'sm' | 'md';
  fallbackList?: PullRequestSummary[];
  className?: string;
}

export const PrSummaryDropdown: React.FC<PrSummaryDropdownProps> = ({
  selectedPr,
  onSelectPr,
  buttonSize = 'md',
  fallbackList = [],
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [debouncedSearch, setDebouncedSearch] = useState<string>('');
  const [summaries, setSummaries] = useState<PullRequestSummary[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [cursorUpdatedAt, setCursorUpdatedAt] = useState<string | undefined>(undefined);
  const [hasMore, setHasMore] = useState<boolean>(false);
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchRequestIdRef = useRef<number>(0);

  // 200ms cool down timer for search queries
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 200);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch summaries when dropdown opens or search query changes
  const loadSummaries = useCallback(
    async (search: string) => {
      const currentRequestId = ++searchRequestIdRef.current;
      setIsLoading(true);
      setError(null);
      try {
        const results = await fetchPullRequestSummaryList({
          search: search.trim() ? search.trim() : undefined,
          time: true,
          updatedAt: new Date(0).toISOString(),
        });

        // Ensure we only update state for the latest requested query
        if (currentRequestId !== searchRequestIdRef.current) return;

        if (results.length > 0) {
          setSummaries(results);
          // Check if we hit limit (20 in backend) to enable pagination
          setHasMore(results.length >= 20);
          const lastItem = results[results.length - 1];
          setCursorUpdatedAt(lastItem.createdAt);
        } else if (!search.trim() && fallbackList.length > 0) {
          // Fallback if backend returned empty list initially
          setSummaries(fallbackList);
          setHasMore(false);
        } else {
          setSummaries([]);
          setHasMore(false);
        }
      } catch (err) {
        if (currentRequestId !== searchRequestIdRef.current) return;
        if (!search.trim() && fallbackList.length > 0) {
          setSummaries(fallbackList);
        } else {
          setError(err instanceof Error ? err.message : 'Failed to load pull requests');
        }
      } finally {
        if (currentRequestId === searchRequestIdRef.current) {
          setIsLoading(false);
        }
      }
    },
    [fallbackList]
  );

  // Load more with cursor (updatedAt)
  const loadMoreSummaries = async () => {
    if (isLoadingMore || !hasMore || !cursorUpdatedAt) return;
    setIsLoadingMore(true);
    try {
      const moreResults = await fetchPullRequestSummaryList({
        search: debouncedSearch.trim() ? debouncedSearch.trim() : undefined,
        time: true,
        updatedAt: cursorUpdatedAt,
      });

      if (moreResults.length > 0) {
        setSummaries((prev) => {
          const existingIds = new Set(prev.map((p) => p.id || String(p.prId)));
          const filtered = moreResults.filter((p) => !existingIds.has(p.id || String(p.prId)));
          return [...prev, ...filtered];
        });
        setHasMore(moreResults.length >= 20);
        const lastItem = moreResults[moreResults.length - 1];
        setCursorUpdatedAt(lastItem.createdAt);
      } else {
        setHasMore(false);
      }
    } catch {
      setHasMore(false);
    } finally {
      setIsLoadingMore(false);
    }
  };

  // Trigger search on debounced query change if dropdown is open
  useEffect(() => {
    if (isOpen) {
      loadSummaries(debouncedSearch);
    }
  }, [isOpen, debouncedSearch, loadSummaries]);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    } else {
      setSearchQuery('');
    }
  }, [isOpen]);

  // Close on outside click or Escape key
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const sizeClasses =
    buttonSize === 'sm'
      ? 'w-8 h-8'
      : 'w-9 h-9';

  const iconSizes =
    buttonSize === 'sm'
      ? 'w-4 h-4'
      : 'w-4.5 h-4.5';

  return (
    <div className={`relative shrink-0 ${className}`} ref={dropdownRef}>
      {/* Trigger button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        title={selectedPr ? `Attached PR: #${selectedPr.prId || selectedPr.id} - ${selectedPr.title}` : 'Select PR'}
        className={`flex items-center gap-1.5 transition-all rounded-full border cursor-pointer ${
          selectedPr
            ? 'px-2.5 h-8 bg-[#c0f200]/12 text-[#c0f200] border-[#c0f200]/40 hover:bg-[#c0f200]/22 shadow-[0_0_10px_rgba(192,242,0,0.15)] font-mono text-[11px] font-semibold'
            : `justify-center ${sizeClasses} bg-[#21262d] text-zinc-400 hover:text-zinc-200 border-transparent`
        }`}
      >
        <GitPullRequest className={iconSizes} />
        {selectedPr && (
          <span className="truncate max-w-[85px]">
            #{selectedPr.prId || selectedPr.id}
          </span>
        )}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute bottom-full left-0 mb-2 w-72 bg-[#161b22] border border-[#30363d] rounded-xl shadow-2xl p-2 z-50 animate-apple-fade">
          {/* Search Header */}
          <div className="relative mb-2">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search pull requests..."
              className="w-full bg-[#0d1117] border border-[#30363d] focus:border-zinc-500 rounded-lg pl-8 pr-7 py-1.5 text-xs text-zinc-200 placeholder:text-zinc-500 outline-none transition-colors"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 p-0.5 cursor-pointer"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* List items */}
          <div className="max-h-56 overflow-y-auto space-y-0.5 custom-scrollbar pr-0.5">
            {isLoading ? (
              <div className="flex items-center justify-center py-5 text-xs text-zinc-500 gap-2">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-[#c0f200]" />
                <span>Loading pull requests...</span>
              </div>
            ) : error ? (
              <div className="px-2 py-3 text-xs text-red-400 text-center">{error}</div>
            ) : summaries.length === 0 ? (
              <div className="px-2 py-4 text-xs text-zinc-500 text-center">
                {debouncedSearch ? 'No matching pull requests' : 'No pull requests available'}
              </div>
            ) : (
              <>
                {summaries.map((pr) => {
                  const isSelected =
                    selectedPr?.id === pr.id ||
                    String(selectedPr?.prId) === String(pr.prId);

                  return (
                    <button
                      key={pr.id || String(pr.prId)}
                      type="button"
                      onClick={() => {
                        onSelectPr(pr);
                        setIsOpen(false);
                      }}
                      className={`w-full flex items-center gap-2 text-left px-2.5 py-1.5 text-xs rounded-lg transition-colors cursor-pointer ${
                        isSelected
                          ? 'text-[#c0f200] bg-[#c0f200]/10 font-medium'
                          : 'text-zinc-300 hover:bg-[#21262d]'
                      }`}
                    >
                      <GitPullRequest
                        className={`w-3.5 h-3.5 shrink-0 ${
                          isSelected ? 'text-[#c0f200]' : 'text-zinc-500'
                        }`}
                      />
                      <span className="truncate">{pr.title}</span>
                    </button>
                  );
                })}

                {hasMore && (
                  <button
                    type="button"
                    onClick={loadMoreSummaries}
                    disabled={isLoadingMore}
                    className="w-full text-center py-1.5 text-[11px] text-zinc-500 hover:text-zinc-300 disabled:opacity-50 transition-colors cursor-pointer mt-1"
                  >
                    {isLoadingMore ? (
                      <span className="flex items-center justify-center gap-1.5">
                        <Loader2 className="w-3 h-3 animate-spin" /> Loading more...
                      </span>
                    ) : (
                      'Load more pull requests'
                    )}
                  </button>
                )}
              </>
            )}
          </div>

          {/* Footer - Clear selection */}
          <div className="mt-1 pt-1.5 border-t border-[#30363d]">
            <button
              type="button"
              onClick={() => {
                onSelectPr(null);
                setIsOpen(false);
              }}
              className="w-full text-left px-2.5 py-1.5 text-xs text-zinc-500 hover:text-zinc-300 hover:bg-[#21262d] rounded-lg transition-colors cursor-pointer"
            >
              Clear Selection
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
