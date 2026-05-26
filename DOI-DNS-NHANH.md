# ⚡ ĐỔI DNS NHANH - 3 PHÚT

## 🎯 Mục tiêu

Đổi DNS sang Google DNS để MongoDB Atlas kết nối được.

---

## ⚡ BƯỚC 1: Mở Network Settings (30 giây)

**Nhấn phím**: `Windows + R`

**Gõ vào**: `ncpa.cpl`

**Nhấn**: `Enter`

→ Cửa sổ Network Connections sẽ mở ra

---

## ⚡ BƯỚC 2: Vào Properties (30 giây)

1. Tìm kết nối đang dùng:
   - **Wi-Fi** (nếu dùng WiFi)
   - **Ethernet** (nếu dùng dây mạng)

2. **Click phải** vào nó

3. Chọn **Properties**

---

## ⚡ BƯỚC 3: Cấu hình DNS (1 phút)

1. Tìm dòng: **Internet Protocol Version 4 (TCP/IPv4)**

2. **Double-click** vào nó

3. Chọn: **Use the following DNS server addresses**

4. Điền:

   ```
   Preferred DNS server:  8.8.8.8
   Alternate DNS server:  8.8.4.4
   ```

5. Click **OK** → **OK**

---

## ⚡ BƯỚC 4: Flush DNS (30 giây)

1. Nhấn `Windows + X`

2. Chọn **Command Prompt (Admin)** hoặc **PowerShell (Admin)**

3. Gõ:

   ```cmd
   ipconfig /flushdns
   ```

4. Nhấn `Enter`

---

## ⚡ BƯỚC 5: Kiểm tra (30 giây)

Trong cùng cửa sổ Command Prompt, gõ:

```cmd
nslookup _mongodb._tcp.exe201.3rnnkdg.mongodb.net 8.8.8.8
```

### ✅ Thành công nếu thấy:

```
Server:  dns.google
Address:  8.8.8.8
...
(có nhiều dòng kết quả)
```

### ❌ Thất bại nếu thấy:

```
DNS request timed out
```

---

## 🎉 XONG!

Backend sẽ tự động kết nối MongoDB trong vài giây.

Xem terminal backend, bạn sẽ thấy:

```
✅ MongoDB connected successfully
🚀 Server running at http://localhost:3000
```

---

## 🔥 Sau khi kết nối thành công

1. Vào: **http://localhost:3001/register**
2. Đăng ký tài khoản mới
3. Đăng nhập
4. ✅ Dữ liệu giờ sẽ lưu vào MongoDB (không mất khi restart)

---

## ❌ Nếu vẫn không được

### Option 1: Restart máy

Đôi khi cần restart máy để DNS mới có hiệu lực.

### Option 2: Thử DNS Cloudflare

Thay vì Google DNS, dùng Cloudflare DNS:

```
Preferred DNS server:  1.1.1.1
Alternate DNS server:  1.0.0.1
```

### Option 3: Cài MongoDB Local

Xem file: `CAI-MONGODB-LOCAL.md`

---

**Chúc bạn thành công! 🚀**
