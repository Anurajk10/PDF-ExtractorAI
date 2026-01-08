import React, { useMemo, useState } from 'react';
import { ExtractedData } from '../types';
import { FileSpreadsheet, Calculator } from 'lucide-react';

interface ExcelSummaryProps {
  data: ExtractedData[];
  selectedIds: Set<string>;
  fields: string[];
}

export const ExcelSummary: React.FC<ExcelSummaryProps> = ({ data, selectedIds, fields }) => {
  // Local state for the editable columns
  const [summaryData, setSummaryData] = useState<Record<string, { finalTotal: string, notes: string }>>({});

  const summaryRows = useMemo(() => {
    // 1. Filter selected data that is successfully extracted
    const selectedItems = data.filter(item => selectedIds.has(item.id) && item.status === 'success' && item.data);

    if (selectedItems.length === 0) return [];

    // 2. Identify fields dynamically based on requested columns
    const findField = (patterns: RegExp[]) => 
        fields.find(f => patterns.some(p => p.test(f.toLowerCase())));

    const customerField = findField([/customer/i, /name/i, /client/i]) || fields[0];
    const jobField = findField([/job no/i, /job/i, /number/i]);
    const advanceField = findField([/advance total/i, /advance/i]);
    const termsField = findField([/payment terms/i, /terms/i, /payment/i]);
    const dateField = findField([/invoice date/i, /date/i]);
    const grandTotalField = findField([/grand total/i, /total amount/i, /total/i, /amount/i]);

    // 3. Group by Customer (Normalized)
    const groups: Record<string, {
      customerName: string;
      jobNos: Set<string>;
      advanceTotals: Set<string>;
      paymentTerms: Set<string>;
      invoiceDates: Set<string>;
      grandTotals: Set<string>;
      files: string[];
      ids: string[];
    }> = {};

    selectedItems.forEach(item => {
      const customerVal = item.data?.[customerField];
      // Use a consistent key for grouping (lowercase, trimmed)
      const customerKey = String(customerVal || 'Unknown').trim(); 
      const normalizedKey = customerKey.toLowerCase();
      
      if (!groups[normalizedKey]) {
        groups[normalizedKey] = {
          customerName: String(customerVal || 'Unknown'), 
          jobNos: new Set(),
          advanceTotals: new Set(),
          paymentTerms: new Set(),
          invoiceDates: new Set(),
          grandTotals: new Set(),
          files: [],
          ids: []
        };
      }
      
      const addToSet = (set: Set<string>, field: string | undefined) => {
        if (field && item.data?.[field]) {
          set.add(String(item.data[field]));
        }
      };

      addToSet(groups[normalizedKey].jobNos, jobField);
      addToSet(groups[normalizedKey].advanceTotals, advanceField);
      addToSet(groups[normalizedKey].paymentTerms, termsField);
      addToSet(groups[normalizedKey].invoiceDates, dateField);
      addToSet(groups[normalizedKey].grandTotals, grandTotalField);

      groups[normalizedKey].files.push(item.fileName);
      groups[normalizedKey].ids.push(item.id);
    });

    return Object.entries(groups).map(([key, group]) => ({
      key,
      customerName: group.customerName,
      jobNos: group.jobNos.size > 0 ? Array.from(group.jobNos).join(', ') : '-',
      advanceTotal: group.advanceTotals.size > 0 ? Array.from(group.advanceTotals).join(', ') : '-',
      paymentTerms: group.paymentTerms.size > 0 ? Array.from(group.paymentTerms).join(', ') : '-',
      invoiceDate: group.invoiceDates.size > 0 ? Array.from(group.invoiceDates).join(', ') : '-',
      grandTotal: group.grandTotals.size > 0 ? Array.from(group.grandTotals).join(', ') : '-',
      fileCount: group.files.length,
      ids: group.ids
    }));

  }, [data, selectedIds, fields]);

  const handleEditChange = (key: string, field: 'finalTotal' | 'notes', value: string) => {
    setSummaryData(prev => ({
      ...prev,
      [key]: {
        ...prev[key] || { finalTotal: '', notes: '' },
        [field]: value
      }
    }));
  };

  if (summaryRows.length === 0) return null;

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col mt-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="p-4 border-b border-gray-200 bg-emerald-50 flex items-center gap-2">
        <FileSpreadsheet className="w-5 h-5 text-emerald-700" />
        <div>
          <h2 className="font-semibold text-emerald-900">Excel Summary & Master Records</h2>
          <p className="text-xs text-emerald-600">Auto-grouped by Customer • Review consolidated data</p>
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left border-collapse min-w-[1000px]">
          <thead className="bg-gray-50 text-gray-600 font-medium border-b border-gray-200">
             <tr>
                <th className="p-3 border-r border-gray-200 min-w-[200px]">Customer</th>
                <th className="p-3 border-r border-gray-200 min-w-[120px]">Job No</th>
                <th className="p-3 border-r border-gray-200 min-w-[120px]">Advance Total</th>
                <th className="p-3 border-r border-gray-200 min-w-[150px]">Payment Terms</th>
                <th className="p-3 border-r border-gray-200 min-w-[120px]">Invoice Date</th>
                <th className="p-3 border-r border-gray-200 min-w-[120px]">Grand Total</th>
                <th className="p-0 border-r border-gray-200 w-32 bg-yellow-50/50">
                  <div className="p-3 flex items-center gap-1">
                    Verified Total <Calculator className="w-3 h-3 text-gray-400" />
                  </div>
                </th>
                <th className="p-3 min-w-[200px] bg-yellow-50/50">Notes</th>
             </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {summaryRows.map((row) => (
              <tr key={row.key} className="hover:bg-gray-50 transition-colors">
                 <td className="p-3 border-r border-gray-200 font-medium text-gray-900 align-top">
                    {row.customerName}
                    <div className="text-xs text-gray-400 mt-1">{row.fileCount} file(s)</div>
                 </td>
                 <td className="p-3 border-r border-gray-200 text-gray-600 align-top whitespace-pre-wrap">{row.jobNos}</td>
                 <td className="p-3 border-r border-gray-200 text-gray-600 align-top whitespace-pre-wrap">{row.advanceTotal}</td>
                 <td className="p-3 border-r border-gray-200 text-gray-600 align-top whitespace-pre-wrap">{row.paymentTerms}</td>
                 <td className="p-3 border-r border-gray-200 text-gray-600 align-top whitespace-pre-wrap">{row.invoiceDate}</td>
                 <td className="p-3 border-r border-gray-200 text-gray-900 font-medium align-top whitespace-pre-wrap">{row.grandTotal}</td>
                 
                 {/* Manual Input Columns */}
                 <td className="p-0 border-r border-gray-200 relative align-top">
                    <input 
                      type="text"
                      className="w-full h-full min-h-[4rem] p-3 bg-yellow-50/30 focus:bg-white focus:ring-2 focus:ring-inset focus:ring-brand-500 outline-none text-right font-mono text-gray-700"
                      placeholder="0.00"
                      value={summaryData[row.key]?.finalTotal || ''}
                      onChange={(e) => handleEditChange(row.key, 'finalTotal', e.target.value)}
                    />
                 </td>
                 <td className="p-0 relative align-top">
                    <textarea 
                      className="w-full h-full min-h-[4rem] p-3 bg-yellow-50/30 focus:bg-white focus:ring-2 focus:ring-inset focus:ring-brand-500 outline-none resize-none text-gray-700"
                      placeholder="Add notes..."
                      value={summaryData[row.key]?.notes || ''}
                      onChange={(e) => handleEditChange(row.key, 'notes', e.target.value)}
                    />
                 </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};