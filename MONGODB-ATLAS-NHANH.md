# ⚡ LẤY CONNECTION STRING MONGODB - NHANH

## 🚀 Làm theo 6 bước này:

### 1️⃣ Vào MongoDB Atlas

```
https://cloud.mongodb.com/
```

→ Đăng nhập

---

### 2️⃣ Click "Database" bên trái

→ Thấy cluster **exe201**

---

### 3️⃣ Click nút "Connect"

→ Chọn **Drivers** (hoặc **Connect your application**)

---

### 4️⃣ Chọn Driver

- **Driver**: Node.js
- **Version**: 4.1 or later

---

### 5️⃣ Copy Connection String

Bạn sẽ thấy:

```
mongodb+srv://nguyendinhtuan25224_db_user:<password>@exe201.3rnnkdg.mongodb.net/?retryWrites=true&w=majority&appName=exe201
```

**Thay `<password>` bằng**: `nguyendinhtuan`

**Thêm `/hoca-db` sau `.mongodb.net`**

Kết quả cuối cùng:

```
mongodb+srv://nguyendinhtuan25224_db_user:nguyendinhtuan@exe201.3rnnkdg.mongodb.net/hoca-db?retryWrites=true&w=majority&appName=exe201
```

---

### 6️⃣ Gửi cho tôi

**Copy connection string đầy đủ** và paste vào chat, tôi sẽ cập nhật vào `.env`.

---

## 🔥 HOẶC tự làm:

1. Mở file: `HOCA-BE/.env`
2. Tìm dòng: `MONGODB_URI=...`
3. Thay bằng connection string mới
4. Save file (Ctrl+S)
5. Backend tự động restart
6. Xem logs → Nếu thấy "✅ MongoDB connected successfully" = Thành công!

---

## ❓ Không tìm thấy "Standard Connection String"?

Không sao! Dùng connection string dạng `mongodb+srv://` cũng được.

Chỉ cần:

1. Thay `<password>` bằng mật khẩu thật
2. Thêm `/hoca-db` sau `.mongodb.net`
3. Gửi cho tôi hoặc tự update vào `.env`

---

## 🎯 Mục tiêu

Sau khi update connection string:

- ✅ Backend kết nối MongoDB thành công
- ✅ Đăng ký/đăng nhập lưu vào database
- ✅ Dữ liệu không mất khi restart
- ✅ Tất cả tính năng hoạt động đầy đủ

---

**Bắt đầu ngay! Vào https://cloud.mongodb.com/**
