import {
  uploadedFiles,
  processingJobs,
  extractedResults,
  systemStats,
  type UploadedFile,
  type InsertUploadedFile,
  type ProcessingJob,
  type InsertProcessingJob,
  type ExtractedResult,
  type InsertExtractedResult,
  type SystemStats,
} from "@shared/schema";

export interface IStorage {
  // File management
  createUploadedFile(file: InsertUploadedFile): Promise<UploadedFile>;
  getUploadedFile(id: number): Promise<UploadedFile | undefined>;
  getUploadedFiles(): Promise<UploadedFile[]>;
  updateUploadedFileStatus(id: number, status: string): Promise<void>;

  // Processing jobs
  createProcessingJob(job: InsertProcessingJob): Promise<ProcessingJob>;
  getProcessingJob(id: number): Promise<ProcessingJob | undefined>;
  getProcessingJobs(): Promise<ProcessingJob[]>;
  updateProcessingJob(id: number, updates: Partial<ProcessingJob>): Promise<void>;

  // Extracted results
  createExtractedResult(result: InsertExtractedResult): Promise<ExtractedResult>;
  getExtractedResultsByJob(jobId: number): Promise<ExtractedResult[]>;
  getExtractedResults(): Promise<ExtractedResult[]>;
  searchExtractedResults(query: string): Promise<ExtractedResult[]>;
  deleteExtractedResult(id: number): Promise<void>;

  // System stats
  getSystemStats(): Promise<SystemStats | undefined>;
  updateSystemStats(stats: Partial<SystemStats>): Promise<void>;
}

export class MemStorage implements IStorage {
  private uploadedFiles: Map<number, UploadedFile> = new Map();
  private processingJobs: Map<number, ProcessingJob> = new Map();
  private extractedResults: Map<number, ExtractedResult> = new Map();
  private systemStats: SystemStats | undefined;
  private currentId = 1;

  async createUploadedFile(file: InsertUploadedFile): Promise<UploadedFile> {
    const id = this.currentId++;
    const uploadedFile: UploadedFile = {
      ...file,
      id,
      status: file.status || 'uploaded',
      uploadedAt: new Date(),
    };
    this.uploadedFiles.set(id, uploadedFile);
    return uploadedFile;
  }

  async getUploadedFile(id: number): Promise<UploadedFile | undefined> {
    return this.uploadedFiles.get(id);
  }

  async getUploadedFiles(): Promise<UploadedFile[]> {
    return Array.from(this.uploadedFiles.values()).sort(
      (a, b) => b.uploadedAt.getTime() - a.uploadedAt.getTime()
    );
  }

  async updateUploadedFileStatus(id: number, status: string): Promise<void> {
    const file = this.uploadedFiles.get(id);
    if (file) {
      this.uploadedFiles.set(id, { ...file, status });
    }
  }

  async createProcessingJob(job: InsertProcessingJob): Promise<ProcessingJob> {
    const id = this.currentId++;
    const processingJob: ProcessingJob = {
      ...job,
      id,
      status: job.status || 'pending',
      totalPages: job.totalPages || null,
      processedPages: job.processedPages || null,
      extractedCount: job.extractedCount || null,
      errorCount: job.errorCount || null,
      errorLog: job.errorLog || null,
      startedAt: job.startedAt || null,
      completedAt: job.completedAt || null,
      createdAt: new Date(),
    };
    this.processingJobs.set(id, processingJob);
    return processingJob;
  }

  async getProcessingJob(id: number): Promise<ProcessingJob | undefined> {
    return this.processingJobs.get(id);
  }

  async getProcessingJobs(): Promise<ProcessingJob[]> {
    return Array.from(this.processingJobs.values()).sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
    );
  }

  async updateProcessingJob(id: number, updates: Partial<ProcessingJob>): Promise<void> {
    const job = this.processingJobs.get(id);
    if (job) {
      this.processingJobs.set(id, { ...job, ...updates });
    }
  }

  async createExtractedResult(result: InsertExtractedResult): Promise<ExtractedResult> {
    const id = this.currentId++;
    const extractedResult: ExtractedResult = {
      ...result,
      id,
      pageNumber: result.pageNumber || null,
      extractedAt: new Date(),
    };
    this.extractedResults.set(id, extractedResult);
    return extractedResult;
  }

  async getExtractedResultsByJob(jobId: number): Promise<ExtractedResult[]> {
    return Array.from(this.extractedResults.values())
      .filter(result => result.jobId === jobId)
      .sort((a, b) => a.extractedAt.getTime() - b.extractedAt.getTime());
  }

  async getExtractedResults(): Promise<ExtractedResult[]> {
    return Array.from(this.extractedResults.values()).sort(
      (a, b) => b.extractedAt.getTime() - a.extractedAt.getTime()
    );
  }

  async searchExtractedResults(query: string): Promise<ExtractedResult[]> {
    const lowerQuery = query.toLowerCase();
    return Array.from(this.extractedResults.values())
      .filter(result => 
        result.fullName.toLowerCase().includes(lowerQuery) ||
        result.code.toLowerCase().includes(lowerQuery) ||
        result.normalizedFilename.toLowerCase().includes(lowerQuery)
      )
      .sort((a, b) => b.extractedAt.getTime() - a.extractedAt.getTime());
  }

  async deleteExtractedResult(id: number): Promise<void> {
    this.extractedResults.delete(id);
  }

  async getSystemStats(): Promise<SystemStats | undefined> {
    if (!this.systemStats) {
      this.systemStats = {
        id: 1,
        totalFilesProcessed: this.uploadedFiles.size,
        totalExtractedResults: this.extractedResults.size,
        avgProcessingTimeMinutes: 4,
        successRate: 98,
        lastUpdated: new Date(),
      };
    }
    return this.systemStats;
  }

  async updateSystemStats(stats: Partial<SystemStats>): Promise<void> {
    if (this.systemStats) {
      this.systemStats = { ...this.systemStats, ...stats, lastUpdated: new Date() };
    }
  }
}

export const storage = new MemStorage();
