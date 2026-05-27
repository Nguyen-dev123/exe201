# 🔒 HƯỚNG DẪN ĐÓNG PHÒNG HỌC

## ✅ Đã cập nhật

### Thêm chức năng đóng phòng

- ✅ Nút "Đóng phòng" màu đỏ ở header
- ✅ Chỉ chủ phòng hoặc Admin mới thấy nút
- ✅ Xác nhận trước khi đóng
- ✅ Tất cả người trong phòng bị đá ra
- ✅ Thông báo realtime qua socket
- ✅ Tự động chuyển về trang danh sách phòng

---

## 🎯 Sự khác biệt

### Đóng phòng vs Xóa phòng vs Rời phòng

| Tính năng             | Đóng phòng                  | Xóa phòng        | Rời phòng        |
| --------------------- | --------------------------- | ---------------- | ---------------- |
| **Ai có thể làm**     | Chủ phòng, Admin            | Chủ phòng, Admin | Tất cả mọi người |
| **Phòng còn tồn tại** | ✅ Có (đóng)                | ❌ Không         | ✅ Có            |
| **Người khác bị đá**  | ✅ Có                       | ✅ Có            | ❌ Không         |
| **Có thể mở lại**     | ✅ Có (tính năng tương lai) | ❌ Không         | ✅ Có            |
| **Dữ liệu giữ lại**   | ✅ Có                       | ❌ Không         | ✅ Có            |
| **Icon**              | 🔒 XCircle                  | 🗑️ Trash2        | 🚪 LogOut        |
| **Màu nút**           | Đỏ                          | Đỏ               | Trắng/Xám        |

---

## 🔧 Cách sử dụng

### Đóng phòng (Chủ phòng/Admin)

1. Vào phòng học của bạn
2. Ở header, bên cạnh nút "Rời phòng", click **"Đóng phòng"** (màu đỏ)
3. Xác nhận: "Bạn có chắc muốn đóng phòng này? Tất cả người dùng sẽ bị đá ra."
4. Click **OK**
5. ✅ Phòng bị đóng
6. ✅ Tất cả người trong phòng nhận thông báo và bị đá ra
7. ✅ Bạn được chuyển về trang danh sách phòng

### Xóa phòng (Chủ phòng/Admin)

1. Vào trang **Phòng học**
2. Tìm phòng của bạn
3. Click icon **thùng rác** 🗑️
4. Xác nhận xóa
5. ✅ Phòng bị xóa vĩnh viễn

### Rời phòng (Tất cả mọi người)

1. Đang trong phòng học
2. Click nút **"Rời phòng"**
3. Xác nhận
4. ✅ Bạn rời phòng, phòng vẫn hoạt động

---

## 🎨 Giao diện

### Header phòng (Chủ phòng):

```
┌────────────────────────────────────────────────────────┐
│ 📚 Phòng Học Toán                                      │
│ Không có mô tả                                         │
│ 👥 5 người đang online  🟢 Đang hoạt động             │
│                                                        │
│                    [🔒 Đóng phòng] [🚪 Rời phòng]     │
└────────────────────────────────────────────────────────┘
```

### Header phòng (Thành viên thường):

```
┌────────────────────────────────────────────────────────┐
│ 📚 Phòng Học Toán                                      │
│ Không có mô tả                                         │
│ 👥 5 người đang online  🟢 Đang hoạt động             │
│                                                        │
│                                   [🚪 Rời phòng]      │
└────────────────────────────────────────────────────────┘
```

---

## ⚡ Flow đóng phòng

### Khi chủ phòng đóng phòng:

```
1. Chủ phòng click "Đóng phòng"
   ↓
2. Confirm dialog hiện ra
   ↓
3. Chủ phòng xác nhận
   ↓
4. Frontend gọi POST /api/rooms/:id/close
   ↓
5. Backend:
   - Đánh dấu phòng isActive = false
   - Emit socket "room-closed" đến tất cả người trong phòng
   ↓
6. Tất cả người trong phòng:
   - Nhận event "room-closed"
   - Hiển thị toast error "Phòng đã bị đóng"
   - Sau 2 giây tự động chuyển về /rooms
   ↓
7. Phòng đóng thành công ✅
```

---

## 🧪 Test

### Test đóng phòng:

1. **Setup:**
   - Mở 2 tab trình duyệt
   - Tab 1: Đăng nhập User A (chủ phòng)
   - Tab 2: Đăng nhập User B (thành viên)

2. **User A tạo phòng:**
   - Tạo phòng mới
   - Vào phòng

3. **User B vào phòng:**
   - Vào cùng phòng với User A
   - ✅ Thấy User A trong danh sách online

4. **User A đóng phòng:**
   - Click nút "Đóng phòng"
   - Xác nhận
   - ✅ User A được chuyển về /rooms

5. **User B bị đá:**
   - ✅ Nhận toast "Phòng đã bị đóng"
   - ✅ Sau 2 giây tự động về /rooms

6. **Kiểm tra phòng:**
   - Vào lại trang phòng học
   - ✅ Phòng vẫn hiển thị nhưng có trạng thái "Đã đóng"

---

## 🔐 Quyền hạn

### Chủ phòng (Owner):

- ✅ Thấy nút "Đóng phòng"
- ✅ Đóng phòng của mình
- ✅ Xóa phòng của mình
- ✅ Rời phòng

### Admin:

- ✅ Thấy nút "Đóng phòng" ở tất cả phòng
- ✅ Đóng bất kỳ phòng nào
- ✅ Xóa bất kỳ phòng nào
- ✅ Rời phòng

### Thành viên thường:

- ❌ Không thấy nút "Đóng phòng"
- ❌ Không thể đóng phòng
- ❌ Không thể xóa phòng
- ✅ Chỉ có thể rời phòng

---

## 📡 Socket Events

### room-closed

Được emit khi phòng bị đóng

**Payload:**

```javascript
{
  roomId: "6a143a7ef7461ca575a6325e",
  reason: "manual",
  message: "Phòng đã được đóng bởi chủ phòng."
}
```

**Frontend xử lý:**

```javascript
socket.on("room-closed", (data) => {
  toast.error(data.message || "Phòng đã bị đóng");
  setTimeout(() => {
    navigate("/rooms");
  }, 2000);
});
```

---

## 🎯 Use Cases

### Khi nào nên đóng phòng?

✅ **Nên đóng:**

- Buổi học kết thúc
- Cần nghỉ giải lao dài
- Muốn giữ phòng nhưng tạm dừng
- Có sự cố cần xử lý

❌ **Không nên đóng:**

- Chỉ muốn rời phòng tạm thời → Dùng "Rời phòng"
- Không cần phòng nữa → Dùng "Xóa phòng"
- Muốn người khác tiếp tục học → Dùng "Rời phòng"

---

## 🔮 Tính năng tương lai

- [ ] Mở lại phòng đã đóng
- [ ] Lên lịch đóng phòng tự động
- [ ] Thông báo trước khi đóng (countdown)
- [ ] Lý do đóng phòng (optional message)
- [ ] Lịch sử đóng/mở phòng

---

**Chúc bạn quản lý phòng học hiệu quả! 🎓**
