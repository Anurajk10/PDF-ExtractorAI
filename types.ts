export interface ExtractedData {
  id: string;
  fileName: string;
  status: 'pending' | 'processing' | 'success' | 'error';
  data?: Record<string, string | number | null>;
  error?: string;
}

export interface ExtractionConfig {
  fields: string[];
}

export type ProcessingStatus = 'idle' | 'extracting' | 'completed';