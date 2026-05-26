# 🎉 HƯỚNG DẪN SỬ DỤNG HOCA

## ✅ Trạng thái hiện tại

- ✅ **Backend**: Đang chạy tại http://localhost:3000
- ✅ **Frontend**: Đang chạy tại http://localhost:3001
- ⚠️ **MongoDB**: Chưa kết nối (đang chạy ở chế độ development)

## 🚀 Cách sử dụng ngay bây giờ

### 1. Truy cập Website

Mở trình duyệt và vào: **http://localhost:3001**

### 2. Xem giao diện

Bạn sẽ thấy:

- ✅ Trang chủ với design đẹp (dark theme, màu cam)
- ✅ Navigation menu
- ✅ Hero section với gradient
- ✅ Features section
- ✅ Pricing section
- ✅ Community rules

### 3. Test Đăng ký/Đăng nhập

**Lưu ý**: Do MongoDB chưa kết nối, đăng ký/đăng nhập sẽ báo lỗi. Nhưng bạn có thể:

- ✅ Xem giao diện đăng nhập/đăng ký (giống y hệt HOCA.asia)
- ✅ Test form validation
- ✅ Xem animations và transitions

**Để test:**

1. Click "Đăng ký" trên header
2. Xem giao diện split-screen đẹp
3. Điền thông tin (sẽ báo lỗi khi submit do chưa có DB)

## 🔧 Để có đầy đủ chức năng

### Cách 1: Kết nối MongoDB Atlas (Khuyến nghị)

1. **Kiểm tra MongoDB Atlas**:
   - Đăng nhập: https://cloud.mongodb.com/
   - Vào "Network Access" → Thêm IP của bạn hoặc `0.0.0.0/0`
   - Vào "Database" → Click "Connect" → Copy connection string mới

2. **Cập nhật file `.env`**:

```bash
cd HOCA-BE
# Mở file .env và cập nhật MONGODB_URI
```

3. **Restart backend**:
   - Backend sẽ tự động restart (nodemon)
   - Hoặc stop và start lại

### Cách 2: Cài MongoDB Local

1. **Download MongoDB Community**:
   - https://www.mongodb.com/try/download/community
   - Cài đặt với default settings

2. **Cập nhật `.env`**:

```env
MONGODB_URI=mongodb://localhost:27017/hoca-db
```

3. Backend sẽ tự động kết nối

## 📱 Các tính năng có thể test ngay

### ✅ Không cần MongoDB:

- Xem trang chủ
- Xem pricing
- Xem giao diện đăng nhập/đăng ký
- Test responsive design
- Xem animations

### ⚠️ Cần MongoDB:

- Đăng ký tài khoản
- Đăng nhập
- Tạo phòng học
- Chat real-time
- Profile với badges

## 🎨 Giao diện đã hoàn thành

### Trang chủ (/)

- ✅ Hero section với gradient cam
- ✅ Badge "10,000+ học sinh"
- ✅ Video call preview mockup
- ✅ 6 tính năng nổi bật
- ✅ Pricing comparison (Free vs HOCA+)
- ✅ Mission section với stats
- ✅ Community rules (4 quy tắc)
- ✅ CTA section
- ✅ Footer

### Đăng nhập (/login)

- ✅ Split-screen design
- ✅ Gradient background bên trái
- ✅ Form đăng nhập bên phải
- ✅ Tabs chuyển đổi
- ✅ Show/hide password
- ✅ Google OAuth button
- ✅ Form validation

### Đăng ký (/register)

- ✅ Giống design đăng nhập
- ✅ Thêm field Họ tên
- ✅ Xác nhận mật khẩu
- ✅ Validation đầy đủ

## 🔍 Kiểm tra Backend

### Test API:

```bash
# Health check
curl http://localhost:3000/health

# Root endpoint
curl http://localhost:3000
```

### Xem logs:

Backend logs sẽ hiển thị:

```
✅ MongoDB connected successfully  (nếu có DB)
⚠️  Continuing without MongoDB (development mode)  (nếu không có DB)
🚀 Server running at http://localhost:3000
```

## 📂 Cấu trúc dự án

```
exe/
├── HOCA-BE/                    # Backend
│   ├── src/
│   │   ├── config/            # Database, env
│   │   ├── models/            # Mongoose models
│   │   ├── routes/            # API routes
│   │   ├── controllers/       # Business logic
│   │   └── index.js           # Entry point
│   ├── .env                   # Environment variables
│   └── package.json
│
├── hoca-fe/                   # Frontend
│   ├── src/
│   │   ├── components/        # React components
│   │   │   └── Layout.jsx     # Navigation & Footer
│   │   ├── pages/             # Pages
│   │   │   ├── HomePage.jsx   # Trang chủ
│   │   │   ├── LoginPage.jsx  # Đăng nhập
│   │   │   ├── RegisterPage.jsx # Đăng ký
│   │   │   ├── RoomsPage.jsx  # Danh sách phòng
│   │   │   └── ...
│   │   ├── store/             # Zustand state
│   │   ├── lib/               # API & Socket
│   │   └── index.css          # Global styles
│   ├── .env                   # Frontend config
│   └── package.json
│
├── FIX-MONGODB-CONNECTION.md  # Hướng dẫn fix MongoDB
└── HUONG-DAN-SU-DUNG.md       # File này
```

## 🎯 Next Steps

1. **Fix MongoDB connection** (xem file `FIX-MONGODB-CONNECTION.md`)
2. **Test đăng ký/đăng nhập** sau khi có DB
3. **Tạo phòng học** và test chat real-time
4. **Customize** theo ý bạn

## 💡 Tips

- Frontend tự động reload khi bạn sửa code (Vite HMR)
- Backend tự động restart khi sửa code (nodemon)
- Mở DevTools (F12) để xem console logs
- Xem Network tab để debug API calls

## 🐛 Troubleshooting

### Frontend không load?

```bash
cd hoca-fe
npm run dev
```

### Backend không chạy?

```bash
cd HOCA-BE
npm run dev
```

### Port đã được sử dụng?

```bash
# Kill process trên port 3000
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Kill process trên port 3001
netstat -ano | findstr :3001
taskkill /PID <PID> /F
```

## 📞 Cần hỗ trợ?

1. Đọc file `FIX-MONGODB-CONNECTION.md`
2. Đọc file `SETUP-COMPLETE.md`
3. Check console logs trong browser (F12)
4. Check terminal logs của backend

---

**Chúc bạn code vui vẻ! 🚀**
