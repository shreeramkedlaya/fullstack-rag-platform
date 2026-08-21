import { FileText, X } from 'lucide-react';

interface StagedFilesTrayProps {
  stagedFiles: File[];
  removeStagedFile: (index: number) => void;
  isChatState?: boolean;
}

const StagedFilesTray = ({ stagedFiles, removeStagedFile, isChatState = false }: StagedFilesTrayProps) => {
  if (stagedFiles.length === 0) return null;

  if (isChatState) {
    return (
      <div className="flex flex-wrap gap-2 p-2 bg-gray-50 rounded-xl border border-gray-200">
        {stagedFiles.map((file, idx) => (
          <div key={idx} className="flex items-center gap-2 bg-white px-2.5 py-1 rounded-full border border-gray-200 shadow-sm text-xs">
            <FileText size={12} className="text-blue-500" />
            <span className="truncate max-w-[120px] text-gray-700 font-medium">{file.name}</span>
            <button 
              onClick={() => removeStagedFile(idx)}
              className="text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full p-1 transition-colors"
            >
              <X size={12} />
            </button>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-2 p-3 bg-white/50 backdrop-blur rounded-xl border border-blue-100 shadow-sm w-full">
      {stagedFiles.map((file, idx) => (
        <div key={idx} className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-full border border-blue-200 shadow-sm text-sm">
          <FileText size={14} className="text-blue-500" />
          <span className="truncate max-w-[150px] text-gray-700 font-medium">{file.name}</span>
          <button 
            onClick={() => removeStagedFile(idx)}
            className="text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full p-1 transition-colors"
          >
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}

export default StagedFilesTray;
