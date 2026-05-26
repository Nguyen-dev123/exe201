# 🔧 HƯỚNG DẪN ĐỔI DNS SANG GOOGLE DNS (CHI TIẾT)

## ⚠️ Vấn đề hiện tại

MongoDB Atlas không kết nối được vì DNS của VNPT không hỗ trợ SRV records.

## ✅ Giải pháp: Đổi sang Google DNS

---

## 📋 BƯỚC 1: Mở Network Connections

### Cách 1 (Nhanh nhất):

1. Nhấn phím `Windows + R` trên bàn phím
2. Gõ: `ncpa.cpl`
3. Nhấn `Enter`

### Cách 2 (Qua Settings):

1. Click phải vào biểu tượng mạng (góc dưới bên phải màn hình)
2. Chọn **Open Network & Internet settings**
3. Chọn **Change adapter options**

---

## 📋 BƯỚC 2: Cấu hình DNS

1. **Tìm kết nối mạng đang dùng**:
   - Nếu dùng WiFi: Tìm **Wi-Fi** hoặc **Wireless Network Connection**
   - Nếu dùng dây: Tìm **Ethernet** hoặc **Local Area Connection**

2. **Click phải** vào kết nối đó → Chọn **Properties**

3. Trong cửa sổ Properties:
   - Tìm **Internet Protocol Version 4 (TCP/IPv4)**
   - **Double-click** vào nó (hoặc chọn rồi click **Properties**)

4. Trong cửa sổ IPv4 Properties:
   - Chọn **Use the following DNS server addresses**
   - Điền:
     ```
     Preferred DNS server:  8.8.8.8
     Alternate DNS server:  8.8.4.4
     ```
   - Click **OK**
   - Click **OK** lần nữa để đóng cửa sổ Properties

---

## 📋 BƯỚC 3: Flush DNS Cache

1. **Mở Command Prompt với quyền Admin**:
   - Nhấn `Windows + X`
   - Chọn **Command Prompt (Admin)** hoặc **Windows PowerShell (Admin)**
   - Nếu có hỏi "Do you want to allow...", click **Yes**

2. **Chạy lệnh**:

   ```cmd
   ipconfig /flushdns
   ```

3. Bạn sẽ thấy thông báo:
   ```
   Successfully flushed the DNS Resolver Cache.
   ```

---

## 📋 BƯỚC 4: Test DNS mới

Trong cùng cửa sổ Command Prompt, chạy:

```cmd
nslookup _mongodb._tcp.exe201.3rnnkdg.mongodb.net 8.8.8.8
```

### Kết quả mong đợi:

Bạn sẽ thấy một số địa chỉ IP trả về. Ví dụ:

```
Server:  dns.google
Address:  8.8.8.8

Non-authoritative answer:
_mongodb._tcp.exe201.3rnnkdg.mongodb.net    SRV service location:
          priority       = 0
          weight         = 0
          port           = 27017
          svr hostname   = exe201-shard-00-00.3rnnkdg.mongodb.net
...
```

✅ Nếu thấy kết quả như trên = DNS đã hoạt động!
❌ Nếu vẫn báo lỗi = Thử lại từ đầu hoặc restart máy

---

## 📋 BƯỚC 5: Restart Backend

Backend của bạn đang chạy sẽ tự động kết nối MongoDB sau khi DNS hoạt động.

**Không cần làm gì**, backend sẽ tự động thử kết nối lại!

---

## 🎯 Kiểm tra kết quả

Sau khi đổi DNS xong, mở terminal đang chạy backend và xem logs:

### ✅ Thành công - Bạn sẽ thấy:

```
✅ MongoDB connected successfully
🚀 Server running at http://localhost:3000
```

### ❌ Vẫn lỗi - Bạn sẽ thấy:

```
❌ MongoDB connection error: querySrv ECONNREFUSED...
⚠️  Continuing without MongoDB (development mode)
```

Nếu vẫn lỗi:

1. Thử **restart máy tính**
2. Hoặc thử **Giải pháp 2** (xem bên dưới)

---

## 🔄 Giải pháp 2: Lấy Connection String không dùng SRV

Nếu đổi DNS vẫn không được, làm theo:

### 1. Đăng nhập MongoDB Atlas

Vào: https://cloud.mongodb.com/

### 2. Lấy Connection String mới

1. Click vào cluster **exe201**
2. Click nút **Connect**
3. Chọn **Connect your application**
4. Chọn **Driver**: Node.js
5. Chọn **Version**: 4.1 or later
6. **QUAN TRỌNG**: Bỏ tick ✅ **Include full driver code example**
7. Tìm phần **Connection String Only**
8. Chọn tab **Standard Connection String** (KHÔNG phải SRV)
9. Copy connection string dạng:
   ```
   mongodb://exe201-shard-00-00.3rnnkdg.mongodb.net:27017,...
   ```

### 3. Update file .env

Thay thế `MONGODB_URI` trong file `HOCA-BE/.env` bằng connection string mới.

---

## 🔄 Giải pháp 3: Cài MongoDB Local

Nếu cả 2 cách trên đều không được, cài MongoDB trên máy:

1. Download: https://www.mongodb.com/try/download/community
2. Cài đặt với default settings
3. Update `HOCA-BE/.env`:
   ```env
   MONGODB_URI=mongodb://localhost:27017/hoca-db
   ```

---

## 📞 Cần hỗ trợ?

Sau khi làm xong các bước trên:

1. Chụp màn hình terminal backend (phần logs)
2. Cho tôi biết bạn thấy gì

---

## 💡 Tips

- Google DNS (8.8.8.8) nhanh và ổn định hơn DNS của VNPT
- Bạn có thể đổi lại DNS cũ bất cứ lúc nào bằng cách chọn **Obtain DNS server address automatically**
- Đổi DNS không ảnh hưởng đến tốc độ internet

---

**Bắt đầu từ BƯỚC 1 và làm từng bước một nhé!**
