import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { useCart } from "@/hooks/use-cart";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { useContentTranslation } from "@/hooks/useContentTranslation";
import { formatPrice } from "@/lib/currency";
import { queryClient } from "@/lib/queryClient";
import { formatImageUrl } from "@/lib/imageUtils";
import type { MenuItem, Category } from "@shared/schema";
import CustomizationModal from "@/components/modals/customization-modal";
import MultiCustomizationModal from "@/components/modals/multi-customization-modal";
import SEOHead from "@/components/SEOHead";
import { HoverTooltip } from "@/components/ui/hover-tooltip";
import { usePageSeo } from "@/hooks/usePageSeo";

export default function Menu() {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMenuItem, setSelectedMenuItem] = useState<MenuItem | null>(null);
  const [isCustomizationModalOpen, setIsCustomizationModalOpen] = useState(false);
  const [isMultiCustomizationModalOpen, setIsMultiCustomizationModalOpen] = useState(false);
  const [selectedSchema, setSelectedSchema] = useState<any>(null);
  const [selectedSchemas, setSelectedSchemas] = useState<any[]>([]);
  const { addItem } = useCart();
  const { toast } = useToast();
  const { t, language } = useLanguage();
  const { getTranslatedContent } = useContentTranslation();

  const seo = usePageSeo("menu", {
    metaTitle: language === 'vi' 
      ? "Thực Đơn Pizza - Hum's Pizza | Pizza Thủ Công Ý"
      : "Pizza Menu - Hum's Pizza | Connecting Hearts, Authentic Vietnamese Taste",
    metaDescription: language === 'vi'
      ? "Khám phá thực đơn pizza đa dạng tại Hum's Pizza | nơi gắn kết yêu thương và đậm đà vị Việt. Khai vị, món chính và đồ uống đặc biệt. Đặt hàng online ngay!"
      : "Explore our diverse pizza menu at Hum's Pizza | where we connect hearts with authentic Vietnamese taste. Appetizers, mains and specialty drinks. Order online now!",
    keywords: language === 'vi'
      ? "thực đơn pizza, pizza Ý, đặt hàng online, pizza thủ công, khai vị, món chính, đồ uống"
      : "pizza menu, Vietnamese pizza, online ordering, authentic taste, appetizers, main courses, beverages",
    canonicalUrl: "https://humspizza.com/menu",
    ogTitle: language === 'vi' 
      ? "Hum's Pizza | Thực Đơn"
      : "Hum's Pizza | Menu",
    ogUrl: "https://humspizza.com/menu",
    ogType: "website",
  });

  // Helper function to get translated category name
  const getCategoryTranslation = (categoryName: string) => {
    const categoryMap: { [key: string]: string } = {
      'Appetizers': t('category.appetizers'),
      'Main Courses': t('category.mainCourses'), 
      'Desserts': t('category.desserts'),
      'Tea Selection': t('category.teaSelection'),
      'Beverages': t('category.beverages'),
      'Soups': t('category.soups'),
    };
    return categoryMap[categoryName] || categoryName;
  };

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  const { data: menuItems = [], isLoading } = useQuery<MenuItem[]>({
    queryKey: ["/api/menu-items", selectedCategory],
    queryFn: async () => {
      const url = selectedCategory === "all" 
        ? "/api/menu-items?includeUnavailable=true" 
        : `/api/menu-items?categoryId=${selectedCategory}&includeUnavailable=true`;
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch menu items');
      return response.json();
    },
  });

  const { data: customizationSchemas = [] } = useQuery({
    queryKey: ["/api/customization-schemas"],
  });

  // Query for multiple schemas for the selected menu item
  const { data: menuItemSchemas = [] } = useQuery({
    queryKey: ["/api/menu-items", selectedMenuItem?.id, "customization-schemas"],
    enabled: !!selectedMenuItem?.id,
  });

  const filteredItems = menuItems.filter((row: any) => {
    const item = row.menu_items || row;
    if (!searchQuery) return true;
    
    const query = searchQuery.toLowerCase();
    
    // Search in both English and Vietnamese fields
    return item.name.toLowerCase().includes(query) ||
           item.description.toLowerCase().includes(query) ||
           (item.nameVi && item.nameVi.toLowerCase().includes(query)) ||
           (item.descriptionVi && item.descriptionVi.toLowerCase().includes(query)) ||
           (item.tags && item.tags.some((tag: string) => tag.toLowerCase().includes(query)));
  });

  // Process menu items to match expected interface and sort pinned items first
  const processedItems = filteredItems
    .map((row: any) => {
      const item = row.menu_items || row;
      return {
        ...item,
        nameVi: item.nameVi ?? undefined,
        descriptionVi: item.descriptionVi ?? undefined,
        imageUrl: item.imageUrl ?? undefined,
        categoryId: item.categoryId ?? undefined,
        customizationSchemaId: item.customizationSchemaId ?? undefined,
        tags: item.tags || [],
        isPinned: Boolean(item.isPinned), // Ensure boolean
        createdAt: item.createdAt
      };
    })
    .sort((a, b) => {
      // 1. Sort by category name (alphabetical)
      const categoryA = categories.find(c => c.id === a.categoryId)?.name || '';
      const categoryB = categories.find(c => c.id === b.categoryId)?.name || '';
      
      if (categoryA !== categoryB) {
        return categoryA.localeCompare(categoryB);
      }
      
      // 2. Within same category, sort by price (high to low)
      const priceA = parseFloat(a.price.replace(/[^0-9.-]+/g, '')) || 0;
      const priceB = parseFloat(b.price.replace(/[^0-9.-]+/g, '')) || 0;
      
      if (priceA !== priceB) {
        return priceB - priceA; // High to low
      }
      
      // 3. If prices are equal, sort by item name (alphabetical)
      const nameA = (language === 'vi' ? a.nameVi : a.name) || a.name;
      const nameB = (language === 'vi' ? b.nameVi : b.name) || b.name;
      
      return nameA.localeCompare(nameB);
    });


  const handleAddToCart = async (item: MenuItem) => {
    setSelectedMenuItem(item as MenuItem);
    
    // First check for multiple schemas using React Query
    try {
      const multipleSchemas = await queryClient.fetchQuery({
        queryKey: ['/api/menu-items', item.id, 'customization-schemas'],
        queryFn: () => fetch(`/api/menu-items/${item.id}/customization-schemas`).then(r => r.json()),
        staleTime: 5 * 60 * 1000, // 5 minutes cache
      });
      
      if (multipleSchemas && multipleSchemas.length > 0) {
        // Use multi-customization modal for multiple schemas
        setSelectedSchemas(multipleSchemas);
        setIsMultiCustomizationModalOpen(true);
        return;
      }
    } catch (error) {
      console.warn('Failed to fetch multiple schemas, falling back to single schema');
    }

    // Fall back to single customization schema
    if (item.customizationSchemaId) {
      const schema = (customizationSchemas as any[]).find((s: any) => s.id === item.customizationSchemaId);
      if (schema && schema.isActive) {
        setSelectedSchema(schema);
        setIsCustomizationModalOpen(true);
        return;
      }
    }

    // For items without customization, add directly to cart
    const displayName = getTranslatedContent({
      en: item.name,
      vi: item.nameVi || undefined
    }, item.name);
    
    addItem({
      id: item.id,
      name: item.name,
      nameVi: item.nameVi || undefined,
      price: parseFloat(item.price),
      vatRate: parseFloat(item.vatRate || "8"),
      image: item.imageUrl || undefined,
    });
    toast({
      title: language === 'vi' ? "Đã thêm vào giỏ hàng" : "Added to cart",
      description: language === 'vi' 
        ? `${displayName} đã được thêm vào giỏ hàng`
        : `${displayName} has been added to your cart.`,
    });
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
          <h1 className="text-5xl font-bold mb-6">{t('nav.menu').toUpperCase()}</h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            {t('menu.subtitle')}
          </p>
        </div>

        {/* Menu Navigation */}
        <div className="flex flex-wrap justify-center gap-4 mb-12">
          <Button
            onClick={() => setSelectedCategory("all")}
            variant={selectedCategory === "all" ? "default" : "outline"}
            className={selectedCategory === "all" ? "bg-primary text-primary-foreground" : ""}
          >
            {t('menu.allItems')}
          </Button>
          {categories.map((category) => {
            const displayName = getTranslatedContent({
              en: category.name,
              vi: category.nameVi || undefined
            }, category.name) || getCategoryTranslation(category.name);
            
            return (
              <Button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                variant={selectedCategory === category.id ? "default" : "outline"}
                className={selectedCategory === category.id ? "bg-primary text-primary-foreground" : ""}
              >
                {displayName}
              </Button>
            );
          })}
        </div>



        {/* Search Bar */}
        <div className="max-w-lg mx-auto mb-12">
          <div className="relative">
            <Input
              type="text"
              placeholder={t('menu.searchOurMenu')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 bg-noir-900 border-noir-700 focus:border-primary text-lg py-3"
            />
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          </div>
        </div>

        {/* Menu Items Grid */}
        {processedItems.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-gray-400 text-xl">{t('menu.noItemsFound')}</p>
            <p className="text-gray-500 mt-2">{t('menu.tryAdjusting')}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {processedItems.map((item: any) => {
              const fullDescription = getTranslatedContent({
                en: item.description,
                vi: item.descriptionVi || undefined
              }, item.description);

              const tooltipContent = (
                <div className="space-y-4">
                  {/* Image in tooltip */}
                  {item.imageUrl && (
                    <div 
                      className="aspect-[4/3] bg-cover bg-center rounded-md"
                      style={{ backgroundImage: `url('${formatImageUrl(item.imageUrl)}')` }}
                    />
                  )}
                  
                  {/* Title */}
                  <h3 className="text-xl font-bold text-white">
                    {getTranslatedContent({
                      en: item.name,
                      vi: item.nameVi || undefined
                    }, item.name)}
                  </h3>
                  
                  {/* Full Description */}
                  <p className="text-gray-300 leading-relaxed text-base">
                    {fullDescription}
                  </p>
                  
                  {/* Tags */}
                  {item.tags && item.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {item.tags.map((tag: string, index: number) => (
                        <span key={index} className="px-2 py-1 bg-zinc-700 text-xs rounded-full text-gray-300">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                  
                  {/* Price */}
                  <div className="flex justify-between items-center pt-2 border-t border-zinc-700">
                    <span className="text-primary font-bold text-lg">{formatPrice(item.price)}</span>
                    <span className={`text-base font-medium ${item.isAvailable ? "text-green-400" : "text-red-400"}`}>
                      {item.isAvailable ? t('menu.available') : t('menu.soldOut')}
                    </span>
                  </div>
                </div>
              );

              return (
                <div key={item.id} className="bg-noir-900 rounded-lg overflow-hidden group hover:bg-noir-800 transition-all duration-300 hover:transform hover:-translate-y-2 flex flex-col">
                  {/* Top section with tooltip - Image, Title, Description */}
                  <HoverTooltip
                    content={tooltipContent}
                    delayMs={800} // 0.8 seconds delay
                  >
                    <div>
                      {item.imageUrl && (
                        <div 
                          className="aspect-[4/3] bg-cover bg-center"
                          style={{ backgroundImage: `url('${formatImageUrl(item.imageUrl)}')` }}
                        />
                      )}
                      <div className="p-4 pb-2">
                        {/* Title - Fixed 2 lines height */}
                        <h3 className="text-lg font-semibold mb-2 h-[3.5rem] leading-relaxed line-clamp-2 overflow-hidden">
                          {getTranslatedContent({
                            en: item.name,
                            vi: item.nameVi || undefined
                          }, item.name)}
                        </h3>
                        <p className="text-gray-400 mb-2 leading-relaxed text-base line-clamp-3 min-h-[4.5rem]">
                          {fullDescription}
                        </p>
                      </div>
                    </div>
                  </HoverTooltip>
                  
                  {/* Bottom section without tooltip - Tags, Price, Status, Button */}
                  <div className="px-4 pb-4 flex flex-col flex-1">
                    {/* Tags section */}
                    <div className="mb-3">
                      {item.tags && item.tags.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {item.tags.map((tag: string, index: number) => (
                            <span key={index} className="px-2 py-1 bg-noir-700 text-xs rounded-full text-gray-300">
                              {tag}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <div></div>
                      )}
                    </div>
                    
                    {/* Price */}
                    <div className="mb-3">
                      <span className="text-primary font-bold text-base">{formatPrice(item.price)}</span>
                    </div>
                    
                    {/* Status and Button */}
                    <div className="flex justify-between items-center mt-auto">
                      <span className={`text-base font-medium ${item.isAvailable ? "text-green-400" : "text-red-400"}`}>
                        {item.isAvailable ? t('menu.available') : t('menu.soldOut')}
                      </span>
                      <Button
                        onClick={() => handleAddToCart(item)}
                        disabled={!item.isAvailable}
                        className={`bg-primary hover:bg-primary/90 text-primary-foreground transition-all ${
                          !item.isAvailable 
                            ? 'opacity-30 cursor-not-allowed grayscale hover:bg-primary' 
                            : 'opacity-100'
                        }`}
                      >
                        {t('menu.addToCart')}
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Customization Modal */}
      <CustomizationModal 
        open={isCustomizationModalOpen} 
        onOpenChange={setIsCustomizationModalOpen}
        menuItem={selectedMenuItem as any}
        schema={selectedSchema}
      />
      
      {/* Multi Customization Modal */}
      <MultiCustomizationModal 
        open={isMultiCustomizationModalOpen} 
        onOpenChange={setIsMultiCustomizationModalOpen}
        menuItem={selectedMenuItem as any}
        schemas={selectedSchemas}
      />
    </div>
  );
}
