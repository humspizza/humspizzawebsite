import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Plus, Edit, Trash2, DollarSign, Upload, FolderPlus, Search, Filter, GripVertical, X } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { ObjectUploader } from "@/components/ObjectUploader";
// Remove unused import
import { useLanguage } from "@/contexts/LanguageContext";
import CustomizationManagement from "./customization-management";

interface Category {
  id: string;
  name: string;
  nameVi?: string;
  description?: string;
  sortOrder: number;
}

interface MenuItem {
  id: string;
  name: string;
  nameVi?: string;
  description: string;
  descriptionVi?: string;
  price: string;
  vatRate?: string;
  imageUrl?: string;
  categoryId?: string;
  customizationSchemaId?: string;
  isAvailable: boolean;
  isPinned?: boolean;
  pinnedAt?: string;
  tags: string[];
}

const menuItemSchema = z.object({
  name: z.string().min(1, "Tên món ăn là bắt buộc"),
  nameVi: z.string().optional(),
  description: z.string().min(1, "Mô tả là bắt buộc"),
  descriptionVi: z.string().optional(),
  price: z.string().min(1, "Giá là bắt buộc"),
  vatRate: z.string().default("8"),
  imageUrl: z.string().optional(),
  categoryId: z.string().min(1, "Danh mục là bắt buộc"),
  customizationSchemaId: z.string().optional(),
  multipleSchemas: z.array(z.string()).default([]),
  isAvailable: z.boolean().default(true),
  tags: z.string().optional(),
});

const categorySchema = z.object({
  name: z.string().min(1, "Tên danh mục là bắt buộc"),
  nameVi: z.string().optional(),
  description: z.string().optional(),
  sortOrder: z.number().default(0),
});

type MenuItemFormData = z.infer<typeof menuItemSchema>;
type CategoryFormData = z.infer<typeof categorySchema>;

export default function MenuManagement() {
  const { toast } = useToast();
  const { t } = useLanguage();
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [deleteConfirmItem, setDeleteConfirmItem] = useState<MenuItem | null>(null);
  const [deletingCategory, setDeletingCategory] = useState<Category | null>(null);
  
  // Multiple schemas management
  const [multiSchemasDialogOpen, setMultiSchemasDialogOpen] = useState(false);
  const [managingSchemasItem, setManagingSchemasItem] = useState<MenuItem | null>(null);
  
  // Search and filter states
  const [menuSearch, setMenuSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  const { data: customizationSchemas = [] } = useQuery({
    queryKey: ["/api/customization-schemas"],
  });

  // Query for current schemas of managing item
  const { data: currentSchemas = [] } = useQuery({
    queryKey: ["/api/menu-items", managingSchemasItem?.id, "customization-schemas"],
    enabled: !!managingSchemasItem?.id,
  });

  const { data: menuItemsResponse = [] } = useQuery({
    queryKey: ["/api/menu-items/"],
    queryFn: async () => {
      const response = await fetch("/api/menu-items/?includeUnavailable=true");
      if (!response.ok) throw new Error('Failed to fetch menu items');
      return response.json();
    },
  });
  
  // Extract menu items from API response
  const menuItems: MenuItem[] = menuItemsResponse.map ? menuItemsResponse.map((item: any) => ({
    id: item.menu_items?.id || item.id,
    name: item.menu_items?.name || item.name,
    nameVi: item.menu_items?.nameVi || item.nameVi,
    description: item.menu_items?.description || item.description,
    descriptionVi: item.menu_items?.descriptionVi || item.descriptionVi,
    price: item.menu_items?.price || item.price,
    vatRate: item.menu_items?.vatRate || item.vatRate || "8",
    imageUrl: item.menu_items?.imageUrl || item.imageUrl,
    categoryId: item.menu_items?.categoryId || item.categoryId,
    customizationSchemaId: item.menu_items?.customizationSchemaId || item.customizationSchemaId,
    isAvailable: item.menu_items?.isAvailable !== undefined ? item.menu_items?.isAvailable : item.isAvailable,
    isPinned: item.menu_items?.isPinned !== undefined ? item.menu_items?.isPinned : item.isPinned,
    pinnedAt: item.menu_items?.pinnedAt || item.pinnedAt,
    tags: item.menu_items?.tags || item.tags || []
  })) : [];

  // Filtered and sorted menu items (pinned items first)
  const filteredMenuItems = menuItems
    .filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(menuSearch.toLowerCase()) ||
                           (item.nameVi && item.nameVi.toLowerCase().includes(menuSearch.toLowerCase())) ||
                           item.description.toLowerCase().includes(menuSearch.toLowerCase());
      const matchesCategory = categoryFilter === "all" || item.categoryId === categoryFilter;
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      // Sort pinned items first
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      // Then sort by name
      return a.name.localeCompare(b.name);
    });

  const form = useForm<MenuItemFormData>({
    resolver: zodResolver(menuItemSchema),
    defaultValues: {
      name: "",
      nameVi: "",
      description: "",
      descriptionVi: "",
      price: "",
      vatRate: "8",
      imageUrl: "",
      categoryId: "",
      customizationSchemaId: "none",
      multipleSchemas: [],
      isAvailable: true,
      tags: "",
    },
  });

  const categoryForm = useForm<CategoryFormData>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: "",
      nameVi: "",
      description: "",
      sortOrder: 0,
    },
  });

  const handleUploadComplete = async (result: {
    successful: Array<{ uploadURL: string }>;
    failed?: Array<{ error: any }>;
  }) => {
    if (result.successful && result.successful.length > 0) {
      const uploadURL = result.successful[0].uploadURL;
      
      // Set the uploaded URL to the form
      form.setValue("imageUrl", uploadURL);
      
      toast({
        title: "Thành công",
        description: "Hình ảnh đã được tải lên thành công",
      });
    }
  };

  const createMenuItemMutation = useMutation({
    mutationFn: async (data: MenuItemFormData) => {
      const payload = {
        ...data,
        tags: data.tags ? data.tags.split(",").map(tag => tag.trim()) : [],
        imageUrl: data.imageUrl || undefined,
        customizationSchemaId: data.customizationSchemaId === "none" ? undefined : data.customizationSchemaId,
      };
      const response = await apiRequest("POST", "/api/menu-items", payload);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/menu-items/"] });
      queryClient.invalidateQueries({ queryKey: ["/api/menu-items/pinned"] }); // Update homepage cache
      queryClient.invalidateQueries({ queryKey: ["/api/menu-items"] }); // Update public menu
      toast({
        title: "Thành công",
        description: "Món ăn đã được tạo",
      });
      setIsDialogOpen(false);
      setEditingItem(null);
      form.reset();
    },
    onError: () => {
      toast({
        title: "Lỗi",
        description: "Không thể tạo món ăn",
        variant: "destructive",
      });
    },
  });

  const updateMenuItemMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: MenuItemFormData }) => {
      const payload = {
        ...data,
        tags: data.tags ? data.tags.split(",").map(tag => tag.trim()) : [],
        imageUrl: data.imageUrl || undefined,
        customizationSchemaId: data.customizationSchemaId === "none" ? undefined : data.customizationSchemaId,
      };
      const response = await apiRequest("PATCH", `/api/menu-items/${id}`, payload);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/menu-items/"] });
      queryClient.invalidateQueries({ queryKey: ["/api/menu-items/pinned"] }); // Update homepage cache
      queryClient.invalidateQueries({ queryKey: ["/api/menu-items"] }); // Update public menu
      toast({
        title: "Thành công",
        description: "Món ăn đã được cập nhật",
      });
      setIsDialogOpen(false);
      setEditingItem(null);
      form.reset();
    },
    onError: () => {
      toast({
        title: "Lỗi",
        description: "Không thể cập nhật món ăn",
        variant: "destructive",
      });
    },
  });

  const deleteMenuItemMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest("DELETE", `/api/menu-items/${id}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/menu-items/"] });
      queryClient.invalidateQueries({ queryKey: ["/api/menu-items/pinned"] }); // Update homepage cache
      queryClient.invalidateQueries({ queryKey: ["/api/menu-items"] }); // Update public menu
      toast({
        title: "Thành công",
        description: "Món ăn đã được xóa",
      });
    },
    onError: () => {
      toast({
        title: "Lỗi",
        description: "Không thể xóa món ăn",
        variant: "destructive",
      });
    },
  });

  const togglePinMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest("PATCH", `/api/menu-items/${id}/pin`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/menu-items/"] });
      queryClient.invalidateQueries({ queryKey: ["/api/menu-items/pinned"] });
      toast({
        title: "Thành công",
        description: "Trạng thái ghim đã được cập nhật",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Lỗi",
        description: error.message || "Không thể cập nhật trạng thái ghim",
        variant: "destructive",
      });
    },
  });

  const toggleAvailabilityMutation = useMutation({
    mutationFn: async ({ id, isAvailable }: { id: string; isAvailable: boolean }) => {
      const response = await apiRequest("PATCH", `/api/menu-items/${id}`, { isAvailable });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/menu-items/"] });
      queryClient.invalidateQueries({ queryKey: ["/api/menu-items"] }); // Public menu
      queryClient.invalidateQueries({ queryKey: ["/api/menu-items/pinned"] }); // Homepage
      toast({
        title: "Thành công", 
        description: "Trạng thái món ăn đã được cập nhật",
      });
    },
    onError: () => {
      toast({
        title: "Lỗi",
        description: "Không thể cập nhật trạng thái món ăn",
        variant: "destructive",
      });
    },
  });

  const createCategoryMutation = useMutation({
    mutationFn: async (data: CategoryFormData) => {
      const response = await apiRequest("POST", "/api/categories", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      setIsCategoryDialogOpen(false);
      categoryForm.reset();
      toast({
        title: "Tạo thành công",
        description: "Danh mục mới đã được thêm vào menu",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Lỗi",
        description: error.message || "Không thể tạo danh mục",
        variant: "destructive",
      });
    },
  });

  const updateCategoryMutation = useMutation({
    mutationFn: async (data: CategoryFormData & { id: string }) => {
      const { id, ...updateData } = data;
      const response = await apiRequest("PATCH", `/api/categories/${id}`, updateData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      setIsCategoryDialogOpen(false);
      setEditingCategory(null);
      categoryForm.reset();
      toast({
        title: "Cập nhật thành công",
        description: "Thông tin danh mục đã được cập nhật",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Lỗi",
        description: error.message || "Không thể cập nhật danh mục",
        variant: "destructive",
      });
    },
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/categories/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      queryClient.invalidateQueries({ queryKey: ["/api/menu-items/"] });
      toast({
        title: "Xóa thành công",
        description: "Danh mục đã được xóa",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Lỗi",
        description: error.message || "Không thể xóa danh mục",
        variant: "destructive",
      });
    },
  });

  // Multiple schemas management mutation
  const updateMultipleSchemasMutation = useMutation({
    mutationFn: async ({ menuItemId, schemaIds }: { menuItemId: string; schemaIds: string[] }) => {
      const response = await apiRequest("PATCH", `/api/menu-items/${menuItemId}/customization-schemas`, { schemaIds });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/menu-items"] });
      queryClient.invalidateQueries({ queryKey: ["/api/menu-items/"] });
      setMultiSchemasDialogOpen(false);
      toast({
        title: "Thành công",
        description: "Cấu hình tùy biến đã được cập nhật",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Lỗi",
        description: error.message || "Không thể cập nhật cấu hình tùy biến",
        variant: "destructive",
      });
    },
  });

  const onSubmit = async (data: MenuItemFormData) => {
    const { multipleSchemas } = data;
    
    if (editingItem) {
      // Update menu item first
      updateMenuItemMutation.mutate({ id: editingItem.id, data });
      
      // Update multiple schemas if any were selected
      if (multipleSchemas && multipleSchemas.length > 0) {
        try {
          await updateMultipleSchemasMutation.mutateAsync({
            menuItemId: editingItem.id,
            schemaIds: multipleSchemas
          });
        } catch (error) {
          console.error('Failed to update multiple schemas:', error);
        }
      }
    } else {
      // Create menu item first, then add schemas
      try {
        const newItem = await createMenuItemMutation.mutateAsync(data);
        
        // Add multiple schemas if any were selected
        if (multipleSchemas && multipleSchemas.length > 0 && newItem?.id) {
          await updateMultipleSchemasMutation.mutateAsync({
            menuItemId: newItem.id,
            schemaIds: multipleSchemas
          });
        }
      } catch (error) {
        console.error('Failed to create menu item with multiple schemas:', error);
      }
    }
  };

  const handleEdit = async (item: MenuItem) => {
    setEditingItem(item);
    
    // Load multiple schemas for this menu item
    let multipleSchemas: string[] = [];
    try {
      const response = await fetch(`/api/menu-items/${item.id}/customization-schemas`);
      if (response.ok) {
        const schemas = await response.json();
        multipleSchemas = schemas.map((schema: any) => schema.id);
      }
    } catch (error) {
      console.warn('Failed to load multiple schemas for editing:', error);
    }
    
    form.reset({
      name: item.name,
      nameVi: item.nameVi || "",
      description: item.description,
      descriptionVi: item.descriptionVi || "",
      price: item.price,
      vatRate: item.vatRate || "8",
      imageUrl: item.imageUrl || "",
      categoryId: item.categoryId || "",
      customizationSchemaId: item.customizationSchemaId || "none",
      multipleSchemas: multipleSchemas,
      isAvailable: item.isAvailable,
      tags: item.tags ? item.tags.join(", ") : "",
    });
    setIsDialogOpen(true);
  };

  const handleAdd = () => {
    setEditingItem(null);
    form.reset({
      name: "",
      nameVi: "",
      description: "",
      descriptionVi: "",
      price: "",
      vatRate: "8",
      imageUrl: "",
      categoryId: "",
      customizationSchemaId: "none",
      multipleSchemas: [],
      isAvailable: true,
      tags: "",
    });
    setIsDialogOpen(true);
  };

  const onCategorySubmit = (data: CategoryFormData) => {
    if (editingCategory) {
      updateCategoryMutation.mutate({ id: editingCategory.id, ...data });
    } else {
      createCategoryMutation.mutate(data);
    }
  };

  const handleEditCategory = (category: Category) => {
    setEditingCategory(category);
    categoryForm.reset({
      name: category.name,
      nameVi: category.nameVi || "",
      description: category.description || "",
      sortOrder: category.sortOrder,
    });
    setIsCategoryDialogOpen(true);
  };

  const handleAddCategory = () => {
    setEditingCategory(null);
    categoryForm.reset();
    setIsCategoryDialogOpen(true);
  };

  const getCategoryName = (categoryId: string) => {
    const category = categories.find(c => c.id === categoryId);
    return category ? category.name : "Không có danh mục";
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-white">{t('admin.menuTitle')}</h2>
        <p className="text-zinc-400">{t('admin.menuSubtitle')}</p>
      </div>

      <Tabs defaultValue="menu-items" className="w-full">
        <TabsList className="grid w-full grid-cols-3 bg-zinc-900 border-zinc-800">
          <TabsTrigger value="menu-items" className="data-[state=active]:bg-yellow-500 data-[state=active]:text-black">
            {t('admin.menuManagement')}
          </TabsTrigger>
          <TabsTrigger value="categories" className="data-[state=active]:bg-yellow-500 data-[state=active]:text-black">
            {t('admin.manageCategories')}
          </TabsTrigger>
          <TabsTrigger value="customizations" className="data-[state=active]:bg-yellow-500 data-[state=active]:text-black">
            {t('admin.customizationManagement')}
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="menu-items" className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-xl font-bold text-white">{t('admin.menuItems')}</h3>
              <p className="text-zinc-400">{t('admin.manageCategoryItems')}</p>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={handleAdd} className="bg-white text-black hover:bg-zinc-200" data-testid="button-add-menu-item">
                  <Plus className="w-4 h-4 mr-2" />
                  {t('admin.addItem')}
                </Button>
              </DialogTrigger>
            </Dialog>
            
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogContent className="bg-zinc-900 border-zinc-800 max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-white">
                {editingItem ? t('admin.edit') + " Món Ăn" : "Thêm Món Ăn Mới"}
              </DialogTitle>
              <DialogDescription className="text-zinc-400">
                {editingItem ? "Cập nhật thông tin món ăn" : "Tạo món ăn mới cho menu"}
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-white">Tên món ăn (Tiếng Anh)</FormLabel>
                        <FormControl>
                          <Input {...field} className="bg-zinc-800 border-zinc-700 text-white" data-testid="input-name" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="nameVi"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-white">{t('admin.nameVi')}</FormLabel>
                        <FormControl>
                          <Input {...field} className="bg-zinc-800 border-zinc-700 text-white" data-testid="input-name-vi" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white">Mô tả (Tiếng Anh)</FormLabel>
                      <FormControl>
                        <Textarea {...field} className="bg-zinc-800 border-zinc-700 text-white" data-testid="input-description" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="descriptionVi"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white">{t('admin.descriptionVi')}</FormLabel>
                      <FormControl>
                        <Textarea {...field} className="bg-zinc-800 border-zinc-700 text-white" data-testid="input-description-vi" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="price"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-white">Giá (VND)</FormLabel>
                        <FormControl>
                          <Input {...field} type="text" placeholder="Ví dụ: 288000" className="bg-zinc-800 border-zinc-700 text-white" data-testid="input-price" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="vatRate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-white">VAT (%)</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white" data-testid="select-vat-rate">
                              <SelectValue placeholder="Chọn VAT" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="bg-zinc-800 border-zinc-700">
                            <SelectItem value="0" className="text-white">0%</SelectItem>
                            <SelectItem value="5" className="text-white">5%</SelectItem>
                            <SelectItem value="8" className="text-white">8%</SelectItem>
                            <SelectItem value="10" className="text-white">10%</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="categoryId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-white">Danh mục</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white" data-testid="select-category">
                              <SelectValue placeholder="Chọn danh mục" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="bg-zinc-800 border-zinc-700">
                            {categories.map((category) => (
                              <SelectItem key={category.id} value={category.id} className="text-white">
                                {category.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="multipleSchemas"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white">Tùy biến món (Optional)</FormLabel>
                      <div className="space-y-3">
                        <div className="text-sm text-zinc-400">
                          Không chọn gì nếu món không có tùy biến. Có thể chọn nhiều cấu hình và sắp xếp thứ tự hiển thị.
                        </div>
                        
                        {/* Add Schema Dropdown */}
                        <Select 
                          onValueChange={(value) => {
                            if (value !== "none" && !field.value.includes(value)) {
                              field.onChange([...field.value, value]);
                            }
                          }}
                          value="none"
                        >
                          <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white" data-testid="add-schema-select">
                            <SelectValue placeholder="+ Thêm cấu hình tùy biến" />
                          </SelectTrigger>
                          <SelectContent className="bg-zinc-800 border-zinc-700">
                            <SelectItem value="none" className="text-white">
                              + Thêm cấu hình tùy biến
                            </SelectItem>
                            {(customizationSchemas as any[])
                              .filter((schema: any) => schema.isActive && !field.value.includes(schema.id))
                              .map((schema: any) => {
                                let typeDisplay = "";
                                if (schema.type === "half_and_half") typeDisplay = "Half & Half";
                                else if (schema.type === "size_selection") typeDisplay = "Size Selection";
                                else if (schema.type === "additional_toppings") typeDisplay = "Extra Toppings";
                                else typeDisplay = schema.type;
                                
                                return (
                                  <SelectItem key={schema.id} value={schema.id} className="text-white">
                                    {schema.name} ({typeDisplay})
                                  </SelectItem>
                                );
                              })}
                          </SelectContent>
                        </Select>
                        {/* Selected Schemas Display */}
                        {field.value.length === 0 ? (
                          <div className="text-sm text-zinc-500 italic py-4 text-center border border-dashed border-zinc-700 rounded-md">
                            Món này không có tùy biến
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {field.value.map((schemaId, index) => {
                            const schema = (customizationSchemas as any[]).find((s: any) => s.id === schemaId);
                            if (!schema) return null;
                            
                            let typeDisplay = "";
                            if (schema.type === "half_and_half") typeDisplay = "Half & Half";
                            else if (schema.type === "size_selection") typeDisplay = "Size Selection";
                            else if (schema.type === "additional_toppings") typeDisplay = "Extra Toppings";
                            else typeDisplay = schema.type;
                            
                            return (
                              <div key={`${schemaId}-${index}`} className="flex items-center gap-2 bg-zinc-800 p-3 rounded-md border border-zinc-700">
                                <GripVertical className="w-4 h-4 text-zinc-500 cursor-move" />
                                <div className="flex-1">
                                  <div className="text-white font-medium">{schema.name}</div>
                                  <div className="text-xs text-zinc-400">{typeDisplay}</div>
                                </div>
                                <div className="text-xs text-zinc-500">#{index + 1}</div>
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => {
                                    const newSchemas = [...field.value];
                                    newSchemas.splice(index, 1);
                                    field.onChange(newSchemas);
                                  }}
                                  className="text-red-400 hover:text-red-300 hover:bg-red-900/20"
                                >
                                  <X className="w-4 h-4" />
                                </Button>
                              </div>
                            );
                          })}
                          </div>
                        )}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="imageUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white">Hình ảnh</FormLabel>
                      <div className="space-y-2">
                        <div className="text-sm text-zinc-400 mb-2">
                          Kích thước tối đa: 10MB | Định dạng: JPG, PNG, WEBP
                        </div>
                        <ObjectUploader
                          maxNumberOfFiles={1}
                          maxFileSize={10485760}
                          onComplete={handleUploadComplete}
                          buttonClassName="bg-zinc-700 hover:bg-zinc-600 text-white border-zinc-600"
                        >
                          <Upload className="w-4 h-4 mr-2" />
                          Tải lên hình ảnh
                        </ObjectUploader>
                        {field.value && (
                          <div className="flex flex-col space-y-2">
                            <Input 
                              {...field} 
                              placeholder="URL hình ảnh sẽ hiển thị ở đây" 
                              className="bg-zinc-800 border-zinc-700 text-white text-sm" 
                              data-testid="input-image-url"
                              readOnly
                            />
                            {field.value && (
                              <img 
                                src={field.value} 
                                alt="Preview" 
                                className="w-20 h-20 object-cover rounded border border-zinc-700"
                              />
                            )}
                          </div>
                        )}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="tags"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white">Tags (phân cách bằng dấu phẩy)</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="signature, spicy, vegetarian" className="bg-zinc-800 border-zinc-700 text-white" data-testid="input-tags" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="isAvailable"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border border-zinc-700 p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base text-white">
                          {t('admin.status')}
                        </FormLabel>
                        <div className="text-sm text-zinc-400">
                          {field.value ? t('admin.available') : t('admin.unavailable')}
                        </div>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          data-testid="switch-available"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <div className="flex justify-end gap-2 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}
                    className="border-zinc-700 text-white hover:bg-zinc-800"
                    data-testid="button-cancel"
                  >
                    {t('admin.cancel')}
                  </Button>
                  <Button
                    type="submit"
                    className="bg-white text-black hover:bg-zinc-200"
                    disabled={createMenuItemMutation.isPending || updateMenuItemMutation.isPending}
                    data-testid="button-save"
                  >
                    {editingItem ? t('admin.update') : t('admin.create')}
                  </Button>
                </div>
              </form>
            </Form>
              </DialogContent>
            </Dialog>
          </div>

          {/* Search and Filter Controls */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-zinc-400 h-4 w-4" />
              <Input
                placeholder={t('admin.searchMenu')}
                value={menuSearch}
                onChange={(e) => setMenuSearch(e.target.value)}
                className="pl-10 bg-zinc-800 border-zinc-700 text-white placeholder-zinc-400"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[200px] bg-zinc-800 border-zinc-700 text-white">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-zinc-800 border-zinc-700">
                <SelectItem value="all" className="text-white">{t('admin.allCategories')}</SelectItem>
                {categories.map(category => (
                  <SelectItem key={category.id} value={category.id} className="text-white">
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {/* Results Count */}
          <div className="text-sm text-zinc-400">
            {t('admin.showingItems')} {filteredMenuItems.length} / {menuItems.length} {t('admin.itemsLabel')}
          </div>

          <div className="grid gap-6">
        {filteredMenuItems.map((item) => (
          <Card key={item.id} className={`bg-zinc-900 ${item.isPinned ? 'border-yellow-500 ring-1 ring-yellow-500/20' : 'border-zinc-800'} ${!item.isAvailable ? 'opacity-75 bg-zinc-900/50' : ''}`} data-testid={`menu-item-${item.id}`}>
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div className="flex gap-4 flex-1">
                  {item.imageUrl && (
                    <div className="relative">
                      <img
                        src={item.imageUrl}
                        alt={item.name}
                        className="w-20 h-20 object-cover rounded-lg"
                      />
                      {item.isPinned && (
                        <div className="absolute -top-1 -right-1 bg-yellow-500 rounded-full p-1">
                          <svg className="w-3 h-3 text-black fill-current" viewBox="0 0 24 24">
                            <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                          </svg>
                        </div>
                      )}
                    </div>
                  )}
                  <div className="space-y-3 flex-1">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className={`text-xl font-bold flex items-center gap-2 ${!item.isAvailable ? 'text-zinc-500 line-through' : 'text-white'}`}>
                          {item.name}
                          {item.isPinned && (
                            <div className="flex items-center gap-1">
                              <svg className="w-5 h-5 text-yellow-500 fill-current" viewBox="0 0 24 24">
                                <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                              </svg>
                              <span className="text-xs text-yellow-500 font-medium">PINNED</span>
                            </div>
                          )}
                        </h3>
                        {item.nameVi && (
                          <p className={`text-sm ${!item.isAvailable ? 'text-zinc-600 line-through' : 'text-zinc-400'}`}>{item.nameVi}</p>
                        )}
                      </div>
                      <div className={`flex items-center gap-1 ${!item.isAvailable ? 'text-zinc-500 line-through' : 'text-yellow-400'}`}>
                        <span className="font-bold text-lg">{parseInt(item.price).toLocaleString('vi-VN')} VND</span>
                      </div>
                    </div>
                    
                    <div className={`text-sm line-clamp-2 ${!item.isAvailable ? 'text-zinc-500 line-through' : 'text-zinc-300'}`}>
                      {item.description}
                    </div>
                    {item.descriptionVi && (
                      <div className={`text-sm line-clamp-2 ${!item.isAvailable ? 'text-zinc-600 line-through' : 'text-zinc-400'}`}>
                        {item.descriptionVi}
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Badge variant="outline" className="text-zinc-300 border-zinc-600">
                          {getCategoryName(item.categoryId || "")}
                        </Badge>
                        <Badge variant={item.isAvailable ? "default" : "destructive"}>
                          {item.isAvailable ? t('menu.available') : t('menu.soldOut')}
                        </Badge>
                        {item.customizationSchemaId && (
                          <Badge variant="secondary" className="text-blue-300 border-blue-600 bg-blue-900/20">
                            {(() => {
                              const schema = (customizationSchemas as any[]).find(s => s.id === item.customizationSchemaId);
                              if (!schema) return "Tùy biến";
                              
                              if (schema.type === "half_and_half") return "Half & Half";
                              if (schema.type === "size_selection") return "Chọn Size";
                              if (schema.type === "additional_toppings") return "Extra Toppings";
                              return "Tùy biến";
                            })()}
                          </Badge>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-zinc-400">
                            {item.isAvailable ? "Có sẵn" : "Hết món"}
                          </span>
                          <Switch
                            checked={item.isAvailable}
                            onCheckedChange={(checked) => {
                              toggleAvailabilityMutation.mutate({ 
                                id: item.id, 
                                isAvailable: checked
                              });
                            }}
                            disabled={toggleAvailabilityMutation.isPending}
                            className="data-[state=checked]:bg-green-500"
                          />
                        </div>
                        
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => togglePinMutation.mutate(item.id)}
                          className={`border-zinc-700 hover:bg-zinc-800 ${item.isPinned ? 'text-yellow-500 border-yellow-500' : 'text-white'}`}
                          data-testid={`button-pin-${item.id}`}
                          disabled={togglePinMutation.isPending}
                          title={item.isPinned ? "Bỏ ghim món ăn" : "Ghim món ăn lên trang chủ"}
                        >
                          <svg className="w-4 h-4" fill={item.isPinned ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                          </svg>
                        </Button>
                        
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEdit(item)}
                          className="border-zinc-700 text-white hover:bg-zinc-800"
                          data-testid={`button-edit-${item.id}`}
                          title="Chỉnh sửa món ăn"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setDeleteConfirmItem(item)}
                          className="border-red-700 text-red-400 hover:bg-red-900/20"
                          data-testid={`button-delete-${item.id}`}
                          title="Xóa món ăn"
                          disabled={deleteMenuItemMutation.isPending}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                        
                      </div>
                    </div>
                    
                    {item.tags && item.tags.length > 0 && (
                      <div className="flex gap-1 flex-wrap">
                        {item.tags.map((tag) => (
                          <Badge key={tag} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                

              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredMenuItems.length === 0 && menuItems.length > 0 && (
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-8 text-center">
            <p className="text-zinc-500">Không tìm thấy món ăn phù hợp</p>
            <p className="text-zinc-600 text-sm mt-2">Thử điều chỉnh từ khóa tìm kiếm hoặc bộ lọc</p>
          </CardContent>
        </Card>
      )}
      
      {menuItems.length === 0 && (
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-8 text-center">
            <p className="text-zinc-500">Chưa có món ăn nào trong menu</p>
            <p className="text-zinc-600 text-sm mt-2">Nhấn "Thêm Món Ăn" để bắt đầu</p>
          </CardContent>
        </Card>
      )}
          </TabsContent>
          
          <TabsContent value="categories" className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-xl font-bold text-white">Danh Mục</h3>
                <p className="text-zinc-400">Quản lý các danh mục thực đơn</p>
              </div>
              <Dialog open={isCategoryDialogOpen} onOpenChange={setIsCategoryDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={handleAddCategory} className="bg-white text-black hover:bg-zinc-200">
                    <FolderPlus className="w-4 h-4 mr-2" />
                    Thêm Danh Mục
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-zinc-900 border-zinc-800 max-w-lg">
                  <DialogHeader>
                    <DialogTitle className="text-white">
                      {editingCategory ? "Chỉnh Sửa Danh Mục" : "Thêm Danh Mục Mới"}
                    </DialogTitle>
                    <DialogDescription className="text-zinc-400">
                      {editingCategory ? "Cập nhật thông tin danh mục" : "Tạo danh mục mới cho thực đơn"}
                    </DialogDescription>
                  </DialogHeader>
                  <Form {...categoryForm}>
                    <form onSubmit={categoryForm.handleSubmit(onCategorySubmit)} className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={categoryForm.control}
                          name="name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-white">Tên Tiếng Anh</FormLabel>
                              <FormControl>
                                <Input {...field} className="bg-zinc-800 border-zinc-700 text-white" placeholder="Appetizers" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={categoryForm.control}
                          name="nameVi"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-white">Tên Tiếng Việt</FormLabel>
                              <FormControl>
                                <Input {...field} className="bg-zinc-800 border-zinc-700 text-white" placeholder="Khai Vị" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <FormField
                        control={categoryForm.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-white">Mô Tả (Tuỳ Chọn)</FormLabel>
                            <FormControl>
                              <Textarea {...field} className="bg-zinc-800 border-zinc-700 text-white" placeholder="Mô tả về danh mục này..." />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={categoryForm.control}
                        name="sortOrder"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-white">Thứ Tự Hiển Thị</FormLabel>
                            <FormControl>
                              <Input 
                                {...field} 
                                type="number" 
                                className="bg-zinc-800 border-zinc-700 text-white" 
                                onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                                value={field.value}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="flex justify-end gap-2 pt-4">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setIsCategoryDialogOpen(false)}
                          className="border-zinc-700 text-white hover:bg-zinc-800"
                        >
                          Hủy
                        </Button>
                        <Button
                          type="submit"
                          className="bg-white text-black hover:bg-zinc-200"
                          disabled={createCategoryMutation.isPending || updateCategoryMutation.isPending}
                        >
                          {editingCategory ? "Cập Nhật" : "Tạo Mới"}
                        </Button>
                      </div>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </div>
            
            <div className="grid gap-4">
              {categories.map((category) => (
                <Card key={category.id} className="bg-zinc-900 border-zinc-800">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <h4 className="text-lg font-semibold text-white">{category.name}</h4>
                        {category.nameVi && (
                          <p className="text-zinc-400 text-sm">{category.nameVi}</p>
                        )}
                        {category.description && (
                          <p className="text-zinc-300 text-sm mt-1">{category.description}</p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => handleEditCategory(category)}
                          className="border-zinc-700 text-white hover:bg-zinc-800"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="destructive"
                          onClick={() => setDeletingCategory(category)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="customizations" className="space-y-6">
            <CustomizationManagement />
          </TabsContent>
        </Tabs>


        {/* Delete Confirmation Dialog */}
        <AlertDialog open={!!deleteConfirmItem} onOpenChange={() => setDeleteConfirmItem(null)}>
          <AlertDialogContent className="bg-zinc-900 border-zinc-700">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-white">Xác nhận xóa món ăn</AlertDialogTitle>
              <AlertDialogDescription className="text-zinc-400">
                Bạn có chắc chắn muốn xóa món "{deleteConfirmItem?.name}"? Hành động này không thể hoàn tác.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="border-zinc-700 text-white hover:bg-zinc-800">
                Hủy
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  if (deleteConfirmItem) {
                    deleteMenuItemMutation.mutate(deleteConfirmItem.id);
                    setDeleteConfirmItem(null);
                  }
                }}
                className="bg-red-600 hover:bg-red-700 text-white"
                disabled={deleteMenuItemMutation.isPending}
              >
                {deleteMenuItemMutation.isPending ? "Đang xóa..." : "Xóa"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Delete Category Confirmation Dialog */}
        <AlertDialog open={!!deletingCategory} onOpenChange={() => setDeletingCategory(null)}>
          <AlertDialogContent className="bg-zinc-900 border-zinc-700">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-white">Xác nhận xóa danh mục</AlertDialogTitle>
              <AlertDialogDescription className="text-zinc-400">
                Bạn có chắc chắn muốn xóa danh mục "{deletingCategory?.name}" không?
                {deletingCategory && (
                  <div className="mt-2 p-3 bg-amber-900/20 border border-amber-700/50 rounded-md">
                    <p className="text-amber-300 text-sm">
                      Tất cả món ăn trong danh mục này sẽ được chuyển về mục "Tất Cả Món Ăn" (không có danh mục cụ thể).
                    </p>
                  </div>
                )}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel 
                onClick={() => setDeletingCategory(null)}
                className="bg-zinc-800 border-zinc-600 text-white hover:bg-zinc-700"
              >
                Hủy
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  if (deletingCategory) {
                    deleteCategoryMutation.mutate(deletingCategory.id);
                    setDeletingCategory(null);
                  }
                }}
                className="bg-red-600 hover:bg-red-700 text-white"
                disabled={deleteCategoryMutation.isPending}
              >
                {deleteCategoryMutation.isPending ? "Đang xóa..." : "Xóa"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
    </div>
  );
}