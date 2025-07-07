import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Sidebar } from "@/components/ui/sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Download, 
  FileText, 
  Package, 
  Search,
  CheckSquare,
  Square,
  Trash2,
  Archive,
  File,
  FolderOpen
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";
import { formatFileSize } from "@/lib/fileUtils";

export default function Downloads() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedItems, setSelectedItems] = useState<number[]>([]);
  const [fileTypeFilter, setFileTypeFilter] = useState("all");

  const { data: results } = useQuery({
    queryKey: ["/api/results", searchQuery],
    queryFn: async () => {
      const params = searchQuery ? `?search=${encodeURIComponent(searchQuery)}` : '';
      const response = await fetch(`/api/results${params}`);
      if (!response.ok) throw new Error('Failed to fetch results');
      return response.json();
    },
  });

  const { data: processingJobs } = useQuery({
    queryKey: ["/api/processing-jobs"],
  });

  const filteredResults = results?.filter((result: any) => {
    if (fileTypeFilter === "all") return true;
    return result.fileFormat === fileTypeFilter;
  }) || [];

  const completedJobs = processingJobs?.filter((job: any) => job.status === 'completed') || [];

  const handleSelectAll = () => {
    if (selectedItems.length === filteredResults.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(filteredResults.map((result: any) => result.id));
    }
  };

  const handleSelectItem = (id: number) => {
    setSelectedItems(prev => 
      prev.includes(id) 
        ? prev.filter(item => item !== id)
        : [...prev, id]
    );
  };

  const handleDownloadSelected = async () => {
    if (selectedItems.length === 0) return;
    
    try {
      // Create a batch download request
      const response = await fetch('/api/download-batch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ resultIds: selectedItems }),
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `ket_qua_batch_${new Date().getTime()}.zip`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        setSelectedItems([]);
      }
    } catch (error) {
      console.error('Download error:', error);
    }
  };

  const handleDownloadSingle = async (resultId: number, filename: string) => {
    try {
      const response = await fetch(`/api/download-single/${resultId}`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('Download error:', error);
    }
  };

  const handleDownloadJobZip = async (jobId: number) => {
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

  const getFileTypeIcon = (format: string) => {
    switch (format.toLowerCase()) {
      case 'pdf':
        return <File className="w-5 h-5 text-red-500" />;
      case 'docx':
        return <FileText className="w-5 h-5 text-blue-500" />;
      default:
        return <File className="w-5 h-5 text-gray-500" />;
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
              <h2 className="text-2xl font-bold text-gray-900">Tải xuống</h2>
              <p className="text-gray-600 mt-1">Quản lý và tải xuống các file đã xử lý</p>
            </div>
            <div className="flex items-center space-x-6 text-sm">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">{filteredResults.length}</div>
                <div className="text-gray-500">File có sẵn</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{completedJobs.length}</div>
                <div className="text-gray-500">Gói hoàn thành</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{selectedItems.length}</div>
                <div className="text-gray-500">Đã chọn</div>
              </div>
            </div>
          </div>
        </header>

        <div className="p-6 space-y-6 overflow-y-auto h-full">
          {/* Quick Download Actions */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Tải xuống hàng loạt</h3>
                <div className="flex items-center space-x-3">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={handleSelectAll}
                  >
                    {selectedItems.length === filteredResults.length ? (
                      <CheckSquare className="w-4 h-4 mr-2" />
                    ) : (
                      <Square className="w-4 h-4 mr-2" />
                    )}
                    {selectedItems.length === filteredResults.length ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
                  </Button>
                  <Button 
                    variant="default" 
                    size="sm"
                    onClick={handleDownloadSelected}
                    disabled={selectedItems.length === 0}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Tải xuống đã chọn ({selectedItems.length})
                  </Button>
                </div>
              </div>
              
              {completedJobs.length > 0 && (
                <div>
                  <h4 className="text-md font-medium text-gray-700 mb-3">Gói hoàn thành</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {completedJobs.map((job: any) => (
                      <div key={job.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center space-x-2">
                            <Package className="w-5 h-5 text-blue-500" />
                            <div>
                              <h5 className="font-medium text-gray-900 truncate">
                                {job.file?.originalName || `Job #${job.id}`}
                              </h5>
                              <p className="text-sm text-gray-500">
                                {job.extractedCount || 0} file
                              </p>
                            </div>
                          </div>
                        </div>
                        <div className="text-xs text-gray-500 mb-3">
                          Hoàn thành {job.completedAt ? formatDistanceToNow(new Date(job.completedAt), { 
                            addSuffix: true, 
                            locale: vi 
                          }) : 'N/A'}
                        </div>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="w-full"
                          onClick={() => handleDownloadJobZip(job.id)}
                        >
                          <Archive className="w-4 h-4 mr-2" />
                          Tải ZIP
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* File List */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center">
                  <FolderOpen className="w-5 h-5 mr-2" />
                  Danh sách File
                </CardTitle>
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      type="text"
                      placeholder="Tìm kiếm file..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 w-64"
                    />
                  </div>
                  <select
                    value={fileTypeFilter}
                    onChange={(e) => setFileTypeFilter(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="all">Tất cả định dạng</option>
                    <option value="pdf">PDF</option>
                    <option value="docx">Word</option>
                  </select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {filteredResults.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <Download className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <p className="text-lg mb-2">Không có file nào</p>
                  <p>Chưa có file nào phù hợp với bộ lọc của bạn</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredResults.map((result: any) => (
                    <div key={result.id} className="flex items-center space-x-4 p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                      <Checkbox
                        checked={selectedItems.includes(result.id)}
                        onCheckedChange={() => handleSelectItem(result.id)}
                      />
                      <div className="flex items-center space-x-3 flex-1">
                        {getFileTypeIcon(result.fileFormat)}
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">{result.fullName}</h4>
                          <div className="flex items-center space-x-4 text-sm text-gray-500">
                            <span>Mã: {result.code}</span>
                            <span>•</span>
                            <Badge variant="outline" className="text-xs">
                              {result.fileFormat.toUpperCase()}
                            </Badge>
                            <span>•</span>
                            <span>{formatFileSize(result.fileSize)}</span>
                            <span>•</span>
                            <span>
                              {formatDistanceToNow(new Date(result.extractedAt), { 
                                addSuffix: true, 
                                locale: vi 
                              })}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleDownloadSingle(result.id, result.normalizedFilename)}
                        >
                          <Download className="w-4 h-4 mr-1" />
                          Tải
                        </Button>
                        <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700">
                          <Trash2 className="w-4 h-4" />
                        </Button>
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