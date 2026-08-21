import { MessageCircle, UploadCloud } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useConversations } from './hooks/useConversations';
import { useChat } from './hooks/useChat';
import { ChatSidebar } from './components/ChatSidebar';
import { ChatHeader } from './components/ChatHeader';
import { ChatEmptyState } from './components/ChatEmptyState';
import { ChatMessages } from './components/ChatMessages';
import { ChatInput } from './components/ChatInput';
import { StagedFilesTray } from './components/StagedFilesTray';

export default function ChatWidget() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const {
    conversations,
    conversationId,
    setConversationId,
    editingId,
    editTitle,
    setEditTitle,
    fetchConversations,
    createNewChat,
    deleteConversation,
    startEditing,
    saveEdit
  } = useConversations();

  const {
    messages,
    inputValue,
    setInputValue,
    isLoading,
    stagedFiles,
    isDragging,
    fileInputRef,
    messagesEndRef,
    loadConversation,
    clearMessages,
    handleSend,
    handleFileSelect,
    removeStagedFile,
    handleDragOver,
    handleDragLeave,
    handleDrop
  } = useChat(user?.email, conversationId, setConversationId, fetchConversations, isExpanded);

  // When expanding or opening, try fetching conversations
  useEffect(() => {
    if (isExpanded && isOpen) {
      fetchConversations();
    }
  }, [isExpanded, isOpen]);

  // Make sure new chats clear messages correctly
  const handleCreateNewChat = () => {
    createNewChat();
    clearMessages();
  };

  const handleLoadConversation = (id: number) => {
    loadConversation(id);
  };

  if (!user) return null;

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-6 right-6 p-4 rounded-full bg-blue-600 text-white shadow-2xl hover:bg-blue-700
          transition-all duration-300 transform hover:scale-105 z-50
          ${isOpen ? 'scale-0 opacity-0' : 'scale-100 opacity-100'}`}>
        <MessageCircle size={28} />
      </button>

      {/* Backdrop overlay for modal mode */}
      {isExpanded && isOpen && (
        <div
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 transition-opacity"
          onClick={() => setIsExpanded(false)}
        />
      )}

      {/* Main Container */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          fixed bg-white rounded-2xl shadow-2xl flex overflow-hidden 
          transition-all duration-300 z-50 border border-gray-100 relative
          ${isOpen ? 'scale-100 opacity-100' : 'scale-0 opacity-0 pointer-events-none'} 
          ${isExpanded
            ? 'inset-4 md:inset-8 flex-row'
            : 'bottom-6 right-6 w-[380px] h-[600px] max-h-[85vh] origin-bottom-right flex-col'
          }
        `}
      >
        {/* Drag Overlay */}
        {isDragging && (
          <div className="absolute inset-0 z-50 bg-blue-50/90 backdrop-blur-sm border-2 border-dashed border-blue-400 m-4 rounded-xl flex flex-col items-center justify-center">
            <UploadCloud size={48} className="text-blue-500 mb-4 animate-bounce" />
            <p className="text-xl font-semibold text-blue-700">Drop PDF files here</p>
          </div>
        )}

        {/* Left Sidebar (Only visible when expanded) */}
        {isExpanded && (
          <ChatSidebar
            isSidebarOpen={isSidebarOpen}
            setIsSidebarOpen={setIsSidebarOpen}
            createNewChat={handleCreateNewChat}
            conversations={conversations}
            conversationId={conversationId}
            loadConversation={handleLoadConversation}
            editingId={editingId}
            editTitle={editTitle}
            setEditTitle={setEditTitle}
            saveEdit={saveEdit}
            startEditing={startEditing}
            deleteConversation={deleteConversation}
          />
        )}

        {/* Right Chat Area */}
        <div className="flex flex-col flex-1 min-w-0">
          <ChatHeader
            isExpanded={isExpanded}
            setIsExpanded={setIsExpanded}
            setIsOpen={setIsOpen}
          />

          {conversationId === null && messages.length === 0 ? (
            <ChatEmptyState userEmail={user?.email}>
              <StagedFilesTray stagedFiles={stagedFiles} removeStagedFile={removeStagedFile} />
              <ChatInput
                inputValue={inputValue}
                setInputValue={setInputValue}
                handleSend={handleSend}
                isLoading={isLoading}
                fileInputRef={fileInputRef}
                handleFileSelect={handleFileSelect}
                hasStagedFiles={stagedFiles.length > 0}
              />
            </ChatEmptyState>
          ) : (
            <>
              <ChatMessages
                messages={messages}
                isLoading={isLoading}
                messagesEndRef={messagesEndRef}
              />

              <div className="p-4 bg-white border-t border-gray-100 flex flex-col gap-2">
                <StagedFilesTray stagedFiles={stagedFiles} removeStagedFile={removeStagedFile} isChatState={true} />
                <ChatInput
                  inputValue={inputValue}
                  setInputValue={setInputValue}
                  handleSend={handleSend}
                  isLoading={isLoading}
                  fileInputRef={fileInputRef}
                  handleFileSelect={handleFileSelect}
                  hasStagedFiles={stagedFiles.length > 0}
                  isChatState={true}
                />
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
