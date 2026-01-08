import * as XLSX from 'xlsx';
import { ExtractedData } from '../types';

export const exportToExcel = (data: ExtractedData[], selectedIds?: Set<string>, filename = 'extracted_data.xlsx') => {
  // Filter only selected and successfully extracted items
  const exportableData = data
    .filter(item => {
      const isSuccess = item.status === 'success' && item.data;
      if (!isSuccess) return false;
      return selectedIds ? selectedIds.has(item.id) : true;
    })
    .map(item => ({
      FileName: item.fileName, // Add filename as the first column
      ...item.data
    }));

  if (exportableData.length === 0) {
    alert("No data available to export.");
    return;
  }

  const worksheet = XLSX.utils.json_to_sheet(exportableData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Extracted Data");
  
  XLSX.writeFile(workbook, filename);
};