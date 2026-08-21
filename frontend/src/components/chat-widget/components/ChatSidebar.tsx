import { Check, Edit2, Menu, Plus, Trash2 } from 'lucide-react';
import type { Conversation } from '../types';

interface ChatSidebarProps {
  isSidebarOpen: boolean;
  setIsSidebarOpen: (isOpen: boolean) => void;
  createNewChat: () => void;
  conversations: Conversation[];
  conversationId: number | null;
  loadConversation: (id: number) => void;
  editingId: number | null;
  editTitle: string;
  setEditTitle: (title: string) => void;
  saveEdit: (e: React.SyntheticEvent | undefined, id: number) => void;
  startEditing: (e: React.MouseEvent, id: number, currentTitle: string) => void;
  deleteConversation: (e: React.MouseEvent, id: number) => void;
}

const ChatSidebar = ({
  isSidebarOpen,
  setIsSidebarOpen,
  createNewChat,
  conversations,
  conversationId,
  loadConversation,
  editingId,
  editTitle,
  setEditTitle,
  saveEdit,
  startEditing,
  deleteConversation
}: ChatSidebarProps) => {
  return (
    <div className={`
      ${isSidebarOpen ? 'w-64' : 'w-[72px]'} 
      border-r border-gray-100 bg-gray-50 flex flex-col flex-shrink-0 transition-all duration-300 overflow-hidden`}>
      <div className="p-4 flex items-center">
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="p-2 hover:bg-gray-200 rounded-full transition-colors flex-shrink-0 text-gray-600"
          title={isSidebarOpen ? "Collapse Sidebar" : "Expand Sidebar"}
        >
          <Menu size={20} />
        </button>
      </div>

      <div className="px-3 pb-3">
        <button
          onClick={createNewChat}
          className={`flex items-center rounded-full transition-all duration-300 overflow-hidden ${isSidebarOpen
            ? 'w-full px-4 py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 gap-3'
            : 'w-12 h-12 justify-center bg-gray-200 hover:bg-gray-300 text-gray-800 mx-auto'
            }`}
          title="New Chat"
        >
          <Plus size={20} className="flex-shrink-0" />
          {isSidebarOpen && <span className="font-medium whitespace-nowrap">New chat</span>}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-2 space-y-1 w-64">
        {isSidebarOpen && (
          <div className="animate-in fade-in duration-300">
            <div className="text-xs font-semibold text-gray-500 mt-2 mb-2 px-3">Recent</div>
            {conversations.length === 0 && (
              <div className="text-center text-gray-400 text-sm mt-4">No history found</div>
            )}
            {conversations.map(conv => (
              <div
                key={conv.id}
                className={`group w-[232px] mx-1 flex items-center justify-between px-3 py-2.5 rounded-lg text-sm 
                  transition-colors border cursor-pointer ${conversationId === conv.id
                    ? 'bg-blue-50 border-blue-200 shadow-sm text-blue-700 font-medium'
                    : 'border-transparent hover:bg-gray-200 text-gray-700'}`}
                onClick={() => { if (editingId !== conv.id) loadConversation(conv.id); }}
              >
                {editingId === conv.id ? (
                  <input
                    autoFocus
                    value={editTitle}
                    onChange={e => setEditTitle(e.target.value)}
                    onClick={e => e.stopPropagation()}
                    onKeyDown={e => e.key === 'Enter' && saveEdit(e, conv.id)}
                    className="flex-1 bg-white border border-blue-300 rounded px-1.5 py-0.5 mr-2 text-gray-800 outline-none w-full"
                  />
                ) : (
                  <span className="truncate flex-1 pr-2">{conv.title || "New Conversation"}</span>
                )}
                <div className="opacity-0 group-hover:opacity-100 flex items-center transition-opacity">
                  {editingId === conv.id ? (
                    <button
                      onClick={(e) => saveEdit(e, conv.id)}
                      className="p-1 hover:bg-green-100 hover:text-green-600 rounded-md transition-colors text-gray-400"
                      title="Save"
                    >
                      <Check size={16} />
                    </button>
                  ) : (
                    <button
                      onClick={(e) => startEditing(e, conv.id, conv.title)}
                      className="p-1 hover:bg-blue-100 hover:text-blue-600 rounded-md transition-colors text-gray-400"
                      title="Rename Conversation"
                    >
                      <Edit2 size={16} />
                    </button>
                  )}
                  <button
                    onClick={(e) => deleteConversation(e, conv.id)}
                    className="p-1 hover:bg-red-100 hover:text-red-600 rounded-md transition-colors text-gray-400 ml-0.5"
                    title="Delete Conversation"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default ChatSidebar;
