# Hướng Dẫn Cấp Quyền Database

## ⚠️ Vấn Đề

User `hum94111_pizza_user` **chưa có quyền** truy cập các bảng trong database `hum94111_pizza`.

Lỗi: `permission denied for table users, home_content, about_content, orders...`

---

## ✅ Giải Pháp: Cấp Quyền Cho User

### Cách 1: Sử dụng SQL (Khuyến nghị)

Login vào PostgreSQL server với user **có quyền admin** (postgres hoặc root) và chạy:

```sql
-- Kết nối vào database
\c hum94111_pizza

-- Cấp quyền cho user
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO hum94111_pizza_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO hum94111_pizza_user;
GRANT ALL PRIVILEGES ON SCHEMA public TO hum94111_pizza_user;

-- Đặt default privileges cho tables/sequences mới (quan trọng!)
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO hum94111_pizza_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO hum94111_pizza_user;

-- Kiểm tra quyền
\dt
```

### Cách 2: Sử dụng cPanel / phpMyAdmin

1. Login vào cPanel
2. Vào **MySQL Databases** hoặc **PostgreSQL Databases**
3. Tìm user: `hum94111_pizza_user`
4. Click **Manage Privileges**
5. Tick chọn **ALL PRIVILEGES**
6. Click **Save**

### Cách 3: Command Line (psql)

```bash
# Login as postgres superuser
psql -U postgres -h 103.138.88.63

# Switch to database
\c hum94111_pizza

# Grant permissions
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO hum94111_pizza_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO hum94111_pizza_user;

# Verify
\z
```

---

## 🧪 Test Sau Khi Cấp Quyền

Sau khi cấp quyền xong:

1. **Restart application:** Replit sẽ tự động restart workflow
2. **Kiểm tra logs:** Xem có còn lỗi `permission denied` không
3. **Test API:** Truy cập `http://localhost:5000/api/categories` để test

---

## 📋 Checklist

- [ ] Login vào database server với admin user
- [ ] Chạy các lệnh GRANT ở trên
- [ ] Kiểm tra không còn lỗi permission denied
- [ ] Test đăng nhập admin (`admin` / `admin123`)
- [ ] Test API endpoints hoạt động

---

## 🆘 Troubleshooting

### Lỗi: "must be owner of relation"
→ User hiện tại không có quyền admin. Dùng user `postgres` hoặc owner của database.

### Lỗi: "role does not exist"
→ User `hum94111_pizza_user` chưa được tạo. Tạo user trước:
```sql
CREATE USER hum94111_pizza_user WITH PASSWORD 'F~xd@c9H5exFxh7x';
```

### Tables chưa tồn tại
→ Chạy migration để tạo tables:
```bash
npm run db:push
```

---

## 📝 Lưu Ý

- Quyền cần cấp: **SELECT, INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER**
- Scope: **ALL TABLES** và **ALL SEQUENCES** trong schema `public`
- User cần quyền để tạo/sửa/xóa dữ liệu

---

## 🚀 Sau Khi Hoàn Thành

Khi permission được cấp đúng:
- ✅ Seed data sẽ tự động chạy (admin user, home content, etc.)
- ✅ API endpoints hoạt động bình thường
- ✅ Admin panel có thể login và quản lý
- ✅ Production build chạy không lỗi
