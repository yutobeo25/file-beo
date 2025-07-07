import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Sidebar } from "@/components/ui/sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { 
  Settings as SettingsIcon, 
  Save, 
  RefreshCw, 
  FileText, 
  Database, 
  Shield,
  Bell,
  Palette,
  HardDrive,
  Zap,
  AlertTriangle,
  Info,
  Trash2
} from "lucide-react";

export default function Settings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // State for settings
  const [processingSettings, setProcessingSettings] = useState({
    maxFileSize: 500, // MB
    maxConcurrentJobs: 3,
    autoCleanup: true,
    cleanupDays: 30,
    enableEmailNotifications: false,
    enablePushNotifications: true,
  });

  const [outputSettings, setOutputSettings] = useState({
    defaultFormat: 'both', // 'pdf', 'docx', 'both'
    pdfQuality: 'high',
    includeMetadata: true,
    compressionLevel: 6,
    watermark: false,
    watermarkText: '',
  });

  const [systemSettings, setSystemSettings] = useState({
    theme: 'light',
    language: 'vi',
    timezone: 'Asia/Ho_Chi_Minh',
    logLevel: 'info',
    enableDebugMode: false,
  });

  const { data: stats } = useQuery({
    queryKey: ["/api/stats"],
  });

  const saveSettingsMutation = useMutation({
    mutationFn: async (settings: any) => {
      const response = await fetch('/api/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings),
      });
      if (!response.ok) throw new Error('Failed to save settings');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Thành công",
        description: "Cài đặt đã được lưu",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/settings"] });
    },
    onError: () => {
      toast({
        title: "Lỗi",
        description: "Không thể lưu cài đặt",
        variant: "destructive",
      });
    },
  });

  const clearCacheMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/admin/clear-cache', {
        method: 'POST',
      });
      if (!response.ok) throw new Error('Failed to clear cache');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Thành công",
        description: "Cache đã được xóa",
      });
    },
  });

  const handleSaveSettings = () => {
    const allSettings = {
      processing: processingSettings,
      output: outputSettings,
      system: systemSettings,
    };
    saveSettingsMutation.mutate(allSettings);
  };

  return (
    <div className="min-h-screen flex bg-gray-50">
      <Sidebar />
      
      <main className="flex-1 overflow-hidden">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Cài đặt</h2>
              <p className="text-gray-600 mt-1">Cấu hình hệ thống và tùy chỉnh</p>
            </div>
            <div className="flex items-center space-x-3">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => clearCacheMutation.mutate()}
                disabled={clearCacheMutation.isPending}
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${clearCacheMutation.isPending ? 'animate-spin' : ''}`} />
                Xóa Cache
              </Button>
              <Button 
                variant="default" 
                size="sm"
                onClick={handleSaveSettings}
                disabled={saveSettingsMutation.isPending}
              >
                <Save className="w-4 h-4 mr-2" />
                Lưu cài đặt
              </Button>
            </div>
          </div>
        </header>

        <div className="p-6 space-y-6 overflow-y-auto h-full">
          {/* System Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Database className="w-5 h-5 mr-2" />
                Trạng thái Hệ thống
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{stats?.totalFilesProcessed || 0}</div>
                  <div className="text-sm text-green-700">File đã xử lý</div>
                </div>
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{stats?.totalExtractedResults || 0}</div>
                  <div className="text-sm text-blue-700">Kết quả đã tạo</div>
                </div>
                <div className="text-center p-4 bg-yellow-50 rounded-lg">
                  <div className="text-2xl font-bold text-yellow-600">{stats?.avgProcessingTimeMinutes || 0}</div>
                  <div className="text-sm text-yellow-700">Phút/file trung bình</div>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">{stats?.successRate || 0}%</div>
                  <div className="text-sm text-purple-700">Tỷ lệ thành công</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Processing Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Zap className="w-5 h-5 mr-2" />
                Cài đặt Xử lý
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="maxFileSize">Kích thước file tối đa (MB)</Label>
                  <Input
                    id="maxFileSize"
                    type="number"
                    value={processingSettings.maxFileSize}
                    onChange={(e) => setProcessingSettings(prev => ({
                      ...prev,
                      maxFileSize: parseInt(e.target.value) || 0
                    }))}
                  />
                  <p className="text-sm text-gray-500">Giới hạn kích thước file có thể tải lên</p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="maxConcurrentJobs">Số job đồng thời tối đa</Label>
                  <Input
                    id="maxConcurrentJobs"
                    type="number"
                    min="1"
                    max="10"
                    value={processingSettings.maxConcurrentJobs}
                    onChange={(e) => setProcessingSettings(prev => ({
                      ...prev,
                      maxConcurrentJobs: parseInt(e.target.value) || 1
                    }))}
                  />
                  <p className="text-sm text-gray-500">Số lượng file có thể xử lý cùng lúc</p>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="autoCleanup">Tự động dọn dẹp</Label>
                    <p className="text-sm text-gray-500">Tự động xóa file cũ sau một khoảng thời gian</p>
                  </div>
                  <Switch
                    id="autoCleanup"
                    checked={processingSettings.autoCleanup}
                    onCheckedChange={(checked) => setProcessingSettings(prev => ({
                      ...prev,
                      autoCleanup: checked
                    }))}
                  />
                </div>

                {processingSettings.autoCleanup && (
                  <div className="space-y-2">
                    <Label htmlFor="cleanupDays">Xóa file sau (ngày)</Label>
                    <Input
                      id="cleanupDays"
                      type="number"
                      min="1"
                      value={processingSettings.cleanupDays}
                      onChange={(e) => setProcessingSettings(prev => ({
                        ...prev,
                        cleanupDays: parseInt(e.target.value) || 1
                      }))}
                    />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Output Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileText className="w-5 h-5 mr-2" />
                Cài đặt Xuất file
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="defaultFormat">Định dạng mặc định</Label>
                  <select
                    id="defaultFormat"
                    value={outputSettings.defaultFormat}
                    onChange={(e) => setOutputSettings(prev => ({
                      ...prev,
                      defaultFormat: e.target.value
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="both">PDF + Word</option>
                    <option value="pdf">Chỉ PDF</option>
                    <option value="docx">Chỉ Word</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="pdfQuality">Chất lượng PDF</Label>
                  <select
                    id="pdfQuality"
                    value={outputSettings.pdfQuality}
                    onChange={(e) => setOutputSettings(prev => ({
                      ...prev,
                      pdfQuality: e.target.value
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="high">Cao</option>
                    <option value="medium">Trung bình</option>
                    <option value="low">Thấp</option>
                  </select>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="includeMetadata">Bao gồm metadata</Label>
                    <p className="text-sm text-gray-500">Thêm thông tin metadata vào file xuất</p>
                  </div>
                  <Switch
                    id="includeMetadata"
                    checked={outputSettings.includeMetadata}
                    onCheckedChange={(checked) => setOutputSettings(prev => ({
                      ...prev,
                      includeMetadata: checked
                    }))}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="watermark">Thêm watermark</Label>
                    <p className="text-sm text-gray-500">Thêm watermark vào file PDF</p>
                  </div>
                  <Switch
                    id="watermark"
                    checked={outputSettings.watermark}
                    onCheckedChange={(checked) => setOutputSettings(prev => ({
                      ...prev,
                      watermark: checked
                    }))}
                  />
                </div>

                {outputSettings.watermark && (
                  <div className="space-y-2">
                    <Label htmlFor="watermarkText">Nội dung watermark</Label>
                    <Input
                      id="watermarkText"
                      value={outputSettings.watermarkText}
                      onChange={(e) => setOutputSettings(prev => ({
                        ...prev,
                        watermarkText: e.target.value
                      }))}
                      placeholder="Nhập nội dung watermark..."
                    />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Notification Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Bell className="w-5 h-5 mr-2" />
                Cài đặt Thông báo
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="emailNotifications">Thông báo Email</Label>
                  <p className="text-sm text-gray-500">Nhận thông báo qua email khi hoàn thành xử lý</p>
                </div>
                <Switch
                  id="emailNotifications"
                  checked={processingSettings.enableEmailNotifications}
                  onCheckedChange={(checked) => setProcessingSettings(prev => ({
                    ...prev,
                    enableEmailNotifications: checked
                  }))}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="pushNotifications">Thông báo Push</Label>
                  <p className="text-sm text-gray-500">Nhận thông báo trực tiếp trên trình duyệt</p>
                </div>
                <Switch
                  id="pushNotifications"
                  checked={processingSettings.enablePushNotifications}
                  onCheckedChange={(checked) => setProcessingSettings(prev => ({
                    ...prev,
                    enablePushNotifications: checked
                  }))}
                />
              </div>
            </CardContent>
          </Card>

          {/* System Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <SettingsIcon className="w-5 h-5 mr-2" />
                Cài đặt Hệ thống
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="language">Ngôn ngữ</Label>
                  <select
                    id="language"
                    value={systemSettings.language}
                    onChange={(e) => setSystemSettings(prev => ({
                      ...prev,
                      language: e.target.value
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="vi">Tiếng Việt</option>
                    <option value="en">English</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="timezone">Múi giờ</Label>
                  <select
                    id="timezone"
                    value={systemSettings.timezone}
                    onChange={(e) => setSystemSettings(prev => ({
                      ...prev,
                      timezone: e.target.value
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="Asia/Ho_Chi_Minh">Việt Nam (+7)</option>
                    <option value="UTC">UTC (+0)</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="debugMode">Chế độ Debug</Label>
                  <p className="text-sm text-gray-500">Bật để xem thông tin debug chi tiết</p>
                </div>
                <Switch
                  id="debugMode"
                  checked={systemSettings.enableDebugMode}
                  onCheckedChange={(checked) => setSystemSettings(prev => ({
                    ...prev,
                    enableDebugMode: checked
                  }))}
                />
              </div>
            </CardContent>
          </Card>

          {/* Danger Zone */}
          <Card className="border-red-200">
            <CardHeader>
              <CardTitle className="flex items-center text-red-700">
                <AlertTriangle className="w-5 h-5 mr-2" />
                Vùng Nguy hiểm
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-red-50 p-4 rounded-lg">
                <div className="flex items-start space-x-3">
                  <Info className="w-5 h-5 text-red-500 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-red-800">Cảnh báo</h4>
                    <p className="text-sm text-red-700">
                      Các thao tác dưới đây có thể ảnh hưởng đến dữ liệu hệ thống. Hãy thận trọng!
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center justify-between p-4 border border-red-200 rounded-lg">
                <div>
                  <h4 className="font-medium text-gray-900">Xóa tất cả dữ liệu</h4>
                  <p className="text-sm text-gray-500">Xóa vĩnh viễn tất cả file và dữ liệu đã xử lý</p>
                </div>
                <Button variant="destructive" size="sm">
                  <Trash2 className="w-4 h-4 mr-2" />
                  Xóa tất cả
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}