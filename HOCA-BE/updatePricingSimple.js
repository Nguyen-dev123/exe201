/**
 * Script đơn giản để cập nhật giá gói Năm và Vĩnh viễn
 * Chạy khi server đang chạy
 */

const updatePricing = async () => {
  const baseURL = "http://localhost:3000";

  console.log("🔄 Bắt đầu cập nhật giá...\n");

  try {
    // Lấy danh sách gói hiện tại
    console.log("📋 Đang lấy danh sách gói hiện tại...");
    const response = await fetch(`${baseURL}/api/pricing`);
    const plans = await response.json();

    console.log(`Tìm thấy ${plans.length} gói:\n`);
    plans.forEach((plan) => {
      console.log(
        `  - ${plan.name} (${plan.tier}): ${plan.price.toLocaleString("vi-VN")} đ`,
      );
    });

    // Tìm gói Năm (YEARLY)
    const yearlyPlan = plans.find((p) => p.tier === "YEARLY");
    if (yearlyPlan) {
      console.log("\n✏️  Cập nhật Gói Năm Premium...");
      console.log(`   Giá cũ: ${yearlyPlan.price.toLocaleString("vi-VN")} đ`);
      console.log(`   Giá mới: 500.000 đ`);
      console.log(`   ID: ${yearlyPlan._id}`);
    } else {
      console.log("\n⚠️  Không tìm thấy gói YEARLY");
    }

    // Tìm gói Vĩnh viễn (LIFETIME)
    const lifetimePlan = plans.find((p) => p.tier === "LIFETIME");
    if (lifetimePlan) {
      console.log("\n✏️  Cập nhật Gói Vĩnh viễn...");
      console.log(`   Giá cũ: ${lifetimePlan.price.toLocaleString("vi-VN")} đ`);
      console.log(`   Giá mới: 999.000 đ`);
      console.log(`   ID: ${lifetimePlan._id}`);
    } else {
      console.log("\n⚠️  Không tìm thấy gói LIFETIME");
    }

    console.log("\n" + "=".repeat(60));
    console.log("📝 Để cập nhật giá, bạn cần:");
    console.log("1. Đảm bảo server đang chạy (npm start hoặc npm run dev)");
    console.log("2. Đăng nhập với tài khoản ADMIN");
    console.log("3. Sử dụng API PUT với token admin:");

    if (yearlyPlan) {
      console.log(`\n   PUT ${baseURL}/api/pricing/${yearlyPlan._id}`);
      console.log('   Body: { "price": 500000 }');
    }

    if (lifetimePlan) {
      console.log(`\n   PUT ${baseURL}/api/pricing/${lifetimePlan._id}`);
      console.log('   Body: { "price": 999000 }');
    }

    console.log("\n" + "=".repeat(60));
  } catch (error) {
    console.error("\n❌ Lỗi kết nối:", error.message);
    console.log("\n💡 Đảm bảo:");
    console.log("   1. Server đang chạy tại http://localhost:3000");
    console.log("   2. Chạy lệnh: npm start hoặc npm run dev");
    console.log("   3. Sau đó chạy lại script này");
  }
};

updatePricing();
