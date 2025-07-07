import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Sidebar } from "@/components/ui/sidebar";
import { FileUpload } from "@/components/ui/file-upload";
import { ProcessingQueue } from "@/components/ui/processing-queue";
import { ResultsTable } from "@/components/ui/results-table";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { FileText, Clock, TrendingUp, Filter } from "lucide-react";

export default function Dashboard() {
  const [searchQuery, setSearchQuery] = useState("");

  const { data: stats } = useQuery({
    queryKey: ["/api/stats"],
  });

  const { data: processingJobs } = useQuery({
    queryKey: ["/api/processing-jobs"],
    refetchInterval: 2000, // Refresh every 2 seconds for real-time updates
  });

  const { data: results } = useQuery({
    queryKey: ["/api/results", searchQuery],
    queryFn: async () => {
      const params = searchQuery ? `?search=${encodeURIComponent(searchQuery)}` : '';
      const response = await fetch(`/api/results${params}`);
      if (!response.ok) throw new Error('Failed to fetch results');
      return response.json();
    },
  });

  return (
    <div className="min-h-screen flex bg-gray-50">
      <Sidebar />
      
      <main className="flex-1 overflow-hidden">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Xử lý Kết quả Khám Bệnh</h2>
              <p className="text-gray-600 mt-1">Tải lên và tách phiếu kết quả xét nghiệm từ tài liệu Word</p>
            </div>
            <div className="flex items-center space-x-6 text-sm">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">{stats?.totalFilesProcessed || 0}</div>
                <div className="text-gray-500">Đã xử lý</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-warning">
                  {processingJobs?.filter((job: any) => job.status === 'processing').length || 0}
                </div>
                <div className="text-gray-500">Đang xử lý</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-success">
                  {processingJobs?.filter((job: any) => job.status === 'completed').length || 0}
                </div>
                <div className="text-gray-500">Hoàn thành</div>
              </div>
            </div>
          </div>
        </header>

        <div className="p-6 space-y-6 overflow-y-auto h-full">
          {/* File Upload Section */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Tải lên Tài liệu</h3>
                <div className="text-sm text-gray-500">
                  Hỗ trợ: .docx | Tối đa: 500MB | Xuất ra: Word & PDF
                </div>
              </div>
              <FileUpload />
            </CardContent>
          </Card>

          {/* Processing Queue Section */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Hàng đợi Xử lý</h3>
                <Button variant="ghost" size="sm">
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Làm mới
                </Button>
              </div>
              <ProcessingQueue jobs={processingJobs || []} />
            </CardContent>
          </Card>

          {/* Results Management Section */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Quản lý Kết quả</h3>
                <div className="flex items-center space-x-3">
                  <Input
                    type="text"
                    placeholder="Tìm kiếm theo tên hoặc mã..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-64"
                  />
                  <Button variant="outline" size="sm">
                    <Filter className="w-4 h-4 mr-2" />
                    Lọc
                  </Button>
                </div>
              </div>
              <ResultsTable results={results || []} />
            </CardContent>
          </Card>

          {/* System Stats Section */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <FileText className="text-primary text-xl" />
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900">{stats?.totalExtractedResults || 0}</h4>
                    <p className="text-gray-600">Tổng số tệp đã tạo</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <Clock className="text-success text-xl" />
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900">{stats?.avgProcessingTimeMinutes || 0} phút</h4>
                    <p className="text-gray-600">Thời gian xử lý trung bình</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                    <TrendingUp className="text-warning text-xl" />
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900">{stats?.successRate || 0}%</h4>
                    <p className="text-gray-600">Tỷ lệ thành công</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
