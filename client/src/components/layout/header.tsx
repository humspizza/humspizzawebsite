import { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Menu, ShoppingCart, LogIn, LogOut, User } from 'lucide-react';
import { useCart } from '@/hooks/use-cart';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { useLanguage } from '@/contexts/LanguageContext';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface HeaderProps {
  onOpenCart: () => void;
}

export default function Header({ onOpenCart }: HeaderProps) {
  const [location] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { items } = useCart();
  const { t, language } = useLanguage();
  const { toast } = useToast();

  const cartItemsCount = items.reduce((sum, item) => sum + item.quantity, 0);

  // Check if user is logged in (admin or staff)
  const { data: adminUser } = useQuery<{
    id: string;
    username: string;
    role: 'admin' | 'staff';
    fullName?: string;
    permissions?: string[];
    email?: string;
  }>({
    queryKey: ['/api/admin/me'],
    retry: false,
  });

  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: () => apiRequest('POST', '/api/admin/logout'),
    onSuccess: () => {
      queryClient.clear();
      toast({
        title: "Đăng xuất thành công",
        description: "Bạn đã đăng xuất khỏi hệ thống.",
      });
      window.location.href = '/';
    },
    onError: () => {
      toast({
        title: "Lỗi đăng xuất",
        description: "Có lỗi xảy ra khi đăng xuất.",
        variant: "destructive",
      });
    }
  });

  const navItems = [
    { href: '/', label: t('common.home') },
    { href: '/menu', label: t('common.menu') },
    { href: '/about', label: t('common.about') },
    { href: '/news', label: t('common.blog') },
    { href: '/contact', label: t('common.contact') },
    { href: '/booking', label: t('common.booking') },
  ];

  const isActive = (path: string) => location === path;

  return (
    <header className="bg-black border-b border-zinc-800 sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center" data-testid="link-home">
            <img 
              src="/api/assets/logo.humpizza.png" 
              alt="Hum's Pizza Logo" 
              className="h-12 w-auto"
              onError={(e) => {
                // Fallback if logo not found
                const target = e.target as HTMLImageElement;
                target.src = "/api/assets/favicon.png";
              }}
            />
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-8">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`text-base font-medium transition-colors hover:text-white ${
                  isActive(item.href) ? 'text-white' : 'text-zinc-400'
                }`}
                data-testid={`link-${item.label.toLowerCase()}`}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Right Actions */}
          <div className="flex items-center space-x-3">
            <Button
              onClick={onOpenCart}
              variant="ghost"
              size="sm"
              className="relative text-white hover:bg-zinc-800"
              data-testid="button-cart"
            >
              <ShoppingCart className="h-5 w-5" />
              {cartItemsCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center" data-testid="text-cart-count">
                  {cartItemsCount}
                </span>
              )}
            </Button>

            {/* Language Switcher */}
            <LanguageSwitcher />

            {/* Admin/Staff Menu - Only show when logged in */}


            {/* Mobile Menu */}
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="sm" className="md:hidden text-white hover:bg-zinc-800" data-testid="button-mobile-menu">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="bg-black border-zinc-800 text-white">
                <div className="flex flex-col space-y-4 mt-8">
                  {navItems.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`text-lg font-medium transition-colors hover:text-white ${
                        isActive(item.href) ? 'text-white' : 'text-zinc-400'
                      }`}
                      data-testid={`mobile-link-${item.label.toLowerCase()}`}
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}