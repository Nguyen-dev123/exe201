# 💾 CÀI MONGODB LOCAL - ĐỠN GIẢN NHẤT

## 🎯 Tại sao cài MongoDB local?

- ✅ Không cần internet để chạy
- ✅ Không cần config DNS
- ✅ Không cần MongoDB Atlas
- ✅ Chỉ cần download và cài đặt
- ✅ Tôi sẽ tự động config cho bạn

---

## 📥 BƯỚC 1: Download MongoDB

### Link download:

```
https://www.mongodb.com/try/download/community
```

### Chọn:

- **Version**: 7.0.x (hoặc mới nhất)
- **Platform**: Windows
- **Package**: MSI

### Click nút: **Download**

File sẽ nặng khoảng 300-400MB.

---

## 📦 BƯỚC 2: Cài đặt MongoDB

1. **Mở file vừa download** (mongodb-windows-x86_64-xxx.msi)

2. Click **Next** → **Next**

3. Chọn **Complete** (cài đặt đầy đủ)

4. Click **Next**

5. **QUAN TRỌNG**: Ở màn hình "Service Configuration":
   - ✅ Để tick **Install MongoDB as a Service**
   - ✅ Để tick **Run service as Network Service user**
   - ✅ Để mặc định **Data Directory** và **Log Directory**
   - Click **Next**

6. **Bỏ tick** "Install MongoDB Compass" (không cần)

7. Click **Install**

8. Đợi cài đặt (2-3 phút)

9. Click **Finish**

---

## ✅ BƯỚC 3: Kiểm tra MongoDB đã chạy chưa

Mở Command Prompt và chạy:

```cmd
mongosh --version
```

### ✅ Nếu thấy:

```
2.x.x
```

→ MongoDB đã cài thành công!

### ❌ Nếu báo lỗi:

```
'mongosh' is not recognized...
```

→ Restart máy và thử lại

---

## 🔧 BƯỚC 4: Tôi sẽ tự động config

Sau khi bạn cài xong MongoDB, **CHỈ CẦN NÓI "đã cài xong"**, tôi sẽ:

1. ✅ Update file `.env` với connection string local
2. ✅ Restart backend
3. ✅ Kiểm tra kết nối
4. ✅ Seed dữ liệu mẫu (nếu cần)

---

## 🎯 Sau khi cài xong

MongoDB sẽ:

- ✅ Tự động chạy khi khởi động máy
- ✅ Chạy ở background (không thấy cửa sổ)
- ✅ Lắng nghe ở port 27017
- ✅ Sẵn sàng cho backend kết nối

---

## 💡 Lưu ý

- MongoDB local sẽ lưu dữ liệu trong máy bạn
- Không cần internet để chạy
- Dữ liệu không bị mất khi restart máy
- Chỉ bạn mới truy cập được (không public)

---

## 🚀 Tóm tắt

1. Download MongoDB từ link trên
2. Cài đặt với default settings
3. Nói với tôi "đã cài xong"
4. Tôi sẽ config và restart backend
5. ✅ Xong! Bạn có thể đăng nhập vào web

---

**Bắt đầu download ngay: https://www.mongodb.com/try/download/community**

Sau khi cài xong, chỉ cần nói "đã cài xong" là tôi sẽ lo phần còn lại!
