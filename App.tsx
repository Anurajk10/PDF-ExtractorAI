import React, { useState, useCallback } from 'react';
import { FileUpload } from './components/FileUpload';
import { FieldConfig } from './components/FieldConfig';
import { ResultsTable } from './components/ResultsTable';
import { ExcelSummary } from './components/ExcelSummary';
import { ExtractedData, ProcessingStatus } from './types';
import { extractDataFromPdf } from './services/geminiService';
import { exportToExcel } from './services/excelService';
import { Download, Play, RefreshCw, Trash2, Github, ListFilter, CheckSquare } from 'lucide-react';

// Use a simple ID generator
const generateId = () => Math.random().toString(36).substring(2, 9);

export default function App() {
  const [files, setFiles] = useState<File[]>([]);
  const [fields, setFields] = useState<string[]>(['Invoice Number', 'Total Amount', 'Date']);
  const [results, setResults] = useState<ExtractedData[]>([]);
  const [status, setStatus] = useState<ProcessingStatus>('idle');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState<'all' | 'selected'>('all');

  const handleFilesSelected = (newFiles: File[]) => {
    // Prevent duplicates by name for simplicity
    const existingNames = new Set(files.map(f => f.name));
    const uniqueFiles = newFiles.filter(f => !existingNames.has(f.name));
    setFiles(prev => [...prev, ...uniqueFiles]);
  };

  const handleRemoveFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleReset = () => {
    if (confirm("Are you sure you want to clear all files and data?")) {
      setFiles([]);
      setResults([]);
      setStatus('idle');
      setSelectedIds(new Set());
      setActiveTab('all');
    }
  };

  const handleSelect = (id: string) => {
    setSelectedIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const handleSelectAll = (ids: string[], shouldSelect: boolean) => {
    setSelectedIds(prev => {
      const newSet = new Set(prev);
      ids.forEach(id => {
        if (shouldSelect) {
          newSet.add(id);
        } else {
          newSet.delete(id);
        }
      });
      return newSet;
    });
  };

  const handleDataUpdate = (id: string, field: string, value: string) => {
    setResults(prev => prev.map(item => {
      if (item.id === id && item.data) {
        return {
          ...item,
          data: {
            ...item.data,
            [field]: value
          }
        };
      }
      return item;
    }));
  };

  const handleReorderFields = (newFields: string[]) => {
    setFields(newFields);
  };

  const startExtraction = async () => {
    if (files.length === 0 || fields.length === 0) return;

    setStatus('extracting');
    setActiveTab('all');
    
    // Initialize results with pending state
    const initialResults: ExtractedData[] = files.map(file => ({
      id: generateId(),
      fileName: file.name,
      status: 'pending'
    }));
    setResults(initialResults);
    
    // Select first item by default
    if (initialResults.length > 0) {
      setSelectedIds(new Set([initialResults[0].id]));
    } else {
      setSelectedIds(new Set());
    }

    // Process files one by one to avoid rate limits (or use a small concurrency pool)
    // For this demo, simple sequential loop is safer for "Free" tier API
    const updatedResults = [...initialResults];
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const resultIndex = i;

      // Update status to processing
      updatedResults[resultIndex] = { ...updatedResults[resultIndex], status: 'processing' };
      setResults([...updatedResults]);

      try {
        const data = await extractDataFromPdf(file, fields);
        updatedResults[resultIndex] = {
          ...updatedResults[resultIndex],
          status: 'success',
          data: data
        };
      } catch (error) {
        updatedResults[resultIndex] = {
          ...updatedResults[resultIndex],
          status: 'error',
          error: (error as Error).message || 'Extraction failed'
        };
      }
      
      setResults([...updatedResults]);
    }

    setStatus('completed');
  };

  const handleExport = () => {
    exportToExcel(results, selectedIds);
  };

  const handleExportAll = () => {
    exportToExcel(results, undefined, 'all_extracted_data.xlsx');
  };

  const getDisplayedResults = () => {
    if (activeTab === 'all') return results;
    return results.filter(r => selectedIds.has(r.id));
  };

  const displayedResults = getDisplayedResults();

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans text-gray-900">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-brand-600 text-white p-2 rounded-lg">
              <Download className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-bold text-gray-900 tracking-tight">PDF Extractor AI</h1>
          </div>
          <div className="flex items-center gap-4">
             {status !== 'idle' && (
                <button 
                  onClick={handleReset}
                  className="text-sm font-medium text-gray-500 hover:text-red-600 flex items-center gap-2 transition-colors"
                >
                  <Trash2 className="w-4 h-4" /> Reset
                </button>
             )}
            <a 
              href="https://ai.google.dev" 
              target="_blank" 
              rel="noreferrer" 
              className="text-sm font-medium text-gray-500 hover:text-brand-600 transition-colors"
            >
              Powered by Gemini
            </a>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 gap-8 grid grid-cols-1 lg:grid-cols-12">
        
        {/* Left Sidebar: Config & Upload */}
        <div className="lg:col-span-4 space-y-6">
          <section className="space-y-4">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-brand-100 text-brand-700 text-xs font-bold">1</span>
              Upload Documents
            </h2>
            <FileUpload 
              files={files} 
              onFilesSelected={handleFilesSelected} 
              onRemoveFile={handleRemoveFile}
              disabled={status === 'extracting'}
            />
          </section>

          <section className="space-y-4">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-brand-100 text-brand-700 text-xs font-bold">2</span>
              Configure Data
            </h2>
            <FieldConfig 
              fields={fields} 
              setFields={setFields} 
              disabled={status === 'extracting'}
            />
          </section>

          <button
            onClick={startExtraction}
            disabled={status === 'extracting' || files.length === 0 || fields.length === 0}
            className={`w-full py-4 rounded-xl font-bold text-lg shadow-lg transform transition-all duration-200 flex items-center justify-center gap-3
              ${status === 'extracting' 
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed shadow-none' 
                : 'bg-gradient-to-r from-brand-600 to-brand-500 text-white hover:from-brand-700 hover:to-brand-600 hover:-translate-y-0.5 shadow-brand-200'
              }
            `}
          >
            {status === 'extracting' ? (
              <>
                <RefreshCw className="w-6 h-6 animate-spin" /> Extracting...
              </>
            ) : (
              <>
                <Play className="w-6 h-6 fill-current" /> Start Extraction
              </>
            )}
          </button>
        </div>

        {/* Right Area: Results */}
        <div className="lg:col-span-8 flex flex-col min-h-[500px] pb-20">
          <div className="flex flex-col gap-4 mb-4">
             <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-brand-100 text-brand-700 text-xs font-bold">3</span>
                  Review & Export
                </h2>
                <div className="flex gap-2">
                  <button
                    onClick={handleExport}
                    disabled={results.length === 0 || selectedIds.size === 0}
                    className="px-3 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg font-medium shadow-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2 text-sm"
                  >
                    <CheckSquare className="w-4 h-4" /> Export Selected ({selectedIds.size})
                  </button>
                  <button
                    onClick={handleExportAll}
                    disabled={!results.some(r => r.status === 'success')}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium shadow-sm hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2 text-sm"
                  >
                    <Download className="w-4 h-4" /> Export All
                  </button>
                </div>
             </div>
             
             {/* Tabs for All vs Selected */}
             {results.length > 0 && (
               <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-lg w-fit">
                  <button 
                    onClick={() => setActiveTab('all')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'all' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                  >
                    <ListFilter className="w-4 h-4" />
                    All Files ({results.length})
                  </button>
                  <button 
                    onClick={() => setActiveTab('selected')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'selected' ? 'bg-white text-brand-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                  >
                    <CheckSquare className="w-4 h-4" />
                    Selected ({selectedIds.size})
                  </button>
               </div>
             )}
          </div>

          {results.length > 0 ? (
            activeTab === 'selected' && displayedResults.length === 0 ? (
               <div className="flex-1 bg-white border border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center text-center p-8 text-gray-400">
                  <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                      <CheckSquare className="w-8 h-8 text-gray-300" />
                  </div>
                  <p className="max-w-md">
                    No items selected.
                    <br/><span className="text-sm text-gray-400 mt-2 block">Switch to "All Files" and select an item to export.</span>
                  </p>
               </div>
            ) : (
              <div className="flex flex-col gap-6">
                <ResultsTable 
                  data={displayedResults} 
                  fields={fields} 
                  selectedIds={selectedIds}
                  onSelect={handleSelect}
                  onSelectAll={handleSelectAll}
                  onUpdateData={handleDataUpdate}
                  onReorderFields={handleReorderFields}
                />
                
                {selectedIds.size > 0 && (
                  <ExcelSummary 
                    data={results}
                    selectedIds={selectedIds}
                    fields={fields}
                  />
                )}
              </div>
            )
          ) : (
            <div className="flex-1 bg-white border border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center text-center p-8 text-gray-400">
               <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                  <RefreshCw className="w-8 h-8 text-gray-300" />
               </div>
               <p className="max-w-md">
                 Upload PDFs and click "Start Extraction" to see results here.
                 <br/><span className="text-sm text-gray-400 mt-2 block">AI will automatically identify and extract the configured fields.</span>
               </p>
            </div>
          )}
        </div>

      </main>
    </div>
  );
}