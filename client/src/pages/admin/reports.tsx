import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, TrendingUp, TrendingDown, DollarSign, Users, Package, Clock, BarChart3, Download } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { formatPrice } from '@/lib/currency';
import { useState } from 'react';

export default function ReportsPage() {
  const { language } = useLanguage();
  const [dateRange, setDateRange] = useState('month');
  
  // Get orders data
  const { data: orders = [], isLoading: ordersLoading } = useQuery({
    queryKey: ['/api/orders'],
  });

  // Get reservations data
  const { data: reservations = [], isLoading: reservationsLoading } = useQuery({
    queryKey: ['/api/reservations'],
  });

  const currentDate = new Date();
  const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

  // Filter data based on date range
  const getDateRange = () => {
    const now = new Date();
    switch (dateRange) {
      case 'today':
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        return { start: startOfDay, end: now };
      case 'week':
        const startOfWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        return { start: startOfWeek, end: now };
      case 'month':
        return { start: startOfMonth, end: endOfMonth };
      case 'quarter':
        const startOfQuarter = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
        return { start: startOfQuarter, end: now };
      default:
        return { start: startOfMonth, end: endOfMonth };
    }
  };

  const { start, end } = getDateRange();

  const filteredOrders = orders.filter(order => {
    const orderDate = new Date(order.createdAt);
    return orderDate >= start && orderDate <= end;
  });

  const filteredReservations = reservations.filter(reservation => {
    const reservationDate = new Date(reservation.createdAt);
    return reservationDate >= start && reservationDate <= end;
  });

  // Calculate metrics
  const totalRevenue = filteredOrders.reduce((sum, order) => {
    if (order.status === 'completed') {
      return sum + parseFloat(order.totalAmount);
    }
    return sum;
  }, 0);

  const totalOrders = filteredOrders.length;
  const completedOrders = filteredOrders.filter(order => order.status === 'completed').length;
  const cancelledOrders = filteredOrders.filter(order => order.status === 'cancelled').length;
  const pendingOrders = filteredOrders.filter(order => order.status === 'pending').length;

  const totalReservations = filteredReservations.length;
  const confirmedReservations = filteredReservations.filter(res => res.status === 'confirmed').length;
  const cancelledReservations = filteredReservations.filter(res => res.status === 'cancelled').length;
  const pendingReservations = filteredReservations.filter(res => res.status === 'pending').length;

  const averageOrderValue = completedOrders > 0 ? totalRevenue / completedOrders : 0;

  const t = (key: string) => {
    const translations: Record<string, Record<string, string>> = {
      'vi': {
        'reports': 'Báo Cáo',
        'overview': 'Tổng Quan Báo Cáo',
        'data_period': 'Khoảng Thời Gian Dữ Liệu',
        'today': 'Hôm Nay',
        'week': 'Tuần Này',
        'month': 'Tháng Này',
        'quarter': 'Quý Này',
        'total_revenue': 'Tổng Doanh Thu',
        'total_orders': 'Tổng Đơn Hàng',
        'avg_order_value': 'Giá Trị Đơn Hàng TB',
        'completed_orders': 'Đơn Hoàn Thành',
        'cancelled_orders': 'Đơn Đã Hủy',
        'pending_orders': 'Đơn Chờ Xử Lý',
        'total_reservations': 'Tổng Đặt Bàn',
        'confirmed_reservations': 'Đặt Bàn Đã Xác Nhận',
        'cancelled_reservations': 'Đặt Bàn Đã Hủy',
        'pending_reservations': 'Đặt Bàn Chờ Xác Nhận',
        'order_analytics': 'Phân Tích Đơn Hàng',
        'reservation_analytics': 'Phân Tích Đặt Bàn',
        'data_retention': 'Chính Sách Lưu Trữ Dữ Liệu',
        'monthly_reset': 'Dữ liệu được lưu trữ vĩnh viễn trong PostgreSQL',
        'no_reset': 'Không có chu kỳ reset hàng tháng',
        'backup_policy': 'Sao lưu tự động hàng ngày',
        'export_data': 'Xuất Dữ Liệu'
      },
      'en': {
        'reports': 'Reports',
        'overview': 'Reports Overview',
        'data_period': 'Data Period',
        'today': 'Today',
        'week': 'This Week',
        'month': 'This Month',
        'quarter': 'This Quarter',
        'total_revenue': 'Total Revenue',
        'total_orders': 'Total Orders',
        'avg_order_value': 'Avg Order Value',
        'completed_orders': 'Completed Orders',
        'cancelled_orders': 'Cancelled Orders',
        'pending_orders': 'Pending Orders',
        'total_reservations': 'Total Reservations',
        'confirmed_reservations': 'Confirmed Reservations',
        'cancelled_reservations': 'Cancelled Reservations',
        'pending_reservations': 'Pending Reservations',
        'order_analytics': 'Order Analytics',
        'reservation_analytics': 'Reservation Analytics',
        'data_retention': 'Data Retention Policy',
        'monthly_reset': 'Data is permanently stored in PostgreSQL',
        'no_reset': 'No monthly reset cycles',
        'backup_policy': 'Automated daily backups',
        'export_data': 'Export Data'
      }
    };
    return translations[language]?.[key] || key;
  };

  if (ordersLoading || reservationsLoading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">{t('reports')}</h1>
            <p className="text-zinc-400">{t('overview')}</p>
          </div>
          <div className="flex gap-4">
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="w-40 bg-zinc-800 border-zinc-700">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-zinc-800 border-zinc-700">
                <SelectItem value="today">{t('today')}</SelectItem>
                <SelectItem value="week">{t('week')}</SelectItem>
                <SelectItem value="month">{t('month')}</SelectItem>
                <SelectItem value="quarter">{t('quarter')}</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" className="border-zinc-700 text-white hover:bg-zinc-800">
              <Download className="w-4 h-4 mr-2" />
              {t('export_data')}
            </Button>
          </div>
        </div>

        {/* Revenue & Orders Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center text-sm font-medium">
                <DollarSign className="w-4 h-4 mr-2 text-green-500" />
                {t('total_revenue')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatPrice(totalRevenue)}</div>
            </CardContent>
          </Card>

          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center text-sm font-medium">
                <Package className="w-4 h-4 mr-2 text-blue-500" />
                {t('total_orders')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalOrders}</div>
            </CardContent>
          </Card>

          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center text-sm font-medium">
                <BarChart3 className="w-4 h-4 mr-2 text-purple-500" />
                {t('avg_order_value')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatPrice(averageOrderValue)}</div>
            </CardContent>
          </Card>

          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center text-sm font-medium">
                <Users className="w-4 h-4 mr-2 text-orange-500" />
                {t('total_reservations')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalReservations}</div>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Analytics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Order Analytics */}
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Package className="w-5 h-5 mr-2" />
                {t('order_analytics')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-zinc-400">{t('completed_orders')}</span>
                  <div className="flex items-center gap-2">
                    <Badge className="bg-green-500/10 text-green-600 border-green-600">
                      {completedOrders}
                    </Badge>
                    <span className="text-sm text-zinc-400">
                      {totalOrders > 0 ? Math.round((completedOrders / totalOrders) * 100) : 0}%
                    </span>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-zinc-400">{t('pending_orders')}</span>
                  <div className="flex items-center gap-2">
                    <Badge className="bg-yellow-500/10 text-yellow-600 border-yellow-600">
                      {pendingOrders}
                    </Badge>
                    <span className="text-sm text-zinc-400">
                      {totalOrders > 0 ? Math.round((pendingOrders / totalOrders) * 100) : 0}%
                    </span>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-zinc-400">{t('cancelled_orders')}</span>
                  <div className="flex items-center gap-2">
                    <Badge className="bg-red-500/10 text-red-600 border-red-600">
                      {cancelledOrders}
                    </Badge>
                    <span className="text-sm text-zinc-400">
                      {totalOrders > 0 ? Math.round((cancelledOrders / totalOrders) * 100) : 0}%
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Reservation Analytics */}
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Calendar className="w-5 h-5 mr-2" />
                {t('reservation_analytics')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-zinc-400">{t('confirmed_reservations')}</span>
                  <div className="flex items-center gap-2">
                    <Badge className="bg-green-500/10 text-green-600 border-green-600">
                      {confirmedReservations}
                    </Badge>
                    <span className="text-sm text-zinc-400">
                      {totalReservations > 0 ? Math.round((confirmedReservations / totalReservations) * 100) : 0}%
                    </span>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-zinc-400">{t('pending_reservations')}</span>
                  <div className="flex items-center gap-2">
                    <Badge className="bg-yellow-500/10 text-yellow-600 border-yellow-600">
                      {pendingReservations}
                    </Badge>
                    <span className="text-sm text-zinc-400">
                      {totalReservations > 0 ? Math.round((pendingReservations / totalReservations) * 100) : 0}%
                    </span>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-zinc-400">{t('cancelled_reservations')}</span>
                  <div className="flex items-center gap-2">
                    <Badge className="bg-red-500/10 text-red-600 border-red-600">
                      {cancelledReservations}
                    </Badge>
                    <span className="text-sm text-zinc-400">
                      {totalReservations > 0 ? Math.round((cancelledReservations / totalReservations) * 100) : 0}%
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Data Retention Policy */}
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Clock className="w-5 h-5 mr-2" />
              {t('data_retention')}
            </CardTitle>
            <CardDescription>
              Thông tin về cách hệ thống lưu trữ và quản lý dữ liệu
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-6 rounded-lg bg-zinc-800/50">
                <div className="text-green-500 text-2xl font-bold mb-2">∞</div>
                <h3 className="font-semibold mb-1">{t('monthly_reset')}</h3>
                <p className="text-sm text-zinc-400">Dữ liệu được lưu vĩnh viễn trong PostgreSQL database</p>
              </div>
              <div className="text-center p-6 rounded-lg bg-zinc-800/50">
                <div className="text-blue-500 text-2xl font-bold mb-2">0</div>
                <h3 className="font-semibold mb-1">{t('no_reset')}</h3>
                <p className="text-sm text-zinc-400">Hệ thống không tự động xóa dữ liệu</p>
              </div>
              <div className="text-center p-6 rounded-lg bg-zinc-800/50">
                <div className="text-purple-500 text-2xl font-bold mb-2">24h</div>
                <h3 className="font-semibold mb-1">{t('backup_policy')}</h3>
                <p className="text-sm text-zinc-400">Sao lưu dữ liệu tự động hàng ngày</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}