# 🔧 FIX HOÀN CHỈNH: Số người không cập nhật sau khi rời phòng

**Ngày:** June 4, 2026  
**Vấn đề:** Rời phòng xong vẫn hiện "2/30", không giảm xuống

---

## 🎯 GIẢI PHÁP ĐÃ ÁP DỤNG

### **1. Force refetch trong RoomsPage**

**File:** `hoca-fe/src/pages/RoomsPage.jsx`

**Thay đổi:**

```javascript
// Before: Dùng cache mặc định
const { data: rooms } = useQuery({
  queryKey: ["rooms", debouncedSearch],
  queryFn: () => roomApi.getRooms(debouncedSearch || undefined),
});

// After: Force refetch mỗi lần mount
const { data: rooms, refetch } = useQuery({
  queryKey: ["rooms", debouncedSearch],
  queryFn: () => roomApi.getRooms(debouncedSearch || undefined),
  staleTime: 0, // ✅ Luôn coi data là stale
  refetchOnMount: "always", // ✅ Luôn refetch khi mount
});

// Thêm useEffect để refetch
React.useEffect(() => {
  console.log("🔄 RoomsPage mounted, refetching data...");
  refetch();
  refetchMyRooms();
}, [refetch, refetchMyRooms]);
```

---

### **2. Await refetch trong finishLeave**

**File:** `hoca-fe/src/pages/RoomDetailPage.jsx`

**Thay đổi:**

```javascript
// Before: Chỉ invalidate, không đợi refetch
queryClient.invalidateQueries({ queryKey: ["rooms"] });
navigate("/rooms"); // ← Navigate ngay, cache chưa update!

// After: Await refetch TRƯỚC KHI navigate
await queryClient.invalidateQueries({ queryKey: ["rooms"] });
await queryClient.invalidateQueries({ queryKey: ["my-rooms"] });

// Force refetch immediately
await queryClient.refetchQueries({ queryKey: ["rooms"] });
await queryClient.refetchQueries({ queryKey: ["my-rooms"] });

console.log("✅ Queries invalidated and refetched");
navigate("/rooms"); // ← Navigate sau khi data đã fresh!
```

**Thêm debug logs:**

```javascript
console.log("📡 Calling leave API...");
await api.post(`/api/rooms/${id}/leave`);
console.log("✅ Leave API success");
console.log("🔄 Invalidating queries...");
// ... invalidate & refetch ...
console.log("✅ Queries invalidated and refetched");
console.log("🔀 Navigating to /rooms");
```

---

## 🧪 TEST

### **Bước 1: Hard refresh**

1. Mở browser
2. Nhấn `Ctrl + Shift + R`

### **Bước 2: Mở Console**

1. Nhấn `F12`
2. Tab **Console**
3. **QUAN TRỌNG:** Để Console mở trong suốt quá trình test

### **Bước 3: Test rời phòng**

1. Login
2. Vào phòng "toàn 12"
3. Xem số online (ví dụ: 1 online)
4. Click "Rời phòng"

### **Bước 4: Kiểm tra Console logs**

**Phải thấy logs này theo thứ tự:**

```
🚪 Leaving room: 6a20f857595c03188e7e9fa4
📡 Calling leave API...
✅ Leave API success
🔄 Invalidating queries...
✅ Queries invalidated and refetched
🔀 Navigating to /rooms
🔄 RoomsPage mounted, refetching data...
```

### **Bước 5: Kiểm tra kết quả**

- Xem card phòng "toàn 12"
- Số người phải cập nhật: **0/30** hoặc giảm đi 1

---

## 🔍 NẾU VẪN KHÔNG HOẠT ĐỘNG

### **Debug Commands (paste vào Console):**

```javascript
// 1. Check API data
fetch("http://localhost:3000/api/rooms")
  .then((r) => r.json())
  .then((rooms) => {
    console.log("=== ROOMS FROM API ===");
    rooms.forEach((room) => {
      console.log(`${room.name}:`);
      console.log(`  - ID: ${room._id}`);
      console.log(`  - Active: ${room.activeParticipants?.length || 0}`);
      console.log(`  - Max: ${room.maxParticipants}`);
      console.log(`  - Participants:`, room.activeParticipants);
    });
  });

// 2. Clear all cache
localStorage.clear();
sessionStorage.clear();
location.reload();

// 3. Check specific room
const roomId = "6a20f857595c03188e7e9fa4";
fetch(`http://localhost:3000/api/rooms/${roomId}`)
  .then((r) => r.json())
  .then((room) => {
    console.log("Room:", room.name);
    console.log("Active participants:", room.activeParticipants);
  });
```

---

## ⚠️ NGUYÊN NHÂN CÓ THỂ (NẾU VẪN LỖI)

### **1. Nhiều tabs cùng tài khoản**

```
Tab 1: User "pun" vào phòng → socket1
Tab 2: User "pun" vào phòng → socket2

Backend: activeParticipants = [userId] (chỉ 1 entry)
Nhưng 2 sockets đang active!

Tab 1 rời → socket1 disconnect
Tab 2 vẫn còn → Backend vẫn thấy userId trong phòng!

→ Hiển thị 1/30 (đúng! vì Tab 2 còn)
```

**GIẢI PHÁP:** ĐÓNG TẤT CẢ TABS, chỉ mở 1 tab!

### **2. Browser cache aggressive**

- Disable cache trong DevTools
- Settings → Preferences → Network → Disable cache

### **3. Service Worker**

- F12 → Application → Service Workers → Unregister All

---

## 📊 TIMELINE HOẠT ĐỘNG

### **Flow sau khi sửa:**

```
T=0ms:   User click "Rời phòng"
T=1ms:   finishLeave() called
T=2ms:   socket.emit("leave-room")
T=3ms:   socket.off(...) cleanup listeners
T=5ms:   api.post("/leave") → Backend xử lý
T=100ms: Backend update activeParticipants = []
T=101ms: API response success
T=102ms: queryClient.invalidateQueries()
T=103ms: queryClient.refetchQueries() → Fetch fresh data
T=200ms: Fresh data received: activeParticipants = []
T=201ms: navigate("/rooms")
T=202ms: RoomsPage mount → useEffect refetch
T=250ms: Display updated: 0/30 ✅
```

---

## ✅ CHECKLIST

- [x] `staleTime: 0` trong RoomsPage queries
- [x] `refetchOnMount: "always"` trong RoomsPage
- [x] useEffect refetch trong RoomsPage
- [x] await invalidateQueries trong finishLeave
- [x] await refetchQueries trong finishLeave
- [x] Debug logs đầy đủ
- [x] Restart frontend & backend
- [ ] **TODO:** User test và confirm

---

## 🚀 NEXT STEP

1. **Hard refresh:** `Ctrl + Shift + R`
2. **Mở Console:** F12
3. **Test rời phòng**
4. **Xem logs trong Console**
5. **Nếu vẫn lỗi:** Gửi screenshot Console logs

---

**Status:** ✅ Code đã sửa, chờ test  
**Updated:** June 4, 2026
