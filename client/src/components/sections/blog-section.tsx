import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { useLanguage } from "@/contexts/LanguageContext";
import { useContentTranslation } from "@/hooks/useContentTranslation";
import { useIntersectionObserver } from "@/hooks/use-intersection-observer";
import type { BlogPost, HomeContent } from "@shared/schema";

export default function BlogSection() {
  const { t, language } = useLanguage();
  const { getTranslatedContent } = useContentTranslation();
  const { elementRef, hasIntersected } = useIntersectionObserver({
    rootMargin: '200px',
  });
  const { data: blogPosts = [], isLoading } = useQuery<BlogPost[]>({
    queryKey: ["/api/blog-posts"],
    enabled: hasIntersected,
  });

  // Fetch home content for section titles
  const { data: homeContent } = useQuery<HomeContent>({
    queryKey: ["/api/home-content"],
  });

  if (isLoading && hasIntersected) {
    return (
      <section ref={elementRef} className="py-16 bg-noir-950">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              {homeContent 
                ? (language === 'vi' ? homeContent.blogTitleVi : homeContent.blogTitle)
                : t('blog.title')
              }
            </h2>
            <p className="text-lg text-gray-300 max-w-2xl mx-auto">
              {homeContent 
                ? (language === 'vi' ? homeContent.blogSubtitleVi : homeContent.blogSubtitle)
                : t('blog.subtitle')
              }
            </p>
          </div>
          <div className="flex justify-center">
            <LoadingSpinner />
          </div>
        </div>
      </section>
    );
  }

  if (!hasIntersected) {
    return (
      <section ref={elementRef} className="py-16 bg-noir-950">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              {homeContent 
                ? (language === 'vi' ? homeContent.blogTitleVi : homeContent.blogTitle)
                : t('blog.title')
              }
            </h2>
            <p className="text-lg text-gray-300 max-w-2xl mx-auto">
              {homeContent 
                ? (language === 'vi' ? homeContent.blogSubtitleVi : homeContent.blogSubtitle)
                : t('blog.subtitle')
              }
            </p>
          </div>
        </div>
      </section>
    );
  }

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

  // Show pinned posts first, then fill remaining slots with latest posts
  const featuredPosts = sortedPosts.slice(0, 4);

  return (
    <section ref={elementRef} className="py-16 bg-noir-950">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            {homeContent 
              ? (language === 'vi' ? homeContent.blogTitleVi : homeContent.blogTitle)
              : t('blog.title')
            }
          </h2>
          <p className="text-lg text-gray-300 max-w-2xl mx-auto">
            {homeContent 
              ? (language === 'vi' ? homeContent.blogSubtitleVi : homeContent.blogSubtitle)
              : t('blog.subtitle')
            }
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {featuredPosts.length > 0 ? (
            featuredPosts.map((post) => (
              <article key={post.id} className="bg-noir-900 rounded-lg overflow-hidden group hover:bg-noir-800 transition-colors duration-300 h-full flex flex-col">
                <div className="bg-gray-800 overflow-hidden flex-shrink-0 h-48">
                  {((post.pinned && post.coverImageUrl) ? post.coverImageUrl : post.imageUrl) ? (
                    <img 
                      src={((post.pinned && post.coverImageUrl) ? post.coverImageUrl : post.imageUrl) || ''}
                      alt={getTranslatedContent({
                        en: post.title,
                        vi: post.titleVi || undefined
                      }, post.title)}
                      loading="lazy"
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-noir-700 to-noir-900 flex items-center justify-center">
                      <div className="text-gray-600 text-4xl">📰</div>
                    </div>
                  )}
                </div>
                <div className="p-5 flex flex-col flex-grow">
                  <div className="flex items-center justify-between text-sm mb-3">
                    <div className="text-primary font-medium">
                      {new Date(post.createdAt).toLocaleDateString()}
                    </div>

                  </div>
                  <h3 className="text-lg font-semibold mb-3 group-hover:text-primary transition-colors line-clamp-2">
                    {getTranslatedContent({
                      en: post.title,
                      vi: post.titleVi || undefined
                    }, post.title)}
                  </h3>
                  <p className="text-gray-400 mb-3 flex-grow text-sm leading-relaxed line-clamp-3">
                    {getTranslatedContent({
                      en: post.excerpt,
                      vi: post.excerptVi || undefined
                    }, post.excerpt)}
                  </p>
                  <Link 
                    href={`/news/${language === 'vi' ? (post.slugVi || post.slug) : post.slug}`}
                    className="text-primary hover:text-primary/80 transition-colors mt-auto text-sm font-medium"
                  >
                    {t('blog.readMore')} →
                  </Link>
                </div>
              </article>
            ))
          ) : (
            <div className="col-span-4 text-center py-12">
              <p className="text-gray-400 text-lg">{t('blog.noPosts')}</p>
              <p className="text-gray-500 mt-2">{t('blog.checkBack')}</p>
            </div>
          )}
        </div>

        {featuredPosts.length > 0 && (
          <div className="text-center mt-10">
            <Link href="/news">
              <Button variant="outline" size="lg">
                {t('blog.viewAll')}
              </Button>
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
