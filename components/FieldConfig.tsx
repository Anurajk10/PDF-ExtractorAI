import React, { useState } from 'react';
import { Plus, X, List } from 'lucide-react';

interface FieldConfigProps {
  fields: string[];
  setFields: (fields: string[]) => void;
  disabled?: boolean;
}

export const FieldConfig: React.FC<FieldConfigProps> = ({ fields, setFields, disabled }) => {
  const [newField, setNewField] = useState('');

  const handleAddField = () => {
    if (newField.trim() && !fields.includes(newField.trim())) {
      setFields([...fields, newField.trim()]);
      setNewField('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddField();
    }
  };

  const removeField = (fieldToRemove: string) => {
    setFields(fields.filter(f => f !== fieldToRemove));
  };

  // Predefined templates for common use cases
  const applyTemplate = (type: 'invoice' | 'job_invoice' | 'resume' | 'id_card') => {
    switch(type) {
      case 'invoice':
        setFields(['Invoice Number', 'Date', 'Total Amount', 'Vendor Name', 'Tax Amount']);
        break;
      case 'job_invoice':
        setFields(['Customer', 'Job No', 'Advance Total', 'Payment Terms', 'Invoice date', 'Grand Total']);
        break;
      case 'resume':
        setFields(['Full Name', 'Email', 'Phone', 'Skills', 'Recent Experience']);
        break;
      case 'id_card':
        setFields(['ID Number', 'Name', 'Date of Birth', 'Expiry Date', 'Address']);
        break;
    }
  };

  return (
    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <List className="w-5 h-5 text-brand-600" />
        <h2 className="text-lg font-semibold text-gray-900">Fields to Extract</h2>
      </div>
      
      <p className="text-sm text-gray-500">
        Define exactly what data columns you want to generate in your Excel file.
      </p>

      {!disabled && (
        <div className="flex flex-wrap gap-2 mb-4">
          <span className="text-xs font-medium text-gray-500 self-center mr-2">Quick Templates:</span>
          <button onClick={() => applyTemplate('invoice')} className="text-xs px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full transition">Basic Invoice</button>
          <button onClick={() => applyTemplate('job_invoice')} className="text-xs px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full transition">Job Invoice</button>
          <button onClick={() => applyTemplate('resume')} className="text-xs px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full transition">Resumes</button>
          <button onClick={() => applyTemplate('id_card')} className="text-xs px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full transition">IDs</button>
        </div>
      )}

      <div className="flex gap-2">
        <input
          type="text"
          value={newField}
          onChange={(e) => setNewField(e.target.value)}
          onKeyDown={handleKeyPress}
          placeholder="e.g. Invoice Date"
          disabled={disabled}
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none disabled:bg-gray-50"
        />
        <button
          onClick={handleAddField}
          disabled={!newField.trim() || disabled}
          className="px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> Add
        </button>
      </div>

      <div className="flex flex-wrap gap-2 min-h-[40px]">
        {fields.length === 0 && (
          <div className="text-sm text-gray-400 italic py-2">No fields added yet. Add fields to start extraction.</div>
        )}
        {fields.map(field => (
          <span 
            key={field} 
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-brand-50 text-brand-700 rounded-lg text-sm font-medium border border-brand-100"
          >
            {field}
            {!disabled && (
              <button onClick={() => removeField(field)} className="hover:text-brand-900">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </span>
        ))}
      </div>
    </div>
  );
};