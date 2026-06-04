# ⚡ HOCA - QUICK START GUIDE

**5 phút để chạy hệ thống!**

---

## 🚀 1. KHỞI ĐỘNG BACKEND

```bash
cd HOCA-BE
npm start
```

**URL:** http://localhost:3000  
**Health check:** http://localhost:3000/health

### Nếu lỗi:

```bash
# Kiểm tra MongoDB connection
# Cài dependencies nếu thiếu
npm install
```

---

## 🎨 2. KHỞI ĐỘNG FRONTEND

```bash
cd hoca-fe
npm run dev
```

**URL:** http://localhost:3001

### Nếu lỗi:

```bash
# Cài dependencies
npm install
```

---

## 💾 3. SEED DỮ LIỆU GÓI GIÁ

**Cách 1: Qua API (Nhanh nhất)**

```bash
# PowerShell
Invoke-WebRequest -Method POST -Uri "http://localhost:3000/api/pricing/seed" -ContentType "application/json" -Body "{}"

# curl (Git Bash)
curl -X POST http://localhost:3000/api/pricing/seed -H "Content-Type: application/json" -d "{}"
```

**Cách 2: Browser**

```
Mở Postman hoặc Thunder Client
POST http://localhost:3000/api/pricing/seed
Body: {}
Send
```

**Kết quả:**

```json
{
  "message": "Seed thành công!",
  "count": 3,
  "plans": [...]
}
```

---

## ✅ 4. XÁC NHẬN HOẠT ĐỘNG

### Kiểm tra Backend

```bash
# Lấy danh sách gói giá
curl http://localhost:3000/api/pricing
```

**Expect:**

```json
[
  { "name": "Gói Tháng Premium", "price": 99000, "tier": "MONTHLY" },
  { "name": "Gói Năm Premium", "price": 500000, "tier": "YEARLY" },
  { "name": "Gói vĩnh viễn", "price": 999000, "tier": "LIFETIME" }
]
```

### Kiểm tra Frontend

1. Mở http://localhost:3001
2. Vào trang Pricing
3. Thấy 3 gói giá hiển thị ✅

---

## 🎯 5. ĐĂNG KÝ TÀI KHOẢN

1. Click "Đăng ký"
2. Nhập email, password, tên
3. Nhận OTP qua email
4. Nhập OTP để kích hoạt
5. Login vào hệ thống

---

## 📝 FILES QUAN TRỌNG

| File                          | Mục đích                   |
| ----------------------------- | -------------------------- |
| `BAO-CAO-KIEM-TRA-WEBSITE.md` | Báo cáo toàn diện hệ thống |
| `SECURITY-FIXES-COMPLETED.md` | Security checklist         |
| `README-SUMMARY.md`           | Tóm tắt tất cả công việc   |
| `QUICK-START.md`              | File này                   |

---

## 🔧 TROUBLESHOOTING

### Backend không chạy

```bash
# Kiểm tra port 3000 đã bị chiếm chưa
netstat -ano | findstr :3000

# Kill process nếu cần
taskkill /PID <PID> /F

# Restart
npm start
```

### Frontend không hiển thị gói giá

```bash
# Check console logs (F12)
# Ensure backend running
# Clear browser cache (Ctrl+Shift+R)

# Seed lại data
POST http://localhost:3000/api/pricing/seed
```

### MongoDB connection failed

```
❌ Error: ECONNREFUSED _mongodb._tcp.exe201.3rnnkdg.mongodb.net

💡 Solutions:
1. Check internet connection
2. Check MongoDB Atlas IP whitelist
3. Verify MONGODB_URI in .env
4. Try again after few minutes
```

---

## 🎮 TESTING

### Rate Limiting

```powershell
# Test global limit (100 requests)
1..101 | ForEach-Object { Invoke-WebRequest http://localhost:3000/api/pricing -ErrorAction SilentlyContinue }
# Request #101 → 429 Too Many Requests
```

### Auth Rate Limit

```powershell
# Test auth limit (5 attempts)
1..6 | ForEach-Object {
  Invoke-WebRequest -Method POST http://localhost:3000/api/auth/login `
    -ContentType "application/json" `
    -Body '{"email":"test@test.com","password":"wrong"}' `
    -ErrorAction SilentlyContinue
}
# Request #6 → 429
```

---

## 🌐 PRODUCTION DEPLOYMENT

### Environment Variables

```bash
# Backend (.env)
NODE_ENV=production
MONGODB_URI=<production-mongodb-uri>
JWT_SECRET=<strong-random-secret>
CLIENT_URL=https://hoca.asia

# Frontend (.env)
VITE_API_URL=https://api.hoca.asia
```

### Build

```bash
# Backend - No build needed (Node.js)
# Just deploy src folder

# Frontend
npm run build
# Deploy dist folder to Vercel/Netlify
```

---

## 📊 SYSTEM STATUS

| Component     | Status       | URL                   |
| ------------- | ------------ | --------------------- |
| Backend       | ✅ Running   | http://localhost:3000 |
| Frontend      | ✅ Running   | http://localhost:3001 |
| Database      | ✅ Connected | MongoDB Atlas         |
| Socket.io     | ✅ Active    | ws://localhost:3000   |
| Rate Limiting | ✅ Active    | 100 req/15min         |
| AI Assistant  | ✅ Ready     | Groq LLaMA 70B        |

---

## 🎯 NEXT STEPS

1. [ ] Test rate limiting
2. [ ] Create test accounts
3. [ ] Test room creation
4. [ ] Test WebRTC video
5. [ ] Test AI assistant
6. [ ] Test payment flow (DEV mode)
7. [ ] Review security report
8. [ ] Plan feature additions

---

## 🆘 NEED HELP?

**Read these first:**

1. `BAO-CAO-KIEM-TRA-WEBSITE.md` - Comprehensive report
2. `SECURITY-FIXES-COMPLETED.md` - Security info
3. `README-SUMMARY.md` - Full summary

**Or ask Kiro AI Assistant!** 🤖

---

**Happy Coding! 🚀**

---

**Version:** 1.0.1  
**Last Updated:** 2026-06-04  
**By:** Kiro AI Assistant
