import { useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';

interface SEOHeadProps {
  title?: string;
  description?: string;
  keywords?: string;
  canonicalUrl?: string;
  noIndex?: boolean;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  ogUrl?: string;
  ogType?: string;
}

export default function SEOHead({ 
  title, 
  description, 
  keywords, 
  canonicalUrl,
  noIndex = false,
  ogTitle,
  ogDescription,
  ogImage,
  ogUrl,
  ogType = 'website'
}: SEOHeadProps) {
  const { language } = useLanguage();
  
  // Default OG image fallback
  const defaultOgImage = `${window.location.origin}/public-objects/materials/og.bg.png`;
  const finalOgImage = ogImage || defaultOgImage;

  useEffect(() => {
    if (typeof document === 'undefined') return;

    // Update title
    if (title) {
      document.title = title;
    }

    // Update or create meta description
    if (description) {
      let metaDesc = document.querySelector('meta[name="description"]');
      if (!metaDesc) {
        metaDesc = document.createElement('meta');
        metaDesc.setAttribute('name', 'description');
        document.head.appendChild(metaDesc);
      }
      metaDesc.setAttribute('content', description);
    }

    // Update or create meta keywords
    if (keywords) {
      let metaKeywords = document.querySelector('meta[name="keywords"]');
      if (!metaKeywords) {
        metaKeywords = document.createElement('meta');
        metaKeywords.setAttribute('name', 'keywords');
        document.head.appendChild(metaKeywords);
      }
      metaKeywords.setAttribute('content', keywords);
    }

    // Update language meta tag
    let htmlLang = document.documentElement;
    htmlLang.setAttribute('lang', language === 'vi' ? 'vi' : 'en');

    // Add robots meta tag
    let robotsTag = document.querySelector('meta[name="robots"]');
    if (!robotsTag) {
      robotsTag = document.createElement('meta');
      robotsTag.setAttribute('name', 'robots');
      document.head.appendChild(robotsTag);
    }
    robotsTag.setAttribute('content', noIndex ? 'noindex, nofollow' : 'index, follow');

    // Add canonical URL
    if (canonicalUrl) {
      let canonicalTag = document.querySelector('link[rel="canonical"]');
      if (!canonicalTag) {
        canonicalTag = document.createElement('link');
        canonicalTag.setAttribute('rel', 'canonical');
        document.head.appendChild(canonicalTag);
      }
      canonicalTag.setAttribute('href', canonicalUrl);
    }

    // Add Open Graph meta tags
    if (ogTitle) {
      let ogTitleTag = document.querySelector('meta[property="og:title"]');
      if (!ogTitleTag) {
        ogTitleTag = document.createElement('meta');
        ogTitleTag.setAttribute('property', 'og:title');
        document.head.appendChild(ogTitleTag);
      }
      ogTitleTag.setAttribute('content', ogTitle);
    }

    if (ogDescription) {
      let ogDescTag = document.querySelector('meta[property="og:description"]');
      if (!ogDescTag) {
        ogDescTag = document.createElement('meta');
        ogDescTag.setAttribute('property', 'og:description');
        document.head.appendChild(ogDescTag);
      }
      ogDescTag.setAttribute('content', ogDescription);
    }

    // Always set OG image (use provided or default)
    let ogImageTag = document.querySelector('meta[property="og:image"]');
    if (!ogImageTag) {
      ogImageTag = document.createElement('meta');
      ogImageTag.setAttribute('property', 'og:image');
      document.head.appendChild(ogImageTag);
    }
    ogImageTag.setAttribute('content', finalOgImage);

    if (ogUrl) {
      let ogUrlTag = document.querySelector('meta[property="og:url"]');
      if (!ogUrlTag) {
        ogUrlTag = document.createElement('meta');
        ogUrlTag.setAttribute('property', 'og:url');
        document.head.appendChild(ogUrlTag);
      }
      ogUrlTag.setAttribute('content', ogUrl);
    }

    if (ogType) {
      let ogTypeTag = document.querySelector('meta[property="og:type"]');
      if (!ogTypeTag) {
        ogTypeTag = document.createElement('meta');
        ogTypeTag.setAttribute('property', 'og:type');
        document.head.appendChild(ogTypeTag);
      }
      ogTypeTag.setAttribute('content', ogType);
    }

    // Add Twitter Card meta tags for better Twitter sharing
    if (ogTitle) {
      let twitterTitleTag = document.querySelector('meta[name="twitter:title"]');
      if (!twitterTitleTag) {
        twitterTitleTag = document.createElement('meta');
        twitterTitleTag.setAttribute('name', 'twitter:title');
        document.head.appendChild(twitterTitleTag);
      }
      twitterTitleTag.setAttribute('content', ogTitle);
    }

    if (ogDescription) {
      let twitterDescTag = document.querySelector('meta[name="twitter:description"]');
      if (!twitterDescTag) {
        twitterDescTag = document.createElement('meta');
        twitterDescTag.setAttribute('name', 'twitter:description');
        document.head.appendChild(twitterDescTag);
      }
      twitterDescTag.setAttribute('content', ogDescription);
    }

    // Always set Twitter image (use provided or default)
    let twitterImageTag = document.querySelector('meta[name="twitter:image"]');
    if (!twitterImageTag) {
      twitterImageTag = document.createElement('meta');
      twitterImageTag.setAttribute('name', 'twitter:image');
      document.head.appendChild(twitterImageTag);
    }
    twitterImageTag.setAttribute('content', finalOgImage);

    // Add Twitter card type
    let twitterCardTag = document.querySelector('meta[name="twitter:card"]');
    if (!twitterCardTag) {
      twitterCardTag = document.createElement('meta');
      twitterCardTag.setAttribute('name', 'twitter:card');
      document.head.appendChild(twitterCardTag);
    }
    twitterCardTag.setAttribute('content', 'summary_large_image');

    // Cleanup function
    return () => {
      if (typeof document !== 'undefined') {
        const defaultTitle = language === 'vi' 
          ? "Hum's Pizza | Gắn Kết Yêu Thương, Đậm Đà Vị Việt"
          : "Hum's Pizza | Connecting Hearts, Authentic Vietnamese Taste";
        document.title = defaultTitle;
      }
    };
  }, [title, description, keywords, canonicalUrl, language, noIndex, ogTitle, ogDescription, finalOgImage, ogUrl, ogType]);

  return null;
}