import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import MenuManagement from "./menu-management";
import BlogManagement from "./blog-management";
import ReviewManagement from "./review-management";
import ContactManagement from "./contact-management";
import PagesManagement from "./pages-management";
import NotificationPanel from "@/components/NotificationPanel";

import AccountSettings from "./account-settings";
import FeatureLocksSettings from "./feature-locks-settings";
import { 
  Users, 
  ShoppingBag, 
  Calendar, 
  TrendingUp, 
  Clock,
  CheckCircle,
  XCircle,
  Eye,
  Edit,
  Trash2,
  LogOut,
  Search,
  Filter,
  Settings,
  Database,
  BarChart,
  AlertTriangle,
  Copy
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useLanguage } from "@/contexts/LanguageContext";
import { useSessionTimeout } from "@/hooks/useSessionTimeout";
import { formatPrice } from "@/lib/currency";

interface User {
  id: string;
  username: string;
  role: string;
}

interface Reservation {
  id: string;
  name: string;
  email: string;
  phone: string;
  date: string;
  time: string;
  guests: number;
  status: string;
  specialRequests?: string;
  createdAt: string;
}

interface Order {
  id: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerAddress?: string;
  totalAmount: string;
  status: string;
  orderType: string;
  createdAt: string;
  items: Array<{id: string, name: string, price: number, quantity: number}>;
}

export default function AdminDashboard() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { t, language: currentLanguage } = useLanguage();
  const [user, setUser] = useState<User | null>(null);
  
  // Setup session timeout (2 hours with 10 minute warning)
  const { logout: sessionLogout, checkSession } = useSessionTimeout({
    timeoutDuration: 120 * 60 * 1000, // 2 hours
    warningDuration: 10 * 60 * 1000,  // 10 minute warning
    onTimeout: () => {
      localStorage.removeItem("user");
      setLocation("/login");
    },
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
  
  // Global dashboard filters
  const [dashboardSearch, setDashboardSearch] = useState("");
  const [dashboardDateFilter, setDashboardDateFilter] = useState("all");
  const [dashboardCategoryFilter, setDashboardCategoryFilter] = useState("all");

  // Edit modal states
  const [isEditOrderModalOpen, setIsEditOrderModalOpen] = useState(false);
  const [isEditReservationModalOpen, setIsEditReservationModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);
  
  // View detail states
  const [viewDetailModal, setViewDetailModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  
  // Delete confirmation states
  const [deleteReservationId, setDeleteReservationId] = useState<string | null>(null);
  const [deleteOrderId, setDeleteOrderId] = useState<string | null>(null);
  
  // Form states for editing
  const [editOrderData, setEditOrderData] = useState({
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    customerAddress: '',
    status: '',
    orderType: '',
    items: [] as Array<{id: string, name: string, price: number, quantity: number}>
  });

  const [showAddItemSection, setShowAddItemSection] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [editReservationData, setEditReservationData] = useState({
    name: '',
    email: '',
    phone: '',
    guests: '',
    date: '',
    time: '',
    status: '',
    specialRequests: ''
  });

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (userData) {
      setUser(JSON.parse(userData));
    } else {
      setLocation("/admin/login");
    }
  }, [setLocation]);

  const { data: reservations = [] } = useQuery<Reservation[]>({
    queryKey: ["/api/reservations"],
  });

  const { data: orders = [] } = useQuery<Order[]>({
    queryKey: ["/api/orders"],
  });

  const { data: contactMessages = [] } = useQuery({
    queryKey: ["/api/contact"],
  });

  const { data: allMenuItems = [] } = useQuery({
    queryKey: ["/api/menu-items"],
    enabled: showAddItemSection
  });

  // Filter menu items based on search query
  const menuItemsArray = Array.isArray(allMenuItems) ? allMenuItems.map((item: any) => item.menu_items || item) : [];
  const filteredMenuItems = Array.isArray(menuItemsArray) ? menuItemsArray.filter((item: any) => {
    if (!item?.name) return false;
    const query = searchQuery.toLowerCase();
    return item.name.toLowerCase().includes(query) || 
           (item.nameVi && item.nameVi.toLowerCase().includes(query)) ||
           (item.name_vi && item.name_vi.toLowerCase().includes(query));
  }) : [];

  // Filter functions
  const getTimeFilteredData = (data: any[], timeFilter: string, dateField: string = 'createdAt') => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    switch (timeFilter) {
      case 'today':
        return data.filter(item => {
          const itemDate = new Date(item[dateField]);
          const itemDay = new Date(itemDate.getFullYear(), itemDate.getMonth(), itemDate.getDate());
          return itemDay.getTime() === today.getTime();
        });
      case '7days':
        const week = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        return data.filter(item => new Date(item[dateField]) >= week);
      case '30days':
        const month = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        return data.filter(item => new Date(item[dateField]) >= month);
      case '90days':
        const quarter = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        return data.filter(item => new Date(item[dateField]) >= quarter);
      case '180days':
        const half = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);
        return data.filter(item => new Date(item[dateField]) >= half);
      case 'year':
        const yearStart = new Date(now.getFullYear(), 0, 1);
        return data.filter(item => new Date(item[dateField]) >= yearStart);
      default:
        return data;
    }
  };

  // Copy to clipboard function
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

  // Copy all info function
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

  // Filtered data
  const filteredReservations = getTimeFilteredData(reservations, reservationTimeFilter)
    .filter(r => 
      (r.name?.toLowerCase() || '').includes(reservationSearch.toLowerCase()) ||
      r.phone?.includes(reservationSearch) ||
      (r.email?.toLowerCase() || '').includes(reservationSearch.toLowerCase())
    );

  const filteredOrders = getTimeFilteredData(orders, orderTimeFilter)
    .filter(o => 
      (o.customerName?.toLowerCase() || '').includes(orderSearch.toLowerCase()) ||
      (o.customerEmail?.toLowerCase() || '').includes(orderSearch.toLowerCase()) ||
      (o.id?.toLowerCase() || '').includes(orderSearch.toLowerCase())
    );

  const updateReservationMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const response = await apiRequest("PATCH", `/api/reservations/${id}/status`, { status });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/reservations"] });
      toast({
        title: "Cập nhật thành công",
        description: "Trạng thái đặt bàn đã được cập nhật",
      });
    },
  });

  const updateOrderMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const response = await apiRequest("PATCH", `/api/orders/${id}/status`, { status });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      toast({
        title: "Cập nhật thành công", 
        description: "Trạng thái đơn hàng đã được cập nhật",
      });
    },
  });

  // Mutation to update full order
  const updateFullOrderMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const response = await apiRequest("PATCH", `/api/orders/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      setIsEditOrderModalOpen(false);
      toast({
        title: "Cập nhật thành công",
        description: "Đơn hàng đã được cập nhật"
      });
    },
    onError: (error) => {
      console.error('Error updating order:', error);
      toast({
        title: "Lỗi cập nhật",
        description: "Có lỗi xảy ra khi cập nhật đơn hàng",
        variant: "destructive"
      });
    }
  });

  // Mutation to update full reservation
  const updateFullReservationMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const response = await apiRequest("PATCH", `/api/reservations/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/reservations"] });
      setIsEditReservationModalOpen(false);
      toast({
        title: "Cập nhật thành công",
        description: "Đặt bàn đã được cập nhật"
      });
    },
    onError: (error) => {
      console.error('Error updating reservation:', error);
      toast({
        title: "Lỗi cập nhật",
        description: "Có lỗi xảy ra khi cập nhật đặt bàn",
        variant: "destructive"
      });
    }
  });

  const deleteReservationMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest("DELETE", `/api/reservations/${id}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/reservations"] });
      setDeleteReservationId(null);
      toast({
        title: "Đã xóa",
        description: "Đặt bàn đã được xóa thành công"
      });
    },
    onError: (error: any) => {
      toast({
        title: "Lỗi",
        description: error.message || "Không thể xóa đặt bàn",
        variant: "destructive",
      });
    },
  });

  const deleteOrderMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest("DELETE", `/api/orders/${id}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      setDeleteOrderId(null);
      toast({
        title: "Đã xóa",
        description: "Đơn hàng đã được xóa thành công"
      });
    },
    onError: (error: any) => {
      toast({
        title: "Lỗi",
        description: error.message || "Không thể xóa đơn hàng",
        variant: "destructive",
      });
    },
  });

  const handleLogout = () => {
    localStorage.removeItem("user");
    setLocation("/admin/login");
    toast({
      title: "Đăng xuất thành công",
      description: "Bạn đã đăng xuất khỏi dashboard",
    });
  };

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

  const getStatusBadge = (status: string, type: "reservation" | "order") => {
    const statusColors = {
      reservation: {
        pending: "bg-yellow-500",
        confirmed: "bg-green-500", 
        cancelled: "bg-red-500"
      },
      order: {
        pending: "bg-yellow-500",
        confirmed: "bg-blue-500",
        preparing: "bg-orange-500",
        ready: "bg-purple-500",
        delivered: "bg-green-500",
        cancelled: "bg-red-500"
      }
    };

    const color = statusColors[type][status as keyof typeof statusColors[typeof type]] || "bg-gray-500";
    
    return (
      <Badge className={`${color} text-white hover:${color}/80`}>
        {status}
      </Badge>
    );
  };

  if (!user) {
    return null;
  }

  // Apply global filters to data
  const globalFilteredReservations = getTimeFilteredData(reservations, dashboardDateFilter)
    .filter(r => 
      dashboardSearch === "" || 
      (r.name?.toLowerCase() || '').includes(dashboardSearch.toLowerCase()) ||
      r.phone?.includes(dashboardSearch) ||
      (r.email?.toLowerCase() || '').includes(dashboardSearch.toLowerCase())
    );

  const globalFilteredOrders = getTimeFilteredData(orders, dashboardDateFilter)
    .filter(o => 
      dashboardSearch === "" ||
      (o.customerName?.toLowerCase() || '').includes(dashboardSearch.toLowerCase()) ||
      (o.customerEmail?.toLowerCase() || '').includes(dashboardSearch.toLowerCase()) ||
      (o.id?.toLowerCase() || '').includes(dashboardSearch.toLowerCase())
    );

  const globalFilteredMessages = getTimeFilteredData(Array.isArray(contactMessages) ? contactMessages : [], dashboardDateFilter)
    .filter((m: any) => 
      dashboardSearch === "" ||
      (m.name && m.name.toLowerCase().includes(dashboardSearch.toLowerCase())) ||
      (m.email && m.email.toLowerCase().includes(dashboardSearch.toLowerCase())) ||
      (m.message && m.message.toLowerCase().includes(dashboardSearch.toLowerCase()))
    );

  // Apply category filter
  const filteredReservationsByCategory = dashboardCategoryFilter === "all" || dashboardCategoryFilter === "reservations" ? globalFilteredReservations : [];
  const filteredOrdersByCategory = dashboardCategoryFilter === "all" || dashboardCategoryFilter === "orders" ? globalFilteredOrders : [];
  const filteredMessagesByCategory = dashboardCategoryFilter === "all" || dashboardCategoryFilter === "messages" ? globalFilteredMessages : [];

  const stats = {
    totalReservations: filteredReservationsByCategory.length,
    totalOrders: filteredOrdersByCategory.length,
    totalMessages: filteredMessagesByCategory.length,
    cancelledReservations: filteredReservationsByCategory.filter(r => r.status === 'cancelled').length,
    cancelledOrders: filteredOrdersByCategory.filter(o => o.status === 'cancelled').length,
  };

  // Combine all search results for display
  const searchResults = [
    ...filteredReservationsByCategory.map(r => ({ ...r, type: 'reservation' })),
    ...filteredOrdersByCategory.map(o => ({ ...o, type: 'order' })),
    ...filteredMessagesByCategory.map(m => ({ ...m, type: 'message' }))
  ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const showSearchResults = dashboardSearch !== "" || dashboardCategoryFilter !== "all" || dashboardDateFilter !== "all";

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="border-b border-zinc-800">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">{t('admin.dashboardTitle')}</h1>
            <p className="text-zinc-400">{t('admin.welcomeBack')}, {user.username}</p>
          </div>
          <div className="flex items-center gap-4">
            <NotificationPanel />
            <Button
              variant="destructive"
              onClick={handleLogout}
              data-testid="button-logout"
            >
              <LogOut className="w-4 h-4 mr-2" />
              {t('admin.logout')}
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6 mb-8">
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-zinc-300">
                {t("admin.totalReservationsCard")}
              </CardTitle>
              <Calendar className="h-4 w-4 text-zinc-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{stats.totalReservations}</div>
            </CardContent>
          </Card>

          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-zinc-300">
                {t("admin.totalOrdersCard")}
              </CardTitle>
              <ShoppingBag className="h-4 w-4 text-zinc-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{stats.totalOrders}</div>
            </CardContent>
          </Card>

          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-zinc-300">
                {t("admin.totalMessagesCard")}
              </CardTitle>
              <Users className="h-4 w-4 text-zinc-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{stats.totalMessages}</div>
            </CardContent>
          </Card>

          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-zinc-300">
                {currentLanguage === 'vi' ? 'Đặt Bàn Hủy' : 'Cancelled Reservations'}
              </CardTitle>
              <XCircle className="h-4 w-4 text-red-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-400">{stats.cancelledReservations}</div>
            </CardContent>
          </Card>

          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-zinc-300">
                {currentLanguage === 'vi' ? 'Đơn Hàng Hủy' : 'Cancelled Orders'}
              </CardTitle>
              <XCircle className="h-4 w-4 text-red-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-400">{stats.cancelledOrders}</div>
            </CardContent>
          </Card>
        </div>

        {/* Global Search and Filter */}
        <div className="flex flex-col gap-4 mb-6 p-4 bg-zinc-900 border border-zinc-800 rounded-lg">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-zinc-400 h-4 w-4" />
              <Input
                placeholder={t("admin.searchPlaceholder")}
                value={dashboardSearch}
                onChange={(e) => setDashboardSearch(e.target.value)}
                className="pl-10 bg-zinc-800 border-zinc-700 text-white placeholder-zinc-400"
              />
            </div>
            <Select value={dashboardCategoryFilter} onValueChange={setDashboardCategoryFilter}>
              <SelectTrigger className="w-[180px] bg-zinc-800 border-zinc-700 text-white">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Danh mục" />
              </SelectTrigger>
              <SelectContent className="bg-zinc-800 border-zinc-700">
                <SelectItem value="all" className="text-white">{t("admin.allCategories")}</SelectItem>
                <SelectItem value="reservations" className="text-white">Đặt bàn</SelectItem>
                <SelectItem value="orders" className="text-white">Đơn hàng</SelectItem>
                <SelectItem value="messages" className="text-white">Tin nhắn</SelectItem>
              </SelectContent>
            </Select>
            <Select value={dashboardDateFilter} onValueChange={setDashboardDateFilter}>
              <SelectTrigger className="w-[180px] bg-zinc-800 border-zinc-700 text-white">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Thời gian" />
              </SelectTrigger>
              <SelectContent className="bg-zinc-800 border-zinc-700">
                <SelectItem value="all" className="text-white">{t("admin.allTimeFilter")}</SelectItem>
                <SelectItem value="today" className="text-white">{t("admin.todayFilter")}</SelectItem>
                <SelectItem value="7days" className="text-white">{t("admin.last7DaysFilter")}</SelectItem>
                <SelectItem value="30days" className="text-white">{t("admin.last30DaysFilter")}</SelectItem>
                <SelectItem value="90days" className="text-white">{t("admin.last90DaysFilter")}</SelectItem>
                <SelectItem value="180days" className="text-white">180 ngày qua</SelectItem>
                <SelectItem value="year" className="text-white">Năm nay</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        {/* Filter Results Summary */}
        {(dashboardSearch !== "" || dashboardDateFilter !== "all" || dashboardCategoryFilter !== "all") && (
          <div className="mb-4 p-3 bg-zinc-800/50 border border-zinc-700 rounded-lg">
            <div className="text-sm text-zinc-400">
              Kết quả lọc: 
              <span className="text-white ml-2">
                {stats.totalReservations} đặt bàn, {stats.totalOrders} đơn hàng, {stats.totalMessages} tin nhắn
              </span>
              {dashboardSearch && (
                <span className="text-zinc-500 ml-2">
                  (từ khóa: "{dashboardSearch}")
                </span>
              )}
              {dashboardDateFilter !== "all" && (
                <span className="text-zinc-500 ml-2">
                  ({dashboardDateFilter === "today" ? "hôm nay" :
                    dashboardDateFilter === "7days" ? "7 ngày qua" :
                    dashboardDateFilter === "30days" ? "30 ngày qua" :
                    dashboardDateFilter === "90days" ? "90 ngày qua" :
                    dashboardDateFilter === "180days" ? "180 ngày qua" :
                    dashboardDateFilter === "year" ? "năm nay" : dashboardDateFilter})
                </span>
              )}
            </div>
          </div>
        )}

        {/* Search Results Display */}
        {showSearchResults && searchResults.length > 0 && (
          <Card className="bg-zinc-900 border-zinc-800 mb-6">
            <CardHeader>
              <CardTitle className="text-white">Kết quả tìm kiếm</CardTitle>
              <CardDescription className="text-zinc-400">
                Tìm thấy {searchResults.length} kết quả
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {searchResults.slice(0, 10).map((item, index) => (
                  <div
                    key={`${item.type}-${item.id}`}
                    className="p-3 border border-zinc-700 rounded-lg cursor-pointer hover:bg-zinc-800/50 transition-colors"
                    onClick={() => {
                      setSelectedItem(item);
                      setViewDetailModal(true);
                    }}
                    data-testid={`search-result-${item.type}-${item.id}`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline" className="text-xs">
                            {item.type === 'reservation' ? 'Đặt bàn' :
                             item.type === 'order' ? 'Đơn hàng' : 'Tin nhắn'}
                          </Badge>
                          <span className="text-sm text-zinc-400">
                            {new Date(item.createdAt).toLocaleDateString('vi-VN')}
                          </span>
                        </div>
                        
                        {item.type === 'reservation' && (
                          <div>
                            <h4 className="font-medium text-white">{item.name}</h4>
                            <p className="text-sm text-zinc-400">
                              {item.phone} | {item.date} {item.time} | {item.guests} người
                            </p>
                          </div>
                        )}
                        
                        {item.type === 'order' && (
                          <div>
                            <h4 className="font-medium text-white">{item.customerName}</h4>
                            <p className="text-sm text-zinc-400">
                              {item.customerEmail} | {formatPrice(item.totalAmount)}
                            </p>
                          </div>
                        )}
                        
                        {item.type === 'message' && (
                          <div>
                            <h4 className="font-medium text-white">{item.name || 'Khách hàng'}</h4>
                            <p className="text-sm text-zinc-400 truncate">
                              {item.message?.substring(0, 100)}...
                            </p>
                          </div>
                        )}
                      </div>
                      
                      {getStatusBadge(item.status, item.type === 'reservation' ? 'reservation' : 'order')}
                    </div>
                  </div>
                ))}
                
                {searchResults.length > 10 && (
                  <div className="text-center text-zinc-400 text-sm py-2">
                    Hiển thị 10/{searchResults.length} kết quả đầu tiên
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Main Content */}
        <Tabs defaultValue="reservations" className="space-y-4">
          <TabsList className="bg-zinc-900 border-zinc-800">
            <TabsTrigger value="reservations" className="data-[state=active]:bg-zinc-800">
              {t('admin.reservationTab')}
            </TabsTrigger>
            <TabsTrigger value="orders" className="data-[state=active]:bg-zinc-800">
              {t('admin.orderTab')}
            </TabsTrigger>
            <TabsTrigger value="menu" className="data-[state=active]:bg-zinc-800">
              {t('admin.menuTab')}
            </TabsTrigger>

            <TabsTrigger value="blog" className="data-[state=active]:bg-zinc-800">
              {t('admin.blogTab')}
            </TabsTrigger>
            <TabsTrigger value="reviews" className="data-[state=active]:bg-zinc-800">
              {t('admin.reviewTab')}
            </TabsTrigger>
            <TabsTrigger value="contact" className="data-[state=active]:bg-zinc-800">
              {t('admin.contactTab')}
            </TabsTrigger>
            <TabsTrigger value="pages" className="data-[state=active]:bg-zinc-800">
              {currentLanguage === 'vi' ? 'Trang' : 'Pages'}
            </TabsTrigger>
            <TabsTrigger value="feature-settings" className="data-[state=active]:bg-zinc-800">
              {currentLanguage === 'vi' ? 'Khóa Tính Năng' : 'Feature Locks'}
            </TabsTrigger>
            <TabsTrigger value="account" className="data-[state=active]:bg-zinc-800">
              <Settings className="w-4 h-4 mr-2" />
              {t('account.title')}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="reservations" className="space-y-4">
            <Card className="bg-zinc-900 border-zinc-800">
              <CardHeader>
                <CardTitle className="text-white">{t('admin.reservationList')}</CardTitle>
                <CardDescription className="text-zinc-400">
                  {t('admin.reservationSubtitle')}
                </CardDescription>
                
                {/* Search and Filter Controls */}
                <div className="flex flex-col sm:flex-row gap-4 mt-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-zinc-400 h-4 w-4" />
                    <Input
                      placeholder={t('admin.searchReservations')}
                      value={reservationSearch}
                      onChange={(e) => setReservationSearch(e.target.value)}
                      className="pl-10 bg-zinc-800 border-zinc-700 text-white placeholder-zinc-400"
                    />
                  </div>
                  <Select value={reservationTimeFilter} onValueChange={setReservationTimeFilter}>
                    <SelectTrigger className="w-[180px] bg-zinc-800 border-zinc-700 text-white">
                      <Filter className="w-4 h-4 mr-2" />
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-800 border-zinc-700">
                      <SelectItem value="all" className="text-white">{t('admin.allTime')}</SelectItem>
                      <SelectItem value="today" className="text-white">{t('admin.today')}</SelectItem>
                      <SelectItem value="7days" className="text-white">{t('admin.last7Days')}</SelectItem>
                      <SelectItem value="30days" className="text-white">{t('admin.last30Days')}</SelectItem>
                      <SelectItem value="90days" className="text-white">{t('admin.last90Days')}</SelectItem>
                      <SelectItem value="180days" className="text-white">{t('admin.last180Days')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                {/* Results Count and Warning */}
                <div className="flex justify-between items-center mt-4">
                  <div className="text-sm text-zinc-400">
                    {t('admin.showing')} {filteredReservations.length} / {reservations.length} {t('admin.reservations')}
                  </div>
                  <div className="text-sm text-amber-400 bg-amber-900/20 px-3 py-1 rounded border border-amber-500/30 flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4" />
                    {currentLanguage === 'vi' 
                      ? 'Đặt bàn sẽ tự động bị xóa sau 3 tháng' 
                      : 'Reservations will be automatically deleted after 3 months'
                    }
                  </div>
                </div>
              </CardHeader>
              
              
              <CardContent>
                <div className="space-y-4">
                  {filteredReservations.map((reservation) => (
                    <div
                      key={reservation.id}
                      className="p-4 border border-zinc-800 rounded-lg space-y-2"
                      data-testid={`reservation-${reservation.id}`}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h3 className="font-semibold text-white">{reservation.name}</h3>
                          <p className="text-sm text-zinc-400">{reservation.email} | {reservation.phone}</p>
                          <p className="text-sm text-zinc-300">
                            {reservation.date} {t('admin.at')} {reservation.time} - {reservation.guests} {t('admin.people')}
                          </p>
                          <p className="text-sm text-zinc-400 flex items-center gap-2 mt-1">
                            <Clock className="h-3 w-3" />
                            Đặt lúc: {new Date(reservation.createdAt).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })}
                          </p>
                          {reservation.specialRequests && (
                            <p className="text-sm text-zinc-400 mt-1">
                              {t('admin.requests')}: {reservation.specialRequests}
                            </p>
                          )}
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <div className="flex items-center gap-2">
                            {getStatusBadge(reservation.status, "reservation")}
                          </div>
                          <div className="flex gap-2">
                            <Select 
                              value={reservation.status} 
                              onValueChange={(newStatus) => updateReservationMutation.mutate({ 
                                id: reservation.id, 
                                status: newStatus 
                              })}
                            >
                              <SelectTrigger className="w-36 h-8 bg-zinc-800 border-zinc-700 text-white text-sm">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent className="bg-zinc-800 border-zinc-700">
                                <SelectItem value="pending" className="text-white">
                                  {t('admin.pending')}
                                </SelectItem>
                                <SelectItem value="confirmed" className="text-white">
                                  {t('admin.confirmed')}
                                </SelectItem>
                                <SelectItem value="completed" className="text-white">
                                  {t('admin.completed')}
                                </SelectItem>
                                <SelectItem value="cancelled" className="text-white">
                                  {t('admin.cancelled')}
                                </SelectItem>
                              </SelectContent>
                            </Select>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => copyAllInfo('reservation', reservation)}
                              className="text-blue-400 hover:text-blue-300"
                              data-testid={`button-copy-reservation-${reservation.id}`}
                              title={currentLanguage === 'vi' ? 'Sao chép thông tin' : 'Copy info'}
                            >
                              <Copy className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                setSelectedReservation(reservation);
                                setEditReservationData({
                                  name: reservation.name,
                                  email: reservation.email,
                                  phone: reservation.phone,
                                  guests: reservation.guests.toString(),
                                  date: reservation.date,
                                  time: reservation.time,
                                  status: reservation.status,
                                  specialRequests: reservation.specialRequests || ''
                                });
                                setIsEditReservationModalOpen(true);
                              }}
                              className="text-zinc-400 hover:text-white"
                              data-testid={`button-edit-reservation-${reservation.id}`}
                              title={t('admin.edit')}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <AlertDialog open={deleteReservationId === reservation.id} onOpenChange={(open) => !open && setDeleteReservationId(null)}>
                              <AlertDialogTrigger asChild>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => setDeleteReservationId(reservation.id)}
                                  className="text-red-400 hover:text-red-300"
                                  data-testid={`button-delete-reservation-${reservation.id}`}
                                  title={currentLanguage === 'vi' ? 'Xóa đặt bàn' : 'Delete reservation'}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent className="bg-zinc-900 border-zinc-800">
                                <AlertDialogHeader>
                                  <AlertDialogTitle className="text-white">
                                    {currentLanguage === 'vi' ? 'Xác nhận xóa' : 'Confirm Delete'}
                                  </AlertDialogTitle>
                                  <AlertDialogDescription className="text-zinc-400">
                                    {currentLanguage === 'vi' 
                                      ? `Bạn có chắc chắn muốn xóa đặt bàn của ${reservation.name}? Hành động này không thể hoàn tác.`
                                      : `Are you sure you want to delete the reservation for ${reservation.name}? This action cannot be undone.`
                                    }
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel className="bg-zinc-800 text-white border-zinc-700 hover:bg-zinc-700">
                                    {currentLanguage === 'vi' ? 'Hủy' : 'Cancel'}
                                  </AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => deleteReservationMutation.mutate(reservation.id)}
                                    className="bg-red-600 hover:bg-red-700 text-white"
                                  >
                                    {currentLanguage === 'vi' ? 'Xóa' : 'Delete'}
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </div>
                      </div>

                    </div>
                  ))}
                  {filteredReservations.length === 0 && reservations.length > 0 && (
                    <p className="text-center text-zinc-500 py-8">
                      {t('admin.noReservationsFound')}
                    </p>
                  )}
                  {reservations.length === 0 && (
                    <p className="text-center text-zinc-500 py-8">
                      {t('admin.noReservations')}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="orders" className="space-y-4">
            <Card className="bg-zinc-900 border-zinc-800">
              <CardHeader>
                <CardTitle className="text-white">{t('admin.orderList')}</CardTitle>
                <CardDescription className="text-zinc-400">
                  {t('admin.orderSubtitle')}
                </CardDescription>
                
                {/* Search and Filter Controls */}
                <div className="flex flex-col sm:flex-row gap-4 mt-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-zinc-400 h-4 w-4" />
                    <Input
                      placeholder={t('admin.searchOrders')}
                      value={orderSearch}
                      onChange={(e) => setOrderSearch(e.target.value)}
                      className="pl-10 bg-zinc-800 border-zinc-700 text-white placeholder-zinc-400"
                    />
                  </div>
                  <Select value={orderTimeFilter} onValueChange={setOrderTimeFilter}>
                    <SelectTrigger className="w-[180px] bg-zinc-800 border-zinc-700 text-white">
                      <Filter className="w-4 h-4 mr-2" />
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-800 border-zinc-700">
                      <SelectItem value="all" className="text-white">{t('admin.allTime')}</SelectItem>
                      <SelectItem value="today" className="text-white">{t('admin.today')}</SelectItem>
                      <SelectItem value="7days" className="text-white">{t('admin.last7Days')}</SelectItem>
                      <SelectItem value="30days" className="text-white">{t('admin.last30Days')}</SelectItem>
                      <SelectItem value="90days" className="text-white">{t('admin.last90Days')}</SelectItem>
                      <SelectItem value="180days" className="text-white">{t('admin.last180Days')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                {/* Results Count and Warning */}
                <div className="flex justify-between items-center mt-4">
                  <div className="text-sm text-zinc-400">
                    {t('admin.showing')} {filteredOrders.length} / {orders.length} {t('admin.orders')}
                  </div>
                  <div className="text-sm text-amber-400 bg-amber-900/20 px-3 py-1 rounded border border-amber-500/30 flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4" />
                    {currentLanguage === 'vi' 
                      ? 'Đơn hàng sẽ tự động bị xóa sau 3 tháng' 
                      : 'Orders will be automatically deleted after 3 months'
                    }
                  </div>
                </div>
              </CardHeader>
              
              <CardContent>
                <div className="space-y-4">
                  {filteredOrders.map((order) => (
                    <div
                      key={order.id}
                      className="p-4 border border-zinc-800 rounded-lg space-y-2"
                      data-testid={`order-${order.id}`}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h3 className="font-semibold text-white">{order.customerName}</h3>
                          <p className="text-sm text-zinc-400">{order.customerEmail} | {order.customerPhone}</p>
                          {order.customerAddress && (
                            <p className="text-sm text-zinc-400">
                              Địa chỉ: {order.customerAddress}
                            </p>
                          )}
                          <p className="text-sm text-zinc-300">
                            Loại: {getOrderTypeText(order.orderType)} | Tổng: {formatPrice(order.totalAmount)}
                          </p>
                          <p className="text-sm text-zinc-400 flex items-center gap-2 mt-1">
                            <Clock className="h-3 w-3" />
                            Đặt lúc: {new Date(order.createdAt).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })}
                          </p>
                          <div className="text-sm text-zinc-400 mt-1">
                            Món: {order.items.map((item: any) => `${item.name} (x${item.quantity})`).join(", ")}
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <div className="flex items-center gap-2">
                            {getStatusBadge(order.status, "order")}
                          </div>
                          <div className="flex gap-2">
                            <Select 
                              value={order.status} 
                              onValueChange={(newStatus) => updateOrderMutation.mutate({ 
                                id: order.id, 
                                status: newStatus 
                              })}
                            >
                              <SelectTrigger className="w-36 h-8 bg-zinc-800 border-zinc-700 text-white text-sm">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent className="bg-zinc-800 border-zinc-700">
                                <SelectItem value="pending" className="text-white">
                                  {t('admin.pending')}
                                </SelectItem>
                                <SelectItem value="confirmed" className="text-white">
                                  {t('admin.confirmed')}
                                </SelectItem>
                                <SelectItem value="completed" className="text-white">
                                  {t('admin.completed')}
                                </SelectItem>
                                <SelectItem value="cancelled" className="text-white">
                                  {t('admin.cancelled')}
                                </SelectItem>
                              </SelectContent>
                            </Select>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => copyAllInfo('order', order)}
                              className="text-blue-400 hover:text-blue-300"
                              data-testid={`button-copy-order-${order.id}`}
                              title={currentLanguage === 'vi' ? 'Sao chép thông tin' : 'Copy info'}
                            >
                              <Copy className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                setSelectedOrder(order);
                                setEditOrderData({
                                  customerName: order.customerName,
                                  customerEmail: order.customerEmail,
                                  customerPhone: order.customerPhone || '',
                                  customerAddress: order.customerAddress || '',
                                  status: order.status,
                                  orderType: order.orderType,
                                  items: [...order.items]
                                });
                                setIsEditOrderModalOpen(true);
                              }}
                              className="text-zinc-400 hover:text-white"
                              data-testid={`button-edit-order-${order.id}`}
                              title={t('admin.edit')}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <AlertDialog open={deleteOrderId === order.id} onOpenChange={(open) => !open && setDeleteOrderId(null)}>
                              <AlertDialogTrigger asChild>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => setDeleteOrderId(order.id)}
                                  className="text-red-400 hover:text-red-300"
                                  data-testid={`button-delete-order-${order.id}`}
                                  title={currentLanguage === 'vi' ? 'Xóa đơn hàng' : 'Delete order'}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent className="bg-zinc-900 border-zinc-800">
                                <AlertDialogHeader>
                                  <AlertDialogTitle className="text-white">
                                    {currentLanguage === 'vi' ? 'Xác nhận xóa' : 'Confirm Delete'}
                                  </AlertDialogTitle>
                                  <AlertDialogDescription className="text-zinc-400">
                                    {currentLanguage === 'vi' 
                                      ? `Bạn có chắc chắn muốn xóa đơn hàng của ${order.customerName}? Hành động này không thể hoàn tác.`
                                      : `Are you sure you want to delete the order for ${order.customerName}? This action cannot be undone.`
                                    }
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel className="bg-zinc-800 text-white border-zinc-700 hover:bg-zinc-700">
                                    {currentLanguage === 'vi' ? 'Hủy' : 'Cancel'}
                                  </AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => deleteOrderMutation.mutate(order.id)}
                                    className="bg-red-600 hover:bg-red-700 text-white"
                                  >
                                    {currentLanguage === 'vi' ? 'Xóa' : 'Delete'}
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </div>
                      </div>

                    </div>
                  ))}
                  {filteredOrders.length === 0 && orders.length > 0 && (
                    <p className="text-center text-zinc-500 py-8">
                      {t('admin.noOrdersFound')}
                    </p>
                  )}
                  {orders.length === 0 && (
                    <p className="text-center text-zinc-500 py-8">
                      {t('admin.noOrders')}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="menu" className="space-y-4">
            <MenuManagement />
          </TabsContent>



          <TabsContent value="blog" className="space-y-4">
            <BlogManagement />
          </TabsContent>

          <TabsContent value="reviews" className="space-y-4">
            <ReviewManagement />
          </TabsContent>

          <TabsContent value="contact" className="space-y-4">
            <ContactManagement />
          </TabsContent>

          <TabsContent value="pages" className="space-y-4">
            <PagesManagement />
          </TabsContent>
          
          <TabsContent value="account" className="space-y-4">
            <AccountSettings />
          </TabsContent>

          <TabsContent value="feature-settings" className="space-y-4">
            <FeatureLocksSettings />
          </TabsContent>
        </Tabs>
      </div>
      
      {/* Edit Order Modal */}
      <Dialog open={isEditOrderModalOpen} onOpenChange={setIsEditOrderModalOpen}>
        <DialogContent className="bg-zinc-900 border-zinc-800 text-white max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t('admin.editOrder')}</DialogTitle>
            <DialogDescription className="text-zinc-400">
              {t('admin.updateOrderInfo')}
            </DialogDescription>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-zinc-300">{t('admin.customerName')}</label>
                  <Input 
                    value={editOrderData.customerName}
                    onChange={(e) => setEditOrderData({...editOrderData, customerName: e.target.value})}
                    className="mt-1 bg-zinc-800 border-zinc-700 text-white"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-zinc-300">{t('booking.email')}</label>
                  <Input 
                    value={editOrderData.customerEmail}
                    onChange={(e) => setEditOrderData({...editOrderData, customerEmail: e.target.value})}
                    className="mt-1 bg-zinc-800 border-zinc-700 text-white"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-zinc-300">{t('booking.phone')}</label>
                  <Input 
                    value={editOrderData.customerPhone || ''}
                    onChange={(e) => setEditOrderData({...editOrderData, customerPhone: e.target.value})}
                    className="mt-1 bg-zinc-800 border-zinc-700 text-white"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-zinc-300">{currentLanguage === 'vi' ? 'Địa chỉ' : 'Address'}</label>
                  <Input 
                    value={editOrderData.customerAddress || ''}
                    onChange={(e) => setEditOrderData({...editOrderData, customerAddress: e.target.value})}
                    className="mt-1 bg-zinc-800 border-zinc-700 text-white"
                    placeholder={currentLanguage === 'vi' ? 'Nhập địa chỉ giao hàng' : 'Enter delivery address'}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-zinc-300">{t('admin.orderType')}</label>
                  <Select
                    value={editOrderData.orderType}
                    onValueChange={(value) => setEditOrderData({...editOrderData, orderType: value})}
                  >
                    <SelectTrigger className="mt-1 bg-zinc-800 border-zinc-700 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-800 border-zinc-700">
                      <SelectItem value="dine-in" className="text-white">{t('admin.dineIn')}</SelectItem>
                      <SelectItem value="takeout" className="text-white">{t('admin.takeout')}</SelectItem>
                      <SelectItem value="delivery" className="text-white">{t('admin.delivery')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium text-zinc-300">{t('admin.total')}</label>
                  <Input 
                    value={formatPrice(editOrderData.items.reduce((total, item) => total + (item.price * item.quantity), 0))}
                    className="mt-1 bg-zinc-800 border-zinc-700 text-white"
                    readOnly
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-zinc-300">{t('admin.status')}</label>
                  <Select 
                    value={editOrderData.status} 
                    onValueChange={(newStatus) => setEditOrderData({...editOrderData, status: newStatus})}
                  >
                    <SelectTrigger className="mt-1 bg-zinc-800 border-zinc-700 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-800 border-zinc-700">
                      <SelectItem value="pending" className="text-white">{t('admin.pending')}</SelectItem>
                      <SelectItem value="confirmed" className="text-white">{t('admin.confirmed')}</SelectItem>
                      <SelectItem value="completed" className="text-white">{t('admin.completed')}</SelectItem>
                      <SelectItem value="cancelled" className="text-white">{t('admin.cancelled')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium text-zinc-300">{t('admin.orderedItems')}</label>
                <div className="mt-2 space-y-2 max-h-48 overflow-y-auto">
                  {editOrderData.items.map((item, index) => (
                    <div key={index} className="bg-zinc-800 p-3 rounded border border-zinc-700">
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-white flex-1">{item.name}</span>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              const newItems = [...editOrderData.items];
                              if (newItems[index].quantity > 1) {
                                newItems[index].quantity -= 1;
                                setEditOrderData({...editOrderData, items: newItems});
                              }
                            }}
                            className="h-6 w-6 p-0 border-zinc-600 text-white hover:bg-zinc-700"
                          >
                            -
                          </Button>
                          <span className="text-white w-8 text-center">{item.quantity}</span>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              const newItems = [...editOrderData.items];
                              newItems[index].quantity += 1;
                              setEditOrderData({...editOrderData, items: newItems});
                            }}
                            className="h-6 w-6 p-0 border-zinc-600 text-white hover:bg-zinc-700"
                          >
                            +
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              const newItems = editOrderData.items.filter((_, i) => i !== index);
                              setEditOrderData({...editOrderData, items: newItems});
                            }}
                            className="h-6 w-6 p-0 border-red-600 text-red-400 hover:bg-red-900"
                          >
                            ×
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                {!showAddItemSection && (
                  <Button
                    variant="outline"
                    onClick={() => setShowAddItemSection(true)}
                    className="mt-2 border-zinc-600 text-white hover:bg-zinc-700"
                  >
                    + {t('admin.addItem')}
                  </Button>
                )}
                
                {showAddItemSection && (
                  <div className="mt-4 p-3 bg-zinc-800 border border-zinc-700 rounded">
                    <div className="flex justify-between items-center mb-3">
                      <h4 className="text-sm font-medium text-zinc-300">{t('admin.selectItemToAdd')}</h4>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setShowAddItemSection(false);
                          setSearchQuery('');
                        }}
                        className="border-zinc-600 text-white hover:bg-zinc-700"
                      >
                        ×
                      </Button>
                    </div>
                    
                    <div className="mb-3">
                      <Input
                        placeholder={t('admin.searchFood')}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="bg-zinc-700 border-zinc-600 text-white placeholder-zinc-400"
                      />
                    </div>
                    
                    <div className="grid grid-cols-1 gap-2 max-h-32 overflow-y-auto">
                      {filteredMenuItems?.map((item: any) => (
                        <div key={item.id} className="flex justify-between items-center p-2 bg-zinc-700 rounded">
                          <div className="flex flex-col">
                            <span className="text-white text-sm">{item.name}</span>
                            {(item.nameVi || item.name_vi) && (
                              <span className="text-zinc-400 text-xs">{item.nameVi || item.name_vi}</span>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-zinc-300 text-sm">{Math.round(parseFloat(item.price))?.toLocaleString()} VND</span>
                            <Button
                              size="sm"
                              onClick={() => {
                                const existingItemIndex = editOrderData.items.findIndex(orderItem => orderItem.id === item.id);
                                if (existingItemIndex >= 0) {
                                  const newItems = [...editOrderData.items];
                                  newItems[existingItemIndex].quantity += 1;
                                  setEditOrderData({...editOrderData, items: newItems});
                                } else {
                                  setEditOrderData({
                                    ...editOrderData, 
                                    items: [...editOrderData.items, {
                                      id: item.id,
                                      name: item.name,
                                      price: item.price,
                                      quantity: 1
                                    }]
                                  });
                                }
                                setShowAddItemSection(false);
                                setSearchQuery('');
                              }}
                              className="bg-yellow-600 hover:bg-yellow-700 text-white h-6 px-2 text-xs"
                            >
                              {t('admin.add')}
                            </Button>
                          </div>
                        </div>
                      ))}
                      
                      {filteredMenuItems?.length === 0 && searchQuery && (
                        <div className="text-center text-zinc-400 text-sm py-4">
                          {t('admin.noItemsFound')} "{searchQuery}"
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
              
              <div className="flex justify-end gap-2 pt-4 border-t border-zinc-700">
                <Button 
                  variant="outline" 
                  onClick={() => setIsEditOrderModalOpen(false)}
                  className="border-zinc-600 text-white hover:bg-zinc-800"
                >
                  {t('admin.cancel')}
                </Button>
                <Button 
                  onClick={() => {
                    const newTotalAmount = editOrderData.items.reduce((total, item) => total + (item.price * item.quantity), 0);
                    updateFullOrderMutation.mutate({
                      id: selectedOrder.id,
                      data: {
                        customerName: editOrderData.customerName,
                        customerEmail: editOrderData.customerEmail,
                        customerPhone: editOrderData.customerPhone,
                        customerAddress: editOrderData.customerAddress,
                        orderType: editOrderData.orderType,
                        status: editOrderData.status,
                        items: editOrderData.items,
                        totalAmount: newTotalAmount.toString()
                      }
                    });
                  }}
                  className="bg-yellow-600 hover:bg-yellow-700 text-white"
                  disabled={updateFullOrderMutation.isPending}
                >
                  {updateFullOrderMutation.isPending ? t('common.loading') : t('admin.update')}
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
            <DialogTitle>{t('admin.editReservation')}</DialogTitle>
            <DialogDescription className="text-zinc-400">
              {t('admin.updateReservationInfo')}
            </DialogDescription>
          </DialogHeader>
          {selectedReservation && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-zinc-300">{t('admin.customerName')}</label>
                  <Input 
                    value={editReservationData.name}
                    onChange={(e) => setEditReservationData({...editReservationData, name: e.target.value})}
                    className="mt-1 bg-zinc-800 border-zinc-700 text-white"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-zinc-300">{t('booking.email')}</label>
                  <Input 
                    value={editReservationData.email}
                    onChange={(e) => setEditReservationData({...editReservationData, email: e.target.value})}
                    className="mt-1 bg-zinc-800 border-zinc-700 text-white"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-zinc-300">{t('booking.phone')}</label>
                  <Input 
                    value={editReservationData.phone}
                    onChange={(e) => setEditReservationData({...editReservationData, phone: e.target.value})}
                    className="mt-1 bg-zinc-800 border-zinc-700 text-white"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-zinc-300">{t('booking.guests')}</label>
                  <Input 
                    type="number"
                    value={editReservationData.guests}
                    onChange={(e) => setEditReservationData({...editReservationData, guests: e.target.value})}
                    className="mt-1 bg-zinc-800 border-zinc-700 text-white"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-zinc-300">{t('booking.date')}</label>
                  <Input 
                    type="date"
                    value={editReservationData.date}
                    onChange={(e) => setEditReservationData({...editReservationData, date: e.target.value})}
                    className="mt-1 bg-zinc-800 border-zinc-700 text-white"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-zinc-300">{t('booking.time')}</label>
                  <Input 
                    type="time"
                    value={editReservationData.time}
                    onChange={(e) => setEditReservationData({...editReservationData, time: e.target.value})}
                    className="mt-1 bg-zinc-800 border-zinc-700 text-white"
                  />
                </div>
                <div className="col-span-2">
                  <label className="text-sm font-medium text-zinc-300">{t('admin.status')}</label>
                  <Select 
                    value={editReservationData.status} 
                    onValueChange={(newStatus) => setEditReservationData({...editReservationData, status: newStatus})}
                  >
                    <SelectTrigger className="mt-1 bg-zinc-800 border-zinc-700 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-800 border-zinc-700">
                      <SelectItem value="pending" className="text-white">{t('admin.pending')}</SelectItem>
                      <SelectItem value="confirmed" className="text-white">{t('admin.confirmed')}</SelectItem>
                      <SelectItem value="completed" className="text-white">{t('admin.completed')}</SelectItem>
                      <SelectItem value="cancelled" className="text-white">{t('admin.cancelled')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium text-zinc-300">{t('admin.specialRequests')}</label>
                <textarea
                  value={editReservationData.specialRequests}
                  onChange={(e) => setEditReservationData({...editReservationData, specialRequests: e.target.value})}
                  className="mt-1 w-full p-3 bg-zinc-800 border border-zinc-700 rounded text-white text-sm"
                  rows={3}
                  placeholder={t('booking.requestsPlaceholder')}
                />
              </div>
              
              <div className="flex justify-end gap-2 pt-4 border-t border-zinc-700">
                <Button 
                  variant="outline" 
                  onClick={() => setIsEditReservationModalOpen(false)}
                  className="border-zinc-600 text-white hover:bg-zinc-800"
                >
                  {t('admin.cancel')}
                </Button>
                <Button 
                  onClick={() => {
                    updateFullReservationMutation.mutate({
                      id: selectedReservation.id,
                      data: {
                        name: editReservationData.name,
                        email: editReservationData.email,
                        phone: editReservationData.phone,
                        guests: parseInt(editReservationData.guests),
                        date: editReservationData.date,
                        time: editReservationData.time,
                        status: editReservationData.status,
                        specialRequests: editReservationData.specialRequests
                      }
                    });
                  }}
                  className="bg-yellow-600 hover:bg-yellow-700 text-white"
                  disabled={updateFullReservationMutation.isPending}
                >
                  {updateFullReservationMutation.isPending ? t('common.loading') : t('admin.update')}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
      
      {/* View Detail Modal */}
      <Dialog open={viewDetailModal} onOpenChange={setViewDetailModal}>
        <DialogContent className="bg-zinc-900 border-zinc-800 text-white max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              Chi tiết {selectedItem?.type === 'reservation' ? 'đặt bàn' :
                       selectedItem?.type === 'order' ? 'đơn hàng' : 'tin nhắn'}
            </DialogTitle>
          </DialogHeader>
          {selectedItem && (
            <div className="space-y-4">
              {/* Reservation Details */}
              {selectedItem.type === 'reservation' && (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-zinc-300">Tên khách hàng</label>
                      <p className="text-white">{selectedItem.name}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-zinc-300">Email</label>
                      <p className="text-white">{selectedItem.email}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-zinc-300">Số điện thoại</label>
                      <p className="text-white">{selectedItem.phone}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-zinc-300">Số khách</label>
                      <p className="text-white">{selectedItem.guests} người</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-zinc-300">Ngày</label>
                      <p className="text-white">{selectedItem.date}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-zinc-300">Thời gian</label>
                      <p className="text-white">{selectedItem.time}</p>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-zinc-300">Trạng thái</label>
                    <div className="mt-1">
                      {getStatusBadge(selectedItem.status, 'reservation')}
                    </div>
                  </div>
                  {selectedItem.specialRequests && (
                    <div>
                      <label className="text-sm font-medium text-zinc-300">Yêu cầu đặc biệt</label>
                      <p className="text-white bg-zinc-800 p-3 rounded mt-1">{selectedItem.specialRequests}</p>
                    </div>
                  )}
                  <div>
                    <label className="text-sm font-medium text-zinc-300">Thời gian tạo</label>
                    <p className="text-white">{new Date(selectedItem.createdAt).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })}</p>
                  </div>
                </div>
              )}
              
              {/* Order Details */}
              {selectedItem.type === 'order' && (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-zinc-300">Tên khách hàng</label>
                      <p className="text-white">{selectedItem.customerName}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-zinc-300">Email</label>
                      <p className="text-white">{selectedItem.customerEmail}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-zinc-300">Số điện thoại</label>
                      <p className="text-white">{selectedItem.customerPhone}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-zinc-300">Loại đơn hàng</label>
                      <p className="text-white">{getOrderTypeText(selectedItem.orderType)}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-zinc-300">Tổng tiền</label>
                      <p className="text-white font-semibold">{formatPrice(selectedItem.totalAmount)}</p>
                    </div>
                    {selectedItem.customerAddress && (
                      <div className="col-span-2">
                        <label className="text-sm font-medium text-zinc-300">Địa chỉ giao hàng</label>
                        <p className="text-white bg-zinc-800 p-3 rounded mt-1">{selectedItem.customerAddress}</p>
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="text-sm font-medium text-zinc-300">Trạng thái</label>
                    <div className="mt-1">
                      {getStatusBadge(selectedItem.status, 'order')}
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-zinc-300">Món ăn đã đặt</label>
                    <div className="mt-1 space-y-2">
                      {selectedItem.items?.map((item: any, index: number) => (
                        <div key={index} className="flex justify-between items-center bg-zinc-800 p-3 rounded">
                          <span className="text-white">{item.name}</span>
                          <span className="text-zinc-400">x{item.quantity} - {(item.price * item.quantity).toLocaleString()} VND</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-zinc-300">Thời gian tạo</label>
                    <p className="text-white">{new Date(selectedItem.createdAt).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })}</p>
                  </div>
                </div>
              )}
              
              {/* Message Details */}
              {selectedItem.type === 'message' && (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-zinc-300">Tên</label>
                      <p className="text-white">{selectedItem.name || 'Không có'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-zinc-300">Email</label>
                      <p className="text-white">{selectedItem.email || 'Không có'}</p>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-zinc-300">Nội dung tin nhắn</label>
                    <p className="text-white bg-zinc-800 p-3 rounded mt-1">{selectedItem.message}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-zinc-300">Thời gian gửi</label>
                    <p className="text-white">{new Date(selectedItem.createdAt).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })}</p>
                  </div>
                </div>
              )}
              
              <div className="flex justify-end pt-4 border-t border-zinc-700">
                <Button 
                  variant="outline" 
                  onClick={() => setViewDetailModal(false)}
                  className="border-zinc-600 text-white hover:bg-zinc-800"
                >
                  Đóng
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}