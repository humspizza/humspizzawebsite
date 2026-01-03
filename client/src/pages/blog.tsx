import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Calendar, User } from "lucide-react";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { useLanguage } from "@/contexts/LanguageContext";
import { useContentTranslation } from "@/hooks/useContentTranslation";
import { PaginationHum } from "@/components/ui/pagination-hum";
import type { BlogPost } from "@shared/schema";
import SEOHead from "@/components/SEOHead";
import { usePageSeo } from "@/hooks/usePageSeo";

const ITEMS_PER_PAGE = 10;

export default function Blog() {
  const { t, language } = useLanguage();
  const { getTranslatedContent } = useContentTranslation();
  const [currentPage, setCurrentPage] = useState(1);

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

  const getBlogSlug = (post: BlogPost) => {
    if (language === "vi" && post.slugVi && post.slugVi !== 'undefined') {
      return post.slugVi;
    }
    if (language === "en" && post.slug && post.slug !== 'undefined') {
      return post.slug;
    }
    const fallbackSlug = post.slug && post.slug !== 'undefined' ? post.slug : 
                         post.slugVi && post.slugVi !== 'undefined' ? post.slugVi : 
                         post.id;
    return fallbackSlug;
  };

  const { data: blogPosts = [], isLoading } = useQuery<BlogPost[]>({
    queryKey: ["/api/blog-posts"],
    queryFn: () => fetch('/api/blog-posts?published=true').then(res => res.json()),
  });

  const sortedPosts = [...blogPosts].sort((a, b) => {
    const aPinned = a.pinned || false;
    const bPinned = b.pinned || false;
    
    if (aPinned && !bPinned) return -1;
    if (!aPinned && bPinned) return 1;
    
    if (aPinned && bPinned) {
      const aOrder = a.pinOrder || 0;
      const bOrder = b.pinOrder || 0;
      if (aOrder !== bOrder) return aOrder - bOrder;
    }
    
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  const totalItems = sortedPosts.length;
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentPosts = sortedPosts.slice(startIndex, endIndex);

  const featuredPost = currentPosts[0];
  const otherPosts = currentPosts.slice(1);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

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
            {featuredPost && (
              <div className="mb-12 max-w-7xl mx-auto">
                <Link href={`/news/${getBlogSlug(featuredPost)}`}>
                  <article className="bg-noir-900 rounded-lg overflow-hidden group hover:bg-noir-800 transition-colors duration-300 cursor-pointer">
                    {featuredPost.imageUrl && (
                      <div className="aspect-[21/9] bg-zinc-800 overflow-hidden">
                        <img 
                          src={featuredPost.imageUrl}
                          alt={getTranslatedContent({
                            en: featuredPost.title,
                            vi: featuredPost.titleVi || undefined
                          }, featuredPost.title)}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                    )}
                    <div className="p-6">
                      <div className="flex items-center space-x-6 text-sm text-gray-400 mb-3">
                        <div className="flex items-center space-x-2">
                          <Calendar className="w-4 h-4" />
                          <span>{new Date(featuredPost.createdAt).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <User className="w-4 h-4" />
                          <span>Hum's Pizza Team</span>
                        </div>
                        {featuredPost.pinned && (
                          <span className="text-yellow-500 text-xs font-medium bg-yellow-500/10 px-2 py-1 rounded">PINNED</span>
                        )}
                      </div>
                      <h2 className="text-2xl md:text-3xl font-bold mb-3 group-hover:text-primary transition-colors">
                        {getTranslatedContent({
                          en: featuredPost.title,
                          vi: featuredPost.titleVi || undefined
                        }, featuredPost.title)}
                      </h2>
                      <p className="text-gray-300 text-base md:text-lg mb-4 leading-relaxed">
                        {getTranslatedContent({
                          en: featuredPost.excerpt,
                          vi: featuredPost.excerptVi || undefined
                        }, featuredPost.excerpt)}
                      </p>
                      <span className="text-primary hover:text-primary/80 transition-colors font-medium">
                        {language === 'vi' ? 'Đọc thêm' : 'Read more'}
                      </span>
                    </div>
                  </article>
                </Link>
              </div>
            )}

            {otherPosts.length > 0 && (
              <div className="max-w-7xl mx-auto">
                <h2 className="text-3xl font-bold mb-8">{t('blog.moreStories')}</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {otherPosts.map((post) => (
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
                            {language === 'vi' ? 'Đọc thêm' : 'Read more'}
                          </span>
                        </div>
                      </article>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            <PaginationHum
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={totalItems}
              itemsPerPage={ITEMS_PER_PAGE}
              onPageChange={handlePageChange}
            />
          </>
        )}
      </div>
    </div>
  );
}
