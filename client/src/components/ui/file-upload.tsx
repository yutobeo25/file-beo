import { useState, useCallback } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useDropzone } from "react-dropzone";
import { Button } from "./button";
import { Progress } from "./progress";
import { useToast } from "@/hooks/use-toast";
import { CloudUpload, FolderOpen } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

export function FileUpload() {
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [uploadingFile, setUploadingFile] = useState<string>("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);

      setUploading(true);
      setUploadingFile(file.name);
      setUploadProgress(0);

      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + Math.random() * 10;
        });
      }, 500);

      try {
        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        clearInterval(progressInterval);
        setUploadProgress(100);

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || 'Upload failed');
        }

        return response.json();
      } catch (error) {
        clearInterval(progressInterval);
        throw error;
      } finally {
        setTimeout(() => {
          setUploading(false);
          setUploadProgress(0);
          setUploadingFile("");
        }, 1000);
      }
    },
    onSuccess: (data) => {
      toast({
        title: "Tải lên thành công",
        description: `Đã tải lên ${data.file.originalName}. Đang bắt đầu xử lý...`,
      });
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["/api/files"] });
      queryClient.invalidateQueries({ queryKey: ["/api/processing-jobs"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Lỗi tải lên",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      if (file.size > 500 * 1024 * 1024) {
        toast({
          title: "Tệp quá lớn",
          description: "Kích thước tệp không được vượt quá 500MB",
          variant: "destructive",
        });
        return;
      }
      uploadMutation.mutate(file);
    }
  }, [uploadMutation, toast]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx']
    },
    multiple: false,
    disabled: uploading,
  });

  return (
    <div className="space-y-4">
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${
          isDragActive
            ? 'border-primary bg-blue-50'
            : uploading
            ? 'border-gray-200 bg-gray-50 cursor-not-allowed'
            : 'border-gray-300 hover:border-primary hover:bg-blue-50'
        }`}
      >
        <input {...getInputProps()} />
        <div className="space-y-4">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
            <CloudUpload className="text-primary text-2xl" />
          </div>
          <div>
            <p className="text-lg font-medium text-gray-900">
              {isDragActive ? 'Thả tệp vào đây...' : 'Kéo thả tệp vào đây hoặc nhấp để chọn'}
            </p>
            <p className="text-gray-500 mt-2">
              Tài liệu Word chứa nhiều phiếu kết quả xét nghiệm (3000-5000 trang)
            </p>
          </div>
          <Button 
            type="button" 
            disabled={uploading}
            className="bg-primary text-white hover:bg-blue-700"
          >
            <FolderOpen className="mr-2 h-4 w-4" />
            Chọn Tệp
          </Button>
        </div>
      </div>

      {uploading && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-blue-900">Đang tải lên: {uploadingFile}</span>
            <span className="text-sm text-blue-700">{Math.round(uploadProgress)}%</span>
          </div>
          <Progress value={uploadProgress} className="w-full" />
          <div className="flex justify-between text-xs text-blue-600 mt-2">
            <span>Đang xử lý...</span>
            <span>Vui lòng đợi</span>
          </div>
        </div>
      )}
    </div>
  );
}
