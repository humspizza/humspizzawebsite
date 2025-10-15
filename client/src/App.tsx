import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Login from "@/pages/login";
import AdminAuthGuard from "@/components/auth/AdminAuthGuard";
import StaffAuthGuard from "@/components/auth/StaffAuthGuard";
import GlobalLogoutHandler from "@/components/auth/GlobalLogoutHandler";
import PrivacyPolicy from "@/pages/privacy-policy";
import TermsOfService from "@/pages/terms-of-service";
import Accessibility from "@/pages/accessibility";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import BookingModal from "@/components/modals/booking-modal";
import CartModal from "@/components/modals/cart-modal";
import { CartProvider } from "@/hooks/use-cart";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { useState, lazy, Suspense } from "react";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

// Lazy load main pages for better performance
const Home = lazy(() => import("@/pages/home"));
const Menu = lazy(() => import("@/pages/menu"));
const About = lazy(() => import("@/pages/about"));
const Contact = lazy(() => import("@/pages/contact"));
const Booking = lazy(() => import("@/pages/booking"));
const Blog = lazy(() => import("@/pages/blog"));
const BlogPost = lazy(() => import("@/pages/blog-post"));

// Lazy load admin pages
const PagesManagement = lazy(() => import("@/pages/admin/pages-management"));
const AdminDashboard = lazy(() => import("@/pages/admin/dashboard"));
const CustomizationManagement = lazy(() => import("@/pages/admin/customization-management"));

// Lazy load staff pages
const StaffApp = lazy(() => import("@/pages/staff"));

function App() {
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [isCartModalOpen, setIsCartModalOpen] = useState(false);
  const [location] = useLocation();

  // Check if current route is admin or staff page
  const isAdminPage = location.startsWith('/admin');
  const isStaffPage = location.startsWith('/staff');

  function Router() {
    return (
      <Suspense fallback={<LoadingSpinner />}>
        <Switch>
          <Route path="/">
            <Home 
              onOpenBooking={() => setIsBookingModalOpen(true)}
            />
          </Route>
          <Route path="/menu" component={Menu} />
          <Route path="/about" component={About} />
          <Route path="/contact" component={Contact} />
          <Route path="/booking" component={Booking} />
          <Route path="/news" component={Blog} />
          <Route path="/news/:slug" component={BlogPost} />
          {/* Unified login for both admin and staff */}
          <Route path="/login" component={Login} />
          
          {/* Legacy admin login route - redirects to unified login */}
          <Route path="/admin/login" component={Login} />
          
          <Route path="/admin/dashboard">
            <AdminAuthGuard>
              <AdminDashboard />
            </AdminAuthGuard>
          </Route>
          
          <Route path="/admin/customization">
            <AdminAuthGuard>
              <CustomizationManagement />
            </AdminAuthGuard>
          </Route>
          
          <Route path="/admin/pages">
            <AdminAuthGuard>
              <PagesManagement />
            </AdminAuthGuard>
          </Route>
          
          <Route path="/staff/dashboard">
            <StaffAuthGuard>
              <StaffApp />
            </StaffAuthGuard>
          </Route>
          
          <Route path="/staff/*">
            <StaffAuthGuard>
              <StaffApp />
            </StaffAuthGuard>
          </Route>
          <Route path="/privacy-policy" component={PrivacyPolicy} />
          <Route path="/terms-of-service" component={TermsOfService} />
          <Route path="/accessibility" component={Accessibility} />
          <Route component={NotFound} />
        </Switch>
      </Suspense>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        <CartProvider>
          <TooltipProvider>
            <GlobalLogoutHandler />
            <div className="min-h-screen bg-black text-white">
              <Header 
                onOpenCart={() => setIsCartModalOpen(true)}
              />
              <main>
                <Router />
              </main>
              <Footer />
              
              {/* Only show booking and cart modals for public pages */}
              {!isAdminPage && !isStaffPage && (
                <>
                  <BookingModal 
                    open={isBookingModalOpen}
                    onOpenChange={setIsBookingModalOpen}
                  />
                  
                  <CartModal 
                    open={isCartModalOpen}
                    onOpenChange={setIsCartModalOpen}
                  />
                </>
              )}
            </div>
            <Toaster />
          </TooltipProvider>
        </CartProvider>
      </LanguageProvider>
    </QueryClientProvider>
  );
}

export default App;
