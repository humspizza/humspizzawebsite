import HeroSection from "@/components/sections/hero-section";
import MenuPreview from "@/components/sections/menu-preview";
import ReservationSection from "@/components/sections/reservation-section";
import ReviewsSection from "@/components/sections/reviews-section";
import BlogSection from "@/components/sections/blog-section";
import SEOHead from "@/components/SEOHead";
import { useLanguage } from '@/contexts/LanguageContext';
import { usePageSeo } from '@/hooks/usePageSeo';

interface HomeProps {
  onOpenBooking?: () => void;
  onOpenCart?: () => void;
}

export default function Home({ onOpenBooking }: HomeProps) {
  const { t, language } = useLanguage();

  // Default SEO values (fallback if database doesn't have custom values)
  const defaultSeoTitle = language === 'vi' 
    ? "Hum's Pizza | Gắn Kết Yêu Thương, Đậm Đà Vị Việt"
    : "Hum's Pizza | Connecting Hearts, Authentic Vietnamese Taste";

  const defaultSeoDescription = language === 'vi'
    ? "Khám phá những chiếc pizza tuyệt vời tại Hum's Pizza | nơi gắn kết yêu thương và đậm đà vị Việt. Đặt bàn ngay hôm nay để thưởng thức pizza tươi ngon từ nguyên liệu cao cấp."
    : "Discover amazing pizzas at Hum's Pizza | where we connect hearts with authentic Vietnamese taste. Book your table today to enjoy fresh, delicious pizzas made from premium ingredients.";

  const defaultOgTitle = language === 'vi'
    ? "Hum's Pizza | Gắn Kết Yêu Thương, Đậm Đà Vị Việt"
    : "Hum's Pizza | Connecting Hearts, Authentic Vietnamese Taste";

  const defaultOgDescription = language === 'vi'
    ? "Hum's Pizza | Nhà hàng pizza phong cách Chicago & Ý, đến từ Việt Nam. Chúng tôi mang đến hương vị phô mai ngập tràn, vỏ bánh giòn thơm và trải nghiệm chuẩn vị trong từng lát bánh."
    : "Hum's Pizza | Connecting Hearts, Authentic Vietnamese Taste. We bring unique Vietnamese-style pizzas, crispy crusts, and authentic experiences in every slice.";

  const defaultKeywords = language === 'vi'
    ? "pizza, pizza Ý, pizza thủ công, nhà hàng pizza, Bình Dương, đặt bàn, pizza tươi"
    : "pizza, Vietnamese pizza, authentic taste, pizza restaurant, Binh Duong, table booking, fresh pizza";

  // Fetch SEO data from database (or use defaults)
  const seo = usePageSeo('home', {
    metaTitle: defaultSeoTitle,
    metaDescription: defaultSeoDescription,
    keywords: defaultKeywords,
    canonicalUrl: "https://humspizza.com/",
    ogTitle: defaultOgTitle,
    ogDescription: defaultOgDescription,
    ogImage: `${typeof window !== 'undefined' ? window.location.origin : ''}/og.bg.png`,
    ogUrl: "https://humspizza.com/",
    ogType: "website",
  });

  return (
    <div>
      <SEOHead
        title={seo.metaTitle}
        description={seo.metaDescription}
        keywords={seo.keywords}
        canonicalUrl={seo.canonicalUrl}
        ogTitle={seo.ogTitle}
        ogDescription={seo.ogDescription}
        ogImage={seo.ogImage}
        ogUrl={seo.ogUrl}
        ogType={seo.ogType}
        noIndex={seo.noIndex}
      />
      <HeroSection 
        onOpenBooking={onOpenBooking}
      />
      <MenuPreview />
      <ReservationSection />
      <ReviewsSection />
      <BlogSection />
    </div>
  );
}
