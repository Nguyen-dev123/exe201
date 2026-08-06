/**
 * Script sửa lỗi gói tháng: Fix user expiry + kiểm tra/sửa PricingPlan
 * Usage: node fixMonthlyPlan.js
 */
const mongoose = require("mongoose");
require("dotenv").config();
const dns = require("dns");
dns.setServers(["8.8.8.8", "8.8.4.4"]);

const User = require("./src/models/User");
const PricingPlan = require("./src/models/PricingPlan");
const { MONGODB_URI } = require("./src/config/env");

async function main() {
  try {
    console.log("🔍 Connecting to MongoDB...");
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
    });
    console.log("✅ MongoDB connected\n");

    // ========================================
    // PART 1: Kiểm tra & sửa PricingPlan
    // ========================================
    console.log("=" .repeat(60));
    console.log("📋 KIỂM TRA PRICING PLANS");
    console.log("=" .repeat(60));

    const plans = await PricingPlan.find({});
    
    let hasIssue = false;

    for (const plan of plans) {
      const expectedDays = plan.tier === "MONTHLY" ? 30 : plan.tier === "YEARLY" ? 365 : -1;
      const status = plan.durationDays === expectedDays ? "✅ OK" : "❌ SAI!";
      
      console.log(`  ${plan.name} (${plan.tier})`);
      console.log(`    durationDays: ${plan.durationDays} (mong đợi: ${expectedDays}) ${status}`);
      console.log(`    price: ${plan.price} VND`);
      console.log(`    isActive: ${plan.isActive}`);
      console.log(`    _id: ${plan._id}`);

      if (plan.durationDays !== expectedDays) {
        hasIssue = true;
        plan.durationDays = expectedDays;
        await plan.save();
        console.log(`    🔧 ĐÃ SỬA durationDays -> ${expectedDays}`);
      }
      console.log("");
    }

    if (!hasIssue) {
      console.log("  ✅ Tất cả PricingPlan đều đúng.\n");
    }

    // ========================================
    // PART 2: Sửa user tuan
    // ========================================
    console.log("=" .repeat(60));
    console.log("👤 SỬA TÀI KHOẢN tuan");
    console.log("=" .repeat(60));

    const user = await User.findOne({ email: "se182540nguyendinhtuan@gmail.com" });
    
    if (!user) {
      console.log("  ❌ Không tìm thấy user!\n");
    } else {
      console.log(`  User: ${user.displayName} | ${user.email}`);
      console.log(`  Tier hiện tại: ${user.subscriptionTier}`);
      console.log(`  Start: ${user.subscriptionStartDate}`);
      console.log(`  Expiry cũ: ${user.subscriptionExpiry}`);

      // Tính expiry mới = start + 30 ngày
      const startDate = new Date(user.subscriptionStartDate);
      const newExpiry = new Date(startDate);
      newExpiry.setDate(newExpiry.getDate() + 30);
      
      user.subscriptionExpiry = newExpiry;
      await user.save();

      console.log(`  Expiry mới: ${user.subscriptionExpiry}`);

      // Tính ngày còn lại
      const now = new Date();
      const daysLeft = Math.ceil((newExpiry - now) / (1000 * 60 * 60 * 24));
      console.log(`  📅 Ngày còn lại: ${daysLeft} ngày`);
      console.log(`  🎤 Tạo phòng Thảo luận: ĐƯỢC PHÉP ✅`);
    }

    console.log("\n" + "=" .repeat(60));
    console.log("✅ HOÀN TẤT!");
    console.log("=" .repeat(60));

    await mongoose.disconnect();
  } catch (error) {
    console.error("❌ Lỗi:", error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

main();
