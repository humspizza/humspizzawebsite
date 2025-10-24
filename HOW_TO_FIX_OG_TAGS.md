# Hướng Dẫn Khắc Phục OG Meta Tags

## ✅ Hệ Thống Hiện Tại

Ứng dụng **ĐÃ CÓ** crawler middleware để serve dynamic OG meta tags:
- ✅ Mỗi trang (Home, Menu, About, Booking, Contact) có OG tags riêng
- ✅ Blog posts có OG tags riêng từ database
- ✅ Hoạt động đúng trong **Development Mode**

## ⚠️ Tại Sao Vẫn Hiển Thị Giống Nhau?

### Vấn Đề 1: Social Media Cache

Facebook, Twitter, LinkedIn **cache meta tags** và không tự động cập nhật.

**Giải pháp:**

1. **Facebook Sharing Debugger**
   - URL: https://developers.facebook.com/tools/debug/
   - Nhập URL của bạn (ví dụ: `https://humspizza.com/menu`)
   - Click **"Scrape Again"** để fetch lại meta tags mới
   - Lặp lại cho từng trang: `/`, `/menu`, `/about`, `/booking`, `/contact`

2. **Twitter Card Validator**
   - URL: https://cards-dev.twitter.com/validator
   - Nhập URL và kiểm tra preview

3. **LinkedIn Post Inspector**
   - URL: https://www.linkedin.com/post-inspector/
   - Nhập URL để clear cache

### Vấn Đề 2: Production Deployment (QUAN TRỌNG)

**⚠️ CRITICAL:** Nếu production đang serve **static files** (Apache/Nginx), crawler middleware **SẼ KHÔNG CHẠY**.

#### Kiểm Tra Production:

```bash
# Test crawler response trên production
curl -A "facebookexternalhit/1.1" https://humspizza.com/menu | grep "og:title"

# Nếu thấy:
# ❌ "Hum's Pizza | Gắn Kết Yêu Thương..." (giống nhau mọi trang)
#    → Đang serve static files, cần deploy Node.js server

# Nếu thấy:
# ✅ "Hum's Pizza | Thực Đơn" (riêng cho trang Menu)
#    → Node.js server đang chạy đúng
```

#### Giải Pháp:

**Phải deploy Node.js server** thay vì serve static files. Xem file `DEPLOYMENT_GUIDE.md` để biết cách:

1. Chạy `npm run build` để build frontend
2. Start Node.js server: `npm start`
3. Cấu hình Nginx/Apache reverse proxy đến Node.js (port 5000)
4. **KHÔNG** serve thư mục `dist/` trực tiếp

## 🧪 Test Crawler Middleware (Development)

```bash
# Test Home page
curl -A "facebookexternalhit/1.1" http://localhost:5000/ | grep -A 2 "og:title"

# Test Menu page
curl -A "facebookexternalhit/1.1" http://localhost:5000/menu | grep -A 2 "og:title"

# Test About page
curl -A "facebookexternalhit/1.1" http://localhost:5000/about | grep -A 2 "og:title"

# Test Blog post
curl -A "facebookexternalhit/1.1" http://localhost:5000/news/your-blog-slug | grep -A 2 "og:title"
```

**Kết quả mong đợi:** Mỗi trang có title, description, image KHÁC NHAU.

## 📝 Checklist

- [ ] Clear Facebook cache cho tất cả các trang
- [ ] Clear Twitter cache cho tất cả các trang
- [ ] Clear LinkedIn cache cho tất cả các trang
- [ ] **Đảm bảo production chạy Node.js server** (QUAN TRỌNG NHẤT)
- [ ] Test crawler response trên production
- [ ] Verify OG tags trên Facebook Sharing Debugger

## 🎯 Kết Luận

Hệ thống **ĐÃ ĐÚNG** trong code. Vấn đề chỉ là:
1. **Social media cache** → Clear cache
2. **Production deployment** → Deploy Node.js server

Sau khi khắc phục 2 vấn đề trên, mỗi trang sẽ hiển thị OG meta tags RIÊNG BIỆT khi share lên social media!
