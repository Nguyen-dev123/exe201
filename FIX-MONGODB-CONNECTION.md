# Hướng dẫn Fix MongoDB Connection

## Vấn đề hiện tại

Backend không thể kết nối MongoDB Atlas do lỗi DNS SRV lookup.

## Giải pháp

### Cách 1: Kiểm tra MongoDB Atlas (Khuyến nghị)

1. **Đăng nhập MongoDB Atlas**: https://cloud.mongodb.com/
2. **Kiểm tra Network Access**:
   - Vào "Network Access" trong sidebar
   - Đảm bảo IP của bạn được whitelist
   - Hoặc thêm `0.0.0.0/0` để allow tất cả (chỉ dùng cho development)

3. **Lấy Connection String mới**:
   - Vào "Database" → Click "Connect" trên cluster
   - Chọn "Connect your application"
   - Copy connection string mới
   - Thay thế trong file `HOCA-BE/.env`

### Cách 2: Sử dụng MongoDB Local

1. **Cài đặt MongoDB Community Server**:
   - Download: https://www.mongodb.com/try/download/community
   - Cài đặt với default settings
   - MongoDB sẽ chạy tại `mongodb://localhost:27017`

2. **Cập nhật .env**:

```env
MONGODB_URI=mongodb://localhost:27017/hoca-db
```

3. **Restart backend**:

```bash
cd HOCA-BE
npm run dev
```

### Cách 3: Fix DNS Issue (Windows)

1. **Flush DNS Cache**:

```cmd
ipconfig /flushdns
```

2. **Thay đổi DNS Server**:
   - Mở Network Settings
   - Đổi DNS sang Google DNS: `8.8.8.8` và `8.8.4.4`
   - Hoặc Cloudflare DNS: `1.1.1.1` và `1.0.0.1`

3. **Restart backend**

### Cách 4: Test Connection String

Thử connection string format khác:

```env
# Format 1 (hiện tại)
MONGODB_URI=mongodb+srv://nguyendinhtuan25224_db_user:MZ7BApD8dnhti79h@exe201.3rnnkdg.mongodb.net/?retryWrites=true&w=majority

# Format 2 (với database name)
MONGODB_URI=mongodb+srv://nguyendinhtuan25224_db_user:MZ7BApD8dnhti79h@exe201.3rnnkdg.mongodb.net/hoca-db?retryWrites=true&w=majority

# Format 3 (standard connection - không dùng SRV)
# Lấy từ MongoDB Atlas → Connect → "Connect with MongoDB Shell"
MONGODB_URI=mongodb://ac-xxxxx.mongodb.net:27017,ac-yyyyy.mongodb.net:27017/hoca-db?replicaSet=atlas-xxxxx
```

## Test Backend đang chạy

Sau khi fix, test backend:

```bash
# Test health endpoint
curl http://localhost:3000/health

# Hoặc mở browser
http://localhost:3000
```

Nếu thấy response JSON là backend đã chạy thành công!

## Test Frontend kết nối Backend

1. Mở http://localhost:3001
2. Click "Đăng ký"
3. Điền thông tin và submit
4. Nếu thành công → Backend đã kết nối!

## Nếu vẫn lỗi

Tạm thời comment MongoDB connection để test frontend:

**File: `HOCA-BE/src/config/database.js`**

```javascript
const connectDatabase = async () => {
  try {
    // await mongoose.connect(MONGODB_URI);
    console.log("✅ MongoDB connection skipped (development mode)");
  } catch (error) {
    console.error("❌ MongoDB connection error:", error);
    // process.exit(1); // Comment này để không crash
  }
};
```

Sau đó restart backend. Frontend vẫn có thể test UI nhưng data sẽ không persist.

## Contact

Nếu cần hỗ trợ thêm, cung cấp:

1. Screenshot lỗi trong terminal
2. MongoDB Atlas cluster status
3. Network Access settings trong Atlas
