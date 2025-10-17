import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'wouter';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Eye, Edit, Plus, Pin, PinOff, Calendar, User, Upload, Image, Trash2, Clipboard } from 'lucide-react';
import { LocalImageUpload } from '@/components/LocalImageUpload';

import { useLanguage } from '@/contexts/LanguageContext';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const blogPostSchema = z.object({
  title: z.string().min(1, "Tiêu đề là bắt buộc"),
  titleVi: z.string().optional(),
  excerpt: z.string().min(1, "Tóm tắt là bắt buộc"),
  excerptVi: z.string().optional(),
  content: z.string().min(1, "Nội dung là bắt buộc"),
  contentVi: z.string().optional(),
  imageUrl: z.string().optional(),
  coverImageUrl: z.string().optional(),
  // SEO fields
  metaTitle: z.string().optional(),
  metaTitleVi: z.string().optional(),
  metaDescription: z.string().optional(),
  metaDescriptionVi: z.string().optional(),
  slug: z.string().optional(),
  slugVi: z.string().optional(),
  keywords: z.string().optional(),
  keywordsVi: z.string().optional(),
  canonicalUrl: z.string().optional(),
  ogImageUrl: z.string().optional(),
  // Pin fields
  pinned: z.boolean().optional(),
  pinOrder: z.number().min(0).max(3).optional(),
});

type BlogPostFormData = z.infer<typeof blogPostSchema>;

export default function BlogManagement() {
  const { language } = useLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<any>(null);
  const [contentImages, setContentImages] = useState<string[]>([]);
  const [deleteConfirmPost, setDeleteConfirmPost] = useState<any>(null);

  const { data: blogPosts = [], isLoading } = useQuery({
    queryKey: ['/api/blog-posts', 'admin'],
    queryFn: () => fetch('/api/blog-posts?all=true').then(res => res.json()),
    staleTime: 0, // Always refetch to get latest data
    gcTime: 0, // Don't cache for admin dashboard
  });

  const form = useForm<BlogPostFormData>({
    resolver: zodResolver(blogPostSchema),
    defaultValues: {
      title: "",
      titleVi: "",
      excerpt: "",
      excerptVi: "",
      content: "",
      contentVi: "",
      imageUrl: "",
      coverImageUrl: "",
      metaTitle: "",
      metaTitleVi: "",
      metaDescription: "",
      metaDescriptionVi: "",
      slug: "",
      slugVi: "",
      keywords: "",
      keywordsVi: "",
      canonicalUrl: "",
      ogImageUrl: "",
      pinned: false,
      pinOrder: 0,
    },
  });

  const createBlogPostMutation = useMutation({
    mutationFn: async (data: BlogPostFormData) => {
      // Always set published to true for all new posts
      const submitData = { ...data, published: true };
      const response = await apiRequest("POST", "/api/blog-posts", submitData);
      return response.json();
    },
    onSuccess: () => {
      // Force complete cache refresh for all blog queries
      queryClient.removeQueries({ queryKey: ['/api/blog-posts'] });
      queryClient.refetchQueries({ queryKey: ['/api/blog-posts'] });
      
      setIsCreateDialogOpen(false);
      form.reset();
      toast({
        title: "Tạo thành công", 
        description: "Bài viết mới đã được tạo và xuất bản",
      });
      
      // Reload page as last resort to ensure UI updates
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    },
    onError: (error: any) => {
      console.error('Create blog post error:', error);
      if (error.message === "Authentication required" || error.status === 401) {
        toast({
          title: "Phiên làm việc hết hạn",
          description: "Vui lòng đăng nhập lại để tiếp tục",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = '/login';
        }, 2000);
      } else {
        toast({
          title: "Lỗi",
          description: error.message || "Không thể tạo bài viết",
          variant: "destructive",
        });
      }
    },
  });

  const updateBlogPostMutation = useMutation({
    mutationFn: async (data: BlogPostFormData & { id: string }) => {
      const { id, ...updateData } = data;
      const response = await apiRequest("PATCH", `/api/blog-posts/${id}`, updateData);
      return response.json();
    },
    onSuccess: () => {
      // Force invalidate ALL blog related queries with exact queryKey patterns
      queryClient.invalidateQueries({ queryKey: ['/api/blog-posts', 'admin'] });
      queryClient.invalidateQueries({ queryKey: ['/api/blog-posts'] });
      queryClient.invalidateQueries({ queryKey: ['/api/blog-posts/slug'], exact: false });
      
      // Also clear ALL cached blog data completely
      queryClient.removeQueries({ queryKey: ['/api/blog-posts/slug'], exact: false });
      
      setIsCreateDialogOpen(false);
      setEditingPost(null);
      form.reset();
      toast({
        title: "Cập nhật thành công",
        description: "Bài viết đã được cập nhật",
      });
    },
    onError: (error: any) => {
      console.error('Update blog post error:', error);
      if (error.message === "Authentication required" || error.status === 401) {
        toast({
          title: "Phiên làm việc hết hạn",
          description: "Vui lòng đăng nhập lại để tiếp tục",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = '/login';
        }, 2000);
      } else {
        toast({
          title: "Lỗi",
          description: error.message || "Không thể cập nhật bài viết",
          variant: "destructive",
        });
      }
    },
  });


  const togglePinMutation = useMutation({
    mutationFn: async ({ id, pinned }: { id: string; pinned: boolean }) => {
      // Check if trying to pin and already have 3 pinned posts
      if (pinned) {
        const currentPinnedCount = blogPosts.filter((post: any) => post.pinned).length;
        if (currentPinnedCount >= 4) {
          throw new Error("Chỉ được ghim tối đa 4 bài viết");
        }
      }
      const response = await apiRequest("PATCH", `/api/blog-posts/${id}/pin`);
      return response.json();
    },
    onSuccess: (_, { pinned }) => {
      // Invalidate both admin and public blog post caches
      queryClient.invalidateQueries({ queryKey: ['/api/blog-posts', 'admin'] });
      queryClient.invalidateQueries({ queryKey: ['/api/blog-posts'] });
      toast({
        title: "Cập nhật thành công",
        description: pinned ? "Bài viết đã được ghim" : "Bài viết đã được bỏ ghim",
      });
    },
    onError: (error: any) => {
      console.error('Toggle pin error:', error);
      if (error.message === "Authentication required" || error.status === 401) {
        toast({
          title: "Phiên làm việc hết hạn",
          description: "Vui lòng đăng nhập lại để tiếp tục",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = '/login';
        }, 2000);
      } else {
        toast({
          title: "Lỗi",
          description: error.message || "Không thể thay đổi trạng thái ghim",
          variant: "destructive",
        });
      }
    },
  });

  // Mutation for updating pin order directly
  const updatePinOrderMutation = useMutation({
    mutationFn: async ({ id, pinOrder }: { id: string; pinOrder: number }) => {
      const response = await apiRequest("PATCH", `/api/blog-posts/${id}`, { pinOrder });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/blog-posts', 'admin'] });
      queryClient.invalidateQueries({ queryKey: ['/api/blog-posts'] });
      toast({
        title: "Cập nhật thành công",
        description: "Thứ tự ghim đã được cập nhật",
      });
    },
    onError: (error: any) => {
      console.error('Update pin order error:', error);
      if (error.message === "Authentication required" || error.status === 401) {
        toast({
          title: "Phiên làm việc hết hạn",
          description: "Vui lòng đăng nhập lại để tiếp tục",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = '/login';
        }, 2000);
      } else {
        toast({
          title: "Lỗi",
          description: "Không thể cập nhật thứ tự ghim",
          variant: "destructive",
        });
      }
    },
  });

  const deleteBlogPostMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest("DELETE", `/api/blog-posts/${id}`);
      return response.json();
    },
    onSuccess: () => {
      // Invalidate both admin and public blog post caches
      queryClient.invalidateQueries({ queryKey: ['/api/blog-posts', 'admin'] });
      queryClient.invalidateQueries({ queryKey: ['/api/blog-posts'] });
      toast({
        title: "Xóa thành công",
        description: "Bài viết đã được xóa",
      });
    },
    onError: (error: any) => {
      // Delete blog post error handled
      if (error.message === "Authentication required" || error.status === 401) {
        toast({
          title: "Phiên làm việc hết hạn",
          description: "Vui lòng đăng nhập lại để tiếp tục",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = '/login';
        }, 2000);
      } else {
        toast({
          title: "Lỗi",
          description: error.message || "Không thể xóa bài viết",
          variant: "destructive",
        });
      }
    },
  });

  const onSubmit = (data: BlogPostFormData) => {
    // Form submit data logged for debugging
    
    if (editingPost) {
      updateBlogPostMutation.mutate({ id: editingPost.id, ...data });
    } else {
      createBlogPostMutation.mutate(data);
    }
  };

  const handleEdit = (post: any) => {
    setEditingPost(post);
    // Extract existing content images from markdown
    const imageRegex = /!\[[^\]]*\]\(([^)]+)\)/g;
    const existingImages: string[] = [];
    let match;
    while ((match = imageRegex.exec(post.content || '')) !== null) {
      if (match[1].startsWith('/objects/')) {
        existingImages.push(match[1]);
      }
    }
    setContentImages(existingImages);
    
    form.reset({
      title: post.title,
      titleVi: post.titleVi || "",
      excerpt: post.excerpt,
      excerptVi: post.excerptVi || "",
      content: post.content,
      contentVi: post.contentVi || "",
      imageUrl: post.imageUrl || "",
      coverImageUrl: post.coverImageUrl || "",
      metaTitle: post.metaTitle || "",
      metaTitleVi: post.metaTitleVi || "",
      metaDescription: post.metaDescription || "",
      metaDescriptionVi: post.metaDescriptionVi || "",
      slug: post.slug || "",
      slugVi: post.slugVi || "",
      keywords: post.keywords || "",
      keywordsVi: post.keywordsVi || "",
      canonicalUrl: post.canonicalUrl || "",
      ogImageUrl: post.ogImageUrl || "",
      pinned: post.pinned || false,
      pinOrder: post.pinOrder || 0,
    });
    setIsCreateDialogOpen(true);
  };

  const handleCreate = () => {
    setEditingPost(null);
    setContentImages([]);
    form.reset({
      title: '',
      titleVi: '',
      excerpt: '',
      excerptVi: '',
      content: '',
      contentVi: '',
      imageUrl: '',
      coverImageUrl: '',
      slug: '',
      slugVi: '',
      keywords: '',
      keywordsVi: '',
      canonicalUrl: '',
      ogImageUrl: '',
      metaTitle: '',
      metaTitleVi: '',
      metaDescription: '',
      metaDescriptionVi: '',
    });
    setIsCreateDialogOpen(true);
  };

  const t = (key: string) => {
    const translations: Record<string, Record<string, string>> = {
      'vi': {
        'blog_management': 'Quản Lý Tin Tức',
        'create_post': 'Tạo Bài Viết',
        'edit_post': 'Chỉnh Sửa Bài Viết',
        'title': 'Tiêu Đề',
        'title_en': 'Tiêu Đề (English)',
        'title_vi': 'Tiêu Đề (Tiếng Việt)',
        'excerpt': 'Tóm Tắt',
        'excerpt_en': 'Tóm Tắt (English)',
        'excerpt_vi': 'Tóm Tắt (Tiếng Việt)',
        'content': 'Nội Dung',
        'content_en': 'Nội Dung (English)',
        'content_vi': 'Nội Dung (Tiếng Việt)',
        'image_url': 'URL Hình Ảnh',
        'cancel': 'Hủy',
        'save': 'Lưu',
        'create': 'Tạo',
        'view': 'Xem'
      },
      'en': {
        'blog_management': 'News Management',
        'create_post': 'Create Post',
        'edit_post': 'Edit Post',
        'title': 'Title',
        'title_en': 'Title (English)',
        'title_vi': 'Title (Vietnamese)',
        'excerpt': 'Excerpt',
        'excerpt_en': 'Excerpt (English)',
        'excerpt_vi': 'Excerpt (Vietnamese)',
        'content': 'Content',
        'content_en': 'Content (English)',
        'content_vi': 'Content (Vietnamese)',
        'image_url': 'Image URL',
        'cancel': 'Cancel',
        'save': 'Save',
        'create': 'Create',
        'view': 'View'
      }
    };
    return translations[language]?.[key] || key;
  };

  // Sort posts: pinned first, then by creation date
  const sortedPosts = [...blogPosts].sort((a, b) => {
    // Handle pinned field that might not exist yet
    const aPinned = a.pinned || false;
    const bPinned = b.pinned || false;
    
    // First priority: pinned vs non-pinned
    if (aPinned && !bPinned) return -1;
    if (!aPinned && bPinned) return 1;
    
    // Second priority: if both are pinned, sort by pinOrder (0 = first, 1 = second, etc.)
    if (aPinned && bPinned) {
      const aOrder = a.pinOrder || 0;
      const bOrder = b.pinOrder || 0;
      if (aOrder !== bOrder) return aOrder - bOrder;
    }
    
    // Third priority: sort by creation date
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  if (isLoading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">{t('blog_management')}</h1>
            <p className="text-zinc-400">Quản lý bài viết blog và tin tức</p>
          </div>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={handleCreate} className="bg-yellow-500 text-black hover:bg-yellow-600">
                <Plus className="w-4 h-4 mr-2" />
                {t('create_post')}
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-zinc-900 border-zinc-800 max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-white">
                  {editingPost ? t('edit_post') : t('create_post')}
                </DialogTitle>
                <DialogDescription className="text-zinc-400">
                  {editingPost ? "Cập nhật thông tin bài viết" : "Tạo bài viết mới cho blog"}
                </DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-white">{t('title_en')}</FormLabel>
                          <FormControl>
                            <Input {...field} className="bg-zinc-800 border-zinc-700 text-white" placeholder="Enter English title..." />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="titleVi"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-white">{t('title_vi')}</FormLabel>
                          <FormControl>
                            <Input {...field} className="bg-zinc-800 border-zinc-700 text-white" placeholder="Nhập tiêu đề tiếng Việt..." />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="excerpt"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-white">{t('excerpt_en')}</FormLabel>
                          <FormControl>
                            <Textarea {...field} className="bg-zinc-800 border-zinc-700 text-white min-h-[100px]" placeholder="Brief description in English..." />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="excerptVi"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-white">{t('excerpt_vi')}</FormLabel>
                          <FormControl>
                            <Textarea {...field} className="bg-zinc-800 border-zinc-700 text-white min-h-[100px]" placeholder="Mô tả ngắn bằng tiếng Việt..." />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>



                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="content"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-white">{t('content_en')}</FormLabel>
                          <FormControl>
                            <Textarea {...field} className="bg-zinc-800 border-zinc-700 text-white min-h-[200px]" placeholder="Write your content in English..." />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="contentVi"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-white">{t('content_vi')}</FormLabel>
                          <FormControl>
                            <Textarea {...field} className="bg-zinc-800 border-zinc-700 text-white min-h-[200px]" placeholder="Viết nội dung bằng tiếng Việt..." />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>


                  {/* Image Upload Section */}
                  <div className="space-y-4 border-t border-zinc-700 pt-6">
                    <h4 className="text-lg font-semibold text-white">Hình Ảnh</h4>
                    
                    {/* Thumbnail Image Field */}
                    <FormField
                      control={form.control}
                      name="imageUrl"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-white">Ảnh Thu Nhỏ (Upload từ máy tính)</FormLabel>
                          <FormControl>
                            <div className="space-y-3">
                              <LocalImageUpload
                                onFileUploaded={(url) => {
                                  if (url.startsWith('ERROR:')) {
                                    toast({
                                      title: "Lỗi Upload",
                                      description: url.replace('ERROR:', ''),
                                      variant: "destructive",
                                    });
                                    return;
                                  }
                                  field.onChange(url);
                                  toast({
                                    title: "Ảnh thu nhỏ đã upload",
                                    description: "Ảnh thu nhỏ đã được upload thành công",
                                  });
                                }}
                                uploadEndpoint="/api/news-images/upload"
                                maxSize={10}
                                placeholder="Kéo thả ảnh thu nhỏ vào đây hoặc click để chọn file"
                                currentImage={field.value}
                                className="w-full"
                                cropType="thumbnail"
                              />
                              
                              <p className="text-xs text-zinc-400">
                                Ảnh thu nhỏ hiển thị trên thẻ bài viết ở trang chủ tin tức (tỷ lệ 4:3)
                              </p>
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Cover Image for Article */}
                    <FormField
                      control={form.control}
                      name="coverImageUrl"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-white">Ảnh Bìa (Upload từ máy tính)</FormLabel>
                          <FormControl>
                            <div className="space-y-3">
                              <LocalImageUpload
                                onFileUploaded={(url) => {
                                  if (url.startsWith('ERROR:')) {
                                    toast({
                                      title: "Lỗi Upload",
                                      description: url.replace('ERROR:', ''),
                                      variant: "destructive",
                                    });
                                    return;
                                  }
                                  field.onChange(url);
                                  toast({
                                    title: "Ảnh bìa đã upload",
                                    description: "Ảnh bìa bài viết đã được upload thành công",
                                  });
                                }}
                                uploadEndpoint="/api/news-images/upload"
                                maxSize={10}
                                placeholder="Kéo thả ảnh bìa vào đây hoặc click để chọn file"
                                currentImage={field.value}
                                className="w-full"
                                cropType="cover"
                              />
                              
                              <p className="text-xs text-zinc-400">
                                Ảnh bìa hiển thị ở đầu bài viết khi đọc chi tiết (tỷ lệ 16:9)
                              </p>
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Content Images */}
                    <div className="space-y-3">
                      <FormLabel className="text-white">Ảnh Nội Dung (Upload từ máy tính để chèn vào bài viết)</FormLabel>
                      
                      {/* Display uploaded content images */}
                      {contentImages.length > 0 && (
                        <div className="space-y-2">
                          <h5 className="text-sm font-medium text-white">Ảnh đã upload ({contentImages.length}/5):</h5>
                          <div className="space-y-3">
                            {contentImages.map((imageUrl, index) => (
                              <div key={index} className="border border-zinc-700 rounded-lg p-3 bg-zinc-800/50">
                                <div className="flex gap-3">
                                  <div className="relative flex-shrink-0">
                                    <img 
                                      src={imageUrl} 
                                      alt={`Content image ${index + 1}`}
                                      className="w-20 h-20 object-cover rounded border border-zinc-600"
                                    />
                                    <Button
                                      type="button"
                                      variant="destructive"
                                      size="sm"
                                      className="absolute -top-1 -right-1 h-6 w-6 p-0"
                                      onClick={() => {
                                        // Remove image from list and content
                                        const newImages = contentImages.filter((_, i) => i !== index);
                                        setContentImages(newImages);
                                        
                                        // Remove from content
                                        const currentContent = form.getValues().content || '';
                                        const currentContentVi = form.getValues().contentVi || '';
                                        const imageMarkdown = `![Ảnh](${imageUrl})`;
                                        
                                        form.setValue('content', currentContent.replace(imageMarkdown, '').replace(/\n\n+/g, '\n\n'));
                                        form.setValue('contentVi', currentContentVi.replace(imageMarkdown, '').replace(/\n\n+/g, '\n\n'));
                                        
                                        toast({
                                          title: "Đã xóa ảnh",
                                          description: "Ảnh đã được xóa khỏi bài viết",
                                        });
                                      }}
                                    >
                                      ×
                                    </Button>
                                  </div>
                                  
                                  <div className="flex-1 space-y-2">
                                    <div className="text-sm text-zinc-300">Ảnh {index + 1}</div>
                                    <div 
                                      className="text-xs text-white bg-zinc-700 px-2 py-1 rounded font-mono cursor-pointer hover:bg-zinc-600 transition-colors" 
                                      onClick={() => {
                                        navigator.clipboard.writeText(imageUrl);
                                        toast({
                                          title: "Đã copy đường dẫn",
                                          description: "Đường dẫn ảnh đã được copy vào clipboard",
                                        });
                                      }}
                                      title="Click để copy đường dẫn"
                                    >
                                      <div className="flex items-center gap-1">
                                        <span className="flex-1 break-all">{imageUrl}</span>
                                        <Clipboard className="w-3 h-3 flex-shrink-0" />
                                      </div>
                                    </div>
                                    <div className="text-xs text-zinc-500">
                                      Click đường dẫn bên trên để copy và chèn vào vị trí bất kỳ trong bài viết
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {/* Upload component - only show if less than 5 images */}
                      {contentImages.length < 5 ? (
                        <LocalImageUpload
                          allowMultiple={true}
                          onMultipleUploaded={(urls) => {
                            // Handle multiple files uploaded at once
                            const remainingSlots = 5 - contentImages.length;
                            
                            if (remainingSlots <= 0) {
                              toast({
                                title: "Giới hạn 5 ảnh",
                                description: "Đã đạt giới hạn tối đa 5 ảnh. Xóa ảnh cũ để thêm ảnh mới.",
                                variant: "destructive"
                              });
                              return;
                            }
                            
                            const urlsToAdd = urls.slice(0, remainingSlots);
                            
                            // Add to content images list
                            setContentImages(prev => [...prev, ...urlsToAdd]);
                            
                            const currentContent = form.getValues().content || '';
                            const currentContentVi = form.getValues().contentVi || '';
                            
                            // Append all images to end of content
                            const imageMarkdowns = urlsToAdd.map(url => `\n\n![Ảnh](${url})`).join('');
                            form.setValue('content', currentContent + imageMarkdowns);
                            form.setValue('contentVi', currentContentVi + imageMarkdowns);
                            
                            toast({
                              title: `Đã thêm ${urlsToAdd.length} ảnh nội dung`,
                              description: "Các ảnh đã được chèn vào cuối bài viết tự động",
                            });
                            
                            if (urls.length > remainingSlots) {
                              toast({
                                title: "Giới hạn 5 ảnh",
                                description: `Chỉ thêm được ${remainingSlots} ảnh còn lại (tối đa 5 ảnh). Xóa ảnh cũ để thêm thêm.`,
                                variant: "destructive"
                              });
                            }
                          }}
                          onFileUploaded={(url) => {
                            // Handle error messages
                            if (url.startsWith('ERROR:')) {
                              const errorMessage = url.replace('ERROR:', '');
                              toast({
                                title: "Lỗi Upload",
                                description: errorMessage,
                                variant: "destructive"
                              });
                              return;
                            }

                            // Check limit before adding (single file upload)
                            if (contentImages.length >= 5) {
                              toast({
                                title: "Giới hạn 5 ảnh",
                                description: "Đã đạt giới hạn tối đa 5 ảnh nội dung",
                                variant: "destructive"
                              });
                              return;
                            }
                            
                            // Add to content images list
                            setContentImages(prev => [...prev, url]);
                            
                            const currentContent = form.getValues().content || '';
                            const currentContentVi = form.getValues().contentVi || '';
                            
                            // Append image markdown to end of content
                            const imageMarkdown = `\n\n![Ảnh](${url})`;
                            form.setValue('content', currentContent + imageMarkdown);
                            form.setValue('contentVi', currentContentVi + imageMarkdown);
                            
                            toast({
                              title: "Ảnh nội dung đã thêm",
                              description: "Ảnh đã được chèn vào cuối bài viết tự động",
                            });
                          }}
                          uploadEndpoint="/api/news-images/upload"
                          maxSize={10}
                          placeholder="Kéo thả ảnh nội dung vào đây (có thể chọn nhiều ảnh cùng lúc)"
                          className="w-full"
                        />
                      ) : (
                        <div className="text-center py-6 border-2 border-dashed border-zinc-600 rounded-lg">
                          <div className="text-zinc-400 text-sm">
                            <Upload className="w-6 h-6 mx-auto mb-2 opacity-50" />
                            Đã đạt giới hạn tối đa 5 ảnh nội dung
                            <div className="text-xs text-zinc-500 mt-1">
                              Xóa ảnh cũ để thêm ảnh mới
                            </div>
                          </div>
                        </div>
                      )}
                      
                      <div className="text-xs text-zinc-400 bg-zinc-800/50 p-3 rounded">
                        <strong>Hướng dẫn mới:</strong><br/>
                        • <strong>Ảnh Bìa (16:9):</strong> Upload → Tự động hiện crop modal → Kéo/resize vùng cắt → Cắt ảnh<br/>
                        • <strong>Ảnh Nội Dung:</strong> Upload → Tự động chèn vào cuối bài viết → Click URL bên dưới để copy và chèn thủ công<br/>
                        • <strong>Crop Tool:</strong> Kéo vùng cắt để di chuyển, kéo góc để thay đổi kích thước<br/>
                        • <strong>Kích thước khuyến nghị:</strong> Tỉ lệ 16:9 (1920x1080px, 1600x900px hoặc 1280x720px)<br/>
                        • <strong>Định dạng:</strong> JPG, PNG, WebP - File size: Tối đa 10MB cho tất cả ảnh
                      </div>
                    </div>
                  </div>

                  {/* SEO Section */}
                  <div className="space-y-4 border-t border-zinc-700 pt-6">
                    <h4 className="text-lg font-semibold text-white">SEO & Meta Tags</h4>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="metaTitle"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-white">Meta Title (EN)</FormLabel>
                            <FormControl>
                              <Input {...field} className="bg-zinc-800 border-zinc-700 text-white" placeholder="SEO title in English..." />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="metaTitleVi"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-white">Meta Title (VI)</FormLabel>
                            <FormControl>
                              <Input {...field} className="bg-zinc-800 border-zinc-700 text-white" placeholder="Tiêu đề SEO tiếng Việt..." />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="metaDescription"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-white">Meta Description (EN)</FormLabel>
                            <FormControl>
                              <Textarea {...field} className="bg-zinc-800 border-zinc-700 text-white" placeholder="SEO description in English..." rows={3} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="metaDescriptionVi"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-white">Meta Description (VI)</FormLabel>
                            <FormControl>
                              <Textarea {...field} className="bg-zinc-800 border-zinc-700 text-white" placeholder="Mô tả SEO tiếng Việt..." rows={3} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="slug"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-white">URL Slug (EN)</FormLabel>
                            <FormControl>
                              <Input {...field} className="bg-zinc-800 border-zinc-700 text-white" placeholder="url-friendly-slug" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="slugVi"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-white">URL Slug (VI)</FormLabel>
                            <FormControl>
                              <Input {...field} className="bg-zinc-800 border-zinc-700 text-white" placeholder="url-thong-dung" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="keywords"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-white">Keywords (EN)</FormLabel>
                            <FormControl>
                              <Input {...field} className="bg-zinc-800 border-zinc-700 text-white" placeholder="keyword1, keyword2, keyword3" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="keywordsVi"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-white">Keywords (VI)</FormLabel>
                            <FormControl>
                              <Input {...field} className="bg-zinc-800 border-zinc-700 text-white" placeholder="từ khóa 1, từ khóa 2, từ khóa 3" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                  </div>


                  <div className="flex justify-end gap-2 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsCreateDialogOpen(false)}
                      className="border-zinc-700 text-white hover:bg-zinc-800"
                    >
                      {t('cancel')}
                    </Button>
                    <Button
                      type="submit"
                      className="bg-yellow-500 text-black hover:bg-yellow-600"
                      disabled={createBlogPostMutation.isPending || updateBlogPostMutation.isPending}
                    >
                      {editingPost ? t('save') : t('create')}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Blog Posts Grid */}
        <div className="grid gap-6">
          {(() => {
            // Sort posts: pinned first, then by creation date (newest first)
            const sortedPosts = [...blogPosts].sort((a, b) => {
              const aPinned = a.pinned || false;
              const bPinned = b.pinned || false;
              
              // First priority: pinned vs non-pinned
              if (aPinned && !bPinned) return -1;
              if (!aPinned && bPinned) return 1;
              
              // Second priority: if both are pinned, sort by pinOrder (0 = first, 1 = second, etc.)
              if (aPinned && bPinned) {
                const aOrder = a.pinOrder || 0;
                const bOrder = b.pinOrder || 0;
                if (aOrder !== bOrder) return aOrder - bOrder;
              }
              
              // Third priority: sort by creation date
              return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
            });
            
            return sortedPosts.map((post) => {
              return (
            <Card key={post.id} className={`bg-zinc-900 border-zinc-800 ${(post.pinned || false) ? 'ring-2 ring-yellow-500' : ''}`}>
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  {post.imageUrl && (
                    <div className="flex-shrink-0">
                      <img 
                        src={post.imageUrl} 
                        alt={post.title}
                        className="w-24 h-24 object-cover rounded-lg"
                      />
                    </div>
                  )}
                  
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="text-xl font-bold text-white">
                            {language === 'vi' ? (post.titleVi || post.title) : post.title}
                          </h3>
                          {(post.pinned || false) && (
                            <Badge className="bg-yellow-500 text-black text-xs">
                              #{(post.pinOrder || 0) + 1}
                            </Badge>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-2 mb-3">
                          <div className="flex items-center gap-1 text-sm text-zinc-400">
                            <Calendar className="w-3 h-3" />
                            {new Date(post.createdAt).toLocaleDateString()}
                          </div>
                          <div className="flex items-center gap-1 text-sm text-zinc-400">
                            <User className="w-3 h-3" />
                            Admin
                          </div>
                        </div>

                        <p className="text-zinc-300 text-sm mb-4 line-clamp-2">
                          {language === 'vi' ? (post.excerptVi || post.excerpt) : post.excerpt}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 ml-4">
                        {/* Pin/Unpin Button */}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => togglePinMutation.mutate({ id: post.id, pinned: !(post.pinned || false) })}
                          className={`border-zinc-700 hover:bg-zinc-800 ${
                            (post.pinned || false) ? 'text-yellow-500 border-yellow-500' : 'text-white'
                          }`}
                          disabled={togglePinMutation.isPending}
                        >
                          {(post.pinned || false) ? <PinOff className="w-4 h-4" /> : <Pin className="w-4 h-4" />}
                        </Button>

                        {/* Pin Order Input - Only show when pinned */}
                        {(post.pinned || false) && (
                          <div className="flex items-center gap-1">
                            <span className="text-xs text-zinc-400">#</span>
                            <input
                              type="number"
                              min={1}
                              max={4}
                              value={(post.pinOrder || 0) + 1}
                              onChange={(e) => {
                                const displayValue = parseInt(e.target.value);
                                if (displayValue >= 1 && displayValue <= 4) {
                                  const dbValue = displayValue - 1; // Convert 1-4 to 0-3 for database
                                  updatePinOrderMutation.mutate({ id: post.id, pinOrder: dbValue });
                                }
                              }}
                              className="w-12 h-8 px-2 text-xs bg-zinc-800 border border-zinc-700 rounded text-white text-center focus:border-yellow-500 focus:outline-none"
                              disabled={updatePinOrderMutation.isPending}
                            />
                          </div>
                        )}

                        {/* Edit Button */}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEdit(post)}
                          className="border-zinc-700 text-white hover:bg-zinc-800"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>

                        {/* Delete Button */}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setDeleteConfirmPost(post)}
                          className="border-red-700 text-red-400 hover:bg-red-900/20"
                          disabled={deleteBlogPostMutation.isPending}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>

                        {/* View Button */}
                        <Link href={`/news/${post.slug || post.id}`}>
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-zinc-700 text-white hover:bg-zinc-800"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
              );
            });
          })()}

          {blogPosts.length === 0 && (
            <Card className="bg-zinc-900 border-zinc-800">
              <CardContent className="p-12 text-center">
                <p className="text-zinc-400 text-lg mb-4">Chưa có bài viết nào</p>
                <Button onClick={handleCreate} className="bg-yellow-500 text-black hover:bg-yellow-600">
                  <Plus className="w-4 h-4 mr-2" />
                  Tạo bài viết đầu tiên
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteConfirmPost} onOpenChange={() => setDeleteConfirmPost(null)}>
        <AlertDialogContent className="bg-zinc-900 border-zinc-700">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Xác nhận xóa bài viết</AlertDialogTitle>
            <AlertDialogDescription className="text-zinc-400">
              Bạn có chắc chắn muốn xóa bài viết "{deleteConfirmPost?.title}"? Hành động này không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-zinc-700 text-white hover:bg-zinc-800">
              Hủy
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteConfirmPost) {
                  deleteBlogPostMutation.mutate(deleteConfirmPost.id);
                  setDeleteConfirmPost(null);
                }
              }}
              className="bg-red-600 hover:bg-red-700 text-white"
              disabled={deleteBlogPostMutation.isPending}
            >
              {deleteBlogPostMutation.isPending ? "Đang xóa..." : "Xóa"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}