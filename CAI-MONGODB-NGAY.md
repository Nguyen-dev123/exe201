# 🚀 Cài MongoDB Local - 5 Phút

## Tại sao cần MongoDB?

Backend cần MongoDB để lưu trữ:

- Tài khoản người dùng
- Phòng học
- Tin nhắn chat
- Badges, ranks, etc.

## Cách cài nhanh nhất

### Bước 1: Download MongoDB

1. Mở link: https://www.mongodb.com/try/download/community
2. Chọn:
   - Version: Latest
   - Platform: Windows
   - Package: msi
3. Click **Download**

### Bước 2: Cài đặt

1. Chạy file `.msi` vừa tải
2. Click **Next** → **Next**
3. Chọn **Complete**
4. **QUAN TRỌNG**: Tick vào ☑️ **"Install MongoDB as a Service"**
5. Click **Next** → **Install**
6. Đợi cài đặt (2-3 phút)
7. Click **Finish**

### Bước 3: Cập nhật Backend

Mở file `HOCA-BE/.env` và thay đổi dòng MONGODB_URI:

```env
# Thay đổi từ:
MONGODB_URI=mongodb+srv://nguyendinhtuan25224_db_user:MZ7BApD8dnhti79h@exe201.3rnnkdg.mongodb.net/hoca-db

# Thành:
MONGODB_URI=mongodb://localhost:27017/hoca-db
```

### Bước 4: Restart Backend

Backend sẽ tự động restart (nodemon) và kết nối MongoDB local!

Xem log sẽ thấy:

```
✅ MongoDB connected successfully
🚀 Server running at http://localhost:3000
```

### Bước 5: Test Đăng Ký

1. Mở http://localhost:3001/register
2. Điền thông tin:
   - Họ tên: Nguyễn Văn A
   - Email: test@example.com
   - Mật khẩu: 123456
   - Xác nhận mật khẩu: 123456
3. Click **Đăng ký**
4. Thành công! → Chuyển sang trang đăng nhập

## ✅ Xong!

Bây giờ bạn có thể:

- ✅ Đăng ký tài khoản
- ✅ Đăng nhập
- ✅ Tạo phòng học
- ✅ Chat real-time
- ✅ Xem profile

## 🔍 Kiểm tra MongoDB đang chạy

```bash
# Windows
netstat -ano | findstr :27017
```

Nếu thấy kết quả → MongoDB đang chạy!

## 🐛 Nếu gặp lỗi

### Lỗi: MongoDB service không start

```bash
# Mở Services (Win + R → services.msc)
# Tìm "MongoDB Server"
# Click phải → Start
```

### Lỗi: Port 27017 đã được sử dụng

```bash
# Kill process
netstat -ano | findstr :27017
taskkill /PID <PID> /F
```

## 💡 Lưu ý

- MongoDB sẽ tự động chạy khi khởi động Windows
- Data được lưu tại: `C:\Program Files\MongoDB\Server\<version>\data`
- Không cần cấu hình gì thêm!

---

**Sau khi cài xong, refresh trang đăng ký và thử lại!** 🎉
