# 🚀 HƯỚNG DẪN DEPLOY PRODUCTION

**Mục tiêu:** Deploy website lên `https://exe201-ten.vercel.app` hoạt động đầy đủ

---

## 📋 TÌNH TRẠNG HIỆN TẠI

- ✅ **Frontend:** Đã deploy trên Vercel (`https://exe201-ten.vercel.app`)
- ❌ **Backend:** Chưa deploy (vẫn đang local `localhost:3000`)
- ❌ **Kết nối:** Frontend không kết nối được backend → Website không hoạt động

---

## 🎯 GIẢI PHÁP: DEPLOY BACKEND LÊN RENDER

### **Bước 1: Tạo tài khoản Render**

1. Vào https://render.com
2. Click **"Get Started for Free"**
3. Sign up với GitHub (khuyến nghị) hoặc email
4. Verify email

---

### **Bước 2: Deploy Backend**

#### **2.1. Tạo Web Service mới**

1. Vào Render Dashboard
2. Click **"New +"** → **"Web Service"**
3. Chọn **"Build and deploy from a Git repository"**
4. Click **"Connect GitHub"** (hoặc đã connect rồi)
5. Tìm repository: **"Nguyen-dev123/exe201"**
6. Click **"Connect"**

#### **2.2. Cấu hình service**

**Name:** `hoca-backend`

**Region:** Singapore (gần VN, ping thấp)

**Branch:** `main`

**Root Directory:** `HOCA-BE` ⚠️ **QUAN TRỌNG!**

**Runtime:** Node

**Build Command:** `npm ci`

**Start Command:** `npm start`

**Plan:** Free

---

### **Bước 3: Thêm Environment Variables**

Click **"Advanced"** → **"Add Environment Variable"**

#### **Bắt buộc:**

```
NODE_ENV=production
PORT=10000
MONGODB_URI=mongodb+srv://nguyendinhtuan25224_db_user:nguyendinhtuan@exe201.3rnnkdg.mongodb.net/hoca-db?retryWrites=true&w=majority&appName=exe201
JWT_SECRET=your-super-secret-jwt-key-here-change-this
CLIENT_URL=https://exe201-ten.vercel.app
```

#### **Khuyến nghị (cho AI feature):**

```
GROQ_API_KEY=gsk_[YOUR_GROQ_KEY]
GROQ_MODEL=llama-3.3-70b-versatile
```

Lấy Groq key tại: https://console.groq.com/keys (FREE!)

#### **Optional (Bank QR payment):**

```
BANK_ID=VCB
BANK_ACCOUNT_NO=1029767072
BANK_ACCOUNT_NAME=NGUYEN DINH TUAN
BANK_MEMO_PREFIX=HOCA
```

---

### **Bước 4: Deploy!**

1. Click **"Create Web Service"**
2. Render sẽ bắt đầu build (mất 3-5 phút)
3. Đợi status **"Live"** màu xanh ✅
4. Copy backend URL (ví dụ: `https://hoca-backend.onrender.com`)

---

### **Bước 5: Update Frontend Config**

#### **5.1. Update Vercel Environment Variable**

1. Vào Vercel Dashboard
2. Project **"exe201"** → **"Settings"** → **"Environment Variables"**
3. Add:
   ```
   Name: VITE_API_URL
   Value: https://hoca-backend.onrender.com
   ```
4. Click **"Save"**

#### **5.2. Redeploy Frontend**

1. Vào tab **"Deployments"**
2. Click **"..."** trên deployment mới nhất
3. Click **"Redeploy"**
4. Đợi 1-2 phút

---

## ✅ KIỂM TRA

### **1. Check Backend**

Vào: `https://hoca-backend.onrender.com`

Phải thấy response (có thể là JSON hoặc text)

### **2. Check Frontend**

Vào: `https://exe201-ten.vercel.app`

- ✅ Đăng nhập được
- ✅ Tạo phòng được
- ✅ Chat hoạt động
- ✅ Giá hiển thị đúng (Yearly: 500k, Lifetime: 999k)

---

## 🎯 ALTERNATIVE: QUICK FIX (Temporary)

Nếu bạn muốn test nhanh mà chưa muốn deploy backend:

### **Sử dụng Cloudflare Tunnel**

1. Download cloudflared: https://github.com/cloudflare/cloudflared/releases
2. Run:
   ```bash
   cloudflared tunnel --url http://localhost:3000
   ```
3. Copy public URL (ví dụ: `https://abc.trycloudflare.com`)
4. Update frontend config để trỏ tới URL này
5. Redeploy frontend

**Lưu ý:** Tunnel chỉ hoạt động khi máy bạn bật, không phải giải pháp lâu dài!

---

## 📊 TIMELINE

### **Deploy Backend (lần đầu):**

- Setup Render: 5 phút
- Build & Deploy: 3-5 phút
- **Total: ~10 phút**

### **Deploy Frontend:**

- Update env vars: 1 phút
- Redeploy: 2 phút
- **Total: ~3 phút**

### **Grand Total: ~15 phút** 🚀

---

## ⚠️ LƯU Ý QUAN TRỌNG

### **1. Render Free Tier**

- ✅ Free forever
- ⚠️ **Spins down after 15 minutes inactive**
- ⚠️ **Cold start: ~30 seconds** (lần đầu sau khi sleep)
- ⚠️ 750 hours/month (đủ dùng)

**Tip:** Dùng UptimeRobot để ping mỗi 14 phút → Giữ backend awake!

### **2. MongoDB Connection**

Đảm bảo MongoDB Atlas:

- ✅ Whitelist IP `0.0.0.0/0` (allow all)
- ✅ Connection string đúng

### **3. CORS**

Backend đã config:

```javascript
cors: {
  origin: process.env.CLIENT_URL,
  credentials: true
}
```

Đảm bảo `CLIENT_URL` trỏ đúng Vercel URL!

---

## 🐛 TROUBLESHOOTING

### **Backend deploy failed?**

Check Render logs:

1. Vào service **"hoca-backend"**
2. Tab **"Logs"**
3. Tìm error message

Common issues:

- Missing env vars
- MongoDB connection failed
- Wrong root directory (phải là `HOCA-BE`)

### **Frontend không kết nối backend?**

1. Check browser Console (F12)
2. Xem Network tab → Có request fail không?
3. Check CORS error
4. Verify `VITE_API_URL` trong Vercel settings

### **Socket.io không hoạt động?**

Render free tier support WebSocket! Nhưng phải:

- ✅ Backend expose đúng port (10000)
- ✅ Frontend trỏ đúng URL
- ✅ No proxy/firewall blocking

---

## 📞 SUPPORT

Nếu cần help, báo tôi:

1. Render deployment logs
2. Browser console errors
3. Vercel deployment logs

---

## 🎉 SAU KHI DEPLOY XONG

Website sẽ chạy 24/7 trên:

- ✅ Frontend: `https://exe201-ten.vercel.app`
- ✅ Backend: `https://hoca-backend.onrender.com`
- ✅ Database: MongoDB Atlas
- ✅ Mobile ready: PWA support

**Giờ bạn có thể chia sẻ link cho bạn bè dùng thử!** 🚀

---

**Bắt đầu từ Bước 1 nhé!** Tôi sẽ hỗ trợ nếu bạn gặp vấn đề.
