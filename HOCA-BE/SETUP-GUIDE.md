# HOCA Backend - Hướng dẫn Setup và Cài đặt

## 📋 Tổng quan dự án

**HOCA-BE** là backend API server cho ứng dụng HOCA, được xây dựng với:

- **Framework**: Fastify (Node.js)
- **Database**: MongoDB Atlas
- **Real-time**: Socket.io
- **Authentication**: JWT, Google OAuth
- **Payment**: VNPay, PayOS
- **File Upload**: Cloudinary
- **Email**: Nodemailer

---

## 🚀 Các bước đã thực hiện

### 1. Clone Repository

```bash
git clone https://github.com/haomase182227/HOCA-BE.git
cd HOCA-BE
```

### 2. Cài đặt Dependencies

```bash
npm install
```

**Dependencies chính:**

- `fastify` - Web framework
- `mongoose` - MongoDB ODM
- `socket.io` - Real-time communication
- `@fastify/jwt` - JWT authentication
- `bcrypt` - Password hashing
- `cloudinary` - Image upload
- `nodemailer` - Email service
- `@payos/node` - PayOS payment
- `axios` - HTTP client
- `dotenv` - Environment variables
- `node-cron` - Scheduled jobs

### 3. Cấu hình Environment Variables

Tạo file `.env` trong thư mục root với nội dung:

```env
# Server Configuration
PORT=3000
NODE_ENV=development

# Database
MONGODB_URI=mongodb+srv://nguyendinhtuan25224_db_user:MZ7BApD8dnhti79h@exe201.3rnnkdg.mongodb.net/hoca-db?retryWrites=true&w=majority

# JWT
JWT_SECRET=your-secret-key-here

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# VNPay Payment Gateway
VNPAY_TMN_CODE=your-vnpay-tmn-code
VNPAY_HASH_SECRET=your-vnpay-hash-secret
VNPAY_URL=https://sandbox.vnpayment.vn/paymentv2/vpcpay.html
VNPAY_RETURN_URL=http://localhost:3000/api/payment/vnpay/return

# PayOS Payment Gateway
PAYOS_CLIENT_ID=your-payos-client-id
PAYOS_API_KEY=your-payos-api-key
PAYOS_CHECKSUM_KEY=your-payos-checksum-key

# Client URL
CLIENT_URL=http://localhost:3001

# Email Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-email-password
EMAIL_SECURE=false

# Email Microservice (optional)
EMAIL_SERVICE_URL=
EMAIL_SERVICE_API_KEY=

# Cloudinary
CLOUDINARY_CLOUD_NAME=your-cloudinary-cloud-name
CLOUDINARY_API_KEY=your-cloudinary-api-key
CLOUDINARY_API_SECRET=your-cloudinary-api-secret
```

### 4. Kết nối MongoDB Atlas

**MongoDB Connection String:**

```
mongodb+srv://nguyendinhtuan25224_db_user:MZ7BApD8dnhti79h@exe201.3rnnkdg.mongodb.net/hoca-db?retryWrites=true&w=majority
```

**Database:** `hoca-db`

### 5. Chạy Server

**Development mode (với nodemon):**

```bash
npm run dev
```

**Production mode:**

```bash
npm start
```

**Seed database:**

```bash
npm run seed
```

---

## 🌐 API Endpoints

Server chạy tại: `http://localhost:3000`

### Root & Health Check

- `GET /` - Thông tin API
- `GET /health` - Health check

### Authentication

- `POST /api/auth/register` - Đăng ký
- `POST /api/auth/login` - Đăng nhập
- `POST /api/auth/google` - Google OAuth

### User Management

- `GET /api/users` - Danh sách users
- `GET /api/users/:id` - Chi tiết user
- `PUT /api/users/:id` - Cập nhật user
- `DELETE /api/users/:id` - Xóa user

### Room Management

- `GET /api/rooms` - Danh sách phòng học
- `POST /api/rooms` - Tạo phòng mới
- `GET /api/rooms/:id` - Chi tiết phòng
- `PUT /api/rooms/:id` - Cập nhật phòng
- `DELETE /api/rooms/:id` - Xóa phòng

### Payment

- `POST /api/payment/vnpay/create` - Tạo thanh toán VNPay
- `GET /api/payment/vnpay/return` - VNPay callback
- `POST /api/payment/payos/create` - Tạo thanh toán PayOS

### Other Endpoints

- `/api/feedback` - Feedback
- `/api/pricing` - Pricing plans
- `/api/reports` - Reports
- `/api/admin` - Admin functions
- `/api/ads` - Advertisements
- `/api/badges` - User badges
- `/api/chat` - Chat messages
- `/api/quotes` - Motivational quotes
- `/api/upload` - File upload
- `/api/ranks` - User ranks
- `/api/notifications` - Notifications
- `/api/cron` - Cron jobs
- `/api/ai` - AI Study Assistant
- `/api/stickers` - Stickers

---

## 🔧 Cấu trúc dự án

```
HOCA-BE/
├── src/
│   ├── config/          # Cấu hình (database, env)
│   ├── models/          # Mongoose models
│   ├── routes/          # API routes
│   ├── controllers/     # Business logic
│   ├── services/        # Services
│   ├── middlewares/     # Middlewares
│   ├── jobs/            # Cron jobs
│   ├── socket/          # Socket.io handlers
│   ├── app.js           # Fastify app setup
│   └── index.js         # Entry point
├── .env                 # Environment variables
├── package.json         # Dependencies
├── Dockerfile           # Docker configuration
└── render.yaml          # Render deployment config
```

---

## ⚙️ Features đã được cấu hình

### 1. Database Connection

- ✅ MongoDB Atlas connected
- ✅ Mongoose schemas initialized
- ✅ Default ranks seeded

### 2. Authentication & Authorization

- ✅ JWT authentication
- ✅ Google OAuth integration
- ✅ Password hashing with bcrypt

### 3. Real-time Communication

- ✅ Socket.io configured
- ✅ CORS enabled for multiple origins
- ✅ Room-based messaging

### 4. Payment Integration

- ✅ VNPay gateway
- ✅ PayOS gateway

### 5. File Upload

- ✅ Cloudinary integration
- ✅ Multipart form support

### 6. Email Service

- ✅ Nodemailer configured
- ✅ SMTP support

### 7. Scheduled Jobs

- ✅ Streak maintenance (midnight)
- ✅ Room auto-close (every minute)
- ✅ Inactive account cleanup (hourly)

### 8. Security

- ✅ CORS configured
- ✅ JWT secret
- ✅ Environment variables

---

## 🐛 Troubleshooting

### Lỗi: MongoDB connection error

**Nguyên nhân:** Thiếu hoặc sai MONGODB_URI trong file `.env`

**Giải pháp:**

1. Kiểm tra file `.env` có tồn tại
2. Verify connection string MongoDB Atlas
3. Kiểm tra network access trong MongoDB Atlas

### Lỗi: Port already in use

**Nguyên nhân:** Port 3000 đang được sử dụng

**Giải pháp:**

```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Hoặc đổi PORT trong .env
PORT=3001
```

### Lỗi: Module not found

**Nguyên nhân:** Dependencies chưa được cài đặt

**Giải pháp:**

```bash
npm install
```

---

## 📝 Notes

### Cron Jobs

- **Streak Maintenance**: Chạy lúc nửa đêm để reset streak
- **Room Auto-close**: Chạy mỗi phút để đóng phòng không hoạt động
- **Cleanup Job**: Chạy mỗi giờ để xóa tài khoản chưa verify sau 24h

### Socket.io Configuration

- **Ping Timeout**: 60s
- **Ping Interval**: 25s
- **Transports**: polling, websocket
- **CORS**: Enabled cho localhost và hoca.asia

### Security Warnings

- ⚠️ Có 17 vulnerabilities trong dependencies (8 moderate, 8 high, 1 critical)
- Chạy `npm audit fix` để fix các lỗi không breaking
- Chạy `npm audit fix --force` để fix tất cả (có thể breaking)

---

## 🎯 Next Steps

1. **Cấu hình các services:**
   - Google OAuth credentials
   - VNPay merchant account
   - PayOS account
   - Cloudinary account
   - Email SMTP

2. **Setup Frontend:**
   - Clone frontend repository (nếu có)
   - Cấu hình API endpoint trỏ về `http://localhost:3000`

3. **Testing:**
   - Test API endpoints với Postman/Thunder Client
   - Test Socket.io connection
   - Test payment flows

4. **Deployment:**
   - Setup trên Render/Vercel/Railway
   - Cấu hình environment variables
   - Setup domain và SSL

---

## 📞 Support

- **Repository**: https://github.com/haomase182227/HOCA-BE
- **Website**: https://www.hoca.asia

---

**Ngày setup**: 25/05/2026
**Version**: 1.0.0
**Status**: ✅ Running successfully
