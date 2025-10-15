import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useCart } from "@/hooks/use-cart";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { useContentTranslation } from "@/hooks/useContentTranslation";
import { formatPrice } from "@/lib/currency";
import type { MenuItem } from "@shared/schema";

interface PizzaOrderModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pizza: MenuItem | null;
}

export default function PizzaOrderModal({ open, onOpenChange, pizza }: PizzaOrderModalProps) {
  const [orderType, setOrderType] = useState<"full" | "half">("full");
  const [secondPizza, setSecondPizza] = useState<string>("");
  const { addItem } = useCart();
  const { toast } = useToast();
  const { language } = useLanguage();
  const { getTranslatedContent } = useContentTranslation();

  // Fetch other pizza items for half & half selection
  const { data: menuItems = [], isLoading } = useQuery<MenuItem[]>({
    queryKey: ["/api/menu-items"],
    queryFn: async () => {
      const response = await fetch("/api/menu-items");
      if (!response.ok) throw new Error('Failed to fetch menu items');
      return response.json();
    },
  });

  // Filter for pizza items, excluding the current pizza
  const otherPizzas = menuItems.filter((item: any) => 
    item.id !== pizza?.id &&
    (item.tags?.some((tag: string) => tag?.toLowerCase()?.includes('pizza')) ||
     item.name?.toLowerCase()?.includes('pizza') ||
     item.nameVi?.toLowerCase()?.includes('pizza'))
  );

  const selectedSecondPizza = otherPizzas.find((item: any) => item.id === secondPizza);

  const calculatePrice = () => {
    if (!pizza) return 0;
    if (orderType === "full") {
      return parseFloat(pizza.price);
    } else {
      if (!selectedSecondPizza) return parseFloat(pizza.price);
      return (parseFloat(pizza.price) + parseFloat(selectedSecondPizza.price)) / 2;
    }
  };

  const handleAddToCart = () => {
    if (!pizza) return;

    if (orderType === "half" && !selectedSecondPizza) {
      toast({
        title: language === 'vi' ? "Lỗi" : "Error",
        description: language === 'vi' ? "Vui lòng chọn pizza thứ hai" : "Please select the second pizza",
        variant: "destructive",
      });
      return;
    }

    let itemName: string;
    let itemNameVi: string | undefined;

    if (orderType === "full") {
      itemName = pizza.name;
      itemNameVi = pizza.nameVi || undefined;
    } else {
      const firstName = getTranslatedContent({
        en: pizza.name,
        vi: pizza.nameVi || undefined
      }, pizza.name);

      const secondName = getTranslatedContent({
        en: selectedSecondPizza!.name,
        vi: selectedSecondPizza!.nameVi || undefined
      }, selectedSecondPizza!.name);

      itemName = `Half & Half: ${pizza.name} + ${selectedSecondPizza!.name}`;
      itemNameVi = `Nửa & Nửa: ${pizza.nameVi || pizza.name} + ${selectedSecondPizza!.nameVi || selectedSecondPizza!.name}`;
    }

    addItem({
      id: orderType === "full" ? pizza.id : `half-${pizza.id}-${secondPizza}`,
      name: itemName,
      nameVi: itemNameVi,
      price: calculatePrice(),
      image: pizza.imageUrl || undefined,
    });

    const displayName = language === 'vi' && itemNameVi ? itemNameVi : itemName;

    toast({
      title: language === 'vi' ? "Đã thêm vào giỏ hàng" : "Added to cart",
      description: language === 'vi' 
        ? `${displayName} đã được thêm vào giỏ hàng` 
        : `${displayName} has been added to your cart`,
    });

    onOpenChange(false);
    setOrderType("full");
    setSecondPizza("");
  };

  if (!pizza) return null;

  const pizzaName = getTranslatedContent({
    en: pizza.name,
    vi: pizza.nameVi || undefined
  }, pizza.name);

  if (isLoading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="bg-noir-900 border-noir-700 max-w-lg">
          <div className="text-center py-8">
            <div className="animate-spin w-8 h-8 border-2 border-yellow-500 border-t-transparent rounded-full mx-auto"></div>
            <p className="text-white mt-4">{language === 'vi' ? 'Đang tải...' : 'Loading...'}</p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-noir-900 border-noir-700 max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-white text-center">
            {pizzaName}
          </DialogTitle>
          <p className="text-zinc-400 text-center">
            {language === 'vi' 
              ? 'Chọn cách thức đặt pizza của bạn' 
              : 'Choose how to order your pizza'
            }
          </p>
        </DialogHeader>

        <div className="space-y-6">
          {/* Order Type Selection */}
          <div>
            <Label className="text-white text-lg mb-3 block">
              {language === 'vi' ? 'Loại Đặt Hàng' : 'Order Type'}
            </Label>
            <RadioGroup value={orderType} onValueChange={(value: "full" | "half") => setOrderType(value)}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="full" id="full" />
                <label htmlFor="full" className="text-white cursor-pointer">
                  {language === 'vi' ? 'Pizza Nguyên' : 'Whole Pizza'} - {formatPrice(parseFloat(pizza.price))}
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="half" id="half" />
                <label htmlFor="half" className="text-white cursor-pointer">
                  {language === 'vi' ? 'Pizza Nửa & Nửa' : 'Half & Half Pizza'}
                </label>
              </div>
            </RadioGroup>
          </div>

          {/* Second Pizza Selection for Half & Half */}
          {orderType === "half" && (
            <div>
              <Label className="text-white text-lg mb-3 block">
                {language === 'vi' ? 'Chọn Pizza Thứ Hai' : 'Select Second Pizza'}
              </Label>
              <Select value={secondPizza} onValueChange={setSecondPizza}>
                <SelectTrigger className="bg-noir-800 border-noir-700 text-white">
                  <SelectValue placeholder={language === 'vi' ? 'Chọn pizza...' : 'Select pizza...'} />
                </SelectTrigger>
                <SelectContent className="bg-noir-800 border-noir-700 max-h-60">
                  {otherPizzas.map((otherPizza: any) => (
                    <SelectItem key={otherPizza.id} value={otherPizza.id} className="text-white">
                      <div className="flex items-center justify-between w-full">
                        <span>
                          {getTranslatedContent({
                            en: otherPizza.name,
                            vi: otherPizza.nameVi || undefined
                          }, otherPizza.name)}
                        </span>
                        <span className="text-yellow-500 ml-4">
                          {formatPrice(parseFloat(otherPizza.price))}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Price Display */}
          <div className="bg-noir-800 rounded-lg p-4 border border-noir-600">
            <div className="flex justify-between items-center">
              <span className="text-white font-medium">
                {language === 'vi' ? 'Tổng Giá:' : 'Total Price:'}
              </span>
              <span className="text-yellow-500 text-xl font-bold">
                {formatPrice(calculatePrice())}
              </span>
            </div>
            
            {orderType === "half" && selectedSecondPizza && (
              <p className="text-zinc-400 text-sm mt-2">
                {language === 'vi' 
                  ? 'Giá trung bình của 2 loại pizza' 
                  : 'Average price of 2 pizza types'
                }
              </p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1 border-noir-600 text-white hover:bg-noir-800"
            >
              {language === 'vi' ? 'Hủy' : 'Cancel'}
            </Button>
            <Button
              onClick={handleAddToCart}
              disabled={orderType === "half" && !secondPizza}
              className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              {language === 'vi' ? 'Thêm Vào Giỏ Hàng' : 'Add to Cart'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}