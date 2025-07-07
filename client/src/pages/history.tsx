import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Sidebar } from "@/components/ui/sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  FileText, 
  Clock, 
  CheckCircle, 
  AlertTriangle, 
  Search,
  Calendar,
  Filter,
  Download,
  Eye
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";

export default function History() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const { data: processingJobs } = useQuery({
    queryKey: ["/api/processing-jobs"],
  });

  const { data: uploadedFiles } = useQuery({
    queryKey: ["/api/uploaded-files"],
  });

  const filteredJobs = processingJobs?.filter((job: any) => {
    const matchesSearch = !searchQuery || 
      job.file?.originalName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.id.toString().includes(searchQuery);
    
    const matchesStatus = statusFilter === "all" || job.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  }) || [];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge variant="default" className="bg-green-100 text-green-800">Hoàn thành</Badge>;
      case "processing":
        return <Badge variant="default" className="bg-yellow-100 text-yellow-800">Đang xử lý</Badge>;
      case "failed":
        return <Badge variant="destructive">Thất bại</Badge>;
      case "pending":
        return <Badge variant="secondary">Chờ xử lý</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case "processing":
        return <Clock className="w-5 h-5 text-yellow-500" />;
      case "failed":
        return <AlertTriangle className="w-5 h-5 text-red-500" />;
      default:
        return <FileText className="w-5 h-5 text-gray-500" />;
    }
  };

  return (
    <div className="min-h-screen flex bg-gray-50">
      <Sidebar />
      
      <main className="flex-1 overflow-hidden">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Lịch sử Xử lý</h2>
              <p className="text-gray-600 mt-1">Xem tất cả các công việc xử lý đã thực hiện</p>
            </div>
            <div className="flex items-center space-x-6 text-sm">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">{filteredJobs.length}</div>
                <div className="text-gray-500">Tổng công việc</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {filteredJobs.filter((job: any) => job.status === 'completed').length}
                </div>
                <div className="text-gray-500">Thành công</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">
                  {filteredJobs.filter((job: any) => job.status === 'failed').length}
                </div>
                <div className="text-gray-500">Thất bại</div>
              </div>
            </div>
          </div>
        </header>

        <div className="p-6 space-y-6 overflow-y-auto h-full">
          {/* Filters */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    type="text"
                    placeholder="Tìm kiếm theo tên file hoặc ID..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="all">Tất cả trạng thái</option>
                  <option value="completed">Hoàn thành</option>
                  <option value="processing">Đang xử lý</option>
                  <option value="failed">Thất bại</option>
                  <option value="pending">Chờ xử lý</option>
                </select>
                <Button variant="outline" size="sm">
                  <Filter className="w-4 h-4 mr-2" />
                  Lọc nâng cao
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* History List */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Calendar className="w-5 h-5 mr-2" />
                Danh sách Công việc
              </CardTitle>
            </CardHeader>
            <CardContent>
              {filteredJobs.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <FileText className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <p className="text-lg mb-2">Không có lịch sử xử lý</p>
                  <p>Chưa có công việc nào phù hợp với bộ lọc của bạn</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredJobs.map((job: any) => (
                    <div key={job.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-4">
                          <div className="mt-1">
                            {getStatusIcon(job.status)}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                              <h3 className="font-semibold text-gray-900">
                                {job.file?.originalName || `Công việc #${job.id}`}
                              </h3>
                              {getStatusBadge(job.status)}
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                              <div>
                                <span className="font-medium">ID: </span>
                                #{job.id}
                              </div>
                              <div>
                                <span className="font-medium">Tạo: </span>
                                {job.createdAt ? formatDistanceToNow(new Date(job.createdAt), { 
                                  addSuffix: true, 
                                  locale: vi 
                                }) : 'N/A'}
                              </div>
                              {job.startedAt && (
                                <div>
                                  <span className="font-medium">Bắt đầu: </span>
                                  {formatDistanceToNow(new Date(job.startedAt), { 
                                    addSuffix: true, 
                                    locale: vi 
                                  })}
                                </div>
                              )}
                              {job.completedAt && (
                                <div>
                                  <span className="font-medium">Hoàn thành: </span>
                                  {formatDistanceToNow(new Date(job.completedAt), { 
                                    addSuffix: true, 
                                    locale: vi 
                                  })}
                                </div>
                              )}
                            </div>
                            {job.status === 'completed' && (
                              <div className="mt-2 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                <div className="text-green-600">
                                  <span className="font-medium">Đã tạo: </span>
                                  {job.extractedCount || 0} file
                                </div>
                                <div className="text-blue-600">
                                  <span className="font-medium">Tổng trang: </span>
                                  {job.totalPages || 0}
                                </div>
                                <div className="text-orange-600">
                                  <span className="font-medium">Đã xử lý: </span>
                                  {job.processedPages || 0} trang
                                </div>
                                {job.errorCount > 0 && (
                                  <div className="text-red-600">
                                    <span className="font-medium">Lỗi: </span>
                                    {job.errorCount}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button variant="outline" size="sm">
                            <Eye className="w-4 h-4 mr-1" />
                            Chi tiết
                          </Button>
                          {job.status === 'completed' && (
                            <Button variant="default" size="sm">
                              <Download className="w-4 h-4 mr-1" />
                              Tải về
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}