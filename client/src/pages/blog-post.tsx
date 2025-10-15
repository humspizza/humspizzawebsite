import { useQuery } from "@tanstack/react-query";
import { useRoute } from "wouter";
import { Calendar, User, ArrowLeft, Share2, Check } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { useLanguage } from "@/contexts/LanguageContext";
import { useContentTranslation } from "@/hooks/useContentTranslation";
import { useToast } from "@/hooks/use-toast";
import SEOHead from "@/components/SEOHead";
import type { BlogPost } from "@shared/schema";
import { useEffect, useState } from "react";
import { marked } from 'marked';

export default function BlogPostPage() {
  const { t, language } = useLanguage();
  const { getTranslatedContent } = useContentTranslation();
  const { toast } = useToast();
  const [match, params] = useRoute("/news/:slug");
  const [copied, setCopied] = useState(false);

  // Configure marked for image rendering
  const renderer = new marked.Renderer();
  renderer.image = function(token) {
    return `<img src="${token.href}" alt="${token.text || ''}" title="${token.title || ''}" class="w-full rounded-lg my-4" loading="lazy" />`;
  };
  
  marked.setOptions({
    renderer: renderer,
    breaks: true,
    gfm: true
  });

  // Function to convert *text* to **text** for bold formatting
  const formatBoldText = (text: string): string => {
    // Replace *text* with **text** for markdown bold
    return text.replace(/\*([^*\n]+)\*/g, '**$1**');
  };

  // Copy URL to clipboard function
  const copyToClipboard = async () => {
    try {
      // Create a shorter, cleaner URL for sharing
      const shareUrl = `${window.location.origin}/news/${params?.slug}`;
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      
      toast({
        title: language === 'vi' ? "Đã sao chép!" : "Copied!",
        description: language === 'vi' ? "URL đã được sao chép vào clipboard" : "URL copied to clipboard",
      });

      // Reset copied state after 2 seconds
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      // Fallback for older browsers
      const shareUrl = `${window.location.origin}/news/${params?.slug}`;
      const textArea = document.createElement('textarea');
      textArea.value = shareUrl;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      
      setCopied(true);
      toast({
        title: language === 'vi' ? "Đã sao chép!" : "Copied!",
        description: language === 'vi' ? "URL đã được sao chép vào clipboard" : "URL copied to clipboard",
      });
      
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const { data: post, isLoading, error } = useQuery<BlogPost>({
    queryKey: ["/api/blog-posts/slug", params?.slug],
    queryFn: async () => {
      if (!params?.slug) throw new Error('No slug provided');
      const response = await fetch(`/api/blog-posts/slug/${params.slug}`);
      if (!response.ok) {
        throw new Error(`Post not found: ${response.status}`);
      }
      return response.json();
    },
    enabled: !!params?.slug && params.slug !== 'undefined',
  });

  // Detect language from slug
  const detectedLanguage = post ? (
    params?.slug === post.slugVi ? 'vi' : 'en'
  ) : null;

  // Auto-redirect to correct language URL when user changes language (but not on initial load)
  useEffect(() => {
    if (post && params?.slug) {
      const currentSlug = params.slug;
      const expectedSlug = language === 'vi' ? 
        (post.slugVi || post.id) : 
        (post.slug || post.id);
      
      // CRITICAL FIX: Only redirect if user explicitly changed language
      // Do NOT redirect on initial page load or direct URL access
      const hasUserChangedLanguage = sessionStorage.getItem('user-language-changed');
      
      if (hasUserChangedLanguage && currentSlug !== expectedSlug) {
        // Verify this is a valid blog post before redirecting
        const isValidSlug = (post.slug && currentSlug === post.slug) || 
                           (post.slugVi && currentSlug === post.slugVi);
        
        if (isValidSlug) {
          window.history.replaceState({}, '', `/news/${expectedSlug}`);
          sessionStorage.removeItem('user-language-changed');
        }
      }
    }
  }, [language, post, params?.slug]);

  // Get URLs for both languages - ensure no undefined slugs
  const getBlogUrls = (post: BlogPost) => {
    return {
      en: post.slug && post.slug !== 'undefined' ? post.slug : post.id,
      vi: post.slugVi && post.slugVi !== 'undefined' ? post.slugVi : post.id
    };
  };

  // Calculate derived values for SEO only when post exists
  const title = post ? getTranslatedContent({
    en: post.title,
    vi: post.titleVi || undefined
  }, post.title) : '';

  const content = post ? getTranslatedContent({
    en: post.content,
    vi: post.contentVi || undefined
  }, post.content) : '';
  
  const excerptText = post ? getTranslatedContent({
    en: post.excerpt,
    vi: post.excerptVi || undefined
  }, post.excerpt) : '';

  // SEO Meta data
  const metaTitle = post ? getTranslatedContent({
    en: post.metaTitle || post.title,
    vi: post.metaTitleVi || post.titleVi || undefined
  }, post.metaTitle || post.title) : '';

  const metaDescription = post ? getTranslatedContent({
    en: post.metaDescription || excerptText || '',
    vi: post.metaDescriptionVi || post.excerptVi || undefined
  }, post.metaDescription || excerptText || '') : '';

  const keywords = post ? getTranslatedContent({
    en: post.keywords || '',
    vi: post.keywordsVi || undefined
  }, post.keywords || '') : '';

  // Create proper URL using the correct slug for current language
  const getProperBlogUrl = () => {
    if (!post) return '';
    const urls = getBlogUrls(post);
    const currentSlug = language === 'vi' ? urls.vi : urls.en;
    return `${window.location.origin}/news/${currentSlug}`;
  };

  const canonicalUrl = post ? (post.canonicalUrl || getProperBlogUrl()) : '';

  // Generate OG image URL - use ogImageUrl first, then coverImageUrl (thumbnail), then imageUrl, fallback to default OG image
  const ogImageUrl = post ? (post.ogImageUrl || post.coverImageUrl || post.imageUrl || `${window.location.origin}/public-objects/materials/og.bg.png`) : '';

  // JSON-LD structured data effect
  useEffect(() => {
    if (post && typeof document !== 'undefined') {
      // Add JSON-LD structured data
      const structuredData = {
        "@context": "https://schema.org",
        "@type": "NewsArticle",
        "headline": metaTitle,
        "description": metaDescription,
        "image": ogImageUrl,
        "author": {
          "@type": "Organization",
          "name": "Hum's Pizza Team"
        },
        "publisher": {
          "@type": "Organization",
          "name": "Hum's Pizza",
          "logo": {
            "@type": "ImageObject",
            "url": `${window.location.origin}/public-objects/materials/logo.humpizza.png`
          }
        },
        "datePublished": post.createdAt,
        "dateModified": post.updatedAt,
        "mainEntityOfPage": {
          "@type": "WebPage",
          "@id": canonicalUrl
        }
      };

      let jsonLd = document.querySelector('script[type="application/ld+json"]');
      if (!jsonLd) {
        jsonLd = document.createElement('script');
        jsonLd.setAttribute('type', 'application/ld+json');
        document.head.appendChild(jsonLd);
      }
      jsonLd.textContent = JSON.stringify(structuredData);
    }
  }, [post, metaTitle, metaDescription, canonicalUrl, ogImageUrl]);

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (error || !post) {
    return (
      <div className="min-h-screen bg-black py-20">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <h1 className="text-4xl font-bold mb-4">{t('blog.postNotFound')}</h1>
            <p className="text-gray-400 mb-8">{t('blog.postNotFoundDesc')}</p>
            <Link href="/news">
              <Button variant="outline">
                <ArrowLeft className="w-4 h-4 mr-2" />
                {t('blog.backToBlog')}
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-black py-20">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl font-bold mb-6">{t('blog.postNotFound')}</h1>
          <p className="text-gray-400 mb-8">{t('blog.postNotFoundDesc')}</p>
          <Link href="/news">
            <Button variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              {t('blog.backToBlog')}
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black py-20">
      <SEOHead
        title={metaTitle}
        description={metaDescription}
        keywords={keywords}
        canonicalUrl={canonicalUrl}
        ogTitle={metaTitle}
        ogDescription={metaDescription}
        ogImage={ogImageUrl}
        ogUrl={canonicalUrl}
        ogType="article"
      />
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Back button */}
        <Link href="/news" className="inline-flex items-center text-gray-400 hover:text-primary transition-colors mb-8">
          <ArrowLeft className="w-4 h-4 mr-2" />
          {t('blog.backToBlog')}
        </Link>

        <article>
          {/* Featured Image */}
          {post.coverImageUrl && (
            <div className="mb-8">
              <img 
                src={post.coverImageUrl}
                alt={title}
                className="w-full aspect-[16/9] object-cover rounded-lg"
                onError={(e) => {
                }}
                onLoad={() => {
                }}
              />
            </div>
          )}
          

          {/* Article Header */}
          <header className="mb-8">
            <div className="flex items-center space-x-6 text-sm text-gray-400 mb-6">
              <div className="flex items-center space-x-2">
                <Calendar className="w-4 h-4" />
                <span>{new Date(post.createdAt).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center space-x-2">
                <User className="w-4 h-4" />
                <span>Hum's Pizza Team</span>
              </div>
            </div>
            
            <h1 className="text-4xl md:text-5xl font-bold leading-tight mb-6">
              {title}
            </h1>
          </header>

          {/* Article Content */}
          <div className="prose prose-invert prose-lg max-w-none">
            <div 
              className="text-gray-300 leading-relaxed [&>p>img]:w-full [&>p>img]:rounded-lg [&>p>img]:my-4 [&>p>strong]:text-xl [&>p>strong]:font-bold [&>strong]:text-xl [&>strong]:font-bold"
              dangerouslySetInnerHTML={{ 
                __html: marked(formatBoldText(content))
              }}
            />
          </div>
          

          {/* Article Footer */}
          <footer className="mt-12 pt-8 border-t border-gray-700">
            <div className="flex items-center justify-between">
              <div className="text-gray-400">
                <p>{t('blog.publishedBy')} <span className="text-primary">Hum's Pizza Team</span></p>
                <p className="text-sm mt-1">{new Date(post.createdAt).toLocaleDateString()}</p>
              </div>
              
              <Button 
                variant="outline" 
                onClick={copyToClipboard}
                className="min-w-[140px]"
                data-testid="button-share-article"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    {language === 'vi' ? 'Đã sao chép!' : 'Copied!'}
                  </>
                ) : (
                  <>
                    <Share2 className="w-4 h-4 mr-2" />
                    {language === 'vi' ? 'Chia sẻ' : 'Share'}
                  </>
                )}
              </Button>
            </div>
          </footer>
        </article>
      </div>
    </div>
  );
}