import { useLanguage } from "@/contexts/LanguageContext";

interface ContentWithTranslation {
  en?: string;
  vi?: string;
}

/**
 * Hook để tự động hiển thị nội dung theo ngôn ngữ được chọn
 * Sử dụng cho menu items, blog posts, và nội dung động khác
 */
export function useContentTranslation() {
  const { language } = useLanguage();

  const getTranslatedContent = (
    content: ContentWithTranslation,
    fallback?: string
  ): string => {
    if (language === "vi" && content.vi) {
      return content.vi;
    }
    
    if (language === "en" && content.en) {
      return content.en;
    }
    
    // Fallback logic: try other language if current not available
    return content.vi || content.en || fallback || "";
  };

  return {
    getTranslatedContent,
    currentLanguage: language
  };
}

/**
 * Auto-translation suggestions for content creation
 * Có thể mở rộng để tích hợp với translation APIs
 */
export function getTranslationSuggestions(text: string, sourceLang: "en" | "vi") {
  // Một số gợi ý dịch cơ bản cho các từ phổ biến trong nhà hàng
  const commonTranslations = {
    en: {
      "appetizer": "khai vị",
      "main course": "món chính", 
      "dessert": "tráng miệng",
      "beverage": "đồ uống",
      "signature": "đặc sản",
      "spicy": "cay",
      "vegetarian": "chay",
      "fresh": "tươi",
      "grilled": "nướng",
      "fried": "chiên",
      "steamed": "hấp",
      "delicious": "ngon",
      "traditional": "truyền thống",
      "popular": "phổ biến"
    },
    vi: {
      "khai vị": "appetizer",
      "món chính": "main course",
      "tráng miệng": "dessert", 
      "đồ uống": "beverage",
      "đặc sản": "signature",
      "cay": "spicy",
      "chay": "vegetarian",
      "tươi": "fresh",
      "nướng": "grilled",
      "chiên": "fried",
      "hấp": "steamed",
      "ngon": "delicious",
      "truyền thống": "traditional",
      "phổ biến": "popular"
    }
  };

  const translations = commonTranslations[sourceLang];
  const suggestions: string[] = [];

  Object.entries(translations).forEach(([key, value]) => {
    if (text.toLowerCase().includes(key.toLowerCase())) {
      suggestions.push(`"${key}" → "${value}"`);
    }
  });

  return suggestions;
}