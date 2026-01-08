import { GoogleGenAI, Type } from "@google/genai";

const API_KEY = process.env.API_KEY || '';

// Helper to convert File to Base64
const fileToGenerativePart = async (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      // Remove data url prefix (e.g. "data:application/pdf;base64,")
      const base64Content = base64String.split(',')[1];
      resolve(base64Content);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

export const extractDataFromPdf = async (
  file: File, 
  fields: string[]
): Promise<Record<string, string | number | null>> => {
  if (!API_KEY) {
    throw new Error("API Key is missing");
  }

  const ai = new GoogleGenAI({ apiKey: API_KEY });
  const base64Data = await fileToGenerativePart(file);

  const prompt = `
    Analyze the attached PDF document.
    Extract the following specific data points: ${fields.join(', ')}.
    Return the result as a clean JSON object where keys are the field names requested and values are the extracted data.
    If a field is not found, use null.
    Format dates as YYYY-MM-DD if applicable.
    Do not nest the JSON, keep it flat.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: 'application/pdf',
              data: base64Data
            }
          },
          { text: prompt }
        ]
      },
      config: {
        responseMimeType: 'application/json',
        // We use a loose schema here to allow dynamic field names based on user input,
        // but strictly enforcing an object return type.
        responseSchema: {
          type: Type.OBJECT,
          properties: fields.reduce((acc, field) => {
            acc[field] = { type: Type.STRING, nullable: true }; // defaulting to string for flexibility
            return acc;
          }, {} as Record<string, any>),
        }
      }
    });

    const text = response.text;
    if (!text) return {};
    
    return JSON.parse(text);
  } catch (error) {
    console.error("Gemini Extraction Error:", error);
    throw error;
  }
};