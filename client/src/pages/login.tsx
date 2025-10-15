import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useLanguage } from "@/contexts/LanguageContext";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { Eye, EyeOff, LogIn } from "lucide-react";

const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function Login() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { language } = useLanguage();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const onSubmit = async (data: LoginFormValues) => {
    setIsLoading(true);
    try {
      // Try to authenticate with unified endpoint
      const response = await apiRequest("POST", "/api/auth/login", data);
      
      if (response.ok) {
        const result = await response.json();
        
        // Store user info and login time for session management
        localStorage.setItem("user", JSON.stringify(result.user));
        localStorage.setItem("loginTime", new Date().getTime().toString());
        
        // Update query cache with user data to prevent loading screen
        queryClient.setQueryData(["/api/admin/me"], result.user);
        
        // Invalidate all queries to refresh data with new authentication
        queryClient.invalidateQueries();
        
        toast({
          title: language === 'vi' ? 'Đăng nhập thành công' : 'Login Successful',
          description: language === 'vi' 
            ? `Chào mừng trở lại, ${result.user.role === 'admin' ? 'Quản trị viên' : 'Nhân viên'}!`
            : `Welcome back, ${result.user.role === 'admin' ? 'Administrator' : 'Staff Member'}!`,
        });
        
        // Redirect based on user role
        if (result.user.role === 'admin') {
          setLocation("/admin/dashboard");
        } else if (result.user.role === 'staff') {
          setLocation("/staff/dashboard");
        } else {
          // Fallback for unknown roles
          setLocation("/");
        }
      } else {
        const error = await response.json();
        toast({
          title: language === 'vi' ? 'Đăng nhập thất bại' : 'Login Failed',
          description: error.message || (language === 'vi' ? 'Tên đăng nhập hoặc mật khẩu không đúng' : 'Invalid username or password'),
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: language === 'vi' ? 'Lỗi' : 'Error',
        description: language === 'vi' ? 'Có lỗi xảy ra khi đăng nhập' : 'An error occurred during login',
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      {/* Language Switcher */}
      <div className="absolute top-6 right-6">
        <LanguageSwitcher />
      </div>

      <Card className="w-full max-w-md bg-zinc-900 border-zinc-800">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold text-white mb-2">
            {language === 'vi' ? 'Đăng Nhập Hệ Thống' : 'System Login'}
          </CardTitle>
          <CardDescription className="text-zinc-400">
            {language === 'vi' 
              ? 'Đăng nhập để truy cập bảng điều khiển quản lý' 
              : 'Sign in to access the management dashboard'
            }
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-zinc-300">
                      {language === 'vi' ? 'Tên đăng nhập' : 'Username'}
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder={language === 'vi' ? 'Nhập tên đăng nhập' : 'Enter username'}
                        {...field}
                        className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 focus:border-yellow-400 focus:ring-yellow-400"
                        data-testid="input-username"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-zinc-300">
                      {language === 'vi' ? 'Mật khẩu' : 'Password'}
                    </FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type={showPassword ? "text" : "password"}
                          placeholder={language === 'vi' ? 'Nhập mật khẩu' : 'Enter password'}
                          {...field}
                          className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 focus:border-yellow-400 focus:ring-yellow-400 pr-10"
                          data-testid="input-password"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4 text-zinc-400" />
                          ) : (
                            <Eye className="h-4 w-4 text-zinc-400" />
                          )}
                        </Button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <Button 
                type="submit" 
                className="w-full bg-yellow-600 hover:bg-yellow-700 text-white font-semibold transition-colors"
                disabled={isLoading}
                data-testid="button-login"
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                    {language === 'vi' ? 'Đang đăng nhập...' : 'Signing in...'}
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <LogIn className="h-4 w-4" />
                    {language === 'vi' ? 'Đăng nhập' : 'Sign In'}
                  </div>
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}