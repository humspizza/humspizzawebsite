import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Bell, X, Clock, User, Phone, MessageSquare, AlertCircle, Check } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useLanguage } from '@/contexts/LanguageContext';

interface Notification {
  id: string;
  type: 'order' | 'reservation' | 'contact' | 'website_update';
  title: string;
  titleVi?: string;
  content: string;
  contentVi?: string;
  customerName?: string;
  customerPhone?: string;
  referenceId?: string;
  referenceType?: string;
  isRead: boolean;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  createdAt: string;
}

export default function NotificationPanel() {
  const { t, language } = useLanguage();
  const { toast } = useToast();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);

  const { data: notifications = [], isLoading } = useQuery<Notification[]>({
    queryKey: ['/api/notifications'],
  });

  const { data: unreadCountData } = useQuery<{ count: number }>({
    queryKey: ['/api/notifications/unread-count'],
  });
  
  const unreadCount = unreadCountData?.count || 0;

  const markAsReadMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest('PATCH', `/api/notifications/${id}/read`);
      return response.json();
    },
    onSuccess: () => {
      // Force refetch to ensure UI updates
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
      queryClient.invalidateQueries({ queryKey: ['/api/notifications/unread-count'] });
      queryClient.refetchQueries({ queryKey: ['/api/notifications'] });
      queryClient.refetchQueries({ queryKey: ['/api/notifications/unread-count'] });
    },
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('PATCH', '/api/notifications/mark-all-read');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
      queryClient.invalidateQueries({ queryKey: ['/api/notifications/unread-count'] });
      toast({
        title: language === 'vi' ? 'Thành công' : 'Success',
        description: language === 'vi' ? 'Đã đánh dấu tất cả thông báo là đã đọc' : 'Marked all notifications as read',
      });
    },
  });

  const deleteNotificationMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest('DELETE', `/api/notifications/${id}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
      queryClient.invalidateQueries({ queryKey: ['/api/notifications/unread-count'] });
      setSelectedNotification(null);
      toast({
        title: language === 'vi' ? 'Thành công' : 'Success',
        description: language === 'vi' ? 'Đã xóa thông báo' : 'Notification deleted',
      });
    },
  });

  const deleteAllNotificationsMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('DELETE', '/api/notifications/delete-all');
      return response.json();
    },
    onSuccess: () => {
      // Clear cache completely and force refetch
      queryClient.removeQueries({ queryKey: ['/api/notifications'] });
      queryClient.removeQueries({ queryKey: ['/api/notifications/unread-count'] });
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
      queryClient.invalidateQueries({ queryKey: ['/api/notifications/unread-count'] });
      
      // Force immediate refetch
      setTimeout(() => {
        queryClient.refetchQueries({ queryKey: ['/api/notifications'] });
        queryClient.refetchQueries({ queryKey: ['/api/notifications/unread-count'] });
      }, 100);
      
      setSelectedNotification(null);
      setIsModalOpen(false);
      toast({
        title: language === 'vi' ? 'Thành công' : 'Success',
        description: language === 'vi' ? 'Đã xóa tất cả thông báo' : 'All notifications deleted',
      });
    },
  });

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'order':
        return <MessageSquare className="w-4 h-4" />;
      case 'reservation':
        return <Clock className="w-4 h-4" />;
      case 'contact':
        return <Phone className="w-4 h-4" />;
      case 'website_update':
        return <AlertCircle className="w-4 h-4" />;
      default:
        return <Bell className="w-4 h-4" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-500/10 text-red-600 border-red-600';
      case 'high':
        return 'bg-orange-500/10 text-orange-600 border-orange-600';
      case 'normal':
        return 'bg-blue-500/10 text-blue-600 border-blue-600';
      case 'low':
        return 'bg-gray-500/10 text-gray-600 border-gray-600';
      default:
        return 'bg-blue-500/10 text-blue-600 border-blue-600';
    }
  };

  const getNotificationTitle = (notification: Notification) => {
    return language === 'vi' && notification.titleVi ? notification.titleVi : notification.title;
  };

  const getNotificationContent = (notification: Notification) => {
    return language === 'vi' && notification.contentVi ? notification.contentVi : notification.content;
  };

  const handleNotificationClick = (notification: Notification) => {
    setSelectedNotification(notification);
    setIsModalOpen(true);
    if (!notification.isRead) {
      markAsReadMutation.mutate(notification.id);
    }
  };

  const unreadNotifications = notifications.filter(n => !n.isRead);

  if (isLoading) {
    return null;
  }

  return (
    <>
      <Popover>
        <PopoverTrigger asChild>
          <Button 
            variant="outline" 
            size="sm"
            className="relative border-zinc-700 text-white hover:bg-zinc-800"
            data-testid="notification-trigger"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <Badge 
                variant="destructive" 
                className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs"
              >
                {unreadCount > 99 ? '99+' : unreadCount}
              </Badge>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 max-h-96 p-0" align="end">
          <div className="p-3 border-b">
            <div className="flex items-center justify-between">
              <h3 className="font-medium">
                {language === 'vi' ? 'Thông báo' : 'Notifications'}
              </h3>
              {unreadNotifications.length > 0 && (
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => markAllAsReadMutation.mutate()}
                  disabled={markAllAsReadMutation.isPending}
                  data-testid="mark-all-read-button"
                  className="text-xs px-2 py-1"
                >
                  {language === 'vi' ? 'Đánh dấu tất cả đã đọc' : 'Mark all read'}
                </Button>
              )}
            </div>
          </div>
          <div className="max-h-72 overflow-y-auto overflow-x-hidden" style={{scrollbarWidth: 'thin', scrollbarColor: '#6b7280 #f3f4f6'}}>
            {notifications.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm">
                {language === 'vi' ? 'Không có thông báo nào' : 'No notifications'}
              </div>
            ) : (
              <div className="p-1">
                {notifications.slice(0, 10).map((notification) => (
                  <div 
                    key={notification.id} 
                    className={`p-3 hover:bg-muted/50 border-b last:border-b-0 ${
                      !notification.isRead ? 'bg-primary/5' : ''
                    }`}
                    data-testid={`notification-item-${notification.id}`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 mt-0.5">
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div 
                        className="flex-1 min-w-0 cursor-pointer"
                        onClick={() => handleNotificationClick(notification)}
                      >
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium line-clamp-1">
                            {getNotificationTitle(notification)}
                          </p>
                          {!notification.isRead && (
                            <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></div>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                          {getNotificationContent(notification)}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="outline" className={`text-xs ${getPriorityColor(notification.priority)}`}>
                            {notification.priority}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {new Date(notification.createdAt).toLocaleDateString(language === 'vi' ? 'vi-VN' : 'en-US')}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          {notifications.length > 10 && (
            <div className="p-3 border-t">
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full"
                onClick={() => setIsModalOpen(true)}
              >
                {language === 'vi' ? 'Xem tất cả thông báo' : 'View all notifications'}
              </Button>
            </div>
          )}
        </PopoverContent>
      </Popover>

      {/* Full Notification Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] [&>button]:hidden" data-testid="notification-modal">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bell className="w-5 h-5" />
                {language === 'vi' ? 'Tất cả thông báo' : 'All Notifications'}
              </div>
              <div className="flex gap-2">
                {unreadNotifications.length > 0 && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => markAllAsReadMutation.mutate()}
                    disabled={markAllAsReadMutation.isPending}
                  >
                    <Check className="w-4 h-4 mr-1" />
                    {language === 'vi' ? 'Đánh dấu tất cả đã đọc' : 'Mark all read'}
                  </Button>
                )}
              </div>
            </DialogTitle>
          </DialogHeader>
          
          <ScrollArea className="max-h-[60vh] scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-zinc-100">
            {notifications.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {language === 'vi' ? 'Không có thông báo nào' : 'No notifications'}
              </div>
            ) : (
              <div className="space-y-3">
                {notifications.map((notification) => (
                  <Card 
                    key={notification.id} 
                    className={`cursor-pointer transition-colors hover:bg-muted/50 ${
                      !notification.isRead ? 'border-primary/50 bg-primary/5' : ''
                    }`}
                    onClick={() => setSelectedNotification(notification)}
                    data-testid={`notification-detail-${notification.id}`}
                  >
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          {getNotificationIcon(notification.type)}
                          <CardTitle className="text-sm font-medium">
                            {getNotificationTitle(notification)}
                          </CardTitle>
                          {!notification.isRead && (
                            <Badge variant="default" className="text-xs">
                              {language === 'vi' ? 'Mới' : 'New'}
                            </Badge>
                          )}
                        </div>
                        <Badge variant="outline" className={getPriorityColor(notification.priority)}>
                          {notification.priority}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <CardDescription className="text-sm mb-2">
                        {getNotificationContent(notification)}
                      </CardDescription>
                      
                      {/* Customer info for customer-related notifications */}
                      {(notification.customerName || notification.customerPhone) && (
                        <div className="flex items-center gap-4 text-xs text-muted-foreground mb-2">
                          {notification.customerName && (
                            <div className="flex items-center gap-1">
                              <User className="w-3 h-3" />
                              {notification.customerName}
                            </div>
                          )}
                          {notification.customerPhone && (
                            <div className="flex items-center gap-1">
                              <Phone className="w-3 h-3" />
                              {notification.customerPhone}
                            </div>
                          )}
                        </div>
                      )}
                      
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>
                          {new Date(notification.createdAt).toLocaleString(language === 'vi' ? 'vi-VN' : 'en-US')}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteNotificationMutation.mutate(notification.id);
                          }}
                          className="text-red-400 hover:text-red-300 hover:bg-red-500/10 flex-shrink-0 h-6 w-6 p-0"
                          data-testid={`delete-notification-${notification.id}`}
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </>
  );
}