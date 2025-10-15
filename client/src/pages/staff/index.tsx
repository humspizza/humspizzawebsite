import { useState, useEffect } from 'react';
import StaffDashboard from './dashboard';

export default function StaffApp() {
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user is already logged in via unified login
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      try {
        const userData = JSON.parse(savedUser);
        // Only set user if they are staff role
        if (userData.role === 'staff') {
          setUser(userData);
        }
      } catch (error) {
        localStorage.removeItem('user');
      }
    }
    setIsLoading(false);
  }, []);

  // No longer needed - unified login handles this

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('user');
    localStorage.removeItem('loginTime');
    localStorage.removeItem('lastActivity');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  // If no user found, redirect to unified login
  if (!user) {
    window.location.href = '/login';
    return null;
  }

  return <StaffDashboard user={user} onLogout={handleLogout} />;
}