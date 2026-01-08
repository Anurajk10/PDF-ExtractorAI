import React, { useCallback } from 'react';
import { Upload, FileText, X } from 'lucide-react';

interface FileUploadProps {
  files: File[];
  onFilesSelected: (files: File[]) => void;
  onRemoveFile: (index: number) => void;
  disabled?: boolean;
}

export const FileUpload: React.FC<FileUploadProps> = ({ 
  files, 
  onFilesSelected, 
  onRemoveFile,
  disabled 
}) => {
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (disabled) return;
    
    const droppedFiles = Array.from(e.dataTransfer.files).filter(
      file => file.type === 'application/pdf'
    );
    if (droppedFiles.length > 0) {
      onFilesSelected(droppedFiles);
    }
  }, [disabled, onFilesSelected]);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && !disabled) {
      const selectedFiles = Array.from(e.target.files).filter(
        file => file.type === 'application/pdf'
      );
      onFilesSelected(selectedFiles);
    }
  };

  return (
    <div className="w-full space-y-4">
      <div 
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors duration-200
          ${disabled ? 'bg-gray-50 border-gray-200 cursor-not-allowed' : 'bg-white border-brand-500 hover:bg-brand-50 cursor-pointer'}
        `}
      >
        <input
          type="file"
          multiple
          accept=".pdf"
          onChange={handleFileInput}
          disabled={disabled}
          className="hidden"
          id="file-upload"
        />
        <label htmlFor="file-upload" className={`cursor-pointer flex flex-col items-center ${disabled ? 'pointer-events-none' : ''}`}>
          <div className="bg-brand-100 p-4 rounded-full mb-4">
            <Upload className="w-8 h-8 text-brand-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-1">
            Upload PDFs
          </h3>
          <p className="text-sm text-gray-500 max-w-sm mx-auto">
            Drag & drop your PDF folder or files here, or click to browse.
          </p>
        </label>
      </div>

      {files.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 divide-y divide-gray-100 max-h-60 overflow-y-auto">
          {files.map((file, idx) => (
            <div key={`${file.name}-${idx}`} className="flex items-center justify-between p-3 hover:bg-gray-50">
              <div className="flex items-center gap-3 overflow-hidden">
                <FileText className="w-5 h-5 text-gray-400 flex-shrink-0" />
                <span className="text-sm text-gray-700 truncate">{file.name}</span>
                <span className="text-xs text-gray-400 flex-shrink-0">
                  ({(file.size / 1024 / 1024).toFixed(2)} MB)
                </span>
              </div>
              {!disabled && (
                <button 
                  onClick={() => onRemoveFile(idx)}
                  className="p-1 hover:bg-gray-200 rounded-full text-gray-500 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};