import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Minus, Plus, Trash2, Phone, AlertTriangle } from "lucide-react";
import { useCart } from "@/hooks/use-cart";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { formatPrice } from "@/lib/currency";
import { useLanguage } from "@/contexts/LanguageContext";
import { useState } from "react";

interface CartModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface OrderForm {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerAddress: string;
  orderType: "dine-in" | "takeout" | "delivery";
  specialInstructions: string;
  paymentMethod: "cash" | "transfer";
}

export default function CartModal({ open, onOpenChange }: CartModalProps) {
  const { items, updateQuantity, removeItem, totalPrice, clearCart } = useCart();
  const { toast } = useToast();
  const { language } = useLanguage();
  const queryClient = useQueryClient();
  
  const [showCheckout, setShowCheckout] = useState(false);

  const { data: settings } = useQuery<Record<string, any>>({
    queryKey: ["/api/system-settings"],
  });

  const orderingLocked = settings?.ordering_locked || false;
  const [orderForm, setOrderForm] = useState<OrderForm>({
    customerName: "",
    customerEmail: "",
    customerPhone: "",
    customerAddress: "",
    orderType: "takeout",
    specialInstructions: "",
    paymentMethod: "cash",
  });

  const createOrder = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/orders", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: language === 'vi' ? "Đặt hàng thành công!" : "Order Placed!",
        description: language === 'vi' ? "Nhà hàng sẽ liên hệ với bạn để xác nhận đơn hàng và hướng dẫn thanh toán." : "The restaurant will contact you to confirm your order and provide payment instructions.",
      });
      clearCart();
      setShowCheckout(false);
      setOrderForm({
        customerName: "",
        customerEmail: "",
        customerPhone: "",
        customerAddress: "",
        orderType: "takeout",
        specialInstructions: "",
        paymentMethod: "cash",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast({
        title: language === 'vi' ? "Đặt hàng thất bại" : "Order Failed",
        description: error.message || (language === 'vi' ? "Vui lòng thử lại sau." : "Please try again later."),
        variant: "destructive",
      });
    },
  });

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate address for delivery orders
    if (orderForm.orderType === "delivery" && !orderForm.customerAddress.trim()) {
      toast({
        title: language === 'vi' ? "Thiếu thông tin" : "Missing Information",
        description: language === 'vi' ? "Vui lòng nhập địa chỉ giao hàng." : "Please enter delivery address.",
        variant: "destructive",
      });
      return;
    }
    
    // Fetch current menu prices to ensure accuracy
    try {
      const menuItems = await queryClient.fetchQuery({
        queryKey: ['/api/menu-items'],
        staleTime: 0, // Force fresh data
      });
      
      // Update items with current prices from menu
      const updatedItems = items.map(cartItem => {
        const menuItem = (menuItems as any[]).find((m: any) => m.id === cartItem.id);
        const currentPrice = menuItem ? parseFloat(menuItem.price) : cartItem.price;
        return {
          id: cartItem.id,
          name: cartItem.name,
          price: currentPrice,
          quantity: cartItem.quantity,
        };
      });
      
      // Calculate total with current prices
      const updatedTotal = updatedItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
      
      const orderData = {
        ...orderForm,
        items: updatedItems,
        totalAmount: updatedTotal.toFixed(2),
      };
      
      createOrder.mutate(orderData);
    } catch (error) {
      // Fallback to cart prices if fetch fails
      const orderData = {
        ...orderForm,
        items: items.map(item => ({
          id: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
        })),
        totalAmount: totalPrice.toFixed(2),
      };
      
      createOrder.mutate(orderData);
    }
  };

  if (showCheckout) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="bg-noir-900 border-noir-700 max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-white">
              {language === 'vi' ? 'Thanh Toán' : 'Checkout'}
            </DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleCheckout} className="space-y-4">
            <div>
              <Label className="block text-sm font-medium mb-2 text-white">
                {language === 'vi' ? 'Họ và Tên' : 'Full Name'}
              </Label>
              <Input
                value={orderForm.customerName}
                onChange={(e) => setOrderForm({ ...orderForm, customerName: e.target.value })}
                className="bg-noir-800 border-noir-700 focus:border-primary text-white"
                placeholder={language === 'vi' ? 'Nhập họ và tên đầy đủ...' : 'Enter your full name...'}
                required
              />
            </div>
            
            <div>
              <Label className="block text-sm font-medium mb-2 text-white">Email</Label>
              <Input
                type="email"
                value={orderForm.customerEmail}
                onChange={(e) => setOrderForm({ ...orderForm, customerEmail: e.target.value })}
                className="bg-noir-800 border-noir-700 focus:border-primary text-white"
                placeholder={language === 'vi' ? 'Nhập địa chỉ email...' : 'Enter your email address...'}
                required
              />
            </div>
            
            <div>
              <Label className="block text-sm font-medium mb-2 text-white">
                {language === 'vi' ? 'Số Điện Thoại' : 'Phone'}
              </Label>
              <Input
                type="tel"
                value={orderForm.customerPhone}
                onChange={(e) => setOrderForm({ ...orderForm, customerPhone: e.target.value })}
                className="bg-noir-800 border-noir-700 focus:border-primary text-white"
                placeholder={language === 'vi' ? 'Nhập số điện thoại...' : 'Enter your phone number...'}
                required
              />
            </div>
            
            <div>
              <Label className="block text-sm font-medium mb-2 text-white">
                {language === 'vi' ? 'Địa Chỉ' : 'Address'}
              </Label>
              <Input
                value={orderForm.customerAddress}
                onChange={(e) => setOrderForm({ ...orderForm, customerAddress: e.target.value })}
                className="bg-noir-800 border-noir-700 focus:border-primary text-white"
                placeholder={language === 'vi' ? 'Nhập địa chỉ giao hàng...' : 'Enter delivery address...'}
                data-testid="input-address"
              />
            </div>
            
            <div>
              <Label className="block text-sm font-medium mb-2 text-white">
                {language === 'vi' ? 'Loại Đơn Hàng' : 'Order Type'}
              </Label>
              <Select value={orderForm.orderType} onValueChange={(value: any) => setOrderForm({ ...orderForm, orderType: value })}>
                <SelectTrigger className="bg-noir-800 border-noir-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-noir-800 border-noir-700">
                  <SelectItem value="takeout">{language === 'vi' ? 'Mang Về' : 'Takeout'}</SelectItem>
                  <SelectItem value="dine-in">{language === 'vi' ? 'Ăn Tại Chỗ' : 'Dine In'}</SelectItem>
                  <SelectItem value="delivery">{language === 'vi' ? 'Giao Hàng' : 'Delivery'}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="block text-sm font-medium mb-2 text-white">
                {language === 'vi' ? 'Phương Thức Thanh Toán' : 'Payment Method'}
              </Label>
              <Select value={orderForm.paymentMethod} onValueChange={(value: any) => setOrderForm({ ...orderForm, paymentMethod: value })}>
                <SelectTrigger className="bg-noir-800 border-noir-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-noir-800 border-noir-700">
                  <SelectItem value="cash">{language === 'vi' ? 'Tiền Mặt' : 'Cash'}</SelectItem>
                  <SelectItem value="transfer">{language === 'vi' ? 'Chuyển Khoản' : 'Bank Transfer'}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label className="block text-sm font-medium mb-2 text-white">
                {language === 'vi' ? 'Ghi Chú Đặc Biệt' : 'Special Instructions'}
              </Label>
              <Textarea
                value={orderForm.specialInstructions}
                onChange={(e) => setOrderForm({ ...orderForm, specialInstructions: e.target.value })}
                className="bg-noir-800 border-noir-700 focus:border-primary text-white resize-none"
                rows={3}
                placeholder={language === 'vi' ? 'Yêu cầu đặc biệt hoặc dị ứng thực phẩm...' : 'Any special requests or dietary restrictions...'}
              />
            </div>
            
            <div className="border-t border-noir-700 pt-4">
              {/* VAT and Delivery Notices */}
              <div className="space-y-2 mb-4 text-xs text-gray-400">
                <p>
                  {language === 'vi' 
                    ? 'Tạm thời chưa cung cấp dịch vụ giao hàng. Quý khách vui lòng tự đặt giao hàng hoặc nhận tại nhà hàng, đội ngũ chỉ có thể hỗ trợ kết nối shipper.'
                    : 'Delivery service is temporarily unavailable. Please arrange your own delivery or pick up at the restaurant; our team can only assist in connecting you with a courier.'
                  }
                </p>
              </div>
              
              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-white font-medium text-[14px]">
                  <span>{language === 'vi' ? 'Tổng:' : 'Total:'}</span>
                  <span>{formatPrice(totalPrice)}</span>
                </div>
                <div className="flex justify-between text-white opacity-70 text-[14px] font-medium">
                  <span>{language === 'vi' ? 'VAT:' : 'VAT:'}</span>
                  <span>{formatPrice(Math.round(items.reduce((sum, item) => sum + (item.price * item.quantity * (item.vatRate || 8) / 100), 0)))}</span>
                </div>
                <div className="border-t border-noir-600 pt-2">
                  <div className="flex justify-between text-lg font-bold text-white">
                    <span>{language === 'vi' ? 'Tổng cộng:' : 'Total Amount:'}</span>
                    <span>{formatPrice(totalPrice + Math.round(items.reduce((sum, item) => sum + (item.price * item.quantity * (item.vatRate || 8) / 100), 0)))}</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowCheckout(false)}
                className="flex-1 border-noir-600 text-white hover:bg-noir-800"
              >
                {language === 'vi' ? 'Quay Lại' : 'Back'}
              </Button>
              <Button
                type="submit"
                disabled={createOrder.isPending}
                className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                {createOrder.isPending 
                  ? (language === 'vi' ? 'Đang xử lý...' : 'Placing...') 
                  : (language === 'vi' ? 'Đặt Hàng' : 'Place Order')
                }
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-noir-900 border-noir-700 max-w-md max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-white">
            {language === 'vi' ? 'Giỏ Hàng' : 'Shopping Cart'}
          </DialogTitle>
        </DialogHeader>
        
        {items.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-400">
              {language === 'vi' ? 'Giỏ hàng của bạn đang trống' : 'Your cart is empty'}
            </p>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto space-y-4">
              {items.map((item) => (
                <div key={item.id} className="flex items-center space-x-4 p-4 bg-noir-800 rounded-lg">
                  <div className="flex-1">
                    <h3 className="font-medium text-white">
                      {language === 'vi' ? (item.nameVi || item.name) : item.name}
                    </h3>
                    <p className="text-primary font-bold">{formatPrice(item.price)}</p>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      className="border-noir-600 text-white hover:bg-noir-700"
                    >
                      <Minus className="w-3 h-3" />
                    </Button>
                    <span className="w-8 text-center text-white">{item.quantity}</span>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      className="border-noir-600 text-white hover:bg-noir-700"
                    >
                      <Plus className="w-3 h-3" />
                    </Button>
                  </div>
                  
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => removeItem(item.id)}
                    className="text-red-400 hover:text-red-300 hover:bg-red-500/20"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
            
            <div className="border-t border-noir-700 pt-4">
              {/* VAT and Delivery Notices */}
              <div className="space-y-2 mb-4 text-xs text-gray-400">
                <p>
                  {language === 'vi' 
                    ? 'Tạm thời chưa cung cấp dịch vụ giao hàng. Quý khách vui lòng tự đặt giao hàng hoặc nhận tại nhà hàng, đội ngũ chỉ có thể hỗ trợ kết nối shipper.'
                    : 'Delivery service is temporarily unavailable. Please arrange your own delivery or pick up at the restaurant; our team can only assist in connecting you with a courier.'
                  }
                </p>
              </div>
              
              {/* Price breakdown */}
              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-white font-medium text-[14px]">
                  <span>{language === 'vi' ? 'Tạm tính:' : 'Subtotal:'}</span>
                  <span>{formatPrice(totalPrice)}</span>
                </div>
                <div className="flex justify-between text-white text-sm opacity-70">
                  <span>{language === 'vi' ? 'VAT:' : 'VAT:'}</span>
                  <span>{formatPrice(Math.round(items.reduce((sum, item) => sum + (item.price * item.quantity * (item.vatRate || 8) / 100), 0)))}</span>
                </div>
                <div className="border-t border-noir-600 pt-2">
                  <div className="flex justify-between text-lg font-bold text-white">
                    <span>{language === 'vi' ? 'Tổng cộng:' : 'Total:'}</span>
                    <span>{formatPrice(totalPrice + Math.round(items.reduce((sum, item) => sum + (item.price * item.quantity * (item.vatRate || 8) / 100), 0)))}</span>
                  </div>
                </div>
              </div>
              
              {orderingLocked ? (
                <div className="space-y-3">
                  <p className="text-white font-medium text-[14px]">
                    {language === 'vi' 
                      ? (settings?.ordering_locked_message_vi || 'Đặt hàng online tạm thời không khả dụng. Vui lòng liên hệ trực tiếp với nhà hàng qua số điện thoại để đặt hàng.')
                      : (settings?.ordering_locked_message_en || 'Online ordering is temporarily unavailable. Please contact the restaurant directly by phone to place an order.')
                    }
                  </p>
                  <a 
                    href="tel:+84934699798"
                    className="flex items-center justify-center gap-2 w-full bg-primary hover:bg-primary/90 text-primary-foreground py-3 rounded-md font-medium transition-colors"
                  >
                    <Phone className="w-4 h-4" />
                    {language === 'vi' ? 'Gọi Đặt Hàng' : 'Call to Order'}
                  </a>
                </div>
              ) : (
                <Button
                  onClick={() => setShowCheckout(true)}
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                  {language === 'vi' ? 'Tiến Hành Thanh Toán' : 'Proceed to Checkout'}
                </Button>
              )}
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
