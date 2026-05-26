# 🔧 HƯỚNG DẪN ĐỔI DNS SANG GOOGLE DNS

## Vấn đề hiện tại

MongoDB Atlas sử dụng DNS SRV records, nhưng DNS của VNPT không hỗ trợ tốt.

## Giải pháp: Đổi sang Google DNS

### Bước 1: Mở Network Settings

1. Nhấn `Windows + R`
2. Gõ: `ncpa.cpl`
3. Nhấn Enter

### Bước 2: Cấu hình DNS

1. Click phải vào kết nối mạng đang dùng (WiFi hoặc Ethernet)
2. Chọn **Properties**
3. Tìm và double-click **Internet Protocol Version 4 (TCP/IPv4)**
4. Chọn **Use the following DNS server addresses**
5. Điền:
   - **Preferred DNS server**: `8.8.8.8`
   - **Alternate DNS server**: `8.8.4.4`
6. Click **OK** → **OK**

### Bước 3: Flush DNS Cache

Mở Command Prompt (Admin) và chạy:

```cmd
ipconfig /flushdns
```

### Bước 4: Test kết nối

```cmd
nslookup _mongodb._tcp.exe201.3rnnkdg.mongodb.net
```

Nếu thấy kết quả trả về IP addresses → DNS đã hoạt động!

### Bước 5: Restart Backend

Backend sẽ tự động kết nối MongoDB sau khi DNS hoạt động.

---

## Nếu không muốn đổi DNS

Xem file: `CAI-MONGODB-LOCAL.md` để cài MongoDB trên máy local.
