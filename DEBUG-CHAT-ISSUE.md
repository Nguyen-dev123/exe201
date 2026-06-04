# 🐛 DEBUG: Vấn đề Chat và Online Users

## ✅ Vấn đề đã xác định

### Backend Log cho thấy:

```
[JOIN] Sockets now in room: Set(1) { 'vuKAehDoz3txS_siAAAL' }
```

**CHỈ CÓ 1 SOCKET trong phòng!**

## 🔍 Nguyên nhân có thể:

### 1. **HAI NGƯỜI DÙNG CÙNG TÀI KHOẢN** ❌

- Nếu bạn và bạn bè dùng cùng email/username để đăng nhập
- Khi người thứ 2 login → token mới → socket cũ bị disconnect
- Backend chỉ thấy 1 user vì đây là cùng 1 tài khoản

**✅ KIỂM TRA:**

- Đảm bảo 2 người dùng đăng nhập bằng 2 TÀI KHOẢN KHÁC NHAU
- User 1: email1@example.com
- User 2: email2@example.com

### 2. **NGƯỜI THỨ 2 CHƯA VÀO PHÒNG** ❌

- Người tạo phòng đã vào
- Người bạn chưa click vào link phòng hoặc chưa join

**✅ KIỂM TRA:**

- Người tạo phòng share link: `http://localhost:3001/rooms/{roomId}`
- Người bạn phải click vào link và vào trang phòng
- Kiểm tra console log trên trình duyệt người bạn

### 3. **TRÌNH DUYỆT CHƯA REFRESH** ❌

- Code đã được sửa nhưng browser cache code cũ

**✅ GIẢI PHÁP:**
Trên CẢ 2 trình duyệt:

1. Nhấn `Ctrl + Shift + R` (Windows) hoặc `Cmd + Shift + R` (Mac)
2. Hoặc mở DevTools (F12) → tab Network → tick "Disable cache"
3. Reload lại trang

### 4. **SOCKET CONNECTION FAILED** ❌

- Frontend không kết nối được tới backend socket

**✅ KIỂM TRA:**
Mở Console (F12) trên trình duyệt:

```javascript
// Phải thấy log này:
✅ Socket connected: {socketId}
🔄 Joining room: {roomId}
```

Nếu KHÔNG thấy → Socket không connect!

## 📋 HƯỚNG DẪN TEST CHI TIẾT

### Bước 1: Chuẩn bị 2 tài khoản

```
User 1 (Người tạo phòng):
- Email: user1@test.com
- Password: 123456

User 2 (Người tham gia):
- Email: user2@test.com
- Password: 123456
```

### Bước 2: Test với 2 trình duyệt/tab

**TRÌNH DUYỆT 1 (User 1):**

1. Mở `http://localhost:3001`
2. Đăng nhập với user1@test.com
3. Vào trang Rooms → Tạo phòng mới
4. Mở F12 Console → Kiểm tra log:
   ```
   ✅ Socket connected: xxx
   🔄 Joining room: yyy
   ```
5. Copy URL phòng (ví dụ: `http://localhost:3001/rooms/6a20f857595c03188e7e9fa4`)

**TRÌNH DUYỆT 2 (User 2) - Incognito/Private Mode:**

1. Mở trình duyệt ẩn danh: `Ctrl + Shift + N` (Chrome) hoặc `Ctrl + Shift + P` (Firefox)
2. Vào `http://localhost:3001`
3. Đăng nhập với user2@test.com
4. **PASTE URL PHÒNG** từ User 1
5. Mở F12 Console → Kiểm tra log:
   ```
   ✅ Socket connected: xxx
   🔄 Joining room: yyy
   ```

### Bước 3: Kiểm tra Backend Log

Trong terminal backend (Process ID: 5), phải thấy:

```
User connected: {userId1} | Socket ID: xxx
[JOIN] User {userId1} (name1) attempting to join room {roomId}
[JOIN] Sockets now in room: Set(1) { 'xxx' }

User connected: {userId2} | Socket ID: yyy  ← NGƯỜI THỨ 2
[JOIN] User {userId2} (name2) attempting to join room {roomId}
[JOIN] Sockets now in room: Set(2) { 'xxx', 'yyy' } ← PHẢI CÓ 2!
```

### Bước 4: Test Chat

**Trên User 1:**

- Gõ tin nhắn "Hello from User 1"
- Enter

**Trên User 2:**

- Phải THẤY tin nhắn "Hello from User 1"
- Gõ tin nhắn "Hello from User 2"
- Enter

**Trên User 1:**

- Phải THẤY tin nhắn "Hello from User 2"

## 🔧 NÊU VẪN KHÔNG HOẠT ĐỘNG

### Nếu Console không thấy "Socket connected":

1. Kiểm tra backend có đang chạy: `http://localhost:3000`
2. Kiểm tra frontend config:
   ```javascript
   // File: hoca-fe/src/lib/config.js
   export const API_BASE = "http://localhost:3000";
   ```
3. Hard refresh: `Ctrl + Shift + R`

### Nếu thấy "Socket connected" nhưng "Sockets in room: Set(1)":

- Người thứ 2 CHƯA join phòng
- Hoặc 2 người dùng cùng tài khoản

### Nếu Backend log không thấy "[JOIN] User ... attempting to join":

- Frontend không emit "join-room" event
- Có thể do socket chưa connected khi emit
- Code mới đã fix vấn đề này (đợi socket.connect trước)

## 💡 TIP DEBUG NHANH

### Kiểm tra số users trong phòng:

Paste vào Console (F12):

```javascript
// Lấy socket hiện tại
const socket = window.__socket || io();

// Lắng nghe event room-users
socket.on("room-users", (users) => {
  console.log("👥 Online users:", users);
});

// Request danh sách users
socket.emit("get-room-users", { roomId: "{YOUR_ROOM_ID}" });
```

### Test emit join-room thủ công:

```javascript
const socket = window.__socket;
socket.emit("join-room", { roomId: "{YOUR_ROOM_ID}" });
```

## ✅ CHECKLIST

Trước khi báo lỗi, đảm bảo:

- [ ] Backend đang chạy (`http://localhost:3000`)
- [ ] Frontend đang chạy (`http://localhost:3001`)
- [ ] Đã hard refresh CẢ 2 trình duyệt: `Ctrl + Shift + R`
- [ ] Dùng 2 TÀI KHOẢN KHÁC NHAU (không cùng email/username)
- [ ] Dùng 2 trình duyệt KHÁC NHAU hoặc 1 normal + 1 incognito
- [ ] User 2 đã PASTE URL phòng từ User 1
- [ ] Cả 2 console đều thấy "✅ Socket connected"
- [ ] Cả 2 console đều thấy "🔄 Joining room"
- [ ] Backend log thấy 2 user join (userId khác nhau)
- [ ] Backend log thấy "Sockets now in room: Set(2)"

## 📞 BÁO CÁO LỖI

Nếu làm hết checklist trên mà vẫn lỗi, gửi thông tin:

1. **Screenshot Console của User 1** (F12 → Console tab)
2. **Screenshot Console của User 2** (F12 → Console tab)
3. **Backend log** (50 dòng cuối)
4. **Email/Username của 2 users** (để confirm khác nhau)
5. **Browser đang dùng** (Chrome/Firefox/Edge)

---

## 🎯 TÓM TẮT

**NGUYÊN NHÂN CHÍNH NHẤT:**

1. ✅ **2 người cùng tài khoản** → Chỉ thấy 1 online
2. ✅ **Người thứ 2 chưa vào phòng** → Chỉ có 1 socket
3. ✅ **Browser cache code cũ** → Hard refresh

**GIẢI PHÁP:**

- Đăng ký 2 tài khoản khác nhau
- User 2 phải paste URL phòng vào browser
- Hard refresh cả 2 trình duyệt: `Ctrl + Shift + R`
