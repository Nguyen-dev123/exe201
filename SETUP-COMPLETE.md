# HOCA - Hướng dẫn Setup Hoàn chỉnh

## 📋 Tổng quan

Dự án HOCA bao gồm:

- **Backend (HOCA-BE)**: Node.js + Fastify + MongoDB + Socket.io
- **Frontend (hoca-fe)**: React + Vite + Tailwind CSS + Socket.io Client

---

## 🚀 Bước 1: Setup Backend

### 1.1. Di chuyển vào thư mục backend

```bash
cd HOCA-BE
```

### 1.2. Cài đặt dependencies

```bash
npm install
```

### 1.3. Cấu hình file .env

File `.env` đã được tạo sẵn với MongoDB connection string của bạn:

```env
PORT=3000
MONGODB_URI=mongodb+srv://nguyendinhtuan25224_db_user:MZ7BApD8dnhti79h@exe201.3rnnkdg.mongodb.net/hoca-db?retryWrites=true&w=majority
JWT_SECRET=your-secret-key-here
```

### 1.4. Chạy backend

```bash
npm run dev
```

Backend sẽ chạy tại: **http://localhost:3000**

---

## 🎨 Bước 2: Setup Frontend

### 2.1. Mở terminal mới và di chuyển vào thư mục frontend

```bash
cd hoca-fe
```

### 2.2. Cài đặt dependencies

```bash
npm install
```

### 2.3. Kiểm tra file .env

File `.env` đã được tạo sẵn:

```env
VITE_API_URL=http://localhost:3000
VITE_SOCKET_URL=http://localhost:3000
```

### 2.4. Chạy frontend

```bash
npm run dev
```

Frontend sẽ chạy tại: **http://localhost:3001**

---

## ✅ Bước 3: Kiểm tra

### 3.1. Kiểm tra Backend

Mở trình duyệt và truy cập:

- http://localhost:3000 - Xem thông tin API
- http://localhost:3000/health - Health check

### 3.2. Kiểm tra Frontend

Mở trình duyệt và truy cập:

- http://localhost:3001 - Trang chủ HOCA

### 3.3. Test đầy đủ

1. **Đăng ký tài khoản mới**
   - Vào http://localhost:3001/register
   - Điền thông tin và đăng ký

2. **Đăng nhập**
   - Vào http://localhost:3001/login
   - Đăng nhập với tài khoản vừa tạo

3. **Tạo phòng học**
   - Sau khi đăng nhập, vào "Phòng học"
   - Click "Tạo phòng mới"
   - Nhập tên và mô tả phòng

4. **Chat real-time**
   - Vào phòng học vừa tạo
   - Gửi tin nhắn
   - Mở tab mới, đăng nhập tài khoản khác và tham gia cùng phòng
   - Test chat real-time

---

## 📁 Cấu trúc dự án

```
exe/
├── HOCA-BE/                 # Backend
│   ├── src/
│   │   ├── config/         # Database, env config
│   │   ├── models/         # Mongoose models
│   │   ├── routes/         # API routes
│   │   ├── controllers/    # Business logic
│   │   ├── services/       # Services
│   │   ├── middlewares/    # Middlewares
│   │   ├── jobs/           # Cron jobs
│   │   ├── socket/         # Socket.io handlers
│   │   └── index.js        # Entry point
│   ├── .env                # Environment variables
│   ├── package.json
│   └── SETUP-GUIDE.md
│
├── hoca-fe/                # Frontend
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── pages/          # Page components
│   │   ├── store/          # Zustand stores
│   │   ├── lib/            # Utilities (api, socket)
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── .env
│   ├── package.json
│   └── README.md
│
└── SETUP-COMPLETE.md       # File này
```

---

## 🎯 Tính năng đã hoàn thành

### Backend

✅ Authentication (Register, Login, JWT)
✅ User Management
✅ Room Management (CRUD)
✅ Real-time Chat (Socket.io)
✅ MongoDB Integration
✅ CORS Configuration
✅ Error Handling
✅ Cron Jobs (Streak, Cleanup)

### Frontend

✅ Responsive Design
✅ Authentication UI (Login, Register)
✅ Home Page
✅ Rooms List & Create
✅ Room Detail với Chat Real-time
✅ Profile Page
✅ Pricing Page
✅ Protected Routes
✅ Toast Notifications
✅ Loading States

---

## 🔧 Troubleshooting

### Lỗi: Backend không kết nối được MongoDB

**Giải pháp:**

1. Kiểm tra internet connection
2. Verify MongoDB Atlas connection string
3. Kiểm tra IP whitelist trong MongoDB Atlas

### Lỗi: Frontend không gọi được API

**Giải pháp:**

1. Đảm bảo backend đang chạy tại port 3000
2. Kiểm tra CORS settings trong backend
3. Xem console log trong browser (F12)

### Lỗi: Socket.io không kết nối

**Giải pháp:**

1. Đảm bảo đã đăng nhập (có JWT token)
2. Kiểm tra backend Socket.io server
3. Xem Network tab trong browser DevTools

### Lỗi: Port already in use

**Giải pháp:**

```bash
# Windows - Kill process on port 3000
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Hoặc đổi port trong .env
```

---

## 📝 API Endpoints

### Authentication

- `POST /api/auth/register` - Đăng ký
- `POST /api/auth/login` - Đăng nhập
- `POST /api/auth/google` - Google OAuth

### Rooms

- `GET /api/rooms` - Danh sách phòng
- `POST /api/rooms` - Tạo phòng mới
- `GET /api/rooms/:id` - Chi tiết phòng
- `PUT /api/rooms/:id` - Cập nhật phòng
- `DELETE /api/rooms/:id` - Xóa phòng

### Users

- `GET /api/users` - Danh sách users
- `GET /api/users/:id` - Chi tiết user
- `PUT /api/users/:id` - Cập nhật user

### Other

- `/api/chat` - Chat messages
- `/api/badges` - Badges
- `/api/ranks` - Ranks
- `/api/pricing` - Pricing plans
- `/api/payment` - Payment (VNPay, PayOS)
- `/api/ai` - AI Study Assistant

---

## 🌐 Socket.io Events

### Client → Server

- `join-room` - Tham gia phòng
- `leave-room` - Rời phòng
- `send-message` - Gửi tin nhắn

### Server → Client

- `new-message` - Tin nhắn mới
- `user-joined` - User tham gia
- `user-left` - User rời đi

---

## 🚀 Next Steps

### Tính năng cần phát triển thêm:

1. Google OAuth Integration
2. Payment Integration (VNPay, PayOS)
3. File Upload (Avatar, Documents)
4. AI Study Assistant
5. Push Notifications
6. Admin Dashboard
7. Analytics & Reports
8. Email Verification
9. Password Reset
10. Dark Mode

### Deployment:

1. **Backend**: Deploy lên Render/Railway/Heroku
2. **Frontend**: Deploy lên Vercel/Netlify
3. **Database**: MongoDB Atlas (đã có)

---

## 📞 Support

- **Backend Repo**: https://github.com/haomase182227/HOCA-BE
- **Website**: https://www.hoca.asia

---

## 🎉 Hoàn thành!

Bạn đã setup thành công HOCA platform với:

- ✅ Backend API server với MongoDB
- ✅ Frontend React application
- ✅ Real-time chat với Socket.io
- ✅ Authentication & Authorization
- ✅ Responsive UI với Tailwind CSS

**Truy cập:** http://localhost:3001 để bắt đầu sử dụng!

---

**Ngày setup**: 25/05/2026
**Version**: 1.0.0
**Status**: ✅ Ready to use
