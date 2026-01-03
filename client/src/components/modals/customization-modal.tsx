import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X } from "lucide-react";
import { useCart } from "@/hooks/use-cart";
import { useLanguage } from "@/contexts/LanguageContext";
import { formatPrice } from "@/lib/currency";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";

interface CustomizationOption {
  id: string;
  name: string;
  nameVi?: string;
  priceModifier: number;
  basePrice?: number;
}

interface CustomizationSchema {
  id: string;
  name: string;
  nameVi?: string;
  type: string;
  description?: string;
  descriptionVi?: string;
  config: {
    halfAndHalfFee?: number;
    allowedCategories?: string[];
    sizes?: Array<{id: string, name: string, nameVi?: string, priceModifier: number, basePrice?: number}>;
    options?: Array<{id: string, name: string, nameVi?: string, price: number, basePrice?: number, required?: boolean}>;
    toppings?: Array<{id: string, name: string, nameVi?: string}>;
    allowMultiple?: boolean;
    maxSelections?: number;
    minSelections?: number;
  };
  pricingConfig?: {
    halfAndHalfFee?: number;
    size_18cm_price?: number;
  };
  isActive: boolean;
}

interface MenuItem {
  id: string;
  name: string;
  nameVi?: string;
  price: number;
  categoryId: string;
  customizationSchemaId?: string;
}

interface CustomizationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  menuItem: MenuItem | null;
  schema: CustomizationSchema | null;
}

export default function CustomizationModal({ 
  open, 
  onOpenChange, 
  menuItem, 
  schema 
}: CustomizationModalProps) {
  const { addItem } = useCart();
  const { language } = useLanguage();
  const { toast } = useToast();
  
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string | string[]>>({});
  const [orderMode, setOrderMode] = useState<string>(""); // "hh", "original", or "single_half"
  const [secondFlavor, setSecondFlavor] = useState<string>("");
  
  // Fetch available pizza items for second flavor selection
  const { data: menuItemsResponse = [] } = useQuery<any[]>({
    queryKey: ["/api/menu-items"],
    enabled: open && schema?.type === "half_and_half"
  });

  // Transform the API response to get flat menu items array
  const menuItems: MenuItem[] = menuItemsResponse
    .map((item: any) => {
      const menuItem = item.menu_items || item;
      return {
        id: menuItem.id,
        name: menuItem.name,
        nameVi: menuItem.nameVi,
        price: parseFloat(menuItem.price) || 0,
        categoryId: menuItem.categoryId,
        customizationSchemaId: menuItem.customizationSchemaId
      };
    })
    .filter((item: MenuItem) => 
      item.id && 
      item.id.trim() !== "" && 
      item.name && 
      item.name.trim() !== "" &&
      item.categoryId && 
      item.categoryId.trim() !== ""
    );

  // Reset selections when modal opens/closes
  useEffect(() => {
    if (!open) {
      setSelectedOptions({});
      setOrderMode("");
      setSecondFlavor("");
    } else if (schema?.type === "size_selection") {
      // Set default size for size selection schema
      setSelectedOptions({ size: "16cm" });
    }
  }, [open, schema?.type]);

  // Reset second flavor when order mode changes
  useEffect(() => {
    if (orderMode !== "hh") {
      setSecondFlavor("");
    }
  }, [orderMode]);
  
  if (!menuItem || !schema) return null;

  const getDisplayName = (item: { name: string; nameVi?: string }) => {
    return language === 'vi' && item.nameVi ? item.nameVi : item.name;
  };

  // Get available pizzas for second flavor (same category, excluding current item)
  const getAvailablePizzasForSecondFlavor = (): MenuItem[] => {
    const filtered = menuItems.filter((item) => {
      const isValidItem = item && 
        item.id && 
        item.id.trim() !== "" && 
        item.name && 
        item.name.trim() !== "" &&
        item.categoryId === menuItem.categoryId && 
        item.id !== menuItem.id;
      

      
      return isValidItem;
    });
    

    return filtered;
  };

  // Round price to nearest 1000 VND
  const roundPrice = (price: number) => {
    return Math.round(price / 1000) * 1000;
  };

  const calculateTotalPrice = () => {
    const P_base = typeof menuItem.price === 'string' ? parseFloat(menuItem.price) : menuItem.price;
    let total = P_base; // Default to original price

    if (schema.type === "half_and_half") {
      if (orderMode === "hh") {
        // Half & Half mode: 50% of original pizza + 50% of second flavor + service fee from schema
        const selectedSecondPizza = menuItems.find((item) => item.id === secondFlavor);
        const secondPizzaPrice = selectedSecondPizza ? (typeof selectedSecondPizza.price === 'string' ? parseFloat(selectedSecondPizza.price) : selectedSecondPizza.price) : 0;
        
        // Get service fee from schema configuration or use default 10,000 VND
        const serviceFee = schema.config?.halfAndHalfFee || 
                          (schema as any).pricingConfig?.halfAndHalfFee || 
                          10000;
        
        total = roundPrice((P_base * 0.5) + (secondPizzaPrice * 0.5) + serviceFee);
      } else {
        // Default to original price when no Half & Half selected
        total = P_base;
      }
    } else if (schema.type === "size_selection") {
      // Size selection mode: Base price + size modifier
      total = P_base;
      
      // Add size price modifier for any selected size
      if (selectedOptions.size && typeof selectedOptions.size === 'string') {
        const sizePrice = (schema as any).pricingConfig?.[selectedOptions.size]?.price || 0;
        total += sizePrice;
      }
    } else if (schema.type === "additional_toppings") {
      // Additional toppings mode: Base price + selected toppings
      total = P_base;
      
      // Add prices for selected toppings using pricingConfig
      if (selectedOptions.toppings && Array.isArray(selectedOptions.toppings)) {
        selectedOptions.toppings.forEach((toppingId: string) => {
          const price = (schema as any).pricingConfig?.[toppingId]?.price || 0;
          total += price;
        });
      }
    }


    // Add other extras (Σ_extras) if any
    if (schema.config?.options && schema.type !== "additional_toppings") {
      Object.values(selectedOptions).forEach(optionId => {
        const option = schema.config.options?.find((opt: any) => opt.id === optionId);
        if (option) {
          total += option.price || 0;
        }
      });
    }

    return roundPrice(total);
  };

  const handleAddToCart = () => {
    // Validate selections based on schema requirements
    if (schema.type === "size_selection" && !selectedOptions.size) {
      toast({
        title: language === 'vi' ? "Vui lòng chọn kích thước" : "Please select size",
        variant: "destructive"
      });
      return;
    }
    
    if (schema.type === "half_and_half" && orderMode === "hh") {
      // Only validate when Half & Half is specifically selected
      if (!secondFlavor) {
        toast({
          title: language === 'vi' ? "Vui lòng chọn hương vị thứ 2" : "Please select second flavor",
          variant: "destructive"
        });
        return;
      }
      
      // Check for same flavor constraint
      if (secondFlavor === menuItem.id) {
        toast({
          title: language === 'vi' ? "Không thể chọn cùng hương vị cho cả 2 nửa" : "Cannot select same flavor for both halves",
          variant: "destructive"
        });
        return;
      }
    }

    // Convert array selections to strings for cart compatibility
    const cartSelections: Record<string, string> = {};
    Object.entries(selectedOptions).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        cartSelections[key] = value.join(',');
      } else {
        cartSelections[key] = value;
      }
    });

    const customization = {
      schemaId: schema.id,
      selections: cartSelections,
      orderMode,
      secondFlavor: secondFlavor
    };

    addItem({
      id: menuItem.id,
      name: getDisplayName(menuItem),
      price: calculateTotalPrice(),
      customization
    });

    toast({
      title: language === 'vi' ? "Đã thêm vào giỏ hàng!" : "Added to cart!",
    });

    onOpenChange(false);
    setSelectedOptions({});
    setOrderMode("");
    setSecondFlavor("");
  };

  const renderSizeSelection = () => {
    if (!schema.config?.sizes) return null;
    
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-white">
          {language === 'vi' ? "Loại Đặt Hàng" : "Order Type"}
        </h3>
        <RadioGroup 
          value={typeof selectedOptions.size === 'string' ? selectedOptions.size : ""} 
          onValueChange={(value) => setSelectedOptions({ ...selectedOptions, size: value })}
          className="space-y-3"
        >
          {schema.config.sizes.map((size: CustomizationOption) => (
            <div key={size.id} className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <RadioGroupItem value={size.id} id={size.id} className="border-gold" />
                <Label htmlFor={size.id} className="text-white cursor-pointer">
                  {getDisplayName(size)} - {formatPrice(menuItem.price + size.priceModifier)}
                </Label>
              </div>
            </div>
          ))}
        </RadioGroup>
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm bg-black border-zinc-800 text-white p-6">
        {/* Title */}
        <div className="text-center space-y-2 pb-6">
          <DialogTitle className="text-2xl font-bold text-white">
            {getDisplayName(menuItem)}
          </DialogTitle>
          <DialogDescription className="text-zinc-400 text-sm">
            {(() => {
              if (schema.type === "size_selection") {
                return language === 'vi' 
                  ? "Chọn kích cỡ pizza phù hợp cho bữa ăn của bạn" 
                  : "Choose the perfect pizza size for your meal";
              } else if (schema.type === "half_and_half") {
                return language === 'vi' 
                  ? "Kết hợp hai hương vị trên một chiếc pizza" 
                  : "Combine two flavors on one pizza";
              } else if (schema.type === "additional_toppings") {
                return language === 'vi' 
                  ? "Tùy chỉnh pizza với các món ăn kèm thêm" 
                  : "Customize your pizza with additional toppings";
              } else {
                return language === 'vi' 
                  ? "Chọn cách thức đặt pizza của bạn" 
                  : "Choose how to order your pizza";
              }
            })()}
          </DialogDescription>
        </div>

        {/* Selection Options */}
        <div className="space-y-6">
          {/* Size Selection Schema - Chicago Pizza */}
          {schema.type === "size_selection" && (
            <div>
              <h3 className="text-lg font-semibold text-white mb-4">
                {language === 'vi' ? "Chọn Kích Thước" : "Select Size"}
              </h3>
              <div className="space-y-3">
                {schema.config?.sizes?.map((size: any, index: number) => {
                  const isSelected = selectedOptions.size === size.id || (!selectedOptions.size && index === 0);
                  const price = (schema as any).pricingConfig?.[size.id]?.price || 0;
                  
                  return (
                    <div key={size.id} className="flex items-center space-x-3">
                      <div 
                        className={`w-5 h-5 rounded-full border-2 cursor-pointer transition-colors ${
                          isSelected ? 'border-yellow-500' : 'border-zinc-500'
                        }`}
                        onClick={() => setSelectedOptions({...selectedOptions, size: size.id})}
                        data-testid={`radio-size-${size.id}`}
                      >
                        {isSelected && (
                          <div className="w-3 h-3 rounded-full bg-yellow-500 m-0.5"></div>
                        )}
                      </div>
                      <div 
                        className="flex-1 cursor-pointer flex justify-between items-center"
                        onClick={() => setSelectedOptions({...selectedOptions, size: size.id})}
                      >
                        <span className="text-white font-medium">
                          {language === 'vi' ? (size.nameVi || size.name) : size.name}
                        </span>
                        <span className={`font-medium ${price > 0 ? 'text-yellow-500' : 'text-white'}`} data-testid={`price-size-${size.id}`}>
                          {price > 0 ? `+${formatPrice(price)}` : formatPrice(menuItem.price)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Half & Half Schema */}
          {schema.type === "half_and_half" && (
            <div>
              <h3 className="text-lg font-semibold text-white mb-4">
                {language === 'vi' ? "Tùy Chọn" : "Options"}
              </h3>
              <div className="space-y-3">
                {/* Half & Half Option - Toggle */}
                <div className="flex items-center space-x-3">
                  <div 
                    className={`w-5 h-5 rounded-full border-2 cursor-pointer transition-colors ${
                      orderMode === "hh"
                        ? 'border-yellow-500' 
                        : 'border-zinc-500'
                    }`}
                    onClick={() => setOrderMode(orderMode === "hh" ? "" : "hh")}
                    data-testid="toggle-half-and-half"
                  >
                    {orderMode === "hh" && (
                      <div className="w-3 h-3 rounded-full bg-yellow-500 m-0.5"></div>
                    )}
                  </div>
                  <div 
                    className="flex-1 cursor-pointer flex justify-between items-center"
                    onClick={() => setOrderMode(orderMode === "hh" ? "" : "hh")}
                  >
                    <span className="text-white font-medium">
                      {language === 'vi' ? "Half & Half" : "Half & Half"}
                    </span>
                    <span className="text-yellow-500 font-medium text-sm" data-testid="price-half-and-half">
                      {(() => {
                        const serviceFee = schema.config?.halfAndHalfFee || 
                                          (schema as any).pricingConfig?.halfAndHalfFee || 
                                          10000;
                        return `+ ${formatPrice(serviceFee)}`;
                      })()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Second Flavor Selection - Only show when Half & Half is selected */}
              {orderMode === "hh" && (
                <div className="mt-6">
                  <h4 className="text-base font-medium text-white mb-3">
                    {language === 'vi' ? "Hương vị thứ 2" : "Second Flavor"}
                  </h4>
                  <Select value={secondFlavor} onValueChange={setSecondFlavor}>
                    <SelectTrigger className="bg-zinc-800 border-zinc-600 text-white" data-testid="select-second-flavor">
                      <SelectValue 
                        placeholder={language === 'vi' ? "Chọn hương vị thứ 2" : "Select second flavor"}
                      />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-800 border-zinc-600">
                      {getAvailablePizzasForSecondFlavor().length > 0 ? (
                        getAvailablePizzasForSecondFlavor()
                          .filter((item) => item.id && item.id.trim() !== "" && item.name)
                          .map((item) => (
                            <SelectItem 
                              key={`second-flavor-${item.id}`} 
                              value={item.id}
                              className="text-white hover:bg-zinc-700"
                              data-testid={`option-second-flavor-${item.id}`}
                            >
                              <div className="flex justify-between items-center w-full">
                                <span>{getDisplayName(item)}</span>
                                <span className="ml-2 text-yellow-500">+{formatPrice(item.price * 0.5)}</span>
                              </div>
                            </SelectItem>
                          ))
                      ) : (
                        <SelectItem value="no-items-available" disabled className="text-zinc-500">
                          {language === 'vi' ? "Không có hương vị khác" : "No other flavors available"}
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>
              )}


            </div>
          )}

          {/* Additional Toppings Schema */}
          {schema.type === "additional_toppings" && schema.config?.toppings && (
            <div>
              <h3 className="text-lg font-semibold text-white mb-4">
                {language === 'vi' ? "Món Ăn Kèm" : "Additional Toppings"}
              </h3>
              <div className="space-y-3">
                {schema.config.toppings.map((topping: any) => {
                  const isSelected = Array.isArray(selectedOptions.toppings) && selectedOptions.toppings.includes(topping.id);
                  const price = (schema as any).pricingConfig?.[topping.id]?.price || 0;
                  return (
                    <div key={topping.id} className="flex items-center space-x-3">
                      <div 
                        className={`w-5 h-5 rounded border-2 cursor-pointer transition-colors ${
                          isSelected
                            ? 'border-yellow-500 bg-yellow-500' 
                            : 'border-zinc-500'
                        }`}
                        onClick={() => {
                          const currentToppings = Array.isArray(selectedOptions.toppings) ? selectedOptions.toppings : [];
                          const newToppings = isSelected 
                            ? currentToppings.filter((t: string) => t !== topping.id)
                            : [...currentToppings, topping.id];
                          setSelectedOptions({...selectedOptions, toppings: newToppings});
                        }}
                        data-testid={`checkbox-topping-${topping.id}`}
                      >
                        {isSelected && (
                          <div className="w-3 h-3 bg-black m-0.5 rounded-sm flex items-center justify-center">
                            <div className="w-2 h-1 bg-black transform rotate-45"></div>
                          </div>
                        )}
                      </div>
                      <div 
                        className="flex-1 cursor-pointer flex justify-between items-center"
                        onClick={() => {
                          const currentToppings = Array.isArray(selectedOptions.toppings) ? selectedOptions.toppings : [];
                          const newToppings = isSelected 
                            ? currentToppings.filter((t: string) => t !== topping.id)
                            : [...currentToppings, topping.id];
                          setSelectedOptions({...selectedOptions, toppings: newToppings});
                        }}
                      >
                        <span className="text-white font-medium">
                          {language === 'vi' ? (topping.nameVi || topping.name) : topping.name}
                        </span>
                        <span className="text-yellow-500 font-medium" data-testid={`price-topping-${topping.id}`}>
                          +{formatPrice(price)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {schema.description && (
            <div>
              <p className="text-zinc-400 text-sm mb-4">
                {getDisplayName({ name: schema.description || "", nameVi: schema.descriptionVi })}
              </p>
            </div>
          )}
        </div>

        {/* Total Price */}
        <div className="bg-zinc-800/80 rounded-lg p-4 border border-zinc-700 my-6">
          <div className="flex justify-between items-center">
            <span className="text-zinc-300 text-base">
              {language === 'vi' ? "Tổng Giá:" : "Total Price:"}
            </span>
            <span className="text-yellow-500 font-bold text-xl">
              {formatPrice(calculateTotalPrice())}
            </span>


          </div>
        </div>

        {/* Action Button */}
        <Button
          onClick={handleAddToCart}
          className="w-full bg-yellow-600 hover:bg-yellow-500 text-black font-bold py-3 text-base rounded-lg"
        >
          {language === 'vi' ? "Thêm Vào Giỏ Hàng" : "Add To Cart"}
        </Button>
      </DialogContent>
    </Dialog>
  );
}