import fs from 'fs';
import path from 'path';
import mammoth from 'mammoth';
import * as pdfParseModule from 'pdf-parse';
const pdfParse: any = (pdfParseModule as any).default || pdfParseModule;




export interface ExtractedDocument {
  text: string;
  wordCount: number;
  charCount: number;
  fileName: string;
  fileType: 'txt' | 'docx' | 'pdf';
  pages?: number;
}

/**
 * Extract clean readable text from supported document files (TXT, DOCX, PDF)
 */
export async function extractTextFromDocument(
  filePath: string,
  originalFilename: string
): Promise<ExtractedDocument> {
  const ext = path.extname(originalFilename).toLowerCase();
  let text = '';
  let pages: number | undefined;

  if (ext === '.txt' || ext === '.md' || ext === '.csv') {
    text = fs.readFileSync(filePath, 'utf-8');
  } else if (ext === '.docx') {
    const result = await mammoth.extractRawText({ path: filePath });
    text = result.value || '';
  } else if (ext === '.pdf') {
    const dataBuffer = fs.readFileSync(filePath);
    // pdf-parse extracts text with page indicators
    const data = await (pdfParse as any)(dataBuffer);
    text = data.text || '';
    pages = data.numpages;
  } else {
    throw new Error(`असमर्थित फाइल ढाँचा (${ext})। केवल TXT, DOCX, वा PDF फाइलहरू समर्थित छन्।`);
  }

  // Normalize excessive whitespace and line feeds while preserving paragraphs
  const cleanText = text
    .replace(/\r\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  const words = cleanText.length > 0 ? cleanText.trim().split(/\s+/).length : 0;

  return {
    text: cleanText,
    wordCount: words,
    charCount: cleanText.length,
    fileName: originalFilename,
    fileType: (ext.replace('.', '') as 'txt' | 'docx' | 'pdf') || 'txt',
    pages,
  };
}
