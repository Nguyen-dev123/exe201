# HOCA Frontend

Frontend application cho HOCA - Nền tảng học tập cùng nhau.

## 🚀 Công nghệ sử dụng

- **React 18** - UI Library
- **Vite** - Build tool
- **React Router** - Routing
- **TanStack Query** - Data fetching & caching
- **Zustand** - State management
- **Socket.io Client** - Real-time communication
- **Axios** - HTTP client
- **React Hook Form** - Form handling
- **Tailwind CSS** - Styling
- **Lucide React** - Icons
- **React Hot Toast** - Notifications

## 📦 Cài đặt

### 1. Clone repository (nếu chưa có)

```bash
git clone <repository-url>
cd hoca-fe
```

### 2. Cài đặt dependencies

```bash
npm install
```

### 3. Cấu hình Environment Variables

Tạo file `.env` trong thư mục root:

```env
VITE_API_URL=http://localhost:3000
VITE_SOCKET_URL=http://localhost:3000
VITE_GOOGLE_CLIENT_ID=your-google-client-id
```

### 4. Chạy development server

```bash
npm run dev
```

Frontend sẽ chạy tại: `http://localhost:3001`

### 5. Build cho production

```bash
npm run build
```

### 6. Preview production build

```bash
npm run preview
```

## 📁 Cấu trúc dự án

```
hoca-fe/
├── public/              # Static files
├── src/
│   ├── components/      # Reusable components
│   │   └── Layout.jsx   # Main layout with navigation
│   ├── pages/           # Page components
│   │   ├── HomePage.jsx
│   │   ├── LoginPage.jsx
│   │   ├── RegisterPage.jsx
│   │   ├── RoomsPage.jsx
│   │   ├── RoomDetailPage.jsx
│   │   ├── ProfilePage.jsx
│   │   └── PricingPage.jsx
│   ├── store/           # Zustand stores
│   │   └── authStore.js
│   ├── lib/             # Utilities
│   │   ├── api.js       # Axios instance
│   │   └── socket.js    # Socket.io client
│   ├── App.jsx          # Main app component
│   ├── main.jsx         # Entry point
│   └── index.css        # Global styles
├── .env                 # Environment variables
├── index.html           # HTML template
├── vite.config.js       # Vite configuration
├── tailwind.config.js   # Tailwind configuration
└── package.json         # Dependencies
```

## 🎯 Tính năng

### ✅ Đã hoàn thành

1. **Authentication**
   - Đăng ký tài khoản
   - Đăng nhập
   - Đăng xuất
   - JWT token management
   - Protected routes

2. **Phòng học (Rooms)**
   - Danh sách phòng học
   - Tạo phòng mới
   - Tham gia phòng
   - Tìm kiếm phòng

3. **Chat Real-time**
   - Socket.io integration
   - Gửi/nhận tin nhắn real-time
   - Hiển thị thành viên online
   - Thông báo join/leave

4. **Profile**
   - Xem thông tin cá nhân
   - Thống kê học tập
   - Huy hiệu & achievements
   - Rank & level

5. **Pricing**
   - Hiển thị các gói dịch vụ
   - So sánh tính năng
   - FAQ

6. **UI/UX**
   - Responsive design
   - Tailwind CSS styling
   - Loading states
   - Error handling
   - Toast notifications

### 🔄 Đang phát triển

- Google OAuth login
- Payment integration (VNPay, PayOS)
- File upload (avatar, documents)
- AI Study Assistant
- Notifications
- Admin dashboard

## 🔌 API Integration

Frontend kết nối với backend API tại `http://localhost:3000`

### Endpoints được sử dụng:

- `POST /api/auth/register` - Đăng ký
- `POST /api/auth/login` - Đăng nhập
- `GET /api/rooms` - Lấy danh sách phòng
- `POST /api/rooms` - Tạo phòng mới
- `GET /api/rooms/:id` - Chi tiết phòng
- `GET /api/users/profile` - Thông tin user

### Socket.io Events:

- `join-room` - Tham gia phòng
- `leave-room` - Rời phòng
- `send-message` - Gửi tin nhắn
- `new-message` - Nhận tin nhắn mới
- `user-joined` - User tham gia
- `user-left` - User rời đi

## 🎨 Styling

Dự án sử dụng **Tailwind CSS** cho styling:

- Utility-first CSS framework
- Responsive design
- Custom color palette
- Component classes

### Theme Colors:

- Primary: Blue (#3b82f6)
- Secondary: Purple (#8b5cf6)
- Success: Green
- Error: Red

## 🔐 Authentication Flow

1. User đăng ký/đăng nhập
2. Backend trả về JWT token
3. Token được lưu trong Zustand store (persist)
4. Mọi API request đều gửi kèm token trong header
5. Protected routes kiểm tra token trước khi render

## 🌐 Deployment

### Vercel (Khuyến nghị)

```bash
npm install -g vercel
vercel
```

### Netlify

```bash
npm run build
# Upload dist folder to Netlify
```

### Environment Variables cho Production

Nhớ cấu hình các biến môi trường:

```
VITE_API_URL=https://your-backend-url.com
VITE_SOCKET_URL=https://your-backend-url.com
VITE_GOOGLE_CLIENT_ID=your-google-client-id
```

## 🐛 Troubleshooting

### Lỗi: Cannot connect to backend

**Giải pháp:**

1. Kiểm tra backend đang chạy tại `http://localhost:3000`
2. Kiểm tra CORS settings trong backend
3. Verify `VITE_API_URL` trong `.env`

### Lỗi: Socket.io not connecting

**Giải pháp:**

1. Kiểm tra backend Socket.io server đang chạy
2. Verify `VITE_SOCKET_URL` trong `.env`
3. Kiểm tra JWT token có hợp lệ

### Lỗi: Module not found

**Giải pháp:**

```bash
rm -rf node_modules package-lock.json
npm install
```

## 📝 Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint (nếu có)

## 🤝 Contributing

1. Fork repository
2. Tạo branch mới (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Tạo Pull Request

## 📄 License

MIT License

## 📞 Support

- **Website**: https://www.hoca.asia
- **Backend Repository**: https://github.com/haomase182227/HOCA-BE

---

**Ngày tạo**: 25/05/2026
**Version**: 1.0.0
**Status**: ✅ Development Ready
