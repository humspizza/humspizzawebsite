import { useState, useEffect, useMemo } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCart } from "@/hooks/use-cart";
import { useLanguage } from "@/contexts/LanguageContext";
import { formatPrice } from "@/lib/currency";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";

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
    [key: string]: any;
  };
  isActive: boolean;
  isRequired?: boolean;
}

interface MenuItem {
  id: string;
  name: string;
  nameVi?: string;
  price: number;
  vatRate?: string;
  categoryId: string;
  customizationSchemaId?: string;
}

interface MultiCustomizationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  menuItem: MenuItem | null;
  schemas: CustomizationSchema[];
}

export default function MultiCustomizationModal({ 
  open, 
  onOpenChange, 
  menuItem, 
  schemas 
}: MultiCustomizationModalProps) {
  const { addItem } = useCart();
  const { language } = useLanguage();
  const { toast } = useToast();
  
  // State: selectedOptions[schemaId][optionKey] = value
  const [selectedOptions, setSelectedOptions] = useState<Record<string, Record<string, string | string[] | undefined>>>({});
  const [orderModes, setOrderModes] = useState<Record<string, string>>({});
  const [secondFlavors, setSecondFlavors] = useState<Record<string, string>>({});
  
  // Fetch available pizza items for second flavor selection
  const { data: menuItemsResponse = [] } = useQuery<any[]>({
    queryKey: ["/api/menu-items"],
    enabled: open && schemas.some(schema => schema.type === "half_and_half")
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

  // Reset all selections when modal opens/closes
  useEffect(() => {
    if (!open) {
      setSelectedOptions({});
      setOrderModes({});
      setSecondFlavors({});
    } else {
      // Initialize default selections for each schema
      const initialSelections: Record<string, Record<string, string | string[]>> = {};
      const initialOrderModes: Record<string, string> = {};
      
      schemas.forEach(schema => {
        initialSelections[schema.id] = {};
        initialOrderModes[schema.id] = "";
        
        // Set defaults based on schema type
        if (schema.type === "size_selection") {
          // No default size - require user selection for proper validation
          // No default size - user must select
        } else if (schema.type === "additional_toppings") {
          // Initialize based on selection mode to avoid type mismatch
          const isSingleSelect = schema.config?.maxSelections === 1;
          initialSelections[schema.id].toppings = isSingleSelect ? '' : [];
        } else if (schema.type === "single_choice_options") {
          // Initialize single choice to empty string
          initialSelections[schema.id].selectedOption = '';
        }
      });
      
      setSelectedOptions(initialSelections);
      setOrderModes(initialOrderModes);
    }
  }, [open, schemas]);

  const getDisplayName = (item: { name: string; nameVi?: string }) => {
    return language === 'vi' && item.nameVi ? item.nameVi : item.name;
  };

  // Get available pizzas for second flavor (same category, excluding current item)
  const getAvailablePizzasForSecondFlavor = (): MenuItem[] => {
    if (!menuItem) return [];
    return menuItems.filter((item) => {
      return item && 
        item.id && 
        item.id.trim() !== "" && 
        item.name && 
        item.name.trim() !== "" &&
        item.categoryId === menuItem.categoryId && 
        item.id !== menuItem.id;
    });
  };

  // Round price to nearest 1000 VND
  const roundPrice = (price: number) => {
    return Math.round(price / 1000) * 1000;
  };

  // Calculate total price with memoization for reactivity
  const totalPrice = useMemo(() => {
    if (!menuItem) return 0;
    const P_base = typeof menuItem.price === 'string' ? parseFloat(menuItem.price) : menuItem.price;
    
    // Step 1: Calculate base price (either full pizza or half & half baseline)
    let basePrice = P_base;
    let isHalfAndHalf = false;
    
    // First pass: Check for Half & Half to establish baseline
    schemas.forEach(schema => {
      const orderMode = orderModes[schema.id] || "";
      const secondFlavor = secondFlavors[schema.id] || "";
      
      if (schema.type === "half_and_half" && orderMode === "hh") {
        isHalfAndHalf = true;
        const selectedSecondPizza = menuItems.find((item) => item.id === secondFlavor);
        const secondPizzaPrice = selectedSecondPizza ? 
          (typeof selectedSecondPizza.price === 'string' ? parseFloat(selectedSecondPizza.price) : selectedSecondPizza.price) : 0;
        
        const serviceFee = schema.config?.halfAndHalfFee || 10000;
        basePrice = (P_base * 0.5) + (secondPizzaPrice * 0.5) + serviceFee;
      }
    });
    
    // Step 2: Add all modifiers additively to the base price
    let modifierTotal = 0;
    
    schemas.forEach(schema => {
      const schemaSelections = selectedOptions[schema.id] || {};
      
      if (schema.type === "size_selection") {
        // Add size price from pricingConfig
        if (schemaSelections.size && typeof schemaSelections.size === 'string') {
          const sizePrice = schema.pricingConfig?.[schemaSelections.size]?.price || 0;
          modifierTotal += sizePrice;
        }
      } else if (schema.type === "additional_toppings") {
        // Add selected toppings prices from pricingConfig
        if (schemaSelections.toppings && Array.isArray(schemaSelections.toppings)) {
          // Multiple select mode: array of topping IDs
          schemaSelections.toppings.forEach((toppingId: string) => {
            const toppingPrice = schema.pricingConfig?.[toppingId]?.price || 0;
            modifierTotal += toppingPrice;
          });
        } else if (typeof schemaSelections.toppings === 'string' && schemaSelections.toppings) {
          // Single select mode: string topping ID
          const toppingPrice = schema.pricingConfig?.[schemaSelections.toppings]?.price || 0;
          modifierTotal += toppingPrice;
        }
      } else if (schema.type === "single_choice_options") {
        // Add selected option price from pricingConfig
        if (schemaSelections.selectedOption && typeof schemaSelections.selectedOption === 'string') {
          const optionPrice = schema.pricingConfig?.[schemaSelections.selectedOption]?.price ?? 
                              schema.config?.options?.find((opt: any) => opt.id === schemaSelections.selectedOption)?.price ?? 0;
          modifierTotal += optionPrice;
        }
      }
      
      // Add other extras from config.options (excluding toppings, half_and_half, and single_choice_options)
      if (schema.config?.options && !["additional_toppings", "half_and_half", "single_choice_options"].includes(schema.type)) {
        Object.values(schemaSelections).forEach(optionId => {
          const option = schema.config.options?.find((opt: any) => opt.id === optionId);
          if (option) {
            modifierTotal += option.price || 0;
          }
        });
      }
    });

    return roundPrice(basePrice + modifierTotal);
  }, [menuItem, schemas, selectedOptions, orderModes, secondFlavors, menuItems]);

  // Early return after all hooks are called
  if (!menuItem || schemas.length === 0) return null;

  const handleAddToCart = () => {
    // Validate selections for all schemas
    for (const schema of schemas) {
      const schemaSelections = selectedOptions[schema.id] || {};
      const orderMode = orderModes[schema.id] || "";
      const secondFlavor = secondFlavors[schema.id] || "";

      if (schema.type === "size_selection" && schema.isRequired && !schemaSelections.size) {
        toast({
          title: language === 'vi' ? "Vui lòng chọn kích thước" : "Please select size",
          variant: "destructive"
        });
        return;
      }
      
      if (schema.type === "half_and_half") {
        if (schema.isRequired && !orderMode) {
          toast({
            title: language === 'vi' ? "Vui lòng chọn một tùy chọn" : "Please select an option",
            variant: "destructive"
          });
          return;
        }
        
        if (orderMode === "hh") {
          if (!secondFlavor) {
            toast({
              title: language === 'vi' ? "Vui lòng chọn hương vị thứ 2" : "Please select second flavor",
              variant: "destructive"
            });
            return;
          }
          
          if (secondFlavor === menuItem.id) {
            toast({
              title: language === 'vi' ? "Không thể chọn cùng hương vị cho cả 2 nửa" : "Cannot select same flavor for both halves",
              variant: "destructive"
            });
            return;
          }
        }
      }

      if (schema.type === "additional_toppings") {
        const value = schemaSelections.toppings;
        const isSingleSelect = schema.config?.maxSelections === 1;
        
        // Calculate selection count based on single/multi select mode
        const selectedCount = isSingleSelect 
          ? (typeof value === 'string' && value.trim() ? 1 : 0)
          : (Array.isArray(value) ? value.length : 0);
        
        // Check if required
        if (schema.isRequired && selectedCount === 0) {
          const message = isSingleSelect 
            ? (language === 'vi' ? "Vui lòng chọn một tùy chọn" : "Please select an option")
            : (language === 'vi' ? "Vui lòng chọn ít nhất một topping" : "Please select at least one topping");
          toast({
            title: message,
            variant: "destructive"
          });
          return;
        }
        
        // Check min/max selection constraints from schema configuration
        if (schema.config) {
          if (schema.config.minSelections && selectedCount < schema.config.minSelections) {
            const optionWord = isSingleSelect ? 'tùy chọn' : 'topping';
            const optionWordEn = isSingleSelect ? 'option' : 'topping';
            toast({
              title: language === 'vi' 
                ? `Vui lòng chọn ít nhất ${schema.config.minSelections} ${optionWord}` 
                : `Please select at least ${schema.config.minSelections} ${optionWordEn}${schema.config.minSelections > 1 ? 's' : ''}`,
              variant: "destructive"
            });
            return;
          }
          
          if (schema.config.maxSelections && selectedCount > schema.config.maxSelections) {
            const optionWord = isSingleSelect ? 'tùy chọn' : 'topping';
            const optionWordEn = isSingleSelect ? 'option' : 'topping';
            toast({
              title: language === 'vi' 
                ? `Vui lòng chọn tối đa ${schema.config.maxSelections} ${optionWord}` 
                : `Please select no more than ${schema.config.maxSelections} ${optionWordEn}${schema.config.maxSelections > 1 ? 's' : ''}`,
              variant: "destructive"
            });
            return;
          }
        }
      }

      if (schema.type === "single_choice_options") {
        const selectedOption = schemaSelections.selectedOption;
        
        // Check if required
        if (schema.isRequired && (!selectedOption || selectedOption === '')) {
          toast({
            title: language === 'vi' ? "Vui lòng chọn một tùy chọn" : "Please select an option",
            variant: "destructive"
          });
          return;
        }
      }
    }

    // Prepare customization data for multiple schemas
    const multiCustomization = schemas.map(schema => {
      const schemaSelections = selectedOptions[schema.id] || {};
      const cartSelections: Record<string, string> = {};
      
      // Convert array selections to strings for cart compatibility, excluding undefined
      Object.entries(schemaSelections).forEach(([key, value]) => {
        if (value !== undefined) {
          if (Array.isArray(value)) {
            cartSelections[key] = value.join(',');
          } else {
            cartSelections[key] = value;
          }
        }
      });

      return {
        schemaId: schema.id,
        selections: cartSelections,
        orderMode: orderModes[schema.id] || "",
        secondFlavor: secondFlavors[schema.id] || ""
      };
    });

    addItem({
      id: menuItem.id,
      name: getDisplayName(menuItem),
      price: totalPrice,
      vatRate: parseFloat(menuItem.vatRate || "8"),
      customization: multiCustomization.length === 1 ? multiCustomization[0] : multiCustomization
    });

    toast({
      title: language === 'vi' ? "Đã thêm vào giỏ hàng!" : "Added to cart!",
    });

    onOpenChange(false);
  };

  const updateSchemaSelection = (schemaId: string, key: string, value: string | string[]) => {
    setSelectedOptions(prev => ({
      ...prev,
      [schemaId]: {
        ...prev[schemaId],
        [key]: value
      }
    }));
  };

  const updateOrderMode = (schemaId: string, mode: string) => {
    setOrderModes(prev => ({
      ...prev,
      [schemaId]: mode
    }));
  };

  const updateSecondFlavor = (schemaId: string, flavor: string) => {
    setSecondFlavors(prev => ({
      ...prev,
      [schemaId]: flavor
    }));
  };

  const renderSchema = (schema: CustomizationSchema, index: number) => {
    const schemaSelections = selectedOptions[schema.id] || {};
    const orderMode = orderModes[schema.id] || "";
    const secondFlavor = secondFlavors[schema.id] || "";

    return (
      <div key={schema.id} className="space-y-4 p-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-white">
            {getDisplayName(schema)}
          </h3>
        </div>
        
        {schema.description && (
          <p className="text-zinc-400 text-sm">
            {getDisplayName({ name: schema.description || "", nameVi: schema.descriptionVi })}
          </p>
        )}

        {/* Size Selection Schema */}
        {schema.type === "size_selection" && schema.config?.sizes && (
          <div className="space-y-3">
            {schema.config.sizes.map((size: any) => {
              const isSelected = schemaSelections.size === size.id;
              const price = schema.pricingConfig?.[size.id]?.price || 0;
              
              return (
                <div key={size.id} className="flex items-center space-x-3">
                  <div 
                    className={`w-5 h-5 rounded-full border-2 cursor-pointer transition-colors ${
                      isSelected ? 'border-yellow-500' : 'border-zinc-500'
                    }`}
                    onClick={() => updateSchemaSelection(schema.id, 'size', size.id)}
                    data-testid={`radio-size-${size.id}`}
                  >
                    {isSelected && (
                      <div className="w-3 h-3 rounded-full bg-yellow-500 m-0.5"></div>
                    )}
                  </div>
                  <div 
                    className="flex-1 cursor-pointer flex justify-between items-center"
                    onClick={() => updateSchemaSelection(schema.id, 'size', size.id)}
                  >
                    <span className="text-white font-medium">
                      {language === 'vi' ? (size.nameVi || size.name) : size.name}
                    </span>
                    <span className={`font-medium ${price > 0 ? 'text-yellow-500' : 'text-white'}`}>
                      {price > 0 ? `+${formatPrice(price)}` : formatPrice(menuItem.price)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Half & Half Schema */}
        {schema.type === "half_and_half" && (
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div 
                className={`w-5 h-5 rounded-full border-2 cursor-pointer transition-colors ${
                  orderMode === "hh" ? 'border-yellow-500' : 'border-zinc-500'
                }`}
                onClick={() => updateOrderMode(schema.id, orderMode === "hh" ? "" : "hh")}
                data-testid={`toggle-half-and-half-${schema.id}`}
              >
                {orderMode === "hh" && (
                  <div className="w-3 h-3 rounded-full bg-yellow-500 m-0.5"></div>
                )}
              </div>
              <div 
                className="flex-1 cursor-pointer flex justify-between items-center"
                onClick={() => updateOrderMode(schema.id, orderMode === "hh" ? "" : "hh")}
              >
                <span className="text-white font-medium">
                  {language === 'vi' ? "Half & Half" : "Half & Half"}
                </span>
                <span className="text-yellow-500 font-medium text-sm">
                  {(() => {
                    const serviceFee = schema.config?.halfAndHalfFee || 
                                      schema.pricingConfig?.halfAndHalfFee || 
                                      10000;
                    return `+ ${formatPrice(serviceFee)}`;
                  })()}
                </span>
              </div>
            </div>

            {orderMode === "hh" && (
              <div>
                <h4 className="text-base font-medium text-white mb-3">
                  {language === 'vi' ? "Hương vị thứ 2" : "Second Flavor"}
                </h4>
                <Select value={secondFlavor} onValueChange={(value) => updateSecondFlavor(schema.id, value)}>
                  <SelectTrigger className="bg-zinc-800 border-zinc-600 text-white">
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

        {/* Single Choice Options Schema */}
        {schema.type === "single_choice_options" && schema.config?.options && (
          <div className="space-y-3">
            {schema.config.options.map((option: any) => {
              const isSelected = schemaSelections.selectedOption === option.id;
              const price = schema.pricingConfig?.[option.id]?.price ?? option.price ?? 0;
              
              return (
                <div key={option.id} className="flex items-center space-x-3">
                  <div 
                    className={`w-5 h-5 rounded-full border-2 cursor-pointer transition-colors ${
                      isSelected ? 'border-yellow-500' : 'border-zinc-500'
                    }`}
                    onClick={() => {
                      updateSchemaSelection(schema.id, 'selectedOption', isSelected ? '' : option.id);
                    }}
                    data-testid={`radio-option-${option.id}`}
                  >
                    {isSelected && (
                      <div className="w-3 h-3 rounded-full bg-yellow-500 m-0.5"></div>
                    )}
                  </div>
                  <div 
                    className="flex-1 cursor-pointer flex justify-between items-center"
                    onClick={() => {
                      updateSchemaSelection(schema.id, 'selectedOption', isSelected ? '' : option.id);
                    }}
                  >
                    <span className="text-white font-medium">
                      {language === 'vi' ? (option.nameVi || option.name) : option.name}
                    </span>
                    <span className="text-yellow-500 font-medium">
                      +{formatPrice(price)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Additional Toppings Schema */}
        {schema.type === "additional_toppings" && schema.config?.toppings && (
          <div className="space-y-3">
            {schema.config.toppings.map((topping: any) => {
              const isSingleSelect = schema.config?.maxSelections === 1;
              const isSelected = isSingleSelect 
                ? schemaSelections.toppings === topping.id
                : Array.isArray(schemaSelections.toppings) && schemaSelections.toppings.includes(topping.id);
              const price = schema.pricingConfig?.[topping.id]?.price || 0;
              
              const handleClick = () => {
                if (isSingleSelect) {
                  // Single select: radio button behavior
                  updateSchemaSelection(schema.id, 'toppings', isSelected ? '' : topping.id);
                } else {
                  // Multiple select: checkbox behavior
                  const currentToppings = Array.isArray(schemaSelections.toppings) ? schemaSelections.toppings : [];
                  const newToppings = isSelected 
                    ? currentToppings.filter((t: string) => t !== topping.id)
                    : [...currentToppings, topping.id];
                  updateSchemaSelection(schema.id, 'toppings', newToppings);
                }
              };
              
              return (
                <div key={topping.id} className="flex items-center space-x-3">
                  <div 
                    className={`w-5 h-5 ${isSingleSelect ? 'rounded-full' : 'rounded'} border-2 cursor-pointer transition-colors ${
                      isSelected ? 'border-yellow-500' : 'border-zinc-500'
                    } ${!isSingleSelect && isSelected ? 'bg-yellow-500' : ''}`}
                    onClick={handleClick}
                    data-testid={`${isSingleSelect ? 'radio' : 'checkbox'}-topping-${topping.id}`}
                  >
                    {isSelected && (
                      isSingleSelect ? (
                        // Radio button style (dot)
                        <div className="w-3 h-3 rounded-full bg-yellow-500 m-0.5"></div>
                      ) : (
                        // Checkbox style (checkmark)
                        <div className="w-3 h-3 bg-black m-0.5 rounded-sm flex items-center justify-center">
                          <div className="w-2 h-1 bg-black transform rotate-45"></div>
                        </div>
                      )
                    )}
                  </div>
                  <div 
                    className="flex-1 cursor-pointer flex justify-between items-center"
                    onClick={handleClick}
                  >
                    <span className="text-white font-medium">
                      {language === 'vi' ? (topping.nameVi || topping.name) : topping.name}
                    </span>
                    <span className="text-yellow-500 font-medium">
                      +{formatPrice(price)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-black border-zinc-800 text-white p-6 max-h-[90vh] overflow-y-auto">
        {/* Title */}
        <div className="text-center space-y-2 pb-6">
          <DialogTitle className="text-2xl font-bold text-white">
            {getDisplayName(menuItem)}
          </DialogTitle>
          <DialogDescription className="text-zinc-400 text-sm">
            {language === 'vi' 
              ? `Tùy chỉnh món ăn với ${schemas.length} loại cấu hình khác nhau` 
              : `Customize your order with ${schemas.length} different options`}
          </DialogDescription>
        </div>

        {/* Multiple Schema Sections */}
        <div className="space-y-6">
          {schemas.map((schema, index) => renderSchema(schema, index))}
        </div>

        {/* Total Price */}
        <div className="bg-zinc-800/80 rounded-lg p-4 border border-zinc-700 my-6">
          <div className="flex justify-between items-center">
            <span className="text-zinc-300 text-base">
              {language === 'vi' ? "Tổng Giá:" : "Total Price:"}
            </span>
            <span className="text-yellow-500 font-bold text-xl" data-testid="total-price">
              {formatPrice(totalPrice)}
            </span>
          </div>
        </div>

        {/* Action Button */}
        <Button
          onClick={handleAddToCart}
          className="w-full bg-yellow-600 hover:bg-yellow-500 text-black font-bold py-3 text-base rounded-lg"
          data-testid="button-add-to-cart"
        >
          {language === 'vi' ? "Thêm Vào Giỏ Hàng" : "Add To Cart"}
        </Button>
      </DialogContent>
    </Dialog>
  );
}