import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Settings, UserPlus, Edit, Trash2, Shield, Lock, Eye, EyeOff, AlertCircle } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

interface User {
  id: string;
  username: string;
  email: string;
  fullName: string;
  role: string;
  permissions: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

const profileSchema = z.object({
  fullName: z.string().min(1, "Full name is required"),
  email: z.string().email("Valid email required"),
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(6, "New password must be at least 6 characters").optional().or(z.literal("")),
  confirmPassword: z.string().optional().or(z.literal("")),
}).refine((data) => {
  if (data.newPassword && data.newPassword !== data.confirmPassword) {
    return false;
  }
  return true;
}, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

const userSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  email: z.string().email("Valid email required"),
  fullName: z.string().min(1, "Full name is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum(["admin", "staff"]),
  permissions: z.array(z.string()).default([]),
  isActive: z.boolean().default(true),
});

type ProfileFormData = z.infer<typeof profileSchema>;
type UserFormData = z.infer<typeof userSchema>;

const AVAILABLE_PERMISSIONS = [
  "manage_menu",
  "manage_orders", 
  "manage_reservations",
  "manage_blog",
  "view_reports",
  "manage_users"
];

export default function AccountSettings() {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  // Get current user
  const { data: currentUser } = useQuery({
    queryKey: ["/api/admin/me"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/admin/me");
      return response.json();
    },
  });

  // Get all users (only admins can see this)
  const { data: users = [] } = useQuery({
    queryKey: ["/api/admin/users"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/admin/users");
      return response.json();
    },
    enabled: currentUser?.role === "admin",
  });

  const profileForm = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      fullName: currentUser?.fullName || "",
      email: currentUser?.email || "",
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const userForm = useForm<UserFormData>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      username: "",
      email: "",
      fullName: "",
      password: "",
      role: "staff",
      permissions: [],
      isActive: true,
    },
  });

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (data: ProfileFormData) => {
      const payload = {
        fullName: data.fullName,
        email: data.email,
        currentPassword: data.currentPassword,
        ...(data.newPassword && { newPassword: data.newPassword }),
      };
      const response = await apiRequest("PATCH", "/api/admin/profile", payload);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/me"] });
      toast({
        title: t('common.success'),
        description: "Profile updated successfully",
      });
      profileForm.reset({
        ...profileForm.getValues(),
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    },
    onError: (error: any) => {
      toast({
        title: t('common.error'),
        description: error.message || "Failed to update profile",
        variant: "destructive",
      });
    },
  });

  // Create user mutation
  const createUserMutation = useMutation({
    mutationFn: async (data: UserFormData) => {
      const response = await apiRequest("POST", "/api/admin/users", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({
        title: t('common.success'),
        description: "User created successfully",
      });
      setIsDialogOpen(false);
      userForm.reset();
    },
    onError: (error: any) => {
      toast({
        title: t('common.error'),
        description: error.message || "Failed to create user",
        variant: "destructive",
      });
    },
  });

  // Update user mutation
  const updateUserMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<UserFormData> }) => {
      const response = await apiRequest("PATCH", `/api/admin/users/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({
        title: t('common.success'),
        description: "User updated successfully",
      });
      setIsDialogOpen(false);
      setEditingUser(null);
      userForm.reset();
    },
    onError: (error: any) => {
      toast({
        title: t('common.error'),
        description: error.message || "Failed to update user",
        variant: "destructive",
      });
    },
  });

  // Delete user mutation
  const deleteUserMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest("DELETE", `/api/admin/users/${id}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({
        title: t('common.success'),
        description: "User deleted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: t('common.error'),
        description: error.message || "Failed to delete user",
        variant: "destructive",
      });
    },
  });

  // Toggle user status
  const toggleUserStatus = async (userId: string, isActive: boolean) => {
    updateUserMutation.mutate({
      id: userId,
      data: { isActive: !isActive }
    });
  };

  const onProfileSubmit = (data: ProfileFormData) => {
    updateProfileMutation.mutate(data);
  };

  const onUserSubmit = (data: UserFormData) => {
    if (editingUser) {
      updateUserMutation.mutate({
        id: editingUser.id,
        data: {
          ...data,
          // Don't include password in update if empty
          ...(data.password && { password: data.password })
        }
      });
    } else {
      createUserMutation.mutate(data);
    }
  };

  const handleAddUser = () => {
    setEditingUser(null);
    userForm.reset({
      username: "",
      email: "",
      fullName: "",
      password: "",
      role: "staff",
      permissions: [],
      isActive: true,
    });
    setIsDialogOpen(true);
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    userForm.reset({
      username: user.username,
      email: user.email,
      fullName: user.fullName,
      password: "", // Don't show password
      role: user.role as "admin" | "staff",
      permissions: user.permissions || [],
      isActive: user.isActive,
    });
    setIsDialogOpen(true);
  };

  const handleDeleteUser = (user: User) => {
    if (user.id === currentUser?.id) {
      toast({
        title: "Cannot Delete",
        description: "You cannot delete your own account",
        variant: "destructive",
      });
      return;
    }
    
    if (confirm(`Are you sure you want to delete user "${user.fullName}"?`)) {
      deleteUserMutation.mutate(user.id);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-white">{t('account.title')}</h2>
        <p className="text-zinc-400">{t('account.subtitle')}</p>
      </div>

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="grid w-full grid-cols-2 bg-zinc-900 border-zinc-800">
          <TabsTrigger value="profile" className="data-[state=active]:bg-yellow-500 data-[state=active]:text-black">
            <Settings className="w-4 h-4 mr-2" />
            {t('account.myProfile')}
          </TabsTrigger>
          {currentUser?.role === "admin" && (
            <TabsTrigger value="users" className="data-[state=active]:bg-yellow-500 data-[state=active]:text-black">
              <Shield className="w-4 h-4 mr-2" />
              {t('account.userManagement')}
            </TabsTrigger>
          )}
        </TabsList>
        
        <TabsContent value="profile" className="space-y-6">
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-white">{t('account.profileInfo')}</CardTitle>
              <CardDescription className="text-zinc-400">
                {t('account.updateInfo')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...profileForm}>
                <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={profileForm.control}
                      name="fullName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-white">Full Name</FormLabel>
                          <FormControl>
                            <Input {...field} className="bg-zinc-800 border-zinc-700 text-white" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={profileForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-white">Email</FormLabel>
                          <FormControl>
                            <Input {...field} type="email" className="bg-zinc-800 border-zinc-700 text-white" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="border-t border-zinc-700 pt-4">
                    <h4 className="text-white font-medium mb-4 flex items-center">
                      <Lock className="w-4 h-4 mr-2" />
                      Change Password
                    </h4>
                    <div className="space-y-4">
                      <FormField
                        control={profileForm.control}
                        name="currentPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-white">Current Password</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Input 
                                  {...field} 
                                  type={showPassword ? "text" : "password"}
                                  className="bg-zinc-800 border-zinc-700 text-white pr-10" 
                                />
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  className="absolute right-2 top-1/2 transform -translate-y-1/2 text-zinc-400 hover:text-white"
                                  onClick={() => setShowPassword(!showPassword)}
                                >
                                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </Button>
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={profileForm.control}
                          name="newPassword"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-white">New Password (Optional)</FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <Input 
                                    {...field} 
                                    type={showNewPassword ? "text" : "password"}
                                    placeholder="Leave blank to keep current"
                                    className="bg-zinc-800 border-zinc-700 text-white pr-10" 
                                  />
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="absolute right-2 top-1/2 transform -translate-y-1/2 text-zinc-400 hover:text-white"
                                    onClick={() => setShowNewPassword(!showNewPassword)}
                                  >
                                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                  </Button>
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={profileForm.control}
                          name="confirmPassword"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-white">Confirm New Password</FormLabel>
                              <FormControl>
                                <Input 
                                  {...field} 
                                  type="password"
                                  placeholder="Confirm new password"
                                  className="bg-zinc-800 border-zinc-700 text-white" 
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end pt-4">
                    <Button
                      type="submit"
                      className="bg-white text-black hover:bg-zinc-200"
                      disabled={updateProfileMutation.isPending}
                    >
                      {updateProfileMutation.isPending ? "Updating..." : "Update Profile"}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>

        {currentUser?.role === "admin" && (
          <TabsContent value="users" className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-xl font-bold text-white">User Management</h3>
                <p className="text-zinc-400">Manage admin and staff accounts</p>
              </div>
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={handleAddUser} className="bg-white text-black hover:bg-zinc-200">
                    <UserPlus className="w-4 h-4 mr-2" />
                    Add User
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-zinc-900 border-zinc-800 max-w-2xl">
                  <DialogHeader>
                    <DialogTitle className="text-white">
                      {editingUser ? "Edit User" : "Add New User"}
                    </DialogTitle>
                    <DialogDescription className="text-zinc-400">
                      {editingUser ? "Update user information" : "Create a new admin or staff account"}
                    </DialogDescription>
                  </DialogHeader>
                  <Form {...userForm}>
                    <form onSubmit={userForm.handleSubmit(onUserSubmit)} className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={userForm.control}
                          name="username"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-white">Username</FormLabel>
                              <FormControl>
                                <Input {...field} className="bg-zinc-800 border-zinc-700 text-white" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={userForm.control}
                          name="role"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-white">Role</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white">
                                    <SelectValue placeholder="Select role" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent className="bg-zinc-800 border-zinc-700">
                                  <SelectItem value="admin" className="text-white">Admin</SelectItem>
                                  <SelectItem value="staff" className="text-white">Staff</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={userForm.control}
                          name="fullName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-white">Full Name</FormLabel>
                              <FormControl>
                                <Input {...field} className="bg-zinc-800 border-zinc-700 text-white" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={userForm.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-white">Email</FormLabel>
                              <FormControl>
                                <Input {...field} type="email" className="bg-zinc-800 border-zinc-700 text-white" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={userForm.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-white">
                              Password {editingUser && "(Leave blank to keep current)"}
                            </FormLabel>
                            <FormControl>
                              <Input {...field} type="password" className="bg-zinc-800 border-zinc-700 text-white" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={userForm.control}
                        name="isActive"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border border-zinc-700 p-4">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base text-white">Active Account</FormLabel>
                              <div className="text-sm text-zinc-400">
                                User can login and access the system
                              </div>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />

                      <div className="flex justify-end gap-2 pt-4">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setIsDialogOpen(false)}
                          className="border-zinc-700 text-white hover:bg-zinc-800"
                        >
                          Cancel
                        </Button>
                        <Button
                          type="submit"
                          className="bg-white text-black hover:bg-zinc-200"
                          disabled={createUserMutation.isPending || updateUserMutation.isPending}
                        >
                          {editingUser ? "Update User" : "Create User"}
                        </Button>
                      </div>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </div>

            <div className="grid gap-4">
              {users.map((user: User) => (
                <Card key={user.id} className="bg-zinc-900 border-zinc-800">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start">
                      <div className="space-y-2">
                        <div className="flex items-center gap-3">
                          <h3 className="text-lg font-semibold text-white">{user.fullName}</h3>
                          <Badge variant={user.role === "admin" ? "default" : "secondary"}>
                            {user.role}
                          </Badge>
                          <Badge variant={user.isActive ? "default" : "destructive"}>
                            {user.isActive ? "Active" : "Inactive"}
                          </Badge>
                          {user.id === currentUser?.id && (
                            <Badge variant="outline" className="text-amber-400 border-amber-400">
                              You
                            </Badge>
                          )}
                        </div>
                        <p className="text-zinc-400">@{user.username} • {user.email}</p>
                        <p className="text-sm text-zinc-500">
                          Created: {new Date(user.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => toggleUserStatus(user.id, user.isActive)}
                          className="border-zinc-700 text-zinc-300 hover:bg-zinc-800"
                          disabled={user.id === currentUser?.id}
                        >
                          {user.isActive ? "Deactivate" : "Activate"}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditUser(user)}
                          className="border-zinc-700 text-zinc-300 hover:bg-zinc-800"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteUser(user)}
                          className="border-red-700 text-red-400 hover:bg-red-900/20"
                          disabled={user.id === currentUser?.id}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}