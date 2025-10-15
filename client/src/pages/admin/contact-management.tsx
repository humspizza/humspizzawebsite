import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Mail, Clock, User, MessageSquare, Trash2, Search, Filter, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { apiRequest } from "@/lib/queryClient";
import type { ContactMessage } from "@shared/schema";
import { formatDistanceToNow } from "date-fns";

interface ContactManagementProps {
  showDeleteButton?: boolean;
}

export default function ContactManagement({ showDeleteButton = true }: ContactManagementProps) {
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [timeFilter, setTimeFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const { toast } = useToast();
  const { language } = useLanguage();
  const queryClient = useQueryClient();

  const { data: contactMessages = [], isLoading } = useQuery({
    queryKey: ["/api/contact"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/contact");
      return response.json() as Promise<ContactMessage[]>;
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const response = await apiRequest("PATCH", `/api/contact/${id}/status`, { status });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/contact"] });
      toast({
        title: language === 'vi' ? 'Đã cập nhật' : 'Updated',
        description: language === 'vi' ? 'Trạng thái tin nhắn đã được cập nhật' : 'Message status updated successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: language === 'vi' ? 'Lỗi' : 'Error',
        description: error.message || 'Failed to update status',
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest("DELETE", `/api/contact/${id}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/contact"] });
      toast({
        title: language === 'vi' ? 'Đã xóa' : 'Deleted',
        description: language === 'vi' ? 'Tin nhắn đã được xóa' : 'Message deleted successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: language === 'vi' ? 'Lỗi' : 'Error',
        description: error.message || 'Failed to delete message',
        variant: "destructive",
      });
    },
  });

  const filteredMessages = contactMessages.filter(message => {
    // Filter by status
    if (selectedStatus !== "all" && message.status !== selectedStatus) {
      return false;
    }

    // Filter by time
    if (timeFilter !== "all") {
      const messageDate = new Date(message.createdAt);
      const now = new Date();
      const diffDays = Math.floor((now.getTime() - messageDate.getTime()) / (1000 * 60 * 60 * 24));
      
      switch (timeFilter) {
        case "today":
          if (diffDays > 0) return false;
          break;
        case "7days":
          if (diffDays > 7) return false;
          break;
        case "30days":
          if (diffDays > 30) return false;
          break;
        case "90days":
          if (diffDays > 90) return false;
          break;
      }
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      return (
        message.name.toLowerCase().includes(query) ||
        message.email.toLowerCase().includes(query) ||
        message.subject.toLowerCase().includes(query) ||
        message.message.toLowerCase().includes(query)
      );
    }

    return true;
  });

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      new: { color: "bg-blue-500", text: language === 'vi' ? 'Mới' : 'New' },
      replied: { color: "bg-green-500", text: language === 'vi' ? 'Đã trả lời' : 'Replied' },
      archived: { color: "bg-gray-500", text: language === 'vi' ? 'Lưu trữ' : 'Archived' }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.new;
    return (
      <Badge className={`${config.color} text-white`}>
        {config.text}
      </Badge>
    );
  };

  const getMessageStats = () => {
    const stats = {
      total: contactMessages.length,
      new: contactMessages.filter(m => m.status === 'new').length,
      replied: contactMessages.filter(m => m.status === 'replied').length,
      archived: contactMessages.filter(m => m.status === 'archived').length,
    };
    return stats;
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg text-white">{language === 'vi' ? 'Đang tải...' : 'Loading...'}</div>
      </div>
    );
  }

  const stats = getMessageStats();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white">
            {language === 'vi' ? 'Tin Nhắn Liên Hệ' : 'Contact Message Management'}
          </h1>
          <p className="text-zinc-400 mt-1">
            {language === 'vi' ? 'Quản lý các yêu cầu và tin nhắn liên hệ của khách hàng' : 'Manage customer inquiries and contact messages'}
          </p>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-white">{stats.total}</div>
            <div className="text-sm text-zinc-400">
              {language === 'vi' ? 'Tổng tin nhắn' : 'Total Messages'}
            </div>
          </CardContent>
        </Card>
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-400">{stats.new}</div>
            <div className="text-sm text-zinc-400">
              {language === 'vi' ? 'Tin nhắn mới' : 'New Messages'}
            </div>
          </CardContent>
        </Card>
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-400">{stats.replied}</div>
            <div className="text-sm text-zinc-400">
              {language === 'vi' ? 'Đã trả lời' : 'Replied'}
            </div>
          </CardContent>
        </Card>
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-zinc-400">{stats.archived}</div>
            <div className="text-sm text-zinc-400">
              {language === 'vi' ? 'Lưu trữ' : 'Archived'}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder={language === 'vi' ? 'Tìm kiếm tin nhắn...' : 'Search messages...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-zinc-800 border-zinc-700 text-white"
            data-testid="input-search-messages"
          />
        </div>
        
        <div className="flex gap-4 items-center">
          <label className="text-sm font-medium text-white">
            {language === 'vi' ? 'Trạng thái:' : 'Status:'}
          </label>
          <Select value={selectedStatus} onValueChange={setSelectedStatus}>
            <SelectTrigger className="w-40 bg-zinc-800 border-zinc-700 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-zinc-800 border-zinc-700">
              <SelectItem value="all">{language === 'vi' ? 'Tất cả' : 'All'}</SelectItem>
              <SelectItem value="new">{language === 'vi' ? 'Mới' : 'New'}</SelectItem>
              <SelectItem value="replied">{language === 'vi' ? 'Đã trả lời' : 'Replied'}</SelectItem>
              <SelectItem value="archived">{language === 'vi' ? 'Lưu trữ' : 'Archived'}</SelectItem>
            </SelectContent>
          </Select>
          
          <label className="text-sm font-medium text-white">
            {language === 'vi' ? 'Thời gian:' : 'Time:'}
          </label>
          <Select value={timeFilter} onValueChange={setTimeFilter}>
            <SelectTrigger className="w-40 bg-zinc-800 border-zinc-700 text-white">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-zinc-800 border-zinc-700">
              <SelectItem value="all">{language === 'vi' ? 'Tất cả' : 'All Time'}</SelectItem>
              <SelectItem value="today">{language === 'vi' ? 'Hôm nay' : 'Today'}</SelectItem>
              <SelectItem value="7days">{language === 'vi' ? '7 ngày qua' : 'Last 7 Days'}</SelectItem>
              <SelectItem value="30days">{language === 'vi' ? '30 ngày qua' : 'Last 30 Days'}</SelectItem>
              <SelectItem value="90days">{language === 'vi' ? '90 ngày qua' : 'Last 90 Days'}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      {/* Results count and warning */}
      <div className="flex justify-between items-center">
        <div className="text-sm text-zinc-400">
          {language === 'vi' 
            ? `Hiển thị ${filteredMessages.length} / ${contactMessages.length} tin nhắn`
            : `Showing ${filteredMessages.length} / ${contactMessages.length} messages`
          }
        </div>
        <div className="text-sm text-amber-400 bg-amber-900/20 px-3 py-1 rounded border border-amber-500/30 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4" />
          {language === 'vi' 
            ? 'Tin nhắn không được lưu trữ sẽ tự động bị xóa sau 3 tháng'
            : 'Messages not archived will be automatically deleted after 3 months'
          }
        </div>
      </div>
      
      {/* Archive info */}
      {selectedStatus === "archived" && (
        <div className="flex justify-end items-center">
          <div className="text-sm text-zinc-400 bg-zinc-800 px-3 py-1 rounded">
            {language === 'vi' 
              ? 'Tin nhắn đã lưu trữ vẫn được lưu trữ trong hệ thống và có thể truy cập khi cần'
              : 'Archived messages are kept in the system and can be accessed when needed'
            }
          </div>
        </div>
      )}

      {/* Messages List */}
      <div className="space-y-4">
        {filteredMessages.length === 0 ? (
          <Card className="bg-zinc-900 border-zinc-800">
            <CardContent className="p-8 text-center">
              <MessageSquare className="w-12 h-12 mx-auto text-zinc-400 mb-4" />
              <div className="text-lg font-medium text-white">
                {language === 'vi' ? 'Không có tin nhắn nào' : 'No messages found'}
              </div>
              <div className="text-sm text-zinc-400">
                {language === 'vi' ? 'Tin nhắn từ khách hàng sẽ xuất hiện ở đây' : 'Customer messages will appear here'}
              </div>
            </CardContent>
          </Card>
        ) : (
          filteredMessages.map((message) => (
            <Card key={message.id} className={`bg-zinc-900 border-zinc-800 ${message.status === 'new' ? 'border-blue-500' : ''}`}>
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-zinc-800 rounded-full flex items-center justify-center">
                      <User className="w-5 h-5 text-zinc-400" />
                    </div>
                    <div>
                      <div className="font-semibold text-white">{message.name}</div>
                      <div className="text-sm text-zinc-400">
                        {message.email}
                      </div>
                      {message.phone && (
                        <div className="text-sm text-zinc-400 mt-1">
                          {message.phone}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {getStatusBadge(message.status)}
                    <div className="text-sm text-zinc-400 flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {formatDistanceToNow(new Date(message.createdAt), { addSuffix: true })}
                    </div>
                  </div>
                </div>

                <div className="mb-4">
                  <div className="font-medium text-sm mb-2 text-white">
                    {language === 'vi' ? 'Chủ đề:' : 'Subject:'} {message.subject}
                  </div>
                  <div className="text-sm text-zinc-300 p-3 bg-zinc-800 border-l-2 border-zinc-600 rounded-r">
                    {message.message}
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <div className="flex gap-2">
                    <Select
                      value={message.status}
                      onValueChange={(status) => updateStatusMutation.mutate({ id: message.id, status })}
                    >
                      <SelectTrigger className="w-32 bg-zinc-700 border-zinc-600 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-zinc-800 border-zinc-700">
                        <SelectItem value="new">{language === 'vi' ? 'Mới' : 'New'}</SelectItem>
                        <SelectItem value="replied">{language === 'vi' ? 'Đã trả lời' : 'Replied'}</SelectItem>
                        <SelectItem value="archived">{language === 'vi' ? 'Lưu trữ' : 'Archived'}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {showDeleteButton && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" size="sm" className="text-red-400 hover:text-red-300 border-zinc-700 hover:bg-zinc-800">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="bg-zinc-900 border-zinc-800">
                        <AlertDialogHeader>
                          <AlertDialogTitle className="text-white">
                            {language === 'vi' ? 'Xác nhận xóa' : 'Confirm Delete'}
                          </AlertDialogTitle>
                          <AlertDialogDescription className="text-zinc-400">
                            {language === 'vi' 
                              ? 'Bạn có chắc chắn muốn xóa tin nhắn này? Hành động này không thể hoàn tác.'
                              : 'Are you sure you want to delete this message? This action cannot be undone.'
                            }
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel className="bg-zinc-800 border-zinc-700 text-white hover:bg-zinc-700">
                            {language === 'vi' ? 'Hủy' : 'Cancel'}
                          </AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => deleteMutation.mutate(message.id)}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            {language === 'vi' ? 'Xóa' : 'Delete'}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}