import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'wouter';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Calendar, Clock, Users, Package, Menu as MenuIcon, BookOpen, Home, Eye, Edit, LogOut, Phone, Search, Filter, AlertTriangle, Copy } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useState, useEffect } from 'react';
import { formatPrice } from '@/lib/currency';
import StaffMenuManagement from './menu-management';
import ContactManagement from '../admin/contact-management';
import { useSessionTimeout } from '@/hooks/useSessionTimeout';
import NotificationPanel from '@/components/NotificationPanel';
import { formatDbTimestamp } from '@/lib/utils';

interface StaffDashboardProps {
  user: any;
  onLogout?: () => void;
}

export default function StaffDashboard({ user, onLogout }: StaffDashboardProps) {
  const { t, language: currentLanguage } = useLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeSection, setActiveSection] = useState('overview');
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [selectedReservation, setSelectedReservation] = useState<any>(null);
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [isReservationModalOpen, setIsReservationModalOpen] = useState(false);

  // Setup session timeout (2 hours with 10 minute warning)
  const { logout: sessionLogout, checkSession } = useSessionTimeout({
    timeoutDuration: 120 * 60 * 1000, // 2 hours
    warningDuration: 10 * 60 * 1000,  // 10 minute warning
    onTimeout: onLogout,
    enabled: true
  });

  // Check session on component mount and user changes
  useEffect(() => {
    checkSession();
  }, [checkSession, user]);
  
  // Search and filter states
  const [reservationSearch, setReservationSearch] = useState("");
  const [orderSearch, setOrderSearch] = useState("");
  const [reservationTimeFilter, setReservationTimeFilter] = useState("all");
  const [orderTimeFilter, setOrderTimeFilter] = useState("all");

  // Get all orders
  const { data: ordersData = [], isLoading: ordersLoading } = useQuery({
    queryKey: ['/api/orders'],
  });

  // Get all reservations
  const { data: reservationsData = [], isLoading: reservationsLoading } = useQuery({
    queryKey: ['/api/reservations'],
  });

  // Ensure data is in array format
  const orders = Array.isArray(ordersData) ? ordersData : [];
  const reservations = Array.isArray(reservationsData) ? reservationsData : [];

  const navigationItems = [
    { 
      id: 'overview', 
      label: currentLanguage === 'vi' ? 'Bảng Điều Khiển' : 'Dashboard', 
      icon: MenuIcon 
    },
    { 
      id: 'orders', 
      label: currentLanguage === 'vi' ? 'Quản Lý Đơn Hàng' : 'Order Management', 
      icon: Package 
    },
    { 
      id: 'reservations', 
      label: currentLanguage === 'vi' ? 'Quản Lý Đặt Bàn' : 'Reservation Management', 
      icon: Calendar 
    },
    { 
      id: 'menu', 
      label: currentLanguage === 'vi' ? 'Quản Lý Thực Đơn' : 'Menu Management', 
      icon: BookOpen 
    },
    { 
      id: 'contact', 
      label: currentLanguage === 'vi' ? 'Tin Nhắn Liên Hệ' : 'Contact Messages', 
      icon: Phone 
    },
  ];

  // Time filter function
  const getTimeFilteredData = (data: any[], timeFilter: string) => {
    if (timeFilter === "all") return data;
    
    const now = new Date();
    const startOfPeriod = new Date();
    
    switch (timeFilter) {
      case "today":
        startOfPeriod.setHours(0, 0, 0, 0);
        break;
      case "week":
        startOfPeriod.setDate(now.getDate() - 7);
        break;
      case "month":
        startOfPeriod.setMonth(now.getMonth() - 1);
        break;
      default:
        return data;
    }
    
    return data.filter(item => new Date(item.createdAt || item.date) >= startOfPeriod);
  };

  // Apply filters
  const filteredReservations = getTimeFilteredData(reservations, reservationTimeFilter)
    .filter(r => 
      (r.name?.toLowerCase() || '').includes(reservationSearch.toLowerCase()) ||
      (r.email?.toLowerCase() || '').includes(reservationSearch.toLowerCase()) ||
      (r.phone?.toLowerCase() || '').includes(reservationSearch.toLowerCase())
    );

  const filteredOrders = getTimeFilteredData(orders, orderTimeFilter)
    .filter(o => 
      (o.customerName?.toLowerCase() || '').includes(orderSearch.toLowerCase()) ||
      (o.customerEmail?.toLowerCase() || '').includes(orderSearch.toLowerCase()) ||
      (o.id?.toLowerCase() || '').includes(orderSearch.toLowerCase())
    );



  const getOrderTypeText = (orderType: string) => {
    if (currentLanguage === 'vi') {
      switch (orderType) {
        case 'dine-in': return 'Tại chỗ';
        case 'takeout': return 'Mang về';
        case 'delivery': return 'Giao hàng';
        default: return orderType;
      }
    } else {
      switch (orderType) {
        case 'dine-in': return 'Dine In';
        case 'takeout': return 'Takeout';
        case 'delivery': return 'Delivery';
        default: return orderType;
      }
    }
  };

  const getStatusBadge = (status: string) => {
    const statusText = currentLanguage === 'vi' ? {
      pending: 'Chờ xử lý',
      confirmed: 'Đã xác nhận',
      completed: 'Hoàn thành',
      cancelled: 'Đã hủy',
      preparing: 'Đang chuẩn bị',
      ready: 'Sẵn sàng'
    } : {
      pending: 'Pending',
      confirmed: 'Confirmed', 
      completed: 'Completed',
      cancelled: 'Cancelled',
      preparing: 'Preparing',
      ready: 'Ready'
    };

    const colors = {
      pending: 'bg-yellow-500/10 text-yellow-600 border-yellow-600',
      confirmed: 'bg-blue-500/10 text-blue-600 border-blue-600',
      completed: 'bg-green-500/10 text-green-600 border-green-600',
      cancelled: 'bg-red-500/10 text-red-600 border-red-600',
      preparing: 'bg-orange-500/10 text-orange-600 border-orange-600',
      ready: 'bg-purple-500/10 text-purple-600 border-purple-600'
    };

    return (
      <Badge variant="outline" className={colors[status as keyof typeof colors] || 'bg-zinc-100 text-zinc-600'}>
        {statusText[status as keyof typeof statusText] || status}
      </Badge>
    );
  };

  // Mutations for updating status
  const updateOrderStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const response = await apiRequest('PATCH', `/api/orders/${id}/status`, { status });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/orders'] });
      toast({
        title: currentLanguage === 'vi' ? 'Đã cập nhật' : 'Updated',
        description: currentLanguage === 'vi' ? 'Trạng thái đơn hàng đã được cập nhật' : 'Order status updated successfully',
      });
    },
  });

  // Copy to clipboard functions
  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast({
        title: currentLanguage === 'vi' ? 'Đã sao chép' : 'Copied',
        description: currentLanguage === 'vi' 
          ? `${label} đã được sao chép vào clipboard` 
          : `${label} has been copied to clipboard`,
      });
    }).catch(() => {
      toast({
        title: currentLanguage === 'vi' ? 'Lỗi' : 'Error',
        description: currentLanguage === 'vi' 
          ? 'Không thể sao chép' 
          : 'Failed to copy',
        variant: "destructive"
      });
    });
  };

  const copyAllInfo = (type: 'reservation' | 'order', item: any) => {
    let info = '';
    if (type === 'reservation') {
      info = `Tên: ${item.name}\nEmail: ${item.email}\nSĐT: ${item.phone}\nNgày: ${item.date}\nGiờ: ${item.time}\nSố người: ${item.guests}${item.specialRequests ? `\nYêu cầu: ${item.specialRequests}` : ''}`;
    } else {
      info = `Tên: ${item.customerName}\nEmail: ${item.customerEmail}\nSĐT: ${item.customerPhone}${item.customerAddress ? `\nĐịa chỉ: ${item.customerAddress}` : ''}\nTổng tiền: ${formatPrice(item.totalAmount)}`;
    }
    
    navigator.clipboard.writeText(info).then(() => {
      toast({
        title: currentLanguage === 'vi' ? 'Đã sao chép toàn bộ' : 'All info copied',
        description: currentLanguage === 'vi' 
          ? 'Thông tin đã được sao chép vào clipboard' 
          : 'Information has been copied to clipboard',
      });
    }).catch(() => {
      toast({
        title: currentLanguage === 'vi' ? 'Lỗi' : 'Error',
        description: currentLanguage === 'vi' 
          ? 'Không thể sao chép' 
          : 'Failed to copy',
        variant: "destructive"
      });
    });
  };

  const updateReservationStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const response = await apiRequest('PATCH', `/api/reservations/${id}/status`, { status });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/reservations'] });
      toast({
        title: currentLanguage === 'vi' ? 'Đã cập nhật' : 'Updated',
        description: currentLanguage === 'vi' ? 'Trạng thái đặt bàn đã được cập nhật' : 'Reservation status updated successfully',
      });
    },
  });



  if (ordersLoading || reservationsLoading) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-black flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  const renderContent = () => {
    switch (activeSection) {
      case 'overview':
        return (
          <>
            {/* Stats Cards */}
            <div className="grid gap-6 md:grid-cols-4 mb-8">
              <Card className="bg-zinc-900 border-zinc-800">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-zinc-300">
                    {currentLanguage === 'vi' ? 'Đơn hàng chờ' : 'Pending Orders'}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-white">
                    {orders.filter((order: any) => order.status === 'pending').length}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-zinc-900 border-zinc-800">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-zinc-300">
                    {currentLanguage === 'vi' ? 'Đặt bàn chờ' : 'Pending Reservations'}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-white">
                    {reservations.filter((res: any) => res.status === 'pending').length}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-zinc-900 border-zinc-800">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-zinc-300">
                    {currentLanguage === 'vi' ? 'Tổng đơn hàng' : 'Total Orders'}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-white">
                    {orders.length}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-zinc-900 border-zinc-800">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-zinc-300">
                    {currentLanguage === 'vi' ? 'Tổng đặt bàn' : 'Total Reservations'}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-white">
                    {reservations.length}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Activities */}
            <div className="grid gap-6 md:grid-cols-2">
              <Card className="bg-zinc-900 border-zinc-800">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-white">
                    <Package className="h-5 w-5" />
                    {currentLanguage === 'vi' ? 'Đơn hàng gần đây' : 'Recent Orders'}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div 
                    className="space-y-4 max-h-96 overflow-y-auto"
                    style={{
                      scrollbarWidth: 'thin',
                      scrollbarColor: '#6B7280 transparent'
                    }}
                  >
                    <style>{`
                      div::-webkit-scrollbar {
                        width: 6px;
                      }
                      div::-webkit-scrollbar-track {
                        background: transparent;
                      }
                      div::-webkit-scrollbar-thumb {
                        background-color: #6B7280;
                        border-radius: 3px;
                      }
                      div::-webkit-scrollbar-thumb:hover {
                        background-color: #9CA3AF;
                      }
                    `}</style>
                    {orders
                      .filter((order: any) => order.status === 'pending' || order.status === 'confirmed')
                      .slice(0, 10)
                      .map((order: any) => (
                        <div key={order.id} className="flex items-center justify-between p-3 bg-zinc-800 rounded-lg">
                          <div className="flex-1 space-y-1">
                            <div className="font-medium text-white">
                              {order.customerName}
                            </div>
                            <div className="text-sm text-zinc-400">
                              {order.customerEmail} | {order.customerPhone}
                            </div>
                            
                            {order.customerAddress && (
                              <div className="text-sm text-zinc-400">
                                {currentLanguage === 'vi' ? 'Địa chỉ:' : 'Address:'} {order.customerAddress}
                              </div>
                            )}
                            
                            <div className="text-sm text-zinc-400">
                              {currentLanguage === 'vi' ? 'Loại:' : 'Type:'} {getOrderTypeText(order.orderType)} | {currentLanguage === 'vi' ? 'Tổng:' : 'Total:'} {formatPrice(order.totalAmount)}
                            </div>
                            
                            <div className="text-sm text-zinc-400">
                              {currentLanguage === 'vi' ? 'Đặt lúc:' : 'Ordered at:'} {formatDbTimestamp(order.createdAt)}
                            </div>
                            
                            {order.items && order.items.length > 0 && (
                              <div className="text-sm text-zinc-400">
                                {currentLanguage === 'vi' ? 'Món:' : 'Items:'} {order.items.map((item: any, index: number) => (
                                  <span key={index}>
                                    {item.name} (x{item.quantity}){index < order.items.length - 1 ? ', ' : ''}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <Button 
                              size="sm" 
                              variant="ghost"
                              onClick={() => copyAllInfo('order', order)}
                              className="text-blue-400 hover:text-blue-300"
                              data-testid={`button-copy-recent-order-${order.id}`}
                              title={currentLanguage === 'vi' ? 'Sao chép thông tin' : 'Copy info'}
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                            {getStatusBadge(order.status)}
                          </div>
                        </div>
                      ))}
                    {orders.filter((order: any) => order.status === 'pending' || order.status === 'confirmed').length === 0 && (
                      <p className="text-zinc-400 text-center py-4">
                        {currentLanguage === 'vi' ? 'Không có đơn hàng đang chờ hoặc đã xác nhận' : 'No pending or confirmed orders'}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-zinc-900 border-zinc-800">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-white">
                    <Calendar className="h-5 w-5" />
                    {currentLanguage === 'vi' ? 'Đặt bàn gần đây' : 'Recent Reservations'}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div 
                    className="space-y-4 max-h-96 overflow-y-auto"
                    style={{
                      scrollbarWidth: 'thin',
                      scrollbarColor: '#6B7280 transparent'
                    }}
                  >
                    <style>{`
                      div::-webkit-scrollbar {
                        width: 6px;
                      }
                      div::-webkit-scrollbar-track {
                        background: transparent;
                      }
                      div::-webkit-scrollbar-thumb {
                        background-color: #6B7280;
                        border-radius: 3px;
                      }
                      div::-webkit-scrollbar-thumb:hover {
                        background-color: #9CA3AF;
                      }
                    `}</style>
                    {reservations
                      .filter((reservation: any) => reservation.status === 'pending' || reservation.status === 'confirmed')
                      .slice(0, 10)
                      .map((reservation: any) => (
                        <div key={reservation.id} className="flex items-center justify-between p-3 bg-zinc-800 rounded-lg">
                          <div className="flex-1 space-y-1">
                            <div className="font-medium text-white">
                              {reservation.name}
                            </div>
                            <div className="text-sm text-zinc-400">
                              | {reservation.phone}
                            </div>
                            
                            <div className="text-sm text-zinc-400">
                              {new Date(reservation.date).toLocaleDateString('sv-SE')} {currentLanguage === 'vi' ? 'lúc' : 'at'} {reservation.time} - {reservation.guests} {currentLanguage === 'vi' ? 'người' : 'people'}
                            </div>
                            
                            <div className="text-sm text-zinc-400">
                              {currentLanguage === 'vi' ? 'Đặt lúc:' : 'Booked at:'} {formatDbTimestamp(reservation.createdAt)}
                            </div>
                            
                            {reservation.specialRequests && (
                              <div className="text-sm text-zinc-400">
                                {currentLanguage === 'vi' ? 'Yêu cầu:' : 'Requirements:'} {reservation.specialRequests}
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <Button 
                              size="sm" 
                              variant="ghost"
                              onClick={() => copyAllInfo('reservation', reservation)}
                              className="text-blue-400 hover:text-blue-300"
                              data-testid={`button-copy-recent-reservation-${reservation.id}`}
                              title={currentLanguage === 'vi' ? 'Sao chép thông tin' : 'Copy info'}
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                            {getStatusBadge(reservation.status)}
                          </div>
                        </div>
                      ))}
                    {reservations.filter((reservation: any) => reservation.status === 'pending' || reservation.status === 'confirmed').length === 0 && (
                      <p className="text-zinc-400 text-center py-4">
                        {currentLanguage === 'vi' ? 'Không có đặt bàn đang chờ hoặc đã xác nhận' : 'No pending or confirmed reservations'}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </>
        );

      case 'orders':
        return (
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-white">
                {currentLanguage === 'vi' ? 'Quản Lý Đơn Hàng' : 'Order Management'}
              </CardTitle>
              <CardDescription className="text-zinc-400">
                {currentLanguage === 'vi' ? 'Quản lý tất cả đơn hàng của khách hàng' : 'Manage all customer orders'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Search and Filter Controls */}
              <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-zinc-400 h-4 w-4" />
                  <Input
                    placeholder={currentLanguage === 'vi' ? 'Tìm kiếm đơn hàng...' : 'Search orders...'}
                    value={orderSearch}
                    onChange={(e) => setOrderSearch(e.target.value)}
                    className="pl-10 bg-zinc-800 border-zinc-700 text-white"
                    data-testid="input-search-orders"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-zinc-400" />
                  <Select value={orderTimeFilter} onValueChange={setOrderTimeFilter}>
                    <SelectTrigger className="w-[180px] bg-zinc-800 border-zinc-700 text-white">
                      <SelectValue placeholder={currentLanguage === 'vi' ? 'Lọc thời gian' : 'Time filter'} />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-800 border-zinc-700">
                      <SelectItem value="all">{currentLanguage === 'vi' ? 'Tất cả' : 'All time'}</SelectItem>
                      <SelectItem value="today">{currentLanguage === 'vi' ? 'Hôm nay' : 'Today'}</SelectItem>
                      <SelectItem value="week">{currentLanguage === 'vi' ? '7 ngày qua' : 'Last 7 days'}</SelectItem>
                      <SelectItem value="month">{currentLanguage === 'vi' ? '30 ngày qua' : 'Last 30 days'}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Warning and Count */}
              <div className="flex justify-between items-center mb-4">
                <div className="text-sm text-zinc-400">
                  {filteredOrders.length} / {orders.length} {currentLanguage === 'vi' ? 'đơn hàng' : 'orders'}
                </div>
                <div className="text-sm text-amber-400 bg-amber-900/20 px-3 py-1 rounded border border-amber-500/30 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  {currentLanguage === 'vi' 
                    ? 'Đơn hàng sẽ tự động bị xóa sau 6 tháng' 
                    : 'Orders will be automatically deleted after 6 months'
                  }
                </div>
              </div>

              <div className="space-y-4">
                {filteredOrders.map((order: any) => (
                  <div key={order.id} className="flex items-center justify-between p-4 bg-zinc-800 rounded-lg border border-zinc-700">
                    <div className="flex-1">
                      <div className="font-medium text-white">
                        #{order.id.slice(0, 8).toUpperCase()}
                      </div>
                      <div className="text-sm text-zinc-400">
                        {order.customerName} • {order.customerPhone}
                      </div>
                      {order.customerAddress && (
                        <div className="text-sm text-zinc-400">
                          {currentLanguage === 'vi' ? 'Địa chỉ:' : 'Address:'} {order.customerAddress}
                        </div>
                      )}
                      <div className="text-sm text-zinc-400">
                        {currentLanguage === 'vi' ? 'Loại:' : 'Type:'} {getOrderTypeText(order.orderType)}
                      </div>
                      <div className="text-sm text-zinc-400 flex items-center gap-2 mt-1">
                        <Clock className="h-3 w-3" />
                        {formatDbTimestamp(order.createdAt)}
                      </div>
                      <div className="text-sm font-medium text-white mt-1">
                        {currentLanguage === 'vi' ? 'Tổng:' : 'Total:'} {formatPrice(order.totalAmount)}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <div className="flex items-center gap-2">
                        {getStatusBadge(order.status)}
                      </div>
                      <Select 
                        value={order.status} 
                        onValueChange={(newStatus) => updateOrderStatus.mutate({ id: order.id, status: newStatus })}
                      >
                        <SelectTrigger className="w-36 bg-zinc-800 border-zinc-700 text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-zinc-800 border-zinc-700 text-white">
                          <SelectItem value="pending" className="text-white">{t('admin.pending')}</SelectItem>
                          <SelectItem value="confirmed" className="text-white">{t('admin.confirmed')}</SelectItem>
                          <SelectItem value="completed" className="text-white">{t('admin.completed')}</SelectItem>
                          <SelectItem value="cancelled" className="text-white">{t('admin.cancelled')}</SelectItem>
                        </SelectContent>
                      </Select>
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          variant="ghost"
                          onClick={() => copyAllInfo('order', order)}
                          className="text-blue-400 hover:text-blue-300"
                          data-testid={`button-copy-order-${order.id}`}
                          title={currentLanguage === 'vi' ? 'Sao chép thông tin' : 'Copy info'}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => {
                            setSelectedOrder(order);
                            setIsOrderModalOpen(true);
                          }}
                          data-testid={`button-view-order-${order.id}`}
                          className="border-zinc-700 text-white hover:bg-zinc-800"
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          {currentLanguage === 'vi' ? 'Xem chi tiết' : 'View Details'}
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
                {filteredOrders.length === 0 && orders.length > 0 && (
                  <p className="text-zinc-400 text-center py-8">
                    {currentLanguage === 'vi' ? 'Không tìm thấy đơn hàng phù hợp' : 'No matching orders found'}
                  </p>
                )}
                {orders.length === 0 && (
                  <p className="text-zinc-400 text-center py-8">
                    {currentLanguage === 'vi' ? 'Không có đơn hàng nào' : 'No orders found'}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        );

      case 'reservations':
        return (
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-white">
                {currentLanguage === 'vi' ? 'Quản Lý Đặt Bàn' : 'Reservation Management'}
              </CardTitle>
              <CardDescription className="text-zinc-400">
                {currentLanguage === 'vi' ? 'Quản lý đặt bàn của nhà hàng' : 'Manage restaurant table reservations'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Search and Filter Controls */}
              <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-zinc-400 h-4 w-4" />
                  <Input
                    placeholder={currentLanguage === 'vi' ? 'Tìm kiếm đặt bàn...' : 'Search reservations...'}
                    value={reservationSearch}
                    onChange={(e) => setReservationSearch(e.target.value)}
                    className="pl-10 bg-zinc-800 border-zinc-700 text-white"
                    data-testid="input-search-reservations"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-zinc-400" />
                  <Select value={reservationTimeFilter} onValueChange={setReservationTimeFilter}>
                    <SelectTrigger className="w-[180px] bg-zinc-800 border-zinc-700 text-white">
                      <SelectValue placeholder={currentLanguage === 'vi' ? 'Lọc thời gian' : 'Time filter'} />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-800 border-zinc-700">
                      <SelectItem value="all">{currentLanguage === 'vi' ? 'Tất cả' : 'All time'}</SelectItem>
                      <SelectItem value="today">{currentLanguage === 'vi' ? 'Hôm nay' : 'Today'}</SelectItem>
                      <SelectItem value="week">{currentLanguage === 'vi' ? '7 ngày qua' : 'Last 7 days'}</SelectItem>
                      <SelectItem value="month">{currentLanguage === 'vi' ? '30 ngày qua' : 'Last 30 days'}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Warning and Count */}
              <div className="flex justify-between items-center mb-4">
                <div className="text-sm text-zinc-400">
                  {filteredReservations.length} / {reservations.length} {currentLanguage === 'vi' ? 'đặt bàn' : 'reservations'}
                </div>
                <div className="text-sm text-amber-400 bg-amber-900/20 px-3 py-1 rounded border border-amber-500/30 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  {currentLanguage === 'vi' 
                    ? 'Đặt bàn sẽ tự động bị xóa sau 6 tháng' 
                    : 'Reservations will be automatically deleted after 6 months'
                  }
                </div>
              </div>

              <div className="space-y-4">
                {filteredReservations.map((reservation: any) => (
                  <div key={reservation.id} className="flex items-center justify-between p-4 bg-zinc-800 rounded-lg border border-zinc-700">
                    <div className="flex-1">
                      <div className="font-medium text-white">
                        {reservation.name}
                      </div>
                      <div className="text-sm text-zinc-400">
                        {reservation.phone} • {reservation.email}
                      </div>
                      <div className="text-sm text-zinc-400 flex items-center gap-2 mt-1">
                        <Clock className="h-3 w-3" />
                        {currentLanguage === 'vi' ? 'Đặt lúc:' : 'Created at:'} {formatDbTimestamp(reservation.createdAt)}
                      </div>
                      <div className="text-sm text-white mt-1 flex items-center gap-4">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(reservation.date).toLocaleDateString()}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {reservation.time}
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {reservation.guests} {currentLanguage === 'vi' ? 'khách' : 'guests'}
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <div className="flex items-center gap-2">
                        {getStatusBadge(reservation.status)}
                      </div>
                      <Select 
                        value={reservation.status} 
                        onValueChange={(newStatus) => updateReservationStatus.mutate({ id: reservation.id, status: newStatus })}
                      >
                        <SelectTrigger className="w-36 bg-zinc-800 border-zinc-700 text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-zinc-800 border-zinc-700 text-white">
                          <SelectItem value="pending" className="text-white">{t('admin.pending')}</SelectItem>
                          <SelectItem value="confirmed" className="text-white">{t('admin.confirmed')}</SelectItem>
                          <SelectItem value="completed" className="text-white">{t('admin.completed')}</SelectItem>
                          <SelectItem value="cancelled" className="text-white">{t('admin.cancelled')}</SelectItem>
                        </SelectContent>
                      </Select>
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          variant="ghost"
                          onClick={() => copyAllInfo('reservation', reservation)}
                          className="text-blue-400 hover:text-blue-300"
                          data-testid={`button-copy-reservation-${reservation.id}`}
                          title={currentLanguage === 'vi' ? 'Sao chép thông tin' : 'Copy info'}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => {
                            setSelectedReservation(reservation);
                            setIsReservationModalOpen(true);
                          }}
                          data-testid={`button-view-reservation-${reservation.id}`}
                          className="border-zinc-700 text-white hover:bg-zinc-800"
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          {currentLanguage === 'vi' ? 'Xem chi tiết' : 'View Details'}
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
                {filteredReservations.length === 0 && reservations.length > 0 && (
                  <p className="text-zinc-400 text-center py-8">
                    {currentLanguage === 'vi' ? 'Không tìm thấy đặt bàn phù hợp' : 'No matching reservations found'}
                  </p>
                )}
                {reservations.length === 0 && (
                  <p className="text-zinc-400 text-center py-8">
                    {currentLanguage === 'vi' ? 'Không có đặt bàn nào' : 'No reservations found'}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        );

      case 'menu':
        return <StaffMenuManagement />;

      case 'contact':
        return <ContactManagement showDeleteButton={false} />;

      case 'settings':
        return (
          <Card className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800">
            <CardHeader>
              <CardTitle className="text-zinc-900 dark:text-white">
                {currentLanguage === 'vi' ? 'Cài đặt' : 'Settings'}
              </CardTitle>
              <CardDescription className="text-zinc-600 dark:text-zinc-400">
                {currentLanguage === 'vi' ? 'Cài đặt tài khoản và tùy chọn nhân viên' : 'Staff account settings and preferences'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 bg-zinc-50 dark:bg-zinc-800 rounded-lg">
                  <h3 className="font-medium text-zinc-900 dark:text-white mb-2">
                    {currentLanguage === 'vi' ? 'Thông tin tài khoản' : 'Account Information'}
                  </h3>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">
                    {currentLanguage === 'vi' ? 'Xem và quản lý chi tiết tài khoản nhân viên của bạn' : 'View and manage your staff account details'}
                  </p>
                </div>
                <div className="p-4 bg-zinc-50 dark:bg-zinc-800 rounded-lg">
                  <h3 className="font-medium text-zinc-900 dark:text-white mb-2">
                    {currentLanguage === 'vi' ? 'Thông báo' : 'Notifications'}
                  </h3>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">
                    {currentLanguage === 'vi' ? 'Cấu hình tùy chọn thông báo' : 'Configure notification preferences'}
                  </p>
                </div>
                <div className="p-4 bg-zinc-50 dark:bg-zinc-800 rounded-lg">
                  <h3 className="font-medium text-zinc-900 dark:text-white mb-2">
                    {currentLanguage === 'vi' ? 'Ngôn ngữ' : 'Language'}
                  </h3>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">
                    {currentLanguage === 'vi' ? 'Sử dụng nút chuyển đổi ngôn ngữ ở header để thay đổi ngôn ngữ hiển thị' : 'Use the language switcher in the header to change display language'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="border-b border-zinc-800">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-white">Staff Panel</h1>
            <p className="text-zinc-400">{currentLanguage === 'vi' ? 'Bảng điều khiển quản lý nhân viên' : 'Staff management dashboard'}</p>
          </div>
          <div className="flex items-center gap-4">
            <NotificationPanel />
            {onLogout && (
              <Button 
                variant="outline" 
                className="border-red-700 text-red-400 hover:bg-red-900 hover:text-red-300"
                onClick={onLogout}
                data-testid="button-logout"
              >
                <LogOut className="w-4 h-4 mr-2" />
                {currentLanguage === 'vi' ? 'Đăng xuất' : 'Logout'}
              </Button>
            )}
          </div>
        </div>
      </div>
      
      <div className="container mx-auto px-4 py-8">

        {/* Navigation Menu */}
        <div className="mb-8">
          <div className="flex flex-wrap gap-2">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              return (
                <Button
                  key={item.id}
                  variant={activeSection === item.id ? "default" : "outline"}
                  size="sm"
                  onClick={() => setActiveSection(item.id)}
                  className={`flex items-center gap-2 ${
                    activeSection === item.id 
                      ? 'bg-yellow-500 text-black hover:bg-yellow-600' 
                      : 'border-zinc-700 text-white hover:bg-zinc-800'
                  }`}
                  data-testid={`staff-menu-${item.id}`}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Button>
              );
            })}
          </div>
        </div>

        {/* Content Area */}
        {renderContent()}
      </div>

      {/* Order Detail Modal */}
      <Dialog open={isOrderModalOpen} onOpenChange={setIsOrderModalOpen}>
        <DialogContent className="bg-zinc-900 border-zinc-800 text-white max-w-2xl" aria-describedby="order-dialog-description">
          <DialogHeader>
            <DialogTitle className="text-white">
              {currentLanguage === 'vi' ? 'Chi tiết đơn hàng' : 'Order Details'}
            </DialogTitle>
          </DialogHeader>
          <div id="order-dialog-description" className="sr-only">
            {currentLanguage === 'vi' ? 'Xem chi tiết thông tin đơn hàng và thực hiện cập nhật trạng thái' : 'View detailed order information and update order status'}
          </div>
          {selectedOrder && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium text-zinc-300">
                    {currentLanguage === 'vi' ? 'Thông tin khách hàng' : 'Customer Information'}
                  </h4>
                  <p className="text-white">{selectedOrder.customerName}</p>
                  <p className="text-zinc-400">{selectedOrder.customerPhone}</p>
                  <p className="text-zinc-400">{selectedOrder.customerEmail}</p>
                  {selectedOrder.customerAddress && (
                    <div className="mt-2">
                      <label className="text-sm font-medium text-zinc-300">{currentLanguage === 'vi' ? 'Địa chỉ giao hàng' : 'Delivery address'}</label>
                      <p className="text-white bg-zinc-800 p-3 rounded mt-1">{selectedOrder.customerAddress}</p>
                    </div>
                  )}
                </div>
                <div>
                  <h4 className="font-medium text-zinc-300">
                    {currentLanguage === 'vi' ? 'Trạng thái đơn hàng' : 'Order Status'}
                  </h4>
                  <div className="flex items-center gap-2 mb-2">
                    {getStatusBadge(selectedOrder.status)}
                  </div>
                  <Select 
                    value={selectedOrder.status} 
                    onValueChange={(value) => updateOrderStatus.mutate({ id: selectedOrder.id, status: value })}
                  >
                    <SelectTrigger className="bg-zinc-800 border-zinc-700">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-800 border-zinc-700">
                      <SelectItem value="pending">{currentLanguage === 'vi' ? 'Đang Chờ' : 'Pending'}</SelectItem>
                      <SelectItem value="confirmed">{currentLanguage === 'vi' ? 'Đã Xác Nhận' : 'Confirmed'}</SelectItem>
                      <SelectItem value="completed">{currentLanguage === 'vi' ? 'Đã Hoàn Thành' : 'Completed'}</SelectItem>
                      <SelectItem value="cancelled">{currentLanguage === 'vi' ? 'Đã Hủy' : 'Cancelled'}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div>
                <h4 className="font-medium text-zinc-300 mb-2">
                  {currentLanguage === 'vi' ? 'Món đã đặt' : 'Ordered Items'}
                </h4>
                <div className="space-y-2">
                  {selectedOrder.items && selectedOrder.items.map((item: any, index: number) => (
                    <div key={index} className="flex justify-between p-2 bg-zinc-800 rounded">
                      <span className="text-white">{item.quantity}x {item.name}</span>
                      <span className="text-zinc-300">{formatPrice(item.price * item.quantity)}</span>
                    </div>
                  ))}
                </div>
                <div className="border-t border-zinc-700 mt-4 pt-4">
                  <div className="flex justify-between font-medium text-white">
                    <span>{currentLanguage === 'vi' ? 'Tổng cộng:' : 'Total:'}</span>
                    <span>{formatPrice(selectedOrder.totalAmount)}</span>
                  </div>
                </div>
              </div>

              {selectedOrder.notes && (
                <div>
                  <h4 className="font-medium text-zinc-300">
                    {currentLanguage === 'vi' ? 'Ghi chú' : 'Notes'}
                  </h4>
                  <p className="text-zinc-400">{selectedOrder.notes}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Reservation Detail Modal */}
      <Dialog open={isReservationModalOpen} onOpenChange={setIsReservationModalOpen}>
        <DialogContent className="bg-zinc-900 border-zinc-800 text-white max-w-2xl" aria-describedby="reservation-dialog-description">
          <DialogHeader>
            <DialogTitle className="text-white">
              {currentLanguage === 'vi' ? 'Chi tiết đặt bàn' : 'Reservation Details'}
            </DialogTitle>
          </DialogHeader>
          <div id="reservation-dialog-description" className="sr-only">
            {currentLanguage === 'vi' ? 'Xem chi tiết thông tin đặt bàn và thực hiện cập nhật trạng thái' : 'View detailed reservation information and update reservation status'}
          </div>
          {selectedReservation && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium text-zinc-300">
                    {currentLanguage === 'vi' ? 'Thông tin khách hàng' : 'Customer Information'}
                  </h4>
                  <p className="text-white">{selectedReservation.name}</p>
                  <p className="text-zinc-400">{selectedReservation.phone}</p>
                  <p className="text-zinc-400">{selectedReservation.email}</p>
                </div>
                <div>
                  <h4 className="font-medium text-zinc-300">
                    {currentLanguage === 'vi' ? 'Trạng thái đặt bàn' : 'Reservation Status'}
                  </h4>
                  <div className="flex items-center gap-2 mb-2">
                    {getStatusBadge(selectedReservation.status)}
                  </div>
                  <Select 
                    value={selectedReservation.status} 
                    onValueChange={(value) => updateReservationStatus.mutate({ id: selectedReservation.id, status: value })}
                  >
                    <SelectTrigger className="bg-zinc-800 border-zinc-700">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-800 border-zinc-700">
                      <SelectItem value="pending">{currentLanguage === 'vi' ? 'Chờ xác nhận' : 'Pending'}</SelectItem>
                      <SelectItem value="confirmed">{currentLanguage === 'vi' ? 'Đã xác nhận' : 'Confirmed'}</SelectItem>
                      <SelectItem value="completed">{currentLanguage === 'vi' ? 'Hoàn thành' : 'Completed'}</SelectItem>
                      <SelectItem value="cancelled">{currentLanguage === 'vi' ? 'Đã hủy' : 'Cancelled'}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium text-zinc-300">
                    {currentLanguage === 'vi' ? 'Thông tin đặt bàn' : 'Reservation Details'}
                  </h4>
                  <p className="text-white flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    {new Date(selectedReservation.date).toLocaleDateString()}
                  </p>
                  <p className="text-zinc-400 flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    {selectedReservation.time}
                  </p>
                  <p className="text-zinc-400 flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    {selectedReservation.guests} {currentLanguage === 'vi' ? 'khách' : 'guests'}
                  </p>
                </div>
                <div>
                  {selectedReservation.specialRequests && (
                    <>
                      <h4 className="font-medium text-zinc-300">
                        {currentLanguage === 'vi' ? 'Yêu cầu đặc biệt' : 'Special Requests'}
                      </h4>
                      <p className="text-zinc-400">{selectedReservation.specialRequests}</p>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}