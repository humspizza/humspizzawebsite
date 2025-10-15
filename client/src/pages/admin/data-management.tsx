import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Calendar, Database, Archive, Clock, AlertTriangle, CheckCircle, Settings, Download, Trash2 } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { formatPrice } from '@/lib/currency';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

export default function DataManagementPage() {
  const { language } = useLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [archivePeriod, setArchivePeriod] = useState('6months');
  const [isArchiveDialogOpen, setIsArchiveDialogOpen] = useState(false);

  // Get data statistics from API
  const { data: stats, isLoading: statsLoading } = useQuery<{
    totalOrders: number;
    oldOrders: number;
    totalReservations: number;
    oldReservations: number;
    estimatedSize: number;
  }>({
    queryKey: ['/api/admin/data-stats'],
  });

  const totalOrders = stats?.totalOrders || 0;
  const oldOrders = stats?.oldOrders || 0;
  const totalReservations = stats?.totalReservations || 0;
  const oldReservations = stats?.oldReservations || 0;
  const estimatedSize = stats?.estimatedSize || 0;

  const archiveDataMutation = useMutation({
    mutationFn: async (period: string) => {
      const response = await apiRequest('POST', '/api/admin/archive-data', { period });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/data-stats'] });
      setIsArchiveDialogOpen(false);
      toast({
        title: language === 'vi' ? 'Lưu trữ thành công' : 'Archive Successful',
        description: language === 'vi' ? 'Dữ liệu cũ đã được chuyển sang kho lưu trữ' : 'Old data has been moved to archive storage',
      });
    },
    onError: () => {
      toast({
        title: language === 'vi' ? 'Lỗi' : 'Error',
        description: language === 'vi' ? 'Không thể lưu trữ dữ liệu' : 'Failed to archive data',
        variant: 'destructive',
      });
    },
  });

  const t = (key: string) => {
    const translations: Record<string, Record<string, string>> = {
      'vi': {
        'data_management': 'Quản Lý Dữ Liệu',
        'overview': 'Tổng Quan Dung Lượng',
        'optimization_strategy': 'Chiến Lược Tối Ưu',
        'archive_system': 'Hệ Thống Lưu Trữ',
        'current_data': 'Dữ Liệu Hiện Tại',
        'total_orders': 'Tổng Đơn Hàng',
        'old_orders': 'Đơn Hàng Cũ (>6 tháng)',
        'very_old_orders': 'Đơn Hàng Rất Cũ (>1 năm)',
        'total_reservations': 'Tổng Đặt Bàn',
        'old_reservations': 'Đặt Bàn Cũ (>6 tháng)',
        'very_old_reservations': 'Đặt Bàn Rất Cũ (>1 năm)',
        'estimated_size': 'Ước Tính Dung Lượng',
        'revenue_archived': 'Doanh Thu Có Thể Lưu Trữ',
        'optimization_recommendations': 'Khuyến Nghị Tối Ưu',
        'archive_old_data': 'Lưu Trữ Dữ Liệu Cũ',
        'automated_archiving': 'Tự Động Lưu Trữ',
        'data_compression': 'Nén Dữ Liệu',
        'performance_indexing': 'Tối Ưu Index',
        '6months': '6 tháng',
        '1year': '1 năm',
        '2years': '2 năm',
        'archive_period': 'Chu Kỳ Lưu Trữ',
        'archive_data': 'Lưu Trữ Dữ Liệu',
        'cancel': 'Hủy',
        'confirm': 'Xác Nhận',
        'archive_description': 'Dữ liệu cũ sẽ được chuyển sang bảng archive riêng biệt, vẫn có thể truy cập khi cần nhưng không ảnh hưởng đến hiệu suất hệ thống.',
        'performance_impact': 'Tác Động Hiệu Suất',
        'low_impact': 'Tác động thấp',
        'medium_impact': 'Tác động trung bình',
        'high_impact': 'Tác động cao',
        'database_optimization': 'Tối Ưu Database',
        'current_strategy': 'Chiến Lược Hiện Tại',
        'permanent_storage': 'Lưu Trữ Vĩnh Viễn',
        'recommended_strategy': 'Chiến Lược Khuyến Nghị',
        'tiered_storage': 'Lưu Trữ Phân Tầng'
      },
      'en': {
        'data_management': 'Data Management',
        'overview': 'Storage Overview',
        'optimization_strategy': 'Optimization Strategy',
        'archive_system': 'Archive System',
        'current_data': 'Current Data',
        'total_orders': 'Total Orders',
        'old_orders': 'Old Orders (>6 months)',
        'very_old_orders': 'Very Old Orders (>1 year)',
        'total_reservations': 'Total Reservations',
        'old_reservations': 'Old Reservations (>6 months)',
        'very_old_reservations': 'Very Old Reservations (>1 year)',
        'estimated_size': 'Estimated Size',
        'revenue_archived': 'Revenue to Archive',
        'optimization_recommendations': 'Optimization Recommendations',
        'archive_old_data': 'Archive Old Data',
        'automated_archiving': 'Automated Archiving',
        'data_compression': 'Data Compression',
        'performance_indexing': 'Performance Indexing',
        '6months': '6 months',
        '1year': '1 year',
        '2years': '2 years',
        'archive_period': 'Archive Period',
        'archive_data': 'Archive Data',
        'cancel': 'Cancel',
        'confirm': 'Confirm',
        'archive_description': 'Old data will be moved to separate archive tables, still accessible when needed but won\'t impact system performance.',
        'performance_impact': 'Performance Impact',
        'low_impact': 'Low impact',
        'medium_impact': 'Medium impact',
        'high_impact': 'High impact',
        'database_optimization': 'Database Optimization',
        'current_strategy': 'Current Strategy',
        'permanent_storage': 'Permanent Storage',
        'recommended_strategy': 'Recommended Strategy',
        'tiered_storage': 'Tiered Storage'
      }
    };
    return translations[language]?.[key] || key;
  };

  const getPerformanceImpact = () => {
    if (estimatedSize < 100) return { level: 'low', color: 'green' };
    if (estimatedSize < 500) return { level: 'medium', color: 'yellow' };
    return { level: 'high', color: 'red' };
  };

  const impact = getPerformanceImpact();

  if (statsLoading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">{t('data_management')}</h1>
            <p className="text-zinc-400">{t('overview')}</p>
          </div>
          <Dialog open={isArchiveDialogOpen} onOpenChange={setIsArchiveDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Archive className="w-4 h-4 mr-2" />
                {t('archive_old_data')}
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-zinc-900 border-zinc-800">
              <DialogHeader>
                <DialogTitle className="text-white">{t('archive_data')}</DialogTitle>
                <DialogDescription className="text-zinc-400">
                  {t('archive_description')}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-white mb-2 block">{t('archive_period')}</label>
                  <Select value={archivePeriod} onValueChange={setArchivePeriod}>
                    <SelectTrigger className="bg-zinc-800 border-zinc-700">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-800 border-zinc-700">
                      <SelectItem value="6months">{t('6months')}</SelectItem>
                      <SelectItem value="1year">{t('1year')}</SelectItem>
                      <SelectItem value="2years">{t('2years')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsArchiveDialogOpen(false)}>
                    {t('cancel')}
                  </Button>
                  <Button 
                    onClick={() => archiveDataMutation.mutate(archivePeriod)}
                    disabled={archiveDataMutation.isPending}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {t('confirm')}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Current Data Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center text-sm font-medium">
                <Database className="w-4 h-4 mr-2 text-blue-500" />
                {t('total_orders')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalOrders.toLocaleString()}</div>
              <div className="text-sm text-zinc-400">
                {oldOrders} {t('old_orders').toLowerCase()}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center text-sm font-medium">
                <Calendar className="w-4 h-4 mr-2 text-green-500" />
                {t('total_reservations')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalReservations.toLocaleString()}</div>
              <div className="text-sm text-zinc-400">
                {oldReservations} {t('old_reservations').toLowerCase()}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center text-sm font-medium">
                <Settings className="w-4 h-4 mr-2 text-purple-500" />
                {t('estimated_size')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{estimatedSize.toFixed(1)} MB</div>
              <Badge className={`bg-${impact.color}-500/10 text-${impact.color}-600 border-${impact.color}-600`}>
                {t(`${impact.level}_impact`)}
              </Badge>
            </CardContent>
          </Card>

          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center text-sm font-medium">
                <Archive className="w-4 h-4 mr-2 text-orange-500" />
                Archive Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {oldOrders > 0 || oldReservations > 0 ? 'Ready' : 'Current'}
              </div>
              <div className="text-sm text-zinc-400">
                {oldOrders > 0 || oldReservations > 0 
                  ? (language === 'vi' ? 'Sẵn sàng lưu trữ' : 'Ready to archive')
                  : (language === 'vi' ? 'Dữ liệu hiện tại' : 'Current data')
                }
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Strategy Comparison */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Current Strategy */}
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader>
              <CardTitle className="flex items-center">
                <AlertTriangle className="w-5 h-5 mr-2 text-yellow-500" />
                {t('current_strategy')}
              </CardTitle>
              <CardDescription>{t('permanent_storage')}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-zinc-400">Lưu trữ vĩnh viễn</span>
                  <Badge className="bg-red-500/10 text-red-600 border-red-600">
                    Không tối ưu
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-zinc-400">Hiệu suất database</span>
                  <Badge className={`bg-${impact.color}-500/10 text-${impact.color}-600 border-${impact.color}-600`}>
                    {t(`${impact.level}_impact`)}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-zinc-400">Chi phí lưu trữ</span>
                  <Badge className="bg-orange-500/10 text-orange-600 border-orange-600">
                    Tăng theo thời gian
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-zinc-400">Backup time</span>
                  <Badge className="bg-red-500/10 text-red-600 border-red-600">
                    Chậm dần
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recommended Strategy */}
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader>
              <CardTitle className="flex items-center">
                <CheckCircle className="w-5 h-5 mr-2 text-green-500" />
                {t('recommended_strategy')}
              </CardTitle>
              <CardDescription>{t('tiered_storage')}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-zinc-400">Active data (6 tháng gần)</span>
                  <Badge className="bg-green-500/10 text-green-600 border-green-600">
                    Main DB
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-zinc-400">Historical data ({'>'}6 tháng)</span>
                  <Badge className="bg-blue-500/10 text-blue-600 border-blue-600">
                    Archive DB
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-zinc-400">Hiệu suất</span>
                  <Badge className="bg-green-500/10 text-green-600 border-green-600">
                    Cao
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-zinc-400">Truy cập archive</span>
                  <Badge className="bg-blue-500/10 text-blue-600 border-blue-600">
                    On-demand
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Optimization Recommendations */}
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Settings className="w-5 h-5 mr-2" />
              {t('optimization_recommendations')}
            </CardTitle>
            <CardDescription>
              Các bước tối ưu hóa để cải thiện hiệu suất hệ thống
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-6 rounded-lg bg-zinc-800/50">
                <Archive className="text-blue-500 text-3xl mx-auto mb-3" />
                <h3 className="font-semibold mb-2">{t('automated_archiving')}</h3>
                <p className="text-sm text-zinc-400 mb-4">
                  Tự động chuyển đơn hàng & đặt bàn cũ hơn 6 tháng sang archive
                </p>
                <Badge className="bg-blue-500/10 text-blue-600 border-blue-600">
                  Khuyến nghị
                </Badge>
              </div>
              
              <div className="text-center p-6 rounded-lg bg-zinc-800/50">
                <Database className="text-green-500 text-3xl mx-auto mb-3" />
                <h3 className="font-semibold mb-2">{t('performance_indexing')}</h3>
                <p className="text-sm text-zinc-400 mb-4">
                  Tối ưu indexes cho createdAt, status, customerPhone
                </p>
                <Badge className="bg-green-500/10 text-green-600 border-green-600">
                  Triển khai
                </Badge>
              </div>
              
              <div className="text-center p-6 rounded-lg bg-zinc-800/50">
                <Clock className="text-purple-500 text-3xl mx-auto mb-3" />
                <h3 className="font-semibold mb-2">{t('data_compression')}</h3>
                <p className="text-sm text-zinc-400 mb-4">
                  Nén dữ liệu archive và tối ưu format lưu trữ
                </p>
                <Badge className="bg-purple-500/10 text-purple-600 border-purple-600">
                  Tương lai
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}