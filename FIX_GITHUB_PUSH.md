# Hướng dẫn Fix lỗi GitHub Push - File quá lớn

## Vấn đề
Git history chứa video files lớn (108 MB) vượt quá giới hạn GitHub 100 MB.

## Giải pháp 1: Dọn dẹp Git History (Khuyên dùng)

### Bước 1: Xóa video files khỏi Git tracking
```bash
git rm --cached attached_assets/*.mp4
git rm --cached materials/*.mp4 2>/dev/null || true
```

### Bước 2: Commit thay đổi
```bash
git add .gitignore
git commit -m "Remove large video files from Git tracking"
```

### Bước 3: Dọn dẹp Git history với BFG Repo Cleaner

#### 3.1. Tải BFG
```bash
cd ~
wget https://repo1.maven.org/maven2/com/madgag/bfg/1.14.0/bfg-1.14.0.jar
```

#### 3.2. Backup repo (an toàn)
```bash
cd /home/runner/workspace
git bundle create ../backup.bundle --all
```

#### 3.3. Chạy BFG để xóa files lớn
```bash
java -jar ~/bfg-1.14.0.jar --delete-files "*.mp4" .
java -jar ~/bfg-1.14.0.jar --delete-folders materials .
```

#### 3.4. Dọn dẹp Git
```bash
git reflog expire --expire=now --all
git gc --prune=now --aggressive
```

### Bước 4: Force push lên GitHub
```bash
git push origin main --force
```

## Giải pháp 2: Tạo Repo mới (Đơn giản hơn)

Nếu không muốn dọn dẹp history:

### Bước 1: Xóa .git folder
```bash
cd /home/runner/workspace
rm -rf .git
```

### Bước 2: Tạo Git repo mới
```bash
git init
git add .
git commit -m "Initial commit - Hum's Pizza Restaurant"
```

### Bước 3: Kết nối với GitHub repo mới
```bash
# Tạo repo mới trên GitHub: https://github.com/new
# Sau đó chạy:
git remote add origin https://github.com/YOUR_USERNAME/YOUR_NEW_REPO.git
git branch -M main
git push -u origin main
```

## Giải pháp 3: Dùng Object Storage (Tốt nhất cho tương lai)

Video files nên được lưu trên Object Storage thay vì Git:

1. Upload videos lên Replit Object Storage
2. Update code để dùng Object Storage URLs
3. Git chỉ track code, không track media files

## Lưu ý

- Video files hiện tại vẫn ở local, không bị mất
- .gitignore đã được update để không track video nữa
- Chọn 1 trong 3 giải pháp trên tùy theo nhu cầu

## Kiểm tra sau khi fix

```bash
# Kiểm tra không còn file lớn trong history
git rev-list --objects --all | git cat-file --batch-check='%(objectname) %(objecttype) %(objectsize) %(rest)' | awk '/blob/ {if ($3 > 50000000) print $3/1048576 " MB", $4}' | sort -rn

# Nếu không có output = OK!
```
