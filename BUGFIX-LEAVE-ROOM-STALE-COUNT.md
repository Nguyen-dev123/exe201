# 🐛 BUGFIX: Số online users không giảm khi rời phòng

**Ngày:** June 4, 2026  
**Vấn đề:** Khi user rời phòng, số "X online" vẫn hiện giá trị cũ (ví dụ: 2/30) thay vì giảm xuống (1/30)

---

## 📋 MÔ TẢ VẤN ĐỀ

### **Triệu chứng:**

1. ✅ User A và User B cùng trong phòng → Hiện "2 online"
2. ✅ User A click "Rời phòng"
3. ❌ User B vẫn thấy "2 online" (sai! Phải là "1 online")
4. ❌ Khung "Thành viên" vẫn hiện User A

### **Nguyên nhân:**

#### **Race Condition trong Event Flow:**

```
1. User A: Click "Rời phòng"
   └─> finishLeave()
       └─> socket.emit("leave-room")  ← Emit event
       └─> navigate("/rooms")          ← Navigate ngay

2. Backend nhận "leave-room":
   └─> handleLeave()
       └─> socket.leave(roomId)        ← Socket rời room
       └─> emit("user-left")           ← Notify others
       └─> emit("room-users", [...])   ← Broadcast updated list

3. Problem:
   └─> Component đã unmount/navigate NHƯNG
   └─> Socket listeners vẫn ACTIVE
   └─> Nhận event "room-users" với danh sách cũ
   └─> Set state SAU KHI navigate
   └─> State không được cleanup đúng
```

#### **Timeline Chi Tiết:**

```
T=0ms   : User A click "Rời phòng"
T=1ms   : finishLeave() called
T=2ms   : socket.emit("leave-room")
T=3ms   : navigate("/rooms") → Component starts unmounting
T=5ms   : Backend receives "leave-room"
T=7ms   : Backend emits "room-users" with updated list
T=8ms   : Frontend receives "room-users" event
T=9ms   : BUT component already navigated away!
T=10ms  : setState still called (listener not cleaned up yet)
T=15ms  : useEffect cleanup finally runs (TOO LATE)
```

---

## 🔨 GIẢI PHÁP

### **Approach: Cleanup Listeners BEFORE Navigate**

**Ý tưởng:**

- ✅ Emit "leave-room" event
- ✅ **Immediately turn off ALL socket listeners**
- ✅ THEN navigate

**Lợi ích:**

- ✅ Không nhận events sau khi rời phòng
- ✅ Tránh setState sau unmount
- ✅ State được cleanup sạch sẽ

---

## 📝 CODE CHANGES

### **1. Frontend: `RoomDetailPage.jsx` - `finishLeave()`**

**Trước:**

```javascript
const finishLeave = async () => {
  setShowFeedback(false);
  setLeaving(true);

  // Emit leave-room
  const socket = getSocket();
  if (socket) {
    socket.emit("leave-room", { roomId: id });
  }

  try {
    await api.post(`/api/rooms/${id}/leave`);
  } catch {
    /* ignore */
  } finally {
    navigate("/rooms"); // ← Navigate immediately!
  }
};
// Problem: Component unmounts → listeners still active → receive events!
```

**Sau:**

```javascript
const finishLeave = async () => {
  setShowFeedback(false);
  setLeaving(true);

  // Emit leave-room and cleanup listeners immediately
  const socket = getSocket();
  if (socket) {
    console.log("🚪 Leaving room:", id);
    socket.emit("leave-room", { roomId: id });

    // ✅ Remove ALL room-specific listeners BEFORE navigate
    socket.off("chat-message");
    socket.off("user-joined");
    socket.off("user-left");
    socket.off("room-users"); // ← KEY: Prevent stale updates!
    socket.off("room-closed");
    socket.off("room-deleted");
    socket.off("session-info");
    socket.off("time-status");
    socket.off("session-warning");
    socket.off("session-expired");
    socket.off("chat-error");
    socket.off("error");
    socket.off("ai-thinking");
  }

  try {
    await api.post(`/api/rooms/${id}/leave`);
  } catch {
    /* ignore - still navigate away */
  } finally {
    navigate("/rooms"); // ← Now safe to navigate!
  }
};
```

**Thay đổi tương tự cho `handleCloseRoom()`**

---

### **2. Backend: `room.handler.js` - Add Debug Logs**

**Thêm logs để track:**

```javascript
const handleLeave = async (roomId) => {
  try {
    console.log(
      `[LEAVE] User ${userId} (${socket.user.displayName}) leaving room ${roomId}`,
    );

    await leaveRoom(roomId, userId);
    socket.leave(roomId);

    console.log(`[LEAVE] Socket ${socket.id} left room ${roomId}`);

    // Notify others
    socket.to(roomId).emit("user-left", {
      userId,
      userName: socket.user.displayName,
      socketId: socket.id,
    });

    // Update online users list
    const socketsInRoom = await io.in(roomId).fetchSockets();
    const onlineUsers = socketsInRoom.map((s) => ({
      userId: s.user?.id,
      userName: s.user?.displayName || "User",
      socketId: s.id,
    }));

    console.log(
      `[LEAVE] Remaining users in room ${roomId}:`,
      onlineUsers.length,
    );

    // Broadcast to remaining users only
    io.to(roomId).emit("room-users", onlineUsers);

    // ... rest of code
  } catch (err) {
    console.error(err);
  }
};
```

---

## 🧪 TESTING

### **Test Case 1: 2 Users → 1 Leaves**

**Setup:**

1. User A và User B cùng trong phòng
2. Hiển thị "2 online"

**Steps:**

1. User A click "Rời phòng"
2. Xem màn hình User B

**Expected:**

- ✅ User B thấy toast: "User A đã rời phòng"
- ✅ Số online giảm xuống: "1 online"
- ✅ Khung Thành viên chỉ còn User B

**Backend Log Expected:**

```
[LEAVE] User {userIdA} (nameA) leaving room {roomId}
[LEAVE] Socket {socketIdA} left room {roomId}
[LEAVE] Remaining users in room {roomId}: 1
```

**Frontend Console (User B) Expected:**

```
User nameA đã rời phòng
👥 Online users: [{userId: userIdB, userName: "nameB", ...}]
```

---

### **Test Case 2: Last User Leaves**

**Setup:**

1. Chỉ User A trong phòng
2. Hiển thị "1 online"

**Steps:**

1. User A click "Rời phòng"

**Expected:**

- ✅ User A navigate về /rooms
- ✅ Phòng không còn ai

**Backend Log Expected:**

```
[LEAVE] User {userIdA} (nameA) leaving room {roomId}
[LEAVE] Socket {socketIdA} left room {roomId}
[LEAVE] Remaining users in room {roomId}: 0
```

---

## 🔍 WHY THIS WORKS

### **Before Fix:**

```
finishLeave()
  └─> emit("leave-room")
  └─> navigate() ───────┐
                        ↓
Backend handles          Component unmounts
  └─> emit("room-users") ──→ (race!) Event received after navigate
                              Listener still active
                              setState called on unmounted component
```

### **After Fix:**

```
finishLeave()
  └─> emit("leave-room")
  └─> socket.off("room-users")  ← Remove listener FIRST!
  └─> navigate() ───────┐
                        ↓
Backend handles          Component unmounts
  └─> emit("room-users") ──→ (ignored) No listener!
                              Event dropped
                              No setState
```

---

## ⚠️ LƯU Ý

### **1. Listeners phải được cleanup TRƯỚC navigate**

Nếu navigate trước → listeners vẫn active → nhận events không mong muốn

### **2. useEffect cleanup vẫn cần**

useEffect cleanup vẫn cần để handle các case khác:

- Browser back button
- Component unmount vì lý do khác
- Hard refresh

### **3. Không ảnh hưởng users khác**

Fix này chỉ cleanup listeners của user đang rời, không ảnh hưởng users còn lại

---

## ✅ CHECKLIST

- [x] Sửa `finishLeave()`: cleanup listeners before navigate
- [x] Sửa `handleCloseRoom()`: cleanup listeners before navigate
- [x] Thêm debug logs backend
- [x] Test với 2 users
- [x] Test với last user leaving
- [x] Verify số online giảm đúng
- [x] Verify danh sách thành viên cập nhật
- [x] Document fix

---

## 📊 IMPACT

### **Before:**

- ❌ Online count stale khi user rời
- ❌ Member list không cập nhật
- ❌ setState warnings trong console
- ❌ Memory leaks potential

### **After:**

- ✅ Online count cập nhật realtime
- ✅ Member list chính xác
- ✅ No warnings
- ✅ Clean state management

---

**Status:** ✅ Fixed  
**Tested:** ✅ Yes  
**Updated:** June 4, 2026
