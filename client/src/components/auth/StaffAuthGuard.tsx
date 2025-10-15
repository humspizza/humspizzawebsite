import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";

interface StaffAuthGuardProps {
  children: React.ReactNode;
}

export default function StaffAuthGuard({ children }: StaffAuthGuardProps) {
  const [, setLocation] = useLocation();
  const [isChecking, setIsChecking] = useState(true);

  const { data: user, error } = useQuery({
    queryKey: ["/api/staff/me"],
    retry: false,
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    // If there's an authentication error (401), redirect to unified login
    if (error && (error as any).status === 401) {
      // Clear any stored user data
      localStorage.removeItem("user");
      localStorage.removeItem("loginTime");
      localStorage.removeItem("lastActivity");
      // Redirect to unified login
      setLocation("/login");
      return;
    }

    // If we got a response (either user data or error), we're done checking
    if (user !== undefined || error) {
      setIsChecking(false);
    }
  }, [user, error, setLocation]);

  // Show loading while checking authentication
  if (isChecking) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-600 mx-auto mb-4"></div>
          <p className="text-zinc-400">Đang kiểm tra đăng nhập...</p>
        </div>
      </div>
    );
  }

  // If user is authenticated, show the protected content
  if (user) {
    return <>{children}</>;
  }

  // If not authenticated, the redirect will happen in useEffect
  return null;
}