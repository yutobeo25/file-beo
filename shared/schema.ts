import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const uploadedFiles = pgTable("uploaded_files", {
  id: serial("id").primaryKey(),
  filename: text("filename").notNull(),
  originalName: text("original_name").notNull(),
  filePath: text("file_path").notNull(),
  fileSize: integer("file_size").notNull(),
  mimeType: text("mime_type").notNull(),
  status: text("status").notNull().default("uploaded"), // uploaded, processing, completed, failed
  uploadedAt: timestamp("uploaded_at").defaultNow().notNull(),
});

export const processingJobs = pgTable("processing_jobs", {
  id: serial("id").primaryKey(),
  fileId: integer("file_id").references(() => uploadedFiles.id).notNull(),
  status: text("status").notNull().default("pending"), // pending, processing, completed, failed
  totalPages: integer("total_pages"),
  processedPages: integer("processed_pages").default(0),
  extractedCount: integer("extracted_count").default(0),
  errorCount: integer("error_count").default(0),
  errorLog: jsonb("error_log"),
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const extractedResults = pgTable("extracted_results", {
  id: serial("id").primaryKey(),
  jobId: integer("job_id").references(() => processingJobs.id).notNull(),
  fullName: text("full_name").notNull(),
  code: text("code").notNull(),
  normalizedFilename: text("normalized_filename").notNull(),
  filePath: text("file_path").notNull(),
  fileFormat: text("file_format").notNull(), // docx, pdf
  fileSize: integer("file_size").notNull(),
  pageNumber: integer("page_number"),
  extractedAt: timestamp("extracted_at").defaultNow().notNull(),
});

export const systemStats = pgTable("system_stats", {
  id: serial("id").primaryKey(),
  totalFilesProcessed: integer("total_files_processed").default(0),
  totalExtractedResults: integer("total_extracted_results").default(0),
  avgProcessingTimeMinutes: integer("avg_processing_time_minutes").default(0),
  successRate: integer("success_rate").default(0), // percentage
  lastUpdated: timestamp("last_updated").defaultNow().notNull(),
});

// Insert schemas
export const insertUploadedFileSchema = createInsertSchema(uploadedFiles).omit({
  id: true,
  uploadedAt: true,
});

export const insertProcessingJobSchema = createInsertSchema(processingJobs).omit({
  id: true,
  createdAt: true,
});

export const insertExtractedResultSchema = createInsertSchema(extractedResults).omit({
  id: true,
  extractedAt: true,
});

// Types
export type UploadedFile = typeof uploadedFiles.$inferSelect;
export type InsertUploadedFile = z.infer<typeof insertUploadedFileSchema>;
export type ProcessingJob = typeof processingJobs.$inferSelect;
export type InsertProcessingJob = z.infer<typeof insertProcessingJobSchema>;
export type ExtractedResult = typeof extractedResults.$inferSelect;
export type InsertExtractedResult = z.infer<typeof insertExtractedResultSchema>;
export type SystemStats = typeof systemStats.$inferSelect;
