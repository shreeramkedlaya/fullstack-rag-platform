import React from 'react';

interface ChatEmptyStateProps {
  userEmail: string | undefined;
  children: React.ReactNode;
}

export function ChatEmptyState({ userEmail, children }: ChatEmptyStateProps) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 bg-gradient-to-b from-blue-50/50 to-white overflow-hidden relative">
      <div className="z-10 w-full max-w-2xl flex flex-col items-center animate-in fade-in slide-in-from-bottom-4 duration-700">
        <h2 className="text-3xl md:text-4xl font-semibold text-gray-800 mb-8 tracking-tight text-center">
          Hi {userEmail?.split('@')[0] || 'there'}, let's get started
        </h2>
        
        <div className="w-full flex flex-col gap-2">
          {children}
        </div>
      </div>
    </div>
  );
}
