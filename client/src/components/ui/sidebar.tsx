import { FileSearch, Upload, History, Download, Settings, User, LogOut } from "lucide-react";
import { Button } from "./button";
import { Link, useLocation } from "wouter";

export function Sidebar() {
  const [location] = useLocation();

  const isActive = (path: string) => {
    return location === path;
  };

  const getButtonVariant = (path: string) => {
    return isActive(path) ? "default" : "ghost";
  };

  const getButtonClass = (path: string) => {
    return isActive(path) 
      ? "w-full justify-start bg-blue-50 text-primary hover:bg-blue-100"
      : "w-full justify-start text-gray-600 hover:text-gray-900 hover:bg-gray-50";
  };

  return (
    <aside className="w-64 bg-white shadow-lg border-r border-gray-200">
      <div className="p-6 border-b border-gray-200">
        <Link href="/">
          <div className="flex items-center space-x-3 cursor-pointer">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <FileSearch className="text-white text-lg" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-gray-900">Medical Processor</h1>
              <p className="text-sm text-gray-500">Admin Dashboard</p>
            </div>
          </div>
        </Link>
      </div>
      
      <nav className="p-4 space-y-2">
        <Link href="/">
          <Button
            variant={getButtonVariant("/")}
            className={getButtonClass("/")}
          >
            <Upload className="w-5 h-5 mr-3" />
            Tải lên & Xử lý
          </Button>
        </Link>
        <Link href="/history">
          <Button 
            variant={getButtonVariant("/history")}
            className={getButtonClass("/history")}
          >
            <History className="w-5 h-5 mr-3" />
            Lịch sử xử lý
          </Button>
        </Link>
        <Link href="/downloads">
          <Button 
            variant={getButtonVariant("/downloads")}
            className={getButtonClass("/downloads")}
          >
            <Download className="w-5 h-5 mr-3" />
            Tải xuống
          </Button>
        </Link>
        <Link href="/settings">
          <Button 
            variant={getButtonVariant("/settings")}
            className={getButtonClass("/settings")}
          >
            <Settings className="w-5 h-5 mr-3" />
            Cài đặt
          </Button>
        </Link>
      </nav>
      
      <div className="absolute bottom-4 left-4 right-4">
        <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
          <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
            <User className="text-gray-600 text-sm" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">Admin User</p>
            <p className="text-xs text-gray-500">Đã đăng nhập</p>
          </div>
          <Button variant="ghost" size="sm" className="text-gray-400 hover:text-gray-600 p-1">
            <LogOut className="text-sm" />
          </Button>
        </div>
      </div>
    </aside>
  );
}
