import { Button } from "./button";
import { Progress } from "./progress";
import { Badge } from "./badge";
import { Settings, CheckCircle, AlertTriangle, Download, FileText, RefreshCw } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";

interface ProcessingJob {
  id: number;
  status: string;
  totalPages?: number;
  processedPages?: number;
  extractedCount?: number;
  errorCount?: number;
  startedAt?: string;
  completedAt?: string;
  createdAt: string;
  file?: {
    originalName: string;
  };
}

interface ProcessingQueueProps {
  jobs: ProcessingJob[];
}

export function ProcessingQueue({ jobs }: ProcessingQueueProps) {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'processing':
        return <Settings className="animate-spin text-warning text-lg" />;
      case 'completed':
        return <CheckCircle className="text-success text-lg" />;
      case 'failed':
        return <AlertTriangle className="text-error text-lg" />;
      default:
        return <FileText className="text-gray-400 text-lg" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'processing':
        return (
          <Badge variant="secondary" className="bg-warning/10 text-warning">
            <div className="w-2 h-2 bg-warning rounded-full mr-1"></div>
            Đang xử lý
          </Badge>
        );
      case 'completed':
        return (
          <Badge variant="secondary" className="bg-success/10 text-success">
            <div className="w-2 h-2 bg-success rounded-full mr-1"></div>
            Hoàn thành
          </Badge>
        );
      case 'failed':
        return (
          <Badge variant="secondary" className="bg-error/10 text-error">
            <div className="w-2 h-2 bg-error rounded-full mr-1"></div>
            Thất bại
          </Badge>
        );
      default:
        return (
          <Badge variant="secondary">
            <div className="w-2 h-2 bg-gray-400 rounded-full mr-1"></div>
            Chờ xử lý
          </Badge>
        );
    }
  };

  const getProgress = (job: ProcessingJob) => {
    if (!job.totalPages || job.totalPages === 0) return 0;
    return Math.round((job.processedPages || 0) / job.totalPages * 100);
  };

  const handleDownloadZip = async (jobId: number) => {
    try {
      const response = await fetch(`/api/download-zip/${jobId}`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `ket_qua_job_${jobId}.zip`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('Download error:', error);
    }
  };

  if (jobs.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
        <p>Chưa có công việc xử lý nào</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {jobs.map((job) => (
        <div key={job.id} className="border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                {getStatusIcon(job.status)}
              </div>
              <div>
                <h4 className="font-medium text-gray-900">
                  Công việc #{job.id}
                </h4>
                <p className="text-sm text-gray-500">
                  {job.status === 'processing' && job.totalPages && job.processedPages
                    ? `Đang xử lý trang ${job.processedPages} / ${job.totalPages}`
                    : job.status === 'completed' && job.extractedCount
                    ? `Đã tách thành công ${job.extractedCount} phiếu kết quả`
                    : job.status === 'failed'
                    ? 'Lỗi xử lý tài liệu'
                    : 'Đang chuẩn bị xử lý'}
                </p>
              </div>
            </div>
            <div className="text-right">
              {getStatusBadge(job.status)}
              <p className="text-xs text-gray-500 mt-1">
                {job.status === 'completed' && job.completedAt
                  ? `Hoàn thành: ${formatDistanceToNow(new Date(job.completedAt), { addSuffix: true, locale: vi })}`
                  : job.status === 'processing' && job.startedAt
                  ? `Bắt đầu: ${formatDistanceToNow(new Date(job.startedAt), { addSuffix: true, locale: vi })}`
                  : `Tạo: ${formatDistanceToNow(new Date(job.createdAt), { addSuffix: true, locale: vi })}`}
              </p>
            </div>
          </div>

          {job.status === 'processing' && job.totalPages && (
            <div className="mt-4">
              <div className="flex justify-between text-sm text-gray-600 mb-1">
                <span>Tiến độ xử lý</span>
                <span>{getProgress(job)}%</span>
              </div>
              <Progress value={getProgress(job)} className="w-full" />
            </div>
          )}

          {job.status === 'completed' && (
            <div className="mt-4 flex space-x-3">
              <Button
                onClick={() => handleDownloadZip(job.id)}
                className="bg-primary text-white hover:bg-blue-700"
                size="sm"
              >
                <Download className="mr-2 h-4 w-4" />
                Tải ZIP ({job.extractedCount} tệp)
              </Button>
              <Button variant="outline" size="sm">
                Xem chi tiết
              </Button>
            </div>
          )}

          {job.status === 'failed' && (
            <div className="mt-4 flex space-x-3">
              <Button variant="outline" size="sm" className="border-error text-error hover:bg-red-50">
                <FileText className="mr-2 h-4 w-4" />
                Xem nhật ký lỗi
              </Button>
              <Button variant="outline" size="sm">
                <RefreshCw className="mr-2 h-4 w-4" />
                Thử lại
              </Button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
