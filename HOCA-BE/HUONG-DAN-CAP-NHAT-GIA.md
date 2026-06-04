# 📋 HƯỚNG DẪN CẬP NHẬT GIÁ GÓI PREMIUM

## 🎯 Giá mới

- **Gói Năm Premium (YEARLY)**: 500.000 đ (thay vì giá cũ)
- **Gói Vĩnh viễn (LIFETIME)**: 999.000 đ (thay vì giá cũ)

---

## ✅ CÁCH 1: Sử dụng API Endpoint (Khuyến nghị)

### Bước 1: Khởi động server

```bash
npm start
# hoặc
npm run dev
```

### Bước 2: Lấy Admin Token

#### Option A: Dùng Postman/Thunder Client

1. Gửi request đến endpoint login:
   ```
   POST http://localhost:3000/api/auth/login
   ```
2. Body (JSON):

   ```json
   {
     "email": "admin@example.com",
     "password": "your-admin-password"
   }
   ```

3. Copy `token` từ response

#### Option B: Dùng Browser Console (nếu đã login trên frontend)

```javascript
// Mở DevTools > Console, paste và chạy:
localStorage.getItem("token");
```

### Bước 3: Gọi API cập nhật giá

#### Dùng Postman/Thunder Client:

```
POST http://localhost:3000/api/pricing/quick-update
Headers:
  Authorization: Bearer YOUR_ADMIN_TOKEN_HERE
  Content-Type: application/json
```

#### Dùng curl (CMD/PowerShell):

```bash
curl -X POST http://localhost:3000/api/pricing/quick-update ^
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN_HERE" ^
  -H "Content-Type: application/json"
```

#### Dùng script Node.js:

```bash
node testUpdatePricing.js
```

(Sau đó nhập admin token khi được hỏi)

---

## ✅ CÁCH 2: Chạy Script Trực Tiếp Database

**⚠️ Chú ý:** Cách này yêu cầu kết nối được tới MongoDB

### Bước 1: Kiểm tra kết nối

```bash
# Kiểm tra file .env có MONGODB_URI chưa
type .env | findstr MONGODB_URI
```

### Bước 2: Chạy script

```bash
node quickUpdatePricing.js
```

### Bước 3: Xử lý lỗi kết nối

Nếu gặp lỗi `ECONNREFUSED`:

1. **Kiểm tra Internet**: Đảm bảo máy có kết nối internet

2. **Kiểm tra MongoDB Atlas IP Whitelist**:
   - Vào MongoDB Atlas Dashboard
   - Network Access > Add IP Address
   - Thêm IP hiện tại hoặc cho phép tất cả: `0.0.0.0/0`

3. **Kiểm tra DNS**:
   - Thử đổi DNS sang Google DNS (8.8.8.8) hoặc Cloudflare (1.1.1.1)
   - Hoặc tắt VPN nếu đang bật

4. **Thử kết nối lại**:
   ```bash
   # Chờ vài phút rồi thử lại
   node quickUpdatePricing.js
   ```

---

## ✅ CÁCH 3: Cập Nhật Thủ Công Qua MongoDB Compass

### Bước 1: Mở MongoDB Compass

1. Kết nối với connection string từ `.env`
2. Chọn database `hoca-db`
3. Chọn collection `pricingplans`

### Bước 2: Tìm và sửa gói Năm

1. Filter: `{ "tier": "YEARLY" }`
2. Click vào document để edit
3. Sửa field `price` thành: `500000`
4. Click "Update"

### Bước 3: Tìm và sửa gói Vĩnh viễn

1. Filter: `{ "tier": "LIFETIME" }`
2. Click vào document để edit
3. Sửa field `price` thành: `999000`
4. Click "Update"

---

## 📊 Xác Nhận Kết Quả

### Kiểm tra qua API:

```bash
curl http://localhost:3000/api/pricing
```

Hoặc mở browser:

```
http://localhost:3000/api/pricing
```

### Kết quả mong đợi:

```json
[
  {
    "name": "Gói Tháng Premium",
    "tier": "MONTHLY",
    "price": 99000,
    "durationDays": 30
  },
  {
    "name": "Gói Năm Premium",
    "tier": "YEARLY",
    "price": 500000,
    "durationDays": 365
  },
  {
    "name": "Gói vĩnh viễn",
    "tier": "LIFETIME",
    "price": 999000,
    "durationDays": -1
  }
]
```

---

## 🔧 Các File Liên Quan

- `src/controllers/pricing.controller.js` - Controller chứa logic cập nhật
- `src/routes/pricing.routes.js` - Routes định nghĩa endpoint
- `src/models/PricingPlan.js` - Model database
- `quickUpdatePricing.js` - Script cập nhật trực tiếp DB
- `testUpdatePricing.js` - Script test API với token

---

## 🆘 Gặp Vấn Đề?

### Lỗi 401 Unauthorized

- Token không hợp lệ hoặc hết hạn
- Thử login lại và lấy token mới

### Lỗi 403 Forbidden

- Tài khoản không có quyền admin
- Kiểm tra field `role` trong User collection (phải là `'admin'`)

### Lỗi kết nối MongoDB

- Kiểm tra internet
- Kiểm tra MongoDB Atlas IP whitelist
- Thử tắt VPN/Firewall tạm thời

### Server không chạy

```bash
# Cài dependencies nếu chưa có
npm install

# Chạy server
npm start
```

---

## 💡 Lưu Ý

- Giá được lưu bằng VND (không có dấu phẩy)
- Sau khi cập nhật, frontend sẽ tự động hiển thị giá mới
- Có thể rollback bằng cách sửa lại giá cũ
- Nên backup database trước khi thao tác quan trọng

---

**Tạo bởi:** Kiro AI Assistant  
**Ngày:** 04/06/2026
