import { Link } from "wouter";
import { SiFacebook, SiInstagram, SiLinkedin, SiTiktok } from "react-icons/si";
import { useLanguage } from "@/contexts/LanguageContext";

export default function Footer() {
  const { t } = useLanguage();
  
  return (
    <footer className="bg-black border-t border-zinc-800 pt-12 pb-0">
      <div className="container mx-auto px-8">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-4">
            
            {/* Restaurant Info */}
            <div className="lg:col-span-6">
              <div className="mb-4">
                <img 
                  src="/api/assets/logo.humpizza.png" 
                  alt="Hum's Pizza Logo" 
                  className="h-12 w-auto mb-4"
                  onError={(e) => {
                    // Fallback if logo not found
                    const target = e.target as HTMLImageElement;
                    target.src = "/api/assets/favicon.png";
                  }}
                />
              </div>
              <div className="text-zinc-400 text-sm mb-6 leading-relaxed space-y-1">
                <div>{t('footer.address')}: {t('footer.addressLine1')}</div>
                <div>{t('footer.addressLine2')}</div>
                <div>{t('footer.hotline')}: 0934 699 798</div>
                <div>{t('footer.email')}: support@humspizza.com</div>
              </div>
            </div>

            <div className="lg:col-span-6 lg:flex lg:justify-end lg:space-x-12">
              {/* Legal Links */}
              <div className="lg:w-auto mb-6 lg:mb-0">
                <h4 className="text-sm font-bold mb-3 text-white">{t('legal.legalText')}</h4>
                <ul className="space-y-1">
                  <li><Link href="/privacy-policy" className="text-zinc-400 hover:text-white transition-colors text-sm" data-testid="footer-link-privacy">{t('legal.privacyPolicy')}</Link></li>
                  <li><Link href="/terms-of-service" className="text-zinc-400 hover:text-white transition-colors text-sm" data-testid="footer-link-terms">{t('legal.termsOfService')}</Link></li>
                  <li><Link href="/accessibility" className="text-zinc-400 hover:text-white transition-colors text-sm" data-testid="footer-link-accessibility">{t('legal.accessibility')}</Link></li>
                </ul>
              </div>

              {/* Contact Us */}
              <div className="lg:w-auto">
                <h4 className="text-sm font-bold mb-3 text-white">{t('footer.contactUs')}</h4>
                <div className="flex space-x-2">
                  <a 
                    href="https://www.facebook.com/HumsPizza" 
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-8 h-8 bg-zinc-800 rounded-md flex items-center justify-center text-white hover:bg-zinc-700 transition-colors" 
                    aria-label="Facebook" 
                    data-testid="link-facebook"
                  >
                    <SiFacebook className="w-4 h-4" />
                  </a>
                  <a 
                    href="https://www.instagram.com/humspizza" 
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-8 h-8 bg-zinc-800 rounded-md flex items-center justify-center text-white hover:bg-zinc-700 transition-colors" 
                    aria-label="Instagram" 
                    data-testid="link-instagram"
                  >
                    <SiInstagram className="w-4 h-4" />
                  </a>
                  <a 
                    href="http://linkedin.com/company/hum-s-pizza" 
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-8 h-8 bg-zinc-800 rounded-md flex items-center justify-center text-white hover:bg-zinc-700 transition-colors" 
                    aria-label="LinkedIn" 
                    data-testid="link-linkedin"
                  >
                    <SiLinkedin className="w-4 h-4" />
                  </a>
                  <a 
                    href="https://www.tiktok.com/@humspizza" 
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-8 h-8 bg-zinc-800 rounded-md flex items-center justify-center text-white hover:bg-zinc-700 transition-colors" 
                    aria-label="TikTok" 
                    data-testid="link-tiktok"
                  >
                    <SiTiktok className="w-4 h-4" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-zinc-800 mt-12 pt-3 pb-3">
          <div className="text-center text-zinc-500 text-sm">
            © 2025 Hum's Pizza.
          </div>
        </div>
      </div>
    </footer>
  );
}