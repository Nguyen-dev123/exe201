# 🔐 SETUP GOOGLE OAUTH - HƯỚNG DẪN CHI TIẾT

## ✅ Đã hoàn thành

- ✅ Backend: Thêm refresh token cho tất cả auth endpoints
- ✅ Backend: Endpoint `/api/auth/refresh-token` để refresh access token
- ✅ Backend: Google Login endpoint `/api/auth/google`
- ✅ Frontend: Cài đặt `@react-oauth/google`
- ✅ Frontend: Update authStore để lưu refreshToken
- ✅ Frontend: API client tự động refresh token khi hết hạn
- ✅ Frontend: Google Login button trên trang Login và Register

---

## 🔧 CẦN LÀM: Lấy Google Client ID

### BƯỚC 1: Tạo Google Cloud Project

1. Vào: **https://console.cloud.google.com/**
2. Đăng nhập với Google account
3. Click **Select a project** → **NEW PROJECT**
4. Đặt tên project: **HOCA** (hoặc tên bạn muốn)
5. Click **CREATE**

---

### BƯỚC 2: Enable Google+ API

1. Trong project vừa tạo, vào **APIs & Services** → **Library**
2. Tìm: **Google+ API**
3. Click vào và click **ENABLE**

---

### BƯỚC 3: Tạo OAuth 2.0 Credentials

1. Vào **APIs & Services** → **Credentials**
2. Click **CREATE CREDENTIALS** → **OAuth client ID**
3. Nếu chưa có OAuth consent screen:
   - Click **CONFIGURE CONSENT SCREEN**
   - Chọn **External** → **CREATE**
   - Điền:
     - **App name**: HOCA
     - **User support email**: Email của bạn
     - **Developer contact**: Email của bạn
   - Click **SAVE AND CONTINUE** → **SAVE AND CONTINUE** → **BACK TO DASHBOARD**

4. Quay lại **Credentials** → **CREATE CREDENTIALS** → **OAuth client ID**
5. Chọn **Application type**: **Web application**
6. Đặt tên: **HOCA Web Client**
7. **Authorized JavaScript origins**:
   - Add: `http://localhost:3001`
   - Add: `http://localhost:3000`
8. **Authorized redirect URIs**:
   - Add: `http://localhost:3001`
   - Add: `http://localhost:3001/login`
   - Add: `http://localhost:3001/register`
9. Click **CREATE**

---

### BƯỚC 4: Copy Client ID

1. Sau khi tạo xong, bạn sẽ thấy popup với:
   - **Your Client ID**: `xxxxx.apps.googleusercontent.com`
   - **Your Client Secret**: `xxxxx`
2. **Copy Client ID**

---

### BƯỚC 5: Update Environment Variables

#### Backend (.env):

```env
GOOGLE_CLIENT_ID=xxxxx.apps.googleusercontent.com
```

#### Frontend (.env):

```env
VITE_GOOGLE_CLIENT_ID=xxxxx.apps.googleusercontent.com
```

---

### BƯỚC 6: Restart Servers

```bash
# Backend sẽ tự động restart (nodemon)
# Frontend cần restart:
cd hoca-fe
# Ctrl+C để stop
npm run dev
```

---

## 🎯 Test Google Login

1. Vào: **http://localhost:3001/login**
2. Click nút **Sign in with Google**
3. Chọn Google account
4. ✅ Bạn sẽ được đăng nhập và chuyển đến /rooms

---

## 🔐 Authentication Flow

### Login với Email/Password:

```
1. User nhập email + password
2. POST /api/auth/login
3. Backend trả về: { user, token, refreshToken }
4. Frontend lưu vào localStorage
5. Redirect đến /rooms
```

### Login với Google:

```
1. User click "Sign in with Google"
2. Google OAuth popup
3. User chọn account
4. Google trả về credential (ID Token)
5. Frontend gửi POST /api/auth/google { token: credential }
6. Backend verify token với Google
7. Backend tạo/update user
8. Backend trả về: { user, token, refreshToken }
9. Frontend lưu vào localStorage
10. Redirect đến /rooms
```

### Auto Refresh Token:

```
1. User gọi API với expired access token
2. API trả về 401 Unauthorized
3. Frontend tự động gọi POST /api/auth/refresh-token { refreshToken }
4. Backend verify refresh token
5. Backend trả về: { token, refreshToken } mới
6. Frontend update tokens
7. Frontend retry request ban đầu với token mới
8. ✅ Request thành công
```

---

## 📊 Token Expiry

- **Access Token**: 7 ngày
- **Refresh Token**: 30 ngày

Khi access token hết hạn, frontend tự động dùng refresh token để lấy token mới.

---

## 🧪 Test Authentication

### Test Email/Password Login:

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"123456"}'
```

Response:

```json
{
  "message": "Login successful",
  "user": { ... },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Test Refresh Token:

```bash
curl -X POST http://localhost:3000/api/auth/refresh-token \
  -H "Content-Type: application/json" \
  -d '{"refreshToken":"YOUR_REFRESH_TOKEN"}'
```

Response:

```json
{
  "message": "Token refreshed successfully",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

---

## 🎉 Hoàn thành!

Bây giờ bạn có:

- ✅ Login với Email/Password
- ✅ Login với Google OAuth
- ✅ Access Token (7 ngày)
- ✅ Refresh Token (30 ngày)
- ✅ Auto refresh khi token hết hạn
- ✅ Logout
- ✅ Protected routes

---

## 📝 Lưu ý

- Google Client ID cần được config trong cả Backend và Frontend
- Khi deploy production, cần thêm domain production vào **Authorized JavaScript origins** và **Authorized redirect URIs**
- Refresh token được lưu trong localStorage, cần cẩn thận với XSS attacks
- Nên implement HTTP-only cookies cho production

---

**Nếu cần hỗ trợ, hãy cho tôi biết!**
