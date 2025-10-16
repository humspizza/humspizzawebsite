import { ChevronDown, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { useEffect, useRef, useState } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import type { HomeContent } from "@shared/schema";

interface HeroSectionProps {
  onOpenBooking?: () => void;
}

function HeroSection({ onOpenBooking }: HeroSectionProps) {
  const { t, language } = useLanguage();
  
  // Fetch home content
  const { data: homeContent } = useQuery<HomeContent>({
    queryKey: ["/api/home-content"],
  });
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [videoError, setVideoError] = useState(false);

  const videoUrl = homeContent?.heroVideoUrl || "/hero.landingpage.mp4";

  useEffect(() => {
    const video = videoRef.current;
    if (video) {
      // Reset loaded state when URL changes
      setVideoLoaded(false);
      setVideoError(false);
      
      // Set video properties for immediate playback
      video.muted = true;
      video.playsInline = true;
      video.defaultMuted = true;
      
      // Force reload video source
      video.load();
      
      const playVideo = async () => {
        try {
          video.muted = true;
          const playPromise = video.play();
          if (playPromise !== undefined) {
            await playPromise;
          }
        } catch (error) {
          // Fallback: video will play on user interaction
        }
      };

      const handleCanPlay = () => {
        setVideoLoaded(true);
        playVideo();
      };

      video.addEventListener('canplay', handleCanPlay, { once: true });
      
      return () => {
        video.removeEventListener('canplay', handleCanPlay);
      };
    }
  }, [videoUrl]);
  
  return (
    <section className="hero relative h-screen overflow-hidden bg-black">
      {/* Fallback background while video loads */}
      <div className={`absolute inset-0 bg-gradient-to-br from-gray-900 via-yellow-900/10 to-black z-0 transition-opacity duration-1000 ${videoLoaded && !videoError ? 'opacity-70' : 'opacity-100'}`}></div>
      
      {/* Fast loading with image placeholder */}
      {!videoLoaded && !videoError && (
        <div className="absolute inset-0 z-15 bg-gradient-to-br from-gray-900 via-yellow-900/20 to-black"></div>
      )}
      
      {/* Hero Video Background - Optimized */}
      <video 
        ref={videoRef}
        className="absolute inset-0 w-full h-full object-cover z-10 pointer-events-none"
        autoPlay 
        muted 
        loop 
        playsInline
        preload="metadata"
        controls={false}
        disablePictureInPicture
        disableRemotePlayback
        controlsList="nodownload nofullscreen noremoteplayback"
        webkit-playsinline="true"
        x-webkit-airplay="deny"
        poster="/og.bg.png"
        style={{ 
          objectFit: 'cover',
          WebkitTouchCallout: 'none',
          WebkitUserSelect: 'none',
          userSelect: 'none'
        }}
        crossOrigin="anonymous"
        onContextMenu={(e) => e.preventDefault()}
        onCanPlay={() => {
          setVideoLoaded(true);
        }}
        onError={() => {
          setVideoError(true);
        }}
        onEnded={(e) => {
          const video = e.target as HTMLVideoElement;
          video.currentTime = 0;
          video.play().catch(() => {});
        }}
      >
        <source 
          src={videoUrl} 
          type="video/mp4" 
        />
        Your browser does not support the video tag.
      </video>
      {/* Video Overlay */}
      <div className="absolute inset-0 bg-black/30 z-20"></div>
      
      <div className="relative z-40 h-full flex items-center justify-center pointer-events-none" style={{ transform: 'translateY(-40px)' }}>
        <div className="text-center max-w-3xl mx-auto px-4">
          <p className="text-xl lg:text-2xl text-gray-200 mb-12 max-w-2xl mx-auto leading-relaxed animate-slide-up">
            {homeContent 
              ? (language === 'vi' ? homeContent.heroTitleVi : homeContent.heroTitle)
              : t('hero.subtitle')
            }
          </p>
          
          <div className="flex flex-col sm:flex-row justify-center items-center gap-3 animate-scale-in max-w-md mx-auto sm:max-w-none pointer-events-auto">
            <Button 
              size="default"
              className="bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-3 text-base font-semibold hover-scale w-fit max-w-[200px] pointer-events-auto"
              onClick={onOpenBooking}
            >
              {t('hero.bookTable')}
            </Button>
            <Link href="/menu">
              <Button 
                size="default"
                variant="outline"
                className="border-2 border-white text-white hover:bg-white hover:text-black px-6 py-3 text-base font-semibold hover-scale w-fit max-w-[200px] pointer-events-auto"
              >
                {t('hero.orderMenu')}
              </Button>
            </Link>
          </div>
        </div>
      </div>
      
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
        <ChevronDown className="w-6 h-6 text-white opacity-70" />
      </div>
    </section>
  );
}

export default HeroSection;
