import React, { useState, useMemo } from 'react';
import {
  PanelLeftClose,
  Plus,
  Search,
  X,
  Loader2,
  Clock,
  RotateCw,
} from 'lucide-react';
import { ChatTeardrop } from '@phosphor-icons/react';
import { ConversationListItem } from '../../services/aiChatApi';

interface ChatHistorySidebarProps {
  isOpen: boolean;
  onClose: () => void;
  conversations: ConversationListItem[];
  activeConversation: ConversationListItem | null;
  onSelectConversation: (conversation: ConversationListItem) => void;
  onNewChat: () => void;
  onRefresh: () => void;
  isLoading: boolean;
  isLoadingMore: boolean;
  hasMore: boolean;
  onLoadMore: () => void;
}

interface GroupedConversations {
  group: string;
  items: ConversationListItem[];
}

function groupConversationsByDate(items: ConversationListItem[]): GroupedConversations[] {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const startOfYesterday = startOfToday - 86400000;
  const startOfLast7Days = startOfToday - 7 * 86400000;
  const startOfLast30Days = startOfToday - 30 * 86400000;

  const groups: Record<string, ConversationListItem[]> = {
    Today: [],
    Yesterday: [],
    'Previous 7 Days': [],
    'Previous 30 Days': [],
    Older: [],
  };

  for (const item of items) {
    const itemTime = new Date(item.updatedAt).getTime();
    if (isNaN(itemTime) || itemTime >= startOfToday) {
      groups.Today.push(item);
    } else if (itemTime >= startOfYesterday) {
      groups.Yesterday.push(item);
    } else if (itemTime >= startOfLast7Days) {
      groups['Previous 7 Days'].push(item);
    } else if (itemTime >= startOfLast30Days) {
      groups['Previous 30 Days'].push(item);
    } else {
      groups.Older.push(item);
    }
  }

  return Object.entries(groups)
    .filter(([_, list]) => list.length > 0)
    .map(([group, groupItems]) => ({ group, items: groupItems }));
}

export const ChatHistorySidebar: React.FC<ChatHistorySidebarProps> = ({
  isOpen,
  onClose,
  conversations,
  activeConversation,
  onSelectConversation,
  onNewChat,
  onRefresh,
  isLoading,
  isLoadingMore,
  hasMore,
  onLoadMore,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredConversations = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return conversations;
    return conversations.filter((c) =>
      c.title.toLowerCase().includes(query)
    );
  }, [conversations, searchQuery]);

  const grouped = useMemo(() => {
    return groupConversationsByDate(filteredConversations);
  }, [filteredConversations]);

  return (
    <>
      {/* Optional subtle backdrop when open to dismiss on outside click */}
      {isOpen && (
        <div
          onClick={onClose}
          className="absolute inset-0 bg-black/30 z-20 transition-opacity"
        />
      )}

      <aside
        className={`absolute top-2 left-2 bottom-2 w-72 lg:w-80 transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] flex flex-col bg-[#12141a] border border-[#232530] rounded-2xl overflow-hidden z-30 ${
          isOpen
            ? 'translate-x-0 opacity-100 pointer-events-auto'
            : '-translate-x-[110%] opacity-0 pointer-events-none'
        }`}
      >
        {/* Sidebar Header: Close Toggle (Left) + Search Input (Right) */}
        <div className="p-2 border-b border-[#232530] flex items-center gap-1.5 shrink-0 bg-[#16171d]/60">
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center bg-[#1a1b22] hover:bg-[#21262d] border border-[#2e323e] hover:border-zinc-500 text-zinc-300 hover:text-white rounded-[8px] transition-all cursor-pointer shrink-0"
            title="Close sidebar"
          >
            <PanelLeftClose className="w-3.5 h-3.5" />
          </button>

          {/* Inline Search Input Bar */}
          <div className="flex-1 relative flex items-center h-7">
            <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search chats..."
              className="w-full h-7 bg-[#181a22] border border-[#232530] rounded-[8px] pl-7 pr-6 text-xs text-zinc-200 placeholder:text-zinc-500 outline-none focus:border-[#383b48] focus:bg-[#1a1d26] transition-colors leading-none"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-1.5 text-zinc-500 hover:text-zinc-300 p-0.5 cursor-pointer"
                title="Clear search"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>

        {/* History List */}
        <div className="flex-1 overflow-y-auto px-2 py-1.5 space-y-2">
          {isLoading && conversations.length === 0 ? (
            <div className="space-y-1.5 p-1">
              {[1, 2, 3, 4, 5].map((idx) => (
                <div
                  key={idx}
                  className="h-7 bg-[#181a22] rounded-lg animate-pulse"
                />
              ))}
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center p-6 text-zinc-500 space-y-2">
              <Clock className="w-6 h-6 text-zinc-600 mb-1" />
              <p className="text-xs">
                {searchQuery ? 'No matching chats found' : 'No previous chats yet'}
              </p>
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="text-[11px] text-[#c0f200] hover:underline cursor-pointer"
                >
                  Clear search filter
                </button>
              )}
            </div>
          ) : (
            grouped.map(({ group, items }) => (
              <div key={group} className="space-y-0.5">
                <div className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 font-semibold px-2 pt-1 pb-0.5">
                  {group}
                </div>
                <div className="space-y-0.5">
                  {items.map((conversation) => {
                    const isActive = activeConversation?.id === conversation.id;
                    return (
                      <button
                        key={conversation.id}
                        onClick={() => {
                          onSelectConversation(conversation);
                          onClose();
                        }}
                        className={`w-full flex items-center gap-2 text-left px-2.5 py-1.5 rounded-lg text-xs transition-all cursor-pointer group relative ${
                          isActive
                            ? 'bg-[#c0f200]/10 text-[#c0f200] font-medium border border-[#c0f200]/25'
                            : 'text-zinc-300 hover:text-zinc-100 hover:bg-[#1a1b22] border border-transparent'
                        }`}
                      >
                        <ChatTeardrop
                          size={14}
                          weight={isActive ? 'fill' : 'regular'}
                          className={`shrink-0 transition-colors ${
                            isActive
                              ? 'text-[#c0f200]'
                              : 'text-zinc-500 group-hover:text-zinc-400'
                          }`}
                        />
                        <span className="truncate flex-1">{conversation.title}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))
          )}

        {/* Load More Pagination */}
        {hasMore && (
          <div className="pt-2 border-t border-[#232530]">
            <button
              onClick={onLoadMore}
              disabled={isLoadingMore}
              className="w-full flex items-center justify-center gap-1.5 py-2 px-3 bg-[#181a22] hover:bg-[#20222d] border border-[#282b37] text-zinc-400 hover:text-zinc-200 rounded-xl text-[11px] font-medium disabled:opacity-50 transition-colors cursor-pointer"
            >
              {isLoadingMore ? (
                <>
                  <Loader2 className="w-3 h-3 animate-spin text-[#c0f200]" />
                  <span>Loading older chats…</span>
                </>
              ) : (
                <span>Load older chats</span>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Sidebar Footer with Sync/Refresh */}
      <div className="p-2 border-t border-[#232530] flex items-center justify-between gap-2 shrink-0 bg-[#16171d]/60">
        <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider pl-1">
          {conversations.length} {conversations.length === 1 ? 'chat' : 'chats'}
        </span>
        <button
          onClick={onRefresh}
          disabled={isLoading}
          className="h-6 flex items-center gap-1 px-2 bg-[#1a1b22] hover:bg-[#21262d] border border-[#2e323e] hover:border-zinc-500 text-zinc-400 hover:text-zinc-200 disabled:opacity-50 rounded-md text-[10px] font-medium transition-colors cursor-pointer"
          title="Refresh chats"
        >
          <RotateCw className={`w-3 h-3 ${isLoading ? 'animate-spin text-[#c0f200]' : ''}`} />
          <span>Sync</span>
        </button>
      </div>
    </aside>
    </>
  );
};
