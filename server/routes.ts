import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import multer from "multer";
import path from "path";
import fs from "fs/promises";
import { DocumentProcessor } from "./services/documentProcessor";
import { insertUploadedFileSchema, insertProcessingJobSchema } from "@shared/schema";

// Configure multer for file uploads
const upload = multer({
  dest: 'uploads/',
  limits: {
    fileSize: 500 * 1024 * 1024, // 500MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      cb(null, true);
    } else {
      cb(new Error('Only .docx files are allowed'));
    }
  },
});

export async function registerRoutes(app: Express): Promise<Server> {
  // File upload endpoint
  app.post('/api/upload', upload.single('file'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
      }

      const fileData = insertUploadedFileSchema.parse({
        filename: req.file.filename,
        originalName: req.file.originalname,
        filePath: req.file.path,
        fileSize: req.file.size,
        mimeType: req.file.mimetype,
        status: 'uploaded',
      });

      const uploadedFile = await storage.createUploadedFile(fileData);
      
      // Start processing in background
      setImmediate(async () => {
        await processDocument(uploadedFile.id);
      });

      res.json({ 
        message: 'File uploaded successfully',
        fileId: uploadedFile.id,
        file: uploadedFile 
      });
    } catch (error) {
      console.error('Upload error:', error);
      res.status(500).json({ message: 'Upload failed', error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  // Get uploaded files
  app.get('/api/files', async (req, res) => {
    try {
      const files = await storage.getUploadedFiles();
      res.json(files);
    } catch (error) {
      console.error('Error fetching files:', error);
      res.status(500).json({ message: 'Failed to fetch files' });
    }
  });

  // Get processing jobs
  app.get('/api/processing-jobs', async (req, res) => {
    try {
      const jobs = await storage.getProcessingJobs();
      res.json(jobs);
    } catch (error) {
      console.error('Error fetching processing jobs:', error);
      res.status(500).json({ message: 'Failed to fetch processing jobs' });
    }
  });

  // Get processing job by ID
  app.get('/api/processing-jobs/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const job = await storage.getProcessingJob(id);
      
      if (!job) {
        return res.status(404).json({ message: 'Processing job not found' });
      }

      res.json(job);
    } catch (error) {
      console.error('Error fetching processing job:', error);
      res.status(500).json({ message: 'Failed to fetch processing job' });
    }
  });

  // Get extracted results
  app.get('/api/results', async (req, res) => {
    try {
      const { search } = req.query;
      let results;

      if (search && typeof search === 'string') {
        results = await storage.searchExtractedResults(search);
      } else {
        results = await storage.getExtractedResults();
      }

      res.json(results);
    } catch (error) {
      console.error('Error fetching results:', error);
      res.status(500).json({ message: 'Failed to fetch results' });
    }
  });

  // Get results by job ID
  app.get('/api/results/job/:jobId', async (req, res) => {
    try {
      const jobId = parseInt(req.params.jobId);
      const results = await storage.getExtractedResultsByJob(jobId);
      res.json(results);
    } catch (error) {
      console.error('Error fetching results by job:', error);
      res.status(500).json({ message: 'Failed to fetch results' });
    }
  });

  // Download single file
  app.get('/api/download/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const result = await storage.getExtractedResults();
      const file = result.find(r => r.id === id);

      if (!file) {
        return res.status(404).json({ message: 'File not found' });
      }

      res.download(file.filePath, file.normalizedFilename);
    } catch (error) {
      console.error('Download error:', error);
      res.status(500).json({ message: 'Download failed' });
    }
  });

  // Download job results as ZIP
  app.get('/api/download-zip/:jobId', async (req, res) => {
    try {
      const jobId = parseInt(req.params.jobId);
      const results = await storage.getExtractedResultsByJob(jobId);

      if (results.length === 0) {
        return res.status(404).json({ message: 'No results found for this job' });
      }

      const tempDir = path.join('temp', `job_${jobId}`);
      await fs.mkdir(tempDir, { recursive: true });

      // Copy files to temp directory
      for (const result of results) {
        const sourceFile = result.filePath;
        const destFile = path.join(tempDir, result.normalizedFilename);
        await fs.copyFile(sourceFile, destFile);
      }

      // Create ZIP
      const processor = new DocumentProcessor();
      const zipPath = path.join('temp', `job_${jobId}_results.zip`);
      await processor.createZipArchive(tempDir, zipPath);

      res.download(zipPath, `ket_qua_job_${jobId}.zip`, async (err) => {
        if (!err) {
          // Cleanup temp files
          try {
            await fs.rm(tempDir, { recursive: true, force: true });
            await fs.unlink(zipPath);
          } catch (cleanupError) {
            console.error('Cleanup error:', cleanupError);
          }
        }
      });
    } catch (error) {
      console.error('ZIP download error:', error);
      res.status(500).json({ message: 'ZIP download failed' });
    }
  });

  // Get system stats
  app.get('/api/stats', async (req, res) => {
    try {
      const stats = await storage.getSystemStats();
      res.json(stats);
    } catch (error) {
      console.error('Error fetching stats:', error);
      res.status(500).json({ message: 'Failed to fetch stats' });
    }
  });

  // Delete result
  app.delete('/api/results/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteExtractedResult(id);
      res.json({ message: 'Result deleted successfully' });
    } catch (error) {
      console.error('Delete error:', error);
      res.status(500).json({ message: 'Delete failed' });
    }
  });

  const httpServer = createServer(app);

  // Background processing function
  async function processDocument(fileId: number) {
    try {
      const file = await storage.getUploadedFile(fileId);
      if (!file) return;

      await storage.updateUploadedFileStatus(fileId, 'processing');

      const jobData = insertProcessingJobSchema.parse({
        fileId: file.id,
        status: 'processing',
        startedAt: new Date(),
      });

      const job = await storage.createProcessingJob(jobData);

      const outputDir = path.join('processed', `job_${job.id}`);
      await fs.mkdir(outputDir, { recursive: true });

      const processor = new DocumentProcessor((progress) => {
        // Update job progress
        storage.updateProcessingJob(job.id, {
          totalPages: progress.totalPages,
          processedPages: progress.processedPages,
          extractedCount: progress.extractedCount,
          errorCount: progress.errorCount,
        });
      });

      const results = await processor.processWordDocument(file.filePath, outputDir);
      
      // Generate both Word and PDF files
      const docxFiles = await processor.generateIndividualFiles(results, outputDir, 'docx');
      const pdfFiles = await processor.generateIndividualFiles(results, path.join(outputDir, 'pdf'), 'pdf');
      
      const allGeneratedFiles = [...docxFiles, ...pdfFiles];

      // Save extracted results for both formats
      for (let i = 0; i < results.length; i++) {
        const result = results[i];
        
        // Save DOCX file result
        const docxFile = docxFiles[i];
        if (docxFile) {
          await storage.createExtractedResult({
            jobId: job.id,
            fullName: result.fullName,
            code: result.code,
            normalizedFilename: docxFile.filename,
            filePath: docxFile.filePath,
            fileFormat: 'docx',
            fileSize: docxFile.size,
            pageNumber: result.pageNumber,
          });
        }
        
        // Save PDF file result
        const pdfFile = pdfFiles[i];
        if (pdfFile) {
          await storage.createExtractedResult({
            jobId: job.id,
            fullName: result.fullName,
            code: result.code,
            normalizedFilename: pdfFile.filename,
            filePath: pdfFile.filePath,
            fileFormat: 'pdf',
            fileSize: pdfFile.size,
            pageNumber: result.pageNumber,
          });
        }
      }

      // Update job as completed
      await storage.updateProcessingJob(job.id, {
        status: 'completed',
        completedAt: new Date(),
        extractedCount: results.length,
      });

      await storage.updateUploadedFileStatus(fileId, 'completed');

      // Update system stats
      const currentStats = await storage.getSystemStats();
      if (currentStats) {
        await storage.updateSystemStats({
          totalFilesProcessed: (currentStats.totalFilesProcessed || 0) + 1,
          totalExtractedResults: (currentStats.totalExtractedResults || 0) + (results.length * 2), // Both DOCX and PDF
        });
      }

    } catch (error) {
      console.error('Processing error:', error);
      
      // Update as failed
      await storage.updateUploadedFileStatus(fileId, 'failed');
      
      const jobs = await storage.getProcessingJobs();
      const job = jobs.find(j => j.fileId === fileId);
      if (job) {
        await storage.updateProcessingJob(job.id, {
          status: 'failed',
          errorLog: { error: error instanceof Error ? error.message : 'Unknown error' },
        });
      }
    }
  }

  // Additional endpoints for new pages

  // Get uploaded files (for history page)
  app.get('/api/uploaded-files', async (req, res) => {
    try {
      const files = await storage.getUploadedFiles();
      res.json(files);
    } catch (error) {
      console.error('Error fetching uploaded files:', error);
      res.status(500).json({ message: 'Failed to fetch uploaded files' });
    }
  });

  // Download single result file (for downloads page)
  app.get('/api/download-single/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const results = await storage.getExtractedResults();
      const result = results.find(r => r.id === id);

      if (!result) {
        return res.status(404).json({ message: 'File not found' });
      }

      res.download(result.filePath, result.normalizedFilename);
    } catch (error) {
      console.error('Download error:', error);
      res.status(500).json({ message: 'Download failed' });
    }
  });

  // Batch download (for downloads page)
  app.post('/api/download-batch', async (req, res) => {
    try {
      const { resultIds } = req.body;
      
      if (!Array.isArray(resultIds) || resultIds.length === 0) {
        return res.status(400).json({ message: 'Invalid result IDs' });
      }

      const results = await storage.getExtractedResults();
      const selectedResults = results.filter(r => resultIds.includes(r.id));

      if (selectedResults.length === 0) {
        return res.status(404).json({ message: 'No files found' });
      }

      const tempDir = path.join('temp', `batch_${Date.now()}`);
      await fs.mkdir(tempDir, { recursive: true });

      // Copy selected files to temp directory
      for (const result of selectedResults) {
        const sourceFile = result.filePath;
        const destFile = path.join(tempDir, result.normalizedFilename);
        try {
          await fs.copyFile(sourceFile, destFile);
        } catch (copyError) {
          console.error(`Failed to copy file ${sourceFile}:`, copyError);
        }
      }

      // Create ZIP
      const processor = new DocumentProcessor();
      const zipPath = path.join('temp', `batch_${Date.now()}.zip`);
      await processor.createZipArchive(tempDir, zipPath);

      res.download(zipPath, `ket_qua_batch_${Date.now()}.zip`, async (err) => {
        if (!err) {
          // Cleanup temp files
          try {
            await fs.rm(tempDir, { recursive: true, force: true });
            await fs.unlink(zipPath);
          } catch (cleanupError) {
            console.error('Cleanup error:', cleanupError);
          }
        }
      });
    } catch (error) {
      console.error('Batch download error:', error);
      res.status(500).json({ message: 'Batch download failed' });
    }
  });

  // Settings endpoints
  app.get('/api/settings', async (req, res) => {
    try {
      // Return default settings for now
      const defaultSettings = {
        processing: {
          maxFileSize: 500,
          maxConcurrentJobs: 3,
          autoCleanup: true,
          cleanupDays: 30,
          enableEmailNotifications: false,
          enablePushNotifications: true,
        },
        output: {
          defaultFormat: 'both',
          pdfQuality: 'high',
          includeMetadata: true,
          compressionLevel: 6,
          watermark: false,
          watermarkText: '',
        },
        system: {
          theme: 'light',
          language: 'vi',
          timezone: 'Asia/Ho_Chi_Minh',
          logLevel: 'info',
          enableDebugMode: false,
        },
      };
      res.json(defaultSettings);
    } catch (error) {
      console.error('Error fetching settings:', error);
      res.status(500).json({ message: 'Failed to fetch settings' });
    }
  });

  app.post('/api/settings', async (req, res) => {
    try {
      // For now, just return success - in a real app you'd save these to database
      res.json({ message: 'Settings saved successfully' });
    } catch (error) {
      console.error('Error saving settings:', error);
      res.status(500).json({ message: 'Failed to save settings' });
    }
  });

  app.post('/api/admin/clear-cache', async (req, res) => {
    try {
      // Clear cache logic would go here
      res.json({ message: 'Cache cleared successfully' });
    } catch (error) {
      console.error('Error clearing cache:', error);
      res.status(500).json({ message: 'Failed to clear cache' });
    }
  });

  return httpServer;
}
