# 🔗 LẤY CONNECTION STRING MONGODB (KHÔNG DÙNG SRV)

## 🎯 Mục tiêu

Lấy connection string dạng standard (không dùng SRV) để tránh lỗi DNS.

---

## 📋 BƯỚC 1: Đăng nhập MongoDB Atlas

1. Mở trình duyệt
2. Vào: **https://cloud.mongodb.com/**
3. Đăng nhập với tài khoản của bạn

---

## 📋 BƯỚC 2: Vào Database

1. Sau khi đăng nhập, bạn sẽ thấy Dashboard
2. Bên trái, click vào **Database** (hoặc **Databases**)
3. Bạn sẽ thấy cluster **exe201**

---

## 📋 BƯỚC 3: Lấy Connection String

1. Tìm cluster **exe201**
2. Click nút **Connect** (màu xanh/xám)
3. Chọn **Drivers** (hoặc **Connect your application**)

---

## 📋 BƯỚC 4: Chọn Driver

1. **Driver**: Chọn **Node.js**
2. **Version**: Chọn **4.1 or later** (hoặc bất kỳ version nào)

---

## 📋 BƯỚC 5: Copy Connection String

Bạn sẽ thấy connection string dạng:

```
mongodb+srv://nguyendinhtuan25224_db_user:<password>@exe201.3rnnkdg.mongodb.net/?retryWrites=true&w=majority&appName=exe201
```

### ⚠️ QUAN TRỌNG: Thay `<password>`

Thay `<password>` bằng mật khẩu thật: **nguyendinhtuan**

Kết quả:

```
mongodb+srv://nguyendinhtuan25224_db_user:nguyendinhtuan@exe201.3rnnkdg.mongodb.net/?retryWrites=true&w=majority&appName=exe201
```

---

## 📋 BƯỚC 6: Thêm Database Name

Thêm `/hoca-db` sau `.mongodb.net`:

```
mongodb+srv://nguyendinhtuan25224_db_user:nguyendinhtuan@exe201.3rnnkdg.mongodb.net/hoca-db?retryWrites=true&w=majority&appName=exe201
```

---

## 📋 BƯỚC 7: Copy và gửi cho tôi

**Copy connection string đầy đủ** và gửi cho tôi, tôi sẽ cập nhật vào file `.env`.

---

## 🔄 HOẶC: Tìm Standard Connection String

Nếu bạn muốn connection string **không dùng SRV** (dạng `mongodb://` thay vì `mongodb+srv://`):

### Trong MongoDB Atlas:

1. Sau khi click **Connect** → **Drivers**
2. Tìm phần **Connection String**
3. Bên dưới có link: **View full code sample** hoặc **I have a different connection string**
4. Click vào đó
5. Chọn tab **Standard Connection String** (không phải SRV)
6. Copy connection string dạng:

   ```
   mongodb://exe201-shard-00-00.3rnnkdg.mongodb.net:27017,exe201-shard-00-01.3rnnkdg.mongodb.net:27017,exe201-shard-00-02.3rnnkdg.mongodb.net:27017/?ssl=true&replicaSet=atlas-xxxxx-shard-0&authSource=admin&retryWrites=true&w=majority
   ```

7. Thêm username, password và database name:
   ```
   mongodb://nguyendinhtuan25224_db_user:nguyendinhtuan@exe201-shard-00-00.3rnnkdg.mongodb.net:27017,exe201-shard-00-01.3rnnkdg.mongodb.net:27017,exe201-shard-00-02.3rnnkdg.mongodb.net:27017/hoca-db?ssl=true&replicaSet=atlas-xxxxx-shard-0&authSource=admin&retryWrites=true&w=majority
   ```

---

## 🎯 Sau khi có Connection String

**Gửi cho tôi** connection string đầy đủ, tôi sẽ:

1. Cập nhật vào file `HOCA-BE/.env`
2. Restart backend
3. Kiểm tra kết nối

---

## 💡 Lưu ý

- Connection string có chứa mật khẩu, nhưng không sao vì đây là project của bạn
- Nếu không muốn share, bạn có thể tự update file `.env`:
  1. Mở file `HOCA-BE/.env`
  2. Tìm dòng `MONGODB_URI=...`
  3. Thay bằng connection string mới
  4. Save file
  5. Backend sẽ tự động restart

---

**Bắt đầu từ BƯỚC 1 nhé! Sau khi có connection string, gửi cho tôi.**
