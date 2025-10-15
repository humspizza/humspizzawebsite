import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Search, Filter } from "lucide-react";
import { formatPrice } from "@/lib/currency";
import { useLanguage } from "@/contexts/LanguageContext";

export default function StaffMenuManagement() {
  const { toast } = useToast();
  const { language: currentLanguage } = useLanguage();
  const [searchTerm, setSearchTerm] = useState("");
  const [availabilityFilter, setAvailabilityFilter] = useState("all");

  // Get all menu items including unavailable ones for staff management
  const { data: menuItemsData = [], isLoading } = useQuery({
    queryKey: ['/api/menu-items', 'includeUnavailable'],
    queryFn: () => fetch('/api/menu-items?includeUnavailable=true').then(res => res.json()),
  });

  const updateAvailabilityMutation = useMutation({
    mutationFn: async ({ id, isAvailable }: { id: string; isAvailable: boolean }) => {
      const response = await apiRequest('PATCH', `/api/menu-items/${id}`, { isAvailable });
      return response.json();
    },
    onSuccess: () => {
      // Invalidate ALL menu queries to sync everywhere
      queryClient.invalidateQueries({ 
        predicate: (query) => {
          const queryKey = query.queryKey;
          return Array.isArray(queryKey) && queryKey[0] === '/api/menu-items';
        }
      });
      toast({
        title: currentLanguage === 'vi' ? 'Thành công' : 'Success',
        description: currentLanguage === 'vi' ? 'Trạng thái món ăn đã được cập nhật' : 'Menu item availability updated',
      });
    },
    onError: () => {
      toast({
        title: currentLanguage === 'vi' ? 'Lỗi' : 'Error',
        description: currentLanguage === 'vi' ? 'Không thể cập nhật trạng thái món ăn' : 'Failed to update menu item availability',
        variant: 'destructive',
      });
    },
  });

  // Filter menu items
  const filteredMenuItems = menuItemsData.filter((row: any) => {
    const item = row.menu_items || row;
    const category = row.category || item.category;
    
    // Search filter
    const searchTermLower = searchTerm.toLowerCase();
    const matchesSearch = !searchTerm || 
      (item.name?.toLowerCase().includes(searchTermLower)) ||
      (item.nameVi?.toLowerCase().includes(searchTermLower)) ||
      (category?.name?.toLowerCase().includes(searchTermLower)) ||
      (category?.nameVi?.toLowerCase().includes(searchTermLower));
    
    // Availability filter
    const matchesAvailability = availabilityFilter === "all" || 
      (availabilityFilter === "available" && item.isAvailable) ||
      (availabilityFilter === "unavailable" && !item.isAvailable);
    
    return matchesSearch && matchesAvailability;
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white">
            {currentLanguage === 'vi' ? 'Quản Lý Trạng Thái Món Ăn' : 'Menu Item Status Management'}
          </h1>
          <p className="text-zinc-400 mt-1">
            {currentLanguage === 'vi' ? 'Cập nhật trạng thái còn hàng / hết hàng của các món ăn' : 'Update availability status of menu items'}
          </p>
        </div>
      </div>

      {/* Search and Filter Controls */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-zinc-400 h-4 w-4" />
              <Input
                placeholder={currentLanguage === 'vi' ? 'Tìm kiếm món ăn...' : 'Search menu items...'}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-zinc-800 border-zinc-700 text-white placeholder-zinc-400"
                data-testid="input-search-menu"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-zinc-400" />
              <Select value={availabilityFilter} onValueChange={setAvailabilityFilter}>
                <SelectTrigger className="w-[180px] bg-zinc-800 border-zinc-700 text-white">
                  <SelectValue placeholder={currentLanguage === 'vi' ? 'Trạng thái' : 'Status'} />
                </SelectTrigger>
                <SelectContent className="bg-zinc-800 border-zinc-700">
                  <SelectItem value="all">{currentLanguage === 'vi' ? 'Tất cả' : 'All items'}</SelectItem>
                  <SelectItem value="available">{currentLanguage === 'vi' ? 'Còn hàng' : 'Available'}</SelectItem>
                  <SelectItem value="unavailable">{currentLanguage === 'vi' ? 'Hết hàng' : 'Unavailable'}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Menu Items Count */}
      <div className="text-sm text-zinc-400">
        {currentLanguage === 'vi' ? 'Hiển thị' : 'Showing'} {filteredMenuItems.length} / {menuItemsData.length} {currentLanguage === 'vi' ? 'món ăn' : 'menu items'}
      </div>

      {/* Menu Items List */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin w-8 h-8 border-4 border-yellow-600 border-t-transparent rounded-full" />
        </div>
      ) : (
        <div className="space-y-4">
          {filteredMenuItems.map((row: any) => {
            const item = row.menu_items || row;
            const category = row.category || item.category;
            
            return (
              <Card 
                key={item.id} 
                className={`transition-all ${
                  item.isAvailable 
                    ? 'bg-zinc-900 border-zinc-800' 
                    : 'bg-zinc-900/50 border-red-800/30'
                }`}
                data-testid={`menu-item-${item.id}`}
              >
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className={`font-medium text-lg ${item.isAvailable ? 'text-white' : 'text-zinc-400'}`}>
                        {currentLanguage === 'vi' ? (item.nameVi || item.name) : (item.name || item.nameVi)}
                        {!item.isAvailable && (
                          <span className="ml-3 px-3 py-1 text-sm bg-red-500/20 text-red-400 rounded-full border border-red-500/30">
                            {currentLanguage === 'vi' ? 'Hết hàng' : 'Sold Out'}
                          </span>
                        )}
                      </div>
                      
                      <div className={`text-sm mt-1 ${item.isAvailable ? 'text-zinc-400' : 'text-zinc-500'}`}>
                        {formatPrice(item.price)} • {currentLanguage === 'vi' ? (category?.nameVi || category?.name || 'Không có danh mục') : (category?.name || category?.nameVi || 'No category')}
                      </div>
                      
                      {item.description && (
                        <div className={`text-sm mt-2 ${item.isAvailable ? 'text-zinc-500' : 'text-zinc-600'}`}>
                          {currentLanguage === 'vi' ? (item.descriptionVi || item.description) : (item.description || item.descriptionVi)}
                        </div>
                      )}
                      
                      {item.tags && item.tags.length > 0 && (
                        <div className="flex gap-2 mt-3">
                          {item.tags.map((tag: string, index: number) => (
                            <Badge 
                              key={index} 
                              variant="secondary" 
                              className={`text-xs ${
                                item.isAvailable 
                                  ? 'bg-zinc-700 text-zinc-300' 
                                  : 'bg-zinc-800 text-zinc-500'
                              }`}
                            >
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-3 ml-6">
                      {/* Availability Toggle Switch */}
                      <div className="flex items-center gap-4">
                        <span className={`text-sm font-medium ${item.isAvailable ? 'text-green-400' : 'text-red-400'}`}>
                          {item.isAvailable ? (currentLanguage === 'vi' ? 'Còn hàng' : 'Available') : (currentLanguage === 'vi' ? 'Hết hàng' : 'Sold Out')}
                        </span>
                        <button
                          onClick={() => {
                            updateAvailabilityMutation.mutate({
                              id: item.id,
                              isAvailable: !item.isAvailable
                            });
                          }}
                          disabled={updateAvailabilityMutation.isPending}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-zinc-900 ${
                            item.isAvailable 
                              ? 'bg-green-500 focus:ring-green-500' 
                              : 'bg-zinc-600 focus:ring-zinc-500'
                          }`}
                          data-testid={`toggle-availability-${item.id}`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              item.isAvailable ? 'translate-x-6' : 'translate-x-1'
                            }`}
                          />
                        </button>
                      </div>
                      
                      {updateAvailabilityMutation.isPending && (
                        <div className="animate-spin w-5 h-5 border-2 border-yellow-500 border-t-transparent rounded-full" />
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
          
          {filteredMenuItems.length === 0 && menuItemsData.length > 0 && (
            <div className="text-center py-12">
              <div className="text-zinc-400 text-lg">
                {currentLanguage === 'vi' ? 'Không tìm thấy món ăn phù hợp' : 'No matching menu items found'}
              </div>
              <div className="text-zinc-500 text-sm mt-1">
                {currentLanguage === 'vi' ? 'Thử thay đổi từ khóa tìm kiếm hoặc bộ lọc' : 'Try adjusting your search or filter criteria'}
              </div>
            </div>
          )}
          
          {menuItemsData.length === 0 && (
            <div className="text-center py-12">
              <div className="text-zinc-400 text-lg">
                {currentLanguage === 'vi' ? 'Không có món ăn nào' : 'No menu items found'}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}