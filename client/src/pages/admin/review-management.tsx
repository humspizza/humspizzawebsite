import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Search, Plus, Edit, Trash2, Star, StarOff } from "lucide-react";
import type { CustomerReview } from "@shared/schema";

const reviewSchema = z.object({
  customerName: z.string().min(1, "Tên khách hàng là bắt buộc"),
  customerNameVi: z.string().optional(),
  customerTitle: z.string().min(1, "Chức danh là bắt buộc"),
  customerTitleVi: z.string().optional(),
  rating: z.number().min(1).max(5),
  review: z.string().min(1, "Nội dung đánh giá là bắt buộc"),
  reviewVi: z.string().optional(),
  avatarUrl: z.string().optional(),
  isPublished: z.boolean().default(false),
  displayOrder: z.number().default(0),
});

type ReviewFormData = z.infer<typeof reviewSchema>;

export default function ReviewManagement() {
  const { toast } = useToast();
  const { language } = useLanguage();
  const [editingReview, setEditingReview] = useState<CustomerReview | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const { data: reviews = [] } = useQuery<CustomerReview[]>({
    queryKey: ["/api/customer-reviews"],
  });

  const form = useForm<ReviewFormData>({
    resolver: zodResolver(reviewSchema),
    defaultValues: {
      customerName: "",
      customerNameVi: "",
      customerTitle: "Khách hàng",
      customerTitleVi: "",
      rating: 5,
      review: "",
      reviewVi: "",
      avatarUrl: "",
      isPublished: false,
      displayOrder: 0,
    },
  });

  const createReviewMutation = useMutation({
    mutationFn: async (data: ReviewFormData) => {
      // Check if already have 12 reviews
      if (reviews.length >= 12) {
        throw new Error("Chỉ được phép có tối đa 12 đánh giá. Vui lòng xóa đánh giá cũ trước khi thêm mới.");
      }
      const response = await apiRequest("POST", "/api/customer-reviews", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/customer-reviews"] });
      queryClient.invalidateQueries({ queryKey: ["/api/customer-reviews/published"] });
      setIsDialogOpen(false);
      form.reset();
      toast({
        title: "Thành công",
        description: "Đánh giá đã được tạo",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Lỗi",
        description: error.message || "Không thể tạo đánh giá",
        variant: "destructive",
      });
    },
  });

  const updateReviewMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<ReviewFormData> }) => {
      const response = await apiRequest("PATCH", `/api/customer-reviews/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/customer-reviews"] });
      queryClient.invalidateQueries({ queryKey: ["/api/customer-reviews/published"] });
      setIsDialogOpen(false);
      setEditingReview(null);
      form.reset();
      toast({
        title: "Thành công",
        description: "Đánh giá đã được cập nhật",
      });
    },
    onError: () => {
      toast({
        title: "Lỗi",
        description: "Không thể cập nhật đánh giá",
        variant: "destructive",
      });
    },
  });

  const deleteReviewMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest("DELETE", `/api/customer-reviews/${id}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/customer-reviews"] });
      queryClient.invalidateQueries({ queryKey: ["/api/customer-reviews/published"] });
      toast({
        title: "Thành công",
        description: "Đánh giá đã được xóa",
      });
    },
    onError: () => {
      toast({
        title: "Lỗi",
        description: "Không thể xóa đánh giá",
        variant: "destructive",
      });
    },
  });

  const togglePinMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest("PATCH", `/api/customer-reviews/${id}/pin`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/customer-reviews"] });
      queryClient.invalidateQueries({ queryKey: ["/api/customer-reviews/published"] });
      toast({
        title: "Thành công",
        description: "Trạng thái ghim đã được cập nhật",
      });
    },
    onError: () => {
      toast({
        title: "Lỗi",
        description: "Không thể cập nhật trạng thái ghim",
        variant: "destructive",
      });
    },
  });

  const togglePublishMutation = useMutation({
    mutationFn: async ({ id, isPublished }: { id: string; isPublished: boolean }) => {
      const response = await apiRequest("PATCH", `/api/customer-reviews/${id}`, { isPublished });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/customer-reviews"] });
      queryClient.invalidateQueries({ queryKey: ["/api/customer-reviews/published"] });
      toast({
        title: "Thành công",
        description: "Trạng thái xuất bản đã được cập nhật",
      });
    },
    onError: () => {
      toast({
        title: "Lỗi",
        description: "Không thể cập nhật trạng thái xuất bản",
        variant: "destructive",
      });
    },
  });

  const filteredReviews = reviews.filter(review =>
    review.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    review.review.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (review.customerNameVi && review.customerNameVi.toLowerCase().includes(searchTerm.toLowerCase()))
  ).sort((a, b) => {
    // Sort pinned reviews first
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  const onSubmit = (data: ReviewFormData) => {
    if (editingReview) {
      updateReviewMutation.mutate({ id: editingReview.id, data });
    } else {
      // Tự động xuất bản và sắp xếp thứ tự nếu không điền
      let autoDisplayOrder = data.displayOrder;
      if (!autoDisplayOrder) {
        // Tìm số thứ tự còn thiếu từ 1-8
        const usedOrders = reviews.map(r => r.displayOrder || 0).filter(order => order >= 1 && order <= 8);
        for (let i = 1; i <= 8; i++) {
          if (!usedOrders.includes(i)) {
            autoDisplayOrder = i;
            break;
          }
        }
        // Nếu 1-8 đã đầy, dùng số cao hơn
        if (!autoDisplayOrder) {
          autoDisplayOrder = Math.max(0, ...reviews.map(r => r.displayOrder || 0)) + 1;
        }
      }
      
      const reviewData = {
        ...data,
        isPublished: true,
        displayOrder: autoDisplayOrder
      };
      createReviewMutation.mutate(reviewData);
    }
  };

  const openEditDialog = (review: CustomerReview) => {
    setEditingReview(review);
    form.reset({
      customerName: review.customerName,
      customerNameVi: review.customerNameVi || "",
      customerTitle: review.customerTitle,
      customerTitleVi: review.customerTitleVi || "",
      rating: review.rating,
      review: review.review,
      reviewVi: review.reviewVi || "",
      avatarUrl: review.avatarUrl || "",
      isPublished: review.isPublished,
      displayOrder: review.displayOrder || 0,
    });
    setIsDialogOpen(true);
  };

  const openCreateDialog = () => {
    setEditingReview(null);
    form.reset();
    setIsDialogOpen(true);
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${i < rating ? 'text-yellow-400 fill-current' : 'text-zinc-600'}`}
      />
    ));
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white">
            {language === 'vi' ? 'Đánh Giá Khách Hàng' : 'Customer Reviews Management'}
          </h1>
          <p className="text-gray-400 mt-1">
            {language === 'vi' ? 'Quản lý và kiểm duyệt đánh giá và phản hồi của khách hàng' : 'Manage and moderate customer reviews and feedback'}
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button 
              onClick={openCreateDialog} 
              className="bg-yellow-600 hover:bg-yellow-700 text-black"
              disabled={reviews.length >= 8}
            >
              <Plus className="w-4 h-4 mr-2" />
              {language === 'vi' 
                ? `Thêm Đánh Giá ${reviews.length >= 8 ? "(Tối đa 8)" : ""}` 
                : `Add Review ${reviews.length >= 8 ? "(Max 8)" : ""}`
              }
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-zinc-900 border-zinc-800 text-white max-w-[95vw] sm:max-w-2xl max-h-[95vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-lg sm:text-xl">{editingReview ? "Chỉnh Sửa Đánh Giá" : "Thêm Đánh Giá Mới"}</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="customerName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tên Khách Hàng (EN)</FormLabel>
                        <FormControl>
                          <Input {...field} className="bg-zinc-800 border-zinc-700" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="customerNameVi"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tên Khách Hàng (VI)</FormLabel>
                        <FormControl>
                          <Input {...field} className="bg-zinc-800 border-zinc-700" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="customerTitle"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Chức Danh (EN)</FormLabel>
                        <FormControl>
                          <Input {...field} className="bg-zinc-800 border-zinc-700" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="customerTitleVi"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Chức Danh (VI)</FormLabel>
                        <FormControl>
                          <Input {...field} className="bg-zinc-800 border-zinc-700" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="rating"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Đánh Giá (1-5 sao)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            min="1" 
                            max="5" 
                            {...field} 
                            onChange={(e) => field.onChange(parseInt(e.target.value))}
                            className="bg-zinc-800 border-zinc-700" 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="avatarUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Avatar</FormLabel>
                        <FormControl>
                          <div className="space-y-3">
                            <Input
                              type="file"
                              accept="image/*"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  // Check file size (max 10MB)
                                  if (file.size > 10 * 1024 * 1024) {
                                    toast({
                                      title: "Lỗi",
                                      description: "File ảnh quá lớn. Vui lòng chọn file nhỏ hơn 10MB.",
                                      variant: "destructive",
                                    });
                                    return;
                                  }
                                  
                                  // Recommend image size
                                  const img = new Image();
                                  img.onload = function() {
                                    if (this.width !== 300 || this.height !== 300) {
                                      toast({
                                        title: "Thông báo",
                                        description: `Kích thước ảnh hiện tại: ${this.width}x${this.height}px. Khuyến nghị: 300x300px (1:1) để hiển thị tốt nhất.`,
                                        variant: "default",
                                      });
                                    }
                                  };
                                  img.src = URL.createObjectURL(file);
                                  
                                  const reader = new FileReader();
                                  reader.onload = (event) => {
                                    field.onChange(event.target?.result as string);
                                  };
                                  reader.readAsDataURL(file);
                                }
                              }}
                              className="bg-zinc-800 border-zinc-700 text-white file:bg-yellow-600 file:text-black file:border-0 file:rounded-md file:px-3 file:py-1 file:mr-3"
                            />
                            <div className="text-xs sm:text-sm text-zinc-400">
                              Kích thước khuyến nghị: 300x300px (1:1), tối đa 10MB<br/>
                              Hoặc nhập emoji/URL trực tiếp:
                            </div>
                            <Input 
                              placeholder="👤 hoặc https://example.com/avatar.jpg"
                              value={field.value || ''}
                              onChange={field.onChange}
                              className="bg-zinc-800 border-zinc-700 text-white"
                            />
                            {field.value && field.value.startsWith('data:') && (
                              <div className="mt-2">
                                <div className="text-sm text-zinc-400 mb-2">Preview (64x64px):</div>
                                <img 
                                  src={field.value} 
                                  alt="Preview" 
                                  className="w-16 h-16 rounded-full object-cover border-2 border-zinc-600"
                                />
                              </div>
                            )}
                            {field.value && !field.value.startsWith('data:') && !field.value.startsWith('http') && (
                              <div className="mt-2 text-2xl">
                                {field.value}
                              </div>
                            )}
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="review"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nội Dung Đánh Giá (EN)</FormLabel>
                      <FormControl>
                        <Textarea {...field} className="bg-zinc-800 border-zinc-700" rows={3} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="reviewVi"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nội Dung Đánh Giá (VI)</FormLabel>
                      <FormControl>
                        <Textarea {...field} className="bg-zinc-800 border-zinc-700" rows={3} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="displayOrder"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Thứ Tự Hiển Thị</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          min="1"
                          max="8"
                          {...field} 
                          onChange={(e) => {
                            const value = parseInt(e.target.value) || 0;
                            if (value >= 1 && value <= 8) {
                              field.onChange(value);
                            }
                          }}
                          className="bg-zinc-800 border-zinc-700" 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex flex-col sm:flex-row justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}
                    className="border-zinc-700 text-zinc-300 w-full sm:w-auto"
                  >
                    Hủy
                  </Button>
                  <Button
                    type="submit"
                    disabled={createReviewMutation.isPending || updateReviewMutation.isPending}
                    className="bg-yellow-600 hover:bg-yellow-700 text-black w-full sm:w-auto"
                  >
                    {editingReview ? "Cập Nhật" : "Tạo"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-zinc-400 w-4 h-4" />
        <Input
          placeholder="Tìm kiếm đánh giá..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 bg-zinc-800 border-zinc-700 text-white placeholder-zinc-400"
        />
      </div>

      {/* Reviews Count */}
      <div className="text-sm text-zinc-400">
        Hiển thị {filteredReviews.length} / {reviews.length} đánh giá
      </div>

      {/* Reviews List */}
      <div className="grid gap-6">
        {filteredReviews.map((review) => (
          <Card 
            key={review.id} 
            className={`bg-zinc-900 ${review.isPinned ? 'border-yellow-500 ring-1 ring-yellow-500/20' : 'border-zinc-800'}`}
            data-testid={`review-${review.id}`}
          >
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div className="flex gap-4 flex-1">
                  <div className="w-12 h-12 rounded-full mr-3 flex items-center justify-center bg-zinc-800 overflow-hidden">
                    {review.avatarUrl ? (
                      review.avatarUrl.startsWith('data:') || review.avatarUrl.startsWith('http') ? (
                        <img 
                          src={review.avatarUrl} 
                          alt={review.customerName}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-lg">{review.avatarUrl}</span>
                      )
                    ) : (
                      <span className="text-lg text-zinc-400">👤</span>
                    )}
                  </div>
                  <div className="space-y-3 flex-1">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-xl font-bold text-white flex items-center gap-2">
                          {review.customerName}
                          {review.isPinned && (
                            <div className="flex items-center gap-1">
                              <svg className="w-5 h-5 text-yellow-500 fill-current" viewBox="0 0 24 24">
                                <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                              </svg>
                              <span className="text-xs text-yellow-500 font-medium">PINNED</span>
                            </div>
                          )}
                        </h3>
                        {review.customerNameVi && (
                          <p className="text-zinc-400 text-sm">{review.customerNameVi}</p>
                        )}
                        <div className="flex items-center gap-2 mt-1">
                          <div className="flex items-center gap-1">
                            {renderStars(review.rating)}
                          </div>
                          <span className="text-sm text-zinc-500">•</span>
                          <span className="text-sm text-zinc-400">{review.customerTitle}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-zinc-300 text-sm">
                      "{review.review}"
                    </div>
                    {review.reviewVi && (
                      <div className="text-zinc-400 text-sm italic">
                        "{review.reviewVi}"
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {review.displayOrder > 0 && (
                          <Badge variant="outline" className="text-zinc-300 border-zinc-600">
                            Thứ tự: {review.displayOrder}
                          </Badge>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-4">
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => togglePinMutation.mutate(review.id)}
                          disabled={togglePinMutation.isPending}
                          className={review.isPinned ? "text-yellow-500" : "text-zinc-400"}
                        >
                          {review.isPinned ? <Star className="w-4 h-4 fill-current" /> : <StarOff className="w-4 h-4" />}
                        </Button>
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditDialog(review)}
                          className="text-zinc-400 hover:text-white"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteReviewMutation.mutate(review.id)}
                          disabled={deleteReviewMutation.isPending}
                          className="text-red-400 hover:text-red-300"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredReviews.length === 0 && (
        <div className="text-center py-12">
          <div className="text-zinc-400 text-lg">Không có đánh giá nào</div>
          <div className="text-zinc-500 text-sm">Hãy thêm đánh giá đầu tiên</div>
        </div>
      )}
    </div>
  );
}