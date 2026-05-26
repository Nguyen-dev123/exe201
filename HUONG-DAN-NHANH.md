# ⚡ HƯỚNG DẪN NHANH - ĐĂNG NHẬP VÀO HOCA

## 🎯 3 BƯỚC ĐƠN GIẢN

### BƯỚC 1: Mở trình duyệt

```
Vào: http://localhost:3001
```

### BƯỚC 2: Đăng ký tài khoản

```
1. Click nút "Đăng ký" trên header
2. Điền thông tin:
   - Họ tên: Nguyễn Văn A
   - Email: test@example.com
   - Mật khẩu: 123456
   - Xác nhận: 123456
3. Click "Đăng ký"
```

### BƯỚC 3: Đăng nhập

```
1. Nhập email: test@example.com
2. Nhập mật khẩu: 123456
3. Click "Đăng nhập"
4. ✅ Xong! Bạn sẽ vào trang Rooms
```

---

## ❌ NẾU GẶP LỖI

### Lỗi: "Email đã tồn tại"

→ Dùng email khác: test2@example.com, test3@example.com...

### Lỗi: "Email hoặc mật khẩu không đúng"

→ Đăng ký lại tài khoản mới (backend có thể đã restart)

### Lỗi: Không vào được trang sau khi đăng nhập

→ Làm theo:

```
1. Nhấn F12 (mở DevTools)
2. Vào tab "Application"
3. Click "Local Storage" → "http://localhost:3001"
4. Xóa key "hoca-auth"
5. Refresh trang (F5)
6. Đăng ký và đăng nhập lại
```

---

## 🧪 TEST NHANH

### Vào trang test:

```
http://localhost:3001/test
```

Click 3 nút để test:

1. ✅ Test Backend Connection
2. ✅ Test Register
3. ✅ Test Login

Nếu cả 3 đều hiển thị ✅ = Hệ thống hoạt động tốt!

---

## 📱 CÁC TRANG CÓ THỂ TRUY CẬP

### Không cần đăng nhập:

- http://localhost:3001/ (Trang chủ)
- http://localhost:3001/login (Đăng nhập)
- http://localhost:3001/register (Đăng ký)
- http://localhost:3001/pricing (Bảng giá)
- http://localhost:3001/test (Test API)

### Cần đăng nhập:

- http://localhost:3001/rooms (Danh sách phòng)
- http://localhost:3001/profile (Profile)

---

## 🔥 LƯU Ý

⚠️ **Backend đang dùng mock auth (không có MongoDB)**

- Dữ liệu lưu trong memory
- Khi restart backend, tài khoản sẽ mất
- Cần đăng ký lại sau mỗi lần restart

✅ **Để có dữ liệu lâu dài**

- Cần kết nối MongoDB (xem file FIX-MONGODB-CONNECTION.md)

---

## 🎬 VIDEO DEMO FLOW

```
1. Mở http://localhost:3001
   ↓
2. Click "Đăng ký" trên header
   ↓
3. Điền form đăng ký
   ↓
4. Click "Đăng ký" → Thấy toast "Đăng ký thành công!"
   ↓
5. Tự động chuyển sang tab "Đăng nhập"
   ↓
6. Nhập email + password vừa đăng ký
   ↓
7. Click "Đăng nhập" → Thấy toast "Đăng nhập thành công!"
   ↓
8. Tự động chuyển đến trang /rooms
   ↓
9. ✅ XONG! Bạn đã đăng nhập thành công
```

---

**Nếu vẫn gặp vấn đề, xem file: TRANG-THAI-HIEN-TAI.md**
