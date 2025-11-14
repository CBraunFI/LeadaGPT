import mammoth from 'mammoth';

// pdf-parse is a CommonJS module, use require
// @ts-ignore
const pdf = require('pdf-parse');

export interface ExtractionResult {
  text: string;
  pageCount?: number;
  wordCount?: number;
  error?: string;
}

/**
 * Extract text from a PDF buffer
 */
export const extractTextFromPDF = async (buffer: Buffer): Promise<ExtractionResult> => {
  try {
    const data = await pdf(buffer);

    return {
      text: data.text,
      pageCount: data.numpages,
      wordCount: data.text.split(/\s+/).length,
    };
  } catch (error) {
    console.error('PDF extraction error:', error);
    return {
      text: '',
      error: error instanceof Error ? error.message : 'Fehler beim Extrahieren des PDF-Texts',
    };
  }
};

/**
 * Extract text from a DOCX buffer
 */
export const extractTextFromDOCX = async (buffer: Buffer): Promise<ExtractionResult> => {
  try {
    const result = await mammoth.extractRawText({ buffer });
    const text = result.value;

    return {
      text,
      wordCount: text.split(/\s+/).length,
    };
  } catch (error) {
    console.error('DOCX extraction error:', error);
    return {
      text: '',
      error: error instanceof Error ? error.message : 'Fehler beim Extrahieren des DOCX-Texts',
    };
  }
};

/**
 * Extract text from a plain text buffer
 */
export const extractTextFromTXT = async (buffer: Buffer): Promise<ExtractionResult> => {
  try {
    const text = buffer.toString('utf-8');

    return {
      text,
      wordCount: text.split(/\s+/).length,
    };
  } catch (error) {
    console.error('TXT extraction error:', error);
    return {
      text: '',
      error: error instanceof Error ? error.message : 'Fehler beim Lesen der Textdatei',
    };
  }
};

/**
 * Extract text from any supported file type
 */
export const extractText = async (buffer: Buffer, fileType: string): Promise<ExtractionResult> => {
  const normalizedType = fileType.toLowerCase();

  switch (normalizedType) {
    case 'pdf':
      return extractTextFromPDF(buffer);
    case 'docx':
    case 'doc':
      return extractTextFromDOCX(buffer);
    case 'txt':
      return extractTextFromTXT(buffer);
    default:
      return {
        text: '',
        error: `Nicht unterstütztes Dateiformat: ${fileType}`,
      };
  }
};

/**
 * Validate if file type is supported
 */
export const isSupportedFileType = (mimetype: string): boolean => {
  const supportedTypes = [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/msword',
    'text/plain',
  ];

  return supportedTypes.includes(mimetype);
};

/**
 * Get file extension from mimetype
 */
export const getFileExtension = (mimetype: string): string => {
  const mimetypeMap: Record<string, string> = {
    'application/pdf': 'pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
    'application/msword': 'doc',
    'text/plain': 'txt',
  };

  return mimetypeMap[mimetype] || 'unknown';
};
