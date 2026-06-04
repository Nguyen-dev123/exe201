# 🔧 BÁO CÁO SỬA LỖI: Socket Connection & Chat Issue

**Ngày:** June 4, 2026  
**Vấn đề:** Người dùng không thấy nhau online trong phòng học, chat không broadcast

---

## 📋 TÓM TẮT

### **Triệu chứng:**

- ✅ Chỉ thấy 1 người online dù có 2+ người trong phòng
- ✅ Chat chỉ người gửi thấy, người khác không thấy
- ✅ Khung "Thành viên" chỉ hiện 1 người

### **Nguyên nhân:**

1. ✅ Socket connection stale (không check `socket.connected`)
2. ✅ Race condition: emit `join-room` trước khi socket connected
3. ✅ Frontend cache code cũ
4. ✅ **User testing với cùng 1 tài khoản** (nguyên nhân chính)

---

## 🔨 NHỮNG GÌ ĐÃ SỬA

### **1. Frontend: `socket.js`**

**File:** `hoca-fe/src/lib/socket.js`

**Thay đổi:**

- ✅ Thêm check `socket.connected` trước khi return socket cũ
- ✅ Cleanup socket disconnected trước khi tạo mới
- ✅ Ưu tiên WebSocket transport (`["websocket", "polling"]`)
- ✅ Cấu hình reconnection: 5 attempts, 1s delay
- ✅ Expose `window.__socket` cho debugging

**Code:**

```javascript
export const initSocket = (token) => {
  // Check if socket exists AND is connected
  if (socket && socket.connected) {
    return socket;
  }

  // Cleanup disconnected socket
  if (socket) {
    socket.disconnect();
    socket = null;
  }

  // Create new socket with better config
  socket = io(API_BASE, {
    auth: { token },
    transports: ["websocket", "polling"], // Prefer websocket
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionAttempts: 5,
  });

  // Expose for debugging
  if (typeof window !== "undefined") {
    window.__socket = socket;
  }

  return socket;
};
```

---

### **2. Frontend: `RoomDetailPage.jsx`**

**File:** `hoca-fe/src/pages/RoomDetailPage.jsx`

**Thay đổi:**

- ✅ Đợi socket connected trước khi emit `join-room`
- ✅ Thêm fallback: nếu chưa connected, đợi event `connect`
- ✅ Thêm debug logs: "🔄 Joining room"

**Code:**

```javascript
const joinRoom = () => {
  if (socket.connected) {
    console.log("🔄 Joining room:", id);
    socket.emit("join-room", { roomId: id });
  } else {
    console.log("⏳ Waiting for socket connection...");
    socket.once("connect", () => {
      console.log("🔄 Socket connected, now joining room:", id);
      socket.emit("join-room", { roomId: id });
    });
  }
};

joinRoom();
```

---

### **3. Backend: `room.handler.js`**

**File:** `HOCA-BE/src/socket/room.handler.js`

**Thay đổi:**

- ✅ Thêm debug logs chi tiết:
  - `[JOIN] User {userId} ({name}) attempting to join room {roomId}`
  - `[JOIN] Sockets now in room: Set(...)`
  - `[CHAT] User {name} sent message in room {roomId}`
  - `[CHAT] Broadcasting message to room`

**Code:**

```javascript
socket.on("join-room", async ({ roomId, password }) => {
  console.log(
    `[JOIN] User ${userId} (${socket.user.displayName}) attempting to join room ${roomId}`,
  );

  const result = await joinRoom(roomId, userId, password);
  socket.join(roomId);

  console.log(`[JOIN] User ${userId} successfully joined room ${roomId}`);
  console.log(`[JOIN] Sockets now in room:`, await io.in(roomId).allSockets());

  // ... rest of code
});
```

---

### **4. Tools: Trang Debug**

**File mới:** `hoca-fe/src/pages/SocketDebugPage.jsx`  
**Route:** `/socket-debug`

**Tính năng:**

- ✅ Hiển thị socket connection status (connected/disconnected)
- ✅ Hiển thị socket ID và user ID
- ✅ Test ping/pong để check latency
- ✅ Join/leave room thủ công
- ✅ Hiển thị danh sách online users realtime
- ✅ Test chat giữa nhiều users
- ✅ Console logs chi tiết

**Cách dùng:** Xem `HUONG-DAN-TEST-NHANH.md`

---

## 📚 TÀI LIỆU

### **Hướng dẫn cho User:**

1. ✅ **`HUONG-DAN-TEST-NHANH.md`** - Hướng dẫn test 3 bước
2. ✅ **`DEBUG-CHAT-ISSUE.md`** - Hướng dẫn debug chi tiết
3. ✅ **`TINH-HINH-HIEN-TAI.md`** - Tình hình và checklist

### **Log kỹ thuật:**

1. ✅ **`BUGFIX-SOCKET-CONNECTION.md`** - Chi tiết thay đổi code
2. ✅ **`README-FIX-SOCKET.md`** - File này

### **Tools:**

1. ✅ `/socket-debug` - Trang debug chuyên dụng
2. ✅ `checkUsers.js` - Script kiểm tra users trong DB
3. ✅ `window.__socket` - Socket object trong console

---

## 🧪 CÁCH TEST

### **Setup:**

1. Backend: `http://localhost:3000` (Process ID: 5)
2. Frontend: `http://localhost:3001` (Process ID: 2)
3. 2 tài khoản test khác nhau
4. 2 trình duyệt: 1 normal + 1 incognito

### **Test Flow:**

#### **Trình duyệt 1:**

1. Login với user1
2. Hard refresh: `Ctrl + Shift + R`
3. Mở Console: F12
4. Tạo phòng mới
5. Check console: "✅ Socket connected", "🔄 Joining room"
6. Copy URL phòng

#### **Trình duyệt 2:**

1. Login với user2
2. Hard refresh: `Ctrl + Shift + R`
3. Mở Console: F12
4. Paste URL phòng từ user1
5. Check console: "✅ Socket connected", "🔄 Joining room"

#### **Expected Results:**

- ✅ Cả 2 thấy "2 online"
- ✅ Khung Thành viên hiện 2 người
- ✅ Chat từ user1 → user2 thấy ngay
- ✅ Chat từ user2 → user1 thấy ngay

#### **Backend Log Expected:**

```
User connected: {userId1} | Socket ID: xxx
[JOIN] User {userId1} (name1) attempting to join room {roomId}
[JOIN] Sockets now in room: Set(1) { 'xxx' }

User connected: {userId2} | Socket ID: yyy
[JOIN] User {userId2} (name2) attempting to join room {roomId}
[JOIN] Sockets now in room: Set(2) { 'xxx', 'yyy' }  ← MUST SEE 2!

[CHAT] User name1 sent message in room {roomId}
[CHAT] Broadcasting message to room

[CHAT] User name2 sent message in room {roomId}
[CHAT] Broadcasting message to room
```

---

## ⚠️ LƯU Ý QUAN TRỌNG

### **1. Hard Refresh là BẮT BUỘC**

Sau khi code thay đổi, **PHẢI hard refresh**:

- Windows: `Ctrl + Shift + R`
- Mac: `Cmd + Shift + R`

### **2. 2 Tài khoản PHẢI khác nhau**

- ❌ Sai: user1@test.com + user1@test.com
- ✅ Đúng: user1@test.com + user2@test.com

### **3. Cùng 1 tài khoản = Socket replaced**

Nếu login cùng 1 tài khoản trên 2 browsers:

- Login lần 2 → token mới → socket cũ disconnect
- Backend chỉ thấy 1 socket (socket mới)

### **4. Browser Cache**

Vite HMR (hot reload) tốt nhưng **không đảm bảo 100%**:

- Socket.io client có thể cache
- Browser service worker có thể cache
- **Giải pháp:** Hard refresh hoặc Disable cache (F12 → Network → Disable cache)

---

## 🔍 TROUBLESHOOTING

### **Vẫn thấy Set(1) trong backend log:**

**Nguyên nhân:**

1. ✅ Người thứ 2 chưa paste URL vào browser
2. ✅ Người thứ 2 chưa enter/load trang
3. ✅ Hai người cùng tài khoản
4. ✅ Socket connection failed (check frontend console)

**Giải pháp:**

- Đảm bảo CẢ 2 đều vào đúng URL phòng
- Check console cả 2 browsers: phải thấy "✅ Socket connected"
- Dùng 2 email khác nhau

### **Console không thấy "✅ Socket connected":**

**Nguyên nhân:**

1. ✅ Backend không chạy
2. ✅ Frontend config sai API_BASE
3. ✅ Token không hợp lệ
4. ✅ CORS issue

**Giải pháp:**

- Check backend: `http://localhost:3000`
- Check `hoca-fe/src/lib/config.js`: `API_BASE = "http://localhost:3000"`
- Logout + Login lại để refresh token
- Check backend log có error không

### **Chat không broadcast:**

**Nguyên nhân:**

1. ✅ Socket không trong room (`Set(1)`)
2. ✅ Chat permissions (FREE tier) - đã fix, giờ FREE cũng chat được
3. ✅ Event listener không được setup

**Giải pháp:**

- Check backend log: phải thấy `[CHAT] Broadcasting message`
- Check frontend console: phải thấy incoming chat-message event
- Dùng `/socket-debug` để test chi tiết

---

## 📊 METRICS

### **Trước khi fix:**

- Socket stale: không check connected state
- Race condition: emit trước khi connected
- Không có debug tools
- Users confused vì không biết nguyên nhân

### **Sau khi fix:**

- ✅ Socket luôn connected khi emit
- ✅ Đợi connection trước khi join room
- ✅ Debug page cho troubleshooting
- ✅ Logs chi tiết backend + frontend
- ✅ Documentation đầy đủ

---

## 🎯 NEXT STEPS

### **Nếu User báo vẫn lỗi:**

1. **Thu thập thông tin:**
   - Screenshot console (F12) của CẢ 2 browsers
   - Backend log (50 dòng cuối)
   - Email của 2 users (confirm khác nhau)
   - Screenshot trang `/socket-debug`

2. **Kiểm tra:**
   - [ ] Đã hard refresh chưa?
   - [ ] 2 tài khoản khác nhau chưa?
   - [ ] Backend log thấy bao nhiêu sockets?
   - [ ] Frontend console có errors không?

3. **Debug thêm:**
   - Add more logs nếu cần
   - Kiểm tra network tab: có request socket.io polling không
   - Kiểm tra CORS headers
   - Test với browsers khác (Chrome, Firefox, Edge)

---

## ✅ CHECKLIST ĐÃ HOÀN THÀNH

- [x] Sửa socket.js: check connected state
- [x] Sửa RoomDetailPage.jsx: đợi connection
- [x] Thêm debug logs backend
- [x] Tạo trang `/socket-debug`
- [x] Expose `window.__socket`
- [x] Viết documentation đầy đủ:
  - [x] HUONG-DAN-TEST-NHANH.md
  - [x] DEBUG-CHAT-ISSUE.md
  - [x] TINH-HINH-HIEN-TAI.md
  - [x] BUGFIX-SOCKET-CONNECTION.md
  - [x] README-FIX-SOCKET.md (file này)
- [x] Frontend hot-reloaded với code mới
- [x] Backend đang chạy với logs
- [x] Test tools sẵn sàng

---

## 📞 SUPPORT

**Nếu cần hỗ trợ thêm:**

1. Đọc `HUONG-DAN-TEST-NHANH.md` để test
2. Dùng `/socket-debug` để debug
3. Check `DEBUG-CHAT-ISSUE.md` cho troubleshooting
4. Gửi thông tin như hướng dẫn trong docs

**Tools:**

- Debug page: `http://localhost:3001/socket-debug`
- Console commands: Xem trong `TINH-HINH-HIEN-TAI.md`
- Backend logs: Terminal Process ID 5

---

**Status:** ✅ Code fixed, tools ready, docs complete  
**Chờ:** User test với checklist trong `HUONG-DAN-TEST-NHANH.md`  
**Updated:** June 4, 2026
