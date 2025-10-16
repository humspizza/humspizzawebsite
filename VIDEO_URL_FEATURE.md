# ✅ TÍNH NĂNG: SỬ DỤNG URL VIDEO TỪ NGUỒN KHÁC

## 🎯 Mục đích
Cho phép admin sử dụng video từ nhiều nguồn khác nhau thay vì chỉ upload từ máy tính.

## 📋 Tính năng mới

### 1. **Hai tùy chọn cho mỗi video**

#### Tab 1: Tải lên (Upload)
- Upload file video từ máy tính
- Kích thước tối đa: 200MB
- Định dạng: MP4, WEBM, MOV
- Lưu vào: `attached_assets/{uuid}.mp4`
- URL: `/api/assets/{uuid}.mp4`

#### Tab 2: Dùng URL
- Paste URL video từ nguồn khác
- Hỗ trợ:
  - CDN URLs (Cloudflare, AWS CloudFront, etc.)
  - Direct video URLs (.mp4, .webm, .mov)
  - Video platforms (có thể cần xử lý thêm cho embed)
- URL được lưu trực tiếp vào database

### 2. **UI Components**

```tsx
<Tabs>
  <TabsList>
    <TabsTrigger value="upload">
      <Upload /> Tải lên
    </TabsTrigger>
    <TabsTrigger value="url">
      <Link /> Dùng URL
    </TabsTrigger>
  </TabsList>
  
  <TabsContent value="upload">
    <VideoUploader /> {/* Upload từ máy */}
  </TabsContent>
  
  <TabsContent value="url">
    <Input placeholder="https://example.com/video.mp4" />
    <Button>Lưu URL Video</Button>
  </TabsContent>
</Tabs>
```

### 3. **Flow hoạt động**

#### Upload File:
```
User → Chọn file → Upload → Server lưu vào attached_assets/
     → Trả về /api/assets/{uuid}.mp4
     → Lưu vào pending state
     → Bấm "Lưu thay đổi" → Apply video
```

#### Paste URL:
```
User → Paste URL → Click "Lưu URL Video"
     → Validate URL (client-side)
     → POST /api/save-hero-video
     → Lưu URL vào pending state
     → Bấm "Lưu thay đổi" → Apply video
```

## 🔧 API Endpoint

### POST `/api/save-hero-video`
**Body:**
```json
{
  "videoUrl": "https://cdn.example.com/video.mp4",
  "videoType": "hero" | "reservation"
}
```

**Response:**
```json
{
  "success": true,
  "fileName": "hero.landingpage.mp4",
  "message": "Video URL saved to pending state"
}
```

**Logic:**
- Lưu URL vào `pendingHeroVideoUrl` hoặc `pendingReservationVideoUrl`
- Không download video (để tiết kiệm băng thông)
- URL được dùng trực tiếp trong HTML `<video src="...">` tag

## 📊 Use Cases

### 1. **Video từ CDN**
```
URL: https://cdn.humspizza.com/hero-video.mp4
→ Tốc độ tải nhanh
→ Giảm tải cho server chính
→ Global distribution
```

### 2. **Video từ Object Storage**
```
URL: https://storage.googleapis.com/bucket/video.mp4
URL: https://s3.amazonaws.com/bucket/video.mp4
→ Lưu trữ cloud
→ Không chiếm dung lượng server
```

### 3. **Video từ Hosting khác**
```
URL: https://assets.example.com/videos/hero.mp4
→ Sử dụng video có sẵn
→ Không cần upload lại
```

## ⚠️ Lưu ý

### CORS Issues
Nếu video từ domain khác, cần:
```html
<video crossorigin="anonymous">
  <source src="https://cdn.example.com/video.mp4">
</video>
```

### Video Formats
- ✅ Direct URLs (.mp4, .webm, .mov)
- ❌ YouTube/Vimeo embed (cần xử lý riêng)
- ❌ HLS streams (.m3u8) - cần thư viện hls.js

### Security
- Client validate URL format (basic)
- Server không validate (trust admin input)
- Không tải video về server (dùng URL trực tiếp)

## 🎯 Ví dụ sử dụng

### Scenario 1: Video từ Cloudflare CDN
```
1. Admin paste: https://cdn.humspizza.com/hero-video.mp4
2. Click "Lưu URL Video"
3. Click "Lưu thay đổi"
4. Video load từ Cloudflare CDN (nhanh, global)
```

### Scenario 2: Upload video local
```
1. Admin upload file 50MB từ máy
2. Server lưu vào attached_assets/abc-123.mp4
3. URL: /api/assets/abc-123.mp4
4. Click "Lưu thay đổi"
5. Video load từ server local
```

### Scenario 3: Mix cả hai
```
- Hero video: Upload local (30MB)
- Reservation video: URL từ CDN
→ Linh hoạt tùy nhu cầu
```

## 🚀 Benefits

1. **Flexibility**: Chọn nguồn video tùy ý
2. **Performance**: Dùng CDN để tăng tốc
3. **Storage**: Tiết kiệm dung lượng server
4. **Cost**: Có thể dùng video có sẵn
5. **Migration**: Dễ chuyển video giữa các nguồn

## 📝 Code Changes

### Files Modified:
1. ✅ `client/src/pages/admin/home-management.tsx`
   - Thêm Tabs component
   - Thêm URL input fields
   - Thêm handlers: `handleHeroVideoUrlSubmit()`, `handleReservationVideoUrlSubmit()`

2. ✅ `client/src/components/VideoUploader.tsx`
   - Giữ nguyên (chỉ upload file)

3. ✅ `server/routes.ts`
   - `/api/save-hero-video` endpoint sẵn có
   - Hỗ trợ cả uploaded files và URLs

### No Backend Changes Needed:
- API endpoint `/api/save-hero-video` đã hỗ trợ cả 2 cases
- Database schema đã có `pendingHeroVideoUrl` và `pendingReservationVideoUrl`
- Logic áp dụng video vẫn giống nhau

## 🎉 Kết quả

Giờ admin có **2 cách** để set video hero:

| Phương thức | Khi nào dùng | Ưu điểm |
|------------|--------------|---------|
| **Upload File** | Video nằm trên máy tính | • Đơn giản<br>• Không cần hosting<br>• Control hoàn toàn |
| **Paste URL** | Video đã host ở đâu đó | • Nhanh hơn (không upload)<br>• Tiết kiệm dung lượng<br>• Dùng CDN |

**Hoạt động hoàn hảo!** 🚀
