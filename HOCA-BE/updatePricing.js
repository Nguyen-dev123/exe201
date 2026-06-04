const mongoose = require("mongoose");
require("dotenv").config();

// Import model
const PricingPlan = require("./src/models/PricingPlan");

const updatePricing = async () => {
  try {
    // Kết nối database với timeout
    console.log("🔄 Đang kết nối MongoDB...");
    console.log("URI:", process.env.MONGODB_URI?.substring(0, 30) + "...");

    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 10000,
    });
    console.log("✅ Đã kết nối MongoDB");

    // Cập nhật giá Gói Năm (YEARLY)
    const yearlyUpdate = await PricingPlan.findOneAndUpdate(
      { tier: "YEARLY" },
      {
        price: 500000,
        name: "Gói Năm Premium",
        description: "Tiết kiệm 16% so với gói tháng",
        durationDays: 365,
      },
      { new: true, upsert: false },
    );

    if (yearlyUpdate) {
      console.log("✅ Đã cập nhật Gói Năm Premium:");
      console.log(
        `   - Giá mới: ${yearlyUpdate.price.toLocaleString("vi-VN")} đ`,
      );
      console.log(`   - Tên: ${yearlyUpdate.name}`);
    } else {
      console.log("⚠️  Không tìm thấy Gói Năm (YEARLY) trong database");
    }

    // Cập nhật giá Gói Vĩnh viễn (LIFETIME)
    const lifetimeUpdate = await PricingPlan.findOneAndUpdate(
      { tier: "LIFETIME" },
      {
        price: 999000,
        name: "Gói vĩnh viễn",
        description: "Truy cập đầy đủ tính năng vĩnh viễn",
        durationDays: -1,
      },
      { new: true, upsert: false },
    );

    if (lifetimeUpdate) {
      console.log("✅ Đã cập nhật Gói Vĩnh viễn:");
      console.log(
        `   - Giá mới: ${lifetimeUpdate.price.toLocaleString("vi-VN")} đ`,
      );
      console.log(`   - Tên: ${lifetimeUpdate.name}`);
    } else {
      console.log("⚠️  Không tìm thấy Gói Vĩnh viễn (LIFETIME) trong database");
    }

    // Hiển thị tất cả gói giá hiện tại
    console.log("\n📋 Tất cả gói giá hiện tại:");
    const allPlans = await PricingPlan.find().sort({ price: 1 });
    allPlans.forEach((plan) => {
      console.log(
        `   ${plan.tier}: ${plan.name} - ${plan.price.toLocaleString("vi-VN")} đ`,
      );
    });

    console.log("\n✅ Hoàn tất cập nhật giá!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Lỗi:", error.message);
    process.exit(1);
  }
};

updatePricing();
