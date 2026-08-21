import { Maximize2, MessageCircle, Minimize2, X } from 'lucide-react';

interface ChatHeaderProps {
  isExpanded: boolean;
  setIsExpanded: (val: boolean) => void;
  setIsOpen: (val: boolean) => void;
}

export function ChatHeader({ isExpanded, setIsExpanded, setIsOpen }: ChatHeaderProps) {
  return (
    <div className="bg-gradient-to-r from-blue-600 to-blue-500 p-4 text-white flex justify-between items-center shadow-md z-10">
      <div className="flex items-center gap-2">
        <MessageCircle size={20} className="opacity-90" />
        <h3 className="font-semibold text-lg tracking-tight">KnowledgeMesh</h3>
      </div>
      <div className="flex items-center gap-1">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="p-1.5 hover:bg-white/20 rounded-full transition-colors"
          title={isExpanded ? "Collapse" : "Expand Vertically"}
        >
          {isExpanded ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
        </button>
        <button
          onClick={() => setIsOpen(false)}
          className="p-1.5 hover:bg-white/20 rounded-full transition-colors"
        >
          <X size={20} />
        </button>
      </div>
    </div>
  );
}
