/**
 * Script cập nhật giá nhanh - Chạy SQL query trực tiếp
 * Gói Năm: 500.000 đ
 * Gói Vĩnh viễn: 999.000 đ
 */

const mongoose = require("mongoose");
const path = require("path");

// Load environment variables
require("dotenv").config({ path: path.join(__dirname, ".env") });

async function updatePrices() {
  let connection = null;

  try {
    console.log("=====================================");
    console.log("  CẬP NHẬT GIÁ GÓI PREMIUM");
    console.log("=====================================\n");

    // Connect to MongoDB
    console.log("🔗 Đang kết nối MongoDB Atlas...");

    const uri = process.env.MONGODB_URI;
    if (!uri) {
      throw new Error("MONGODB_URI không được cấu hình trong file .env");
    }

    connection = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 15000,
      connectTimeoutMS: 15000,
    });

    console.log("✅ Kết nối thành công!\n");

    // Get the collection directly
    const db = mongoose.connection.db;
    const collection = db.collection("pricingplans");

    // Check existing plans
    console.log("📋 Kiểm tra gói hiện tại...");
    const existingPlans = await collection.find({}).toArray();

    if (existingPlans.length === 0) {
      console.log("⚠️  Không tìm thấy gói nào trong database!");
      console.log("💡 Bạn cần seed dữ liệu trước. Chạy: node seedPricing.js\n");
      return;
    }

    console.log(`Tìm thấy ${existingPlans.length} gói:\n`);
    existingPlans.forEach((plan, index) => {
      console.log(`${index + 1}. ${plan.name || "N/A"} (${plan.tier})`);
      console.log(
        `   Giá hiện tại: ${(plan.price || 0).toLocaleString("vi-VN")} đ\n`,
      );
    });

    // Update YEARLY plan
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("📝 Cập nhật Gói Năm Premium (YEARLY)");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

    const yearlyResult = await collection.updateOne(
      { tier: "YEARLY" },
      {
        $set: {
          price: 500000,
          name: "Gói Năm Premium",
          description: "Tiết kiệm 16% so với gói tháng",
          durationDays: 365,
          isActive: true,
          updatedAt: new Date(),
        },
      },
    );

    if (yearlyResult.matchedCount > 0) {
      console.log("✅ Đã cập nhật Gói Năm Premium");
      console.log("   Giá mới: 500.000 đ");
    } else {
      console.log("⚠️  Không tìm thấy gói YEARLY để cập nhật");
    }

    // Update LIFETIME plan
    console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("📝 Cập nhật Gói Vĩnh viễn (LIFETIME)");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

    const lifetimeResult = await collection.updateOne(
      { tier: "LIFETIME" },
      {
        $set: {
          price: 999000,
          name: "Gói vĩnh viễn",
          description: "Truy cập đầy đủ tính năng vĩnh viễn",
          durationDays: -1,
          isActive: true,
          updatedAt: new Date(),
        },
      },
    );

    if (lifetimeResult.matchedCount > 0) {
      console.log("✅ Đã cập nhật Gói Vĩnh viễn");
      console.log("   Giá mới: 999.000 đ");
    } else {
      console.log("⚠️  Không tìm thấy gói LIFETIME để cập nhật");
    }

    // Show final result
    console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("📊 KẾT QUẢ SAU KHI CẬP NHẬT");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

    const updatedPlans = await collection.find({}).sort({ price: 1 }).toArray();

    updatedPlans.forEach((plan, index) => {
      console.log(`${index + 1}. ${plan.name}`);
      console.log(`   Tier: ${plan.tier}`);
      console.log(`   Giá: ${plan.price.toLocaleString("vi-VN")} đ`);
      console.log(
        `   Thời hạn: ${plan.durationDays === -1 ? "Vĩnh viễn" : plan.durationDays + " ngày"}`,
      );
      console.log(
        `   Trạng thái: ${plan.isActive ? "✅ Active" : "❌ Inactive"}\n`,
      );
    });

    console.log("=====================================");
    console.log("  ✅ HOÀN TẤT CẬP NHẬT GIÁ!");
    console.log("=====================================\n");
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
      console.log("   4. Thử kết nối lại sau vài phút");
    }

    process.exit(1);
  } finally {
    if (connection) {
      await mongoose.connection.close();
      console.log("🔌 Đã ngắt kết nối database\n");
    }
  }
}

// Run the update
updatePrices();
