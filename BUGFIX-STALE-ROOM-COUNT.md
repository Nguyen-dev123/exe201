# 🐛 BUGFIX: Số người trong phòng không cập nhật sau khi rời

**Ngày:** June 4, 2026  
**Vấn đề:** Rời phòng xong, về trang /rooms vẫn hiện số người cũ (ví dụ: 2/30 thay vì 1/30)

---

## 📋 MÔ TẢ VẤN ĐỀ

### **Triệu chứng:**

1. ✅ Trong phòng có 1 người (chỉ mình bạn)
2. ✅ Click "Rời phòng" → Navigate về /rooms
3. ❌ Trang /rooms vẫn hiện "2/30" (stale data)
4. ❌ Phải refresh trang (`F5`) mới thấy "1/30"

### **Nguyên nhân:**

#### **React Query Cache không được invalidate**

```
Flow:
1. User vào phòng
   └─> React Query fetch room data
   └─> Cache: {activeParticipants: [user1, user2]}

2. User2 rời phòng
   └─> Backend cập nhật: activeParticipants = [user1]
   └─> Frontend navigate về /rooms
   └─> ❌ React Query vẫn dùng cache CŨ
   └─> Hiển thị: 2/30 (sai!)

3. User refresh trang (F5)
   └─> React Query refetch
   └─> Hiển thị: 1/30 (đúng!)
```

**Vấn đề:** Khi leave room thành công, không invalidate React Query cache!

---

## 🔨 GIẢI PHÁP

### **Invalidate Query Cache sau khi Leave/Close Room**

**Ý tưởng:**

- ✅ Sau khi API `/leave` thành công
- ✅ Gọi `queryClient.invalidateQueries()` để force refetch
- ✅ Navigate về /rooms với data mới

---

## 📝 CODE CHANGES

### **1. Import `useQueryClient`**

**File:** `hoca-fe/src/pages/RoomDetailPage.jsx`

```javascript
// Before
import { useQuery } from "@tanstack/react-query";

// After
import { useQuery, useQueryClient } from "@tanstack/react-query";
```

### **2. Initialize queryClient trong component**

```javascript
export default function RoomDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient(); // ✅ Add this
  const { token, user } = useAuthStore();
  // ...
}
```

### **3. Invalidate cache trong `finishLeave()`**

**Before:**

```javascript
const finishLeave = async () => {
  setShowFeedback(false);
  setLeaving(true);

  // ... emit leave-room, cleanup listeners ...

  try {
    await api.post(`/api/rooms/${id}/leave`);
  } catch {
    /* ignore */
  } finally {
    navigate("/rooms"); // ← Navigate with stale cache!
  }
};
```

**After:**

```javascript
const finishLeave = async () => {
  setShowFeedback(false);
  setLeaving(true);

  // ... emit leave-room, cleanup listeners ...

  try {
    await api.post(`/api/rooms/${id}/leave`);

    // ✅ Invalidate room queries to refetch fresh data
    queryClient.invalidateQueries({ queryKey: ["rooms"] });
    queryClient.invalidateQueries({ queryKey: ["my-rooms"] });
    queryClient.invalidateQueries({ queryKey: ["room", id] });
  } catch {
    /* ignore */
  } finally {
    navigate("/rooms"); // ← Navigate with fresh cache!
  }
};
```

### **4. Tương tự cho `handleCloseRoom()`**

```javascript
const handleCloseRoom = async () => {
  if (!confirm("Đóng phòng này?")) return;

  // ... cleanup listeners ...

  try {
    await api.post(`/api/rooms/${id}/close`);
    toast.success("Đã đóng phòng!");

    // ✅ Invalidate room queries
    queryClient.invalidateQueries({ queryKey: ["rooms"] });
    queryClient.invalidateQueries({ queryKey: ["my-rooms"] });

    navigate("/rooms");
  } catch (error) {
    toast.error(error.response?.data?.message);
  }
};
```

---

## 🧪 TESTING

### **Test Case 1: Single User Leave**

**Setup:**

1. Chỉ bạn trong phòng (1 person)
2. Phòng hiển thị "1 online"

**Steps:**

1. Click "Rời phòng"
2. Navigate về /rooms
3. Xem card của phòng vừa rời

**Expected:**

- ✅ Hiển thị "0/30" (không còn ai)
- ✅ KHÔNG cần refresh (F5)
- ✅ Data được refetch tự động

---

### **Test Case 2: Multi User - One Leaves**

**Setup:**

1. User A và User B trong phòng
2. Hiển thị "2 online"

**Steps:**

1. User A click "Rời phòng"
2. User A navigate về /rooms
3. Xem card của phòng

**Expected (User A):**

- ✅ Thấy "1/30" (còn User B)
- ✅ KHÔNG cần refresh

**Expected (User B - vẫn trong phòng):**

- ✅ Thấy "1 online" (chỉ còn mình)
- ✅ Toast: "User A đã rời phòng"

---

## 🔍 WHY THIS WORKS

### **React Query Cache Flow:**

#### **Before Fix:**

```
1. Fetch rooms → Cache: {room1: {activeParticipants: [A, B]}}
2. User A leaves → Backend updates → {activeParticipants: [B]}
3. Navigate /rooms → Use cache (stale!) → Show 2/30 ❌
4. Manual refresh → Refetch → Show 1/30 ✅
```

#### **After Fix:**

```
1. Fetch rooms → Cache: {room1: {activeParticipants: [A, B]}}
2. User A leaves → Backend updates → {activeParticipants: [B]}
3. invalidateQueries() → Mark cache as stale
4. Navigate /rooms → Auto refetch → Show 1/30 ✅
```

---

## 📊 WHAT IS `invalidateQueries`?

### **Purpose:**

Marks cached data as "stale" and triggers refetch

### **Syntax:**

```javascript
// Invalidate all queries with key starting with "rooms"
queryClient.invalidateQueries({ queryKey: ["rooms"] });

// Invalidate specific room
queryClient.invalidateQueries({ queryKey: ["room", roomId] });

// Invalidate multiple
queryClient.invalidateQueries({ queryKey: ["rooms"] });
queryClient.invalidateQueries({ queryKey: ["my-rooms"] });
```

### **When it refetches:**

- ✅ Immediately if component using the query is mounted
- ✅ On next mount if component is unmounted
- ✅ On window focus (if `refetchOnWindowFocus: true`)

---

## ⚠️ LƯU Ý

### **1. Invalidate TẤT CẢ related queries**

Nếu bỏ sót 1 query → vẫn có thể show stale data ở đâu đó

```javascript
// Good: Invalidate all related
queryClient.invalidateQueries({ queryKey: ["rooms"] }); // All public rooms
queryClient.invalidateQueries({ queryKey: ["my-rooms"] }); // My rooms
queryClient.invalidateQueries({ queryKey: ["room", id] }); // Specific room
```

### **2. Timing matters**

Invalidate **SAU KHI** API call thành công:

```javascript
try {
  await api.post(`/api/rooms/${id}/leave`);  // ← Wait for success
  queryClient.invalidateQueries(...);         // ← Then invalidate
} catch (error) {
  // Don't invalidate if failed!
}
```

### **3. Backend phải update activeParticipants**

Frontend invalidate cache cũng vô dụng nếu backend không update!

**Backend code (đã có sẵn):**

```javascript
// room.service.js - leaveRoom()
room.activeParticipants = room.activeParticipants.filter(
  (id) => id.toString() !== userId,
);
await room.save(); // ✅ Must save to DB!
```

---

## 📈 RELATED QUERIES TO INVALIDATE

### **Khi nào nên invalidate gì:**

| Action           | Invalidate Queries                |
| ---------------- | --------------------------------- |
| Leave room       | `rooms`, `my-rooms`, `room-${id}` |
| Close room       | `rooms`, `my-rooms`               |
| Delete room      | `rooms`, `my-rooms`               |
| Create room      | `rooms`, `my-rooms`               |
| Join room        | `room-${id}`                      |
| Update profile   | `users-me`                        |
| Buy subscription | `users-me`                        |

---

## ✅ CHECKLIST

- [x] Import `useQueryClient`
- [x] Initialize `queryClient` in component
- [x] Invalidate queries in `finishLeave()`
- [x] Invalidate queries in `handleCloseRoom()`
- [x] Backend updates `activeParticipants` (already working)
- [x] Test: Leave room → count updates immediately
- [x] Test: No need to refresh page
- [x] Document fix

---

## 🚀 NEXT IMPROVEMENTS

### **1. Optimistic Updates**

Update UI immediately, không cần đợi API:

```javascript
// Update cache immediately
queryClient.setQueryData(["rooms"], (old) => {
  return old.map((room) =>
    room._id === id
      ? {
          ...room,
          activeParticipants: room.activeParticipants.filter(
            (u) => u !== userId,
          ),
        }
      : room,
  );
});

// Then call API
await api.post(`/api/rooms/${id}/leave`);
```

### **2. Real-time updates via Socket**

Khi user leave, emit socket event → Other users' cache auto-update:

```javascript
socket.on("user-left", ({ roomId, userId }) => {
  queryClient.setQueryData(["rooms"], (old) => {
    // Update cache for all connected users
  });
});
```

---

**Status:** ✅ Fixed  
**Impact:** Room participant counts update immediately without refresh  
**Updated:** June 4, 2026
