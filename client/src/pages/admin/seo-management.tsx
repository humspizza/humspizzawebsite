import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import { Save, ImageIcon } from "lucide-react";
import type { PageSeo } from "@shared/schema";
import { ObjectUploader } from "@/components/ObjectUploader";

const pageKeys = [
  { key: "home", labelVi: "Trang Chủ", labelEn: "Homepage" },
  { key: "menu", labelVi: "Thực Đơn", labelEn: "Menu" },
  { key: "about", labelVi: "Giới Thiệu", labelEn: "About" },
  { key: "contact", labelVi: "Liên Hệ", labelEn: "Contact" },
  { key: "booking", labelVi: "Đặt Bàn", labelEn: "Booking" },
  { key: "news", labelVi: "Tin Tức", labelEn: "News" },
];

const seoFormSchema = z.object({
  pageKey: z.string().min(1, "Page key is required"),
  
  // Vietnamese fields
  metaTitleVi: z.string().optional(),
  metaDescriptionVi: z.string().optional(),
  keywordsVi: z.string().optional(),
  ogTitleVi: z.string().optional(),
  ogDescriptionVi: z.string().optional(),
  
  // English fields
  metaTitleEn: z.string().optional(),
  metaDescriptionEn: z.string().optional(),
  keywordsEn: z.string().optional(),
  ogTitleEn: z.string().optional(),
  ogDescriptionEn: z.string().optional(),
  
  // Shared fields
  ogImageUrl: z.string().optional(),
  canonicalUrl: z.string().optional(),
  ogUrl: z.string().optional(),
  ogType: z.string().default("website"),
});

type SeoFormData = z.infer<typeof seoFormSchema>;

export default function SeoManagement() {
  const { language: currentLanguage } = useLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedPage, setSelectedPage] = useState("home");
  const [isUploading, setIsUploading] = useState(false);

  const text = {
    vi: {
      title: "Quản Lý SEO & Open Graph",
      subtitle: "Quản lý metadata SEO và Open Graph cho từng trang",
      pageSelect: "Chọn trang:",
      
      viSection: "Tiếng Việt",
      enSection: "English",
      sharedSection: "Thông Tin Chung",
      
      metaTitle: "Tiêu đề Meta",
      metaDescription: "Mô tả Meta",
      keywords: "Từ khóa (phân cách bằng dấu phẩy)",
      ogTitle: "Tiêu đề Open Graph",
      ogDescription: "Mô tả Open Graph",
      
      ogImageUrl: "URL Ảnh Open Graph",
      canonicalUrl: "URL Canonical (Optional)",
      ogUrl: "URL Open Graph",
      ogType: "Loại Open Graph",
      
      save: "Lưu",
      saving: "Đang lưu...",
      success: "Đã cập nhật thành công",
      error: "Có lỗi xảy ra",
      uploadImage: "Upload",
      
      website: "Trang web",
      article: "Bài viết",
    },
    en: {
      title: "SEO & Open Graph Management",
      subtitle: "Manage SEO metadata and Open Graph for each page",
      pageSelect: "Select page:",
      
      viSection: "Vietnamese",
      enSection: "English",
      sharedSection: "Shared Information",
      
      metaTitle: "Meta Title",
      metaDescription: "Meta Description",
      keywords: "Keywords (comma separated)",
      ogTitle: "Open Graph Title",
      ogDescription: "Open Graph Description",
      
      ogImageUrl: "Open Graph Image URL",
      canonicalUrl: "Canonical URL (Optional)",
      ogUrl: "Open Graph URL",
      ogType: "Open Graph Type",
      
      save: "Save",
      saving: "Saving...",
      success: "Updated successfully",
      error: "An error occurred",
      uploadImage: "Upload",
      
      website: "Website",
      article: "Article",
    }
  };

  const t = text[currentLanguage];

  // Fetch SEO data for both languages
  const { data: seoDataVi } = useQuery<PageSeo>({
    queryKey: [`/api/seo/pages/${selectedPage}/vi`],
    enabled: !!selectedPage,
  });

  const { data: seoDataEn } = useQuery<PageSeo>({
    queryKey: [`/api/seo/pages/${selectedPage}/en`],
    enabled: !!selectedPage,
  });

  const form = useForm<SeoFormData>({
    resolver: zodResolver(seoFormSchema),
    defaultValues: {
      pageKey: selectedPage,
      metaTitleVi: "",
      metaDescriptionVi: "",
      keywordsVi: "",
      ogTitleVi: "",
      ogDescriptionVi: "",
      metaTitleEn: "",
      metaDescriptionEn: "",
      keywordsEn: "",
      ogTitleEn: "",
      ogDescriptionEn: "",
      ogImageUrl: "",
      canonicalUrl: "",
      ogUrl: "",
      ogType: "website",
    },
  });

  // Update form when data changes
  useEffect(() => {
    if (seoDataVi || seoDataEn) {
      form.reset({
        pageKey: selectedPage,
        // Vietnamese data
        metaTitleVi: seoDataVi?.metaTitle || "",
        metaDescriptionVi: seoDataVi?.metaDescription || "",
        keywordsVi: seoDataVi?.keywords || "",
        ogTitleVi: seoDataVi?.ogTitle || "",
        ogDescriptionVi: seoDataVi?.ogDescription || "",
        // English data
        metaTitleEn: seoDataEn?.metaTitle || "",
        metaDescriptionEn: seoDataEn?.metaDescription || "",
        keywordsEn: seoDataEn?.keywords || "",
        ogTitleEn: seoDataEn?.ogTitle || "",
        ogDescriptionEn: seoDataEn?.ogDescription || "",
        // Shared data (use Vietnamese as primary, fallback to English)
        ogImageUrl: seoDataVi?.ogImageUrl || seoDataEn?.ogImageUrl || "",
        canonicalUrl: seoDataVi?.canonicalUrl || seoDataEn?.canonicalUrl || "",
        ogUrl: seoDataVi?.ogUrl || seoDataEn?.ogUrl || "",
        ogType: seoDataVi?.ogType || seoDataEn?.ogType || "website",
      });
    }
  }, [seoDataVi, seoDataEn, selectedPage, form]);

  const handleUploadComplete = async (result: {
    successful: Array<{ uploadURL: string }>;
    failed?: Array<{ error: any }>;
  }) => {
    setIsUploading(true);
    try {
      if (result.successful && result.successful.length > 0) {
        const uploadURL = result.successful[0].uploadURL;
        form.setValue("ogImageUrl", uploadURL);
        
        toast({
          title: "Upload thành công",
          description: "Ảnh Open Graph đã được upload.",
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
    mutationFn: async (data: SeoFormData) => {
      // Save Vietnamese version
      await apiRequest("PUT", `/api/seo/pages`, {
        pageKey: data.pageKey,
        language: "vi",
        metaTitle: data.metaTitleVi,
        metaDescription: data.metaDescriptionVi,
        keywords: data.keywordsVi,
        ogTitle: data.ogTitleVi,
        ogDescription: data.ogDescriptionVi,
        ogImageUrl: data.ogImageUrl,
        canonicalUrl: data.canonicalUrl,
        ogUrl: data.ogUrl,
        ogType: data.ogType,
        noIndex: false,
      });

      // Save English version
      await apiRequest("PUT", `/api/seo/pages`, {
        pageKey: data.pageKey,
        language: "en",
        metaTitle: data.metaTitleEn,
        metaDescription: data.metaDescriptionEn,
        keywords: data.keywordsEn,
        ogTitle: data.ogTitleEn,
        ogDescription: data.ogDescriptionEn,
        ogImageUrl: data.ogImageUrl,
        canonicalUrl: data.canonicalUrl,
        ogUrl: data.ogUrl,
        ogType: data.ogType,
        noIndex: false,
      });
    },
    onSuccess: () => {
      toast({
        title: t.success,
        description: "Đã lưu SEO cho cả 2 ngôn ngữ",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/seo/pages/${selectedPage}/vi`] });
      queryClient.invalidateQueries({ queryKey: [`/api/seo/pages/${selectedPage}/en`] });
    },
    onError: (error: any) => {
      toast({
        title: t.error,
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: SeoFormData) => {
    saveMutation.mutate(data);
  };

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-white text-2xl">{t.title}</CardTitle>
          <CardDescription className="text-zinc-400">{t.subtitle}</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Page Selection */}
          <div className="mb-6">
            <label className="text-sm font-medium text-white mb-2 block">{t.pageSelect}</label>
            <Select value={selectedPage} onValueChange={setSelectedPage}>
              <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white max-w-md">
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

          {/* Bilingual SEO Form */}
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Vietnamese Section */}
                <div className="space-y-6 p-6 bg-zinc-800/50 rounded-lg border border-zinc-700">
                  <h3 className="text-xl font-semibold text-yellow-400 flex items-center gap-2">
                    🇻🇳 {t.viSection}
                  </h3>
                  
                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="metaTitleVi"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-white">{t.metaTitle} (VI)</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder="Hum's Pizza | Gắn Kết Yêu Thương..."
                              className="bg-zinc-800 border-zinc-700 text-white"
                              data-testid="input-meta-title-vi"
                            />
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
                          <FormLabel className="text-white">{t.metaDescription} (VI)</FormLabel>
                          <FormControl>
                            <Textarea
                              {...field}
                              placeholder="Khám phá những chiếc pizza tuyệt vời..."
                              className="bg-zinc-800 border-zinc-700 text-white"
                              rows={3}
                              data-testid="textarea-meta-description-vi"
                            />
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
                          <FormLabel className="text-white">{t.keywords} (VI)</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder="pizza, pizza Ý, nhà hàng pizza, Bình Dương..."
                              className="bg-zinc-800 border-zinc-700 text-white"
                              data-testid="input-keywords-vi"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="ogTitleVi"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-white">{t.ogTitle} (VI)</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder="Hum's Pizza | Gắn Kết Yêu Thương..."
                              className="bg-zinc-800 border-zinc-700 text-white"
                              data-testid="input-og-title-vi"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="ogDescriptionVi"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-white">{t.ogDescription} (VI)</FormLabel>
                          <FormControl>
                            <Textarea
                              {...field}
                              placeholder="Hum's Pizza | Nhà hàng pizza phong cách Chicago & Ý..."
                              className="bg-zinc-800 border-zinc-700 text-white"
                              rows={3}
                              data-testid="textarea-og-description-vi"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* English Section */}
                <div className="space-y-6 p-6 bg-zinc-800/50 rounded-lg border border-zinc-700">
                  <h3 className="text-xl font-semibold text-yellow-400 flex items-center gap-2">
                    🇬🇧 {t.enSection}
                  </h3>
                  
                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="metaTitleEn"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-white">{t.metaTitle} (EN)</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder="Hum's Pizza | Connecting Hearts..."
                              className="bg-zinc-800 border-zinc-700 text-white"
                              data-testid="input-meta-title-en"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="metaDescriptionEn"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-white">{t.metaDescription} (EN)</FormLabel>
                          <FormControl>
                            <Textarea
                              {...field}
                              placeholder="Discover amazing pizzas at Hum's Pizza..."
                              className="bg-zinc-800 border-zinc-700 text-white"
                              rows={3}
                              data-testid="textarea-meta-description-en"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="keywordsEn"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-white">{t.keywords} (EN)</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder="pizza, Italian pizza, pizza restaurant, Binh Duong..."
                              className="bg-zinc-800 border-zinc-700 text-white"
                              data-testid="input-keywords-en"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="ogTitleEn"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-white">{t.ogTitle} (EN)</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder="Hum's Pizza | Connecting Hearts..."
                              className="bg-zinc-800 border-zinc-700 text-white"
                              data-testid="input-og-title-en"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="ogDescriptionEn"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-white">{t.ogDescription} (EN)</FormLabel>
                          <FormControl>
                            <Textarea
                              {...field}
                              placeholder="Hum's Pizza | Connecting Hearts, Authentic Vietnamese Taste..."
                              className="bg-zinc-800 border-zinc-700 text-white"
                              rows={3}
                              data-testid="textarea-og-description-en"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </div>

              {/* Shared Section */}
              <div className="space-y-6 p-6 bg-zinc-800/50 rounded-lg border border-zinc-700">
                <h3 className="text-xl font-semibold text-yellow-400">{t.sharedSection}</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="ogImageUrl"
                    render={({ field }) => (
                      <FormItem className="md:col-span-2">
                        <FormLabel className="text-white">{t.ogImageUrl}</FormLabel>
                        <FormControl>
                          <div className="space-y-3">
                            <div className="flex gap-2">
                              <Input
                                {...field}
                                placeholder="/api/assets/..."
                                className="bg-zinc-800 border-zinc-700 text-white flex-1"
                                data-testid="input-og-image-url"
                              />
                              <ObjectUploader
                                maxNumberOfFiles={1}
                                maxFileSize={10485760}
                                onComplete={handleUploadComplete}
                                buttonClassName="border-zinc-700 text-white hover:bg-zinc-700 px-4"
                              >
                                <div className="flex items-center gap-2">
                                  <ImageIcon className="w-4 h-4" />
                                  <span>{isUploading ? "Uploading..." : t.uploadImage}</span>
                                </div>
                              </ObjectUploader>
                            </div>
                            
                            {field.value && (
                              <div className="relative">
                                <img
                                  src={field.value}
                                  alt="OG Preview"
                                  className="w-full max-w-2xl h-48 object-cover rounded-lg border border-zinc-700"
                                  onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    target.style.display = 'none';
                                  }}
                                />
                                <div className="mt-2 text-xs text-zinc-400">
                                  Khuyến nghị: 1200x630px, tối đa 10MB, định dạng JPG/PNG/WebP
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
                    name="canonicalUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-white">{t.canonicalUrl}</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="https://humspizza.com/..."
                            className="bg-zinc-800 border-zinc-700 text-white"
                            data-testid="input-canonical-url"
                          />
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
                        <FormLabel className="text-white">{t.ogUrl}</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="https://humspizza.com/..."
                            className="bg-zinc-800 border-zinc-700 text-white"
                            data-testid="input-og-url"
                          />
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
                        <FormLabel className="text-white">{t.ogType}</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white">
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="bg-zinc-800 border-zinc-700">
                            <SelectItem value="website" className="text-white">{t.website}</SelectItem>
                            <SelectItem value="article" className="text-white">{t.article}</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Save Button */}
              <div className="flex justify-end">
                <Button
                  type="submit"
                  disabled={saveMutation.isPending}
                  className="bg-yellow-500 hover:bg-yellow-600 text-black font-semibold px-8"
                  data-testid="button-save"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {saveMutation.isPending ? t.saving : t.save}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
