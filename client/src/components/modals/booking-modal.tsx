import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useLanguage } from "@/contexts/LanguageContext";
import type { ReservationForm } from "@/lib/types";

interface BookingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function BookingModal({ open, onOpenChange }: BookingModalProps) {
  const { t, language } = useLanguage();
  const [form, setForm] = useState<ReservationForm>({
    date: "",
    time: "",
    guests: 1,
    name: "",
    email: "",
    phone: "",
    specialRequests: "",
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const createReservation = useMutation({
    mutationFn: async (data: ReservationForm) => {
      const response = await apiRequest("POST", "/api/reservations", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Đặt bàn thành công!",
        description: "Chúng tôi sẽ xác nhận và liên hệ khách trong thời gian sớm nhất.",
      });
      setForm({
        date: "",
        time: "",
        guests: 1,
        name: "",
        email: "",
        phone: "",
        specialRequests: "",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/reservations"] });
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast({
        title: "Reservation Failed",
        description: error.message || "Please try again later.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createReservation.mutate(form);
  };

  // Generate time slots from 11:30 to 21:00 with 15-minute intervals
  const timeSlots = [];
  
  // Start from 11:30
  let currentHour = 11;
  let currentMinute = 30;
  
  while (currentHour < 21 || (currentHour === 21 && currentMinute <= 0)) {
    const timeString = `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`;
    timeSlots.push(timeString);
    
    // Add 15 minutes
    currentMinute += 15;
    if (currentMinute >= 60) {
      currentMinute = 0;
      currentHour += 1;
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-noir-900 border-noir-700 max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center">{t('booking.title')}</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">{t('booking.date')}</label>
              <Input
                type="date"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                className="bg-noir-800 border-noir-700 focus:border-primary"
                min={new Date().toISOString().split('T')[0]}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">{t('booking.time')}</label>
              <Select value={form.time} onValueChange={(value) => setForm({ ...form, time: value })}>
                <SelectTrigger className="bg-noir-800 border-noir-700">
                  <SelectValue placeholder={t('booking.selectTime')} />
                </SelectTrigger>
                <SelectContent>
                  {timeSlots.map((time) => (
                    <SelectItem key={time} value={time}>
                      {time}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">{language === 'vi' ? 'Số khách' : 'Guests'}</label>
              <Select value={form.guests > 0 ? form.guests.toString() : ""} onValueChange={(value) => setForm({ ...form, guests: parseInt(value) })}>
                <SelectTrigger className="bg-noir-800 border-noir-700">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="max-h-[200px] overflow-y-auto">
                  {Array.from({ length: 50 }, (_, i) => i + 1).map((num) => (
                    <SelectItem key={num} value={num.toString()}>
                      {num} {num > 1 ? t('booking.guests') : t('booking.guest')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">{t('booking.name')}</label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="bg-noir-800 border-noir-700 focus:border-primary"
                placeholder={language === 'vi' ? 'Nhập họ tên' : 'Enter your name'}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">{language === 'vi' ? 'Email (Tùy chọn)' : 'Email (Optional)'}</label>
              <Input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="bg-noir-800 border-noir-700 focus:border-primary"
                placeholder="email@example.com"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">{t('booking.phone')}</label>
            <Input
              type="tel"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="bg-noir-800 border-noir-700 focus:border-primary"
              placeholder={language === 'vi' ? 'Nhập số điện thoại' : 'Enter phone number'}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">{language === 'vi' ? 'Ghi chú (Tùy chọn)' : 'Notes (Optional)'}</label>
            <Textarea
              value={form.specialRequests}
              onChange={(e) => setForm({ ...form, specialRequests: e.target.value })}
              placeholder={language === 'vi' 
                ? 'Trang trí dịp đặc biệt (sinh nhật, kỷ niệm...), sở thích về chỗ ngồi (yên tĩnh, gần cửa sổ...) hoặc yêu cầu khác'
                : 'Special occasion decorations (birthday, anniversary...), seating preferences (quiet, near window...) or other requests'
              }
              className="bg-noir-800 border-noir-700 focus:border-primary resize-none"
              rows={3}
            />
          </div>

          <div className="flex gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              {t('booking.cancel')}
            </Button>
            <Button
              type="submit"
              disabled={createReservation.isPending}
              className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              {createReservation.isPending ? t('booking.confirming') : t('booking.confirm')}
            </Button>
          </div>

          {/* Confirmation Note */}
          <p className="text-xs text-gray-400 text-center -mt-2">
            {language === 'vi' 
              ? 'Sau khi Quý khách hoàn tất đặt bàn, nhân viên của nhà hàng sẽ liên hệ để xác nhận thông tin.'
              : 'After completing your reservation, our staff will contact you to confirm the details.'
            }
          </p>
        </form>
      </DialogContent>
    </Dialog>
  );
}
