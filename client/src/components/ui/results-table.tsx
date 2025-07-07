import { useState } from "react";
import { Button } from "./button";
import { Badge } from "./badge";
import { Checkbox } from "./checkbox";
import { 
  Download, 
  Eye, 
  Trash2, 
  FileText, 
  ChevronLeft, 
  ChevronRight,
  Settings
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";
import { formatFileSize } from "@/lib/fileUtils";

interface ExtractedResult {
  id: number;
  fullName: string;
  code: string;
  normalizedFilename: string;
  filePath: string;
  fileFormat: string;
  fileSize: number;
  extractedAt: string;
}

interface ResultsTableProps {
  results: ExtractedResult[];
}

export function ResultsTable({ results }: ResultsTableProps) {
  const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const totalPages = Math.ceil(results.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentResults = results.slice(startIndex, endIndex);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedItems(new Set(currentResults.map(item => item.id)));
    } else {
      setSelectedItems(new Set());
    }
  };

  const handleSelectItem = (id: number, checked: boolean) => {
    const newSelected = new Set(selectedItems);
    if (checked) {
      newSelected.add(id);
    } else {
      newSelected.delete(id);
    }
    setSelectedItems(newSelected);
  };

  const handleDownload = async (id: number) => {
    try {
      const response = await fetch(`/api/download/${id}`);
      if (response.ok) {
        const blob = await response.blob();
        const result = results.find(r => r.id === id);
        if (result) {
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = result.normalizedFilename;
          document.body.appendChild(a);
          a.click();
          window.URL.revokeObjectURL(url);
          document.body.removeChild(a);
        }
      }
    } catch (error) {
      console.error('Download error:', error);
    }
  };

  const getFileIcon = (format: string) => {
    const iconClass = format.toLowerCase() === 'pdf' ? 'text-red-600' : 'text-primary';
    return (
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
        format.toLowerCase() === 'pdf' ? 'bg-red-100' : 'bg-blue-100'
      }`}>
        <FileText className={`text-sm ${iconClass}`} />
      </div>
    );
  };

  const getFormatBadge = (format: string) => {
    const ispdf = format.toLowerCase() === 'pdf';
    return (
      <Badge 
        variant="secondary" 
        className={ispdf ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'}
      >
        {format.toUpperCase()}
      </Badge>
    );
  };

  if (results.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
        <p>Chưa có kết quả nào</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-3 px-4 font-medium text-gray-900">
                <Checkbox
                  checked={selectedItems.size === currentResults.length && currentResults.length > 0}
                  onCheckedChange={handleSelectAll}
                />
              </th>
              <th className="text-left py-3 px-4 font-medium text-gray-900">Tên tệp</th>
              <th className="text-left py-3 px-4 font-medium text-gray-900">Họ và tên</th>
              <th className="text-left py-3 px-4 font-medium text-gray-900">Mã Code</th>
              <th className="text-left py-3 px-4 font-medium text-gray-900">Định dạng</th>
              <th className="text-left py-3 px-4 font-medium text-gray-900">Kích thước</th>
              <th className="text-left py-3 px-4 font-medium text-gray-900">Ngày tạo</th>
              <th className="text-left py-3 px-4 font-medium text-gray-900">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {currentResults.map((result) => (
              <tr key={result.id} className="hover:bg-gray-50">
                <td className="py-3 px-4">
                  <Checkbox
                    checked={selectedItems.has(result.id)}
                    onCheckedChange={(checked) => handleSelectItem(result.id, checked as boolean)}
                  />
                </td>
                <td className="py-3 px-4">
                  <div className="flex items-center space-x-3">
                    {getFileIcon(result.fileFormat)}
                    <span className="font-medium text-gray-900">{result.normalizedFilename}</span>
                  </div>
                </td>
                <td className="py-3 px-4 text-gray-900">{result.fullName}</td>
                <td className="py-3 px-4">
                  <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded text-xs font-mono">
                    {result.code}
                  </span>
                </td>
                <td className="py-3 px-4">
                  {getFormatBadge(result.fileFormat)}
                </td>
                <td className="py-3 px-4 text-gray-600 text-sm">
                  {formatFileSize(result.fileSize)}
                </td>
                <td className="py-3 px-4 text-gray-600 text-sm">
                  {formatDistanceToNow(new Date(result.extractedAt), { addSuffix: true, locale: vi })}
                </td>
                <td className="py-3 px-4">
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDownload(result.id)}
                      className="text-primary hover:text-blue-700"
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-gray-500 hover:text-gray-700"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-error hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Table Footer */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            disabled={selectedItems.size === 0}
            className="bg-primary text-white hover:bg-blue-700 disabled:opacity-50"
          >
            <Download className="mr-2 h-4 w-4" />
            Tải xuống đã chọn
          </Button>
          <Button variant="outline">
            <Settings className="mr-2 h-4 w-4" />
            Thao tác hàng loạt
          </Button>
        </div>
        
        <div className="flex items-center space-x-4 text-sm text-gray-600">
          <span>
            Hiển thị {startIndex + 1}-{Math.min(endIndex, results.length)} của {results.length} kết quả
          </span>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(currentPage - 1)}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(currentPage + 1)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
