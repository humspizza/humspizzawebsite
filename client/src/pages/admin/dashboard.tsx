import { useState, useEffect, useMemo } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
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
import { formatDbTimestamp } from "@/lib/utils";

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
  const [reservationDateFrom, setReservationDateFrom] = useState("");
  const [reservationDateTo, setReservationDateTo] = useState("");
  const [orderDateFrom, setOrderDateFrom] = useState("");
  const [orderDateTo, setOrderDateTo] = useState("");
  const [showReservationArchive, setShowReservationArchive] = useState(false);
  const [reservationArchiveDateFrom, setReservationArchiveDateFrom] = useState("");
  const [reservationArchiveDateTo, setReservationArchiveDateTo] = useState("");
  const [showOrderArchive, setShowOrderArchive] = useState(false);
  const [orderArchiveDateFrom, setOrderArchiveDateFrom] = useState("");
  const [orderArchiveDateTo, setOrderArchiveDateTo] = useState("");
  
  // Edit modal states
  const [isEditOrderModalOpen, setIsEditOrderModalOpen] = useState(false);
  const [isEditReservationModalOpen, setIsEditReservationModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);
  
  // Delete confirmation states
  const [deleteReservationId, setDeleteReservationId] = useState<string | null>(null);
  const [deleteOrderId, setDeleteOrderId] = useState<string | null>(null);
  
  // Multi-select states for bulk delete
  const [selectedReservations, setSelectedReservations] = useState<Set<string>>(new Set());
  const [selectedOrders, setSelectedOrders] = useState<Set<string>>(new Set());
  const [showBulkDeleteReservations, setShowBulkDeleteReservations] = useState(false);
  const [showBulkDeleteOrders, setShowBulkDeleteOrders] = useState(false);
  const [showBulkArchiveReservations, setShowBulkArchiveReservations] = useState(false);
  const [showBulkArchiveOrders, setShowBulkArchiveOrders] = useState(false);
  const [isMultiSelectReservations, setIsMultiSelectReservations] = useState(false);
  const [isMultiSelectOrders, setIsMultiSelectOrders] = useState(false);
  const [isMultiSelectArchiveReservations, setIsMultiSelectArchiveReservations] = useState(false);
  const [isMultiSelectArchiveOrders, setIsMultiSelectArchiveOrders] = useState(false);
  const [selectedArchiveReservations, setSelectedArchiveReservations] = useState<Set<string>>(new Set());
  const [selectedArchiveOrders, setSelectedArchiveOrders] = useState<Set<string>>(new Set());
  const [showBulkDeleteArchiveReservations, setShowBulkDeleteArchiveReservations] = useState(false);
  const [showBulkDeleteArchiveOrders, setShowBulkDeleteArchiveOrders] = useState(false);
  const [showBulkRestoreReservations, setShowBulkRestoreReservations] = useState(false);
  const [showBulkRestoreOrders, setShowBulkRestoreOrders] = useState(false);
  
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

  const { data: archivedReservationsRaw = [] } = useQuery<any[]>({
    queryKey: ["/api/reservations/archive"],
    queryFn: () => fetch(`/api/reservations/archive`, { credentials: 'include' }).then(r => r.json()),
    enabled: showReservationArchive,
  });

  const { data: archivedOrdersRaw = [] } = useQuery<any[]>({
    queryKey: ["/api/orders/archive"],
    queryFn: () => fetch(`/api/orders/archive`, { credentials: 'include' }).then(r => r.json()),
    enabled: showOrderArchive,
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

  // Date shortcut helper
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
  const getActiveMonthShortcut = (from: string, to: string): string => {
    if (!from || !to) return '';
    const now = new Date();
    const thisFrom = fmtDate(new Date(now.getFullYear(), now.getMonth(), 1));
    const thisTo = fmtDate(new Date(now.getFullYear(), now.getMonth() + 1, 0));
    if (from === thisFrom && to === thisTo) return 'this_month';
    const lastFrom = fmtDate(new Date(now.getFullYear(), now.getMonth() - 1, 1));
    const lastTo = fmtDate(new Date(now.getFullYear(), now.getMonth(), 0));
    if (from === lastFrom && to === lastTo) return 'last_month';
    const threeFrom = fmtDate(new Date(now.getFullYear(), now.getMonth() - 2, 1));
    if (from === threeFrom && to === thisTo) return '3_months';
    return '';
  };
  const applyArchiveShortcut = (key: 'this_month' | 'last_month' | '3_months', setFrom: (v: string) => void, setTo: (v: string) => void, currentFrom: string, currentTo: string) => {
    const now = new Date();
    let from = '', to = '';
    if (key === 'this_month') {
      from = fmtDate(new Date(now.getFullYear(), now.getMonth(), 1));
      to = fmtDate(new Date(now.getFullYear(), now.getMonth() + 1, 0));
    } else if (key === 'last_month') {
      from = fmtDate(new Date(now.getFullYear(), now.getMonth() - 1, 1));
      to = fmtDate(new Date(now.getFullYear(), now.getMonth(), 0));
    } else {
      from = fmtDate(new Date(now.getFullYear(), now.getMonth() - 2, 1));
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

  // Filtered data
  const filteredReservations = reservations
    .filter(r => {
      if (reservationDateFrom || reservationDateTo) {
        const rDate = r.date; // "YYYY-MM-DD" format
        if (reservationDateFrom && rDate < reservationDateFrom) return false;
        if (reservationDateTo && rDate > reservationDateTo) return false;
      }
      const q = reservationSearch.toLowerCase();
      return !q || (r.name?.toLowerCase() || '').includes(q) || r.phone?.includes(q) || (r.email?.toLowerCase() || '').includes(q);
    });

  const phoneCountMap = useMemo(() => {
    const map = new Map<string, number>();
    const allPhones = [
      ...reservations.map((r: any) => r.phone),
      ...archivedReservationsRaw.map((r: any) => r.phone),
    ];
    for (const phone of allPhones) {
      if (phone) map.set(phone, (map.get(phone) || 0) + 1);
    }
    return map;
  }, [reservations, archivedReservationsRaw]);

  const filteredOrders = orders
    .filter(o => {
      if (orderDateFrom || orderDateTo) {
        const oDate = o.createdAt ? o.createdAt.toString().slice(0, 10) : '';
        if (orderDateFrom && oDate < orderDateFrom) return false;
        if (orderDateTo && oDate > orderDateTo) return false;
      }
      const q = orderSearch.toLowerCase();
      return !q || (o.customerName?.toLowerCase() || '').includes(q) || (o.customerEmail?.toLowerCase() || '').includes(q) || (o.id?.toLowerCase() || '').includes(q);
    });

  const archivedReservations = archivedReservationsRaw.filter(r => {
    if (!reservationArchiveDateFrom && !reservationArchiveDateTo) return true;
    const rDate = r.date || '';
    if (reservationArchiveDateFrom && rDate < reservationArchiveDateFrom) return false;
    if (reservationArchiveDateTo && rDate > reservationArchiveDateTo) return false;
    return true;
  });

  const archivedOrders = archivedOrdersRaw.filter(o => {
    if (!orderArchiveDateFrom && !orderArchiveDateTo) return true;
    const oDate = o.originalCreatedAt ? o.originalCreatedAt.toString().slice(0, 10) : (o.archivedAt ? o.archivedAt.toString().slice(0, 10) : '');
    if (orderArchiveDateFrom && oDate < orderArchiveDateFrom) return false;
    if (orderArchiveDateTo && oDate > orderArchiveDateTo) return false;
    return true;
  });

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

  // Bulk delete mutations
  const bulkDeleteReservationsMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      const results = await Promise.all(
        ids.map(id => apiRequest("DELETE", `/api/reservations/${id}`))
      );
      return results;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/reservations"] });
      setSelectedReservations(new Set());
      setShowBulkDeleteReservations(false);
      toast({
        title: "Đã xóa",
        description: `Đã xóa ${selectedReservations.size} đặt bàn thành công`
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

  const bulkDeleteOrdersMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      const results = await Promise.all(
        ids.map(id => apiRequest("DELETE", `/api/orders/${id}`))
      );
      return results;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      setSelectedOrders(new Set());
      setShowBulkDeleteOrders(false);
      toast({
        title: "Đã xóa",
        description: `Đã xóa ${selectedOrders.size} đơn hàng thành công`
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

  const bulkArchiveReservationsMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      return apiRequest("POST", "/api/reservations/bulk-archive", { ids });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/reservations"] });
      setSelectedReservations(new Set());
      setShowBulkArchiveReservations(false);
      setIsMultiSelectReservations(false);
      setShowReservationArchive(true);
      toast({
        title: currentLanguage === 'vi' ? "Đã lưu trữ" : "Archived",
        description: currentLanguage === 'vi'
          ? `Đã lưu trữ thành công, chuyển sang kho lưu trữ`
          : `Successfully archived, switched to archive view`
      });
    },
    onError: (error: any) => {
      toast({
        title: "Lỗi",
        description: error.message || "Không thể lưu trữ đặt bàn",
        variant: "destructive",
      });
    },
  });

  const bulkArchiveOrdersMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      return apiRequest("POST", "/api/orders/bulk-archive", { ids });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      setSelectedOrders(new Set());
      setShowBulkArchiveOrders(false);
      setIsMultiSelectOrders(false);
      setShowOrderArchive(true);
      toast({
        title: currentLanguage === 'vi' ? "Đã lưu trữ" : "Archived",
        description: currentLanguage === 'vi'
          ? `Đã lưu trữ thành công, chuyển sang kho lưu trữ`
          : `Successfully archived, switched to archive view`
      });
    },
    onError: (error: any) => {
      toast({
        title: "Lỗi",
        description: error.message || "Không thể lưu trữ đơn hàng",
        variant: "destructive",
      });
    },
  });

  const restoreArchivedReservationsMutation = useMutation({
    mutationFn: async (ids: string[]) => apiRequest("POST", "/api/reservations/archive/restore", { ids }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/reservations"] });
      queryClient.invalidateQueries({ queryKey: ["/api/reservations/archive"] });
      setSelectedArchiveReservations(new Set());
      setIsMultiSelectArchiveReservations(false);
      setShowBulkRestoreReservations(false);
      toast({ title: currentLanguage === 'vi' ? "Đã phục hồi" : "Restored", description: currentLanguage === 'vi' ? "Phục hồi thành công về danh sách hiện tại" : "Successfully restored to active list" });
    },
    onError: (error: any) => toast({ title: "Lỗi", description: error.message, variant: "destructive" }),
  });

  const bulkDeleteArchivedReservationsMutation = useMutation({
    mutationFn: async (ids: string[]) => apiRequest("POST", "/api/reservations/archive/bulk-delete", { ids }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/reservations/archive"] });
      setSelectedArchiveReservations(new Set());
      setIsMultiSelectArchiveReservations(false);
      setShowBulkDeleteArchiveReservations(false);
      toast({ title: currentLanguage === 'vi' ? "Đã xóa" : "Deleted", description: currentLanguage === 'vi' ? "Đã xóa vĩnh viễn khỏi kho lưu trữ" : "Permanently deleted from archive" });
    },
    onError: (error: any) => toast({ title: "Lỗi", description: error.message, variant: "destructive" }),
  });

  const restoreArchivedOrdersMutation = useMutation({
    mutationFn: async (ids: string[]) => apiRequest("POST", "/api/orders/archive/restore", { ids }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/orders/archive"] });
      setSelectedArchiveOrders(new Set());
      setIsMultiSelectArchiveOrders(false);
      setShowBulkRestoreOrders(false);
      toast({ title: currentLanguage === 'vi' ? "Đã phục hồi" : "Restored", description: currentLanguage === 'vi' ? "Phục hồi thành công về danh sách hiện tại" : "Successfully restored to active list" });
    },
    onError: (error: any) => toast({ title: "Lỗi", description: error.message, variant: "destructive" }),
  });

  const bulkDeleteArchivedOrdersMutation = useMutation({
    mutationFn: async (ids: string[]) => apiRequest("POST", "/api/orders/archive/bulk-delete", { ids }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders/archive"] });
      setSelectedArchiveOrders(new Set());
      setIsMultiSelectArchiveOrders(false);
      setShowBulkDeleteArchiveOrders(false);
      toast({ title: currentLanguage === 'vi' ? "Đã xóa" : "Deleted", description: currentLanguage === 'vi' ? "Đã xóa vĩnh viễn khỏi kho lưu trữ" : "Permanently deleted from archive" });
    },
    onError: (error: any) => toast({ title: "Lỗi", description: error.message, variant: "destructive" }),
  });

  // Toggle selection functions
  const toggleReservationSelection = (id: string) => {
    setSelectedReservations(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const toggleOrderSelection = (id: string) => {
    setSelectedOrders(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const toggleAllReservations = () => {
    if (selectedReservations.size === filteredReservations.length) {
      setSelectedReservations(new Set());
    } else {
      setSelectedReservations(new Set(filteredReservations.map(r => r.id)));
    }
  };

  const toggleAllOrders = () => {
    if (selectedOrders.size === filteredOrders.length) {
      setSelectedOrders(new Set());
    } else {
      setSelectedOrders(new Set(filteredOrders.map(o => o.id)));
    }
  };

  const toggleArchiveReservationSelection = (id: string) => {
    setSelectedArchiveReservations(prev => {
      const s = new Set(prev);
      s.has(id) ? s.delete(id) : s.add(id);
      return s;
    });
  };

  const toggleAllArchiveReservations = () => {
    if (selectedArchiveReservations.size === archivedReservations.length) {
      setSelectedArchiveReservations(new Set());
    } else {
      setSelectedArchiveReservations(new Set(archivedReservations.map((r: any) => r.id)));
    }
  };

  const toggleArchiveOrderSelection = (id: string) => {
    setSelectedArchiveOrders(prev => {
      const s = new Set(prev);
      s.has(id) ? s.delete(id) : s.add(id);
      return s;
    });
  };

  const toggleAllArchiveOrders = () => {
    if (selectedArchiveOrders.size === archivedOrders.length) {
      setSelectedArchiveOrders(new Set());
    } else {
      setSelectedArchiveOrders(new Set(archivedOrders.map((o: any) => o.id)));
    }
  };

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
                <div className="flex flex-col gap-2 mt-4">
                  {/* Row 1: Search + Archive toggle */}
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-zinc-400 h-4 w-4" />
                      <Input
                        placeholder={t('admin.searchReservations')}
                        value={reservationSearch}
                        onChange={(e) => setReservationSearch(e.target.value)}
                        className="pl-10 bg-zinc-800 border-zinc-700 text-white placeholder-zinc-400 h-9"
                      />
                    </div>
                    <Button
                      size="sm"
                      onClick={() => setShowReservationArchive(!showReservationArchive)}
                      className="bg-zinc-700 text-white hover:bg-zinc-600 shrink-0"
                    >
                      {showReservationArchive
                        ? (currentLanguage === 'vi' ? 'Xem hiện tại' : 'View Active')
                        : (currentLanguage === 'vi' ? 'Kho lưu trữ' : 'Archive')
                      }
                    </Button>
                  </div>
                  {/* Row 2: Date filter (both active and archive) */}
                  {(() => {
                    const isArchive = showReservationArchive;
                    const dateFrom = isArchive ? reservationArchiveDateFrom : reservationDateFrom;
                    const dateTo = isArchive ? reservationArchiveDateTo : reservationDateTo;
                    const setFrom = isArchive ? setReservationArchiveDateFrom : setReservationDateFrom;
                    const setTo = isArchive ? setReservationArchiveDateTo : setReservationDateTo;
                    const activeMonth = isArchive ? getActiveMonthShortcut(dateFrom, dateTo) : '';
                    const archiveShortcutLabels: Record<string, [string, string]> = {
                      last_month: ['Tháng Trước', 'Last Month'],
                      this_month: ['Tháng Này', 'This Month'],
                      '3_months': ['3 Tháng gần Đây', 'Last 3 Months'],
                    };
                    return (
                      <div className="flex items-center gap-2 flex-wrap">
                        <Filter className="w-4 h-4 text-zinc-500 shrink-0" />
                        {isArchive ? (
                          (['last_month', 'this_month', '3_months'] as const).map(key => {
                            const active = activeMonth === key;
                            const [vi, en] = archiveShortcutLabels[key];
                            return (
                              <button key={key} onClick={() => applyArchiveShortcut(key, setFrom, setTo, dateFrom, dateTo)}
                                className={`text-xs px-2.5 py-1.5 rounded border transition-colors ${active ? 'bg-yellow-600/20 border-yellow-600 text-yellow-400' : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:border-zinc-500 hover:text-zinc-200'}`}>
                                {currentLanguage === 'vi' ? vi : en}
                              </button>
                            );
                          })
                        ) : (
                          (['today', 'week', 'month'] as const).map(s => {
                            const active = getActiveShortcut(dateFrom, dateTo) === s;
                            const label = s === 'today' ? (currentLanguage === 'vi' ? 'Hôm nay' : 'Today') : s === 'week' ? (currentLanguage === 'vi' ? 'Tuần này' : 'This week') : (currentLanguage === 'vi' ? 'Tháng này' : 'This month');
                            return (
                              <button key={s} onClick={() => applyDateShortcut(s, setFrom, setTo, dateFrom, dateTo)}
                                className={`text-xs px-2.5 py-1.5 rounded border transition-colors ${active ? 'bg-yellow-600/20 border-yellow-600 text-yellow-400' : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:border-zinc-500 hover:text-zinc-200'}`}>
                                {label}
                              </button>
                            );
                          })
                        )}
                        <span className="text-zinc-600 text-xs">|</span>
                        <input type="date" value={dateFrom} onChange={e => setFrom(e.target.value)}
                          className="h-8 px-2 rounded bg-zinc-800 border border-zinc-700 text-white text-xs focus:outline-none focus:border-zinc-500 w-[120px]" />
                        <span className="text-zinc-500 text-sm">—</span>
                        <input type="date" value={dateTo} onChange={e => setTo(e.target.value)}
                          className="h-8 px-2 rounded bg-zinc-800 border border-zinc-700 text-white text-xs focus:outline-none focus:border-zinc-500 w-[120px]" />
                        {(dateFrom || dateTo) && (
                          <button onClick={() => { setFrom(""); setTo(""); }} className="text-zinc-400 hover:text-white text-xs px-2 py-1 rounded bg-zinc-700 hover:bg-zinc-600">✕</button>
                        )}
                      </div>
                    );
                  })()}
                </div>
                
                {/* Results Count and Warning */}
                <div className="flex justify-between items-center mt-4">
                  <div className="text-sm text-zinc-400">
                    {showReservationArchive
                      ? (currentLanguage === 'vi'
                          ? `Kho lưu trữ: ${archivedReservations.length} / ${archivedReservationsRaw.length} đặt bàn`
                          : `Archive: ${archivedReservations.length} / ${archivedReservationsRaw.length} reservations`)
                      : `${t('admin.showing')} ${filteredReservations.length} / ${reservations.length} ${t('admin.reservations')}`
                    }
                  </div>
                  <div className="text-sm text-zinc-400 bg-zinc-800/50 px-3 py-1 rounded border border-zinc-700">
                    {currentLanguage === 'vi' 
                      ? 'Dữ liệu được lưu trữ theo tháng' 
                      : 'Data is stored monthly'
                    }
                  </div>
                </div>

                {/* Summary Stats */}
                {(() => {
                  const list = showReservationArchive ? archivedReservations : filteredReservations;
                  const total = list.length;
                  const cancelled = list.filter((r: any) => r.status === 'cancelled').length;
                  const newGuests = list.filter((r: any) => (phoneCountMap.get(r.phone) ?? 0) <= 1).length;
                  const returning = list.filter((r: any) => (phoneCountMap.get(r.phone) ?? 0) > 1).length;
                  if (total === 0) return null;
                  return (
                    <div className="grid grid-cols-4 gap-2 mt-3">
                      <div className="bg-zinc-800/60 border border-zinc-700 rounded-lg px-3 py-2 text-center">
                        <div className="text-lg font-bold text-white">{total}</div>
                        <div className="text-[11px] text-zinc-400">{currentLanguage === 'vi' ? 'Tổng đặt bàn' : 'Total'}</div>
                      </div>
                      <div className="bg-zinc-800/60 border border-zinc-700 rounded-lg px-3 py-2 text-center">
                        <div className="text-lg font-bold text-red-400">{cancelled}</div>
                        <div className="text-[11px] text-zinc-400">{currentLanguage === 'vi' ? 'Đã hủy' : 'Cancelled'}</div>
                      </div>
                      <div className="bg-zinc-800/60 border border-zinc-700 rounded-lg px-3 py-2 text-center">
                        <div className="text-lg font-bold text-emerald-400">{newGuests}</div>
                        <div className="text-[11px] text-zinc-400">{currentLanguage === 'vi' ? 'Khách mới' : 'New guests'}</div>
                      </div>
                      <div className="bg-zinc-800/60 border border-zinc-700 rounded-lg px-3 py-2 text-center">
                        <div className="text-lg font-bold text-blue-400">{returning}</div>
                        <div className="text-[11px] text-zinc-400">{currentLanguage === 'vi' ? 'Khách cũ' : 'Returning'}</div>
                      </div>
                    </div>
                  );
                })()}
              </CardHeader>
              
              
              <CardContent>
                {/* Bulk Actions Bar */}
                {!showReservationArchive && <div className="flex items-center justify-between mb-4">
                  {!isMultiSelectReservations ? (
                    <Button 
                      size="sm"
                      onClick={() => setIsMultiSelectReservations(true)}
                      className="bg-zinc-700 text-white hover:bg-zinc-600"
                    >
                      {currentLanguage === 'vi' ? 'Chọn nhiều' : 'Select multiple'}
                    </Button>
                  ) : (
                    <div className="flex items-center gap-2 p-2 bg-zinc-800 rounded-lg">
                      <Button 
                        size="sm"
                        onClick={toggleAllReservations}
                        className="bg-zinc-700 text-white hover:bg-zinc-600"
                      >
                        {selectedReservations.size === filteredReservations.length && filteredReservations.length > 0
                          ? (currentLanguage === 'vi' ? 'Bỏ chọn tất cả' : 'Deselect all')
                          : (currentLanguage === 'vi' ? 'Chọn tất cả' : 'Select all')
                        }
                      </Button>
                      <AlertDialog open={showBulkDeleteReservations} onOpenChange={setShowBulkDeleteReservations}>
                        <AlertDialogTrigger asChild>
                          <Button 
                            size="sm"
                            disabled={selectedReservations.size === 0}
                            className={selectedReservations.size > 0 
                              ? "bg-red-600 text-white hover:bg-red-500" 
                              : "bg-zinc-600 text-zinc-400 hover:bg-zinc-500 cursor-not-allowed"
                            }
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </AlertDialogTrigger>
                          <AlertDialogContent className="bg-zinc-900 border-zinc-800">
                            <AlertDialogHeader>
                              <AlertDialogTitle className="text-white">
                                {currentLanguage === 'vi' ? 'Xác nhận xóa hàng loạt' : 'Confirm Bulk Delete'}
                              </AlertDialogTitle>
                              <AlertDialogDescription className="text-zinc-400">
                                {currentLanguage === 'vi' 
                                  ? `Bạn có chắc chắn muốn xóa ${selectedReservations.size} đặt bàn đã chọn? Hành động này không thể hoàn tác.`
                                  : `Are you sure you want to delete ${selectedReservations.size} selected reservations? This action cannot be undone.`
                                }
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel className="bg-zinc-800 text-white border-zinc-700 hover:bg-zinc-700">
                                {currentLanguage === 'vi' ? 'Hủy' : 'Cancel'}
                              </AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => bulkDeleteReservationsMutation.mutate(Array.from(selectedReservations))}
                                className="bg-red-600 hover:bg-red-700 text-white"
                                disabled={bulkDeleteReservationsMutation.isPending}
                              >
                                {bulkDeleteReservationsMutation.isPending 
                                  ? (currentLanguage === 'vi' ? 'Đang xóa...' : 'Deleting...') 
                                  : (currentLanguage === 'vi' ? 'Xóa' : 'Delete')
                                }
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                      </AlertDialog>
                      <AlertDialog open={showBulkArchiveReservations} onOpenChange={setShowBulkArchiveReservations}>
                        <AlertDialogTrigger asChild>
                          <Button 
                            size="sm"
                            disabled={selectedReservations.size === 0}
                            className={selectedReservations.size > 0 
                              ? "bg-blue-600 text-white hover:bg-blue-500" 
                              : "bg-zinc-600 text-zinc-400 hover:bg-zinc-500 cursor-not-allowed"
                            }
                            title={currentLanguage === 'vi' ? 'Lưu trữ' : 'Archive'}
                          >
                            {currentLanguage === 'vi' ? 'Lưu trữ' : 'Archive'}
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="bg-zinc-900 border-zinc-800">
                          <AlertDialogHeader>
                            <AlertDialogTitle className="text-white">
                              {currentLanguage === 'vi' ? 'Xác nhận lưu trữ' : 'Confirm Archive'}
                            </AlertDialogTitle>
                            <AlertDialogDescription className="text-zinc-400">
                              {currentLanguage === 'vi' 
                                ? `Bạn có chắc chắn muốn lưu trữ ${selectedReservations.size} đặt bàn đã chọn? Dữ liệu sẽ được chuyển sang kho lưu trữ.`
                                : `Are you sure you want to archive ${selectedReservations.size} selected reservations? Data will be moved to the archive.`
                              }
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel className="bg-zinc-800 text-white border-zinc-700 hover:bg-zinc-700">
                              {currentLanguage === 'vi' ? 'Hủy' : 'Cancel'}
                            </AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => bulkArchiveReservationsMutation.mutate(Array.from(selectedReservations))}
                              className="bg-blue-600 hover:bg-blue-700 text-white"
                              disabled={bulkArchiveReservationsMutation.isPending}
                            >
                              {bulkArchiveReservationsMutation.isPending 
                                ? (currentLanguage === 'vi' ? 'Đang lưu trữ...' : 'Archiving...') 
                                : (currentLanguage === 'vi' ? 'Lưu trữ' : 'Archive')
                              }
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                      <span className="text-sm text-zinc-400">
                        {selectedReservations.size > 0 
                          ? (currentLanguage === 'vi' ? `Đã chọn ${selectedReservations.size}` : `${selectedReservations.size} selected`)
                          : (currentLanguage === 'vi' ? 'Chưa chọn' : 'None selected')
                        }
                      </span>
                      <Button 
                        size="sm"
                        onClick={() => {
                          setIsMultiSelectReservations(false);
                          setSelectedReservations(new Set());
                        }}
                        className="bg-zinc-700 text-white hover:bg-zinc-600"
                      >
                        {currentLanguage === 'vi' ? 'Hủy' : 'Cancel'}
                      </Button>
                    </div>
                  )}
                </div>}
                
                <div className="space-y-4">
                  {showReservationArchive ? (
                    <>
                      {/* Archive Multi-select Bar */}
                      {archivedReservations.length > 0 && (
                        <div className="flex items-center justify-between mb-2">
                          {!isMultiSelectArchiveReservations ? (
                            <Button size="sm" onClick={() => setIsMultiSelectArchiveReservations(true)} className="bg-zinc-700 text-white hover:bg-zinc-600">
                              {currentLanguage === 'vi' ? 'Chọn nhiều' : 'Select multiple'}
                            </Button>
                          ) : (
                            <div className="flex items-center gap-2 p-2 bg-zinc-800 rounded-lg flex-wrap">
                              <Button size="sm" onClick={toggleAllArchiveReservations} className="bg-zinc-700 text-white hover:bg-zinc-600">
                                {selectedArchiveReservations.size === archivedReservations.length && archivedReservations.length > 0
                                  ? (currentLanguage === 'vi' ? 'Bỏ chọn tất cả' : 'Deselect all')
                                  : (currentLanguage === 'vi' ? 'Chọn tất cả' : 'Select all')
                                }
                              </Button>
                              <AlertDialog open={showBulkRestoreReservations} onOpenChange={setShowBulkRestoreReservations}>
                                <AlertDialogTrigger asChild>
                                  <Button size="sm" disabled={selectedArchiveReservations.size === 0}
                                    className={selectedArchiveReservations.size > 0 ? "bg-zinc-600 text-white hover:bg-zinc-500" : "bg-zinc-700 text-zinc-500 cursor-not-allowed"}>
                                    {currentLanguage === 'vi' ? 'Phục hồi' : 'Restore'}
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent className="bg-zinc-900 border-zinc-800">
                                  <AlertDialogHeader>
                                    <AlertDialogTitle className="text-white">{currentLanguage === 'vi' ? 'Xác nhận phục hồi' : 'Confirm Restore'}</AlertDialogTitle>
                                    <AlertDialogDescription className="text-zinc-400">
                                      {currentLanguage === 'vi' ? `Phục hồi ${selectedArchiveReservations.size} đặt bàn về danh sách hiện tại?` : `Restore ${selectedArchiveReservations.size} reservations to active list?`}
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel className="bg-zinc-800 text-white border-zinc-700 hover:bg-zinc-700">{currentLanguage === 'vi' ? 'Hủy' : 'Cancel'}</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => restoreArchivedReservationsMutation.mutate(Array.from(selectedArchiveReservations))} className="bg-zinc-600 hover:bg-zinc-500 text-white" disabled={restoreArchivedReservationsMutation.isPending}>
                                      {restoreArchivedReservationsMutation.isPending ? (currentLanguage === 'vi' ? 'Đang phục hồi...' : 'Restoring...') : (currentLanguage === 'vi' ? 'Phục hồi' : 'Restore')}
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                              <AlertDialog open={showBulkDeleteArchiveReservations} onOpenChange={setShowBulkDeleteArchiveReservations}>
                                <AlertDialogTrigger asChild>
                                  <Button size="sm" disabled={selectedArchiveReservations.size === 0}
                                    className={selectedArchiveReservations.size > 0 ? "bg-red-600 text-white hover:bg-red-500" : "bg-zinc-600 text-zinc-400 cursor-not-allowed"}>
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent className="bg-zinc-900 border-zinc-800">
                                  <AlertDialogHeader>
                                    <AlertDialogTitle className="text-white">{currentLanguage === 'vi' ? 'Xóa vĩnh viễn' : 'Permanent Delete'}</AlertDialogTitle>
                                    <AlertDialogDescription className="text-zinc-400">
                                      {currentLanguage === 'vi' ? `Xóa vĩnh viễn ${selectedArchiveReservations.size} đặt bàn? Không thể hoàn tác.` : `Permanently delete ${selectedArchiveReservations.size} reservations? Cannot be undone.`}
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel className="bg-zinc-800 text-white border-zinc-700 hover:bg-zinc-700">{currentLanguage === 'vi' ? 'Hủy' : 'Cancel'}</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => bulkDeleteArchivedReservationsMutation.mutate(Array.from(selectedArchiveReservations))} className="bg-red-600 hover:bg-red-700 text-white" disabled={bulkDeleteArchivedReservationsMutation.isPending}>
                                      {bulkDeleteArchivedReservationsMutation.isPending ? (currentLanguage === 'vi' ? 'Đang xóa...' : 'Deleting...') : (currentLanguage === 'vi' ? 'Xóa' : 'Delete')}
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                              <span className="text-sm text-zinc-400">
                                {selectedArchiveReservations.size > 0 ? (currentLanguage === 'vi' ? `Đã chọn ${selectedArchiveReservations.size}` : `${selectedArchiveReservations.size} selected`) : (currentLanguage === 'vi' ? 'Chưa chọn' : 'None selected')}
                              </span>
                              <Button size="sm" onClick={() => { setIsMultiSelectArchiveReservations(false); setSelectedArchiveReservations(new Set()); }} className="bg-zinc-700 text-white hover:bg-zinc-600">
                                {currentLanguage === 'vi' ? 'Hủy' : 'Cancel'}
                              </Button>
                            </div>
                          )}
                        </div>
                      )}
                      {archivedReservations.length === 0 ? (
                        <p className="text-center text-zinc-500 py-8">
                          {currentLanguage === 'vi' ? 'Không có dữ liệu lưu trữ trong tháng này' : 'No archived data for this month'}
                        </p>
                      ) : archivedReservations.map((reservation: any) => (
                        <div key={reservation.id} className={`p-4 border rounded-lg space-y-2 ${selectedArchiveReservations.has(reservation.id) ? 'border-yellow-500 bg-yellow-500/5' : 'border-zinc-700 bg-zinc-800/40'}`}>
                          <div className="flex justify-between items-start">
                            <div className="flex items-start gap-3 flex-1">
                              {isMultiSelectArchiveReservations && (
                                <Checkbox checked={selectedArchiveReservations.has(reservation.id)} onCheckedChange={() => toggleArchiveReservationSelection(reservation.id)} className="border-zinc-600 mt-1" />
                              )}
                              <div>
                                <h3 className="font-semibold text-white">{reservation.name}</h3>
                                <p className="text-sm text-zinc-400">{reservation.email} | {reservation.phone}</p>
                                <p className="text-sm text-zinc-300">{reservation.date} lúc {reservation.time} - {reservation.guests} {t('admin.people')}</p>
                                {reservation.specialRequests && (
                                  <p className="text-sm text-zinc-400 mt-1">{t('admin.requests')}: {reservation.specialRequests}</p>
                                )}
                                <p className="text-xs text-zinc-500 mt-1">
                                  {currentLanguage === 'vi' ? 'Đã lưu trữ lúc:' : 'Archived at:'} {formatDbTimestamp(reservation.archivedAt)}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-1.5">
                              {(phoneCountMap.get(reservation.phone) ?? 0) > 1
                                ? <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-zinc-700 border border-zinc-600 text-zinc-400 font-medium whitespace-nowrap">{currentLanguage === 'vi' ? 'Khách Cũ' : 'Returning'}</span>
                                : <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-zinc-700 border border-zinc-600 text-zinc-400 font-medium whitespace-nowrap">{currentLanguage === 'vi' ? 'Khách Mới' : 'New'}</span>
                              }
                              {getStatusBadge(reservation.status, "reservation")}
                            </div>
                          </div>
                        </div>
                      ))}
                    </>
                  ) : null}
                  {!showReservationArchive && filteredReservations.map((reservation) => (
                    <div
                      key={reservation.id}
                      className={`p-4 border rounded-lg space-y-2 ${selectedReservations.has(reservation.id) ? 'border-yellow-500 bg-yellow-500/5' : 'border-zinc-800'}`}
                      data-testid={`reservation-${reservation.id}`}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex items-start gap-3 flex-1">
                          {isMultiSelectReservations && (
                            <Checkbox 
                              checked={selectedReservations.has(reservation.id)}
                              onCheckedChange={() => toggleReservationSelection(reservation.id)}
                              className="border-zinc-600 mt-1"
                            />
                          )}
                          <div className="flex-1">
                            <h3 className="font-semibold text-white">{reservation.name}</h3>
                            <p className="text-sm text-zinc-400">{reservation.email} | {reservation.phone}</p>
                            <p className="text-sm text-zinc-300">
                              {reservation.date} {t('admin.at')} {reservation.time} - {reservation.guests} {t('admin.people')}
                            </p>
                            <p className="text-sm text-zinc-400 flex items-center gap-2 mt-1">
                              <Clock className="h-3 w-3" />
                              Đặt lúc: {formatDbTimestamp(reservation.createdAt)}
                            </p>
                            {reservation.specialRequests && (
                              <p className="text-sm text-zinc-400 mt-1">
                                {t('admin.requests')}: {reservation.specialRequests}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <div className="flex items-center gap-2">
                            {(phoneCountMap.get(reservation.phone) ?? 0) > 1
                              ? <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-zinc-700 border border-zinc-600 text-zinc-400 font-medium whitespace-nowrap">{currentLanguage === 'vi' ? 'Khách Cũ' : 'Returning'}</span>
                              : <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-zinc-700 border border-zinc-600 text-zinc-400 font-medium whitespace-nowrap">{currentLanguage === 'vi' ? 'Khách Mới' : 'New'}</span>
                            }
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
                  {!showReservationArchive && filteredReservations.length === 0 && reservations.length > 0 && (
                    <p className="text-center text-zinc-500 py-8">
                      {t('admin.noReservationsFound')}
                    </p>
                  )}
                  {!showReservationArchive && reservations.length === 0 && (
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
                <div className="flex flex-col gap-2 mt-4">
                  {/* Row 1: Search + Archive toggle */}
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-zinc-400 h-4 w-4" />
                      <Input
                        placeholder={t('admin.searchOrders')}
                        value={orderSearch}
                        onChange={(e) => setOrderSearch(e.target.value)}
                        className="pl-10 bg-zinc-800 border-zinc-700 text-white placeholder-zinc-400 h-9"
                      />
                    </div>
                    <Button
                      size="sm"
                      onClick={() => setShowOrderArchive(!showOrderArchive)}
                      className="bg-zinc-700 text-white hover:bg-zinc-600 shrink-0"
                    >
                      {showOrderArchive
                        ? (currentLanguage === 'vi' ? 'Xem hiện tại' : 'View Active')
                        : (currentLanguage === 'vi' ? 'Kho lưu trữ' : 'Archive')
                      }
                    </Button>
                  </div>
                  {/* Row 2: Date filter (both active and archive) */}
                  {(() => {
                    const isArchive = showOrderArchive;
                    const dateFrom = isArchive ? orderArchiveDateFrom : orderDateFrom;
                    const dateTo = isArchive ? orderArchiveDateTo : orderDateTo;
                    const setFrom = isArchive ? setOrderArchiveDateFrom : setOrderDateFrom;
                    const setTo = isArchive ? setOrderArchiveDateTo : setOrderDateTo;
                    const activeMonth = isArchive ? getActiveMonthShortcut(dateFrom, dateTo) : '';
                    const archiveShortcutLabels: Record<string, [string, string]> = {
                      last_month: ['Tháng Trước', 'Last Month'],
                      this_month: ['Tháng Này', 'This Month'],
                      '3_months': ['3 Tháng gần Đây', 'Last 3 Months'],
                    };
                    return (
                      <div className="flex items-center gap-2 flex-wrap">
                        <Filter className="w-4 h-4 text-zinc-500 shrink-0" />
                        {isArchive ? (
                          (['last_month', 'this_month', '3_months'] as const).map(key => {
                            const active = activeMonth === key;
                            const [vi, en] = archiveShortcutLabels[key];
                            return (
                              <button key={key} onClick={() => applyArchiveShortcut(key, setFrom, setTo, dateFrom, dateTo)}
                                className={`text-xs px-2.5 py-1.5 rounded border transition-colors ${active ? 'bg-yellow-600/20 border-yellow-600 text-yellow-400' : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:border-zinc-500 hover:text-zinc-200'}`}>
                                {currentLanguage === 'vi' ? vi : en}
                              </button>
                            );
                          })
                        ) : (
                          (['today', 'week', 'month'] as const).map(s => {
                            const active = getActiveShortcut(dateFrom, dateTo) === s;
                            const label = s === 'today' ? (currentLanguage === 'vi' ? 'Hôm nay' : 'Today') : s === 'week' ? (currentLanguage === 'vi' ? 'Tuần này' : 'This week') : (currentLanguage === 'vi' ? 'Tháng này' : 'This month');
                            return (
                              <button key={s} onClick={() => applyDateShortcut(s, setFrom, setTo, dateFrom, dateTo)}
                                className={`text-xs px-2.5 py-1.5 rounded border transition-colors ${active ? 'bg-yellow-600/20 border-yellow-600 text-yellow-400' : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:border-zinc-500 hover:text-zinc-200'}`}>
                                {label}
                              </button>
                            );
                          })
                        )}
                        <span className="text-zinc-600 text-xs">|</span>
                        <input type="date" value={dateFrom} onChange={e => setFrom(e.target.value)}
                          className="h-8 px-2 rounded bg-zinc-800 border border-zinc-700 text-white text-xs focus:outline-none focus:border-zinc-500 w-[120px]" />
                        <span className="text-zinc-500 text-sm">—</span>
                        <input type="date" value={dateTo} onChange={e => setTo(e.target.value)}
                          className="h-8 px-2 rounded bg-zinc-800 border border-zinc-700 text-white text-xs focus:outline-none focus:border-zinc-500 w-[120px]" />
                        {(dateFrom || dateTo) && (
                          <button onClick={() => { setFrom(""); setTo(""); }} className="text-zinc-400 hover:text-white text-xs px-2 py-1 rounded bg-zinc-700 hover:bg-zinc-600">✕</button>
                        )}
                      </div>
                    );
                  })()}
                </div>
                
                {/* Results Count and Warning */}
                <div className="flex justify-between items-center mt-4">
                  <div className="text-sm text-zinc-400">
                    {showOrderArchive
                      ? (currentLanguage === 'vi'
                          ? `Kho lưu trữ: ${archivedOrders.length} / ${archivedOrdersRaw.length} đơn hàng`
                          : `Archive: ${archivedOrders.length} / ${archivedOrdersRaw.length} orders`)
                      : `${t('admin.showing')} ${filteredOrders.length} / ${orders.length} ${t('admin.orders')}`
                    }
                  </div>
                  <div className="text-sm text-zinc-400 bg-zinc-800/50 px-3 py-1 rounded border border-zinc-700">
                    {currentLanguage === 'vi' 
                      ? 'Dữ liệu được lưu trữ theo tháng' 
                      : 'Data is stored monthly'
                    }
                  </div>
                </div>
              </CardHeader>
              
              <CardContent>
                {/* Bulk Actions Bar */}
                {!showOrderArchive && <div className="flex items-center justify-between mb-4">
                  {!isMultiSelectOrders ? (
                    <Button 
                      size="sm"
                      onClick={() => setIsMultiSelectOrders(true)}
                      className="bg-zinc-700 text-white hover:bg-zinc-600"
                    >
                      {currentLanguage === 'vi' ? 'Chọn nhiều' : 'Select multiple'}
                    </Button>
                  ) : (
                    <div className="flex items-center gap-2 p-2 bg-zinc-800 rounded-lg">
                      <Button 
                        size="sm"
                        onClick={toggleAllOrders}
                        className="bg-zinc-700 text-white hover:bg-zinc-600"
                      >
                        {selectedOrders.size === filteredOrders.length && filteredOrders.length > 0
                          ? (currentLanguage === 'vi' ? 'Bỏ chọn tất cả' : 'Deselect all')
                          : (currentLanguage === 'vi' ? 'Chọn tất cả' : 'Select all')
                        }
                      </Button>
                      <AlertDialog open={showBulkDeleteOrders} onOpenChange={setShowBulkDeleteOrders}>
                        <AlertDialogTrigger asChild>
                          <Button 
                            size="sm"
                            disabled={selectedOrders.size === 0}
                            className={selectedOrders.size > 0 
                              ? "bg-red-600 text-white hover:bg-red-500" 
                              : "bg-zinc-600 text-zinc-400 hover:bg-zinc-500 cursor-not-allowed"
                            }
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </AlertDialogTrigger>
                          <AlertDialogContent className="bg-zinc-900 border-zinc-800">
                            <AlertDialogHeader>
                              <AlertDialogTitle className="text-white">
                                {currentLanguage === 'vi' ? 'Xác nhận xóa hàng loạt' : 'Confirm Bulk Delete'}
                              </AlertDialogTitle>
                              <AlertDialogDescription className="text-zinc-400">
                                {currentLanguage === 'vi' 
                                  ? `Bạn có chắc chắn muốn xóa ${selectedOrders.size} đơn hàng đã chọn? Hành động này không thể hoàn tác.`
                                  : `Are you sure you want to delete ${selectedOrders.size} selected orders? This action cannot be undone.`
                                }
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel className="bg-zinc-800 text-white border-zinc-700 hover:bg-zinc-700">
                                {currentLanguage === 'vi' ? 'Hủy' : 'Cancel'}
                              </AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => bulkDeleteOrdersMutation.mutate(Array.from(selectedOrders))}
                                className="bg-red-600 hover:bg-red-700 text-white"
                                disabled={bulkDeleteOrdersMutation.isPending}
                              >
                                {bulkDeleteOrdersMutation.isPending 
                                  ? (currentLanguage === 'vi' ? 'Đang xóa...' : 'Deleting...') 
                                  : (currentLanguage === 'vi' ? 'Xóa' : 'Delete')
                                }
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                      </AlertDialog>
                      <AlertDialog open={showBulkArchiveOrders} onOpenChange={setShowBulkArchiveOrders}>
                        <AlertDialogTrigger asChild>
                          <Button 
                            size="sm"
                            disabled={selectedOrders.size === 0}
                            className={selectedOrders.size > 0 
                              ? "bg-blue-600 text-white hover:bg-blue-500" 
                              : "bg-zinc-600 text-zinc-400 hover:bg-zinc-500 cursor-not-allowed"
                            }
                            title={currentLanguage === 'vi' ? 'Lưu trữ' : 'Archive'}
                          >
                            {currentLanguage === 'vi' ? 'Lưu trữ' : 'Archive'}
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="bg-zinc-900 border-zinc-800">
                          <AlertDialogHeader>
                            <AlertDialogTitle className="text-white">
                              {currentLanguage === 'vi' ? 'Xác nhận lưu trữ' : 'Confirm Archive'}
                            </AlertDialogTitle>
                            <AlertDialogDescription className="text-zinc-400">
                              {currentLanguage === 'vi' 
                                ? `Bạn có chắc chắn muốn lưu trữ ${selectedOrders.size} đơn hàng đã chọn? Dữ liệu sẽ được chuyển sang kho lưu trữ.`
                                : `Are you sure you want to archive ${selectedOrders.size} selected orders? Data will be moved to the archive.`
                              }
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel className="bg-zinc-800 text-white border-zinc-700 hover:bg-zinc-700">
                              {currentLanguage === 'vi' ? 'Hủy' : 'Cancel'}
                            </AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => bulkArchiveOrdersMutation.mutate(Array.from(selectedOrders))}
                              className="bg-blue-600 hover:bg-blue-700 text-white"
                              disabled={bulkArchiveOrdersMutation.isPending}
                            >
                              {bulkArchiveOrdersMutation.isPending 
                                ? (currentLanguage === 'vi' ? 'Đang lưu trữ...' : 'Archiving...') 
                                : (currentLanguage === 'vi' ? 'Lưu trữ' : 'Archive')
                              }
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                      <span className="text-sm text-zinc-400">
                        {selectedOrders.size > 0 
                          ? (currentLanguage === 'vi' ? `Đã chọn ${selectedOrders.size}` : `${selectedOrders.size} selected`)
                          : (currentLanguage === 'vi' ? 'Chưa chọn' : 'None selected')
                        }
                      </span>
                      <Button 
                        size="sm"
                        onClick={() => {
                          setIsMultiSelectOrders(false);
                          setSelectedOrders(new Set());
                        }}
                        className="bg-zinc-700 text-white hover:bg-zinc-600"
                      >
                        {currentLanguage === 'vi' ? 'Hủy' : 'Cancel'}
                      </Button>
                    </div>
                  )}
                </div>}
                
                <div className="space-y-4">
                  {showOrderArchive ? (
                    <>
                      {/* Archive Multi-select Bar */}
                      {archivedOrders.length > 0 && (
                        <div className="flex items-center justify-between mb-2">
                          {!isMultiSelectArchiveOrders ? (
                            <Button size="sm" onClick={() => setIsMultiSelectArchiveOrders(true)} className="bg-zinc-700 text-white hover:bg-zinc-600">
                              {currentLanguage === 'vi' ? 'Chọn nhiều' : 'Select multiple'}
                            </Button>
                          ) : (
                            <div className="flex items-center gap-2 p-2 bg-zinc-800 rounded-lg flex-wrap">
                              <Button size="sm" onClick={toggleAllArchiveOrders} className="bg-zinc-700 text-white hover:bg-zinc-600">
                                {selectedArchiveOrders.size === archivedOrders.length && archivedOrders.length > 0
                                  ? (currentLanguage === 'vi' ? 'Bỏ chọn tất cả' : 'Deselect all')
                                  : (currentLanguage === 'vi' ? 'Chọn tất cả' : 'Select all')
                                }
                              </Button>
                              <AlertDialog open={showBulkRestoreOrders} onOpenChange={setShowBulkRestoreOrders}>
                                <AlertDialogTrigger asChild>
                                  <Button size="sm" disabled={selectedArchiveOrders.size === 0}
                                    className={selectedArchiveOrders.size > 0 ? "bg-zinc-600 text-white hover:bg-zinc-500" : "bg-zinc-700 text-zinc-500 cursor-not-allowed"}>
                                    {currentLanguage === 'vi' ? 'Phục hồi' : 'Restore'}
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent className="bg-zinc-900 border-zinc-800">
                                  <AlertDialogHeader>
                                    <AlertDialogTitle className="text-white">{currentLanguage === 'vi' ? 'Xác nhận phục hồi' : 'Confirm Restore'}</AlertDialogTitle>
                                    <AlertDialogDescription className="text-zinc-400">
                                      {currentLanguage === 'vi' ? `Phục hồi ${selectedArchiveOrders.size} đơn hàng về danh sách hiện tại?` : `Restore ${selectedArchiveOrders.size} orders to active list?`}
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel className="bg-zinc-800 text-white border-zinc-700 hover:bg-zinc-700">{currentLanguage === 'vi' ? 'Hủy' : 'Cancel'}</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => restoreArchivedOrdersMutation.mutate(Array.from(selectedArchiveOrders))} className="bg-zinc-600 hover:bg-zinc-500 text-white" disabled={restoreArchivedOrdersMutation.isPending}>
                                      {restoreArchivedOrdersMutation.isPending ? (currentLanguage === 'vi' ? 'Đang phục hồi...' : 'Restoring...') : (currentLanguage === 'vi' ? 'Phục hồi' : 'Restore')}
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                              <AlertDialog open={showBulkDeleteArchiveOrders} onOpenChange={setShowBulkDeleteArchiveOrders}>
                                <AlertDialogTrigger asChild>
                                  <Button size="sm" disabled={selectedArchiveOrders.size === 0}
                                    className={selectedArchiveOrders.size > 0 ? "bg-red-600 text-white hover:bg-red-500" : "bg-zinc-600 text-zinc-400 cursor-not-allowed"}>
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent className="bg-zinc-900 border-zinc-800">
                                  <AlertDialogHeader>
                                    <AlertDialogTitle className="text-white">{currentLanguage === 'vi' ? 'Xóa vĩnh viễn' : 'Permanent Delete'}</AlertDialogTitle>
                                    <AlertDialogDescription className="text-zinc-400">
                                      {currentLanguage === 'vi' ? `Xóa vĩnh viễn ${selectedArchiveOrders.size} đơn hàng? Không thể hoàn tác.` : `Permanently delete ${selectedArchiveOrders.size} orders? Cannot be undone.`}
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel className="bg-zinc-800 text-white border-zinc-700 hover:bg-zinc-700">{currentLanguage === 'vi' ? 'Hủy' : 'Cancel'}</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => bulkDeleteArchivedOrdersMutation.mutate(Array.from(selectedArchiveOrders))} className="bg-red-600 hover:bg-red-700 text-white" disabled={bulkDeleteArchivedOrdersMutation.isPending}>
                                      {bulkDeleteArchivedOrdersMutation.isPending ? (currentLanguage === 'vi' ? 'Đang xóa...' : 'Deleting...') : (currentLanguage === 'vi' ? 'Xóa' : 'Delete')}
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                              <span className="text-sm text-zinc-400">
                                {selectedArchiveOrders.size > 0 ? (currentLanguage === 'vi' ? `Đã chọn ${selectedArchiveOrders.size}` : `${selectedArchiveOrders.size} selected`) : (currentLanguage === 'vi' ? 'Chưa chọn' : 'None selected')}
                              </span>
                              <Button size="sm" onClick={() => { setIsMultiSelectArchiveOrders(false); setSelectedArchiveOrders(new Set()); }} className="bg-zinc-700 text-white hover:bg-zinc-600">
                                {currentLanguage === 'vi' ? 'Hủy' : 'Cancel'}
                              </Button>
                            </div>
                          )}
                        </div>
                      )}
                      {archivedOrders.length === 0 ? (
                        <p className="text-center text-zinc-500 py-8">
                          {currentLanguage === 'vi' ? 'Không có dữ liệu lưu trữ trong tháng này' : 'No archived data for this month'}
                        </p>
                      ) : archivedOrders.map((order: any) => (
                        <div key={order.id} className={`p-4 border rounded-lg space-y-2 ${selectedArchiveOrders.has(order.id) ? 'border-yellow-500 bg-yellow-500/5' : 'border-zinc-700 bg-zinc-800/40'}`}>
                          <div className="flex justify-between items-start">
                            <div className="flex items-start gap-3 flex-1">
                              {isMultiSelectArchiveOrders && (
                                <Checkbox checked={selectedArchiveOrders.has(order.id)} onCheckedChange={() => toggleArchiveOrderSelection(order.id)} className="border-zinc-600 mt-1" />
                              )}
                              <div>
                                <h3 className="font-semibold text-white">{order.customerName}</h3>
                                <p className="text-sm text-zinc-400">{order.customerEmail} | {order.customerPhone}</p>
                                {order.customerAddress && <p className="text-sm text-zinc-400">Địa chỉ: {order.customerAddress}</p>}
                                <p className="text-sm text-zinc-300">
                                  Loại: {getOrderTypeText(order.orderType)} | Tổng: {formatPrice(order.totalAmount)}
                                </p>
                                <div className="text-sm text-zinc-400 mt-1">
                                  Món: {order.items?.map((item: any) => `${item.name} (x${item.quantity})`).join(", ")}
                                </div>
                                <p className="text-xs text-zinc-500 mt-1">
                                  {currentLanguage === 'vi' ? 'Đã lưu trữ lúc:' : 'Archived at:'} {formatDbTimestamp(order.archivedAt)}
                                </p>
                              </div>
                            </div>
                            {getStatusBadge(order.status, "order")}
                          </div>
                        </div>
                      ))}
                    </>
                  ) : null}
                  {!showOrderArchive && filteredOrders.map((order) => (
                    <div
                      key={order.id}
                      className={`p-4 border rounded-lg space-y-2 ${selectedOrders.has(order.id) ? 'border-yellow-500 bg-yellow-500/5' : 'border-zinc-800'}`}
                      data-testid={`order-${order.id}`}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex items-start gap-3 flex-1">
                          {isMultiSelectOrders && (
                            <Checkbox 
                              checked={selectedOrders.has(order.id)}
                              onCheckedChange={() => toggleOrderSelection(order.id)}
                              className="border-zinc-600 mt-1"
                            />
                          )}
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
                              Đặt lúc: {formatDbTimestamp(order.createdAt)}
                            </p>
                            <div className="text-sm text-zinc-400 mt-1">
                              Món: {order.items.map((item: any) => `${item.name} (x${item.quantity})`).join(", ")}
                            </div>
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
                  {!showOrderArchive && filteredOrders.length === 0 && orders.length > 0 && (
                    <p className="text-center text-zinc-500 py-8">
                      {t('admin.noOrdersFound')}
                    </p>
                  )}
                  {!showOrderArchive && orders.length === 0 && (
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
      
    </div>
  );
}