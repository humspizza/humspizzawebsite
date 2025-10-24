import { useState, useRef, useEffect } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { useIntersectionObserver } from "@/hooks/use-intersection-observer";
import { apiRequest } from "@/lib/queryClient";
import type { ReservationForm } from "@/lib/types";
import type { HomeContent } from "@shared/schema";

export default function ReservationSection() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const { elementRef, hasIntersected } = useIntersectionObserver({
    rootMargin: '100px',
  });
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
  const { t, language } = useLanguage();
  const queryClient = useQueryClient();

  // Fetch home content for section titles
  const { data: homeContent } = useQuery<HomeContent>({
    queryKey: ["/api/home-content"],
  });

  const createReservation = useMutation({
    mutationFn: async (data: ReservationForm) => {
      const response = await apiRequest("POST", "/api/reservations", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: t('booking.success'),
        description: t('booking.successMessage'),
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
    },
    onError: (error: any) => {
      toast({
        title: t('common.error'),
        description: error.message || t('common.error'),
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createReservation.mutate(form);
  };

  // Generate time slots from 11:30 to 21:00 with 15-minute intervals (đồng bộ với trang đặt bàn)
  const timeSlots = [];
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

  // Start playing video only when section is visible
  useEffect(() => {
    if (hasIntersected && videoRef.current) {
      const video = videoRef.current;
      try {
        const videoUrl = homeContent?.reservationVideoUrl || `/hero2.landingpage.mp4`;
        video.src = `${videoUrl}?v=${Date.now()}`;
        video.load(); // Ensure video loads properly
        video.play().catch((error) => {
          // Video autoplay blocked, user interaction required
        });
      } catch (error) {
        // Error loading video
      }
    }
  }, [hasIntersected, homeContent]);

  return (
    <section ref={elementRef} className="relative py-20 overflow-hidden">
      {/* Video Background - Only load when visible */}
      {hasIntersected && (
        <video 
          ref={videoRef}
          className="absolute inset-0 w-full h-full object-cover z-0"
          muted 
          loop 
          playsInline
          preload="metadata"
          controls={false}
          disablePictureInPicture
          webkit-playsinline="true"
          style={{ objectFit: 'cover' }}
          onError={(e) => {
            // Video error
          }}
          onLoadStart={() => {
            // Video loading started
          }}
        />
      )}
      {/* Video Overlay */}
      <div className="absolute inset-0 bg-black/60 z-10"></div>
      <div className="container mx-auto px-4 relative z-20">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-5xl font-bold mb-6">
              {homeContent 
                ? (language === 'vi' ? homeContent.reservationTitleVi : homeContent.reservationTitle)
                : t('reservation.title')
              }
            </h2>
            <p className="text-xl text-gray-300">
              {homeContent 
                ? (language === 'vi' ? homeContent.reservationSubtitleVi : homeContent.reservationSubtitle)
                : t('reservation.subtitle')
              }
            </p>
          </div>

          <div className="bg-noir-900 rounded-lg p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium mb-3">{t('booking.date')}</label>
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
                  <label className="block text-sm font-medium mb-3">{t('booking.time')}</label>
                  <Select value={form.time} onValueChange={(value) => setForm({ ...form, time: value })}>
                    <SelectTrigger className="bg-noir-800 border-noir-700">
                      <SelectValue placeholder={language === 'vi' ? 'Chọn giờ' : 'Select time'} />
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
                  <label className="block text-sm font-medium mb-3">{language === 'vi' ? 'Số khách' : 'Guests'}</label>
                  <Select value={form.guests > 0 ? form.guests.toString() : ""} onValueChange={(value) => setForm({ ...form, guests: parseInt(value) })}>
                    <SelectTrigger className="bg-noir-800 border-noir-700">
                      <SelectValue placeholder={language === 'vi' ? 'Chọn số khách' : 'Select guests'} />
                    </SelectTrigger>
                    <SelectContent className="max-h-[200px] overflow-y-auto">
                      {Array.from({ length: 50 }, (_, i) => i + 1).map((num) => (
                        <SelectItem key={num} value={num.toString()}>
                          {num} {language === 'vi' ? 'khách' : (num > 1 ? 'guests' : 'guest')}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium mb-3">{t('booking.name')}</label>
                  <Input
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="bg-noir-800 border-noir-700 focus:border-primary"
                    placeholder={language === 'vi' ? 'Nhập họ tên' : 'Enter your name'}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-3">{language === 'vi' ? 'Email (Tùy chọn)' : 'Email (Optional)'}</label>
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
                <label className="block text-sm font-medium mb-3">{t('booking.phone')}</label>
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
                <label className="block text-sm font-medium mb-3">{language === 'vi' ? 'Ghi chú (Tùy chọn)' : 'Notes (Optional)'}</label>
                <Textarea
                  value={form.specialRequests}
                  onChange={(e) => setForm({ ...form, specialRequests: e.target.value })}
                  placeholder={language === 'vi' 
                    ? 'Trang trí dịp đặc biệt (sinh nhật, kỷ niệm...), sở thích về chỗ ngồi (yên tĩnh, gần cửa sổ...) hoặc yêu cầu khác'
                    : 'Special occasion decorations (birthday, anniversary...), seating preferences (quiet, near window...) or other requests'
                  }
                  className="bg-noir-800 border-noir-700 focus:border-primary resize-none"
                  rows={4}
                />
              </div>

              <div className="text-center space-y-4">
                <Button
                  type="submit"
                  disabled={createReservation.isPending}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground px-12 py-4 text-lg font-semibold"
                >
                  {createReservation.isPending ? t('booking.confirming') : t('booking.confirm')}
                </Button>
                
                {/* Confirmation Note */}
                <p className="text-xs text-gray-400">
                  {language === 'vi' 
                    ? 'Sau khi Quý khách hoàn tất đặt bàn, nhân viên của nhà hàng sẽ liên hệ để xác nhận thông tin.'
                    : 'After completing your reservation, our staff will contact you to confirm the details.'
                  }
                </p>
              </div>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}
