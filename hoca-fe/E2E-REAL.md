# E2E với database test thật

Bộ `e2e/real-api.spec.js` chỉ chạy khi có môi trường cô lập. Không trỏ các biến này vào production.

Các biến bắt buộc:

```text
E2E_API_URL=http://127.0.0.1:3000
E2E_ADMIN_EMAIL=admin@your-test-db.local
E2E_ADMIN_PASSWORD=...
E2E_USER_EMAIL=user@your-test-db.local
E2E_USER_PASSWORD=...
E2E_PEER_EMAIL=peer@your-test-db.local
E2E_PEER_PASSWORD=...
E2E_DATABASE_NAME=hoca-e2e
E2E_ALLOW_MUTATIONS=true
```

Backend phải được khởi động với `MONGODB_URI` trỏ tới database test riêng. Khi thiếu một biến, suite tự skip để bảo vệ dữ liệu thật.

Chạy:

```powershell
npm run test:e2e:real
```

PayOS/VNPay, email OTP, Cloudinary và WebRTC cần sandbox/provider test riêng. Các đường dẫn này tiếp tục được kiểm tra bằng unit/contract test; không phát sinh giao dịch, gửi email hoặc upload vào tài khoản production.
