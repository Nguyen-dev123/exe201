/**
 * Script để test API cập nhật giá
 * Cần có:
 * 1. Server đang chạy
 * 2. Token admin (lấy từ login)
 */

const readline = require("readline");

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

async function updatePrices() {
  console.log("═══════════════════════════════════════════");
  console.log("  🔧 CẬP NHẬT GIÁ GÓI PREMIUM VIA API");
  console.log("═══════════════════════════════════════════\n");

  console.log("📝 Giá mới:");
  console.log("   • Gói Năm Premium: 500.000 đ");
  console.log("   • Gói Vĩnh viễn: 999.000 đ\n");

  console.log("⚠️  YÊU CẦU:");
  console.log("   1. Server đang chạy tại http://localhost:3000");
  console.log("   2. Bạn cần token admin để thực hiện\n");

  rl.question("Nhập Admin Token (hoặc Enter để bỏ qua): ", async (token) => {
    if (!token || token.trim() === "") {
      console.log("\n❌ Không có token. Hướng dẫn lấy token:");
      console.log("   1. Mở Postman hoặc browser console");
      console.log("   2. Login với admin account: POST /api/auth/login");
      console.log("   3. Copy token từ response");
      console.log("   4. Chạy lại script này với token\n");

      console.log("💡 HOẶC bạn có thể gọi API trực tiếp:");
      console.log("   POST http://localhost:3000/api/pricing/quick-update");
      console.log(
        '   Headers: { "Authorization": "Bearer YOUR_ADMIN_TOKEN" }\n',
      );
      rl.close();
      return;
    }

    try {
      console.log("\n🔄 Đang gửi request...\n");

      const response = await fetch(
        "http://localhost:3000/api/pricing/quick-update",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token.trim()}`,
            "Content-Type": "application/json",
          },
        },
      );

      const data = await response.json();

      if (!response.ok) {
        console.log("❌ Lỗi:", data.message || "Unknown error");
        if (response.status === 401) {
          console.log("💡 Token không hợp lệ hoặc đã hết hạn");
        } else if (response.status === 403) {
          console.log("💡 Tài khoản không có quyền admin");
        }
      } else {
        console.log("✅ CẬP NHẬT THÀNH CÔNG!\n");
        console.log("📋 Kết quả:");

        if (data.updated?.yearly) {
          console.log(`\n✓ Gói Năm Premium:`);
          console.log(
            `  - Giá: ${data.updated.yearly.price.toLocaleString("vi-VN")} đ`,
          );
          console.log(`  - Tên: ${data.updated.yearly.name}`);
        }

        if (data.updated?.lifetime) {
          console.log(`\n✓ Gói Vĩnh viễn:`);
          console.log(
            `  - Giá: ${data.updated.lifetime.price.toLocaleString("vi-VN")} đ`,
          );
          console.log(`  - Tên: ${data.updated.lifetime.name}`);
        }

        if (data.allPlans) {
          console.log(`\n📊 Tất cả gói giá hiện tại:`);
          data.allPlans.forEach((plan, i) => {
            console.log(`\n${i + 1}. ${plan.name} (${plan.tier})`);
            console.log(`   Giá: ${plan.price.toLocaleString("vi-VN")} đ`);
            console.log(
              `   Thời hạn: ${plan.durationDays === -1 ? "Vĩnh viễn" : plan.durationDays + " ngày"}`,
            );
          });
        }

        console.log("\n═══════════════════════════════════════════");
        console.log("  ✅ HOÀN TẤT!");
        console.log("═══════════════════════════════════════════\n");
      }
    } catch (error) {
      console.log("\n❌ LỖI:", error.message);

      if (error.message.includes("fetch")) {
        console.log("\n💡 Đảm bảo:");
        console.log("   1. Server đang chạy: npm start");
        console.log("   2. Server chạy tại: http://localhost:3000");
        console.log("   3. Kiểm tra logs server để xem lỗi chi tiết");
      }
    }

    rl.close();
  });
}

updatePrices();
