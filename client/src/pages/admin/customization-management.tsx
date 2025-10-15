import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Plus, Edit, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { insertCustomizationSchemaSchema, type CustomizationSchema, type InsertCustomizationSchema } from "@shared/schema";
import { useLanguage } from "@/contexts/LanguageContext";

interface SchemaFormData extends InsertCustomizationSchema {}

export default function CustomizationManagement() {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingSchema, setEditingSchema] = useState<CustomizationSchema | null>(null);
  const [deletingSchema, setDeletingSchema] = useState<CustomizationSchema | null>(null);

  const { data: schemas = [] } = useQuery<CustomizationSchema[]>({
    queryKey: ["/api/customization-schemas"],
  });

  const createMutation = useMutation({
    mutationFn: (data: InsertCustomizationSchema) =>
      apiRequest("POST", "/api/customization-schemas", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/customization-schemas"] });
      setIsCreateDialogOpen(false);
      toast({ title: t('customization.createSuccess') });
    },
    onError: (error) => {
      toast({ title: "Lỗi tạo schema", description: error.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<InsertCustomizationSchema> }) =>
      apiRequest("PATCH", `/api/customization-schemas/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/customization-schemas"] });
      setEditingSchema(null);
      toast({ title: t('customization.updateSuccess') });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      apiRequest("DELETE", `/api/customization-schemas/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/customization-schemas"] });
      toast({ title: t('customization.deleteSuccess') });
    },
    onError: (error) => {
      toast({ title: "Lỗi xóa schema", description: error.message, variant: "destructive" });
    },
  });

  const cloneMutation = useMutation({
    mutationFn: (id: string) =>
      apiRequest("POST", `/api/customization-schemas/${id}/clone`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/customization-schemas"] });
      toast({ title: t('customization.cloneSuccess') });
    },
    onError: (error) => {
      toast({ title: "Lỗi nhân bản schema", description: error.message, variant: "destructive" });
    },
  });

  const form = useForm<SchemaFormData>({
    resolver: zodResolver(insertCustomizationSchemaSchema),
    defaultValues: {
      name: "",
      nameVi: undefined,
      type: "half_and_half",
      description: undefined,
      descriptionVi: undefined,
      config: {},
      isActive: true,
    },
  });

  const onSubmit = (data: SchemaFormData) => {
    // Convert config to pricingConfig format for backend compatibility
    let pricingConfig: any = {};
    let config: any = data.config || {};
    
    if (data.config && typeof data.config === 'object') {
      if ('halfAndHalfFee' in data.config) {
        pricingConfig.half_and_half_service_fee = data.config.halfAndHalfFee;
      }
      if ('size_18cm_price' in data.config) {
        pricingConfig.size_18cm_price = data.config.size_18cm_price;
      }
    }
    
    // For additional_toppings, merge form config (constraints) with editingSchema config (toppings)
    if (editingSchema && editingSchema.type === "additional_toppings") {
      const formConfig = data.config || {};
      const editingConfig = (editingSchema as any).config || {};
      
      // CRITICAL FIX: For additional_toppings, ONLY use toppings from editingConfig (UI state)
      // and constraints from formConfig to prevent stale form data from overriding UI changes
      config = {
        toppings: editingConfig.toppings || [], // ALWAYS use UI state for toppings
        allowMultiple: formConfig.allowMultiple !== undefined ? formConfig.allowMultiple : editingConfig.allowMultiple,
        minSelections: formConfig.minSelections !== undefined ? formConfig.minSelections : editingConfig.minSelections,
        maxSelections: formConfig.maxSelections !== undefined ? formConfig.maxSelections : editingConfig.maxSelections
      };
      
      // CRITICAL FIX: Use the latest pricingConfig from editingSchema (contains latest prices)
      pricingConfig = {
        ...pricingConfig, // Keep any existing pricing config
        ...(editingSchema as any).pricingConfig || {} // Use latest pricing from UI changes
      };
    }
    // For size_selection and single_choice_options, use the updated config and pricing from editingSchema
    else if (editingSchema && (editingSchema.type === "size_selection" || editingSchema.type === "single_choice_options")) {
      config = (editingSchema as any).config || {};
      pricingConfig = {
        ...pricingConfig, // Keep any existing pricing config
        ...(editingSchema as any).pricingConfig || {}
      };
    }
    
    console.log("Submitting schema data:", { config, pricingConfig, editingSchemaConfig: editingSchema?.config });
    
    const finalData = {
      ...data,
      config: config, // Use updated config with toppings
      pricingConfig // Add pricing configuration
    };
    
    if (editingSchema) {
      updateMutation.mutate({ id: editingSchema.id, data: finalData });
    } else {
      createMutation.mutate(finalData);
    }
  };

  const handleEdit = (schema: CustomizationSchema) => {
    setEditingSchema(schema);
    
    // Convert pricingConfig back to config format for form
    const configForForm: any = { ...schema.config };
    const pricingConfig = (schema as any).pricingConfig;
    
    if (pricingConfig) {
      if (pricingConfig.half_and_half_service_fee !== undefined) {
        configForForm.halfAndHalfFee = pricingConfig.half_and_half_service_fee;
      }
      if (pricingConfig.size_18cm_price !== undefined) {
        configForForm.size_18cm_price = pricingConfig.size_18cm_price;
      }
    }
    
    form.reset({
      name: schema.name,
      nameVi: schema.nameVi || undefined,
      type: schema.type,
      description: schema.description || undefined,
      descriptionVi: schema.descriptionVi || undefined,
      config: configForForm,
      isActive: schema.isActive,
    });
  };

  const handleDelete = (id: string) => {
    if (confirm(t('customization.confirmDelete'))) {
      deleteMutation.mutate(id);
    }
  };

  const closeDialog = () => {
    setIsCreateDialogOpen(false);
    setEditingSchema(null);
    form.reset({
      name: "",
      nameVi: undefined,
      type: "half_and_half",
      description: undefined,
      descriptionVi: undefined,
      config: {},
      isActive: true,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-yellow-500">{t("customization.management")}</h2>
        <Dialog open={!!editingSchema} onOpenChange={(open) => !open && closeDialog()}>
          {/* Removed add button to prevent accidental creation */}
          <DialogContent className="max-w-2xl max-h-[80vh] bg-zinc-900 border-zinc-700 overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-yellow-500">
                {editingSchema ? t("customization.editSchema") : t("customization.createNew")}
              </DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                {/* Tên tiếng Anh */}
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-zinc-300">{t('customization.nameEn')}</FormLabel>
                      <FormControl>
                        <Input {...field} className="bg-zinc-800 border-zinc-600 text-white" data-testid="input-schema-name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Tên tiếng Việt */}
                <FormField
                  control={form.control}
                  name="nameVi"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-zinc-300">{t('customization.nameVi')}</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value || ""} className="bg-zinc-800 border-zinc-600 text-white" data-testid="input-schema-name-vi" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Loại Schema */}
                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-zinc-300">{t('customization.schemaType')}</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="bg-zinc-800 border-zinc-600 text-white" data-testid="select-schema-type">
                            <SelectValue placeholder={t('customization.selectSchemaType')} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="bg-zinc-800 border-zinc-600">
                          <SelectItem value="half_and_half" className="text-white">Half & Half Pizza</SelectItem>
                          <SelectItem value="size_selection" className="text-white">Size Selection</SelectItem>
                          <SelectItem value="additional_toppings" className="text-white">Additional Toppings</SelectItem>
                          <SelectItem value="single_choice_options" className="text-white">Single Choice Options</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Mô tả tiếng Anh */}
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-zinc-300">{t('customization.descriptionEn')}</FormLabel>
                      <FormControl>
                        <Textarea 
                          {...field} 
                          value={field.value || ""}
                          className="bg-zinc-800 border-zinc-600 text-white min-h-[80px]" 
                          data-testid="textarea-schema-description" 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Mô tả tiếng Việt */}
                <FormField
                  control={form.control}
                  name="descriptionVi"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-zinc-300">{t('customization.descriptionVi')}</FormLabel>
                      <FormControl>
                        <Textarea 
                          {...field} 
                          value={field.value || ""}
                          className="bg-zinc-800 border-zinc-600 text-white min-h-[80px]" 
                          data-testid="textarea-schema-description-vi" 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Pricing Configuration */}
                <div className="space-y-4 border border-zinc-600 rounded-lg p-4">
                  <h4 className="text-zinc-300 font-medium">{t('customization.priceConfig')}</h4>
                  
                  {form.watch("type") === "half_and_half" && (
                    <FormField
                      control={form.control}
                      name="config"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-zinc-300">{t('customization.halfAndHalfFee')}</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              placeholder="0"
                              className="bg-zinc-800 border-zinc-600 text-white"
                              value={((field.value as any)?.halfAndHalfFee || 0).toString()}
                              onChange={(e) => {
                                const currentConfig = field.value || {};
                                field.onChange({
                                  ...currentConfig,
                                  halfAndHalfFee: parseInt(e.target.value) || 0
                                });
                              }}
                              data-testid="input-half-and-half-fee"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  {form.watch("type") === "size_selection" && (
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <FormLabel className="text-zinc-300">Cấu hình kích cỡ pizza</FormLabel>
                        <Button
                          type="button"
                          size="sm"
                          onClick={() => {
                            if (!editingSchema) return;
                            
                            const newSize = {
                              id: `size_${Date.now()}`,
                              name: "New Size",
                              nameVi: "Kích cỡ mới"
                            };
                            
                            const currentSizes = (editingSchema as any).config?.sizes || [];
                            const updatedConfig = {
                              ...(editingSchema as any).config,
                              sizes: [...currentSizes, newSize]
                            };
                            
                            const updatedPricingConfig = {
                              ...(editingSchema as any).pricingConfig,
                              [newSize.id]: { price: 0 }
                            };
                            
                            setEditingSchema({
                              ...editingSchema,
                              config: updatedConfig,
                              pricingConfig: updatedPricingConfig
                            } as any);
                          }}
                          className="bg-green-600 text-white hover:bg-green-500 text-xs"
                          data-testid="button-add-size"
                        >
                          + Thêm Kích Cỡ
                        </Button>
                      </div>
                      
                      <div className="space-y-3">
                        {editingSchema && (editingSchema as any).config?.sizes && 
                          (editingSchema as any).config.sizes.map((size: any, index: number) => {
                            const pricingConfig = (editingSchema as any).pricingConfig || {};
                            const currentPrice = pricingConfig[size.id]?.price || 0;
                            
                            return (
                              <div key={size.id} className="grid grid-cols-5 gap-2 items-center p-3 border border-zinc-600 rounded-lg bg-zinc-800">
                                <div className="space-y-1">
                                  <Input
                                    value={size.name}
                                    onChange={(e) => {
                                      const currentSizes = [...(editingSchema as any).config.sizes];
                                      currentSizes[index] = { ...size, name: e.target.value };
                                      
                                      setEditingSchema({
                                        ...editingSchema,
                                        config: {
                                          ...(editingSchema as any).config,
                                          sizes: currentSizes
                                        }
                                      } as any);
                                    }}
                                    className="bg-zinc-700 border-zinc-600 text-white text-sm"
                                    placeholder="Tên tiếng Anh"
                                    data-testid={`input-size-name-${index}`}
                                  />
                                </div>
                                
                                <div className="space-y-1">
                                  <Input
                                    value={size.nameVi || ""}
                                    onChange={(e) => {
                                      const currentSizes = [...(editingSchema as any).config.sizes];
                                      currentSizes[index] = { ...size, nameVi: e.target.value };
                                      
                                      setEditingSchema({
                                        ...editingSchema,
                                        config: {
                                          ...(editingSchema as any).config,
                                          sizes: currentSizes
                                        }
                                      } as any);
                                    }}
                                    className="bg-zinc-700 border-zinc-600 text-white text-sm"
                                    placeholder="Tên tiếng Việt"
                                    data-testid={`input-size-name-vi-${index}`}
                                  />
                                </div>
                                
                                <div className="flex items-center gap-2">
                                  <Input
                                    type="number"
                                    placeholder="Phụ phí (VND)"
                                    value={currentPrice}
                                    onChange={(e) => {
                                      const newPrice = parseInt(e.target.value) || 0;
                                      const updatedPricingConfig = {
                                        ...(editingSchema as any).pricingConfig,
                                        [size.id]: { price: newPrice }
                                      };
                                      setEditingSchema({
                                        ...editingSchema,
                                        pricingConfig: updatedPricingConfig
                                      } as any);
                                    }}
                                    className="bg-zinc-700 border-zinc-600 text-white text-sm"
                                    data-testid={`input-size-price-${index}`}
                                  />
                                  <span className="text-zinc-400 text-xs">VND</span>
                                </div>
                                
                                <div className="text-zinc-500 text-xs">
                                  ID: {size.id}
                                </div>
                                
                                <div className="flex justify-end">
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => {
                                      const currentSizes = [...(editingSchema as any).config.sizes];
                                      currentSizes.splice(index, 1);
                                      
                                      const updatedPricingConfig = { ...(editingSchema as any).pricingConfig };
                                      delete updatedPricingConfig[size.id];
                                      
                                      setEditingSchema({
                                        ...editingSchema,
                                        config: {
                                          ...(editingSchema as any).config,
                                          sizes: currentSizes
                                        },
                                        pricingConfig: updatedPricingConfig
                                      } as any);
                                    }}
                                    className="text-red-400 hover:text-red-300 hover:bg-red-900/20 p-1 h-8 w-8"
                                    data-testid={`button-delete-size-${index}`}
                                  >
                                    ×
                                  </Button>
                                </div>
                              </div>
                            );
                          })
                        }
                        {(!editingSchema || !(editingSchema as any).config?.sizes || (editingSchema as any).config.sizes.length === 0) && (
                          <div className="text-zinc-500 text-sm italic p-4 border border-zinc-600 rounded-lg">
                            Nhấn "Thêm Kích Cỡ" để bắt đầu thêm các kích cỡ cho schema này
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {form.watch("type") === "additional_toppings" && (
                    <div className="space-y-4">
                      {/* Selection Constraints */}
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="config"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-zinc-300">Minimum Selections</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  min="0"
                                  placeholder="0"
                                  className="bg-zinc-800 border-zinc-600 text-white"
                                  value={((field.value as any)?.minSelections || 0).toString()}
                                  onChange={(e) => {
                                    const currentConfig = field.value || {};
                                    field.onChange({
                                      ...currentConfig,
                                      minSelections: parseInt(e.target.value) || 0
                                    });
                                  }}
                                  data-testid="input-min-selections"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="config"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-zinc-300">Maximum Selections</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  min="1"
                                  placeholder="Unlimited"
                                  className="bg-zinc-800 border-zinc-600 text-white"
                                  value={((field.value as any)?.maxSelections || '').toString()}
                                  onChange={(e) => {
                                    const currentConfig = field.value || {};
                                    const value = parseInt(e.target.value);
                                    const updatedConfig = {
                                      ...currentConfig,
                                      maxSelections: isNaN(value) ? undefined : value
                                    };
                                    
                                    // Auto-correct: If maxSelections = 1, set allowMultiple to false
                                    if (value === 1) {
                                      (updatedConfig as any).allowMultiple = false;
                                    }
                                    
                                    field.onChange(updatedConfig);
                                  }}
                                  data-testid="input-max-selections"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <FormField
                        control={form.control}
                        name="config"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border border-zinc-600 p-4">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base text-zinc-300">Allow Multiple Selection</FormLabel>
                              <div className="text-sm text-zinc-500">
                                Bật để cho phép người dùng chọn nhiều topping cùng lúc
                              </div>
                            </div>
                            <FormControl>
                              <Switch
                                checked={((field.value as any)?.allowMultiple !== false)} // Default true
                                onCheckedChange={(checked) => {
                                  const currentConfig = field.value || {};
                                  const updatedConfig = {
                                    ...currentConfig,
                                    allowMultiple: checked
                                  };
                                  
                                  // Auto-correct: If allowMultiple = true and maxSelections = 1, set maxSelections to 2
                                  if (checked && (currentConfig as any).maxSelections === 1) {
                                    (updatedConfig as any).maxSelections = 2;
                                  }
                                  // Auto-correct: If allowMultiple = false, set maxSelections to 1 if not set
                                  else if (!checked && !(currentConfig as any).maxSelections) {
                                    (updatedConfig as any).maxSelections = 1;
                                  }
                                  
                                  field.onChange(updatedConfig);
                                }}
                                data-testid="switch-allow-multiple"
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      <div className="flex justify-between items-center">
                        <FormLabel className="text-zinc-300">Cấu hình toppings & món ăn kèm</FormLabel>
                        <Button
                          type="button"
                          size="sm"
                          onClick={() => {
                            if (!editingSchema) return;
                            
                            const newTopping = {
                              id: `topping_${Date.now()}`,
                              name: "New Topping",
                              nameVi: "Topping Mới"
                            };
                            
                            const currentToppings = (editingSchema as any).config?.toppings || [];
                            const updatedConfig = {
                              ...(editingSchema as any).config,
                              toppings: [...currentToppings, newTopping]
                            };
                            
                            const updatedPricingConfig = {
                              ...(editingSchema as any).pricingConfig,
                              [newTopping.id]: { price: 0 }
                            };
                            
                            setEditingSchema({
                              ...editingSchema,
                              config: updatedConfig,
                              pricingConfig: updatedPricingConfig
                            } as any);
                          }}
                          className="bg-green-600 text-white hover:bg-green-500 text-xs"
                          data-testid="button-add-topping"
                        >
                          + Thêm Topping
                        </Button>
                      </div>
                      
                      <div className="space-y-3">
                        {editingSchema && (editingSchema as any).config?.toppings && 
                          (editingSchema as any).config.toppings.map((topping: any, index: number) => {
                            const pricingConfig = (editingSchema as any).pricingConfig || {};
                            const currentPrice = pricingConfig[topping.id]?.price || 0;
                            
                            return (
                              <div key={topping.id} className="grid grid-cols-5 gap-2 items-center p-3 border border-zinc-600 rounded-lg bg-zinc-800">
                                <div className="space-y-1">
                                  <Input
                                    value={topping.name}
                                    onChange={(e) => {
                                      const currentToppings = [...(editingSchema as any).config.toppings];
                                      currentToppings[index] = { ...topping, name: e.target.value };
                                      
                                      setEditingSchema({
                                        ...editingSchema,
                                        config: {
                                          ...(editingSchema as any).config,
                                          toppings: currentToppings
                                        }
                                      } as any);
                                    }}
                                    className="bg-zinc-700 border-zinc-600 text-white text-sm"
                                    placeholder="Tên tiếng Anh"
                                    data-testid={`input-topping-name-${index}`}
                                  />
                                </div>
                                
                                <div className="space-y-1">
                                  <Input
                                    value={topping.nameVi || ""}
                                    onChange={(e) => {
                                      const currentToppings = [...(editingSchema as any).config.toppings];
                                      currentToppings[index] = { ...topping, nameVi: e.target.value };
                                      
                                      setEditingSchema({
                                        ...editingSchema,
                                        config: {
                                          ...(editingSchema as any).config,
                                          toppings: currentToppings
                                        }
                                      } as any);
                                    }}
                                    className="bg-zinc-700 border-zinc-600 text-white text-sm"
                                    placeholder="Tên tiếng Việt"
                                    data-testid={`input-topping-name-vi-${index}`}
                                  />
                                </div>
                                
                                <div className="flex items-center gap-2">
                                  <Input
                                    type="number"
                                    placeholder="Giá (VND)"
                                    value={currentPrice}
                                    onChange={(e) => {
                                      const newPrice = parseInt(e.target.value) || 0;
                                      const updatedPricingConfig = {
                                        ...(editingSchema as any).pricingConfig,
                                        [topping.id]: { price: newPrice }
                                      };
                                      setEditingSchema({
                                        ...editingSchema,
                                        pricingConfig: updatedPricingConfig
                                      } as any);
                                    }}
                                    className="bg-zinc-700 border-zinc-600 text-white text-sm"
                                    data-testid={`input-topping-price-${index}`}
                                  />
                                  <span className="text-zinc-400 text-xs">VND</span>
                                </div>
                                
                                <div className="text-zinc-500 text-xs">
                                  ID: {topping.id}
                                </div>
                                
                                <div className="flex justify-end">
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => {
                                      const currentToppings = [...(editingSchema as any).config.toppings];
                                      currentToppings.splice(index, 1);
                                      
                                      const updatedPricingConfig = { ...(editingSchema as any).pricingConfig };
                                      delete updatedPricingConfig[topping.id];
                                      
                                      setEditingSchema({
                                        ...editingSchema,
                                        config: {
                                          ...(editingSchema as any).config,
                                          toppings: currentToppings
                                        },
                                        pricingConfig: updatedPricingConfig
                                      } as any);
                                    }}
                                    className="text-red-400 hover:text-red-300 hover:bg-red-900/20 p-1 h-8 w-8"
                                    data-testid={`button-delete-topping-${index}`}
                                  >
                                    ×
                                  </Button>
                                </div>
                              </div>
                            );
                          })
                        }
                        {(!editingSchema || !(editingSchema as any).config?.toppings || (editingSchema as any).config.toppings.length === 0) && (
                          <div className="text-zinc-500 text-sm italic p-4 border border-zinc-600 rounded-lg">
                            Nhấn "Thêm Topping" để bắt đầu thêm toppings cho schema này
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {form.watch("type") === "single_choice_options" && (
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <FormLabel className="text-zinc-300">Cấu hình các lựa chọn đơn</FormLabel>
                        <Button
                          type="button"
                          size="sm"
                          onClick={() => {
                            if (!editingSchema) return;
                            
                            const newOption = {
                              id: `option_${Date.now()}`,
                              name: "New Option",
                              nameVi: "Lựa chọn mới"
                            };
                            
                            const currentOptions = (editingSchema as any).config?.options || [];
                            const updatedConfig = {
                              ...(editingSchema as any).config,
                              options: [...currentOptions, newOption]
                            };
                            
                            const updatedPricingConfig = {
                              ...(editingSchema as any).pricingConfig,
                              [newOption.id]: { price: 0 }
                            };
                            
                            setEditingSchema({
                              ...editingSchema,
                              config: updatedConfig,
                              pricingConfig: updatedPricingConfig
                            } as any);
                          }}
                          className="bg-green-600 text-white hover:bg-green-500 text-xs"
                          data-testid="button-add-option"
                        >
                          + Thêm Lựa Chọn
                        </Button>
                      </div>
                      
                      <div className="space-y-3">
                        {editingSchema && (editingSchema as any).config?.options && 
                          (editingSchema as any).config.options.map((option: any, index: number) => {
                            const pricingConfig = (editingSchema as any).pricingConfig || {};
                            const currentPrice = pricingConfig[option.id]?.price || 0;
                            
                            return (
                              <div key={option.id} className="grid grid-cols-5 gap-2 items-center p-3 border border-zinc-600 rounded-lg bg-zinc-800">
                                <div className="space-y-1">
                                  <Input
                                    value={option.name}
                                    onChange={(e) => {
                                      const currentOptions = [...(editingSchema as any).config.options];
                                      currentOptions[index] = { ...option, name: e.target.value };
                                      
                                      setEditingSchema({
                                        ...editingSchema,
                                        config: {
                                          ...(editingSchema as any).config,
                                          options: currentOptions
                                        }
                                      } as any);
                                    }}
                                    className="bg-zinc-700 border-zinc-600 text-white text-sm"
                                    placeholder="Tên tiếng Anh"
                                    data-testid={`input-option-name-${index}`}
                                  />
                                </div>
                                
                                <div className="space-y-1">
                                  <Input
                                    value={option.nameVi || ""}
                                    onChange={(e) => {
                                      const currentOptions = [...(editingSchema as any).config.options];
                                      currentOptions[index] = { ...option, nameVi: e.target.value };
                                      
                                      setEditingSchema({
                                        ...editingSchema,
                                        config: {
                                          ...(editingSchema as any).config,
                                          options: currentOptions
                                        }
                                      } as any);
                                    }}
                                    className="bg-zinc-700 border-zinc-600 text-white text-sm"
                                    placeholder="Tên tiếng Việt"
                                    data-testid={`input-option-name-vi-${index}`}
                                  />
                                </div>
                                
                                <div className="flex items-center gap-2">
                                  <Input
                                    type="number"
                                    placeholder="Giá (VND)"
                                    value={currentPrice}
                                    onChange={(e) => {
                                      const newPrice = parseInt(e.target.value) || 0;
                                      const updatedPricingConfig = {
                                        ...(editingSchema as any).pricingConfig,
                                        [option.id]: { price: newPrice }
                                      };
                                      setEditingSchema({
                                        ...editingSchema,
                                        pricingConfig: updatedPricingConfig
                                      } as any);
                                    }}
                                    className="bg-zinc-700 border-zinc-600 text-white text-sm"
                                    data-testid={`input-option-price-${index}`}
                                  />
                                  <span className="text-zinc-400 text-xs">VND</span>
                                </div>
                                
                                <div className="text-zinc-500 text-xs">
                                  ID: {option.id}
                                </div>
                                
                                <div className="flex justify-end">
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => {
                                      const currentOptions = [...(editingSchema as any).config.options];
                                      currentOptions.splice(index, 1);
                                      
                                      const updatedPricingConfig = { ...(editingSchema as any).pricingConfig };
                                      delete updatedPricingConfig[option.id];
                                      
                                      setEditingSchema({
                                        ...editingSchema,
                                        config: {
                                          ...(editingSchema as any).config,
                                          options: currentOptions
                                        },
                                        pricingConfig: updatedPricingConfig
                                      } as any);
                                    }}
                                    className="text-red-400 hover:text-red-300 hover:bg-red-900/20 p-1 h-8 w-8"
                                    data-testid={`button-delete-option-${index}`}
                                  >
                                    ×
                                  </Button>
                                </div>
                              </div>
                            );
                          })
                        }
                        {(!editingSchema || !(editingSchema as any).config?.options || (editingSchema as any).config.options.length === 0) && (
                          <div className="text-zinc-500 text-sm italic p-4 border border-zinc-600 rounded-lg">
                            Nhấn "Thêm Lựa Chọn" để bắt đầu thêm các lựa chọn cho schema này
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Trạng thái kích hoạt */}
                <FormField
                  control={form.control}
                  name="isActive"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border border-zinc-600 p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base text-zinc-300">Kích hoạt Schema</FormLabel>
                        <div className="text-sm text-zinc-500">
                          Bật để sử dụng schema này trong hệ thống
                        </div>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value || false}
                          onCheckedChange={field.onChange}
                          data-testid="switch-schema-active"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <div className="flex justify-end space-x-3 pt-4">
                  <Button 
                    type="button" 
                    variant="ghost" 
                    onClick={closeDialog}
                    className="text-zinc-400 hover:text-white"
                  >
                    Hủy
                  </Button>
                  <Button 
                    type="submit" 
                    className="bg-yellow-500 text-black hover:bg-yellow-400"
                    disabled={createMutation.isPending || updateMutation.isPending}
                    data-testid="button-save-schema"
                  >
                    {editingSchema ? "Cập nhật" : "Tạo mới"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Hiển thị danh sách schemas */}
      <div className="grid gap-4">
        {schemas.map((schema) => (
          <Card key={schema.id} className="bg-zinc-900 border-zinc-700">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-white text-lg">
                    {schema.name}
                    {schema.nameVi && (
                      <span className="text-zinc-400 text-base ml-2">({schema.nameVi})</span>
                    )}
                  </CardTitle>
                  <div className="flex gap-2 mt-2">
                    <Badge variant={schema.isActive ? "default" : "secondary"} className="text-xs">
                      {schema.isActive ? "Đang hoạt động" : "Tạm dừng"}
                    </Badge>
                    <Badge variant="outline" className="text-xs text-zinc-400 border-zinc-600">
                      {schema.type}
                    </Badge>
                    {(schema as any).isBaseSchema && (
                      <Badge variant="outline" className="text-xs text-yellow-500 border-yellow-500">
                        Bản gốc
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => cloneMutation.mutate(schema.id)}
                    className="text-blue-400 hover:text-blue-300"
                    disabled={cloneMutation.isPending}
                    data-testid={`button-clone-schema-${schema.id}`}
                    title="Nhân bản schema"
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleEdit(schema)}
                    className="text-zinc-400 hover:text-white"
                    data-testid={`button-edit-schema-${schema.id}`}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  {!(schema as any).isBaseSchema && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setDeletingSchema(schema)}
                      className="text-red-400 hover:text-red-300"
                      disabled={deleteMutation.isPending}
                      data-testid={`button-delete-schema-${schema.id}`}
                      title="Xóa schema"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            {(schema.description || schema.descriptionVi) && (
              <CardContent className="pt-0">
                <div className="text-zinc-400 text-sm">
                  {schema.description && <p>{schema.description}</p>}
                  {schema.descriptionVi && schema.description && <p className="mt-1">{schema.descriptionVi}</p>}
                  {schema.descriptionVi && !schema.description && <p>{schema.descriptionVi}</p>}
                </div>
              </CardContent>
            )}
          </Card>
        ))}
      </div>

      {schemas.length === 0 && (
        <Card className="bg-zinc-900 border-zinc-700">
          <CardContent className="text-center py-8">
            <p className="text-zinc-400">Chưa có schema tùy biến nào.</p>
            <p className="text-zinc-500 text-sm mt-2">Tạo schema đầu tiên để bắt đầu cấu hình tùy biến menu.</p>
          </CardContent>
        </Card>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deletingSchema} onOpenChange={() => setDeletingSchema(null)}>
        <AlertDialogContent className="bg-zinc-900 border-zinc-700">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Xác nhận xóa</AlertDialogTitle>
            <AlertDialogDescription className="text-zinc-400">
              Bạn có chắc chắn muốn xóa schema "{deletingSchema?.name || deletingSchema?.nameVi}" không? 
              Hành động này không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel 
              onClick={() => setDeletingSchema(null)}
              className="bg-zinc-800 border-zinc-600 text-white hover:bg-zinc-700"
            >
              Hủy
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deletingSchema) {
                  deleteMutation.mutate(deletingSchema.id);
                  setDeletingSchema(null);
                }
              }}
              className="bg-red-600 hover:bg-red-700 text-white"
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? "Đang xóa..." : "Xóa"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}