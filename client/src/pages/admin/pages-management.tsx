import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

// Import the original components but without navigation headers
import { Suspense, lazy } from "react";
const AboutManagement = lazy(() => import("./about-management"));
const HomeManagement = lazy(() => import("./home-management"));
const SeoManagement = lazy(() => import("./seo-management"));

export default function PagesManagement() {
  const { language } = useLanguage();
  const [activeTab, setActiveTab] = useState("about");

  const t = {
    vi: {
      title: "Quản Lý Trang",
      subtitle: "Quản lý nội dung các trang website",
      aboutTab: "Quản Lý Giới Thiệu",
      homeTab: "Quản Lý Trang Chủ",
      seoTab: "SEO & Open Graph"
    },
    en: {
      title: "Pages Management",
      subtitle: "Manage website pages content",
      aboutTab: "About Management",
      homeTab: "Homepage Management",
      seoTab: "SEO & Open Graph"
    }
  };

  const text = t[language];

  return (
    <div className="container mx-auto py-8">

      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-white">{text.title}</CardTitle>
          <CardDescription className="text-zinc-400">
            {text.subtitle}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3 bg-zinc-800">
              <TabsTrigger 
                value="about" 
                className="data-[state=active]:bg-amber-600 data-[state=active]:text-black"
                data-testid="tab-about-management"
              >
                {text.aboutTab}
              </TabsTrigger>
              <TabsTrigger 
                value="home" 
                className="data-[state=active]:bg-amber-600 data-[state=active]:text-black"
                data-testid="tab-home-management"
              >
                {text.homeTab}
              </TabsTrigger>
              <TabsTrigger 
                value="seo" 
                className="data-[state=active]:bg-amber-600 data-[state=active]:text-black"
                data-testid="tab-seo-management"
              >
                {text.seoTab}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="about" className="mt-6">
              <Suspense fallback={<div className="text-white">Đang tải...</div>}>
                <AboutManagement />
              </Suspense>
            </TabsContent>

            <TabsContent value="home" className="mt-6">
              <Suspense fallback={<div className="text-white">Đang tải...</div>}>
                <HomeManagement />
              </Suspense>
            </TabsContent>

            <TabsContent value="seo" className="mt-6">
              <Suspense fallback={<div className="text-white">Đang tải...</div>}>
                <SeoManagement />
              </Suspense>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}