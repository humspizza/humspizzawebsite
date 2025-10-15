import { Star, Quote } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useQuery } from '@tanstack/react-query';
import { useIntersectionObserver } from '@/hooks/use-intersection-observer';
import type { CustomerReview, HomeContent } from '@shared/schema';
import { HoverTooltip } from '@/components/ui/hover-tooltip';



export default function ReviewsSection() {
  const { t, language } = useLanguage();
  const { elementRef, hasIntersected } = useIntersectionObserver({
    rootMargin: '200px',
  });
  
  // Fetch published reviews from database
  const { data: reviews = [], isLoading } = useQuery<CustomerReview[]>({
    queryKey: ["/api/customer-reviews/published"],
    enabled: hasIntersected,
  });

  // Fetch home content for section titles
  const { data: homeContent } = useQuery<HomeContent>({
    queryKey: ["/api/home-content"],
  });

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${
          i < rating ? 'fill-yellow-400 text-yellow-400' : 'text-zinc-600'
        }`}
      />
    ));
  };

  return (
    <section ref={elementRef} className="py-16 bg-zinc-950">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            {homeContent 
              ? (language === 'vi' ? homeContent.reviewsTitleVi : homeContent.reviewsTitle)
              : t('reviews.title')
            }
          </h2>
          <p className="text-lg text-zinc-400 max-w-2xl mx-auto">
            {homeContent 
              ? (language === 'vi' ? homeContent.reviewsSubtitleVi : homeContent.reviewsSubtitle)
              : t('reviews.subtitle')
            }
          </p>
        </div>

        {/* Reviews Grid */}
        {isLoading && hasIntersected ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin w-8 h-8 border-4 border-yellow-600 border-t-transparent rounded-full" />
          </div>
        ) : hasIntersected ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {reviews.map((review) => {
              // Helper function to truncate text to max 4 lines (approximately 160 characters)
              const truncateText = (text: string, maxLength: number = 160) => {
                if (text.length <= maxLength) return text;
                return text.substring(0, maxLength).trim() + '...';
              };

              const reviewText = language === 'vi' ? (review.reviewVi || review.review) : (review.review || review.reviewVi);
              const truncatedText = truncateText(reviewText || '');

              // Create tooltip content for full review
              const tooltipContent = (
                <div className="space-y-4">
                  {/* Full Review Text */}
                  <div>
                    <div className="flex items-center mb-2">
                      <Quote className="h-4 w-4 text-zinc-400 mr-2" />
                      <span className="font-medium text-white">{language === 'vi' ? 'Đánh giá chi tiết' : 'Full Review'}</span>
                    </div>
                    <p className="text-zinc-300 leading-relaxed">
                      "{reviewText}"
                    </p>
                  </div>

                  {/* Rating in tooltip */}
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-zinc-400">{language === 'vi' ? 'Đánh giá:' : 'Rating:'}</span>
                    <div className="flex items-center">
                      {renderStars(review.rating)}
                    </div>
                    <span className="text-sm text-zinc-400">({review.rating}/5)</span>
                  </div>

                  {/* Customer info in tooltip */}
                  <div className="flex items-center pt-2 border-t border-zinc-700">
                    <div className="w-10 h-10 rounded-full mr-3 flex items-center justify-center bg-zinc-800 overflow-hidden flex-shrink-0">
                      {review.avatarUrl ? (
                        review.avatarUrl.startsWith('data:') || review.avatarUrl.startsWith('http') ? (
                          <img 
                            src={review.avatarUrl} 
                            alt={review.customerName}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-lg">{review.avatarUrl}</span>
                        )
                      ) : (
                        <span className="text-lg text-zinc-400">👤</span>
                      )}
                    </div>
                    <div>
                      <div className="font-semibold text-white text-sm">
                        {language === 'vi' ? (review.customerNameVi || review.customerName) : (review.customerName || review.customerNameVi)}
                      </div>
                      <div className="text-xs text-zinc-400">
                        {language === 'vi' ? (review.customerTitleVi || 'Khách hàng') : (review.customerTitle || 'Customer')}
                      </div>
                    </div>
                  </div>
                </div>
              );

              return (
                <HoverTooltip
                  key={review.id}
                  content={tooltipContent}
                  delayMs={800} // Same delay as menu items
                >
                  <div
                    className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 hover:border-zinc-700 transition-colors group h-full flex flex-col cursor-pointer"
                    data-testid={`review-card-${review.id}`}
                  >
                    {/* Quote Icon */}
                    <div className="mb-2">
                      <Quote className="h-5 w-5 text-zinc-600 group-hover:text-zinc-500 transition-colors" />
                    </div>

                    {/* Rating */}
                    <div className="flex items-center mb-2" data-testid={`review-rating-${review.id}`}>
                      {renderStars(review.rating)}
                    </div>

                    {/* Review Text - Fixed height container */}
                    <div className="flex-grow mb-3">
                      <p className="text-zinc-300 leading-relaxed h-[100px] overflow-hidden text-sm" data-testid={`review-comment-${review.id}`}>
                        "{truncatedText}"
                      </p>
                    </div>

                    {/* Reviewer Info - Fixed at bottom */}
                    <div className="flex items-center mt-auto">
                      <div className="w-10 h-10 rounded-full mr-3 flex items-center justify-center bg-zinc-800 overflow-hidden flex-shrink-0" data-testid={`review-avatar-${review.id}`}>
                        {review.avatarUrl ? (
                          review.avatarUrl.startsWith('data:') || review.avatarUrl.startsWith('http') ? (
                            <img 
                              src={review.avatarUrl} 
                              alt={review.customerName}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="text-xl">{review.avatarUrl}</span>
                          )
                        ) : (
                          <span className="text-xl text-zinc-400">👤</span>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="font-semibold text-white truncate text-sm" data-testid={`review-name-${review.id}`}>
                          {language === 'vi' ? (review.customerNameVi || review.customerName) : (review.customerName || review.customerNameVi)}
                        </div>
                        <div className="text-sm text-zinc-500">
                          {language === 'vi' ? (review.customerTitleVi || 'Khách hàng') : (review.customerTitle || 'Customer')}
                        </div>
                      </div>
                    </div>
                  </div>
                </HoverTooltip>
              );
            })}
          </div>
        ) : null}

        {/* Call to Action */}

      </div>
    </section>
  );
}