import { Paperclip, Send } from 'lucide-react';
import React from 'react';

interface ChatInputProps {
  inputValue: string;
  setInputValue: (val: string) => void;
  handleSend: () => void;
  isLoading: boolean;
  fileInputRef: React.RefObject<HTMLInputElement>;
  handleFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  hasStagedFiles: boolean;
  isChatState?: boolean;
}

export function ChatInput({
  inputValue,
  setInputValue,
  handleSend,
  isLoading,
  fileInputRef,
  handleFileSelect,
  hasStagedFiles,
  isChatState = false
}: ChatInputProps) {
  if (isChatState) {
    return (
      <div className="flex items-center gap-2 bg-gray-50 rounded-full p-1.5 border border-gray-200 focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-100 transition-all">
        <button
          className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors flex-shrink-0"
          onClick={() => fileInputRef.current?.click()}
          title="Upload PDF"
        >
          <Paperclip size={20} />
        </button>
        <input
          type="file"
          accept=".pdf"
          multiple
          className="hidden"
          ref={fileInputRef}
          onChange={handleFileSelect}
        />

        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Ask a question..."
          className="flex-1 bg-transparent border-none focus:outline-none text-sm px-2 text-gray-700 min-w-0"
        />

        <button
          className="p-2 bg-blue-600 text-white hover:bg-blue-700 rounded-full transition-colors disabled:opacity-50 disabled:hover:bg-blue-600 flex-shrink-0"
          onClick={handleSend}
          disabled={(!inputValue.trim() && !hasStagedFiles) || isLoading}
        >
          <Send size={18} className="-ml-0.5" />
        </button>
      </div>
    );
  }

  return (
    <div className="w-full bg-white rounded-full shadow-lg border border-gray-200 p-2 flex items-center focus-within:ring-2 focus-within:ring-blue-100 focus-within:border-blue-400 transition-all hover:shadow-xl">
      <button
        className="p-3 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors flex-shrink-0"
        onClick={() => fileInputRef.current?.click()}
        title="Upload PDF"
      >
        <Paperclip size={24} />
      </button>
      <input
        type="file"
        accept=".pdf"
        multiple
        className="hidden"
        ref={fileInputRef}
        onChange={handleFileSelect}
      />

      <input
        type="text"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && handleSend()}
        placeholder="Ask KnowledgeMesh..."
        className="flex-1 bg-transparent border-none focus:outline-none text-lg px-4 text-gray-700 min-w-0"
      />

      <button
        className="p-3 bg-blue-600 text-white hover:bg-blue-700 rounded-full transition-colors disabled:opacity-50 disabled:hover:bg-blue-600 flex-shrink-0 shadow-sm"
        onClick={handleSend}
        disabled={(!inputValue.trim() && !hasStagedFiles) || isLoading}
      >
        <Send size={22} className="-ml-0.5" />
      </button>
    </div>
  );
}
