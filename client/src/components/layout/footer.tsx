import { Link } from "wouter";
import { SiFacebook, SiInstagram, SiLinkedin, SiTiktok } from "react-icons/si";
import { useLanguage } from "@/contexts/LanguageContext";
import upseinLogo from "@assets/UpSEIN_Logo_1774251943589.png";

export default function Footer() {
  const { t, currentLanguage } = useLanguage();
  
  return (
    <footer className="bg-black border-t border-zinc-800 pt-6 pb-0">
      <div className="px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* Contact Info */}
            <div>
              <h4 className="text-sm font-bold mb-3 text-white">
                {t('footer.contactInfo') || 'Thông Tin Liên Hệ'}
              </h4>
              <div className="text-zinc-400 text-sm leading-relaxed space-y-1">
                <div>{t('footer.address')}: {t('footer.addressLine1')}</div>
                <div>{t('footer.addressLine2')}</div>
                <div>{t('footer.hotline')}: 0934 699 798</div>
                <div>{t('footer.email')}: support@humspizza.com</div>
              </div>
            </div>

            {/* Social Media */}
            <div className="lg:flex lg:justify-end lg:items-start">
              <div>
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

      {/* Bottom Bar - full width */}
      <div className="border-t border-zinc-800 mt-6 pt-3 pb-3 px-8">
        <div className="flex items-center justify-between gap-2">
          <span className="text-zinc-500 text-xs min-w-0 truncate">Copyright © 2025 Hum's Pizza. All rights reserved.</span>
          <a
            href="https://upsein.com"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 group shrink-0"
          >
            <span className="text-zinc-600 text-xs group-hover:text-zinc-400 transition-colors">Developed By</span>
            <img
              src={upseinLogo}
              alt="UpSEIN"
              className="h-6 w-auto grayscale opacity-40 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-300"
            />
          </a>
        </div>
      </div>
    </footer>
  );
}