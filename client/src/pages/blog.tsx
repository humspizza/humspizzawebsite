import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Calendar, User } from "lucide-react";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { useLanguage } from "@/contexts/LanguageContext";
import { useContentTranslation } from "@/hooks/useContentTranslation";
import type { BlogPost } from "@shared/schema";
import SEOHead from "@/components/SEOHead";
import { usePageSeo } from "@/hooks/usePageSeo";

export default function Blog() {
  const { t, language } = useLanguage();
  const { getTranslatedContent } = useContentTranslation();

  const seo = usePageSeo("news", {
    metaTitle: language === 'vi' 
      ? "Tin Tức - Hum's Pizza | Những Chuyện Thú Vị về Pizza"
      : "News - Hum's Pizza | Interesting Stories About Pizza",
    metaDescription: language === 'vi'
      ? "Khám phá tin tức mới nhất từ Hum's Pizza. Đọc những câu chuyện thú vị về pizza, công thức nấu ăn, sự kiện đặc biệt và những tips hữu ích."
      : "Discover the latest news from Hum's Pizza. Read interesting pizza stories, cooking recipes, special events and useful tips.",
    keywords: language === 'vi'
      ? "tin tức pizza, blog ẩm thực, công thức pizza, sự kiện nhà hàng, chuyện về pizza"
      : "pizza news, food blog, pizza recipes, restaurant events, pizza stories",
    canonicalUrl: "https://humspizza.com/news",
    ogTitle: language === 'vi' 
      ? "Hum's Pizza | Tin Tức"
      : "Hum's Pizza | News",
    ogUrl: "https://humspizza.com/news",
    ogType: "website",
  });

  // Helper function to get correct slug based on current language
  const getBlogSlug = (post: BlogPost) => {
    if (language === "vi" && post.slugVi && post.slugVi !== 'undefined') {
      return post.slugVi;
    }
    if (language === "en" && post.slug && post.slug !== 'undefined') {
      return post.slug;
    }
    // Fallback to available slug or ID, avoid undefined strings
    const fallbackSlug = post.slug && post.slug !== 'undefined' ? post.slug : 
                         post.slugVi && post.slugVi !== 'undefined' ? post.slugVi : 
                         post.id;
    return fallbackSlug;
  };

  // Helper function to get both language URLs for a post
  const getBlogUrls = (post: BlogPost) => {
    return {
      en: post.slug && post.slug !== 'undefined' ? post.slug : post.id,
      vi: post.slugVi && post.slugVi !== 'undefined' ? post.slugVi : post.id
    };
  };
  const { data: blogPosts = [], isLoading } = useQuery<BlogPost[]>({
    queryKey: ["/api/blog-posts"],
    queryFn: () => fetch('/api/blog-posts?published=true').then(res => res.json()),
  });

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

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="min-h-screen bg-black py-20">
      <SEOHead
        title={seo.metaTitle}
        description={seo.metaDescription}
        keywords={seo.keywords}
        canonicalUrl={seo.canonicalUrl}
        ogTitle={seo.ogTitle}
        ogDescription={seo.ogDescription}
        ogUrl={seo.ogUrl}
        ogType={seo.ogType}
        ogImage={seo.ogImage}
      />
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold mb-6">{t('blog.whatsHappening').toUpperCase()}</h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            {t('blog.blogSubtitle')}
          </p>
        </div>

        {blogPosts.length === 0 ? (
          <div className="text-center py-16">
            <h2 className="text-2xl font-semibold mb-4">{t('blog.noPosts')}</h2>
            <p className="text-gray-400 text-lg">
              {t('blog.noPostsDesc')}
            </p>
            <p className="text-gray-500 mt-2">
              {t('blog.checkBack')}
            </p>
          </div>
        ) : (
          <>
            {/* Featured Post */}
            {sortedPosts[0] && (
              <div className="mb-12 max-w-7xl mx-auto">
                <Link href={`/news/${getBlogSlug(sortedPosts[0])}`}>
                  <article className="bg-noir-900 rounded-lg overflow-hidden group hover:bg-noir-800 transition-colors duration-300 cursor-pointer">
                    {sortedPosts[0].imageUrl && (
                      <div className="aspect-[21/9] bg-zinc-800 overflow-hidden">
                        <img 
                          src={sortedPosts[0].imageUrl}
                          alt={getTranslatedContent({
                            en: sortedPosts[0].title,
                            vi: sortedPosts[0].titleVi || undefined
                          }, sortedPosts[0].title)}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          onError={(e) => {
                            // Image failed to load silently
                          }}
                          onLoad={() => {
                            // Image loaded successfully
                          }}
                        />
                      </div>
                    )}
                    <div className="p-6">
                      <div className="flex items-center space-x-6 text-sm text-gray-400 mb-3">
                        <div className="flex items-center space-x-2">
                          <Calendar className="w-4 h-4" />
                          <span>{new Date(sortedPosts[0].createdAt).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <User className="w-4 h-4" />
                          <span>Hum's Pizza Team</span>
                        </div>
                        {sortedPosts[0].pinned && (
                          <span className="text-yellow-500 text-xs font-medium bg-yellow-500/10 px-2 py-1 rounded">PINNED</span>
                        )}
                      </div>
                      <h2 className="text-2xl md:text-3xl font-bold mb-3 group-hover:text-primary transition-colors">
                        {getTranslatedContent({
                          en: sortedPosts[0].title,
                          vi: sortedPosts[0].titleVi || undefined
                        }, sortedPosts[0].title)}
                      </h2>
                      <p className="text-gray-300 text-base md:text-lg mb-4 leading-relaxed">
                        {getTranslatedContent({
                          en: sortedPosts[0].excerpt,
                          vi: sortedPosts[0].excerptVi || undefined
                        }, sortedPosts[0].excerpt)}
                      </p>
                      <span className="text-primary hover:text-primary/80 transition-colors font-medium">
                        {t('blog.readFullArticle')} →
                      </span>
                    </div>
                  </article>
                </Link>
              </div>
            )}

            {/* Other Posts Grid */}
            {sortedPosts.length > 1 && (
              <div className="max-w-7xl mx-auto">
                <h2 className="text-3xl font-bold mb-8">{t('blog.moreStories')}</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {sortedPosts.slice(1).map((post) => (
                    <Link key={post.id} href={`/news/${getBlogSlug(post)}`}>
                      <article className="bg-noir-900 rounded-lg overflow-hidden group hover:bg-noir-800 transition-colors duration-300 flex flex-col cursor-pointer h-full">
                        {post.imageUrl && (
                          <div className="aspect-[4/3] bg-zinc-800 flex-shrink-0 overflow-hidden">
                            <img 
                              src={post.imageUrl}
                              alt={getTranslatedContent({
                                en: post.title,
                                vi: post.titleVi || undefined
                              }, post.title)}
                              className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                            />
                          </div>
                        )}
                        <div className="p-4 flex flex-col">
                          <div className="flex items-center justify-between text-xs text-gray-400 mb-2">
                            <div className="flex items-center space-x-1">
                              <Calendar className="w-3 h-3" />
                              <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                            </div>
                            {post.pinned && (
                              <span className="text-yellow-500 text-xs font-medium">PINNED</span>
                            )}
                          </div>
                          <h3 className="text-base font-semibold mb-2 group-hover:text-primary transition-colors line-clamp-2">
                            {getTranslatedContent({
                              en: post.title,
                              vi: post.titleVi || undefined
                            }, post.title)}
                          </h3>
                          <p className="text-gray-400 mb-3 text-sm leading-relaxed line-clamp-3">
                            {getTranslatedContent({
                              en: post.excerpt,
                              vi: post.excerptVi || undefined
                            }, post.excerpt)}
                          </p>
                          <span className="text-primary hover:text-primary/80 transition-colors text-xs">
                            {t('blog.readMore')} →
                          </span>
                        </div>
                      </article>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
