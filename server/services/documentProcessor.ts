import mammoth from 'mammoth';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { VietnameseNormalizer } from './vietnameseNormalizer';
import fs from 'fs/promises';
import path from 'path';
import archiver from 'archiver';
import { Readable } from 'stream';

export interface ProcessingProgress {
  totalPages: number;
  processedPages: number;
  extractedCount: number;
  errorCount: number;
  currentStatus: string;
}

export interface ExtractionResult {
  fullName: string;
  code: string;
  content: string;
  pageNumber: number;
}

export class DocumentProcessor {
  private progressCallback?: (progress: ProcessingProgress) => void;

  constructor(progressCallback?: (progress: ProcessingProgress) => void) {
    this.progressCallback = progressCallback;
  }

  async processWordDocument(filePath: string, outputDir: string): Promise<ExtractionResult[]> {
    try {
      // Read the Word document
      const fileBuffer = await fs.readFile(filePath);
      
      // Convert to HTML to analyze structure
      const result = await mammoth.convertToHtml({
        buffer: fileBuffer,
        options: {
          includeEmbeddedStyleMap: true,
          includeDefaultStyleMap: true,
        }
      });

      const htmlContent = result.value;
      
      // Split content by page breaks or logical sections
      const sections = this.splitDocumentSections(htmlContent);
      
      const extractedResults: ExtractionResult[] = [];
      let processedCount = 0;
      let errorCount = 0;

      this.updateProgress({
        totalPages: sections.length,
        processedPages: 0,
        extractedCount: 0,
        errorCount: 0,
        currentStatus: 'Bắt đầu xử lý tài liệu...'
      });

      for (let i = 0; i < sections.length; i++) {
        const section = sections[i];
        
        this.updateProgress({
          totalPages: sections.length,
          processedPages: i,
          extractedCount: extractedResults.length,
          errorCount,
          currentStatus: `Đang xử lý phần ${i + 1}/${sections.length}...`
        });

        try {
          const extractedData = VietnameseNormalizer.extractNameAndCode(section);
          
          if (extractedData) {
            extractedResults.push({
              ...extractedData,
              content: section,
              pageNumber: i + 1,
            });
          } else {
            errorCount++;
          }
        } catch (error) {
          console.error(`Error processing section ${i + 1}:`, error);
          errorCount++;
        }

        processedCount++;
      }

      this.updateProgress({
        totalPages: sections.length,
        processedPages: processedCount,
        extractedCount: extractedResults.length,
        errorCount,
        currentStatus: 'Hoàn tất xử lý tài liệu'
      });

      return extractedResults;
    } catch (error) {
      console.error('Error processing Word document:', error);
      throw new Error(`Lỗi xử lý tài liệu: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private splitDocumentSections(htmlContent: string): string[] {
    // Split by page breaks or recurring patterns
    const pageBreakSplits = htmlContent.split(/<w:br\s+w:type="page"|<div[^>]*page-break/i);
    
    if (pageBreakSplits.length > 1) {
      return pageBreakSplits.filter(section => section.trim().length > 100);
    }

    // If no page breaks, try to split by recurring patterns
    const namePatternSplits = htmlContent.split(/(?=(?:họ\s*và\s*tên|ho\s*va\s*ten)\s*[:\-])/gi);
    
    if (namePatternSplits.length > 1) {
      return namePatternSplits.filter(section => section.trim().length > 100);
    }

    // If no clear patterns, split by large chunks
    const chunkSize = Math.ceil(htmlContent.length / Math.max(1, htmlContent.length / 5000));
    const chunks: string[] = [];
    
    for (let i = 0; i < htmlContent.length; i += chunkSize) {
      chunks.push(htmlContent.slice(i, i + chunkSize));
    }

    return chunks.filter(chunk => chunk.trim().length > 100);
  }

  async generateIndividualFiles(
    results: ExtractionResult[],
    outputDir: string,
    format: 'docx' | 'pdf' = 'docx'
  ): Promise<{ filename: string; filePath: string; size: number }[]> {
    await fs.mkdir(outputDir, { recursive: true });
    
    const generatedFiles: { filename: string; filePath: string; size: number }[] = [];

    for (const result of results) {
      try {
        const filename = VietnameseNormalizer.generateFilename(result.code, result.fullName, format);
        const filePath = path.join(outputDir, filename);

        if (format === 'docx') {
          await this.generateWordFile(result, filePath);
        } else {
          await this.generatePdfFile(result, filePath);
        }

        const stats = await fs.stat(filePath);
        generatedFiles.push({
          filename,
          filePath,
          size: stats.size,
        });
      } catch (error) {
        console.error(`Error generating file for ${result.fullName}:`, error);
      }
    }

    return generatedFiles;
  }

  private async generateWordFile(result: ExtractionResult, outputPath: string): Promise<void> {
    // For Word file generation, we'll create a simplified HTML-based approach
    // In a production environment, you might want to use a more sophisticated library
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Kết quả xét nghiệm - ${result.fullName}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          .header { border-bottom: 2px solid #333; padding-bottom: 10px; margin-bottom: 20px; }
          .content { line-height: 1.6; }
        </style>
      </head>
      <body>
        <div class="header">
          <h2>Kết quả xét nghiệm</h2>
          <p><strong>Họ và tên:</strong> ${result.fullName}</p>
          <p><strong>Mã số:</strong> ${result.code}</p>
        </div>
        <div class="content">
          ${result.content}
        </div>
      </body>
      </html>
    `;

    // Save as HTML with .docx extension (Word can open HTML files)
    await fs.writeFile(outputPath, htmlContent, 'utf-8');
  }

  private async generatePdfFile(result: ExtractionResult, outputPath: string): Promise<void> {
    const pdfDoc = await PDFDocument.create();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    
    const page = pdfDoc.addPage();
    const { width, height } = page.getSize();
    
    // Header
    page.drawText('Kết quả xét nghiệm', {
      x: 50,
      y: height - 50,
      size: 18,
      font,
      color: rgb(0, 0, 0),
    });

    page.drawText(`Họ và tên: ${result.fullName}`, {
      x: 50,
      y: height - 80,
      size: 12,
      font,
      color: rgb(0, 0, 0),
    });

    page.drawText(`Mã số: ${result.code}`, {
      x: 50,
      y: height - 100,
      size: 12,
      font,
      color: rgb(0, 0, 0),
    });

    // Content (simplified - in production you'd want better text wrapping)
    const cleanContent = result.content.replace(/<[^>]*>/g, '').substring(0, 1000);
    const lines = this.wrapText(cleanContent, 70);
    
    let currentY = height - 140;
    for (const line of lines.slice(0, 30)) { // Limit to prevent overflow
      page.drawText(line, {
        x: 50,
        y: currentY,
        size: 10,
        font,
        color: rgb(0, 0, 0),
      });
      currentY -= 15;
    }

    const pdfBytes = await pdfDoc.save();
    await fs.writeFile(outputPath, pdfBytes);
  }

  private wrapText(text: string, maxLength: number): string[] {
    const words = text.split(' ');
    const lines: string[] = [];
    let currentLine = '';

    for (const word of words) {
      if ((currentLine + word).length <= maxLength) {
        currentLine += (currentLine ? ' ' : '') + word;
      } else {
        if (currentLine) lines.push(currentLine);
        currentLine = word;
      }
    }

    if (currentLine) lines.push(currentLine);
    return lines;
  }

  async createZipArchive(filesDir: string, outputPath: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const output = require('fs').createWriteStream(outputPath);
      const archive = archiver('zip', { zlib: { level: 9 } });

      output.on('close', () => resolve());
      archive.on('error', (err) => reject(err));

      archive.pipe(output);
      archive.directory(filesDir, false);
      archive.finalize();
    });
  }

  private updateProgress(progress: ProcessingProgress): void {
    if (this.progressCallback) {
      this.progressCallback(progress);
    }
  }
}
