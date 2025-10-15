import { useEffect, useCallback } from 'react';
import { useLocation } from 'wouter';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';

interface UseSessionTimeoutOptions {
  timeoutDuration?: number; // in milliseconds, default 30 minutes
  warningDuration?: number; // warn user X minutes before timeout, default 5 minutes
  onTimeout?: () => void;
  enabled?: boolean;
}

export function useSessionTimeout({
  timeoutDuration = 30 * 60 * 1000, // 30 minutes
  warningDuration = 5 * 60 * 1000,  // 5 minutes warning
  onTimeout,
  enabled = true
}: UseSessionTimeoutOptions = {}) {
  
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { language } = useLanguage();

  const logout = useCallback(() => {
    // Check if user was actually logged in before showing timeout message
    const wasLoggedIn = localStorage.getItem('user') || localStorage.getItem('loginTime');
    
    // Clear user data
    localStorage.removeItem('user');
    localStorage.removeItem('loginTime');
    localStorage.removeItem('lastActivity');
    
    // Only show timeout message if user was previously logged in
    if (wasLoggedIn) {
      toast({
        title: language === 'vi' ? 'Phiên đăng nhập hết hạn' : 'Session Expired',
        description: language === 'vi' 
          ? 'Bạn đã bị đăng xuất do không hoạt động trong thời gian dài'
          : 'You have been logged out due to inactivity',
        variant: 'destructive',
      });
    }

    // Call custom timeout handler if provided
    if (onTimeout) {
      onTimeout();
    }

    // Redirect to login only if not already there
    if (window.location.pathname !== '/login') {
      setLocation('/login');
    }
  }, [onTimeout, setLocation, toast, language]);

  const showWarning = useCallback(() => {
    toast({
      title: language === 'vi' ? 'Cảnh báo phiên đăng nhập' : 'Session Warning',
      description: language === 'vi' 
        ? 'Phiên đăng nhập sẽ hết hạn trong 5 phút. Vui lòng thực hiện thao tác để duy trì phiên.'
        : 'Your session will expire in 5 minutes. Please perform an action to maintain your session.',
      variant: 'default',
    });
  }, [toast, language]);

  const updateLastActivity = useCallback(() => {
    if (enabled) {
      localStorage.setItem('lastActivity', new Date().getTime().toString());
    }
  }, [enabled]);

  const checkSession = useCallback(() => {
    if (!enabled) return true;

    const loginTime = localStorage.getItem('loginTime');
    const lastActivity = localStorage.getItem('lastActivity') || loginTime;
    
    if (!loginTime || !lastActivity) {
      return false;
    }

    const now = new Date().getTime();
    const timeSinceActivity = now - parseInt(lastActivity);
    const timeSinceLogin = now - parseInt(loginTime);

    // Check if session has expired
    if (timeSinceActivity > timeoutDuration || timeSinceLogin > timeoutDuration * 2) {
      logout();
      return false;
    }

    // Check if we should show warning
    if (timeSinceActivity > timeoutDuration - warningDuration) {
      showWarning();
    }

    return true;
  }, [enabled, timeoutDuration, warningDuration, logout, showWarning]);

  // Set up activity tracking
  useEffect(() => {
    if (!enabled) return;

    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    
    const handleActivity = () => {
      updateLastActivity();
    };

    // Add event listeners
    events.forEach(event => {
      document.addEventListener(event, handleActivity, true);
    });

    // Initial activity update
    updateLastActivity();

    // Set up periodic session check
    const sessionCheckInterval = setInterval(checkSession, 60000); // Check every minute

    // Cleanup
    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleActivity, true);
      });
      clearInterval(sessionCheckInterval);
    };
  }, [enabled, updateLastActivity, checkSession]);

  return {
    logout,
    updateLastActivity,
    checkSession,
  };
}