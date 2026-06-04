# 🚀 HƯỚNG DẪN TEST NHANH - Sửa lỗi Online Users & Chat

## ⚡ TÓM TẮT

**Vấn đề:** Chỉ thấy 1 người online, chat không hiện cho người khác

**Nguyên nhân có thể:**

1. ❌ Hai người dùng **cùng 1 tài khoản**
2. ❌ Người thứ 2 **chưa vào phòng**
3. ❌ Trình duyệt **cache code cũ**

---

## 🎯 GIẢI PHÁP NHANH (3 BƯỚC)

### **BƯỚC 1: CHUẨN BỊ 2 TÀI KHOẢN**

Đảm bảo có **2 tài khoản KHÁC NHAU**:

- Tài khoản 1: `email1@example.com`
- Tài khoản 2: `email2@example.com`

> ⚠️ **QUAN TRỌNG:** PHẢI là 2 email/username khác nhau!

---

### **BƯỚC 2: MỞ 2 TRÌNH DUYỆT**

#### **Trình duyệt 1 (Normal):**

1. Mở Chrome/Edge/Firefox bình thường
2. Vào `http://localhost:3001`
3. Đăng nhập với **Tài khoản 1**
4. **Nhấn `Ctrl + Shift + R`** (hard refresh)
5. Mở Console: **F12** → tab **Console**

#### **Trình duyệt 2 (Incognito):**

1. Mở chế độ ẩn danh:
   - Chrome/Edge: `Ctrl + Shift + N`
   - Firefox: `Ctrl + Shift + P`
2. Vào `http://localhost:3001`
3. Đăng nhập với **Tài khoản 2**
4. **Nhấn `Ctrl + Shift + R`** (hard refresh)
5. Mở Console: **F12** → tab **Console**

---

### **BƯỚC 3: TEST PHÒNG HỌC**

#### **Trên Trình duyệt 1:**

1. Vào trang **Rooms** → Click **"Tạo phòng mới"**
2. Tạo phòng (ví dụ: "Test Room")
3. **Kiểm tra Console** phải thấy:
   ```
   ✅ Socket connected: xxx
   🔄 Joining room: yyy
   ```
4. **Copy URL phòng** (ví dụ: `http://localhost:3001/rooms/6a20f857595c03188e7e9fa4`)

#### **Trên Trình duyệt 2:**

1. **PASTE URL phòng** vào address bar
2. **Enter** để vào phòng
3. **Kiểm tra Console** phải thấy:
   ```
   ✅ Socket connected: xxx
   🔄 Joining room: yyy
   ```

#### **Kiểm tra kết quả:**

- ✅ Cả 2 trình duyệt phải thấy **"2 online"**
- ✅ Khung **Thành viên** phải hiện **2 người**
- ✅ Gõ chat trên 1 browser → Người kia **phải thấy ngay lập tức**

---

## 🔧 CÔNG CỤ DEBUG (NẾU VẪN LỖI)

### **Trang Debug chuyên dụng:**

Vào: **`http://localhost:3001/socket-debug`** (trên cả 2 trình duyệt)

**Tính năng:**

- ✅ Xem socket đã connected chưa
- ✅ Xem socket ID và user ID
- ✅ Test ping/pong
- ✅ Join room thủ công
- ✅ Xem danh sách online users realtime
- ✅ Test chat realtime

**Cách dùng:**

1. Copy **Room ID** từ URL (phần sau `/rooms/`)
2. Paste vào ô **"Room ID"**
3. Click **"Join Room"**
4. Phần **"Online Users"** phải hiện **2 người**
5. Gõ chat test → người kia phải thấy

---

## ✅ CHECKLIST (QUAN TRỌNG!)

Trước khi báo lỗi, đảm bảo đã:

- [ ] ✅ Backend đang chạy (`http://localhost:3000`)
- [ ] ✅ Frontend đang chạy (`http://localhost:3001`)
- [ ] ✅ **Đã HARD REFRESH cả 2 trình duyệt: `Ctrl + Shift + R`**
- [ ] ✅ **Dùng 2 TÀI KHOẢN KHÁC NHAU** (khác email)
- [ ] ✅ Trình duyệt 1: normal, Trình duyệt 2: incognito
- [ ] ✅ User 2 đã **PASTE đúng URL phòng** từ User 1
- [ ] ✅ Cả 2 Console (F12) đều thấy "✅ Socket connected"
- [ ] ✅ Cả 2 Console đều thấy "🔄 Joining room"

---

## 🐛 DEBUG NHANH (PASTE VÀO CONSOLE)

Mở Console (**F12** → **Console**), paste từng dòng:

```javascript
// 1. Kiểm tra socket
console.log("Socket:", window.__socket);
console.log("Connected?", window.__socket?.connected);
console.log("Socket ID:", window.__socket?.id);

// 2. Xem online users
window.__socket?.on("room-users", (users) => {
  console.log("👥 Online users:", users);
});

// 3. Test join room thủ công (thay YOUR_ROOM_ID)
window.__socket?.emit("join-room", { roomId: "YOUR_ROOM_ID" });
```

---

## 📸 NẾU VẪN KHÔNG HOẠT ĐỘNG

Gửi cho tôi:

1. **Screenshot Console** của 2 trình duyệt (F12 → Console)
2. **Backend log** (terminal backend, khoảng 50 dòng cuối)
3. **Email của 2 users** (để confirm khác nhau)
4. **Screenshot trang `/socket-debug`** (cả 2 browsers)

---

## 💡 MẸO HAY

### **Kiểm tra nhanh có bao nhiêu socket trong phòng:**

**Trên Backend log**, tìm dòng:

```
[JOIN] Sockets now in room: Set(2) { 'xxx', 'yyy' }
```

- Nếu thấy `Set(1)` → **Chỉ 1 người** đã join
- Nếu thấy `Set(2)` → **Cả 2 người** đã join ✅

### **Lý do chỉ thấy Set(1):**

1. Người thứ 2 chưa vào phòng
2. Hai người dùng cùng 1 tài khoản
3. Socket của người thứ 2 failed to connect

---

## 🎯 TÓM TẮT 1 DÒNG

**Đảm bảo: 2 tài khoản khác nhau + 2 browsers (1 normal + 1 incognito) + Hard refresh (`Ctrl + Shift + R`) + Paste đúng URL phòng**

---

**Tạo:** June 4, 2026  
**Code đã sửa:** ✅ socket.js, RoomDetailPage.jsx, room.handler.js  
**Công cụ mới:** ✅ Trang `/socket-debug`  
**Tài liệu:** ✅ `DEBUG-CHAT-ISSUE.md`, `TINH-HINH-HIEN-TAI.md`
