import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import { Save, Upload, Eye, Link as LinkIcon, ImageIcon } from "lucide-react";
import type { PageSeo } from "@shared/schema";
import { ObjectUploader } from "@/components/ObjectUploader";
import type { UploadResult } from "@uppy/core";

// Page keys for different sections
const pageKeys = [
  { key: "home", labelVi: "Trang Chủ", labelEn: "Homepage" },
  { key: "menu", labelVi: "Thực Đơn", labelEn: "Menu" },
  { key: "about", labelVi: "Giới Thiệu", labelEn: "About" },
  { key: "contact", labelVi: "Liên Hệ", labelEn: "Contact" },
  { key: "booking", labelVi: "Đặt Bàn", labelEn: "Booking" },
  { key: "news", labelVi: "Tin Tức", labelEn: "News" },
];

// Current hardcoded SEO data from pages - để reference và auto-fill
const getCurrentPageSEO = (pageKey: string, language: string) => {
  const data: Record<string, Record<string, any>> = {
    home: {
      vi: {
        metaTitle: "Hum's Pizza | Gắn Kết Yêu Thương, Đậm Đà Vị Việt",
        metaDescription: "Khám phá những chiếc pizza tuyệt vời tại Hum's Pizza | nơi gắn kết yêu thương và đậm đà vị Việt. Đặt bàn ngay hôm nay để thưởng thức pizza tươi ngon từ nguyên liệu cao cấp.",
        keywords: "pizza, pizza Ý, pizza thủ công, nhà hàng pizza, Bình Dương, đặt bàn, pizza tươi",
        canonicalUrl: "https://humspizza.com/",
        ogTitle: "Hum's Pizza | Gắn Kết Yêu Thương, Đậm Đà Vị Việt",
        ogDescription: "Hum's Pizza | Nhà hàng pizza phong cách Chicago & Ý, đến từ Việt Nam. Chúng tôi mang đến hương vị phô mai ngập tràn, vỏ bánh giòn thơm và trải nghiệm chuẩn vị trong từng lát bánh.",
        ogImageUrl: "/og.bg.png",
        ogUrl: "https://humspizza.com/",
        ogType: "website"
      },
      en: {
        metaTitle: "Hum's Pizza | Connecting Hearts, Authentic Vietnamese Taste",
        metaDescription: "Discover amazing pizzas at Hum's Pizza | where we connect hearts with authentic Vietnamese taste. Book your table today to enjoy fresh, delicious pizzas made from premium ingredients.",
        keywords: "pizza, Vietnamese pizza, authentic taste, pizza restaurant, Binh Duong, table booking, fresh pizza",
        canonicalUrl: "https://humspizza.com/",
        ogTitle: "Hum's Pizza | Connecting Hearts, Authentic Vietnamese Taste",
        ogDescription: "Hum's Pizza | Connecting Hearts, Authentic Vietnamese Taste. We bring unique Vietnamese-style pizzas, crispy crusts, and authentic experiences in every slice.",
        ogImageUrl: "/og.bg.png",
        ogUrl: "https://humspizza.com/",
        ogType: "website"
      }
    },
    menu: {
      vi: {
        metaTitle: "Thực Đơn Pizza - Hum's Pizza",
        metaDescription: "Khám phá thực đơn pizza đa dạng tại Hum's Pizza với các món ăn chất lượng cao, tươi ngon.",
        keywords: "thực đơn pizza, menu pizza, pizza việt nam, hums pizza",
        canonicalUrl: "https://humspizza.com/menu",
        ogTitle: "Thực Đơn Pizza Đặc Biệt - Hum's Pizza",
        ogDescription: "Thực đơn pizza đa dạng với hương vị Việt Nam độc đáo tại Hum's Pizza.",
        ogImageUrl: "/og.bg.png",
        ogUrl: "https://humspizza.com/menu",
        ogType: "website"
      },
      en: {
        metaTitle: "Pizza Menu - Hum's Pizza",
        metaDescription: "Explore our diverse pizza menu at Hum's Pizza with high-quality, fresh and delicious dishes.",
        keywords: "pizza menu, vietnamese pizza, hums pizza menu",
        canonicalUrl: "https://humspizza.com/menu",
        ogTitle: "Special Pizza Menu - Hum's Pizza",
        ogDescription: "Diverse pizza menu with unique Vietnamese flavors at Hum's Pizza.",
        ogImageUrl: "/og.bg.png",
        ogUrl: "https://humspizza.com/menu",
        ogType: "website"
      }
    },
    about: {
      vi: {
        metaTitle: "Giới Thiệu - Hum's Pizza",
        metaDescription: "Tìm hiểu về Hum's Pizza - nhà hàng pizza Việt Nam với sứ mệnh kết nối trái tim qua hương vị đặc biệt.",
        keywords: "giới thiệu hums pizza, về chúng tôi, nhà hàng pizza việt nam",
        canonicalUrl: "https://humspizza.com/about",
        ogTitle: "Câu Chuyện Hum's Pizza - Kết Nối Trái Tim",
        ogDescription: "Khám phá câu chuyện đằng sau Hum's Pizza và sứ mệnh kết nối trái tim qua hương vị.",
        ogImageUrl: "/og.bg.png",
        ogUrl: "https://humspizza.com/about",
        ogType: "website"
      },
      en: {
        metaTitle: "About Us - Hum's Pizza",
        metaDescription: "Learn about Hum's Pizza - Vietnamese pizza restaurant with a mission to connect hearts through special flavors.",
        keywords: "about hums pizza, vietnamese pizza restaurant, our story",
        canonicalUrl: "https://humspizza.com/about",
        ogTitle: "The Story of Hum's Pizza - Connecting Hearts",
        ogDescription: "Discover the story behind Hum's Pizza and our mission to connect hearts through flavors.",
        ogImageUrl: "/og.bg.png",
        ogUrl: "https://humspizza.com/about",
        ogType: "website"
      }
    },
    contact: {
      vi: {
        metaTitle: "Liên Hệ - Hum's Pizza",
        metaDescription: "Liên hệ với Hum's Pizza để đặt bàn, đặt hàng hoặc biết thêm thông tin về nhà hàng.",
        keywords: "liên hệ hums pizza, đặt bàn, số điện thoại, địa chỉ",
        canonicalUrl: "https://humspizza.com/contact",
        ogTitle: "Liên Hệ Đặt Bàn - Hum's Pizza",
        ogDescription: "Liên hệ ngay với Hum's Pizza để đặt bàn và thưởng thức pizza tuyệt vời.",
        ogImageUrl: "/og.bg.png",
        ogUrl: "https://humspizza.com/contact",
        ogType: "website"
      },
      en: {
        metaTitle: "Contact Us - Hum's Pizza",
        metaDescription: "Contact Hum's Pizza for reservations, orders or more information about our restaurant.",
        keywords: "contact hums pizza, reservations, phone number, address",
        canonicalUrl: "https://humspizza.com/contact",
        ogTitle: "Contact & Reservations - Hum's Pizza",
        ogDescription: "Contact Hum's Pizza now for reservations and enjoy amazing pizza.",
        ogImageUrl: "/og.bg.png",
        ogUrl: "https://humspizza.com/contact",
        ogType: "website"
      }
    },
    booking: {
      vi: {
        metaTitle: "Đặt Bàn - Hum's Pizza",
        metaDescription: "Đặt bàn online tại Hum's Pizza. Nhanh chóng, tiện lợi và đảm bảo chỗ ngồi cho bạn.",
        keywords: "đặt bàn online, reservation, hums pizza booking",
        canonicalUrl: "https://humspizza.com/booking",
        ogTitle: "Đặt Bàn Online - Hum's Pizza",
        ogDescription: "Đặt bàn dễ dàng tại Hum's Pizza. Đảm bảo chỗ ngồi cho trải nghiệm tuyệt vời.",
        ogImageUrl: "/og.bg.png",
        ogUrl: "https://humspizza.com/booking",
        ogType: "website"
      },
      en: {
        metaTitle: "Book a Table - Hum's Pizza",
        metaDescription: "Book a table online at Hum's Pizza. Fast, convenient and guaranteed seating for you.",
        keywords: "online booking, table reservation, hums pizza reservation",
        canonicalUrl: "https://humspizza.com/booking",
        ogTitle: "Online Table Booking - Hum's Pizza",
        ogDescription: "Easy table booking at Hum's Pizza. Secure your seat for an amazing experience.",
        ogImageUrl: "/og.bg.png",
        ogUrl: "https://humspizza.com/booking",
        ogType: "website"
      }
    },
    news: {
      vi: {
        metaTitle: "Tin Tức - Hum's Pizza",
        metaDescription: "Cập nhật tin tức mới nhất từ Hum's Pizza về menu, khuyến mãi và sự kiện đặc biệt.",
        keywords: "tin tức hums pizza, blog, khuyến mãi, sự kiện",
        canonicalUrl: "https://humspizza.com/news",
        ogTitle: "Tin Tức & Blog - Hum's Pizza",
        ogDescription: "Theo dõi tin tức mới nhất, khuyến mãi và sự kiện đặc biệt từ Hum's Pizza.",
        ogImageUrl: "/og.bg.png",
        ogUrl: "https://humspizza.com/news",
        ogType: "website"
      },
      en: {
        metaTitle: "News - Hum's Pizza",
        metaDescription: "Stay updated with the latest news from Hum's Pizza about menu, promotions and special events.",
        keywords: "hums pizza news, blog, promotions, events",
        canonicalUrl: "https://humspizza.com/news",
        ogTitle: "News & Blog - Hum's Pizza",
        ogDescription: "Follow the latest news, promotions and special events from Hum's Pizza.",
        ogImageUrl: "/og.bg.png",
        ogUrl: "https://humspizza.com/news",
        ogType: "website"
      }
    }
  };
  
  return data[pageKey]?.[language] || null;
};

// Form schema for SEO data
const seoFormSchema = z.object({
  pageKey: z.string().min(1, "Page key is required"),
  language: z.string().min(1, "Language is required"),
  metaTitle: z.string().optional(),
  metaDescription: z.string().optional(),
  keywords: z.string().optional(),
  canonicalUrl: z.string().optional(),
  ogTitle: z.string().optional(),
  ogDescription: z.string().optional(),
  ogImageUrl: z.string().optional(),
  ogType: z.string().default("website"),
  ogUrl: z.string().optional(),
  noIndex: z.boolean().default(false),
});

type SeoFormData = z.infer<typeof seoFormSchema>;

export default function SeoManagement() {
  const { language: currentLanguage } = useLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedPage, setSelectedPage] = useState("home");
  const [editingLanguage, setEditingLanguage] = useState("vi");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string>("");

  const t = {
    vi: {
      title: "Quản Lý SEO & Open Graph",
      subtitle: "Quản lý metadata SEO và Open Graph cho từng trang",
      pageSelect: "Chọn trang:",
      languageSelect: "Ngôn ngữ:",
      metaTitle: "Tiêu đề Meta",
      metaDescription: "Mô tả Meta", 
      keywords: "Từ khóa (phân cách bằng dấu phẩy)",
      canonicalUrl: "URL Canonical",
      ogTitle: "Tiêu đề Open Graph",
      ogDescription: "Mô tả Open Graph",
      ogImageUrl: "URL Ảnh Open Graph",
      ogType: "Loại Open Graph",
      ogUrl: "URL Open Graph",
      noIndex: "Không lập chỉ mục",
      save: "Lưu",
      saving: "Đang lưu...",
      success: "Cập nhật thành công",
      error: "Có lỗi xảy ra",
      preview: "Xem trước",
      uploadImage: "Upload ảnh",
      currentData: "Dữ liệu hiện tại",
      newData: "Tạo mới",
      website: "Trang web",
      article: "Bài viết",
      profile: "Hồ sơ",
      product: "Sản phẩm",
    },
    en: {
      title: "SEO & Open Graph Management",
      subtitle: "Manage SEO metadata and Open Graph for each page",
      pageSelect: "Select page:",
      languageSelect: "Language:",
      metaTitle: "Meta Title",
      metaDescription: "Meta Description",
      keywords: "Keywords (comma separated)",
      canonicalUrl: "Canonical URL",
      ogTitle: "Open Graph Title",
      ogDescription: "Open Graph Description", 
      ogImageUrl: "Open Graph Image URL",
      ogType: "Open Graph Type",
      ogUrl: "Open Graph URL",
      noIndex: "No Index",
      save: "Save",
      saving: "Saving...",
      success: "Updated successfully",
      error: "An error occurred",
      preview: "Preview",
      uploadImage: "Upload image",
      currentData: "Current data",
      newData: "Create new",
      website: "Website",
      article: "Article", 
      profile: "Profile",
      product: "Product",
    }
  };

  const text = t[currentLanguage];

  // Fetch SEO data for selected page and language
  const { data: seoData, isLoading } = useQuery({
    queryKey: [`/api/seo/pages/${selectedPage}/${editingLanguage}`],
    enabled: !!selectedPage && !!editingLanguage,
  });

  const form = useForm<SeoFormData>({
    resolver: zodResolver(seoFormSchema),
    defaultValues: {
      pageKey: selectedPage,
      language: editingLanguage,
      metaTitle: "",
      metaDescription: "",
      keywords: "",
      canonicalUrl: "",
      ogTitle: "",
      ogDescription: "",
      ogImageUrl: "",
      ogType: "website",
      ogUrl: "",
      noIndex: false,
    },
  });

  // Update form when data changes
  useEffect(() => {
    if (seoData) {
      // Use database data if available
      form.reset({
        pageKey: seoData.pageKey,
        language: seoData.language,
        metaTitle: seoData.metaTitle || "",
        metaDescription: seoData.metaDescription || "",
        keywords: seoData.keywords || "",
        canonicalUrl: seoData.canonicalUrl || "",
        ogTitle: seoData.ogTitle || "",
        ogDescription: seoData.ogDescription || "",
        ogImageUrl: seoData.ogImageUrl || "",
        ogType: seoData.ogType || "website",
        ogUrl: seoData.ogUrl || "",
        noIndex: seoData.noIndex || false,
      });
    } else {
      // Auto-fill with current hardcoded SEO data from pages
      const currentSEO = getCurrentPageSEO(selectedPage, editingLanguage);
      form.reset({
        pageKey: selectedPage,
        language: editingLanguage,
        metaTitle: currentSEO?.metaTitle || "",
        metaDescription: currentSEO?.metaDescription || "",
        keywords: currentSEO?.keywords || "",
        canonicalUrl: currentSEO?.canonicalUrl || "",
        ogTitle: currentSEO?.ogTitle || "",
        ogDescription: currentSEO?.ogDescription || "",
        ogImageUrl: currentSEO?.ogImageUrl || "",
        ogType: currentSEO?.ogType || "website",
        ogUrl: currentSEO?.ogUrl || "",
        noIndex: false,
      });
    }
  }, [seoData, selectedPage, editingLanguage, form]);

  // Update form when page or language changes
  useEffect(() => {
    form.setValue("pageKey", selectedPage);
    form.setValue("language", editingLanguage);
  }, [selectedPage, editingLanguage, form]);

  // Handle upload
  const handleGetUploadParameters = async () => {
    const response = await apiRequest("POST", "/api/og-images/upload");
    const data = await response.json();
    return {
      method: "PUT" as const,
      url: data.uploadURL,
    };
  };

  const handleUploadComplete = async (result: UploadResult<Record<string, unknown>, Record<string, unknown>>) => {
    try {
      setIsUploading(true);
      if (result.successful && result.successful.length > 0) {
        const uploadedFile = result.successful[0];
        const imageURL = uploadedFile.uploadURL;
        
        // Set ACL and get public URL
        const response = await apiRequest("PUT", "/api/og-images", { imageURL });
        const data = await response.json();
        
        // Update form with the public URL 
        const publicURL = data.publicURL;
        form.setValue("ogImageUrl", publicURL);
        setUploadedImageUrl(publicURL);
        
        toast({
          title: "Upload thành công",
          description: "Ảnh Open Graph đã được upload và cập nhật.",
        });
      }
    } catch (error: any) {
      toast({
        title: "Lỗi upload",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const saveMutation = useMutation({
    mutationFn: (data: SeoFormData) => apiRequest("PUT", `/api/seo/pages`, data),
    onSuccess: () => {
      toast({
        title: text.success,
        description: seoData ? text.currentData : text.newData,
      });
      queryClient.invalidateQueries({ queryKey: [`/api/seo/pages/${selectedPage}/${editingLanguage}`] });
    },
    onError: (error: any) => {
      toast({
        title: text.error,
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: SeoFormData) => {
    saveMutation.mutate(data);
  };

  const handlePageChange = (newPage: string) => {
    setSelectedPage(newPage);
  };

  const handleLanguageChange = (newLanguage: string) => {
    setEditingLanguage(newLanguage);
  };

  const currentPageInfo = pageKeys.find(p => p.key === selectedPage);

  return (
    <div className="space-y-6">
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-white">{text.title}</CardTitle>
          <CardDescription className="text-zinc-400">
            {text.subtitle}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Page and Language Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-white">{text.pageSelect}</label>
              <Select value={selectedPage} onValueChange={handlePageChange}>
                <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-zinc-800 border-zinc-700">
                  {pageKeys.map((page) => (
                    <SelectItem key={page.key} value={page.key} className="text-white">
                      {currentLanguage === 'vi' ? page.labelVi : page.labelEn}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-white">{text.languageSelect}</label>
              <Select value={editingLanguage} onValueChange={handleLanguageChange}>
                <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-zinc-800 border-zinc-700">
                  <SelectItem value="vi" className="text-white">Tiếng Việt</SelectItem>
                  <SelectItem value="en" className="text-white">English</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* SEO Form */}
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Meta Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-white">Meta Information</h3>
                  
                  <FormField
                    control={form.control}
                    name="metaTitle"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-white">{text.metaTitle}</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="Enter meta title..."
                            className="bg-zinc-800 border-zinc-700 text-white"
                            data-testid="input-meta-title"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="metaDescription"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-white">{text.metaDescription}</FormLabel>
                        <FormControl>
                          <Textarea
                            {...field}
                            placeholder="Enter meta description..."
                            className="bg-zinc-800 border-zinc-700 text-white"
                            rows={3}
                            data-testid="textarea-meta-description"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="keywords"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-white">{text.keywords}</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="keyword1, keyword2, keyword3..."
                            className="bg-zinc-800 border-zinc-700 text-white"
                            data-testid="input-keywords"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="canonicalUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-white">{text.canonicalUrl}</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="https://example.com/page"
                            className="bg-zinc-800 border-zinc-700 text-white"
                            data-testid="input-canonical-url"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Open Graph Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-white">Open Graph</h3>
                  
                  <FormField
                    control={form.control}
                    name="ogTitle"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-white">{text.ogTitle}</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="Enter Open Graph title..."
                            className="bg-zinc-800 border-zinc-700 text-white"
                            data-testid="input-og-title"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="ogDescription"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-white">{text.ogDescription}</FormLabel>
                        <FormControl>
                          <Textarea
                            {...field}
                            placeholder="Enter Open Graph description..."
                            className="bg-zinc-800 border-zinc-700 text-white"
                            rows={3}
                            data-testid="textarea-og-description"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="ogImageUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-white">{text.ogImageUrl}</FormLabel>
                        <FormControl>
                          <div className="space-y-3">
                            <div className="flex gap-2">
                              <Input
                                {...field}
                                placeholder="https://example.com/image.jpg"
                                className="bg-zinc-800 border-zinc-700 text-white flex-1"
                                data-testid="input-og-image-url"
                              />
                              <ObjectUploader
                                maxNumberOfFiles={1}
                                maxFileSize={10485760} // 10MB for Open Graph images
                                allowedFileTypes={['image/jpeg', 'image/jpg', 'image/png', 'image/webp']}
                                onGetUploadParameters={handleGetUploadParameters}
                                onComplete={handleUploadComplete}
                                buttonClassName="border-zinc-700 text-white hover:bg-zinc-700 px-3"
                                disabled={isUploading}
                              >
                                <div className="flex items-center gap-2">
                                  <ImageIcon className="w-4 h-4" />
                                  <span>{isUploading ? "Uploading..." : "Upload"}</span>
                                </div>
                              </ObjectUploader>
                            </div>
                            
                            {/* Image Preview */}
                            {(field.value || uploadedImageUrl) && (
                              <div className="relative">
                                <img
                                  src={field.value || uploadedImageUrl}
                                  alt="Open Graph Preview"
                                  className="w-full max-w-md h-40 object-cover rounded-lg border border-zinc-700"
                                  onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    target.style.display = 'none';
                                  }}
                                />
                                <div className="mt-2 text-xs text-zinc-400">
                                  Preview: Open Graph Image (tối đa 10MB, định dạng: JPG, PNG, WebP)
                                </div>
                              </div>
                            )}
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="ogType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-white">{text.ogType}</FormLabel>
                        <FormControl>
                          <Select value={field.value} onValueChange={field.onChange}>
                            <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white" data-testid="select-og-type">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-zinc-800 border-zinc-700">
                              <SelectItem value="website" className="text-white">{text.website}</SelectItem>
                              <SelectItem value="article" className="text-white">{text.article}</SelectItem>
                              <SelectItem value="profile" className="text-white">{text.profile}</SelectItem>
                              <SelectItem value="product" className="text-white">{text.product}</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="ogUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-white">{text.ogUrl}</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="https://example.com/page"
                            className="bg-zinc-800 border-zinc-700 text-white"
                            data-testid="input-og-url"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Additional Options */}
              <div className="border-t border-zinc-700 pt-6">
                <h3 className="text-lg font-semibold text-white mb-4">Advanced Options</h3>
                
                <FormField
                  control={form.control}
                  name="noIndex"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border border-zinc-700 p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base text-white">
                          {text.noIndex}
                        </FormLabel>
                        <div className="text-sm text-zinc-400">
                          Prevent search engines from indexing this page
                        </div>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          data-testid="switch-no-index"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end space-x-4 pt-6">
                <Button
                  type="submit"
                  className="bg-amber-600 hover:bg-amber-700 text-black"
                  disabled={saveMutation.isPending}
                  data-testid="button-save-seo"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {saveMutation.isPending ? text.saving : text.save}
                </Button>
              </div>
            </form>
          </Form>

          {/* Current Status */}
          <div className="border-t border-zinc-700 pt-6">
            <div className="flex items-center justify-between">
              <div className="text-sm text-zinc-400">
                <span className="font-medium">Status:</span>{" "}
                {isLoading ? "Loading..." : seoData ? (
                  <span className="text-green-400">✓ {text.currentData} (Database)</span>
                ) : (
                  <span className="text-amber-400">⚠ {text.newData} (Auto-filled từ code hiện tại)</span>
                )}
              </div>
              <div className="text-sm text-zinc-400">
                Page: <span className="font-medium text-amber-400">
                  {currentPageInfo ? (currentLanguage === 'vi' ? currentPageInfo.labelVi : currentPageInfo.labelEn) : selectedPage}
                </span>
                {" • "}
                Language: <span className="font-medium text-amber-400">{editingLanguage === 'vi' ? 'Tiếng Việt' : 'English'}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}