# Hướng Dẫn Kiểm Tra & Sử Dụng Open Graph Meta Tags

## 🎯 Tổng Quan

Open Graph (OG) meta tags giúp trang web hiển thị đẹp khi chia sẻ lên Facebook, Twitter, LinkedIn, WhatsApp, và các nền tảng mạng xã hội khác. Mỗi trang trên website Hum's Pizza giờ đây có OG tags riêng biệt.

## ✅ Đã Hoàn Thành

1. ✅ **Xóa hard-coded OG tags** từ `client/index.html`
2. ✅ **Server-side rendering** cho crawlers (Facebook, Twitter, LinkedIn, WhatsApp, Telegram, Slack)
3. ✅ **Dynamic OG tags** cho từng trang tĩnh (Home, Menu, About, Booking, Contact)
4. ✅ **Dynamic OG tags** cho từng bài viết blog
5. ✅ **SEO data** được lưu trong database (bảng `page_seo` và `blog_posts`)

## 🧪 Cách Kiểm Tra Trong Development

### Chạy Test Script

```bash
./test-og-tags.sh
```

Script này sẽ giả lập cách Facebook/Twitter crawler đọc website của bạn.

### Kiểm Tra Thủ Công

```bash
# Test trang Home
curl -A "facebookexternalhit/1.1" http://localhost:5000/ | grep "og:title"

# Test trang About
curl -A "facebookexternalhit/1.1" http://localhost:5000/about | grep "og:title"

# Test bài viết blog
curl -A "facebookexternalhit/1.1" http://localhost:5000/news/ten-bai-viet | grep "og:title"
```

## 🌐 Cách Kiểm Tra Trên Production

### 1. Facebook Sharing Debugger

1. Truy cập: https://developers.facebook.com/tools/debug/
2. Nhập URL trang cần test (ví dụ: `https://humspizza.com/about`)
3. Click **"Debug"**
4. Xem preview và kiểm tra OG tags

**⚠️ Quan trọng:** Nếu bạn đã từng share link trước đó, click **"Scrape Again"** để xóa cache và lấy OG tags mới.

### 2. Twitter Card Validator

1. Truy cập: https://cards-dev.twitter.com/validator
2. Nhập URL trang cần test
3. Click **"Preview card"**
4. Xem preview card sẽ hiển thị như thế nào trên Twitter

### 3. LinkedIn Post Inspector

1. Truy cập: https://www.linkedin.com/post-inspector/
2. Nhập URL
3. Click **"Inspect"**
4. Xem preview

## 📊 Danh Sách OG Tags Cho Từng Trang

### Trang Tĩnh

| Trang | OG Title | Có OG Description | Có OG Image |
|-------|----------|-------------------|-------------|
| **Home** (`/`) | ✅ Riêng biệt | ✅ | ✅ |
| **Menu** (`/menu`) | ✅ Riêng biệt | ✅ | ✅ |
| **About** (`/about`) | ✅ Riêng biệt | ✅ | ✅ |
| **Booking** (`/booking`) | ✅ Riêng biệt | ✅ | ✅ |
| **Contact** (`/contact`) | ✅ Riêng biệt | ✅ | ✅ |

### Bài Viết Blog

Mỗi bài viết blog có OG tags riêng dựa trên:
- **Title**: Từ trường `meta_title` hoặc `title` của bài viết
- **Description**: Từ trường `meta_description` hoặc `excerpt`
- **Image**: Từ trường `og_image_url`, `cover_image_url`, hoặc `image_url`
- **Type**: `article` (khác với `website` cho trang tĩnh)

## 🔧 Cách Thêm/Sửa OG Tags

### Cho Trang Tĩnh

Truy cập **Admin Dashboard** → **Quản Lý SEO & Open Graph** → Chọn trang → Điền thông tin:

- **Meta Title**: Tiêu đề trang (cho Google)
- **Meta Description**: Mô tả trang (cho Google)
- **OG Title**: Tiêu đề khi share (cho Facebook/Twitter)
- **OG Description**: Mô tả khi share
- **OG Image**: Hình ảnh hiển thị khi share (tỷ lệ khuyến nghị: 1200x630px)

### Cho Bài Viết Blog

Khi tạo/sửa bài viết → Phần **SEO & Meta Tags** → Điền:

- **Meta Title (EN/VI)**: Tiêu đề SEO
- **Meta Description (EN/VI)**: Mô tả SEO
- **Keywords**: Từ khóa
- **OG Image**: Upload ảnh cho social sharing (1200x630px)
- **Canonical URL**: URL chính thức của bài viết

## 🎨 Khuyến Nghị Hình Ảnh OG

- **Kích thước**: 1200 x 630 pixels
- **Tỷ lệ**: 1.91:1
- **Định dạng**: JPG hoặc PNG
- **Dung lượng**: < 8MB
- **Nội dung**: Logo + Text ngắn gọn + Hình ảnh đẹp

## 🔍 Cấu Trúc Kỹ Thuật

### Server-Side Rendering (SSR)

File `server/index.ts` có middleware phát hiện crawler:

```typescript
// Detect crawlers
const isCrawler = /facebookexternalhit|twitterbot|LinkedInBot|WhatsApp|TelegramBot|Slackbot/i.test(userAgent);
```

Khi phát hiện crawler, server trả về HTML với OG tags thay vì React app:

```html
<meta property="og:title" content="..." />
<meta property="og:description" content="..." />
<meta property="og:image" content="..." />
<meta property="og:url" content="..." />
<meta property="og:type" content="website" />
```

### Client-Side Rendering (CSR)

Component `SEOHead.tsx` update OG tags động qua JavaScript cho users thông thường.

### Database Schema

**Bảng `page_seo`**: Lưu SEO data cho trang tĩnh
**Bảng `blog_posts`**: Có trường SEO riêng cho từng bài viết

## ⚠️ Lưu Ý Quan Trọng

1. **Cache của Social Media**: Facebook, Twitter cache OG tags. Nếu sửa OG tags, phải dùng debugger để xóa cache.

2. **Production Deployment**: 
   - OG tags CHỈ hoạt động khi deploy qua **Node.js server**
   - KHÔNG hoạt động khi deploy static files qua Apache/Nginx
   - Replit Deployments tự động dùng Node.js server ✅

3. **Image URL**: 
   - OG image phải là **full URL** (https://...)
   - Không được là relative path (/images/...)
   - Server tự động convert relative → absolute URL

4. **Language Support**:
   - Hiện tại crawler middleware mặc định dùng tiếng Việt
   - User thông thường thấy OG tags theo ngôn ngữ họ chọn

## 📞 Hỗ Trợ

Nếu gặp vấn đề:

1. Chạy `./test-og-tags.sh` để test local
2. Kiểm tra database có SEO data chưa
3. Dùng Facebook Debugger để xem lỗi cụ thể
4. Kiểm tra production có dùng Node.js server không

## ✨ Tóm Tắt

✅ **MỖI trang có OG tags RIÊNG**
✅ **Trang tĩnh**: Lấy từ database `page_seo`
✅ **Blog posts**: Lấy từ database `blog_posts`
✅ **Crawlers**: Được serve HTML tĩnh với OG tags
✅ **Users**: Được serve React app, OG tags update qua JS

🎉 **Website đã sẵn sàng để share lên mạng xã hội!**
