import React, { useMemo, useState } from 'react';
import { ExtractedData } from '../types';
import { Check, AlertCircle, Loader2, FileText, GripVertical, Copy } from 'lucide-react';

interface ResultsTableProps {
  data: ExtractedData[];
  fields: string[];
  selectedIds: Set<string>;
  onSelect: (id: string) => void;
  onSelectAll: (ids: string[], shouldSelect: boolean) => void;
  onUpdateData: (id: string, field: string, value: string) => void;
  onReorderFields: (newFields: string[]) => void;
}

const CellCopyButton = ({ value }: { value: string }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!value) return;
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      type="button"
      className={`absolute right-1 top-1/2 -translate-y-1/2 p-1.5 rounded-md transition-all duration-200 focus:outline-none z-20
        ${copied 
          ? 'bg-green-50 text-green-600 opacity-100 scale-100' 
          : 'bg-white text-gray-400 opacity-0 group-hover/cell:opacity-100 hover:text-brand-600 hover:bg-brand-50 hover:border-brand-200 shadow-sm border border-gray-200 scale-90 hover:scale-100'
        }
      `}
      title="Copy to clipboard"
    >
      {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
    </button>
  );
};

export const ResultsTable: React.FC<ResultsTableProps> = ({
  data,
  fields,
  selectedIds,
  onSelect,
  onSelectAll,
  onUpdateData,
  onReorderFields
}) => {
  const [filter, setFilter] = useState('');
  const [columnFilters, setColumnFilters] = useState<Record<string, string>>({});
  const [draggingField, setDraggingField] = useState<string | null>(null);

  // We only show items that are processing or done
  const visibleData = useMemo(() => {
    return data.filter(item => {
      // Global filter for filename
      const matchesFilename = item.fileName.toLowerCase().includes(filter.toLowerCase());
      
      // Column specific filters
      const matchesColumns = fields.every(field => {
        const query = columnFilters[field]?.toLowerCase();
        if (!query) return true;
        
        const value = item.data?.[field];
        const strValue = value === null || value === undefined ? '' : String(value).toLowerCase();
        return strValue.includes(query);
      });

      return matchesFilename && matchesColumns;
    });
  }, [data, filter, columnFilters, fields]);

  const visibleIds = visibleData.map(item => item.id);
  const allSelected = visibleIds.length > 0 && visibleIds.every(id => selectedIds.has(id));
  const isIndeterminate = visibleIds.some(id => selectedIds.has(id)) && !allSelected;

  const handleDragStart = (e: React.DragEvent, field: string) => {
    setDraggingField(field);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, field: string) => {
    e.preventDefault(); // Necessary to allow dropping
    if (draggingField && draggingField !== field) {
      // Optional: Add drop target styling logic here if needed
    }
  };

  const handleDrop = (e: React.DragEvent, targetField: string) => {
    e.preventDefault();
    if (!draggingField || draggingField === targetField) return;

    const fromIndex = fields.indexOf(draggingField);
    const toIndex = fields.indexOf(targetField);

    if (fromIndex !== -1 && toIndex !== -1) {
      const newFields = [...fields];
      newFields.splice(fromIndex, 1);
      newFields.splice(toIndex, 0, draggingField);
      onReorderFields(newFields);
    }
    setDraggingField(null);
  };

  const handleColumnFilterChange = (field: string, value: string) => {
    setColumnFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  if (data.length === 0) return null;

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col h-full">
      <div className="p-4 border-b border-gray-200 flex items-center justify-between gap-4">
        <h2 className="font-semibold text-gray-900 flex items-center gap-2">
          <FileText className="w-4 h-4 text-brand-600" />
          Extracted Data
          <span className="text-xs font-normal text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
             {visibleData.filter(i => i.status === 'success').length} / {data.length}
          </span>
        </h2>
        <input
          type="text"
          placeholder="Filter by filename..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="text-sm border border-gray-300 rounded-md px-3 py-1.5 focus:outline-none focus:border-brand-500 w-64"
        />
      </div>

      <div className="overflow-x-auto flex-1">
        <table className="w-full text-sm text-left border-collapse">
          <thead className="bg-gray-50 text-gray-600 font-medium border-b border-gray-200 sticky top-0 z-10 shadow-sm">
            <tr>
              <th className="p-4 w-16 bg-gray-50 text-center align-top">
                <div className="flex flex-col items-center gap-2">
                  <span className="text-xs font-semibold block pt-1">Select</span>
                  <input
                    type="checkbox"
                    checked={allSelected}
                    ref={(input) => { if (input) input.indeterminate = isIndeterminate; }}
                    onChange={(e) => onSelectAll(visibleIds, e.target.checked)}
                    className="w-4 h-4 text-brand-600 border-gray-300 rounded focus:ring-brand-500 cursor-pointer"
                  />
                </div>
              </th>
              <th className="p-4 w-48 bg-gray-50 align-top">
                <span className="block pt-1">File Name</span>
              </th>
              <th className="p-4 w-32 bg-gray-50 align-top">
                <span className="block pt-1">Status</span>
              </th>
              {fields.map(field => (
                <th 
                  key={field} 
                  draggable
                  onDragStart={(e) => handleDragStart(e, field)}
                  onDragOver={(e) => handleDragOver(e, field)}
                  onDrop={(e) => handleDrop(e, field)}
                  className={`p-4 min-w-[200px] bg-gray-50 cursor-move transition-colors hover:bg-gray-100 align-top ${draggingField === field ? 'bg-gray-200 opacity-50' : ''}`}
                >
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                      <GripVertical className="w-3 h-3 text-gray-400" />
                      <span className="truncate" title={field}>{field}</span>
                    </div>
                    <input
                      type="text"
                      placeholder={`Filter...`}
                      value={columnFilters[field] || ''}
                      onChange={(e) => handleColumnFilterChange(field, e.target.value)}
                      // Prevent drag interactions when interacting with the input
                      onDragStart={(e) => e.stopPropagation()}
                      onMouseDown={(e) => e.stopPropagation()}
                      className="w-full text-xs border border-gray-300 rounded px-2 py-1.5 font-normal focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 bg-white"
                    />
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {visibleData.map((row) => (
              <tr 
                key={row.id} 
                className={`group hover:bg-gray-50 transition-colors ${selectedIds.has(row.id) ? 'bg-brand-50 shadow-sm border-l-4 border-l-brand-500' : 'border-l-4 border-l-transparent'}`}
                onClick={() => onSelect(row.id)}
              >
                <td className="p-4 text-center">
                  <div className="flex items-center justify-center">
                    <input
                      type="checkbox"
                      name="row-selection"
                      checked={selectedIds.has(row.id)}
                      onChange={() => onSelect(row.id)}
                      onClick={(e) => e.stopPropagation()}
                      className="w-4 h-4 text-brand-600 border-gray-300 rounded focus:ring-brand-500 cursor-pointer"
                    />
                  </div>
                </td>
                <td className="p-4 font-medium text-gray-900 truncate max-w-[200px] relative group/cell" title={row.fileName}>
                   <div className="relative pr-8">
                      {row.fileName}
                      <CellCopyButton value={row.fileName} />
                   </div>
                </td>
                <td className="p-4">
                  {row.status === 'processing' && (
                    <span className="inline-flex items-center gap-1.5 text-brand-600 bg-brand-50 px-2 py-1 rounded text-xs font-medium">
                      <Loader2 className="w-3 h-3 animate-spin" /> Processing
                    </span>
                  )}
                  {row.status === 'success' && (
                    <span className="inline-flex items-center gap-1.5 text-green-600 bg-green-50 px-2 py-1 rounded text-xs font-medium">
                      <Check className="w-3 h-3" /> Done
                    </span>
                  )}
                  {row.status === 'error' && (
                    <span className="inline-flex items-center gap-1.5 text-red-600 bg-red-50 px-2 py-1 rounded text-xs font-medium" title={row.error}>
                      <AlertCircle className="w-3 h-3" /> Failed
                    </span>
                  )}
                   {row.status === 'pending' && (
                    <span className="inline-flex items-center gap-1.5 text-gray-500 bg-gray-100 px-2 py-1 rounded text-xs font-medium">
                      Pending
                    </span>
                  )}
                </td>
                {fields.map(field => {
                  const val = row.data?.[field];
                  const displayValue = val === null || val === undefined ? '' : val.toString();
                  const isEditable = row.status === 'success';

                  return (
                    <td key={field} className="p-2 border-l border-transparent group-hover:border-gray-100 relative group/cell">
                       <div className="relative w-full h-full">
                          {isEditable ? (
                            <input
                              type="text"
                              value={displayValue}
                              onChange={(e) => onUpdateData(row.id, field, e.target.value)}
                              className="w-full bg-transparent border border-transparent hover:border-gray-300 focus:bg-white focus:border-brand-500 focus:ring-1 focus:ring-brand-500 rounded px-2 py-1 text-gray-700 transition-all text-sm truncate focus:truncate-0 pr-8"
                              placeholder="-"
                              onClick={(e) => e.stopPropagation()} 
                            />
                          ) : (
                            <span className="text-gray-300 px-2 block w-full">...</span>
                          )}
                          {displayValue && <CellCopyButton value={displayValue} />}
                       </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};