import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { Globe } from "lucide-react";

export function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage();

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() => setLanguage(language === "en" ? "vi" : "en")}
      className="flex items-center gap-2"
      data-testid="language-switcher"
    >
      <Globe className="w-4 h-4" />
      {language === "en" ? "English" : "Tiếng Việt"}
    </Button>
  );
}