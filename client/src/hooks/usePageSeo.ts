import { useQuery } from "@tanstack/react-query";
import { useLanguage } from "@/contexts/LanguageContext";
import type { PageSeo } from "@shared/schema";

interface PageSeoDefaults {
  metaTitle?: string;
  metaDescription?: string;
  keywords?: string;
  canonicalUrl?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  ogUrl?: string;
  ogType?: string;
}

export function usePageSeo(pageKey: string, defaults?: PageSeoDefaults) {
  const { language } = useLanguage();

  const { data: seoData } = useQuery<PageSeo | null>({
    queryKey: [`/api/seo/pages/${pageKey}/${language}`],
    queryFn: async () => {
      const response = await fetch(`/api/seo/pages/${pageKey}/${language}`);
      if (!response.ok) {
        // Return null if not found - will use defaults
        return null;
      }
      return response.json();
    },
    // Don't show error toast if SEO data not found
    retry: false,
  });

  // Merge database data with defaults
  return {
    metaTitle: seoData?.metaTitle || defaults?.metaTitle || "",
    metaDescription: seoData?.metaDescription || defaults?.metaDescription || "",
    keywords: seoData?.keywords || defaults?.keywords || "",
    canonicalUrl: seoData?.canonicalUrl || defaults?.canonicalUrl || "",
    ogTitle: seoData?.ogTitle || defaults?.ogTitle || "",
    ogDescription: seoData?.ogDescription || defaults?.ogDescription || "",
    ogImage: seoData?.ogImageUrl || defaults?.ogImage || "",
    ogUrl: seoData?.ogUrl || defaults?.ogUrl || "",
    ogType: seoData?.ogType || defaults?.ogType || "website",
    noIndex: seoData?.noIndex || false,
  };
}
