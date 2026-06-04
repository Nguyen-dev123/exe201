const mongoose = require("mongoose");
require("dotenv").config();

const PricingPlan = require("./src/models/PricingPlan");

const pricingPlans = [
  {
    name: "Miễn phí",
    description: "Bắt đầu hành trình học tập",
    price: 0,
    tier: "FREE",
    durationDays: 365, // Free forever, but use 365 for consistency
    isActive: true,
    features: [
      "Tham gia phòng học cộng khai",
      "Học tối đa 3 giờ/ngày",
      "Hệ thống Streak & Badges cơ bản",
      "Bảng xếp hạng cộng đồng",
      "AI Assistant không giới hạn",
    ],
  },
  {
    name: "Gói Tháng Premium",
    description: "Truy cập đầy đủ tính năng trong 30 ngày",
    price: 99000,
    tier: "MONTHLY",
    durationDays: 30,
    isActive: true,
    features: [
      "Màn hình ảo",
      "Phòng học không giới hạn",
      "Sticker độc quyền",
      "Chất lượng HD",
      "Huy hiệu độc quyền",
      "Tạo phòng riêng tư",
      "Thống kê chi tiết",
    ],
  },
  {
    name: "Gói Năm Premium",
    description: "Tiết kiệm 16% so với gói tháng",
    price: 500000,
    tier: "YEARLY",
    durationDays: 365,
    isActive: true,
    features: [
      "Màn hình ảo",
      "Phòng học không giới hạn",
      "Sticker độc quyền",
      "Chất lượng HD",
      "Huy hiệu độc quyền",
      "Tạo phòng riêng tư",
      "Thống kê chi tiết",
      "Ưu tiên hỗ trợ",
    ],
  },
  {
    name: "Gói vĩnh viễn",
    description: "Truy cập đầy đủ tính năng vĩnh viễn",
    price: 999000,
    tier: "LIFETIME",
    durationDays: -1, // -1 indicates lifetime
    isActive: true,
    features: [
      "Màn hình ảo",
      "Phòng học không giới hạn",
      "Sticker độc quyền",
      "Chất lượng HD",
      "Huy hiệu độc quyền",
      "Tạo phòng riêng tư",
      "Thống kê chi tiết",
      "Ưu tiên hỗ trợ",
      'Badge đặc biệt "Lifetime Member"',
    ],
  },
];

async function seedPricing() {
  try {
    console.log("════════════════════════════════════════");
    console.log("  🌱 SEED DỮ LIỆU GÓI GIÁ");
    console.log("════════════════════════════════════════\n");

    // Kết nối MongoDB
    console.log("🔗 Đang kết nối MongoDB...");
    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 15000,
    });
    console.log("✅ Kết nối thành công!\n");

    // Xóa tất cả gói giá cũ
    console.log("🗑️  Xóa dữ liệu cũ...");
    const deleteResult = await PricingPlan.deleteMany({});
    console.log(`   Đã xóa ${deleteResult.deletedCount} gói cũ\n`);

    // Thêm gói giá mới
    console.log("➕ Thêm gói giá mới...\n");

    for (const plan of pricingPlans) {
      const created = await PricingPlan.create(plan);
      console.log(`✅ ${plan.name} (${plan.tier})`);
      console.log(`   💰 Giá: ${plan.price.toLocaleString("vi-VN")} đ`);
      console.log(
        `   ⏱️  Thời hạn: ${plan.durationDays === -1 ? "Vĩnh viễn" : plan.durationDays + " ngày"}`,
      );
      console.log(`   📋 Tính năng: ${plan.features.length} tính năng`);
      console.log(`   🆔 ID: ${created._id}\n`);
    }

    // Hiển thị tổng kết
    console.log("════════════════════════════════════════");
    console.log("  📊 TỔNG KẾT");
    console.log("════════════════════════════════════════\n");

    const allPlans = await PricingPlan.find().sort({ price: 1 });
    console.log(`Tổng số gói: ${allPlans.length}\n`);

    allPlans.forEach((plan, index) => {
      console.log(`${index + 1}. ${plan.name}`);
      console.log(`   Tier: ${plan.tier}`);
      console.log(`   Giá: ${plan.price.toLocaleString("vi-VN")} đ`);
      console.log(
        `   Trạng thái: ${plan.isActive ? "✅ Active" : "❌ Inactive"}\n`,
      );
    });

    console.log("════════════════════════════════════════");
    console.log("  ✅ HOÀN TẤT SEED DỮ LIỆU!");
    console.log("════════════════════════════════════════\n");

    console.log("💡 Bây giờ bạn có thể:");
    console.log("   1. Truy cập: http://localhost:3001/pricing");
    console.log("   2. Kiểm tra API: http://localhost:3000/api/pricing");
    console.log("   3. Refresh trang để xem gói giá mới\n");

    process.exit(0);
  } catch (error) {
    console.error("\n❌ LỖI:", error.message);

    if (
      error.message.includes("ECONNREFUSED") ||
      error.message.includes("ENOTFOUND")
    ) {
      console.log("\n💡 Gợi ý khắc phục:");
      console.log("   1. Kiểm tra kết nối internet");
      console.log("   2. Kiểm tra MONGODB_URI trong file .env");
      console.log("   3. Đảm bảo MongoDB Atlas cho phép IP của bạn");
      console.log("   4. Thử kết nối lại sau vài phút\n");
    }

    process.exit(1);
  }
}

// Chạy seed
seedPricing();
