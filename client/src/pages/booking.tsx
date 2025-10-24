import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useLanguage } from "@/contexts/LanguageContext";
import type { ReservationForm } from "@/lib/types";
import { MapPin, Clock, Users } from "lucide-react";
import SEOHead from "@/components/SEOHead";
import { usePageSeo } from "@/hooks/usePageSeo";

export default function BookingPage() {
  const { t, language } = useLanguage();

  const seo = usePageSeo("booking", {
    metaTitle: language === 'vi' 
      ? "Đặt Bàn - Hum's Pizza | Đặt Bàn Online Nhanh Chóng"
      : "Table Booking - Hum's Pizza | Quick Online Reservations",
    metaDescription: language === 'vi'
      ? "Đặt bàn online tại Hum's Pizza. Chọn ngày giờ và số lượng khách phù hợp. Quy trình đặt bàn nhanh chóng, tiện lợi. Đảm bảo chỗ ngồi cho bạn!"
      : "Book a table online at Hum's Pizza. Choose your preferred date, time and guest count. Quick and convenient reservation process. Secure your spot today!",
    keywords: language === 'vi'
      ? "đặt bàn online, đặt bàn nhà hàng, đặt chỗ, đặt bàn pizza, reservations"
      : "online booking, restaurant reservations, table booking, pizza reservations, reserve table",
    canonicalUrl: "https://humspizza.com/booking",
    ogTitle: language === 'vi' 
      ? "Hum's Pizza | Đặt Bàn"
      : "Hum's Pizza | Booking",
    ogUrl: "https://humspizza.com/booking",
    ogType: "website",
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
  const queryClient = useQueryClient();

  const createReservation = useMutation({
    mutationFn: async (data: ReservationForm) => {
      const response = await apiRequest("POST", "/api/reservations", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: language === 'vi' ? "Đặt bàn thành công!" : "Reservation successful!",
        description: language === 'vi' 
          ? "Chúng tôi sẽ xác nhận và liên hệ khách trong thời gian sớm nhất." 
          : "We'll confirm and contact you as soon as possible.",
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
        title: language === 'vi' ? "Đặt bàn thất bại" : "Reservation Failed",
        description: error.message || (language === 'vi' ? "Vui lòng thử lại sau." : "Please try again later."),
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
    <div className="min-h-screen bg-black pt-20">
      <SEOHead
        title={seo.metaTitle}
        description={seo.metaDescription}
        keywords={seo.keywords}
        canonicalUrl={seo.canonicalUrl}
        ogTitle={seo.ogTitle}
        ogDescription={seo.ogDescription}
        ogUrl={seo.ogUrl}
        ogType={seo.ogType}
        ogImage={seo.ogImage}
      />
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-6xl font-bold mb-4">
            {language === 'vi' ? 'ĐẶT BÀN TRẢI NGHIỆM' : 'BOOK YOUR EXPERIENCE'}
          </h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            {language === 'vi' 
              ? 'Đặt bàn và để chúng tôi tạo nên trải nghiệm pizza khó quên dành cho bạn'
              : 'Reserve your table and let us create an unforgettable pizza experience for you'
            }
          </p>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-7xl mx-auto">
          {/* Booking Form */}
          <div className="bg-zinc-900 rounded-2xl p-8 shadow-2xl">
            <div className="mb-8">
              <h2 className="text-2xl font-bold mb-2">
                {language === 'vi' ? 'Đặt Bàn Ngay' : 'Book Now'}
              </h2>
              <p className="text-gray-400">
                {language === 'vi' 
                  ? 'Giữ chỗ trước để có trải nghiệm trọn vẹn tại Hum\'s Pizza.'
                  : 'Reserve ahead for the complete Hum\'s Pizza experience.'
                }
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Name and Phone */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    {language === 'vi' ? 'Họ và tên' : 'Full Name'}
                  </label>
                  <Input
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="bg-zinc-800 border-zinc-700 focus:border-yellow-400 text-white"
                    placeholder={language === 'vi' ? 'Nhập họ tên' : 'Enter your name'}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    {language === 'vi' ? 'Số điện thoại' : 'Phone Number'}
                  </label>
                  <Input
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    className="bg-zinc-800 border-zinc-700 focus:border-yellow-400 text-white"
                    placeholder={language === 'vi' ? 'Nhập số điện thoại' : 'Enter phone number'}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    {language === 'vi' ? 'Email (Tùy chọn)' : 'Email (Optional)'}
                  </label>
                  <Input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="bg-zinc-800 border-zinc-700 focus:border-yellow-400 text-white"
                    placeholder={language === 'vi' ? 'email@example.com' : 'email@example.com'}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    {language === 'vi' ? 'Số khách' : 'Number of Guests'}
                  </label>
                  <Select value={form.guests > 0 ? form.guests.toString() : ""} onValueChange={(value) => setForm({ ...form, guests: parseInt(value) })}>
                    <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white">
                      <SelectValue placeholder={language === 'vi' ? 'Chọn số khách' : 'Select guests'} />
                    </SelectTrigger>
                    <SelectContent className="max-h-[200px] overflow-y-auto">
                      {Array.from({ length: 50 }, (_, i) => i + 1).map((num) => (
                        <SelectItem key={num} value={num.toString()}>
                          {num} {language === 'vi' ? (num > 1 ? 'người' : 'người') : (num > 1 ? 'guests' : 'guest')}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Date and Time */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    {language === 'vi' ? 'Ngày' : 'Date'}
                  </label>
                  <Input
                    type="date"
                    value={form.date}
                    onChange={(e) => setForm({ ...form, date: e.target.value })}
                    className="bg-zinc-800 border-zinc-700 focus:border-yellow-400 text-white"
                    min={new Date().toISOString().split('T')[0]}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    {language === 'vi' ? 'Giờ' : 'Time'}
                  </label>
                  <Select value={form.time} onValueChange={(value) => setForm({ ...form, time: value })}>
                    <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white">
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
              </div>

              {/* Special Requests */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  {language === 'vi' ? 'Ghi chú (Tùy chọn)' : 'Notes (Optional)'}
                </label>
                <Textarea
                  value={form.specialRequests}
                  onChange={(e) => setForm({ ...form, specialRequests: e.target.value })}
                  placeholder={language === 'vi' 
                    ? 'Trang trí dịp đặc biệt (sinh nhật, kỷ niệm...), sở thích về chỗ ngồi (yên tĩnh, gần cửa sổ...) hoặc yêu cầu khác'
                    : 'Special occasion decorations (birthday, anniversary...), seating preferences (quiet, near window...) or other requests'
                  }
                  className="bg-zinc-800 border-zinc-700 focus:border-yellow-400 text-white resize-none"
                  rows={3}
                />
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={createReservation.isPending}
                className="w-full bg-yellow-400 hover:bg-yellow-500 text-black font-bold py-4 text-lg"
              >
                {createReservation.isPending 
                  ? (language === 'vi' ? 'Đang xử lý...' : 'Processing...') 
                  : (language === 'vi' ? 'Xác nhận đặt bàn' : 'Confirm Booking')
                }
              </Button>

              {/* Confirmation Note */}
              <p className="text-xs text-gray-400 text-center mt-2">
                {language === 'vi' 
                  ? 'Sau khi Quý khách hoàn tất đặt bàn, nhân viên của nhà hàng sẽ liên hệ để xác nhận thông tin.'
                  : 'After completing your reservation, our staff will contact you to confirm the details.'
                }
              </p>
            </form>
          </div>

          {/* Google Maps */}
          <div className="bg-zinc-900 rounded-2xl p-8 shadow-2xl flex flex-col">
            <div className="mb-6">
              <h3 className="text-2xl font-bold mb-4">
                {language === 'vi' ? 'Vị Trí Nhà Hàng' : 'Restaurant Location'}
              </h3>
              <div className="space-y-2 text-gray-300">
                <p className="flex items-start gap-2">
                  <MapPin size={16} className="text-yellow-400 mt-1 flex-shrink-0" />
                  <span>108 Ngô Gia Tự, Phường Chánh Nghĩa, Thủ Dầu Một, Bình Dương</span>
                </p>
                <p className="flex items-center gap-2">
                  <Clock size={16} className="text-yellow-400" />
                  <span>{language === 'vi' ? 'Mở cửa: 11:00 - 22:00 hàng ngày' : 'Open: 11:00 - 22:00 daily'}</span>
                </p>
              </div>
            </div>
            
            {/* Google Maps Embed */}
            <div className="flex-1 w-full rounded-lg overflow-hidden shadow-lg min-h-96">
              <iframe
                src="https://www.google.com/maps?q=Hum's+Pizza,+108+Ngô+Gia+Tự,+Thủ+Dầu+Một,+Bình+Dương&output=embed"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title={language === 'vi' ? 'Bản đồ Hum\'s Pizza' : 'Hum\'s Pizza Map'}
              ></iframe>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}