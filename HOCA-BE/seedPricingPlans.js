const mongoose = require("mongoose");
require("dotenv").config();

const PricingPlan = require("./src/models/PricingPlan");

const pricingPlans = [
  {
    name: "HOCA Free",
    description: "Đủ công cụ để bắt đầu học mỗi ngày",
    price: 0,
    tier: "FREE",
    durationDays: -1,
    isActive: false, // Không hiển thị trên pricing page (xử lý riêng từ frontend)
    features: [
      "Học tối đa 3 giờ mỗi ngày",
      "Tạo không giới hạn phòng Im lặng & Camera",
      "Phòng tự động đóng sau 60 phút (cảnh báo trước 5 phút)",
      "Camera, mic & chat trong Phòng Camera",
      "Pomodoro, Streak, XP & Huy hiệu cơ bản",
      "Bảng xếp hạng & cộng đồng HOCA",
      "Dùng thử HOCA AI 15 lượt mỗi ngày",
    ],
  },
  {
    name: "HOCA+ Tháng",
    description: "Trọn bộ công cụ học nhóm trong 30 ngày",
    price: 79000,
    tier: "MONTHLY",
    durationDays: 30,
    isActive: true,
    features: [
      "Toàn bộ quyền lợi gói Free",
      "Học không giới hạn thời gian, không quảng cáo",
      "Tạo phòng không giới hạn mỗi ngày, không giới hạn thời lượng",
      "Tạo HOCA Smart Discussion & dùng mic thảo luận",
      "Giơ tay, điều phối phát biểu & đồng chủ phòng",
      "Bảng cộng tác, tài liệu, nhiệm vụ & quiz trực tiếp",
      "AI Thư ký, tổng kết buổi học & tạo flashcard",
      "Nền ảo có sẵn & mật khẩu bảo vệ phòng",
    ],
  },
  {
    name: "HOCA+ Năm",
    description: "Học lâu dài, tiết kiệm 37% và không giới hạn phòng",
    price: 599000,
    tier: "YEARLY",
    durationDays: 365,
    isActive: true,
    features: [
      "Toàn bộ quyền lợi của HOCA+ Tháng",
      "Tạo phòng không giới hạn mỗi ngày",
      "Phòng học & Smart Discussion không giới hạn thời lượng",
      "Tải nền ảo cá nhân của riêng bạn",
      "Lưu bảng chung, quiz, tài liệu & nhiệm vụ",
      "AI tổng kết & flashcard cho mọi buổi thảo luận",
      "Hiệu lực liên tục trong 365 ngày",
    ],
  },
  {
    name: "HOCA+ Vĩnh viễn",
    description: "Thanh toán một lần, sử dụng HOCA+ trọn đời",
    price: 1499000,
    tier: "LIFETIME",
    durationDays: -1, // -1 indicates lifetime
    isActive: true,
    features: [
      "Toàn bộ quyền lợi của HOCA+ Năm",
      "Học & tạo phòng không giới hạn trọn đời",
      "Smart Discussion, quiz & AI Thư ký trọn đời",
      "Tải tài liệu & nền ảo cá nhân",
      "Không gia hạn, không phát sinh phí hằng năm",
      "Nhận các nâng cấp mới của HOCA+ trong tương lai",
      "Gói không bao giờ hết hạn",
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
