import { useLanguage } from '@/contexts/LanguageContext';
import SEOHead from "@/components/SEOHead";
import { useQuery } from "@tanstack/react-query";
import type { AboutContent } from "@shared/schema";
import { usePageSeo } from "@/hooks/usePageSeo";

export default function About() {
  const { t, language } = useLanguage();
  
  // Fetch about content from database
  const { data: aboutContent } = useQuery<AboutContent>({
    queryKey: ["/api/about-content"],
  });

  const seo = usePageSeo("about", {
    metaTitle: language === 'vi' 
      ? "Về Chúng Tôi - Hum's Pizza | Câu Chuyện Pizza Thủ Công"
      : "About Us - Hum's Pizza | Connecting Hearts, Authentic Vietnamese Taste",
    metaDescription: language === 'vi'
      ? "Tìm hiểu câu chuyện đặc biệt của Hum's Pizza | nơi gắn kết yêu thương và đậm đà vị Việt. Khám phá đội ngũ, triết lý và sứ mệnh của chúng tôi."
      : "Discover the special story of Hum's Pizza | where we connect hearts with authentic Vietnamese taste. Learn about our team, philosophy and mission.",
    keywords: language === 'vi'
      ? "về chúng tôi, câu chuyện Hum's Pizza, đội ngũ, triết lý nhà hàng, pizza thủ công"
      : "about us, Hum's Pizza story, team, restaurant philosophy, authentic Vietnamese taste",
    canonicalUrl: "https://humspizza.com/about",
    ogTitle: language === 'vi' 
      ? "Hum's Pizza | Giới Thiệu"
      : "Hum's Pizza | About",
    ogUrl: "https://humspizza.com/about",
    ogType: "website",
  });

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
        {/* Hero Section */}
        <div className="text-center mb-20">
          <h1 className="text-5xl font-bold mb-6">
            {aboutContent ? (language === 'vi' ? aboutContent.heroTitleVi : aboutContent.heroTitle) : t('about.title')}
          </h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
            {aboutContent ? (language === 'vi' ? aboutContent.heroSubtitleVi : aboutContent.heroSubtitle) : t('about.subtitle')}
          </p>
        </div>

        {/* Story Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-stretch mb-20">
          <div className="flex flex-col justify-center">
            <h2 className="text-4xl font-bold mb-8">
              {aboutContent ? (language === 'vi' ? aboutContent.storyTitleVi : aboutContent.storyTitle) : t('about.ourStory')}
            </h2>
            <div className="space-y-6 text-lg text-gray-300 leading-relaxed">
              <p className="whitespace-pre-line">{aboutContent ? (language === 'vi' ? aboutContent.storyContentVi : aboutContent.storyContent) : t('about.story1')}</p>
            </div>
          </div>
          
          <div className="flex flex-col gap-6 h-full">
            {/* First story image - only show if image exists */}
            {aboutContent?.storyImageUrl && (
              <div 
                className="flex-1 min-h-[200px] bg-cover bg-center rounded-lg"
                style={{ backgroundImage: `url('${aboutContent.storyImageUrl}')` }}
              />
            )}
            
            {/* Second story image - only show if image exists */}
            {aboutContent?.storyImageUrl2 && (
              <div 
                className="flex-1 min-h-[200px] bg-cover bg-center rounded-lg"
                style={{ backgroundImage: `url('${aboutContent.storyImageUrl2}')` }}
              />
            )}
          </div>
        </div>

        {/* Statistics */}
        <div className="p-12 mb-20">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div className="group">
              <div className="text-5xl md:text-6xl font-bold text-yellow-400 mb-4 group-hover:scale-110 transition-transform duration-300">
                {aboutContent?.statsRecipes || "10+"}
              </div>
              <div className="text-zinc-300 font-medium text-lg group-hover:text-white transition-colors">
                {aboutContent ? (language === 'vi' ? aboutContent.statsRecipesLabelVi : aboutContent.statsRecipesLabel) : t('stats.recipes')}
              </div>
            </div>
            <div className="group">
              <div className="text-5xl md:text-6xl font-bold text-yellow-400 mb-4 group-hover:scale-110 transition-transform duration-300">
                {aboutContent?.statsServed || "5K+"}
              </div>
              <div className="text-zinc-300 font-medium text-lg group-hover:text-white transition-colors">
                {aboutContent ? (language === 'vi' ? aboutContent.statsServedLabelVi : aboutContent.statsServedLabel) : t('stats.served')}
              </div>
            </div>
            <div className="group">
              <div className="text-5xl md:text-6xl font-bold text-yellow-400 mb-4 group-hover:scale-110 transition-transform duration-300">
                {aboutContent?.statsFresh || "100%"}
              </div>
              <div className="text-zinc-300 font-medium text-lg group-hover:text-white transition-colors">
                {aboutContent ? (language === 'vi' ? aboutContent.statsFreshLabelVi : aboutContent.statsFreshLabel) : t('stats.fresh')}
              </div>
            </div>
            <div className="group">
              <div className="text-5xl md:text-6xl font-bold text-yellow-400 mb-4 group-hover:scale-110 transition-transform duration-300">
                {aboutContent?.statsSatisfaction || "95%"}
              </div>
              <div className="text-zinc-300 font-medium text-lg group-hover:text-white transition-colors">
                {aboutContent ? (language === 'vi' ? aboutContent.statsSatisfactionLabelVi : aboutContent.statsSatisfactionLabel) : t('stats.satisfaction')}
              </div>
            </div>
          </div>
        </div>

        {/* Philosophy Section */}
        <div className="text-center mb-20">
          <h2 className="text-4xl font-bold mb-8">{t('about.ourPhilosophy')}</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-zinc-900 p-8 rounded-lg">
              <h3 className="text-xl font-semibold mb-4 text-yellow-400">
                {aboutContent ? (language === 'vi' ? aboutContent.visionTitleVi : aboutContent.visionTitle) : t('about.vision')}
              </h3>
              <p className="text-gray-300">
                {aboutContent ? (language === 'vi' ? aboutContent.visionContentVi : aboutContent.visionContent) : t('about.visionDesc')}
              </p>
            </div>
            <div className="bg-zinc-900 p-8 rounded-lg">
              <h3 className="text-xl font-semibold mb-4 text-yellow-400">
                {aboutContent ? (language === 'vi' ? aboutContent.missionTitleVi : aboutContent.missionTitle) : t('about.mission')}
              </h3>
              <p className="text-gray-300">
                {aboutContent ? (language === 'vi' ? aboutContent.missionContentVi : aboutContent.missionContent) : t('about.missionDesc')}
              </p>
            </div>
            <div className="bg-zinc-900 p-8 rounded-lg">
              <h3 className="text-xl font-semibold mb-4 text-yellow-400">
                {aboutContent ? (language === 'vi' ? aboutContent.valuesTitleVi : aboutContent.valuesTitle) : t('about.values')}
              </h3>
              <p className="text-gray-300">
                {aboutContent ? (language === 'vi' ? aboutContent.valuesContentVi : aboutContent.valuesContent) : t('about.valuesDesc')}
              </p>
            </div>
          </div>
        </div>

        {/* Team Section */}
        <div className="text-center">
          <h2 className="text-4xl font-bold mb-8">{t('about.meetTeam')}</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 lg:gap-16">
            {/* Member 1 */}
            <div className="text-center">
              {aboutContent?.member1ImageUrl && (
                <div 
                  className="w-48 h-48 bg-cover bg-center rounded-full mx-auto mb-6"
                  style={{ backgroundImage: `url('${aboutContent.member1ImageUrl}')` }}
                />
              )}
              <h3 className="text-xl font-semibold mb-2">
                {aboutContent ? aboutContent.member1Name : t('team.chefHung')}
              </h3>
              <p className="text-yellow-400 mb-3">
                {aboutContent ? (language === 'vi' ? aboutContent.member1TitleVi : aboutContent.member1Title) : t('team.chefHungTitle')}
              </p>
              <p className="text-gray-400">
                {aboutContent ? (language === 'vi' ? aboutContent.member1DescriptionVi : aboutContent.member1Description) : t('team.chefHungDesc')}
              </p>
            </div>
            
            {/* Member 2 */}
            <div className="text-center">
              {aboutContent?.member2ImageUrl && (
                <div 
                  className="w-48 h-48 bg-cover bg-center rounded-full mx-auto mb-6"
                  style={{ backgroundImage: `url('${aboutContent.member2ImageUrl}')` }}
                />
              )}
              <h3 className="text-xl font-semibold mb-2">
                {aboutContent ? aboutContent.member2Name : t('team.mai')}
              </h3>
              <p className="text-yellow-400 mb-3">
                {aboutContent ? (language === 'vi' ? aboutContent.member2TitleVi : aboutContent.member2Title) : t('team.maiTitle')}
              </p>
              <p className="text-gray-400">
                {aboutContent ? (language === 'vi' ? aboutContent.member2DescriptionVi : aboutContent.member2Description) : t('team.maiDesc')}
              </p>
            </div>
            
            {/* Member 3 */}
            <div className="text-center">
              {aboutContent?.member3ImageUrl && (
                <div 
                  className="w-48 h-48 bg-cover bg-center rounded-full mx-auto mb-6"
                  style={{ backgroundImage: `url('${aboutContent.member3ImageUrl}')` }}
                />
              )}
              <h3 className="text-xl font-semibold mb-2">
                {aboutContent ? aboutContent.member3Name : t('team.tuan')}
              </h3>
              <p className="text-yellow-400 mb-3">
                {aboutContent ? (language === 'vi' ? aboutContent.member3TitleVi : aboutContent.member3Title) : t('team.tuanTitle')}
              </p>
              <p className="text-gray-400">
                {aboutContent ? (language === 'vi' ? aboutContent.member3DescriptionVi : aboutContent.member3Description) : t('team.tuanDesc')}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
