# ✨ Tính năng Tìm kiếm Phòng học

## 🎯 Mục tiêu

Cho phép người dùng tìm kiếm **BẤT KỲ** phòng học nào đã được tạo ra, chỉ cần nhập tên là có thể tìm thấy và tham gia.

## 🔧 Cách hoạt động

### 1. **Server-side Search (Backend)**

- API endpoint: `GET /api/rooms?search=<keyword>`
- Tìm kiếm trong database với MongoDB regex (case-insensitive)
- Chỉ trả về phòng: `isPublic: true` và `isActive: true`

```javascript
// Backend query
Room.find({
  isPublic: true,
  isActive: true,
  name: { $regex: search, $options: "i" },
});
```

### 2. **Frontend Smart Search**

- **Debounce**: Đợi 300ms sau khi user ngừng gõ mới gọi API (tránh spam requests)
- **Real-time**: Kết quả cập nhật ngay khi gõ
- **Loading indicator**: Hiển thị spinner khi đang search
- **Merge results**: Kết hợp kết quả public rooms + my rooms (để luôn thấy phòng của mình)

```javascript
// Frontend debounce
useEffect(() => {
  const timer = setTimeout(() => {
    setDebouncedSearch(searchTerm);
  }, 300);
  return () => clearTimeout(timer);
}, [searchTerm]);
```

### 3. **Database Management**

- **Fix script**: `/api/cron/fix-rooms-public` - Reopen tất cả phòng và set thành public
- Đảm bảo mọi phòng đều có `isPublic: true` và `isActive: true`

## 📝 Các trường hợp sử dụng

### ✅ Hoạt động tốt

1. Tìm "Toán" → Tìm thấy "Toán 12", "Toán lớp 10"
2. Tìm "12" → Tìm thấy tất cả phòng có "12" trong tên
3. Tìm "fpt" → Tìm thấy phòng "fpt"
4. Không nhập gì → Hiển thị tất cả phòng public

### ❌ Không tìm thấy khi

1. Phòng đã bị đóng (`isActive: false`)
2. Phòng là private (`isPublic: false`)
3. Phòng bị xóa khỏi database
4. Tên tìm kiếm không khớp với bất kỳ phòng nào

## 🛠️ Cách fix khi phòng không tìm thấy

### Option 1: Sử dụng API maintenance

```bash
curl "http://localhost:3000/api/cron/fix-rooms-public?secret=hoca_cron_secret_key"
```

### Option 2: Tạo phòng mới

- Phòng mới tự động là public và active
- Backend đã được fix để đảm bảo `isPublic: true` mặc định

## 📊 Kết quả sau khi fix (2026-06-03)

- ✅ 8/8 phòng đã được reopen
- ✅ Tất cả phòng giờ là public và active
- ✅ Search hoạt động với tất cả phòng

## 🚀 Các cải tiến đã thực hiện

1. **Backend**
   - ✅ Đảm bảo phòng mới luôn là public (trừ khi có password)
   - ✅ API reopen phòng đã đóng
   - ✅ Search với regex case-insensitive

2. **Frontend**
   - ✅ Debounce search (300ms)
   - ✅ Loading indicator khi search
   - ✅ Merge public rooms + my rooms
   - ✅ Better empty state messages
   - ✅ Server-side filtering thay vì client-side

## 🎨 UI/UX Improvements

- Loading spinner trong input khi đang search
- "Đang tìm kiếm..." thay vì "Đang tải..."
- Gợi ý tạo phòng mới khi không tìm thấy
- Button "Xóa tìm kiếm" để reset

## 🔍 Test Cases

### Test 1: Search existing room

1. Tạo phòng "Toán 12"
2. Đăng nhập bằng account khác
3. Search "Toán" → Should find "Toán 12" ✅

### Test 2: Search with numbers

1. Search "123" → Should find room "123" ✅

### Test 3: Search with special characters

1. Search "văn" or "vân" → Should find rooms with those names ✅

### Test 4: Empty search

1. Clear search box → Should show all public rooms ✅

## 💡 Tips

- Tên phòng nên rõ ràng, dễ tìm (VD: "Toán 12", "Học Python", "FPT Study")
- Tránh tên quá ngắn (1-2 ký tự) vì dễ trùng lặp
- Có thể thêm description để dễ phân biệt
