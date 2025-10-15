import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { ObjectUploader } from "@/components/ObjectUploader";
import { apiRequest } from "@/lib/queryClient";
import type { AboutContent, InsertAboutContent } from "@shared/schema";
import { useLanguage } from "@/contexts/LanguageContext";

export default function AboutManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { t } = useLanguage();
  
  const [formData, setFormData] = useState<Partial<InsertAboutContent>>({
    heroTitle: "",
    heroTitleVi: "",
    heroSubtitle: "",
    heroSubtitleVi: "",
    storyTitle: "",
    storyTitleVi: "",
    storyContent: "",
    storyContentVi: "",
    storyImageUrl: "",
    statsRecipes: "10+",
    statsServed: "5K+",
    statsFresh: "100%",
    statsSatisfaction: "95%",
    statsRecipesLabel: "",
    statsRecipesLabelVi: "",
    statsServedLabel: "",
    statsServedLabelVi: "",
    statsFreshLabel: "",
    statsFreshLabelVi: "",
    statsSatisfactionLabel: "",
    statsSatisfactionLabelVi: "",
    visionTitle: "",
    visionTitleVi: "",
    visionContent: "",
    visionContentVi: "",
    missionTitle: "",
    missionTitleVi: "",
    missionContent: "",
    missionContentVi: "",
    valuesTitle: "",
    valuesTitleVi: "",
    valuesContent: "",
    valuesContentVi: "",
    teamTitle: "",
    teamTitleVi: "",
    member1Name: "",
    member1Title: "",
    member1TitleVi: "",
    member1Description: "",
    member1DescriptionVi: "",
    member1ImageUrl: "",
    member2Name: "",
    member2Title: "",
    member2TitleVi: "",
    member2Description: "",
    member2DescriptionVi: "",
    member2ImageUrl: "",
    member3Name: "",
    member3Title: "",
    member3TitleVi: "",
    member3Description: "",
    member3DescriptionVi: "",
    member3ImageUrl: "",
    storyImageUrl2: "",
  });

  // Fetch existing about content
  const { data: aboutContent, isLoading } = useQuery<AboutContent>({
    queryKey: ["/api/about-content"],
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async (data: Partial<InsertAboutContent>) => {
      const response = await fetch("/api/about-content", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to update content");
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Thành công",
        description: "Nội dung About Us đã được cập nhật!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/about-content"] });
    },
    onError: (error: any) => {
      toast({
        title: "Lỗi",
        description: error.message || "Có lỗi xảy ra khi cập nhật nội dung",
        variant: "destructive",
      });
    },
  });

  // Load existing data when available
  useEffect(() => {
    if (aboutContent) {
      setFormData({
        heroTitle: aboutContent.heroTitle,
        heroTitleVi: aboutContent.heroTitleVi,
        heroSubtitle: aboutContent.heroSubtitle,
        heroSubtitleVi: aboutContent.heroSubtitleVi,
        storyTitle: aboutContent.storyTitle,
        storyTitleVi: aboutContent.storyTitleVi,
        storyContent: aboutContent.storyContent,
        storyContentVi: aboutContent.storyContentVi,
        storyImageUrl: aboutContent.storyImageUrl || "",
        statsRecipes: aboutContent.statsRecipes || "10+",
        statsServed: aboutContent.statsServed || "5K+",
        statsFresh: aboutContent.statsFresh || "100%",
        statsSatisfaction: aboutContent.statsSatisfaction || "95%",
        statsRecipesLabel: aboutContent.statsRecipesLabel,
        statsRecipesLabelVi: aboutContent.statsRecipesLabelVi,
        statsServedLabel: aboutContent.statsServedLabel,
        statsServedLabelVi: aboutContent.statsServedLabelVi,
        statsFreshLabel: aboutContent.statsFreshLabel,
        statsFreshLabelVi: aboutContent.statsFreshLabelVi,
        statsSatisfactionLabel: aboutContent.statsSatisfactionLabel,
        statsSatisfactionLabelVi: aboutContent.statsSatisfactionLabelVi,
        visionTitle: aboutContent.visionTitle,
        visionTitleVi: aboutContent.visionTitleVi,
        visionContent: aboutContent.visionContent,
        visionContentVi: aboutContent.visionContentVi,
        missionTitle: aboutContent.missionTitle,
        missionTitleVi: aboutContent.missionTitleVi,
        missionContent: aboutContent.missionContent,
        missionContentVi: aboutContent.missionContentVi,
        valuesTitle: aboutContent.valuesTitle,
        valuesTitleVi: aboutContent.valuesTitleVi,
        valuesContent: aboutContent.valuesContent,
        valuesContentVi: aboutContent.valuesContentVi,
        teamTitle: aboutContent.teamTitle,
        teamTitleVi: aboutContent.teamTitleVi,
        member1Name: aboutContent.member1Name,
        member1Title: aboutContent.member1Title,
        member1TitleVi: aboutContent.member1TitleVi,
        member1Description: aboutContent.member1Description,
        member1DescriptionVi: aboutContent.member1DescriptionVi,
        member1ImageUrl: aboutContent.member1ImageUrl || "",
        member2Name: aboutContent.member2Name,
        member2Title: aboutContent.member2Title,
        member2TitleVi: aboutContent.member2TitleVi,
        member2Description: aboutContent.member2Description,
        member2DescriptionVi: aboutContent.member2DescriptionVi,
        member2ImageUrl: aboutContent.member2ImageUrl || "",
        member3Name: aboutContent.member3Name,
        member3Title: aboutContent.member3Title,
        member3TitleVi: aboutContent.member3TitleVi,
        member3Description: aboutContent.member3Description,
        member3DescriptionVi: aboutContent.member3DescriptionVi,
        member3ImageUrl: aboutContent.member3ImageUrl || "",
        storyImageUrl2: aboutContent.storyImageUrl2 || "",
      });
    }
  }, [aboutContent]);

  const handleInputChange = (field: keyof InsertAboutContent, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate(formData);
  };

  const handleImageUpload = async () => {
    const response = await fetch("/api/news-images/upload", {
      method: "POST",
      headers: {
        'Content-Type': 'application/json',
      },
    });
    const data = await response.json();
    return {
      method: "PUT" as const,
      url: data.uploadURL,
    };
  };

  const handleImageComplete = (result: { successful: Array<{ uploadURL: string }> }, field: keyof InsertAboutContent) => {
    if (result.successful && result.successful[0]) {
      const uploadURL = result.successful[0].uploadURL;
      if (uploadURL) {
        // Use the normalized URL directly from ObjectUploader
        handleInputChange(field, uploadURL);
        toast({
          title: "Thành công",
          description: "Hình ảnh đã được tải lên!",
        });
      }
    }
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
          <h1 className="text-3xl font-bold mb-2">{t("about.management.title")}</h1>
          <p className="text-muted-foreground">
            {t("about.management.subtitle")}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          <Tabs defaultValue="hero" className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="hero">Hero Section</TabsTrigger>
              <TabsTrigger value="story">{t("about.story.title")}</TabsTrigger>
              <TabsTrigger value="stats">{t("about.tabs.statistics")}</TabsTrigger>
              <TabsTrigger value="philosophy">{t("about.tabs.philosophy")}</TabsTrigger>
              <TabsTrigger value="team">{t("about.tabs.team")}</TabsTrigger>
            </TabsList>

            <TabsContent value="hero" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Hero Section</CardTitle>
                  <CardDescription>Phần tiêu đề chính của trang About Us</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="heroTitle">{t("about.story.titleEn")}</Label>
                      <Input
                        id="heroTitle"
                        value={formData.heroTitle || ""}
                        onChange={(e) => handleInputChange("heroTitle", e.target.value)}
                        placeholder="About Hum's Pizza"
                        data-testid="input-hero-title-en"
                      />
                    </div>
                    <div>
                      <Label htmlFor="heroTitleVi">{t("about.story.titleVi")}</Label>
                      <Input
                        id="heroTitleVi"
                        value={formData.heroTitleVi || ""}
                        onChange={(e) => handleInputChange("heroTitleVi", e.target.value)}
                        placeholder="Giới Thiệu Hum's Pizza"
                        data-testid="input-hero-title-vi"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="heroSubtitle">Phụ đề (English)</Label>
                      <Textarea
                        id="heroSubtitle"
                        value={formData.heroSubtitle || ""}
                        onChange={(e) => handleInputChange("heroSubtitle", e.target.value)}
                        rows={3}
                        placeholder="Where authentic Vietnamese flavors meet modern culinary artistry..."
                        data-testid="textarea-hero-subtitle-en"
                      />
                    </div>
                    <div>
                      <Label htmlFor="heroSubtitleVi">Phụ đề (Tiếng Việt)</Label>
                      <Textarea
                        id="heroSubtitleVi"
                        value={formData.heroSubtitleVi || ""}
                        onChange={(e) => handleInputChange("heroSubtitleVi", e.target.value)}
                        rows={3}
                        placeholder="Nơi pizza thủ công gặp gỡ linh hồn Việt Nam..."
                        data-testid="textarea-hero-subtitle-vi"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="story" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Câu Chuyện Của Chúng Tôi</CardTitle>
                  <CardDescription>Phần kể về lịch sử và câu chuyện nhà hàng</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="storyTitle">Tiêu đề (English)</Label>
                      <Input
                        id="storyTitle"
                        value={formData.storyTitle || ""}
                        onChange={(e) => handleInputChange("storyTitle", e.target.value)}
                        placeholder="Our Story"
                        data-testid="input-story-title-en"
                      />
                    </div>
                    <div>
                      <Label htmlFor="storyTitleVi">Tiêu đề (Tiếng Việt)</Label>
                      <Input
                        id="storyTitleVi"
                        value={formData.storyTitleVi || ""}
                        onChange={(e) => handleInputChange("storyTitleVi", e.target.value)}
                        placeholder="Câu Chuyện Của Chúng Tôi"
                        data-testid="input-story-title-vi"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="storyContent">Nội dung (English)</Label>
                      <Textarea
                        id="storyContent"
                        value={formData.storyContent || ""}
                        onChange={(e) => handleInputChange("storyContent", e.target.value)}
                        rows={8}
                        placeholder="Hum's Pizza began from a small shop..."
                        data-testid="textarea-story-content-en"
                      />
                    </div>
                    <div>
                      <Label htmlFor="storyContentVi">Nội dung (Tiếng Việt)</Label>
                      <Textarea
                        id="storyContentVi"
                        value={formData.storyContentVi || ""}
                        onChange={(e) => handleInputChange("storyContentVi", e.target.value)}
                        rows={8}
                        placeholder="Hum's Pizza bắt đầu từ một cửa hàng nhỏ..."
                        data-testid="textarea-story-content-vi"
                      />
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <Label>Hình ảnh câu chuyện 1</Label>
                      <div className="flex items-center gap-4 mt-2">
                        {formData.storyImageUrl && (
                          <img
                            src={formData.storyImageUrl}
                            alt="Story Image 1"
                            className="w-24 h-24 object-cover rounded-md"
                          />
                        )}
                        <ObjectUploader
                          onGetUploadParameters={handleImageUpload}
                          onComplete={(result) => handleImageComplete(result, "storyImageUrl")}
                          maxFileSize={10485760}
                          buttonClassName="flex items-center gap-2"
                        >
                          <span>Tải lên hình ảnh câu chuyện 1</span>
                        </ObjectUploader>
                      </div>
                    </div>

                    <div>
                      <Label>Hình ảnh câu chuyện 2</Label>
                      <div className="flex items-center gap-4 mt-2">
                        {formData.storyImageUrl2 && (
                          <img
                            src={formData.storyImageUrl2}
                            alt="Story Image 2"
                            className="w-24 h-24 object-cover rounded-md"
                          />
                        )}
                        <ObjectUploader
                          onGetUploadParameters={handleImageUpload}
                          onComplete={(result) => handleImageComplete(result, "storyImageUrl2")}
                          maxFileSize={10485760}
                          buttonClassName="flex items-center gap-2"
                        >
                          <span>Tải lên hình ảnh câu chuyện 2</span>
                        </ObjectUploader>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="stats" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>{t("about.stats.title")}</CardTitle>
                  <CardDescription>{t("about.stats.subtitle")}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {[
                    { key: 'Recipes', field: 'recipes' },
                    { key: 'Served', field: 'served' },
                    { key: 'Fresh', field: 'fresh' },
                    { key: 'Satisfaction', field: 'satisfaction' }
                  ].map(({ key, field }) => (
                    <div key={field} className="space-y-2">
                      <Separator />
                      <h4 className="font-semibold">{key}</h4>
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <Label htmlFor={`stats${key}`}>Con số</Label>
                          <Input
                            id={`stats${key}`}
                            value={formData[`stats${key}` as keyof InsertAboutContent] as string || ""}
                            onChange={(e) => handleInputChange(`stats${key}` as keyof InsertAboutContent, e.target.value)}
                            placeholder="10+"
                            data-testid={`input-stats-${field}-value`}
                          />
                        </div>
                        <div>
                          <Label htmlFor={`stats${key}Label`}>Mô tả (English)</Label>
                          <Input
                            id={`stats${key}Label`}
                            value={formData[`stats${key}Label` as keyof InsertAboutContent] as string || ""}
                            onChange={(e) => handleInputChange(`stats${key}Label` as keyof InsertAboutContent, e.target.value)}
                            placeholder="Special Pizza Recipes"
                            data-testid={`input-stats-${field}-label-en`}
                          />
                        </div>
                        <div>
                          <Label htmlFor={`stats${key}LabelVi`}>Mô tả (Tiếng Việt)</Label>
                          <Input
                            id={`stats${key}LabelVi`}
                            value={formData[`stats${key}LabelVi` as keyof InsertAboutContent] as string || ""}
                            onChange={(e) => handleInputChange(`stats${key}LabelVi` as keyof InsertAboutContent, e.target.value)}
                            placeholder="Công Thức Pizza Đặc Biệt"
                            data-testid={`input-stats-${field}-label-vi`}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="philosophy" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>{t("about.philosophy.title")}</CardTitle>
                  <CardDescription>{t("about.philosophy.subtitle")}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {[
                    { key: 'vision', title: t("about.vision.title") },
                    { key: 'mission', title: t("about.mission.title") },
                    { key: 'values', title: t("about.values.title") }
                  ].map(({ key, title }) => (
                    <div key={key} className="space-y-4">
                      <Separator />
                      <h4 className="font-semibold">{title}</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor={`${key}Title`}>Tiêu đề (English)</Label>
                          <Input
                            id={`${key}Title`}
                            value={formData[`${key}Title` as keyof InsertAboutContent] as string || ""}
                            onChange={(e) => handleInputChange(`${key}Title` as keyof InsertAboutContent, e.target.value)}
                            placeholder={key.charAt(0).toUpperCase() + key.slice(1)}
                            data-testid={`input-${key}-title-en`}
                          />
                        </div>
                        <div>
                          <Label htmlFor={`${key}TitleVi`}>Tiêu đề (Tiếng Việt)</Label>
                          <Input
                            id={`${key}TitleVi`}
                            value={formData[`${key}TitleVi` as keyof InsertAboutContent] as string || ""}
                            onChange={(e) => handleInputChange(`${key}TitleVi` as keyof InsertAboutContent, e.target.value)}
                            placeholder={title}
                            data-testid={`input-${key}-title-vi`}
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor={`${key}Content`}>Nội dung (English)</Label>
                          <Textarea
                            id={`${key}Content`}
                            value={formData[`${key}Content` as keyof InsertAboutContent] as string || ""}
                            onChange={(e) => handleInputChange(`${key}Content` as keyof InsertAboutContent, e.target.value)}
                            rows={4}
                            placeholder={`${title} content...`}
                            data-testid={`textarea-${key}-content-en`}
                          />
                        </div>
                        <div>
                          <Label htmlFor={`${key}ContentVi`}>Nội dung (Tiếng Việt)</Label>
                          <Textarea
                            id={`${key}ContentVi`}
                            value={formData[`${key}ContentVi` as keyof InsertAboutContent] as string || ""}
                            onChange={(e) => handleInputChange(`${key}ContentVi` as keyof InsertAboutContent, e.target.value)}
                            rows={4}
                            placeholder={`Nội dung ${title.toLowerCase()}...`}
                            data-testid={`textarea-${key}-content-vi`}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="team" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Đội Ngũ</CardTitle>
                  <CardDescription>Thông tin về các thành viên trong đội ngũ</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="teamTitle">{t("about.labels.sectionTitle")}</Label>
                      <Input
                        id="teamTitle"
                        value={formData.teamTitle || ""}
                        onChange={(e) => handleInputChange("teamTitle", e.target.value)}
                        placeholder="Meet the Team"
                        data-testid="input-team-title-en"
                      />
                    </div>
                    <div>
                      <Label htmlFor="teamTitleVi">{t("about.labels.sectionTitleVi")}</Label>
                      <Input
                        id="teamTitleVi"
                        value={formData.teamTitleVi || ""}
                        onChange={(e) => handleInputChange("teamTitleVi", e.target.value)}
                        placeholder="Gặp Gỡ Đội Ngũ"
                        data-testid="input-team-title-vi"
                      />
                    </div>
                  </div>
                  
                  {[1, 2, 3].map((num) => (
                    <div key={num} className="space-y-4">
                      <Separator />
                      <h4 className="font-semibold">{t("about.labels.memberName")} {num}</h4>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor={`member${num}Name`}>{t("about.labels.memberName")}</Label>
                          <Input
                            id={`member${num}Name`}
                            value={formData[`member${num}Name` as keyof InsertAboutContent] as string || ""}
                            onChange={(e) => handleInputChange(`member${num}Name` as keyof InsertAboutContent, e.target.value)}
                            placeholder="Hùng Nguyễn"
                            data-testid={`input-member${num}-name`}
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor={`member${num}Title`}>{t("about.labels.titleEn")}</Label>
                            <Input
                              id={`member${num}Title`}
                              value={formData[`member${num}Title` as keyof InsertAboutContent] as string || ""}
                              onChange={(e) => handleInputChange(`member${num}Title` as keyof InsertAboutContent, e.target.value)}
                              placeholder="Head Chef & Founder"
                              data-testid={`input-member${num}-title-en`}
                            />
                          </div>
                          <div>
                            <Label htmlFor={`member${num}TitleVi`}>{t("about.labels.titleVi")}</Label>
                            <Input
                              id={`member${num}TitleVi`}
                              value={formData[`member${num}TitleVi` as keyof InsertAboutContent] as string || ""}
                              onChange={(e) => handleInputChange(`member${num}TitleVi` as keyof InsertAboutContent, e.target.value)}
                              placeholder="Bếp Trưởng & Người Sáng Lập"
                              data-testid={`input-member${num}-title-vi`}
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor={`member${num}Description`}>{t("about.labels.contentEn")}</Label>
                            <Textarea
                              id={`member${num}Description`}
                              value={formData[`member${num}Description` as keyof InsertAboutContent] as string || ""}
                              onChange={(e) => handleInputChange(`member${num}Description` as keyof InsertAboutContent, e.target.value)}
                              rows={3}
                              placeholder="With over 10 years of experience..."
                              data-testid={`textarea-member${num}-desc-en`}
                            />
                          </div>
                          <div>
                            <Label htmlFor={`member${num}DescriptionVi`}>{t("about.labels.contentVi")}</Label>
                            <Textarea
                              id={`member${num}DescriptionVi`}
                              value={formData[`member${num}DescriptionVi` as keyof InsertAboutContent] as string || ""}
                              onChange={(e) => handleInputChange(`member${num}DescriptionVi` as keyof InsertAboutContent, e.target.value)}
                              rows={3}
                              placeholder="Với hơn 10 năm kinh nghiệm..."
                              data-testid={`textarea-member${num}-desc-vi`}
                            />
                          </div>
                        </div>
                        <div>
                          <Label>Hình ảnh thành viên {num}</Label>
                          <div className="flex items-center gap-4 mt-2">
                            {formData[`member${num}ImageUrl` as keyof InsertAboutContent] && (
                              <img
                                src={formData[`member${num}ImageUrl` as keyof InsertAboutContent] as string}
                                alt={`Member ${num}`}
                                className="w-24 h-24 object-cover rounded-full"
                              />
                            )}
                            <ObjectUploader
                              onGetUploadParameters={handleImageUpload}
                              onComplete={(result) => handleImageComplete(result, `member${num}ImageUrl` as keyof InsertAboutContent)}
                              maxFileSize={10485760}
                              buttonClassName="flex items-center gap-2"
                            >
                              <span>{t("admin.uploadImage")}</span>
                            </ObjectUploader>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <div className="flex justify-end pt-6">
            <Button 
              type="submit" 
              disabled={updateMutation.isPending}
              data-testid="button-save-about-content"
            >
{updateMutation.isPending ? t("admin.saving") : t("about.update")}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}