import { Loader2 } from 'lucide-react';
import React from 'react';
import { ChatMessage } from '../types';

interface ChatMessagesProps {
  messages: ChatMessage[];
  isLoading: boolean;
  messagesEndRef: React.RefObject<HTMLDivElement>;
}

export function ChatMessages({ messages, isLoading, messagesEndRef }: ChatMessagesProps) {
  return (
    <div className="flex-1 p-4 overflow-y-auto bg-gray-50/50 flex flex-col gap-4">
      {messages.map((msg, idx) => (
        <div
          key={idx}
          className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
        >
          <div
            className={`max-w-[85%] p-3 rounded-2xl text-sm shadow-sm whitespace-pre-wrap break-words ${
              msg.role === 'user'
                ? 'bg-blue-600 text-white rounded-tr-sm'
                : 'bg-gray-100 text-gray-800 rounded-tl-sm'
            }`}
          >
            {msg.content}
          </div>
        </div>
      ))}
      {isLoading && (
        <div className="flex justify-start">
          <div className="bg-gray-100 p-3 rounded-2xl rounded-tl-sm shadow-sm">
            <Loader2 size={18} className="animate-spin text-blue-500" />
          </div>
        </div>
      )}
      <div ref={messagesEndRef} />
    </div>
  );
}
