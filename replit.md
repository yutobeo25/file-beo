# Replit.md

## Overview

This is a full-stack medical document processing application built with Express.js backend and React frontend. The system is designed to process Word documents (.docx) containing medical test results, extract individual patient records, and provide a management interface for the extracted data. The application uses Drizzle ORM with PostgreSQL for data persistence and includes features for file upload, document processing, result management, and batch operations.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript
- **Routing**: Wouter for client-side routing with active page highlighting
- **State Management**: TanStack Query (React Query) for server state management
- **UI Components**: shadcn/ui component library with Radix UI primitives
- **Styling**: Tailwind CSS with CSS variables for theming
- **Build Tool**: Vite with React plugin
- **Pages**: Dashboard (main), History (job tracking), Downloads (file management), Settings (system config)

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **File Processing**: Mammoth for Word document parsing, pdf-lib for PDF generation
- **File Upload**: Multer middleware for handling multipart/form-data
- **Database Connection**: Neon serverless PostgreSQL driver

### Data Storage Solutions
- **Primary Database**: PostgreSQL with the following schema:
  - `uploaded_files`: Tracks uploaded document files
  - `processing_jobs`: Manages document processing workflow and progress
  - `extracted_results`: Stores individual extracted patient records
  - `system_stats`: System-wide statistics and metrics
- **File Storage**: Local filesystem for uploaded and processed files
- **Session Storage**: Not currently implemented but prepared for future authentication

## Key Components

### Document Processing Pipeline
1. **File Upload**: Validates and stores .docx files with size limits (500MB)
2. **Background Processing**: Asynchronous document parsing and content extraction
3. **Vietnamese Text Normalization**: Specialized handling for Vietnamese character encoding
4. **Content Extraction**: Parsing medical records from structured Word documents
5. **PDF Generation**: Converting extracted content to individual PDF files
6. **Archive Creation**: Batch downloading functionality with ZIP compression

### Data Models
- **UploadedFile**: Metadata for uploaded documents
- **ProcessingJob**: Job tracking with progress indicators and error handling
- **ExtractedResult**: Individual patient records with normalized filenames
- **SystemStats**: Performance metrics and processing statistics

### API Endpoints
- `POST /api/upload`: File upload endpoint with validation
- `GET /api/processing-jobs`: Real-time processing status
- `GET /api/results`: Paginated results with search functionality
- `GET /api/stats`: System statistics dashboard
- `GET /api/uploaded-files`: Complete list of uploaded files for history tracking
- `GET /api/download-single/:id`: Download individual processed files
- `POST /api/download-batch`: Batch download multiple files as ZIP
- `GET /api/download-zip/:jobId`: Download all files from a job as ZIP
- `GET /api/settings`: Get system configuration settings
- `POST /api/settings`: Save system configuration settings
- `POST /api/admin/clear-cache`: Clear system cache

## Data Flow

1. **Upload Phase**: User uploads .docx file → Validation → Storage → Job creation
2. **Processing Phase**: Background job → Document parsing → Content extraction → Vietnamese normalization → Individual file generation
3. **Management Phase**: Real-time status updates → Search and filter results → Batch operations → Download management

## External Dependencies

### Core Dependencies
- **@neondatabase/serverless**: PostgreSQL database connectivity
- **drizzle-orm**: Type-safe database ORM
- **mammoth**: Word document to HTML conversion
- **pdf-lib**: PDF generation and manipulation
- **archiver**: ZIP file creation for batch downloads
- **multer**: File upload handling

### UI Dependencies
- **@radix-ui/***: Accessible UI component primitives
- **@tanstack/react-query**: Server state management
- **tailwindcss**: Utility-first CSS framework
- **class-variance-authority**: Type-safe styling variants
- **date-fns**: Date formatting and manipulation

### Development Dependencies
- **vite**: Fast build tool and dev server
- **typescript**: Type safety and development experience
- **tsx**: TypeScript execution for Node.js

## Deployment Strategy

### Development
- **Frontend**: Vite dev server with HMR (Hot Module Replacement)
- **Backend**: tsx for TypeScript execution with auto-restart
- **Database**: Drizzle migrations with `db:push` command

### Production Build
- **Frontend**: Vite production build to `dist/public`
- **Backend**: esbuild compilation to ESM bundle in `dist`
- **Database**: PostgreSQL with connection pooling via Neon

### Environment Configuration
- `DATABASE_URL`: Required PostgreSQL connection string
- `NODE_ENV`: Environment detection for development/production behavior
- File uploads stored in local `uploads/` directory

## Recent Changes

```
Recent Changes:
✓ July 07, 2025 - Fixed app startup issues and PDF generation errors
✓ July 07, 2025 - Added complete History page with job filtering and status tracking
✓ July 07, 2025 - Added complete Downloads page with batch and single file downloads
✓ July 07, 2025 - Added complete Settings page with system configuration options
✓ July 07, 2025 - Updated sidebar navigation with active page highlighting
✓ July 07, 2025 - Added new API endpoints for uploaded files, batch downloads, and settings
✓ July 06, 2025 - Enhanced color theme with success/warning/error states  
✓ July 06, 2025 - Tested file upload functionality - confirmed working
✓ July 06, 2025 - Real-time processing status updates working properly
✓ July 06, 2025 - Initial medical document processing system setup complete
```

## User Preferences

```
Preferred communication style: Simple, everyday language.
```