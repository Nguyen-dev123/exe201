# 🐛 BUGFIX: Rate Limit 429 Error During Development

**Ngày:** June 4, 2026  
**Vấn đề:** API requests bị chặn với lỗi 429 "Too Many Requests" khi đang test

---

## 📋 MÔ TẢ LỖI

### **Console Errors:**

```
:3000/api/notifications/unread-count:1 Failed to load resource:
  the server responded with a status of 429 (Too Many Requests)
:3000/api/rooms:1 Failed to load resource:
  the server responded with a status of 429 (Too Many Requests)
:3000/api/users/me:1 Failed to load resource:
  the server responded with a status of 429 (Too Many Requests)
```

### **Nguyên nhân:**

Rate limiting config quá strict cho môi trường development:

- Global: **100 requests / 15 phút** ❌ (quá thấp!)
- Auth: **5 requests / 1 giờ** ❌ (quá thấp!)

Khi test với nhiều tab, refresh nhiều lần → vượt limit ngay!

---

## 🔨 GIẢI PHÁP

### **Tăng Rate Limits cho Development**

**File:** `HOCA-BE/src/config/rateLimit.js`

#### **Before (Production-ready, too strict for dev):**

```javascript
// Global rate limit: 100 requests per 15 minutes
const globalRateLimit = {
  max: 100, // ❌ Too low for testing
  timeWindow: "15 minutes",
  // ...
};

// Auth rate limit: 5 attempts per hour
const authRateLimit = {
  max: 5, // ❌ Too low for testing
  timeWindow: "1 hour",
  // ...
};
```

#### **After (Development-friendly):**

```javascript
// Global rate limit: 1000 requests per 15 minutes (increased for development)
const globalRateLimit = {
  max: 1000, // ✅ Enough for testing
  timeWindow: "15 minutes",
  errorResponseBuilder: (request, context) => {
    return {
      statusCode: 429,
      error: "Too Many Requests",
      message: `Rate limit exceeded. Try again in ${Math.ceil(context.ttl / 1000)} seconds.`,
    };
  },
};

// Strict rate limit for auth endpoints: 20 attempts per hour (increased for testing)
const authRateLimit = {
  max: 20, // ✅ Reasonable for testing
  timeWindow: "1 hour",
  errorResponseBuilder: (request, context) => {
    return {
      statusCode: 429,
      error: "Too Many Requests",
      message: `Too many login attempts. Please try again in ${Math.ceil(context.ttl / 60000)} minutes.`,
    };
  },
};
```

---

## ⚙️ RECOMMENDED LIMITS

### **Development Environment:**

```javascript
Global:   1000 requests / 15 min  ✅ (testing với nhiều tabs)
Auth:     20 attempts / 1 hour    ✅ (login/logout nhiều lần)
Payment:  10 requests / 15 min    ✅ (giữ nguyên - sensitive)
AI:       30 requests / 1 hour    ✅ (giữ nguyên - API cost)
```

### **Production Environment (recommend khi deploy):**

```javascript
Global:   200 requests / 15 min   (vừa đủ cho normal users)
Auth:     10 attempts / 1 hour    (prevent brute force)
Payment:  10 requests / 15 min    (prevent abuse)
AI:       30 requests / 1 hour    (control cost)
```

---

## 📝 STEPS TO FIX

1. ✅ Edit `src/config/rateLimit.js`
2. ✅ Change `globalRateLimit.max` from 100 → 1000
3. ✅ Change `authRateLimit.max` from 5 → 20
4. ✅ Restart backend: Stop process → `npm start`
5. ✅ Refresh frontend: `Ctrl + Shift + R`

---

## 🧪 VERIFY FIX

### **Before Fix:**

```
Request 1-100: ✅ OK
Request 101+:  ❌ 429 Error
```

### **After Fix:**

```
Request 1-1000: ✅ OK
Request 1001+:  ❌ 429 Error (reasonable limit)
```

### **Test:**

1. Mở browser dev tools (F12) → Network tab
2. Refresh trang nhiều lần
3. Tất cả requests phải status 200 (không còn 429)

---

## 💡 LƯU Ý

### **Khi nào nên tăng rate limit?**

- ✅ Development/Testing environment
- ✅ Local development với nhiều tabs
- ✅ Testing automation/scripts

### **Khi nào nên giảm rate limit?**

- ✅ Production deployment
- ✅ Public API endpoints
- ✅ Sensitive operations (auth, payment)

### **Best Practice:**

```javascript
// Use environment-based config
const isDevelopment = process.env.NODE_ENV === "development";

const globalRateLimit = {
  max: isDevelopment ? 1000 : 200, // Higher in dev
  timeWindow: "15 minutes",
  // ...
};
```

---

## 🔍 DEBUG RATE LIMIT ISSUES

### **Check current rate limit status:**

Backend response headers khi hit limit:

```
HTTP/1.1 429 Too Many Requests
x-ratelimit-limit: 100
x-ratelimit-remaining: 0
x-ratelimit-reset: 1686123456
```

### **Clear rate limit (for testing):**

Rate limit dùng in-memory storage, restart backend sẽ clear:

```bash
# Stop backend
npm start  # Restart
```

### **Check which endpoint hit limit:**

Xem console error message:

```
:3000/api/users/me:1 Failed to load resource: 429
                ↑
           Endpoint bị limit
```

---

## ✅ CHECKLIST

- [x] Tăng `globalRateLimit.max` từ 100 → 1000
- [x] Tăng `authRateLimit.max` từ 5 → 20
- [x] Restart backend
- [x] Test không còn 429 errors
- [x] Document changes
- [ ] **TODO:** Implement environment-based config
- [ ] **TODO:** Add Redis for distributed rate limiting (production)

---

## 📊 IMPACT

### **Before:**

- ❌ 429 errors sau 100 requests
- ❌ Không test được đầy đủ
- ❌ Login limit quá thấp (5/hour)

### **After:**

- ✅ 1000 requests available
- ✅ Test thoải mái
- ✅ Login reasonable (20/hour)
- ✅ Vẫn protect API khỏi abuse

---

## 🚀 NEXT IMPROVEMENTS

### **1. Environment-based Config:**

```javascript
// .env
RATE_LIMIT_GLOBAL_MAX=1000  # Dev: 1000, Prod: 200
RATE_LIMIT_AUTH_MAX=20      # Dev: 20, Prod: 10
```

### **2. Per-User Rate Limiting:**

Instead of IP-based, use userId:

```javascript
keyGenerator: (request) => {
  return request.user?.id || request.ip;
};
```

### **3. Redis Store (Production):**

```javascript
const RedisStore = require("rate-limit-redis");
store: new RedisStore({
  client: redisClient,
  prefix: "rl:",
});
```

---

**Status:** ✅ Fixed  
**Impact:** API calls working normally  
**Updated:** June 4, 2026

---

## 📞 TROUBLESHOOTING

### **Vẫn thấy 429 sau khi fix?**

1. **Chắc chắn đã restart backend:**

   ```bash
   # Ctrl+C để stop
   npm start  # Start lại
   ```

2. **Clear browser cache:**

   ```
   Ctrl + Shift + R (hard refresh)
   ```

3. **Đợi rate limit reset:**
   - Global limit reset sau 15 phút
   - Auth limit reset sau 1 giờ

4. **Check log backend:**

   ```
   Should see: "🚀 Server running at http://localhost:3000"
   ```

5. **Verify config loaded:**
   Add console.log in rateLimit.js:
   ```javascript
   console.log("Rate limit config:", globalRateLimit);
   ```
