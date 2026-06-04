# ✅ FIX HOÀN TẤT: activeParticipants Count Issue

**Ngày:** June 4, 2026  
**Vấn đề:** Rời phòng nhưng số "X/30" không giảm

---

## 🎯 NGUYÊN NHÂN CHÍNH

### **1. Ghost participants trong database**

Database còn userId cũ từ sessions trước chưa được cleanup

### **2. React Query cache aggressive**

Frontend cache không được invalidate đúng thời điểm

### **3. Multiple tabs cùng user**

User mở nhiều tabs → nhiều sockets → backend khó track

---

## 🔧 GIẢI PHÁP ĐÃ ÁP DỤNG

### **Fix 1: Clean database**

```bash
node cleanRoomParticipants.js
```

**Kết quả:**

```
✅ Phòng "fpt": 1 → 0 participants
✅ Phòng "toán 12": 1 → 0 participants
```

### **Fix 2: Force refetch trong RoomsPage**

```javascript
const { data: rooms } = useQuery({
  queryKey: ["rooms"],
  queryFn: () => roomApi.getRooms(),
  staleTime: 0, // ✅ Always stale
  refetchOnMount: "always", // ✅ Always refetch
});

// Auto refetch on mount
useEffect(() => {
  refetch();
  refetchMyRooms();
}, []);
```

### **Fix 3: Await refetch trước khi navigate**

```javascript
await queryClient.invalidateQueries({ queryKey: ["rooms"] });
await queryClient.refetchQueries({ queryKey: ["rooms"] });
navigate("/rooms");
```

### **Fix 4: Backend cleanup job**

Cleanup job chạy mỗi giờ để xóa ghost participants

---

## ✅ BÂY GIỜ TEST NGAY

### **Bước 1: Hard refresh browser**

```
Ctrl + Shift + R
```

### **Bước 2: Reload trang /rooms**

```
F5 hoặc Ctrl + R
```

### **Bước 3: Kiểm tra**

- Tất cả phòng phải hiện **"0/30"**
- Không còn ghost participants

### **Bước 4: Test đầy đủ**

1. Vào 1 phòng → Thấy "1 online"
2. Rời phòng → `Ctrl + Shift + R`
3. Xem phòng đó → **Phải thấy "0/30"** ✅

---

## 🔍 DEBUG NHANH

### **Check database qua API:**

Paste vào browser:

```
http://localhost:3000/api/rooms
```

Xem từng phòng:

```json
{
  "name": "toán 12",
  "activeParticipants": [], // ✅ Phải là array rỗng!
  "maxParticipants": 30
}
```

### **Force clear cache:**

Paste vào Console (F12):

```javascript
localStorage.clear();
sessionStorage.clear();
location.reload();
```

---

## 📋 MAINTENANCE SCRIPTS

### **Clean activeParticipants:**

```bash
cd c:\Users\tuann\OneDrive\Desktop\exe\HOCA-BE
node cleanRoomParticipants.js
```

### **Check room status:**

```bash
node checkRoomParticipants.js
```

---

## ⚠️ LƯU Ý QUAN TRỌNG

### **1. Luôn hard refresh sau khi:**

- Restart backend
- Rời phòng
- Thay đổi code

**Cách:** `Ctrl + Shift + R`

### **2. Chỉ mở 1 tab:**

- Đóng tất cả tabs localhost:3001
- Chỉ mở 1 tab duy nhất khi test

### **3. Nếu vẫn thấy ghost participants:**

- Chạy `cleanRoomParticipants.js`
- Restart backend
- Hard refresh frontend

---

## 🚀 STATUS

- ✅ Database đã clean
- ✅ Backend đã restart
- ✅ Frontend code đã fix
- ✅ Scripts maintenance đã tạo
- ⏳ **CHỜ USER TEST**

---

## 📞 NẾU VẪN CÒN VẤN ĐỀ

Làm theo thứ tự:

1. **Hard refresh:** `Ctrl + Shift + R`
2. **Check API:** `http://localhost:3000/api/rooms`
3. **Clean DB:** `node cleanRoomParticipants.js`
4. **Restart BE:** Stop + Start backend
5. **Clear cache:** localStorage.clear() + reload
6. **Test với 1 tab duy nhất**

---

**Updated:** June 4, 2026  
**Status:** Ready for testing ✅
