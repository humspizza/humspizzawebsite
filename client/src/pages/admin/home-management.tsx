import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { InsertHomeContent } from "@shared/schema";
import { VideoUploader } from "@/components/VideoUploader";
import { VideoPreview } from "@/components/VideoPreview";
import { Upload, Link } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const API_BASE = "/api";

async function apiRequest(endpoint: string, options?: RequestInit) {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
    ...options,
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  return response.json();
}

export default function HomeManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { t } = useLanguage();
  const [formData, setFormData] = useState<Partial<InsertHomeContent>>({});
  const [heroVideoUrl, setHeroVideoUrl] = useState("");
  const [reservationVideoUrl, setReservationVideoUrl] = useState("");

  // Fetch current home content
  const { data: homeContent, isLoading } = useQuery({
    queryKey: ["/api/home-content"],
    queryFn: () => apiRequest("/home-content"),
    refetchOnWindowFocus: false,
  });

  // Fetch hero videos status
  const { data: videosStatus, isLoading: videosLoading, refetch: refetchVideos } = useQuery({
    queryKey: ["/api/hero-videos/status"],
    queryFn: () => apiRequest("/hero-videos/status"),
    refetchOnWindowFocus: false,
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: (updates: Partial<InsertHomeContent>) =>
      apiRequest("/home-content", {
        method: "PUT",
        body: JSON.stringify(updates),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/home-content"] });
      queryClient.invalidateQueries({ queryKey: ["/api/hero-videos/status"] });
      toast({
        title: "Thành công",
        description: "Nội dung trang chủ đã được cập nhật!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Lỗi",
        description: error.message || "Có lỗi xảy ra khi cập nhật",
        variant: "destructive",
      });
    },
  });

  // Initialize form data when content is loaded
  useEffect(() => {
    if (homeContent) {
      setFormData({
        heroTitle: homeContent.heroTitle || "",
        heroTitleVi: homeContent.heroTitleVi || "",
        featuredTitle: homeContent.featuredTitle || "",
        featuredTitleVi: homeContent.featuredTitleVi || "",
        featuredSubtitle: homeContent.featuredSubtitle || "",
        featuredSubtitleVi: homeContent.featuredSubtitleVi || "",
        reservationTitle: homeContent.reservationTitle || "",
        reservationTitleVi: homeContent.reservationTitleVi || "",
        reservationSubtitle: homeContent.reservationSubtitle || "",
        reservationSubtitleVi: homeContent.reservationSubtitleVi || "",
        reviewsTitle: homeContent.reviewsTitle || "",
        reviewsTitleVi: homeContent.reviewsTitleVi || "",
        reviewsSubtitle: homeContent.reviewsSubtitle || "",
        reviewsSubtitleVi: homeContent.reviewsSubtitleVi || "",
        blogTitle: homeContent.blogTitle || "",
        blogTitleVi: homeContent.blogTitleVi || "",
        blogSubtitle: homeContent.blogSubtitle || "",
        blogSubtitleVi: homeContent.blogSubtitleVi || "",
      });
    }
  }, [homeContent]);

  // Clear pending videos on page load (refresh without save should revert to old videos)
  // Remove auto-clear pending videos useEffect - let them stay for manual save
  // useEffect(() => {
  //   if (homeContent?.pendingHeroVideoUrl || homeContent?.pendingReservationVideoUrl) {
  //     // Auto-clear pending videos when page loads with pending state
  //     fetch("/api/cancel-pending-videos", {
  //       method: "POST",
  //       headers: {
  //         "Content-Type": "application/json"
  //       }
  //     }).then(() => {
  //       // Refresh content to show cleared pending state (silently)
  //       queryClient.invalidateQueries({ queryKey: ["/api/home-content"] });
  //       queryClient.invalidateQueries({ queryKey: ["/api/hero-videos/status"] });
  //     }).catch(() => {
  //       // Ignore errors
  //     });
  //   }
  // }, [homeContent?.pendingHeroVideoUrl, homeContent?.pendingReservationVideoUrl, queryClient]);


  const handleInputChange = (field: keyof InsertHomeContent, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Handle video URL paste for hero video
  const handleHeroVideoUrlSubmit = async () => {
    if (!heroVideoUrl.trim()) {
      toast({
        title: "Lỗi",
        description: "Vui lòng nhập URL video",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await apiRequest("/save-hero-video", {
        method: "POST",
        body: JSON.stringify({ 
          videoUrl: heroVideoUrl, 
          videoType: "hero" 
        }),
      });

      toast({
        title: "Thành công",
        description: "URL video đã được lưu. Bấm 'Lưu thay đổi' để áp dụng.",
      });

      setHeroVideoUrl(""); // Clear input
      queryClient.invalidateQueries({ queryKey: ["/api/hero-videos/status"] });
      refetchVideos();
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: error.message || "Không thể lưu URL video",
        variant: "destructive",
      });
    }
  };

  // Handle video URL paste for reservation video
  const handleReservationVideoUrlSubmit = async () => {
    if (!reservationVideoUrl.trim()) {
      toast({
        title: "Lỗi",
        description: "Vui lòng nhập URL video",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await apiRequest("/save-hero-video", {
        method: "POST",
        body: JSON.stringify({ 
          videoUrl: reservationVideoUrl, 
          videoType: "reservation" 
        }),
      });

      toast({
        title: "Thành công",
        description: "URL video đã được lưu. Bấm 'Lưu thay đổi' để áp dụng.",
      });

      setReservationVideoUrl(""); // Clear input
      queryClient.invalidateQueries({ queryKey: ["/api/hero-videos/status"] });
      refetchVideos();
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: error.message || "Không thể lưu URL video",
        variant: "destructive",
      });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Prevent Enter key from submitting form
    if (e.key === 'Enter') {
      e.preventDefault();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Prevent multiple submits while mutation is pending
    if (updateMutation.isPending) {
      return;
    }
    
    // Add flag to commit pending videos when saving
    const updateData = {
      ...formData,
      commitPendingVideos: true
    };
    
    updateMutation.mutate(updateData);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">Đang tải...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">{t("home.management.title")}</h1>
          <p className="text-muted-foreground">
            {t("home.management.subtitle")}
          </p>
        </div>

        <form onSubmit={handleSubmit} onKeyDown={handleKeyDown} className="space-y-8">
          {/* Hero Section */}
          <Card>
            <CardHeader>
              <CardTitle>Phần Hero (Banner Chính)</CardTitle>
              <CardDescription>Tiêu đề chính của trang chủ</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="heroTitle">{t("home.hero.titleEn")}</Label>
                  <Input
                    id="heroTitle"
                    value={formData.heroTitle || ""}
                    onChange={(e) => handleInputChange("heroTitle", e.target.value)}
                    placeholder="Connecting Hearts, Authentic Vietnamese Taste"
                    data-testid="input-hero-title-en"
                  />
                </div>
                <div>
                  <Label htmlFor="heroTitleVi">{t("home.hero.titleVi")}</Label>
                  <Input
                    id="heroTitleVi"
                    value={formData.heroTitleVi || ""}
                    onChange={(e) => handleInputChange("heroTitleVi", e.target.value)}
                    placeholder="Nơi pizza thủ công gặp gỡ hương vị Việt Nam"
                    data-testid="input-hero-title-vi"
                  />
                </div>
              </div>

              {/* Hero Video Upload Section */}
              <div className="border-t pt-6">
                <div className="flex items-center justify-between mb-4">
                  <Label className="text-base font-medium">{t("home.videoHero")}</Label>
                </div>
                
                {/* Current Videos Status */}
                {!videosLoading && videosStatus && (
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    {videosStatus.map((video: any) => (
                      <VideoPreview
                        key={video.type}
                        videoUrl={video.url}
                        fileName={video.fileName}
                        displayName={video.displayName}
                        fileSize={video.fileSize}
                        lastModified={video.lastModified}
                        exists={video.exists}
                        isPending={video.isPending}
                      />
                    ))}
                  </div>
                )}

                {/* Upload Section */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Hero Video */}
                  <div className="flex flex-col h-full">
                    <div className="flex-1 space-y-4">
                      <div>
                        <Label className="text-sm font-medium">{t("home.uploadMainVideo")}</Label>
                        <p className="text-sm text-muted-foreground mt-1">
                          {t("home.mainVideoDesc")}
                        </p>
                      </div>
                    </div>
                    <Tabs defaultValue="upload" className="mt-4">
                      <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="upload" data-testid="tab-upload-hero">
                          <Upload className="w-4 h-4 mr-2" />
                          Tải lên
                        </TabsTrigger>
                        <TabsTrigger value="url" data-testid="tab-url-hero">
                          <Link className="w-4 h-4 mr-2" />
                          Dùng URL
                        </TabsTrigger>
                      </TabsList>
                      <TabsContent value="upload" className="mt-4">
                        <VideoUploader
                          videoType="hero"
                          onComplete={(result) => {
                            if (result.success) {
                              toast({
                                title: "Video đã tải lên!",
                                description: "Video sẽ áp dụng khi bấm 'Lưu thay đổi' bên dưới",
                              });
                              queryClient.invalidateQueries({ queryKey: ["/api/hero-videos/status"] });
                              refetchVideos();
                            }
                          }}
                          buttonClassName="w-full"
                        >
                          <div className="flex items-center justify-center gap-2">
                            <Upload className="w-4 h-4" />
                            <span>{t("home.uploadMainBtn")}</span>
                          </div>
                        </VideoUploader>
                      </TabsContent>
                      <TabsContent value="url" className="mt-4 space-y-3">
                        <Input
                          placeholder="https://example.com/video.mp4"
                          value={heroVideoUrl}
                          onChange={(e) => setHeroVideoUrl(e.target.value)}
                          className="w-full"
                          data-testid="input-hero-video-url"
                        />
                        <Button 
                          onClick={handleHeroVideoUrlSubmit}
                          className="w-full"
                          data-testid="button-submit-hero-url"
                        >
                          <Link className="w-4 h-4 mr-2" />
                          Lưu URL Video
                        </Button>
                      </TabsContent>
                    </Tabs>
                  </div>

                  {/* Reservation Video */}
                  <div className="flex flex-col h-full">
                    <div className="flex-1 space-y-4">
                      <div>
                        <Label className="text-sm font-medium">{t("home.uploadReservationVideo")}</Label>
                        <p className="text-sm text-muted-foreground mt-1">
                          {t("home.reservationVideoDesc")}
                        </p>
                      </div>
                    </div>
                    <Tabs defaultValue="upload" className="mt-4">
                      <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="upload" data-testid="tab-upload-reservation">
                          <Upload className="w-4 h-4 mr-2" />
                          Tải lên
                        </TabsTrigger>
                        <TabsTrigger value="url" data-testid="tab-url-reservation">
                          <Link className="w-4 h-4 mr-2" />
                          Dùng URL
                        </TabsTrigger>
                      </TabsList>
                      <TabsContent value="upload" className="mt-4">
                        <VideoUploader
                          videoType="reservation"
                          onComplete={(result) => {
                            if (result.success) {
                              toast({
                                title: "Video đã tải lên!",
                                description: "Video sẽ áp dụng khi bấm 'Lưu thay đổi' bên dưới",
                              });
                              queryClient.invalidateQueries({ queryKey: ["/api/hero-videos/status"] });
                              refetchVideos();
                            }
                          }}
                          buttonClassName="w-full"
                        >
                          <div className="flex items-center justify-center gap-2">
                            <Upload className="w-4 h-4" />
                            <span>{t("home.uploadReservationBtn")}</span>
                          </div>
                        </VideoUploader>
                      </TabsContent>
                      <TabsContent value="url" className="mt-4 space-y-3">
                        <Input
                          placeholder="https://example.com/video.mp4"
                          value={reservationVideoUrl}
                          onChange={(e) => setReservationVideoUrl(e.target.value)}
                          className="w-full"
                          data-testid="input-reservation-video-url"
                        />
                        <Button 
                          onClick={handleReservationVideoUrlSubmit}
                          className="w-full"
                          data-testid="button-submit-reservation-url"
                        >
                          <Link className="w-4 h-4 mr-2" />
                          Lưu URL Video
                        </Button>
                      </TabsContent>
                    </Tabs>
                  </div>
                </div>
                <div className="mt-3 p-3 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    <strong>Lưu ý:</strong> Video sẽ được áp dụng khi bấm "Lưu thay đổi" bên dưới. 
                    Bạn có thể tải video từ máy (tối đa 200MB) hoặc dùng URL từ nguồn khác (CDN, YouTube, v.v.).
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Featured Section */}
          <Card>
            <CardHeader>
              <CardTitle>{t("home.featuredSection.title")}</CardTitle>
              <CardDescription>{t("home.featuredSection.subtitle")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="featuredTitle">{t("home.labels.titleEn")}</Label>
                  <Input
                    id="featuredTitle"
                    value={formData.featuredTitle || ""}
                    onChange={(e) => handleInputChange("featuredTitle", e.target.value)}
                    placeholder="Featured Dishes"
                    data-testid="input-featured-title-en"
                  />
                </div>
                <div>
                  <Label htmlFor="featuredTitleVi">{t("home.labels.titleVi")}</Label>
                  <Input
                    id="featuredTitleVi"
                    value={formData.featuredTitleVi || ""}
                    onChange={(e) => handleInputChange("featuredTitleVi", e.target.value)}
                    placeholder="Các Món Đặc Trưng"
                    data-testid="input-featured-title-vi"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="featuredSubtitle">{t("home.labels.subtitleEn")}</Label>
                  <Input
                    id="featuredSubtitle"
                    value={formData.featuredSubtitle || ""}
                    onChange={(e) => handleInputChange("featuredSubtitle", e.target.value)}
                    placeholder="Signature Delights"
                    data-testid="input-featured-subtitle-en"
                  />
                </div>
                <div>
                  <Label htmlFor="featuredSubtitleVi">{t("home.labels.subtitleVi")}</Label>
                  <Input
                    id="featuredSubtitleVi"
                    value={formData.featuredSubtitleVi || ""}
                    onChange={(e) => handleInputChange("featuredSubtitleVi", e.target.value)}
                    placeholder="Món Ăn Đặc Sắc"
                    data-testid="input-featured-subtitle-vi"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Reservation Section */}
          <Card>
            <CardHeader>
              <CardTitle>{t("home.reservationSection.title")}</CardTitle>
              <CardDescription>{t("home.reservationSection.subtitle")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="reservationTitle">{t("home.labels.titleEn")}</Label>
                  <Input
                    id="reservationTitle"
                    value={formData.reservationTitle || ""}
                    onChange={(e) => handleInputChange("reservationTitle", e.target.value)}
                    placeholder="Reserve Your Experience"
                    data-testid="input-reservation-title-en"
                  />
                </div>
                <div>
                  <Label htmlFor="reservationTitleVi">{t("home.labels.titleVi")}</Label>
                  <Input
                    id="reservationTitleVi"
                    value={formData.reservationTitleVi || ""}
                    onChange={(e) => handleInputChange("reservationTitleVi", e.target.value)}
                    placeholder="Đặt Bàn Trải Nghiệm"
                    data-testid="input-reservation-title-vi"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="reservationSubtitle">{t("home.labels.subtitleEn")}</Label>
                  <Input
                    id="reservationSubtitle"
                    value={formData.reservationSubtitle || ""}
                    onChange={(e) => handleInputChange("reservationSubtitle", e.target.value)}
                    placeholder="Book your table for an unforgettable culinary journey"
                    data-testid="input-reservation-subtitle-en"
                  />
                </div>
                <div>
                  <Label htmlFor="reservationSubtitleVi">{t("home.labels.subtitleVi")}</Label>
                  <Input
                    id="reservationSubtitleVi"
                    value={formData.reservationSubtitleVi || ""}
                    onChange={(e) => handleInputChange("reservationSubtitleVi", e.target.value)}
                    placeholder="Đặt bàn và để chúng tôi tạo nên hành trình ẩm thực khó quên"
                    data-testid="input-reservation-subtitle-vi"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Reviews Section */}
          <Card>
            <CardHeader>
              <CardTitle>{t("home.reviewsSection.title")}</CardTitle>
              <CardDescription>{t("home.reviewsSection.subtitle")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="reviewsTitle">{t("home.labels.titleEn")}</Label>
                  <Input
                    id="reviewsTitle"
                    value={formData.reviewsTitle || ""}
                    onChange={(e) => handleInputChange("reviewsTitle", e.target.value)}
                    placeholder="What Our Customers Say"
                    data-testid="input-reviews-title-en"
                  />
                </div>
                <div>
                  <Label htmlFor="reviewsTitleVi">{t("home.labels.titleVi")}</Label>
                  <Input
                    id="reviewsTitleVi"
                    value={formData.reviewsTitleVi || ""}
                    onChange={(e) => handleInputChange("reviewsTitleVi", e.target.value)}
                    placeholder="Khách Hàng Nói Gì"
                    data-testid="input-reviews-title-vi"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="reviewsSubtitle">{t("home.labels.subtitleEn")}</Label>
                  <Input
                    id="reviewsSubtitle"
                    value={formData.reviewsSubtitle || ""}
                    onChange={(e) => handleInputChange("reviewsSubtitle", e.target.value)}
                    placeholder="Authentic feedback from our valued customers"
                    data-testid="input-reviews-subtitle-en"
                  />
                </div>
                <div>
                  <Label htmlFor="reviewsSubtitleVi">{t("home.labels.subtitleVi")}</Label>
                  <Input
                    id="reviewsSubtitleVi"
                    value={formData.reviewsSubtitleVi || ""}
                    onChange={(e) => handleInputChange("reviewsSubtitleVi", e.target.value)}
                    placeholder="Những phản hồi chân thật từ khách hàng về trải nghiệm pizza thủ công tại Hum's Pizza"
                    data-testid="input-reviews-subtitle-vi"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Blog Section */}
          <Card>
            <CardHeader>
              <CardTitle>{t("home.blogSection.title")}</CardTitle>
              <CardDescription>{t("home.blogSection.subtitle")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="blogTitle">{t("home.labels.titleEn")}</Label>
                  <Input
                    id="blogTitle"
                    value={formData.blogTitle || ""}
                    onChange={(e) => handleInputChange("blogTitle", e.target.value)}
                    placeholder="Latest Stories"
                    data-testid="input-blog-title-en"
                  />
                </div>
                <div>
                  <Label htmlFor="blogTitleVi">{t("home.labels.titleVi")}</Label>
                  <Input
                    id="blogTitleVi"
                    value={formData.blogTitleVi || ""}
                    onChange={(e) => handleInputChange("blogTitleVi", e.target.value)}
                    placeholder="Câu Chuyện Mới Nhất"
                    data-testid="input-blog-title-vi"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="blogSubtitle">{t("home.labels.subtitleEn")}</Label>
                  <Input
                    id="blogSubtitle"
                    value={formData.blogSubtitle || ""}
                    onChange={(e) => handleInputChange("blogSubtitle", e.target.value)}
                    placeholder="Stay updated with our latest culinary adventures and restaurant news"
                    data-testid="input-blog-subtitle-en"
                  />
                </div>
                <div>
                  <Label htmlFor="blogSubtitleVi">{t("home.labels.subtitleVi")}</Label>
                  <Input
                    id="blogSubtitleVi"
                    value={formData.blogSubtitleVi || ""}
                    onChange={(e) => handleInputChange("blogSubtitleVi", e.target.value)}
                    placeholder="Cập nhật những cuộc phiêu lưu ẩm thực và tin tức nhà hàng"
                    data-testid="input-blog-subtitle-vi"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button 
              type="submit" 
              disabled={updateMutation.isPending}
              data-testid="button-save-home-content"
            >
              {updateMutation.isPending ? "Đang lưu..." : "Lưu thay đổi"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}