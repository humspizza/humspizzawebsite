import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useLanguage } from "@/contexts/LanguageContext";
import { Lock, Unlock, Clock, ShoppingCart, AlertTriangle, Phone } from "lucide-react";

interface TimeSlotLock {
  [time: string]: boolean;
}

export default function FeatureLocksSettings() {
  const { toast } = useToast();
  const { language } = useLanguage();
  
  const [orderingLocked, setOrderingLocked] = useState(false);
  const [lockedTimeSlots, setLockedTimeSlots] = useState<TimeSlotLock>({});

  const { data: settings, isLoading } = useQuery<Record<string, any>>({
    queryKey: ["/api/system-settings"],
  });

  useEffect(() => {
    if (settings) {
      setOrderingLocked(settings.ordering_locked || false);
      setLockedTimeSlots(settings.locked_time_slots || {});
    }
  }, [settings]);

  const updateSettingMutation = useMutation({
    mutationFn: async ({ key, value }: { key: string; value: any }) => {
      const response = await apiRequest("PUT", `/api/admin/system-settings/${key}`, { value });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/system-settings"] });
      toast({
        title: language === 'vi' ? "Đã cập nhật" : "Updated",
        description: language === 'vi' ? "Cài đặt đã được lưu thành công" : "Settings saved successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: language === 'vi' ? "Lỗi" : "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const timeSlots: string[] = [];
  let currentHour = 11;
  let currentMinute = 30;
  while (currentHour < 21 || (currentHour === 21 && currentMinute <= 0)) {
    const timeString = `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`;
    timeSlots.push(timeString);
    currentMinute += 15;
    if (currentMinute >= 60) {
      currentMinute = 0;
      currentHour += 1;
    }
  }

  const handleOrderingLockToggle = (locked: boolean) => {
    setOrderingLocked(locked);
    updateSettingMutation.mutate({ key: 'ordering_locked', value: locked });
  };

  const handleTimeSlotToggle = (time: string, locked: boolean) => {
    const newLockedSlots = { ...lockedTimeSlots, [time]: locked };
    if (!locked) {
      delete newLockedSlots[time];
    }
    setLockedTimeSlots(newLockedSlots);
    updateSettingMutation.mutate({ key: 'locked_time_slots', value: newLockedSlots });
  };

  const lockAllTimeSlots = () => {
    const allLocked: TimeSlotLock = {};
    timeSlots.forEach(t => { allLocked[t] = true; });
    setLockedTimeSlots(allLocked);
    updateSettingMutation.mutate({ key: 'locked_time_slots', value: allLocked });
  };

  const unlockAllTimeSlots = () => {
    setLockedTimeSlots({});
    updateSettingMutation.mutate({ key: 'locked_time_slots', value: {} });
  };

  const lockedCount = Object.keys(lockedTimeSlots).filter(k => lockedTimeSlots[k]).length;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <ShoppingCart className="w-5 h-5" />
            {language === 'vi' ? 'Khóa Đặt Hàng Online' : 'Lock Online Ordering'}
          </CardTitle>
          <CardDescription className="text-zinc-400">
            {language === 'vi' 
              ? 'Khi bật, khách hàng chỉ có thể xem giỏ hàng nhưng không thể đặt hàng. Họ sẽ nhận được thông báo liên hệ trực tiếp với nhà hàng.'
              : 'When enabled, customers can view cart but cannot place orders. They will be prompted to contact the restaurant directly.'
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-4 bg-zinc-800 rounded-lg">
            <div className="flex items-center gap-3">
              {orderingLocked ? (
                <Lock className="w-6 h-6 text-red-500" />
              ) : (
                <Unlock className="w-6 h-6 text-green-500" />
              )}
              <div>
                <p className="font-medium text-white">
                  {orderingLocked 
                    ? (language === 'vi' ? 'Đặt hàng đang bị KHÓA' : 'Ordering is LOCKED')
                    : (language === 'vi' ? 'Đặt hàng đang MỞ' : 'Ordering is OPEN')
                  }
                </p>
                <p className="text-sm text-zinc-400">
                  {orderingLocked 
                    ? (language === 'vi' ? 'Khách hàng sẽ thấy thông báo liên hệ' : 'Customers will see contact message')
                    : (language === 'vi' ? 'Khách hàng có thể đặt hàng bình thường' : 'Customers can place orders normally')
                  }
                </p>
              </div>
            </div>
            <Switch
              checked={orderingLocked}
              onCheckedChange={handleOrderingLockToggle}
              className="data-[state=checked]:bg-red-500"
              data-testid="switch-ordering-lock"
            />
          </div>
          
          {orderingLocked && (
            <div className="mt-4 p-4 bg-amber-900/20 border border-amber-500/30 rounded-lg flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-amber-200 font-medium">
                  {language === 'vi' ? 'Chú ý' : 'Note'}
                </p>
                <p className="text-amber-300/80 text-sm">
                  {language === 'vi' 
                    ? 'Khách hàng sẽ thấy thông báo: "Tính năng đặt hàng online tạm thời không khả dụng. Vui lòng liên hệ trực tiếp với nhà hàng qua số điện thoại để đặt hàng."'
                    : 'Customers will see: "Online ordering is temporarily unavailable. Please contact the restaurant directly by phone to place an order."'
                  }
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Clock className="w-5 h-5" />
            {language === 'vi' ? 'Khóa Khung Giờ Đặt Bàn' : 'Lock Reservation Time Slots'}
          </CardTitle>
          <CardDescription className="text-zinc-400">
            {language === 'vi' 
              ? 'Chọn các khung giờ muốn khóa. Khung giờ bị khóa sẽ không hiển thị trong form đặt bàn của khách hàng.'
              : 'Select time slots to lock. Locked time slots will not appear in the customer reservation form.'
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Badge variant={lockedCount > 0 ? "destructive" : "secondary"}>
                {lockedCount} / {timeSlots.length} {language === 'vi' ? 'đang khóa' : 'locked'}
              </Badge>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={lockAllTimeSlots}
                className="text-red-400 border-red-400/50 hover:bg-red-500/10"
                data-testid="button-lock-all-slots"
              >
                <Lock className="w-4 h-4 mr-2" />
                {language === 'vi' ? 'Khóa tất cả' : 'Lock All'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={unlockAllTimeSlots}
                className="text-green-400 border-green-400/50 hover:bg-green-500/10"
                data-testid="button-unlock-all-slots"
              >
                <Unlock className="w-4 h-4 mr-2" />
                {language === 'vi' ? 'Mở tất cả' : 'Unlock All'}
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
            {timeSlots.map((time) => {
              const isLocked = lockedTimeSlots[time] || false;
              return (
                <button
                  key={time}
                  onClick={() => handleTimeSlotToggle(time, !isLocked)}
                  className={`p-2 rounded-lg text-sm font-medium transition-all ${
                    isLocked
                      ? 'bg-red-500/20 text-red-400 border border-red-500/50 hover:bg-red-500/30'
                      : 'bg-zinc-800 text-zinc-300 border border-zinc-700 hover:bg-zinc-700 hover:text-white'
                  }`}
                  data-testid={`timeslot-${time}`}
                >
                  {isLocked && <Lock className="w-3 h-3 inline mr-1" />}
                  {time}
                </button>
              );
            })}
          </div>

          {lockedCount > 0 && (
            <div className="mt-4 p-4 bg-red-900/20 border border-red-500/30 rounded-lg">
              <p className="text-red-200 text-sm">
                <Lock className="w-4 h-4 inline mr-2" />
                {language === 'vi' 
                  ? `${lockedCount} khung giờ đang bị khóa và sẽ không hiển thị cho khách hàng khi đặt bàn.`
                  : `${lockedCount} time slot(s) are locked and will not be visible to customers when booking.`
                }
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Phone className="w-5 h-5" />
            {language === 'vi' ? 'Thông tin liên hệ nhà hàng' : 'Restaurant Contact Info'}
          </CardTitle>
          <CardDescription className="text-zinc-400">
            {language === 'vi' 
              ? 'Số điện thoại hiển thị khi khóa tính năng đặt hàng'
              : 'Phone number shown when ordering is locked'
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="p-4 bg-zinc-800 rounded-lg">
            <p className="text-zinc-300">
              {language === 'vi' 
                ? 'Khách hàng sẽ được hướng dẫn liên hệ qua số điện thoại nhà hàng được cấu hình trong trang Thông Tin Liên Hệ.'
                : 'Customers will be directed to contact via the restaurant phone number configured in Contact Information page.'
              }
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
