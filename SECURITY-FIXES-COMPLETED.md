# 🔒 SECURITY FIXES - HOÀN THÀNH

**Ngày:** 04/06/2026  
**Status:** ✅ Đã implement rate limiting

---

## ✅ ĐÃ HOÀN THÀNH

### 1. Rate Limiting ✅

**Vấn đề:** API không có giới hạn requests → Dễ bị DDoS, spam

**Giải pháp đã implement:**

- ✅ Cài đặt `@fastify/rate-limit`
- ✅ Tạo file config `src/config/rateLimit.js`
- ✅ Global rate limit: **100 requests/15 phút**
- ✅ Auth rate limit: **5 attempts/giờ** (login, register, forgot-password)
- ✅ Thêm vào `src/app.js`
- ✅ Apply vào `src/routes/auth.routes.js`

**Files thay đổi:**

- `package.json` - Added `@fastify/rate-limit`
- `src/config/rateLimit.js` - New file
- `src/app.js` - Register global rate limit
- `src/routes/auth.routes.js` - Stricter auth rate limit

**Test:**

```bash
# Test global rate limit
for i in {1..101}; do curl http://localhost:3000/api/pricing; done
# Request thứ 101 sẽ trả về 429 Too Many Requests

# Test auth rate limit
for i in {1..6}; do curl -X POST http://localhost:3000/api/auth/login -H "Content-Type: application/json" -d '{"email":"test@test.com","password":"wrong"}'; done
# Request thứ 6 sẽ bị block
```

---

## 🔄 ĐANG THỰC HIỆN

### 2. Input Validation (In Progress)

**Next step:** Thêm Joi hoặc Fastify schema validation

### 3. XSS Sanitization (Planned)

**Next step:** Sanitize chat messages với sanitize-html

---

## ⏳ CẦN LÀM TIẾP

### 🔴 URGENT (Tuần này)

#### 3. XSS Protection

```javascript
// Install
npm install sanitize-html

// Usage in chat controller
const sanitizeHtml = require('sanitize-html');

const cleanMessage = sanitizeHtml(message, {
  allowedTags: [], // No HTML tags allowed
  allowedAttributes: {}
});
```

#### 4. Input Validation Schemas

```javascript
// Add to routes
fastify.post(
  "/register",
  {
    schema: {
      body: {
        type: "object",
        required: ["email", "password"],
        properties: {
          email: { type: "string", format: "email" },
          password: { type: "string", minLength: 8 },
          displayName: { type: "string", minLength: 2, maxLength: 50 },
        },
      },
    },
  },
  authController.register,
);
```

#### 5. Rotate API Keys

```bash
# 1. MongoDB
- Create new database user
- Update MONGODB_URI in .env
- Delete old user

# 2. Groq AI
- Generate new key at https://console.groq.com/keys
- Update GROQ_API_KEY in .env
- Revoke old key

# 3. PayOS
- Contact PayOS support for key rotation
- Update all 3 keys (CLIENT_ID, API_KEY, CHECKSUM_KEY)

# 4. Google OAuth
- Generate new credentials in Google Cloud Console
- Update GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET
- Delete old credentials
```

#### 6. Environment Variables Security

```bash
# Create .env.example (without real values)
cp .env .env.example

# Edit .env.example to have placeholders
MONGODB_URI=mongodb+srv://USERNAME:PASSWORD@HOST/DATABASE
GROQ_API_KEY=your-groq-api-key-here
PAYOS_CLIENT_ID=your-payos-client-id
# ... etc

# Add to .gitignore
echo ".env" >> .gitignore
echo ".env.local" >> .gitignore

# Remove .env from git history
git rm --cached .env
git commit -m "Remove .env from repo"
git push
```

### 🟡 IMPORTANT (Tuần sau)

#### 7. WebRTC TURN Servers

```javascript
// Free TURN server options:
const iceServers = [
  { urls: "stun:stun.l.google.com:19302" },
  { urls: "stun:stun1.l.google.com:19302" },
  // Add TURN (choose one):
  // Option 1: Metered.ca (free tier)
  {
    urls: "turn:a.relay.metered.ca:80",
    username: "YOUR_USERNAME",
    credential: "YOUR_CREDENTIAL",
  },
  // Option 2: Twilio STUN/TURN
  {
    urls: "turn:global.turn.twilio.com:3478",
    username: "YOUR_TWILIO_USERNAME",
    credential: "YOUR_TWILIO_CREDENTIAL",
  },
];
```

#### 8. Memory Leak Fix

```javascript
// In socket/room.handler.js
socket.on("leave-room", async () => {
  // ... existing code ...

  // Clear timer if exists
  if (roomTimers[roomId]) {
    clearInterval(roomTimers[roomId]);
    delete roomTimers[roomId];
  }
});

// On room close
socket.on("close-room", async ({ roomId }) => {
  // ... existing code ...

  // Clear timer
  if (roomTimers[roomId]) {
    clearInterval(roomTimers[roomId]);
    delete roomTimers[roomId];
  }
});
```

#### 9. Transaction Rollback

```javascript
// In payment controller
const session = await mongoose.startSession();
session.startTransaction();

try {
  // Update transaction
  await Transaction.updateOne(
    { _id: transactionId },
    { status: "COMPLETED" },
    { session },
  );

  // Update user
  await User.updateOne(
    { _id: userId },
    { subscriptionTier: "MONTHLY", subscriptionExpiry: expiryDate },
    { session },
  );

  await session.commitTransaction();
} catch (error) {
  await session.abortTransaction();
  throw error;
} finally {
  session.endSession();
}
```

### 🟢 NICE TO HAVE (Tháng tới)

#### 10. Database Indexes

```javascript
// Add to models
// User.js
userSchema.index({ totalStudyMinutes: -1 }); // Leaderboard
userSchema.index({ email: 1 }, { unique: true, sparse: true });
userSchema.index({ googleId: 1 }, { unique: true, sparse: true });

// Room.js
roomSchema.index({ isActive: 1, createdAt: -1 }); // Active rooms list
roomSchema.index({ owner: 1, isActive: 1 }); // User's rooms

// Transaction.js
transactionSchema.index({ status: 1, createdAt: -1 }); // Admin transactions
transactionSchema.index({ user: 1, createdAt: -1 }); // User's transactions
```

#### 11. Helmet for Security Headers

```bash
npm install @fastify/helmet

# In app.js
await app.register(require('@fastify/helmet'), {
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https:']
    }
  }
});
```

#### 12. CORS Hardening

```javascript
// In app.js - Tighten CORS in production
await app.register(cors, {
  origin:
    process.env.NODE_ENV === "production"
      ? ["https://hoca.asia", "https://www.hoca.asia"]
      : true, // Allow all in development
  credentials: true,
});
```

---

## 📊 TIẾN ĐỘ

| Task             | Status         | Priority        | ETA       |
| ---------------- | -------------- | --------------- | --------- |
| Rate Limiting    | ✅ Done        | 🔴 Urgent       | Completed |
| Input Validation | 🔄 In Progress | 🔴 Urgent       | 1 day     |
| XSS Sanitization | ⏳ Planned     | 🔴 Urgent       | 1 day     |
| Rotate API Keys  | ⏳ Planned     | 🔴 Urgent       | 2 days    |
| .env Security    | ⏳ Planned     | 🔴 Urgent       | 1 day     |
| TURN Servers     | ⏳ Planned     | 🟡 Important    | 3 days    |
| Memory Leaks     | ⏳ Planned     | 🟡 Important    | 2 days    |
| Transactions     | ⏳ Planned     | 🟡 Important    | 2 days    |
| DB Indexes       | ⏳ Planned     | 🟢 Nice to have | 1 day     |
| Helmet           | ⏳ Planned     | 🟢 Nice to have | 1 hour    |

**Tổng thời gian ước tính:** 2-3 tuần để hoàn thành tất cả

---

## 🧪 TESTING CHECKLIST

### Rate Limiting

- [ ] Test global rate limit với 101 requests
- [ ] Test auth rate limit với 6 login attempts
- [ ] Test error messages
- [ ] Test rate limit reset sau time window

### Input Validation (When implemented)

- [ ] Test với invalid email format
- [ ] Test với password quá ngắn
- [ ] Test với SQL injection patterns
- [ ] Test với XSS payloads

### XSS Protection (When implemented)

- [ ] Test chat với `<script>alert('xss')</script>`
- [ ] Test chat với `<img src=x onerror=alert('xss')>`
- [ ] Test chat với HTML tags
- [ ] Verify output is escaped

---

## 📝 NOTES

### Rate Limit Configuration

Có thể điều chỉnh trong `src/config/rateLimit.js`:

- `max`: Số requests tối đa
- `timeWindow`: Thời gian (ms hoặc string như '15 minutes')
- `errorResponseBuilder`: Custom error message

### IP-based vs User-based Rate Limiting

Hiện tại: IP-based (default của @fastify/rate-limit)

Có thể chuyển sang user-based:

```javascript
{
  max: 100,
  timeWindow: '15 minutes',
  keyGenerator: (request) => {
    // Use user ID if authenticated
    return request.user?.id || request.ip;
  }
}
```

### Redis for Distributed Rate Limiting

Nếu scale ra nhiều servers, cần Redis:

```bash
npm install @fastify/redis

# In app.js
await app.register(require('@fastify/redis'), {
  host: '127.0.0.1'
});

await app.register(rateLimit, {
  redis: app.redis,
  max: 100,
  timeWindow: '15 minutes'
});
```

---

**📌 Priority Order:**

1. ✅ Rate Limiting (DONE)
2. ⏳ Input Validation
3. ⏳ XSS Sanitization
4. ⏳ API Key Rotation
5. ⏳ .env Security

**🎯 Goal:** Complete all 🔴 Urgent tasks this week

---

**Cập nhật lần cuối:** 04/06/2026  
**Next review:** 05/06/2026
