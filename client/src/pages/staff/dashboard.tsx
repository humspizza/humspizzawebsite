import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'wouter';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Calendar, Clock, Users, Package, Menu as MenuIcon, BookOpen, Home, Eye, Edit, LogOut, Phone, Search, Filter, AlertTriangle, Copy } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useState, useEffect, useMemo } from 'react';
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
  const [isEditOrderModalOpen, setIsEditOrderModalOpen] = useState(false);
  const [isEditReservationModalOpen, setIsEditReservationModalOpen] = useState(false);
  const [editOrderData, setEditOrderData] = useState({
    customerName: '', customerEmail: '', customerPhone: '', customerAddress: '',
    status: '', orderType: '',
    items: [] as Array<{id: string, name: string, price: number, quantity: number}>
  });
  const [editReservationData, setEditReservationData] = useState({
    name: '', email: '', phone: '', guests: '', date: '', time: '', status: '', specialRequests: ''
  });
  const [showAddItemSection, setShowAddItemSection] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

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
  
  // Add reservation modal state
  const [isAddReservationModalOpen, setIsAddReservationModalOpen] = useState(false);
  const [addReservationData, setAddReservationData] = useState({
    name: '', email: '', phone: '', guests: '2', date: '', time: '', status: 'confirmed', specialRequests: ''
  });

  // Search and filter states
  const [reservationSearch, setReservationSearch] = useState("");
  const [orderSearch, setOrderSearch] = useState("");
  const [reservationDateFrom, setReservationDateFrom] = useState("");
  const [reservationDateTo, setReservationDateTo] = useState("");
  const [orderDateFrom, setOrderDateFrom] = useState("");
  const [orderDateTo, setOrderDateTo] = useState("");

  // Get all orders
  const { data: ordersData = [], isLoading: ordersLoading } = useQuery({
    queryKey: ['/api/orders'],
  });

  // Get all reservations
  const { data: reservationsData = [], isLoading: reservationsLoading } = useQuery({
    queryKey: ['/api/reservations'],
  });

  const { data: systemSettings } = useQuery<Record<string, any>>({
    queryKey: ["/api/system-settings"],
  });

  const { data: tableNumbers = {} } = useQuery<Record<string, string>>({
    queryKey: ["/api/reservation-table-numbers"],
    queryFn: () => fetch("/api/reservation-table-numbers", { credentials: "include" }).then(r => r.json()),
  });

  const { data: menuItemsData = [] } = useQuery({ queryKey: ['/api/menu-items'] });
  const menuItems = Array.isArray(menuItemsData) ? menuItemsData : [];
  const filteredMenuItems = menuItems.filter((item: any) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (item.name?.toLowerCase() || '').includes(q) || (item.nameVi?.toLowerCase() || item.name_vi?.toLowerCase() || '').includes(q);
  });

  const lockedTimeSlots: Record<string, boolean> = systemSettings?.locked_time_slots || {};
  const allTimeSlots = useMemo(() => {
    const slots: string[] = [];
    let h = 11, m = 30;
    while (h < 21 || (h === 21 && m === 0)) {
      slots.push(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`);
      m += 15;
      if (m >= 60) { m = 0; h += 1; }
    }
    return slots;
  }, []);
  const addTodayStr = new Date().toISOString().split('T')[0];
  const addNowMinutes = new Date().getHours() * 60 + new Date().getMinutes();
  const availableAddTimeSlots = allTimeSlots.filter(slot => {
    if (lockedTimeSlots[slot]) return false;
    if (addReservationData.date === addTodayStr) {
      const [h, m] = slot.split(':').map(Number);
      return h * 60 + m > addNowMinutes;
    }
    return true;
  });

  // Ensure data is in array format
  const orders = Array.isArray(ordersData) ? ordersData : [];
  const reservations = Array.isArray(reservationsData) ? reservationsData : [];

  const phoneCountMap = useMemo(() => {
    const map = new Map<string, number>();
    reservations.forEach((r: any) => { if (r.phone) map.set(r.phone, (map.get(r.phone) ?? 0) + 1); });
    return map;
  }, [reservations]);

  const orderPhoneCountMap = useMemo(() => {
    const map = new Map<string, number>();
    orders.forEach((o: any) => { if (o.customerPhone) map.set(o.customerPhone, (map.get(o.customerPhone) ?? 0) + 1); });
    return map;
  }, [orders]);

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
      label: currentLanguage === 'vi' ? 'Liên Hệ' : 'Contact', 
      icon: Phone 
    },
  ];

  // Date utilities
  const fmtDate = (d: Date) => {
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  };

  const applyDateShortcut = (
    shortcut: 'today' | 'week' | 'month',
    setFrom: (v: string) => void,
    setTo: (v: string) => void,
    currentFrom: string,
    currentTo: string
  ) => {
    const now = new Date();
    let from = '', to = '';
    if (shortcut === 'today') {
      from = to = fmtDate(now);
    } else if (shortcut === 'week') {
      const day = now.getDay();
      const monday = new Date(now);
      monday.setDate(now.getDate() - (day === 0 ? 6 : day - 1));
      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);
      from = fmtDate(monday); to = fmtDate(sunday);
    } else if (shortcut === 'month') {
      from = fmtDate(new Date(now.getFullYear(), now.getMonth(), 1));
      to = fmtDate(new Date(now.getFullYear(), now.getMonth() + 1, 0));
    }
    if (currentFrom === from && currentTo === to) { setFrom(''); setTo(''); }
    else { setFrom(from); setTo(to); }
  };

  const getActiveShortcut = (from: string, to: string): string => {
    const now = new Date();
    const todayStr = fmtDate(now);
    if (from === todayStr && to === todayStr) return 'today';
    const day = now.getDay();
    const monday = new Date(now);
    monday.setDate(now.getDate() - (day === 0 ? 6 : day - 1));
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    if (from === fmtDate(monday) && to === fmtDate(sunday)) return 'week';
    const monthFrom = fmtDate(new Date(now.getFullYear(), now.getMonth(), 1));
    const monthTo = fmtDate(new Date(now.getFullYear(), now.getMonth() + 1, 0));
    if (from === monthFrom && to === monthTo) return 'month';
    return '';
  };

  // Apply filters
  const filteredReservations = reservations.filter((r: any) => {
    if (reservationDateFrom || reservationDateTo) {
      const rDate = r.date;
      if (reservationDateFrom && rDate < reservationDateFrom) return false;
      if (reservationDateTo && rDate > reservationDateTo) return false;
    }
    const q = reservationSearch.toLowerCase();
    return !q || (r.name?.toLowerCase() || '').includes(q) || r.phone?.includes(q) || (r.email?.toLowerCase() || '').includes(q);
  });

  const filteredOrders = orders.filter((o: any) => {
    if (orderDateFrom || orderDateTo) {
      const oDate = o.createdAt ? o.createdAt.slice(0, 10) : '';
      if (orderDateFrom && oDate < orderDateFrom) return false;
      if (orderDateTo && oDate > orderDateTo) return false;
    }
    const q = orderSearch.toLowerCase();
    return !q || (o.customerName?.toLowerCase() || '').includes(q) || (o.customerEmail?.toLowerCase() || '').includes(q) || (o.customerPhone?.toLowerCase() || '').includes(q);
  });



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
      pending: 'Đặt Bàn',
      confirmed: 'Nhận Bàn',
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

    const colors: Record<string, string> = {
      pending: 'bg-yellow-500',
      confirmed: 'bg-green-500',
      completed: 'bg-blue-500',
      cancelled: 'bg-red-500',
      preparing: 'bg-orange-500',
      ready: 'bg-purple-500'
    };

    const color = colors[status] || 'bg-zinc-500';

    return (
      <Badge className={`${color} text-white hover:opacity-90`}>
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

  const setTableNumberMutation = useMutation({
    mutationFn: async ({ id, tableNumber }: { id: string; tableNumber: string }) => {
      const response = await apiRequest("PATCH", `/api/reservations/${id}/table-number`, { tableNumber });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/reservation-table-numbers"] });
    },
  });

  const createReservationMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/reservations", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/reservations'] });
      setIsAddReservationModalOpen(false);
      setAddReservationData({ name: '', email: '', phone: '', guests: '2', date: '', time: '', status: 'confirmed', specialRequests: '' });
      toast({ title: currentLanguage === 'vi' ? 'Đặt bàn đã được thêm' : 'Reservation added' });
    },
    onError: () => {
      toast({ title: currentLanguage === 'vi' ? 'Lỗi khi thêm đặt bàn' : 'Error adding reservation', variant: 'destructive' });
    }
  });

  const updateFullOrderMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const response = await apiRequest("PATCH", `/api/orders/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      setIsEditOrderModalOpen(false);
      toast({ title: currentLanguage === 'vi' ? 'Đã cập nhật đơn hàng' : 'Order updated' });
    },
    onError: () => {
      toast({ title: currentLanguage === 'vi' ? 'Lỗi cập nhật đơn hàng' : 'Error updating order', variant: 'destructive' });
    }
  });

  const updateFullReservationMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const response = await apiRequest("PATCH", `/api/reservations/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/reservations"] });
      setIsEditReservationModalOpen(false);
      toast({ title: currentLanguage === 'vi' ? 'Đã cập nhật đặt bàn' : 'Reservation updated' });
    },
    onError: () => {
      toast({ title: currentLanguage === 'vi' ? 'Lỗi cập nhật đặt bàn' : 'Error updating reservation', variant: 'destructive' });
    }
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

            {/* Today's Overview: Upcoming Reservations + Today's Orders */}
            {(() => {
              const now = new Date();
              const todayStr = now.toISOString().slice(0, 10);
              const nowTime = now.toTimeString().slice(0, 5);

              const upcomingToday = reservations
                .filter((r: any) => r.date === todayStr && r.status !== 'cancelled' && r.time >= nowTime)
                .sort((a: any, b: any) => a.time.localeCompare(b.time));

              const ordersToday = orders
                .filter((o: any) => {
                  const d = o.createdAt ? new Date(o.createdAt).toISOString().slice(0, 10) : '';
                  return d === todayStr && o.status !== 'cancelled' && o.status !== 'completed';
                })
                .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

              const reservationCard = (
                <Card className="bg-zinc-900 border-zinc-800">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-white">
                      <Clock className="h-5 w-5 text-zinc-400" />
                      {currentLanguage === 'vi'
                        ? `Đặt Bàn Sắp Tới Trong Ngày${upcomingToday.length > 0 ? ` (${upcomingToday.length})` : ''}`
                        : `Upcoming Reservations Today${upcomingToday.length > 0 ? ` (${upcomingToday.length})` : ''}`}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {upcomingToday.length === 0 ? (
                      <p className="text-zinc-400 text-center py-4">
                        {currentLanguage === 'vi' ? 'Không có đặt bàn sắp tới hôm nay' : 'No upcoming reservations today'}
                      </p>
                    ) : (
                      <div className="space-y-3 max-h-[480px] overflow-y-auto pr-1">
                        {upcomingToday.map((reservation: any) => (
                          <div key={`upcoming-${reservation.id}`} className="p-4 border rounded-lg border-zinc-800">
                            <div className="flex flex-col gap-3">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-2 mb-0.5">
                                  <h3 className="font-semibold text-white leading-snug">{reservation.name}</h3>
                                  <div className="flex items-center gap-1 flex-wrap justify-end shrink-0">
                                    {(phoneCountMap.get(reservation.phone) ?? 0) > 1
                                      ? <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-zinc-700 border border-zinc-600 text-zinc-400 font-medium whitespace-nowrap">{currentLanguage === 'vi' ? 'Khách Cũ' : 'Returning'}</span>
                                      : <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-zinc-700 border border-zinc-600 text-zinc-400 font-medium whitespace-nowrap">{currentLanguage === 'vi' ? 'Khách Mới' : 'New'}</span>
                                    }
                                    {getStatusBadge(reservation.status)}
                                  </div>
                                </div>
                                <p className="text-sm text-zinc-300 break-all">{reservation.phone} / {reservation.email}</p>
                                <p className="text-sm text-zinc-300">{reservation.date} {currentLanguage === 'vi' ? 'lúc' : 'at'} {reservation.time} — {reservation.guests} {currentLanguage === 'vi' ? 'khách' : 'guests'}</p>
                                {reservation.specialRequests && (
                                  <p className="text-sm text-zinc-400">{currentLanguage === 'vi' ? 'Yêu cầu:' : 'Requests:'} {reservation.specialRequests}</p>
                                )}
                              </div>
                              <div className="flex items-center justify-between pt-2 border-t border-zinc-800">
                                <input
                                  key={tableNumbers[reservation.id] || ''}
                                  defaultValue={tableNumbers[reservation.id] || ''}
                                  placeholder="Bàn..."
                                  className="h-8 w-16 px-2 rounded bg-zinc-800 border border-zinc-700 text-white text-xs focus:outline-none focus:border-yellow-400 placeholder-zinc-500 text-center font-medium"
                                  onBlur={(e) => {
                                    const val = e.target.value.trim();
                                    if (val !== (tableNumbers[reservation.id] || '')) {
                                      setTableNumberMutation.mutate({ id: reservation.id, tableNumber: val });
                                    }
                                  }}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
                                  }}
                                />
                                <div className="flex items-center gap-0.5">
                                  <Button size="sm" variant="ghost" asChild className="text-zinc-400 hover:text-white h-8 w-8 p-0" title={currentLanguage === 'vi' ? 'Gọi điện' : 'Call'}>
                                    <a href={`tel:${reservation.phone}`}><Phone className="w-4 h-4" /></a>
                                  </Button>
                                  <Button size="sm" variant="ghost" onClick={() => copyAllInfo('reservation', reservation)} className="text-zinc-400 hover:text-white h-8 w-8 p-0" title={currentLanguage === 'vi' ? 'Sao chép' : 'Copy'}>
                                    <Copy className="w-4 h-4" />
                                  </Button>
                                  <Button size="sm" variant="ghost" onClick={() => { setSelectedReservation(reservation); setIsReservationModalOpen(true); }} className="text-zinc-400 hover:text-white h-8 w-8 p-0" title={currentLanguage === 'vi' ? 'Xem chi tiết' : 'View details'}>
                                    <Eye className="w-4 h-4" />
                                  </Button>
                                  <Button size="sm" variant="ghost" onClick={() => { setSelectedReservation(reservation); setEditReservationData({ name: reservation.name, email: reservation.email, phone: reservation.phone, guests: reservation.guests.toString(), date: reservation.date, time: reservation.time, status: reservation.status, specialRequests: reservation.specialRequests || '' }); setIsEditReservationModalOpen(true); }} className="text-yellow-400 hover:text-yellow-300 h-8 w-8 p-0" title={currentLanguage === 'vi' ? 'Chỉnh sửa' : 'Edit'}>
                                    <Edit className="w-4 h-4" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );

              const orderCard = (
                <Card className="bg-zinc-900 border-zinc-800">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-white">
                      <Package className="h-5 w-5 text-zinc-400" />
                      {currentLanguage === 'vi'
                        ? `Đơn Đặt Trong Ngày${ordersToday.length > 0 ? ` (${ordersToday.length})` : ''}`
                        : `Today's Orders${ordersToday.length > 0 ? ` (${ordersToday.length})` : ''}`}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {ordersToday.length === 0 ? (
                      <p className="text-zinc-400 text-center py-4">
                        {currentLanguage === 'vi' ? 'Không có đơn đặt hôm nay' : 'No orders today'}
                      </p>
                    ) : (
                      <div className="space-y-3 max-h-[480px] overflow-y-auto pr-1">
                        {ordersToday.map((order: any) => (
                          <div key={`today-order-${order.id}`} className="p-4 border rounded-lg border-zinc-800">
                            <div className="flex flex-col gap-3">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-2 mb-0.5">
                                  <h3 className="font-semibold text-white leading-snug">{order.customerName}</h3>
                                  <div className="flex items-center gap-1 flex-wrap justify-end shrink-0">
                                    {(orderPhoneCountMap.get(order.customerPhone) ?? 0) > 1
                                      ? <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-zinc-700 border border-zinc-600 text-zinc-400 font-medium whitespace-nowrap">{currentLanguage === 'vi' ? 'Khách Cũ' : 'Returning'}</span>
                                      : <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-zinc-700 border border-zinc-600 text-zinc-400 font-medium whitespace-nowrap">{currentLanguage === 'vi' ? 'Khách Mới' : 'New'}</span>
                                    }
                                    {getStatusBadge(order.status)}
                                  </div>
                                </div>
                                <p className="text-sm text-zinc-300 break-all">{order.customerPhone} / {order.customerEmail}</p>
                                {order.customerAddress && <p className="text-sm text-zinc-400">{currentLanguage === 'vi' ? 'Địa chỉ:' : 'Address:'} {order.customerAddress}</p>}
                                <p className="text-sm text-zinc-300">{currentLanguage === 'vi' ? 'Loại:' : 'Type:'} {getOrderTypeText(order.orderType)} | {currentLanguage === 'vi' ? 'Tổng:' : 'Total:'} {formatPrice(order.totalAmount)}</p>
                                {order.items && order.items.length > 0 && (
                                  <p className="text-sm text-zinc-400">{currentLanguage === 'vi' ? 'Món:' : 'Items:'} {order.items.map((item: any) => `${item.name} (x${item.quantity})`).join(', ')}</p>
                                )}
                                <p className="text-sm text-zinc-400 flex items-center gap-1.5 mt-0.5">
                                  <Clock className="h-3 w-3 shrink-0" />
                                  {formatDbTimestamp(order.createdAt)}
                                </p>
                              </div>
                              <div className="flex items-center justify-end gap-0.5 pt-2 border-t border-zinc-800">
                                {order.customerPhone && (
                                  <Button size="sm" variant="ghost" asChild className="text-zinc-400 hover:text-white h-8 w-8 p-0" title={currentLanguage === 'vi' ? 'Gọi điện' : 'Call'}>
                                    <a href={`tel:${order.customerPhone}`}><Phone className="w-4 h-4" /></a>
                                  </Button>
                                )}
                                <Button size="sm" variant="ghost" onClick={() => copyAllInfo('order', order)} className="text-zinc-400 hover:text-white h-8 w-8 p-0" title={currentLanguage === 'vi' ? 'Sao chép' : 'Copy'}>
                                  <Copy className="w-4 h-4" />
                                </Button>
                                <Button size="sm" variant="ghost" onClick={() => { setSelectedOrder(order); setIsOrderModalOpen(true); }} className="text-zinc-400 hover:text-white h-8 w-8 p-0" title={currentLanguage === 'vi' ? 'Xem chi tiết' : 'View details'}>
                                  <Eye className="w-4 h-4" />
                                </Button>
                                <Button size="sm" variant="ghost" onClick={() => { setSelectedOrder(order); setEditOrderData({ customerName: order.customerName, customerEmail: order.customerEmail, customerPhone: order.customerPhone || '', customerAddress: order.customerAddress || '', status: order.status, orderType: order.orderType, items: [...order.items] }); setIsEditOrderModalOpen(true); }} className="text-yellow-400 hover:text-yellow-300 h-8 w-8 p-0" title={currentLanguage === 'vi' ? 'Chỉnh sửa' : 'Edit'}>
                                  <Edit className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );

              return (
                <div className="grid gap-6 md:grid-cols-2 mb-6">
                  {reservationCard}
                  {orderCard}
                </div>
              );
            })()}

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
                        <div key={order.id} className="p-4 border rounded-lg border-zinc-800">
                          <div className="flex flex-col gap-3">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2 mb-0.5">
                                <h3 className="font-semibold text-white leading-snug">{order.customerName}</h3>
                                <div className="shrink-0">{getStatusBadge(order.status)}</div>
                              </div>
                              <p className="text-sm text-zinc-300 break-all">{order.customerPhone} / {order.customerEmail}</p>
                              {order.customerAddress && (
                                <p className="text-sm text-zinc-400">{currentLanguage === 'vi' ? 'Địa chỉ:' : 'Address:'} {order.customerAddress}</p>
                              )}
                              <p className="text-sm text-zinc-300">{currentLanguage === 'vi' ? 'Loại:' : 'Type:'} {getOrderTypeText(order.orderType)} | {currentLanguage === 'vi' ? 'Tổng:' : 'Total:'} {formatPrice(order.totalAmount)}</p>
                              {order.items && order.items.length > 0 && (
                                <p className="text-sm text-zinc-400">{currentLanguage === 'vi' ? 'Món:' : 'Items:'} {order.items.map((item: any) => `${item.name} (x${item.quantity})`).join(', ')}</p>
                              )}
                              <p className="text-sm text-zinc-400">{currentLanguage === 'vi' ? 'Đặt lúc:' : 'Ordered at:'} {formatDbTimestamp(order.createdAt)}</p>
                            </div>
                            <div className="flex items-center justify-end gap-0.5 pt-2 border-t border-zinc-800">
                              {order.customerPhone && (
                                <Button size="sm" variant="ghost" asChild className="text-zinc-400 hover:text-white h-8 w-8 p-0" title={currentLanguage === 'vi' ? 'Gọi điện' : 'Call'}>
                                  <a href={`tel:${order.customerPhone}`}><Phone className="w-4 h-4" /></a>
                                </Button>
                              )}
                              <Button size="sm" variant="ghost" onClick={() => copyAllInfo('order', order)} className="text-zinc-400 hover:text-white h-8 w-8 p-0" data-testid={`button-copy-recent-order-${order.id}`} title={currentLanguage === 'vi' ? 'Sao chép thông tin' : 'Copy info'}>
                                <Copy className="w-4 h-4" />
                              </Button>
                            </div>
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
                        <div key={reservation.id} className="p-4 border rounded-lg border-zinc-800">
                          <div className="flex flex-col gap-3">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2 mb-0.5">
                                <h3 className="font-semibold text-white leading-snug">{reservation.name}</h3>
                                <div className="shrink-0">{getStatusBadge(reservation.status)}</div>
                              </div>
                              <p className="text-sm text-zinc-300 break-all">{reservation.phone}</p>
                              <p className="text-sm text-zinc-300">{new Date(reservation.date).toLocaleDateString('sv-SE')} {currentLanguage === 'vi' ? 'lúc' : 'at'} {reservation.time} — {reservation.guests} {currentLanguage === 'vi' ? 'người' : 'people'}</p>
                              {reservation.specialRequests && (
                                <p className="text-sm text-zinc-400">{currentLanguage === 'vi' ? 'Yêu cầu:' : 'Requests:'} {reservation.specialRequests}</p>
                              )}
                              <p className="text-sm text-zinc-400">{currentLanguage === 'vi' ? 'Đặt lúc:' : 'Booked at:'} {formatDbTimestamp(reservation.createdAt)}</p>
                            </div>
                            <div className="flex items-center justify-end gap-0.5 pt-2 border-t border-zinc-800">
                              <Button size="sm" variant="ghost" asChild className="text-zinc-400 hover:text-white h-8 w-8 p-0" title={currentLanguage === 'vi' ? 'Gọi điện' : 'Call'}>
                                <a href={`tel:${reservation.phone}`}><Phone className="w-4 h-4" /></a>
                              </Button>
                              <Button 
                                size="sm" 
                                variant="ghost"
                                onClick={() => copyAllInfo('reservation', reservation)}
                                className="text-zinc-400 hover:text-white h-8 w-8 p-0"
                                data-testid={`button-copy-recent-reservation-${reservation.id}`}
                                title={currentLanguage === 'vi' ? 'Sao chép thông tin' : 'Copy info'}
                              >
                                <Copy className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    {reservations.filter((reservation: any) => reservation.status === 'pending' || reservation.status === 'confirmed').length === 0 && (
                      <p className="text-zinc-400 text-center py-4">
                        {currentLanguage === 'vi' ? 'Không có đặt bàn mới hoặc đã nhận bàn' : 'No pending or confirmed reservations'}
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
              <div className="flex flex-col gap-2 mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-zinc-400 h-4 w-4" />
                  <Input
                    placeholder={currentLanguage === 'vi' ? 'Tìm kiếm đơn hàng...' : 'Search orders...'}
                    value={orderSearch}
                    onChange={(e) => setOrderSearch(e.target.value)}
                    className="pl-10 bg-zinc-800 border-zinc-700 text-white placeholder-zinc-400 h-9"
                    data-testid="input-search-orders"
                  />
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <Filter className="w-4 h-4 text-zinc-500 shrink-0" />
                  {(['today', 'week', 'month'] as const).map(s => {
                    const active = getActiveShortcut(orderDateFrom, orderDateTo) === s;
                    const label = s === 'today' ? (currentLanguage === 'vi' ? 'Hôm nay' : 'Today') : s === 'week' ? (currentLanguage === 'vi' ? 'Tuần này' : 'This week') : (currentLanguage === 'vi' ? 'Tháng này' : 'This month');
                    return (
                      <button key={s} onClick={() => applyDateShortcut(s, setOrderDateFrom, setOrderDateTo, orderDateFrom, orderDateTo)}
                        className={`text-xs px-2.5 py-1.5 rounded border transition-colors ${active ? 'bg-yellow-600/20 border-yellow-600 text-yellow-400' : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:border-zinc-500 hover:text-zinc-200'}`}>
                        {label}
                      </button>
                    );
                  })}
                  <span className="text-zinc-600 text-xs">|</span>
                  <input type="date" value={orderDateFrom} onChange={e => setOrderDateFrom(e.target.value)}
                    className="h-8 px-2 rounded bg-zinc-800 border border-zinc-700 text-white text-xs focus:outline-none focus:border-zinc-500 w-[120px]" />
                  <span className="text-zinc-500 text-sm">—</span>
                  <input type="date" value={orderDateTo} onChange={e => setOrderDateTo(e.target.value)}
                    className="h-8 px-2 rounded bg-zinc-800 border border-zinc-700 text-white text-xs focus:outline-none focus:border-zinc-500 w-[120px]" />
                  {(orderDateFrom || orderDateTo) && (
                    <button onClick={() => { setOrderDateFrom(""); setOrderDateTo(""); }} className="text-zinc-400 hover:text-white text-xs px-2 py-1 rounded bg-zinc-700 hover:bg-zinc-600">✕</button>
                  )}
                </div>
              </div>

              {/* Count */}
              <div className="mb-4">
                <div className="text-sm text-zinc-400">
                  {filteredOrders.length} / {orders.length} {currentLanguage === 'vi' ? 'đơn hàng' : 'orders'}
                </div>
              </div>

              <div className="space-y-3">
                {filteredOrders.map((order: any) => (
                  <div key={order.id} className="p-4 border rounded-lg border-zinc-800" data-testid={`order-${order.id}`}>
                    <div className="flex flex-col gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-0.5">
                          <h3 className="font-semibold text-white leading-snug">{order.customerName}</h3>
                          <div className="flex items-center gap-1 flex-wrap justify-end shrink-0">
                            {(orderPhoneCountMap.get(order.customerPhone) ?? 0) > 1
                              ? <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-zinc-700 border border-zinc-600 text-zinc-400 font-medium whitespace-nowrap">{currentLanguage === 'vi' ? 'Khách Cũ' : 'Returning'}</span>
                              : <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-zinc-700 border border-zinc-600 text-zinc-400 font-medium whitespace-nowrap">{currentLanguage === 'vi' ? 'Khách Mới' : 'New'}</span>
                            }
                            {getStatusBadge(order.status)}
                          </div>
                        </div>
                        <p className="text-sm text-zinc-300 break-all">{order.customerPhone} / {order.customerEmail}</p>
                        {order.customerAddress && <p className="text-sm text-zinc-400">{currentLanguage === 'vi' ? 'Địa chỉ:' : 'Address:'} {order.customerAddress}</p>}
                        <p className="text-sm text-zinc-300">{currentLanguage === 'vi' ? 'Loại:' : 'Type:'} {getOrderTypeText(order.orderType)} | {currentLanguage === 'vi' ? 'Tổng:' : 'Total:'} {formatPrice(order.totalAmount)}</p>
                        <p className="text-sm text-zinc-400 flex items-center gap-1.5 mt-0.5">
                          <Clock className="h-3 w-3 shrink-0" />
                          {currentLanguage === 'vi' ? 'Đặt lúc:' : 'Created:'} {formatDbTimestamp(order.createdAt)}
                        </p>
                        {order.items && order.items.length > 0 && (
                          <p className="text-sm text-zinc-400 mt-0.5">{currentLanguage === 'vi' ? 'Món:' : 'Items:'} {order.items.map((item: any) => `${item.name} (x${item.quantity})`).join(', ')}</p>
                        )}
                      </div>
                      <div className="flex items-center justify-between gap-2 pt-2 border-t border-zinc-800">
                        <Select
                          value={order.status}
                          onValueChange={(newStatus) => updateOrderStatus.mutate({ id: order.id, status: newStatus })}
                        >
                          <SelectTrigger className="w-32 h-8 bg-zinc-800 border-zinc-700 text-white text-sm">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-zinc-800 border-zinc-700 text-white">
                            <SelectItem value="pending" className="text-white">{currentLanguage === 'vi' ? 'Đặt Bàn' : 'Pending'}</SelectItem>
                            <SelectItem value="confirmed" className="text-white">{currentLanguage === 'vi' ? 'Nhận Bàn' : 'Confirmed'}</SelectItem>
                            <SelectItem value="completed" className="text-white">{currentLanguage === 'vi' ? 'Hoàn thành' : 'Completed'}</SelectItem>
                            <SelectItem value="cancelled" className="text-white">{currentLanguage === 'vi' ? 'Đã hủy' : 'Cancelled'}</SelectItem>
                          </SelectContent>
                        </Select>
                        <div className="flex items-center gap-0.5">
                          {order.customerPhone && (
                            <Button size="sm" variant="ghost" asChild className="text-zinc-400 hover:text-white h-8 w-8 p-0" title={currentLanguage === 'vi' ? 'Gọi điện' : 'Call'}>
                              <a href={`tel:${order.customerPhone}`}><Phone className="w-4 h-4" /></a>
                            </Button>
                          )}
                          <Button size="sm" variant="ghost" onClick={() => copyAllInfo('order', order)} className="text-zinc-400 hover:text-white h-8 w-8 p-0" data-testid={`button-copy-order-${order.id}`} title={currentLanguage === 'vi' ? 'Sao chép' : 'Copy'}>
                            <Copy className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => { setSelectedOrder(order); setIsOrderModalOpen(true); }} className="text-zinc-400 hover:text-white h-8 w-8 p-0" data-testid={`button-view-order-${order.id}`} title={currentLanguage === 'vi' ? 'Xem chi tiết' : 'View details'}>
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => { setSelectedOrder(order); setEditOrderData({ customerName: order.customerName, customerEmail: order.customerEmail, customerPhone: order.customerPhone || '', customerAddress: order.customerAddress || '', status: order.status, orderType: order.orderType, items: [...order.items] }); setIsEditOrderModalOpen(true); }} className="text-yellow-400 hover:text-yellow-300 h-8 w-8 p-0" data-testid={`button-edit-order-${order.id}`} title={currentLanguage === 'vi' ? 'Chỉnh sửa' : 'Edit'}>
                            <Edit className="w-4 h-4" />
                          </Button>
                        </div>
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
              <div className="flex items-center justify-between">
                <CardTitle className="text-white">
                  {currentLanguage === 'vi' ? 'Quản Lý Đặt Bàn' : 'Reservation Management'}
                </CardTitle>
                <Button
                  size="sm"
                  onClick={() => setIsAddReservationModalOpen(true)}
                  className="bg-zinc-700 text-white hover:bg-zinc-600"
                >
                  + {currentLanguage === 'vi' ? 'Thêm đặt bàn' : 'Add reservation'}
                </Button>
              </div>
              <CardDescription className="text-zinc-400">
                {currentLanguage === 'vi' ? 'Quản lý đặt bàn của nhà hàng' : 'Manage restaurant table reservations'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Search and Filter Controls */}
              <div className="flex flex-col gap-2 mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-zinc-400 h-4 w-4" />
                  <Input
                    placeholder={currentLanguage === 'vi' ? 'Tìm kiếm đặt bàn...' : 'Search reservations...'}
                    value={reservationSearch}
                    onChange={(e) => setReservationSearch(e.target.value)}
                    className="pl-10 bg-zinc-800 border-zinc-700 text-white placeholder-zinc-400 h-9"
                    data-testid="input-search-reservations"
                  />
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <Filter className="w-4 h-4 text-zinc-500 shrink-0" />
                  {(['today', 'week', 'month'] as const).map(s => {
                    const active = getActiveShortcut(reservationDateFrom, reservationDateTo) === s;
                    const label = s === 'today' ? (currentLanguage === 'vi' ? 'Hôm nay' : 'Today') : s === 'week' ? (currentLanguage === 'vi' ? 'Tuần này' : 'This week') : (currentLanguage === 'vi' ? 'Tháng này' : 'This month');
                    return (
                      <button key={s} onClick={() => applyDateShortcut(s, setReservationDateFrom, setReservationDateTo, reservationDateFrom, reservationDateTo)}
                        className={`text-xs px-2.5 py-1.5 rounded border transition-colors ${active ? 'bg-yellow-600/20 border-yellow-600 text-yellow-400' : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:border-zinc-500 hover:text-zinc-200'}`}>
                        {label}
                      </button>
                    );
                  })}
                  <span className="text-zinc-600 text-xs">|</span>
                  <input type="date" value={reservationDateFrom} onChange={e => setReservationDateFrom(e.target.value)}
                    className="h-8 px-2 rounded bg-zinc-800 border border-zinc-700 text-white text-xs focus:outline-none focus:border-zinc-500 w-[120px]" />
                  <span className="text-zinc-500 text-sm">—</span>
                  <input type="date" value={reservationDateTo} onChange={e => setReservationDateTo(e.target.value)}
                    className="h-8 px-2 rounded bg-zinc-800 border border-zinc-700 text-white text-xs focus:outline-none focus:border-zinc-500 w-[120px]" />
                  {(reservationDateFrom || reservationDateTo) && (
                    <button onClick={() => { setReservationDateFrom(""); setReservationDateTo(""); }} className="text-zinc-400 hover:text-white text-xs px-2 py-1 rounded bg-zinc-700 hover:bg-zinc-600">✕</button>
                  )}
                </div>
              </div>

              {/* Count */}
              <div className="mb-4">
                <div className="text-sm text-zinc-400">
                  {filteredReservations.length} / {reservations.length} {currentLanguage === 'vi' ? 'đặt bàn' : 'reservations'}
                </div>
              </div>

              {(() => {
                const now = new Date();
                const todayStr = now.toISOString().slice(0, 10);
                const nowTime = now.toTimeString().slice(0, 5);
                const plusTwo = new Date(now.getTime() + 2 * 60 * 60 * 1000);
                const plusTwoTime = plusTwo.toTimeString().slice(0, 5);

                const upcomingItems = filteredReservations
                  .filter((r: any) => r.date === todayStr && r.status !== 'cancelled' && r.time >= nowTime && r.time <= plusTwoTime)
                  .sort((a: any, b: any) => a.time.localeCompare(b.time));

                const groups = [
                  { status: 'pending', label: currentLanguage === 'vi' ? 'Đặt Bàn' : 'Pending', color: '#facc15', items: filteredReservations.filter((r: any) => r.status === 'pending').sort((a: any, b: any) => (a.date + a.time).localeCompare(b.date + b.time)) },
                  { status: 'confirmed', label: currentLanguage === 'vi' ? 'Nhận Bàn' : 'Confirmed', color: '#34d399', items: filteredReservations.filter((r: any) => r.status === 'confirmed').sort((a: any, b: any) => (a.date + a.time).localeCompare(b.date + b.time)) },
                  { status: 'cancelled', label: currentLanguage === 'vi' ? 'Đã Hủy' : 'Cancelled', color: '#f87171', items: filteredReservations.filter((r: any) => r.status === 'cancelled').sort((a: any, b: any) => (a.date + a.time).localeCompare(b.date + b.time)) },
                ];

                const renderCard = (reservation: any, keyPrefix = '') => (
                  <div key={`${keyPrefix}${reservation.id}`} className="p-4 border rounded-lg border-zinc-800">
                    <div className="flex flex-col gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-0.5">
                          <h3 className="font-semibold text-white leading-snug">{reservation.name}</h3>
                          <div className="flex items-center gap-1 flex-wrap justify-end shrink-0">
                            {(phoneCountMap.get(reservation.phone) ?? 0) > 1
                              ? <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-zinc-700 border border-zinc-600 text-zinc-400 font-medium whitespace-nowrap">{currentLanguage === 'vi' ? 'Khách Cũ' : 'Returning'}</span>
                              : <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-zinc-700 border border-zinc-600 text-zinc-400 font-medium whitespace-nowrap">{currentLanguage === 'vi' ? 'Khách Mới' : 'New'}</span>
                            }
                            {getStatusBadge(reservation.status)}
                          </div>
                        </div>
                        <p className="text-sm text-zinc-300 break-all">{reservation.phone} / {reservation.email}</p>
                        <p className="text-sm text-zinc-300">{reservation.date} {currentLanguage === 'vi' ? 'lúc' : 'at'} {reservation.time} - {reservation.guests} {currentLanguage === 'vi' ? 'khách' : 'guests'}</p>
                        {reservation.specialRequests && (
                          <p className="text-sm text-zinc-400">{currentLanguage === 'vi' ? 'Yêu cầu' : 'Requests'}: {reservation.specialRequests}</p>
                        )}
                        <p className="text-sm text-zinc-400 flex items-center gap-1.5 mt-0.5">
                          <Clock className="h-3 w-3 shrink-0" />
                          {currentLanguage === 'vi' ? 'Đặt lúc:' : 'Created:'} {formatDbTimestamp(reservation.createdAt)}
                        </p>
                      </div>
                      <div className="flex items-center justify-between gap-2 pt-2 border-t border-zinc-800">
                        <div className="flex items-center gap-2">
                          <Select value={reservation.status} onValueChange={(newStatus) => updateReservationStatus.mutate({ id: reservation.id, status: newStatus })}>
                            <SelectTrigger className="w-32 h-8 bg-zinc-800 border-zinc-700 text-white text-sm"><SelectValue /></SelectTrigger>
                            <SelectContent className="bg-zinc-800 border-zinc-700 text-white">
                              <SelectItem value="pending" className="text-white">{currentLanguage === 'vi' ? 'Đặt Bàn' : 'Pending'}</SelectItem>
                              <SelectItem value="confirmed" className="text-white">{currentLanguage === 'vi' ? 'Nhận Bàn' : 'Confirmed'}</SelectItem>
                              <SelectItem value="cancelled" className="text-white">{currentLanguage === 'vi' ? 'Đã hủy' : 'Cancelled'}</SelectItem>
                            </SelectContent>
                          </Select>
                          <input
                            key={tableNumbers[reservation.id] || ''}
                            defaultValue={tableNumbers[reservation.id] || ''}
                            placeholder="Bàn..."
                            className="h-8 w-16 px-2 rounded bg-zinc-800 border border-zinc-700 text-white text-xs focus:outline-none focus:border-yellow-400 placeholder-zinc-500 text-center font-medium"
                            onBlur={(e) => {
                              const val = e.target.value.trim();
                              if (val !== (tableNumbers[reservation.id] || '')) {
                                setTableNumberMutation.mutate({ id: reservation.id, tableNumber: val });
                              }
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
                            }}
                          />
                        </div>
                        <div className="flex items-center gap-0.5">
                          <Button size="sm" variant="ghost" asChild className="text-zinc-400 hover:text-white h-8 w-8 p-0" title={currentLanguage === 'vi' ? 'Gọi điện' : 'Call'}>
                            <a href={`tel:${reservation.phone}`}><Phone className="w-4 h-4" /></a>
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => copyAllInfo('reservation', reservation)} className="text-zinc-400 hover:text-white h-8 w-8 p-0" data-testid={`button-copy-reservation-${reservation.id}`} title={currentLanguage === 'vi' ? 'Sao chép' : 'Copy'}>
                            <Copy className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => { setSelectedReservation(reservation); setIsReservationModalOpen(true); }} className="text-zinc-400 hover:text-white h-8 w-8 p-0" data-testid={`button-view-reservation-${reservation.id}`} title={currentLanguage === 'vi' ? 'Xem chi tiết' : 'View details'}>
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => { setSelectedReservation(reservation); setEditReservationData({ name: reservation.name, email: reservation.email, phone: reservation.phone, guests: reservation.guests.toString(), date: reservation.date, time: reservation.time, status: reservation.status, specialRequests: reservation.specialRequests || '' }); setIsEditReservationModalOpen(true); }} className="text-yellow-400 hover:text-yellow-300 h-8 w-8 p-0" data-testid={`button-edit-reservation-${reservation.id}`} title={currentLanguage === 'vi' ? 'Chỉnh sửa' : 'Edit'}>
                            <Edit className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                );

                return (
                  <div>
                    {upcomingItems.length > 0 && (
                      <div className="mb-6">
                        <div className="flex items-center gap-3 mt-2 mb-3">
                          <span className="text-sm font-semibold whitespace-nowrap text-white">
                            {currentLanguage === 'vi' ? `Sắp Đến (${upcomingItems.length})` : `Upcoming (${upcomingItems.length})`}
                          </span>
                          <div className="flex-1 h-px bg-zinc-700" />
                        </div>
                        <div className="space-y-3">{upcomingItems.map((r: any) => renderCard(r, 'upcoming-'))}</div>
                      </div>
                    )}
                    {groups.map((group, idx) => group.items.length > 0 && (
                      <div key={group.status}>
                        <div className={`flex items-center gap-3 ${idx > 0 || upcomingItems.length > 0 ? 'mt-6' : 'mt-2'} mb-3`}>
                          <span className="text-sm font-semibold whitespace-nowrap text-white">
                            {group.label} ({group.items.length})
                          </span>
                          <div className="flex-1 h-px bg-zinc-700" />
                        </div>
                        <div className="space-y-3">{group.items.map((r: any) => renderCard(r))}</div>
                      </div>
                    ))}
                    {filteredReservations.length === 0 && reservations.length > 0 && (
                      <p className="text-zinc-400 text-center py-8">{currentLanguage === 'vi' ? 'Không tìm thấy đặt bàn phù hợp' : 'No matching reservations found'}</p>
                    )}
                    {reservations.length === 0 && (
                      <p className="text-zinc-400 text-center py-8">{currentLanguage === 'vi' ? 'Không có đặt bàn nào' : 'No reservations found'}</p>
                    )}
                  </div>
                );
              })()}
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
                  <div className="flex items-center gap-2 mt-1">
                    {getStatusBadge(selectedOrder.status)}
                  </div>
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
                  <div className="flex items-center gap-2 mt-1">
                    {getStatusBadge(selectedReservation.status)}
                  </div>
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

      {/* Add Reservation Modal */}
      <Dialog open={isAddReservationModalOpen} onOpenChange={setIsAddReservationModalOpen}>
        <DialogContent className="bg-zinc-900 border-zinc-800 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">{currentLanguage === 'vi' ? 'Thêm đặt bàn' : 'Add Reservation'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-5 pt-2">
            {/* Row 1: Date / Time / Guests */}
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">{currentLanguage === 'vi' ? 'Ngày' : 'Date'}</label>
                <Input
                  type="date"
                  value={addReservationData.date}
                  onChange={(e) => setAddReservationData({...addReservationData, date: e.target.value, time: ''})}
                  className="bg-zinc-800 border-zinc-700 focus:border-yellow-400 text-white"
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">{currentLanguage === 'vi' ? 'Giờ' : 'Time'}</label>
                {availableAddTimeSlots.length === 0 ? (
                  <div className="h-10 px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-md text-zinc-400 text-sm flex items-center">
                    {currentLanguage === 'vi' ? 'Không còn khung giờ trống' : 'No available time slots'}
                  </div>
                ) : (
                  <Select
                    value={addReservationData.time}
                    onValueChange={(v) => setAddReservationData({...addReservationData, time: v})}
                  >
                    <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white">
                      <SelectValue placeholder={currentLanguage === 'vi' ? 'Chọn giờ' : 'Select time'} />
                    </SelectTrigger>
                    <SelectContent className="max-h-[200px] overflow-y-auto">
                      {availableAddTimeSlots.map((slot) => (
                        <SelectItem key={slot} value={slot}>{slot}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">{currentLanguage === 'vi' ? 'Số khách' : 'Guests'}</label>
                <Select
                  value={addReservationData.guests}
                  onValueChange={(v) => setAddReservationData({...addReservationData, guests: v})}
                >
                  <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white">
                    <SelectValue placeholder={currentLanguage === 'vi' ? 'Chọn số khách' : 'Select guests'} />
                  </SelectTrigger>
                  <SelectContent className="max-h-[200px] overflow-y-auto">
                    {Array.from({ length: 50 }, (_, i) => i + 1).map((num) => (
                      <SelectItem key={num} value={num.toString()}>
                        {num} {currentLanguage === 'vi' ? 'khách' : (num > 1 ? 'guests' : 'guest')}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Row 2: Name / Email */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">{currentLanguage === 'vi' ? 'Họ tên' : 'Full Name'}</label>
                <Input
                  value={addReservationData.name}
                  onChange={(e) => setAddReservationData({...addReservationData, name: e.target.value})}
                  className="bg-zinc-800 border-zinc-700 focus:border-yellow-400 text-white"
                  placeholder={currentLanguage === 'vi' ? 'Nhập họ tên' : 'Enter full name'}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">{currentLanguage === 'vi' ? 'Email (Tùy chọn)' : 'Email (Optional)'}</label>
                <Input
                  type="email"
                  value={addReservationData.email}
                  onChange={(e) => setAddReservationData({...addReservationData, email: e.target.value})}
                  className="bg-zinc-800 border-zinc-700 focus:border-yellow-400 text-white"
                  placeholder="email@example.com"
                />
              </div>
            </div>

            {/* Row 3: Phone */}
            <div>
              <label className="block text-sm font-medium mb-2">{currentLanguage === 'vi' ? 'Số điện thoại' : 'Phone'}</label>
              <Input
                type="tel"
                value={addReservationData.phone}
                onChange={(e) => setAddReservationData({...addReservationData, phone: e.target.value})}
                className="bg-zinc-800 border-zinc-700 focus:border-yellow-400 text-white"
                placeholder={currentLanguage === 'vi' ? 'Nhập số điện thoại' : 'Enter phone number'}
              />
            </div>

            {/* Row 4: Notes */}
            <div>
              <label className="block text-sm font-medium mb-2">{currentLanguage === 'vi' ? 'Ghi chú (Tùy chọn)' : 'Notes (Optional)'}</label>
              <Textarea
                value={addReservationData.specialRequests}
                onChange={(e) => setAddReservationData({...addReservationData, specialRequests: e.target.value})}
                className="bg-zinc-800 border-zinc-700 focus:border-yellow-400 text-white resize-none"
                rows={3}
                placeholder={currentLanguage === 'vi' ? 'Trang trí dịp đặc biệt, sở thích chỗ ngồi...' : 'Special occasion, seating preferences...'}
              />
            </div>

            {/* Submit */}
            <Button
              onClick={() => {
                if (!addReservationData.name || !addReservationData.phone || !addReservationData.date || !addReservationData.time) {
                  toast({ title: currentLanguage === 'vi' ? 'Vui lòng điền đầy đủ thông tin bắt buộc' : 'Please fill in all required fields', variant: 'destructive' });
                  return;
                }
                createReservationMutation.mutate({
                  name: addReservationData.name,
                  email: addReservationData.email || null,
                  phone: addReservationData.phone,
                  guests: parseInt(addReservationData.guests) || 2,
                  date: addReservationData.date,
                  time: addReservationData.time,
                  status: addReservationData.status,
                  specialRequests: addReservationData.specialRequests || null
                });
              }}
              disabled={createReservationMutation.isPending}
              className="w-full bg-yellow-400 hover:bg-yellow-500 text-zinc-900 font-bold py-4 text-base"
            >
              {createReservationMutation.isPending
                ? (currentLanguage === 'vi' ? 'Đang xử lý...' : 'Processing...')
                : (currentLanguage === 'vi' ? 'Xác nhận đặt bàn' : 'Confirm Reservation')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Order Modal */}
      <Dialog open={isEditOrderModalOpen} onOpenChange={setIsEditOrderModalOpen}>
        <DialogContent className="bg-zinc-900 border-zinc-800 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{currentLanguage === 'vi' ? 'Chỉnh sửa đơn hàng' : 'Edit Order'}</DialogTitle>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-zinc-300">{currentLanguage === 'vi' ? 'Tên khách hàng' : 'Customer Name'}</label>
                  <Input value={editOrderData.customerName} onChange={(e) => setEditOrderData({...editOrderData, customerName: e.target.value})} className="mt-1 bg-zinc-800 border-zinc-700 text-white" />
                </div>
                <div>
                  <label className="text-sm font-medium text-zinc-300">Email</label>
                  <Input value={editOrderData.customerEmail} onChange={(e) => setEditOrderData({...editOrderData, customerEmail: e.target.value})} className="mt-1 bg-zinc-800 border-zinc-700 text-white" />
                </div>
                <div>
                  <label className="text-sm font-medium text-zinc-300">{currentLanguage === 'vi' ? 'Số điện thoại' : 'Phone'}</label>
                  <Input value={editOrderData.customerPhone || ''} onChange={(e) => setEditOrderData({...editOrderData, customerPhone: e.target.value})} className="mt-1 bg-zinc-800 border-zinc-700 text-white" />
                </div>
                <div>
                  <label className="text-sm font-medium text-zinc-300">{currentLanguage === 'vi' ? 'Địa chỉ' : 'Address'}</label>
                  <Input value={editOrderData.customerAddress || ''} onChange={(e) => setEditOrderData({...editOrderData, customerAddress: e.target.value})} className="mt-1 bg-zinc-800 border-zinc-700 text-white" placeholder={currentLanguage === 'vi' ? 'Nhập địa chỉ giao hàng' : 'Enter delivery address'} />
                </div>
                <div>
                  <label className="text-sm font-medium text-zinc-300">{currentLanguage === 'vi' ? 'Loại đơn' : 'Order Type'}</label>
                  <Select value={editOrderData.orderType} onValueChange={(value) => setEditOrderData({...editOrderData, orderType: value})}>
                    <SelectTrigger className="mt-1 bg-zinc-800 border-zinc-700 text-white"><SelectValue /></SelectTrigger>
                    <SelectContent className="bg-zinc-800 border-zinc-700">
                      <SelectItem value="dine-in" className="text-white">{currentLanguage === 'vi' ? 'Tại chỗ' : 'Dine In'}</SelectItem>
                      <SelectItem value="takeout" className="text-white">{currentLanguage === 'vi' ? 'Mang về' : 'Takeout'}</SelectItem>
                      <SelectItem value="delivery" className="text-white">{currentLanguage === 'vi' ? 'Giao hàng' : 'Delivery'}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium text-zinc-300">{currentLanguage === 'vi' ? 'Tổng tiền' : 'Total'}</label>
                  <Input value={editOrderData.items.reduce((t, i) => t + i.price * i.quantity, 0).toLocaleString() + ' VND'} className="mt-1 bg-zinc-800 border-zinc-700 text-white" readOnly />
                </div>
                <div className="col-span-2">
                  <label className="text-sm font-medium text-zinc-300">{currentLanguage === 'vi' ? 'Trạng thái' : 'Status'}</label>
                  <Select value={editOrderData.status} onValueChange={(v) => setEditOrderData({...editOrderData, status: v})}>
                    <SelectTrigger className="mt-1 bg-zinc-800 border-zinc-700 text-white"><SelectValue /></SelectTrigger>
                    <SelectContent className="bg-zinc-800 border-zinc-700">
                      <SelectItem value="pending" className="text-white">{currentLanguage === 'vi' ? 'Chờ xử lý' : 'Pending'}</SelectItem>
                      <SelectItem value="confirmed" className="text-white">{currentLanguage === 'vi' ? 'Đã xác nhận' : 'Confirmed'}</SelectItem>
                      <SelectItem value="preparing" className="text-white">{currentLanguage === 'vi' ? 'Đang chuẩn bị' : 'Preparing'}</SelectItem>
                      <SelectItem value="ready" className="text-white">{currentLanguage === 'vi' ? 'Sẵn sàng' : 'Ready'}</SelectItem>
                      <SelectItem value="completed" className="text-white">{currentLanguage === 'vi' ? 'Hoàn thành' : 'Completed'}</SelectItem>
                      <SelectItem value="cancelled" className="text-white">{currentLanguage === 'vi' ? 'Đã hủy' : 'Cancelled'}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-zinc-300">{currentLanguage === 'vi' ? 'Món đã đặt' : 'Ordered Items'}</label>
                <div className="mt-2 space-y-2 max-h-48 overflow-y-auto">
                  {editOrderData.items.map((item, index) => (
                    <div key={index} className="bg-zinc-800 p-3 rounded border border-zinc-700">
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-white flex-1">{item.name}</span>
                        <div className="flex items-center gap-2">
                          <Button size="sm" variant="outline" onClick={() => { const ni = [...editOrderData.items]; if (ni[index].quantity > 1) { ni[index].quantity -= 1; setEditOrderData({...editOrderData, items: ni}); } }} className="h-6 w-6 p-0 border-zinc-600 text-white hover:bg-zinc-700">-</Button>
                          <span className="text-white w-8 text-center">{item.quantity}</span>
                          <Button size="sm" variant="outline" onClick={() => { const ni = [...editOrderData.items]; ni[index].quantity += 1; setEditOrderData({...editOrderData, items: ni}); }} className="h-6 w-6 p-0 border-zinc-600 text-white hover:bg-zinc-700">+</Button>
                          <Button size="sm" variant="outline" onClick={() => { setEditOrderData({...editOrderData, items: editOrderData.items.filter((_, i) => i !== index)}); }} className="h-6 w-6 p-0 border-red-600 text-red-400 hover:bg-red-900">×</Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {!showAddItemSection && (
                  <Button variant="outline" onClick={() => setShowAddItemSection(true)} className="mt-2 border-zinc-600 text-white hover:bg-zinc-700">
                    + {currentLanguage === 'vi' ? 'Thêm món' : 'Add Item'}
                  </Button>
                )}

                {showAddItemSection && (
                  <div className="mt-4 p-3 bg-zinc-800 border border-zinc-700 rounded">
                    <div className="flex justify-between items-center mb-3">
                      <h4 className="text-sm font-medium text-zinc-300">{currentLanguage === 'vi' ? 'Chọn món' : 'Select Item'}</h4>
                      <Button size="sm" variant="outline" onClick={() => { setShowAddItemSection(false); setSearchQuery(''); }} className="border-zinc-600 text-white hover:bg-zinc-700">×</Button>
                    </div>
                    <div className="mb-3">
                      <Input placeholder={currentLanguage === 'vi' ? 'Tìm kiếm món...' : 'Search food...'} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="bg-zinc-700 border-zinc-600 text-white placeholder-zinc-400" />
                    </div>
                    <div className="grid grid-cols-1 gap-2 max-h-32 overflow-y-auto">
                      {filteredMenuItems.map((item: any) => (
                        <div key={item.id} className="flex justify-between items-center p-2 bg-zinc-700 rounded">
                          <div className="flex flex-col">
                            <span className="text-white text-sm">{item.name}</span>
                            {(item.nameVi || item.name_vi) && <span className="text-zinc-400 text-xs">{item.nameVi || item.name_vi}</span>}
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-zinc-300 text-sm">{Math.round(parseFloat(item.price))?.toLocaleString()} VND</span>
                            <Button size="sm" onClick={() => {
                              const idx = editOrderData.items.findIndex(o => o.id === item.id);
                              if (idx >= 0) {
                                const ni = [...editOrderData.items]; ni[idx].quantity += 1; setEditOrderData({...editOrderData, items: ni});
                              } else {
                                setEditOrderData({...editOrderData, items: [...editOrderData.items, { id: item.id, name: item.name, price: item.price, quantity: 1 }]});
                              }
                              setShowAddItemSection(false); setSearchQuery('');
                            }} className="bg-yellow-600 hover:bg-yellow-700 text-white h-6 px-2 text-xs">
                              {currentLanguage === 'vi' ? 'Thêm' : 'Add'}
                            </Button>
                          </div>
                        </div>
                      ))}
                      {filteredMenuItems.length === 0 && searchQuery && (
                        <div className="text-center text-zinc-400 text-sm py-4">{currentLanguage === 'vi' ? 'Không tìm thấy món' : 'No items found'} "{searchQuery}"</div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-zinc-700">
                <Button variant="outline" onClick={() => setIsEditOrderModalOpen(false)} className="border-zinc-600 text-white hover:bg-zinc-800">
                  {currentLanguage === 'vi' ? 'Hủy' : 'Cancel'}
                </Button>
                <Button onClick={() => {
                  const total = editOrderData.items.reduce((t, i) => t + i.price * i.quantity, 0);
                  updateFullOrderMutation.mutate({ id: selectedOrder.id, data: { customerName: editOrderData.customerName, customerEmail: editOrderData.customerEmail, customerPhone: editOrderData.customerPhone, customerAddress: editOrderData.customerAddress, orderType: editOrderData.orderType, status: editOrderData.status, items: editOrderData.items, totalAmount: total.toString() } });
                }} className="bg-yellow-600 hover:bg-yellow-700 text-white" disabled={updateFullOrderMutation.isPending}>
                  {updateFullOrderMutation.isPending ? (currentLanguage === 'vi' ? 'Đang lưu...' : 'Saving...') : (currentLanguage === 'vi' ? 'Lưu thay đổi' : 'Save Changes')}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Reservation Modal */}
      <Dialog open={isEditReservationModalOpen} onOpenChange={setIsEditReservationModalOpen}>
        <DialogContent className="bg-zinc-900 border-zinc-800 text-white max-w-2xl">
          <DialogHeader>
            <DialogTitle>{currentLanguage === 'vi' ? 'Chỉnh sửa đặt bàn' : 'Edit Reservation'}</DialogTitle>
          </DialogHeader>
          {selectedReservation && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-zinc-300">{currentLanguage === 'vi' ? 'Tên khách' : 'Customer Name'}</label>
                  <Input value={editReservationData.name} onChange={(e) => setEditReservationData({...editReservationData, name: e.target.value})} className="mt-1 bg-zinc-800 border-zinc-700 text-white" />
                </div>
                <div>
                  <label className="text-sm font-medium text-zinc-300">Email</label>
                  <Input value={editReservationData.email} onChange={(e) => setEditReservationData({...editReservationData, email: e.target.value})} className="mt-1 bg-zinc-800 border-zinc-700 text-white" />
                </div>
                <div>
                  <label className="text-sm font-medium text-zinc-300">{currentLanguage === 'vi' ? 'Số điện thoại' : 'Phone'}</label>
                  <Input value={editReservationData.phone} onChange={(e) => setEditReservationData({...editReservationData, phone: e.target.value})} className="mt-1 bg-zinc-800 border-zinc-700 text-white" />
                </div>
                <div>
                  <label className="text-sm font-medium text-zinc-300">{currentLanguage === 'vi' ? 'Số người' : 'Guests'}</label>
                  <Input type="number" value={editReservationData.guests} onChange={(e) => setEditReservationData({...editReservationData, guests: e.target.value})} className="mt-1 bg-zinc-800 border-zinc-700 text-white" />
                </div>
                <div>
                  <label className="text-sm font-medium text-zinc-300">{currentLanguage === 'vi' ? 'Ngày' : 'Date'}</label>
                  <Input type="date" value={editReservationData.date} onChange={(e) => setEditReservationData({...editReservationData, date: e.target.value})} className="mt-1 bg-zinc-800 border-zinc-700 text-white" />
                </div>
                <div>
                  <label className="text-sm font-medium text-zinc-300">{currentLanguage === 'vi' ? 'Giờ' : 'Time'}</label>
                  <Input type="time" value={editReservationData.time} onChange={(e) => setEditReservationData({...editReservationData, time: e.target.value})} className="mt-1 bg-zinc-800 border-zinc-700 text-white" />
                </div>
                <div className="col-span-2">
                  <label className="text-sm font-medium text-zinc-300">{currentLanguage === 'vi' ? 'Trạng thái' : 'Status'}</label>
                  <Select value={editReservationData.status} onValueChange={(v) => setEditReservationData({...editReservationData, status: v})}>
                    <SelectTrigger className="mt-1 bg-zinc-800 border-zinc-700 text-white"><SelectValue /></SelectTrigger>
                    <SelectContent className="bg-zinc-800 border-zinc-700">
                      <SelectItem value="pending" className="text-white">{currentLanguage === 'vi' ? 'Đặt Bàn' : 'Pending'}</SelectItem>
                      <SelectItem value="confirmed" className="text-white">{currentLanguage === 'vi' ? 'Nhận Bàn' : 'Confirmed'}</SelectItem>
                      <SelectItem value="cancelled" className="text-white">{currentLanguage === 'vi' ? 'Đã Hủy' : 'Cancelled'}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-zinc-300">{currentLanguage === 'vi' ? 'Ghi chú' : 'Special Requests'}</label>
                <textarea value={editReservationData.specialRequests} onChange={(e) => setEditReservationData({...editReservationData, specialRequests: e.target.value})} className="mt-1 w-full p-3 bg-zinc-800 border border-zinc-700 rounded text-white text-sm" rows={3} placeholder={currentLanguage === 'vi' ? 'Yêu cầu đặc biệt...' : 'Special requests...'} />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-zinc-700">
                <Button variant="outline" onClick={() => setIsEditReservationModalOpen(false)} className="border-zinc-600 text-white hover:bg-zinc-800">
                  {currentLanguage === 'vi' ? 'Hủy' : 'Cancel'}
                </Button>
                <Button onClick={() => {
                  updateFullReservationMutation.mutate({ id: selectedReservation.id, data: { name: editReservationData.name, email: editReservationData.email, phone: editReservationData.phone, guests: parseInt(editReservationData.guests), date: editReservationData.date, time: editReservationData.time, status: editReservationData.status, specialRequests: editReservationData.specialRequests } });
                }} className="bg-yellow-600 hover:bg-yellow-700 text-white" disabled={updateFullReservationMutation.isPending}>
                  {updateFullReservationMutation.isPending ? (currentLanguage === 'vi' ? 'Đang lưu...' : 'Saving...') : (currentLanguage === 'vi' ? 'Lưu thay đổi' : 'Save Changes')}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}