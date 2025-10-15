import { useEffect } from 'react';
import { useLocation } from 'wouter';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import { setGlobalLogoutHandler } from '@/lib/queryClient';

export default function GlobalLogoutHandler() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { language } = useLanguage();

  useEffect(() => {
    const handleGlobalLogout = () => {
      // Check if user was actually logged in before showing expiry notification
      const wasLoggedIn = localStorage.getItem('user') || localStorage.getItem('loginTime');
      
      // Clear all authentication data
      localStorage.removeItem('user');
      localStorage.removeItem('loginTime');
      localStorage.removeItem('lastActivity');
      
      // Only show session expired notification and redirect if user was previously logged in
      if (wasLoggedIn) {
        toast({
          title: language === 'vi' ? 'Phiên đăng nhập hết hạn' : 'Session Expired',
          description: language === 'vi' 
            ? 'Phiên đăng nhập của bạn đã hết hạn. Vui lòng đăng nhập lại để tiếp tục.'
            : 'Your session has expired. Please log in again to continue.',
          variant: 'destructive',
          duration: 5000,
        });

        // Redirect to login page only if not already there and user was logged in
        if (window.location.pathname !== '/login') {
          setTimeout(() => {
            setLocation('/login');
          }, 1000); // Delay to show toast
        }
      }
    };

    // Register the global logout handler
    setGlobalLogoutHandler(handleGlobalLogout);

    // Cleanup function
    return () => {
      setGlobalLogoutHandler(() => {});
    };
  }, [setLocation, toast, language]);

  // This component doesn't render anything
  return null;
}