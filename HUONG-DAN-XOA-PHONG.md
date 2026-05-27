# 🗑️ HƯỚNG DẪN XÓA PHÒNG HỌC

## ✅ Đã cập nhật

### 1. Xóa tất cả phòng mẫu

- ✅ Đã xóa 12 phòng học mẫu
- ✅ Người dùng tự tạo phòng của mình

### 2. Thêm chức năng xóa phòng

- ✅ Nút xóa phòng (icon thùng rác) ở góc trên bên phải mỗi phòng
- ✅ Chỉ chủ phòng hoặc Admin mới thấy nút xóa
- ✅ Xác nhận trước khi xóa
- ✅ Thông báo cho tất cả người trong phòng khi phòng bị xóa

---

## 🎯 Cách sử dụng

### Tạo phòng học mới

1. Vào trang **Phòng học** (http://localhost:3001/rooms)
2. Click nút **"Tạo phòng mới"**
3. Điền tên phòng và mô tả
4. Click **"Tạo phòng"**

### Xóa phòng học

**Chỉ chủ phòng hoặc Admin mới có thể xóa phòng**

1. Vào trang **Phòng học**
2. Tìm phòng của bạn (có dòng chữ "Phòng của bạn" màu xanh)
3. Click vào **icon thùng rác** 🗑️ ở góc trên bên phải
4. Xác nhận xóa phòng
5. Phòng sẽ bị xóa vĩnh viễn

---

## 🔐 Quyền hạn

### Chủ phòng (Owner)

- ✅ Xem nút xóa phòng
- ✅ Xóa phòng của mình
- ✅ Đóng phòng
- ✅ Rời phòng

### Admin

- ✅ Xem nút xóa tất cả phòng
- ✅ Xóa bất kỳ phòng nào
- ✅ Đóng bất kỳ phòng nào

### Thành viên thường

- ❌ Không thấy nút xóa
- ✅ Chỉ có thể rời phòng

---

## ⚠️ Lưu ý quan trọng

### Khi xóa phòng:

- ⚠️ **Phòng sẽ bị xóa vĩnh viễn**, không thể khôi phục
- ⚠️ Tất cả tin nhắn trong phòng sẽ bị xóa
- ⚠️ Tất cả người đang trong phòng sẽ bị đá ra
- ⚠️ Lịch sử học tập trong phòng sẽ bị mất

### Khuyến nghị:

- Nếu chỉ muốn tạm dừng, hãy dùng **"Đóng phòng"** thay vì xóa
- Nếu muốn rời phòng nhưng giữ phòng cho người khác, dùng **"Rời phòng"**
- Chỉ xóa phòng khi thực sự không cần nữa

---

## 🎨 Giao diện

### Phòng của bạn:

```
┌─────────────────────────────────────┐
│ 📚 Phòng Học Toán        [🗑️]      │
│ Không có mô tả                      │
│ 👥 5 người    🕐 Đang hoạt động     │
│ Phòng của bạn                       │
└─────────────────────────────────────┘
```

### Phòng của người khác:

```
┌─────────────────────────────────────┐
│ 📖 Phòng Đọc Sách                   │
│ Không có mô tả                      │
│ 👥 3 người    🕐 Đang hoạt động     │
└─────────────────────────────────────┘
```

---

## 🔧 API Endpoints

### DELETE /api/rooms/:id

Xóa phòng học

**Headers:**

```
Authorization: Bearer <token>
```

**Response Success (200):**

```json
{
  "message": "Room deleted successfully"
}
```

**Response Error (403):**

```json
{
  "message": "Only room owner or admin can delete the room"
}
```

**Response Error (404):**

```json
{
  "message": "Room not found"
}
```

---

## 🧪 Test

### Test xóa phòng của mình:

1. Đăng nhập
2. Tạo phòng mới
3. Xóa phòng vừa tạo
4. ✅ Phòng biến mất khỏi danh sách

### Test xóa phòng người khác (không phải admin):

1. Đăng nhập user thường
2. Vào trang phòng học
3. ❌ Không thấy nút xóa ở phòng người khác

### Test xóa phòng với admin:

1. Đăng nhập admin
2. Vào trang phòng học
3. ✅ Thấy nút xóa ở tất cả phòng
4. Xóa bất kỳ phòng nào
5. ✅ Phòng bị xóa thành công

---

**Chúc bạn sử dụng hiệu quả! 🎉**
