# 🏫 HƯỚNG DẪN PHÒNG HỌC

## ✅ Đã cập nhật

### 1. Tạo nhiều phòng học mẫu

- ✅ Đã tạo 12 phòng học mẫu với các chủ đề khác nhau
- ✅ Mỗi phòng có sức chứa từ 20-50 người
- ✅ Có cả phòng SILENT (im lặng) và DISCUSSION (thảo luận)

### 2. Chức năng rời phòng

- ✅ Thêm nút "Rời phòng" ở góc trên bên phải
- ✅ Xác nhận trước khi rời phòng
- ✅ Tự động chuyển về trang danh sách phòng sau khi rời

---

## 📋 Danh sách phòng học mẫu

1. **📚 Phòng Học Chung - Sáng** (50 người, SILENT, Pomodoro 25/5)
2. **🌙 Phòng Học Đêm - Yên Tĩnh** (50 người, SILENT, Pomodoro 50/10)
3. **💻 Phòng Lập Trình** (40 người, SILENT, Count Up)
4. **📖 Phòng Đọc Sách** (30 người, SILENT, Pomodoro 45/5)
5. **🎯 Phòng Thi Cử - Tập Trung** (50 người, SILENT, Pomodoro 50/10)
6. **🎓 Phòng Ôn Tập Đại Học** (45 người, SILENT, Pomodoro 25/5)
7. **✍️ Phòng Viết Luận Văn** (25 người, SILENT, Count Up)
8. **🧮 Phòng Học Toán** (35 người, SILENT, Pomodoro 45/5)
9. **🌍 Phòng Học Ngoại Ngữ** (30 người, DISCUSSION, Pomodoro 25/5)
10. **🎨 Phòng Sáng Tạo** (20 người, SILENT, Count Up)
11. **⚡ Phòng Học Nhanh - 25 phút** (50 người, SILENT, Pomodoro 25/5)
12. **🔥 Phòng Marathon - 50 phút** (40 người, SILENT, Pomodoro 50/10)

---

## 🚀 Cách sử dụng

### Tạo lại phòng học mẫu

Nếu muốn tạo lại các phòng học mẫu:

```bash
cd HOCA-BE
npm run seed:rooms
```

Script sẽ:

- Xóa tất cả phòng admin cũ
- Tạo 12 phòng học mẫu mới
- Tất cả phòng đều là phòng công khai (public)

### Tham gia phòng học

1. Vào trang **Phòng học** (http://localhost:3001/rooms)
2. Chọn phòng muốn tham gia
3. Click vào phòng để vào học

### Rời phòng học

Khi đang trong phòng học:

1. Click nút **"Rời phòng"** ở góc trên bên phải
2. Xác nhận muốn rời phòng
3. Sẽ tự động quay về trang danh sách phòng

---

## 🎯 Tính năng phòng học

### Loại phòng

- **SILENT (Im lặng)**: Không ai được dùng mic, tập trung học tuyệt đối
- **DISCUSSION (Thảo luận)**: HOCA+ có thể dùng mic để thảo luận

### Timer Mode

- **POMODORO_25_5**: Học 25 phút, nghỉ 5 phút
- **POMODORO_45_5**: Học 45 phút, nghỉ 5 phút
- **POMODORO_50_10**: Học 50 phút, nghỉ 10 phút
- **COUNT_UP**: Đếm thời gian học lên (không giới hạn)

### Giới hạn

- **FREE users**:
  - Tạo tối đa 3 phòng/ngày
  - Mỗi phòng tồn tại 60 phút
  - Chỉ tạo được phòng SILENT
- **HOCA+ users**:
  - Tạo không giới hạn phòng
  - Phòng tồn tại vô thời hạn
  - Tạo được cả phòng DISCUSSION

---

## 📝 Lưu ý

- Phòng admin (isAdminRoom: true) không có chủ sở hữu
- Phòng admin không tự động đóng
- Người dùng có thể tham gia nhiều phòng cùng lúc
- Khi rời phòng, dữ liệu học tập vẫn được lưu

---

## 🔧 Troubleshooting

### Không thấy phòng học?

```bash
# Chạy lại script seed
cd HOCA-BE
npm run seed:rooms
```

### Lỗi khi rời phòng?

- Kiểm tra backend có đang chạy không
- Kiểm tra console log để xem lỗi chi tiết
- Thử refresh lại trang

---

**Chúc bạn học tập hiệu quả! 📚✨**
