import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { useLanguage } from "@/contexts/LanguageContext";
import { useContentTranslation } from "@/hooks/useContentTranslation";
import { formatPrice } from "@/lib/currency";
import { useIntersectionObserver } from "@/hooks/use-intersection-observer";
import type { MenuItem, Category, HomeContent } from "@shared/schema";
import { Link, useLocation } from "wouter";
import { HoverTooltip } from "@/components/ui/hover-tooltip";

export default function MenuPreview() {
  const [, setLocation] = useLocation();
  const { t, language } = useLanguage();
  const { getTranslatedContent } = useContentTranslation();
  const { elementRef, hasIntersected } = useIntersectionObserver({
    rootMargin: '200px',
  });

  const { data: pinnedItems = [], isLoading } = useQuery<MenuItem[]>({
    queryKey: ["/api/menu-items/pinned"],
    queryFn: async () => {
      const response = await fetch("/api/menu-items/pinned");
      if (!response.ok) throw new Error('Failed to fetch pinned menu items');
      return response.json();
    },
    enabled: hasIntersected,
  });

  // Fetch home content for section titles
  const { data: homeContent } = useQuery<HomeContent>({
    queryKey: ["/api/home-content"],
  });

  // Process pinned items to handle the nested structure from API  
  const processedItems = pinnedItems
    .map((item: any) => {
      if (item.menu_items) {
        return {
          ...item.menu_items,
          category: item.categories,
          price: parseFloat(item.menu_items.price || 0),
          isAvailable: item.menu_items.isAvailable
        };
      }
      return {
        ...item,
        price: parseFloat(item.price || 0),
        isAvailable: item.isAvailable
      };
    })
    .filter(item => item.isAvailable); // Only show available items on homepage

  const handleGoToMenu = () => {
    setLocation('/menu');
  };

  if (isLoading || !hasIntersected) {
    return (
      <section ref={elementRef} className="py-20 bg-black">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-bold mb-6">
              {homeContent 
                ? (language === 'vi' ? homeContent.featuredTitleVi : homeContent.featuredTitle)
                : t('menu.ourSignatureDishes')
              }
            </h2>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              {homeContent 
                ? (language === 'vi' ? homeContent.featuredSubtitleVi : homeContent.featuredSubtitle)
                : t('menu.featuredDishes')
              }
            </p>
          </div>
          {isLoading && hasIntersected && (
            <div className="flex justify-center">
              <LoadingSpinner />
            </div>
          )}
        </div>
      </section>
    );
  }

  return (
    <section ref={elementRef} className="py-16 bg-black">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            {homeContent 
              ? (language === 'vi' ? homeContent.featuredTitleVi : homeContent.featuredTitle)
              : t('menu.ourSignatureDishes')
            }
          </h2>
          <p className="text-lg text-gray-300 max-w-2xl mx-auto">
            {homeContent 
              ? (language === 'vi' ? homeContent.featuredSubtitleVi : homeContent.featuredSubtitle)
              : t('menu.featuredDishes')
            }
          </p>
        </div>



        {/* Menu Items Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {processedItems.slice(0, 4).map((item: any) => {
            // Create tooltip content for each menu item
            const tooltipContent = (
              <div className="max-w-md p-4">
                <div className="flex flex-col space-y-3">
                  {/* Item Image */}
                  {item.imageUrl && (
                    <div className="aspect-[4/3] bg-gray-800 overflow-hidden rounded-lg">
                      <img 
                        src={item.imageUrl}
                        alt={getTranslatedContent({
                          en: item.name,
                          vi: item.nameVi || undefined
                        }, item.name)}
                        className="w-full h-full object-cover"
                        data-testid={`tooltip-image-${item.id}`}
                      />
                    </div>
                  )}
                  
                  {/* Item Name */}
                  <h3 className="text-lg font-semibold text-white" data-testid={`tooltip-name-${item.id}`}>
                    {getTranslatedContent({
                      en: item.name,
                      vi: item.nameVi || undefined
                    }, item.name)}
                  </h3>
                  
                  {/* Full Description */}
                  <p className="text-gray-300 text-sm leading-relaxed" data-testid={`tooltip-description-${item.id}`}>
                    {getTranslatedContent({
                      en: item.description,
                      vi: item.descriptionVi || undefined
                    }, item.description)}
                  </p>
                  
                  {/* Category */}
                  {item.category && (
                    <div className="text-sm text-gray-400" data-testid={`tooltip-category-${item.id}`}>
                      <span className="font-medium">{t('category')}:</span> {' '}
                      {/* Handle both object and array category shapes */}
                      {Array.isArray(item.category) 
                        ? item.category.map((cat: any) => getTranslatedContent({
                            en: cat.name,
                            vi: cat.nameVi || undefined
                          }, cat.name)).join(', ')
                        : getTranslatedContent({
                            en: item.category.name || item.category,
                            vi: item.category.nameVi || undefined
                          }, item.category.name || item.category)
                      }
                    </div>
                  )}
                  
                  {/* Tags */}
                  {item.tags && item.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {item.tags.map((tag: string, index: number) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-zinc-800 text-gray-300 text-xs rounded-full"
                          data-testid={`tooltip-tag-${item.id}-${index}`}
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                  
                  {/* Price Only (Remove availability from tooltip) */}
                  <div className="pt-2 border-t border-gray-600">
                    <span className="text-primary font-bold text-lg" data-testid={`tooltip-price-${item.id}`}>
                      {formatPrice(item.price || 0)}
                    </span>
                  </div>
                </div>
              </div>
            );

            return (
              <HoverTooltip
                key={item.id}
                content={tooltipContent}
                delayMs={800} // Same delay as menu items and reviews
              >
                <div className="bg-noir-900 rounded-lg overflow-hidden group hover:bg-noir-800 transition-colors duration-300 flex flex-col cursor-pointer h-full" data-testid={`featured-item-${item.id}`}>
                  {item.imageUrl && (
                    <div className="aspect-[4/3] bg-gray-800 overflow-hidden">
                      <img 
                        src={item.imageUrl}
                        alt={getTranslatedContent({
                          en: item.name,
                          vi: item.nameVi || undefined
                        }, item.name)}
                        loading="lazy"
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        data-testid={`featured-item-image-${item.id}`}
                      />
                    </div>
                  )}
                  <div className="p-5 flex flex-col flex-1">
                    {/* Title - Fixed 2 lines height */}
                    <h3 className="text-lg font-semibold mb-3 h-[3.5rem] leading-relaxed line-clamp-2 overflow-hidden" data-testid={`featured-item-name-${item.id}`}>
                      {getTranslatedContent({
                        en: item.name,
                        vi: item.nameVi || undefined
                      }, item.name)}
                    </h3>
                    
                    {/* Description - Fixed 3 lines */}
                    <p className="text-gray-400 mb-4 text-sm h-[4.2rem] leading-relaxed line-clamp-3 overflow-hidden" data-testid={`featured-item-description-${item.id}`}>
                      {getTranslatedContent({
                        en: item.description,
                        vi: item.descriptionVi || undefined
                      }, item.description)}
                    </p>
                    
                    {/* Bottom section - Fixed at bottom */}
                    <div className="mt-auto space-y-3">
                      {/* Tags */}
                      <div className="min-h-[2rem]">
                        {item.tags && item.tags.length > 0 ? (
                          <div className="flex flex-wrap gap-2">
                            {item.tags.map((tag: string, index: number) => (
                              <span
                                key={index}
                                className="px-3 py-1 bg-noir-800 text-gray-300 text-sm rounded-full"
                                data-testid={`featured-item-tag-${item.id}-${index}`}
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <div></div>
                        )}
                      </div>
                      
                      {/* Price */}
                      <div>
                        <span className="text-primary font-bold text-lg" data-testid={`featured-item-price-${item.id}`}>
                          {formatPrice(item.price || 0)}
                        </span>
                      </div>
                      
                      {/* Status and Button - Prevent tooltip on these elements */}
                      <div className="flex justify-between items-center" 
                           onMouseEnter={(e) => e.stopPropagation()} 
                           onMouseLeave={(e) => e.stopPropagation()}>
                        <span className={`text-sm font-medium ${item.isAvailable ? "text-green-400" : "text-red-400"}`} 
                              data-testid={`featured-item-status-${item.id}`}>
                          {item.isAvailable ? t('menu.available') : t('menu.soldOut')}
                        </span>
                        <Button
                          onClick={handleGoToMenu}
                          disabled={!item.isAvailable}
                          className="bg-primary hover:bg-primary/90 text-primary-foreground text-sm px-4 py-2"
                          data-testid={`featured-item-button-${item.id}`}
                        >
                          {t('menu.addToCart')}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </HoverTooltip>
            );
          })}
        </div>

        <div className="text-center mt-10">
          <Link href="/menu">
            <Button variant="outline" size="lg">
              {t('menu.viewFullMenu')}
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
