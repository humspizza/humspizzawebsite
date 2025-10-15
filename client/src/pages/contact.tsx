import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { MapPin, Phone, Mail, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { apiRequest } from "@/lib/queryClient";
import type { ContactForm } from "@/lib/types";
import SEOHead from "@/components/SEOHead";
import { usePageSeo } from "@/hooks/usePageSeo";

export default function Contact() {
  const [form, setForm] = useState<ContactForm>({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
  });

  const { toast } = useToast();
  const { t, language } = useLanguage();

  const seo = usePageSeo("contact", {
    metaTitle: language === 'vi' 
      ? "Liên Hệ - Hum's Pizza | Thông Tin Liên Lạc & Đặt Bàn"
      : "Contact Us - Hum's Pizza | Contact Information & Reservations",
    metaDescription: language === 'vi'
      ? "Liên hệ với Hum's Pizza để đặt bàn, đặt hàng hoặc gửi phản hồi. Địa chỉ: Bình Dương. Điện thoại: 0123 456 789. Chúng tôi luôn sẵn sàng phục vụ bạn."
      : "Contact Hum's Pizza for reservations, orders or feedback. Address: Binh Duong. Phone: 0123 456 789. We're always ready to serve you.",
    keywords: language === 'vi'
      ? "liên hệ, đặt bàn, địa chỉ nhà hàng, số điện thoại, Bình Dương, phản hồi"
      : "contact, reservations, restaurant address, phone number, Binh Duong, feedback",
    canonicalUrl: "https://humspizza.com/contact",
    ogTitle: language === 'vi' 
      ? "Hum's Pizza | Liên Hệ"
      : "Hum's Pizza | Contact",
    ogUrl: "https://humspizza.com/contact",
    ogType: "website",
  });

  const sendMessage = useMutation({
    mutationFn: async (data: ContactForm) => {
      const response = await apiRequest("POST", "/api/contact", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: t('contact.messageSent'),
        description: t('contact.messageSuccess'),
      });
      setForm({
        name: "",
        email: "",
        phone: "",
        subject: "",
        message: "",
      });
    },
    onError: (error: any) => {
      toast({
        title: t('contact.messageFailed'),
        description: error.message || t('common.error'),
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Simple validation for required fields
    if (!form.name || !form.email || !form.phone || !form.subject || !form.message) {
      toast({
        title: t('common.error'),
        description: "Vui lòng điền đầy đủ thông tin",
        variant: "destructive",
      });
      return;
    }
    
    sendMessage.mutate(form);
  };

  return (
    <div className="min-h-screen bg-black py-20">
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
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold mb-6">{t('contact.title').toUpperCase()}</h1>
          <p className="text-xl text-gray-300">
            {t('contact.subtitle')}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
          {/* Contact Information */}
          <div className="space-y-8">
            <div>
              <h3 className="text-2xl font-bold mb-6">{t('contact.visitUs')}</h3>
              
              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <MapPin className="text-primary text-xl mt-1" />
                  <div>
                    <div className="font-semibold text-lg">{t('contact.address')}</div>
                    <div className="text-gray-400">
                      108 Ngô Gia Tự, Phường Chánh Nghĩa<br />
                      Thủ Dầu Một, Bình Dương<br />
                      Vietnam
                    </div>
                  </div>
                </div>
                
                <div className="flex items-start space-x-4">
                  <Phone className="text-primary text-xl mt-1" />
                  <div>
                    <div className="font-semibold text-lg">{t('contact.phone')}</div>
                    <div className="text-gray-400">0934 699 798</div>
                  </div>
                </div>
                
                <div className="flex items-start space-x-4">
                  <Mail className="text-primary text-xl mt-1" />
                  <div>
                    <div className="font-semibold text-lg">{t('contact.email')}</div>
                    <div className="text-gray-400">support@humspizza.com</div>
                  </div>
                </div>
                
                <div className="flex items-start space-x-4">
                  <Clock className="text-primary text-xl mt-1" />
                  <div>
                    <div className="font-semibold text-lg">{t('contact.hours')}</div>
                    <div className="text-gray-400">
                      Thứ 2 - Thứ 7: 11:00 - 22:00<br />
                      Chủ Nhật: 11:00 - 22:00
                    </div>
                  </div>
                </div>
              </div>
            </div>


          </div>

          {/* Contact Form */}
          <div className="bg-noir-900 rounded-lg p-8">
            <h3 className="text-2xl font-bold mb-6">{t('contact.sendMessage')}</h3>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">{t('contact.yourName')}</label>
                  <Input
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="bg-noir-800 border-noir-700 focus:border-primary"
                    placeholder={language === 'vi' ? 'Nhập họ tên của bạn' : 'Enter your full name'}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">{t('contact.yourEmail')}</label>
                  <Input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="bg-noir-800 border-noir-700 focus:border-primary"
                    placeholder={language === 'vi' ? 'Nhập địa chỉ email của bạn' : 'Enter your email address'}
                    required
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">{t('contact.yourPhone')}</label>
                <Input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="bg-noir-800 border-noir-700 focus:border-primary"
                  placeholder={language === 'vi' ? 'Nhập số điện thoại của bạn' : 'Enter your phone number'}
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">{t('contact.subject')}</label>
                <Input
                  value={form.subject}
                  onChange={(e) => setForm({ ...form, subject: e.target.value })}
                  className="bg-noir-800 border-noir-700 focus:border-primary"
                  placeholder={language === 'vi' ? 'Nhập chủ đề tin nhắn' : 'Enter message subject'}
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">{t('contact.message')}</label>
                <Textarea
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  className="bg-noir-800 border-noir-700 focus:border-primary resize-none"
                  placeholder={language === 'vi' ? 'Nhập tin nhắn của bạn. Chia sẻ thông tin chi tiết về yêu cầu, góp ý hoặc câu hỏi...' : 'Enter your message. Share details about your request, feedback, or questions...'}
                  rows={6}
                  required
                />
              </div>
              
              <Button
                type="submit"
                disabled={sendMessage.isPending}
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground text-lg py-3"
              >
                {sendMessage.isPending ? t('contact.sending') : t('contact.sendBtn')}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
