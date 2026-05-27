# 💬 HƯỚNG DẪN CHAT VÀ TRẠNG THÁI ONLINE

## ✅ Đã cập nhật

### 1. Hiển thị trạng thái online

- ✅ Hiển thị số người đang online ở header phòng
- ✅ Chấm xanh nhấp nháy "Đang hoạt động"
- ✅ Danh sách thành viên với trạng thái online realtime
- ✅ Avatar với chấm xanh cho người online

### 2. Cải thiện khung chat

- ✅ Giao diện chat đẹp hơn với bubble messages
- ✅ Avatar cho mỗi tin nhắn
- ✅ Phân biệt tin nhắn của bạn và người khác
- ✅ Hiển thị thời gian gửi
- ✅ Auto scroll xuống tin nhắn mới
- ✅ Placeholder khi chưa có tin nhắn

### 3. Realtime updates

- ✅ Cập nhật danh sách online khi có người vào/ra
- ✅ Thông báo toast khi có người tham gia/rời phòng
- ✅ Socket.io để đồng bộ realtime

---

## 🎨 Giao diện

### Header phòng:

```
┌────────────────────────────────────────────────┐
│ 📚 Phòng Học Toán                [Rời phòng]  │
│ Không có mô tả                                 │
│ 👥 5 người đang online  🟢 Đang hoạt động     │
└────────────────────────────────────────────────┘
```

### Danh sách thành viên:

```
┌─────────────────────────┐
│ Thành viên    5 online  │
├─────────────────────────┤
│ 🔵 Nguyễn Văn A         │
│    🟢 Đang online        │
│                         │
│ 🔵 Trần Thị B (Bạn)     │
│    🟢 Đang online        │
│                         │
│ 🔵 Lê Văn C             │
│    🟢 Đang online        │
└─────────────────────────┘
```

### Khung chat:

```
┌────────────────────────────────────────┐
│ 💬 Chat phòng học                      │
│ Trò chuyện với 5 người đang online    │
├────────────────────────────────────────┤
│                                        │
│  🔵 Nguyễn Văn A                       │
│     Chào mọi người!                    │
│     10:30                              │
│                                        │
│                    Xin chào! 🔵        │
│                           10:31        │
│                                        │
│  🔵 Trần Thị B                         │
│     Cùng học nhé!                      │
│     10:32                              │
│                                        │
├────────────────────────────────────────┤
│ [Nhập tin nhắn...]          [Gửi]     │
└────────────────────────────────────────┘
```

---

## 🔧 Tính năng chi tiết

### Trạng thái online

- **Realtime**: Cập nhật ngay lập tức khi có người vào/ra
- **Chấm xanh**: Hiển thị bên cạnh avatar
- **Số lượng**: Hiển thị ở header và sidebar
- **Animation**: Chấm xanh nhấp nháy để thu hút sự chú ý

### Chat

- **Bubble messages**: Tin nhắn dạng bong bóng
- **Màu sắc**: Xanh cho tin nhắn của bạn, trắng cho người khác
- **Avatar**: Hiển thị avatar người gửi
- **Thời gian**: Format 10:30, 14:45, v.v.
- **Auto scroll**: Tự động cuộn xuống tin nhắn mới
- **Responsive**: Hoạt động tốt trên mobile

### Socket events

- `join-room`: Tham gia phòng
- `leave-room`: Rời phòng
- `user-joined`: Có người vào
- `user-left`: Có người ra
- `room-users`: Danh sách người online
- `chat-message`: Tin nhắn mới
- `new-message`: Tin nhắn mới (alias)

---

## 🧪 Test

### Test trạng thái online:

1. Mở 2 tab trình duyệt
2. Đăng nhập 2 tài khoản khác nhau
3. Cả 2 vào cùng 1 phòng
4. ✅ Thấy nhau trong danh sách online
5. 1 người rời phòng
6. ✅ Người còn lại thấy danh sách cập nhật

### Test chat:

1. Mở 2 tab với 2 tài khoản
2. Cả 2 vào cùng phòng
3. User A gửi tin nhắn "Hello"
4. ✅ User B nhận được tin nhắn ngay lập tức
5. User B reply "Hi"
6. ✅ User A nhận được reply

### Test realtime:

1. User A đang trong phòng
2. User B vào phòng
3. ✅ User A thấy toast "User B đã tham gia phòng"
4. ✅ Danh sách online cập nhật
5. User B rời phòng
6. ✅ User A thấy toast "User B đã rời phòng"
7. ✅ Danh sách online cập nhật

---

## 📱 Responsive

### Desktop (>768px):

- Chat bên trái (75%)
- Danh sách thành viên bên phải (25%)
- Layout 2 cột

### Mobile (<768px):

- Chat full width
- Danh sách thành viên ẩn hoặc dưới chat
- Layout 1 cột

---

## 🎯 Lợi ích

### Cho người dùng:

- ✅ Biết ai đang online
- ✅ Chat với nhau dễ dàng
- ✅ Cảm giác học cùng nhau
- ✅ Tăng động lực học tập

### Cho hệ thống:

- ✅ Tăng tương tác người dùng
- ✅ Giữ chân người dùng lâu hơn
- ✅ Tạo cộng đồng học tập
- ✅ Thu thập feedback realtime

---

**Chúc bạn học tập vui vẻ! 🎉**
