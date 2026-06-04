# 🧪 TEST: Kiểm tra activeParticipants qua API

## Vấn đề hiện tại

Sau khi rời phòng, trang /rooms vẫn hiện "2/30"

## Test Steps

### 1. Kiểm tra database trực tiếp qua API

Mở browser, paste URL này (thay YOUR_ROOM_ID):

```
http://localhost:3000/api/rooms/6a20f857595c03188e7e9fa4
```

**Xem field `activeParticipants`:**

- Nếu `[]` (empty array) → Database đúng, frontend cache sai
- Nếu vẫn có userId → Database chưa update

### 2. Kiểm tra frontend có gọi invalidate không

**Mở Console (F12), paste code này:**

```javascript
// Check if queryClient available
console.log("QueryClient:", window.__queryClient);

// Force refetch manually
if (window.location.pathname === "/rooms") {
  window.location.reload();
}
```

### 3. Test flow đầy đủ

#### A. Vào phòng:

1. Mở http://localhost:3001/rooms
2. Click vào phòng "toàn 12" (hoặc phòng bất kỳ)
3. Xem hiển thị bao nhiêu online

#### B. Rời phòng:

1. Click "Rời phòng"
2. **MỞ Console (F12) TRƯỚC KHI click**
3. Xem log:
   ```
   🚪 Leaving room: 6a20f857595c03188e7e9fa4
   ```

#### C. Check trang /rooms:

1. Sau khi navigate về /rooms
2. **HARD REFRESH: Ctrl + Shift + R**
3. Xem số người trong phòng vừa rời
4. Phải giảm đi 1 (hoặc về 0)

### 4. Nếu vẫn không đúng

**Lý do có thể:**

#### A. Bạn đang mở 2 TABS cùng tài khoản:

```
Tab 1: User "pun" vào phòng → socket1
Tab 2: User "pun" vào phòng → socket2
Backend thấy: 2 sockets, CÙNG 1 userId

Khi Tab 1 rời:
- Backend remove userId từ activeParticipants
- Nhưng Tab 2 vẫn còn trong phòng!
- → activeParticipants add lại userId
- → Số người vẫn 1 (đúng!)

Frontend:
- Tab 1 navigate ra → thấy 1/30 (đúng - còn Tab 2)
- Nhưng BẠN NGHĨ là 0/30 vì "chỉ mình tôi"
```

**Giải pháp:** ĐÓNG TẤT CẢ TABS, chỉ mở 1 tab duy nhất!

#### B. Browser extension can thiệp:

- AdBlock
- React DevTools
- Các extension khác

**Giải pháp:** Test trong Incognito mode

#### C. Service Worker cache:

```
Application → Service Workers → Unregister
```

### 5. Test chắc chắn nhất

**Step-by-step:**

1. **ĐÓNG TẤT CẢ TABS của localhost:3001**

2. **Mở 1 TAB DUY NHẤT:**

   ```
   http://localhost:3001
   ```

3. **Login:**
   - Email: pun (hoặc tài khoản của bạn)

4. **MỞ CONSOLE (F12):**
   - Tab: Console
   - Clear console: `Ctrl + L`

5. **Vào trang Rooms:**

   ```
   http://localhost:3001/rooms
   ```

6. **Click vào phòng "toàn 12":**
   - Xem console log: "✅ Socket connected"
   - Xem console log: "🔄 Joining room"

7. **Xem số online:**
   - Trong phòng: "X online" (ví dụ: 1 online)

8. **Click "Rời phòng":**
   - Xem console log: "🚪 Leaving room"
   - Navigate về /rooms

9. **NGAY SAU ĐÓ:**
   - **Nhấn `Ctrl + Shift + R`** (hard refresh)
   - Xem card phòng "toàn 12"
   - Số người phải là: (X-1)/30

10. **Nếu số người KHÔNG đổi:**
    - Chụp màn hình Console
    - Chụp màn hình Network tab (F12 → Network)
    - Gửi cho tôi

---

## Debug Commands

### Paste vào Console để debug:

```javascript
// 1. Check React Query cache
const cache = window.__reactQuery?._cache;
console.log("Cache:", cache);

// 2. Force clear cache
localStorage.clear();
sessionStorage.clear();
location.reload();

// 3. Check API response
fetch("http://localhost:3000/api/rooms/6a20f857595c03188e7e9fa4")
  .then((r) => r.json())
  .then((data) => {
    console.log("Room data from API:");
    console.log("Active participants:", data.activeParticipants);
    console.log("Count:", data.activeParticipants?.length || 0);
  });

// 4. Check all rooms
fetch("http://localhost:3000/api/rooms")
  .then((r) => r.json())
  .then((rooms) => {
    console.log("All rooms:");
    rooms.forEach((room) => {
      console.log(
        `${room.name}: ${room.activeParticipants?.length || 0}/${room.maxParticipants}`,
      );
    });
  });
```

---

## Expected Behavior

### Scenario: Solo User

```
1. User vào phòng trống
   → Database: activeParticipants = [userId]
   → Display: 1/30 ✅

2. User rời phòng
   → Backend: activeParticipants = []
   → Frontend invalidate cache
   → Navigate /rooms
   → Display: 0/30 ✅
```

### Scenario: 2 Users (2 tài khoản khác nhau)

```
1. User A vào phòng
   → activeParticipants = [userA]
   → Display: 1/30

2. User B vào phòng
   → activeParticipants = [userA, userB]
   → Display: 2/30

3. User A rời
   → activeParticipants = [userB]
   → User A thấy: 1/30 ✅
   → User B thấy: 1 online ✅

4. User B rời
   → activeParticipants = []
   → User B thấy: 0/30 ✅
```

### Scenario: 1 User, 2 Tabs (CÙNG tài khoản)

```
1. Tab 1 vào phòng
   → activeParticipants = [userId]
   → Display: 1/30

2. Tab 2 vào phòng (cùng user)
   → Backend thấy 2 sockets
   → Nhưng logic có thể:
     Option A: Vẫn 1 userId (đúng)
     Option B: 2 userId entries (bug - cần fix)

3. Tab 1 rời
   → Tab 2 vẫn trong phòng
   → activeParticipants = [userId] (đúng!)
   → Tab 1 thấy: 1/30 ✅ (vì Tab 2 còn)

❌ LẦM TƯỞNG: "Chỉ có mình tôi mà sao thấy 1/30?"
✅ THỰC TẾ: Bạn có 2 tabs cùng vào phòng!
```

---

## Solution

### Nếu là case "2 tabs cùng user":

**Đóng tất cả tabs, chỉ mở 1 tab!**

### Nếu thật sự là bug cache:

**Hard refresh luôn luôn:** `Ctrl + Shift + R`

---

Hãy làm theo test steps trên và cho tôi biết kết quả!
