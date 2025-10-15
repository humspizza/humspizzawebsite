import { create } from 'zustand';

export type Language = 'vi' | 'en';

interface LanguageStore {
  language: Language;
  setLanguage: (language: Language) => void;
}

export const useLanguage = create<LanguageStore>((set) => ({
  language: 'vi',
  setLanguage: (language) => {
    try {
      set({ language });
    } catch (error) {
      console.warn('Error setting language:', error);
    }
  },
}));

export const translations = {
  vi: {
    // Navigation
    home: 'Trang Chủ',
    menu: 'Thực Đơn', 
    about: 'Giới Thiệu',
    blog: 'Blog',
    contact: 'Liên Hệ',
    reservation: 'Đặt Bàn',
    order: 'Đặt Món',
    login: 'Đăng Nhập',
    logout: 'Đăng Xuất',
    admin: 'Quản Trị',
    adminPanel: 'Admin Panel',
    staffPanel: 'Staff Panel',
    
    // Homepage
    welcome: 'Chào Mừng Đến Với Noir Cuisine',
    subtitle: 'Trải nghiệm ẩm thực Việt Nam đẳng cấp',
    makeReservation: 'Đặt Bàn Ngay',
    viewMenu: 'Xem Thực Đơn',
    
    // Menu
    appetizers: 'Khai Vị',
    mainCourses: 'Món Chính',
    desserts: 'Tráng Miệng',
    beverages: 'Đồ Uống',
    category: 'Danh mục',
    addToCart: 'Thêm Vào Giỏ',
    
    // Cart
    cart: 'Giỏ Hàng',
    quantity: 'Số Lượng',
    price: 'Giá',
    total: 'Tổng Cộng',
    checkout: 'Thanh Toán',
    emptyCart: 'Giỏ hàng trống',
    
    // Reservation
    reservationForm: 'Đặt Bàn',
    name: 'Họ Tên',
    phone: 'Số Điện Thoại',
    email: 'Email',
    date: 'Ngày',
    time: 'Giờ',
    guests: 'Số Khách',
    specialRequests: 'Yêu Cầu Đặc Biệt',
    submit: 'Gửi',
    
    // Admin
    dashboard: 'Bảng Điều Khiển',
    menuManagement: 'Quản Lý Thực Đơn',
    blogManagement: 'Quản Lý Blog',
    reservationManagement: 'Quản Lý Đặt Bàn',
    orderManagement: 'Quản Lý Đơn Hàng',
    userManagement: 'Quản Lý Người Dùng',
    add: 'Thêm',
    edit: 'Sửa',
    delete: 'Xóa',
    save: 'Lưu',
    cancel: 'Hủy',
    
    // Status
    pending: 'Chờ Xử Lý',
    confirmed: 'Đã Xác Nhận',
    completed: 'Hoàn Thành',
    cancelled: 'Đã Hủy',
    
    // Legal Pages
    privacyPolicy: 'Chính Sách Bảo Mật',
    termsOfService: 'Điều Khoản Dịch Vụ',
    accessibility: 'Hỗ Trợ Tiếp Cận',
    
    // Statistics
    yearsExcellence: 'Năm Kinh Nghiệm',
    dishesServed: 'Món Ăn Phục Vụ',
    recipeVariations: 'Biến Thể Công Thức',
    customerSatisfaction: 'Hài Lòng Khách Hàng',
    
    // Footer
    followUs: 'Theo Dõi Chúng Tôi',
    address: 'Địa Chỉ',
    openHours: 'Giờ Mở Cửa',
    rights: 'Bản quyền thuộc về Noir Cuisine',
  },
  en: {
    // Navigation
    home: 'Home',
    menu: 'Menu',
    about: 'About',
    blog: 'Blog', 
    contact: 'Contact',
    reservation: 'Reservation',
    order: 'Order',
    login: 'Login',
    logout: 'Logout',
    admin: 'Admin',
    adminPanel: 'Admin Panel',
    staffPanel: 'Staff Panel',
    
    // Homepage
    welcome: 'Welcome to Noir Cuisine',
    subtitle: 'Experience Premium Vietnamese Cuisine',
    makeReservation: 'Make Reservation',
    viewMenu: 'View Menu',
    
    // Menu
    appetizers: 'Appetizers',
    mainCourses: 'Main Courses',
    desserts: 'Desserts',
    beverages: 'Beverages',
    category: 'Category',
    addToCart: 'Add to Cart',
    
    // Cart
    cart: 'Cart',
    quantity: 'Quantity',
    price: 'Price',
    total: 'Total',
    checkout: 'Checkout',
    emptyCart: 'Cart is empty',
    
    // Reservation
    reservationForm: 'Make a Reservation',
    name: 'Full Name',
    phone: 'Phone Number',
    email: 'Email',
    date: 'Date',
    time: 'Time',
    guests: 'Number of Guests',
    specialRequests: 'Special Requests',
    submit: 'Submit',
    
    // Admin
    dashboard: 'Dashboard',
    menuManagement: 'Menu Management',
    blogManagement: 'Blog Management',
    reservationManagement: 'Reservation Management',
    orderManagement: 'Order Management',
    userManagement: 'User Management',
    add: 'Add',
    edit: 'Edit',
    delete: 'Delete',
    save: 'Save',
    cancel: 'Cancel',
    
    // Status
    pending: 'Pending',
    confirmed: 'Confirmed',
    completed: 'Completed',
    cancelled: 'Cancelled',
    
    // Legal Pages
    privacyPolicy: 'Privacy Policy',
    termsOfService: 'Terms of Service',
    accessibility: 'Accessibility',
    
    // Statistics
    yearsExcellence: 'Years of Excellence',
    dishesServed: 'Dishes Served',
    recipeVariations: 'Recipe Variations',
    customerSatisfaction: 'Customer Satisfaction',
    
    // Footer
    followUs: 'Follow Us',
    address: 'Address',
    openHours: 'Opening Hours',
    rights: 'All rights reserved by Noir Cuisine',
  }
};

export const t = (key: keyof typeof translations.vi, language: Language = 'vi'): string => {
  return translations[language][key] || translations.vi[key] || key;
};

export const useTranslation = () => {
  const { language, setLanguage } = useLanguage();
  
  const translateFn = (key: keyof typeof translations.vi) => {
    try {
      return t(key, language);
    } catch (error) {
      console.warn(`Translation error for key "${key}":`, error);
      return key as string;
    }
  };
  
  return {
    t: translateFn,
    language,
    setLanguage,
  };
};