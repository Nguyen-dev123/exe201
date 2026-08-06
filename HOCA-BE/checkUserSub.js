/**
 * Script kiểm tra thông tin user & subscription
 * Usage: node checkUserSub.js
 */
const mongoose = require("mongoose");
require("dotenv").config();
const dns = require("dns");
dns.setServers(["8.8.8.8", "8.8.4.4"]);

const User = require("./src/models/User");
const { MONGODB_URI } = require("./src/config/env");

async function main() {
  try {
    console.log("🔍 Connecting to MongoDB...");
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
    });
    console.log("✅ MongoDB connected\n");

    // Tìm user bằng email hoặc displayName (bỏ _id="tuan" vì không phải ObjectId)
    const email = "se182540nguyendinhtuan@gmail.com";
    const user = await User.findOne({
      $or: [
        { email: email },
        { displayName: "tuan" },
      ],
    });

    if (!user) {
      console.log("❌ Không tìm thấy user với email:", email);
      // Thử tìm gần đúng
      const users = await User.find({
        $or: [
          { email: { $regex: "nguyendinhtuan", $options: "i" } },
          { displayName: { $regex: "tuan", $options: "i" } },
        ],
      }).limit(10);

      if (users.length > 0) {
        console.log(`\n📋 Tìm thấy ${users.length} user gần giống:\n`);
        users.forEach((u) => {
          console.log(`  - ${u.displayName} | ${u.email || "no email"} | _id: ${u._id}`);
          console.log(`    Role: ${u.role} | Tier: ${u.subscriptionTier} | Expiry: ${u.subscriptionExpiry || "N/A"}`);
        });
      }
      
      await mongoose.disconnect();
      return;
    }

    console.log("=" .repeat(60));
    console.log("👤 THÔNG TIN USER");
    console.log("=" .repeat(60));
    console.log(`  ID:               ${user._id}`);
    console.log(`  Display Name:     ${user.displayName}`);
    console.log(`  Email:            ${user.email || "N/A"}`);
    console.log(`  Phone:            ${user.phone || "N/A"}`);
    console.log(`  Role:             ${user.role}`);
    console.log(`  Account Status:   ${user.accountStatus}`);
    console.log(`  Is Blocked:       ${user.isBlocked}`);
    console.log(`  Is Locked:        ${user.isLocked}`);
    console.log(`  Created At:       ${user.createdAt}`);

    console.log("\n" + "=" .repeat(60));
    console.log("💳 THÔNG TIN SUBSCRIPTION");
    console.log("=" .repeat(60));
    console.log(`  subscriptionTier:     ${user.subscriptionTier}`);
    console.log(`  subscriptionExpiry:   ${user.subscriptionExpiry || "N/A"}`);
    console.log(`  subscriptionStartDate: ${user.subscriptionStartDate || "N/A"}`);

    // Tính toán effective tier
    const now = new Date();
    let effectiveTier = user.subscriptionTier;
    let isExpired = false;

    if (user.subscriptionTier !== "FREE" && user.subscriptionTier !== "LIFETIME") {
      if (user.subscriptionExpiry && new Date(user.subscriptionExpiry) < now) {
        effectiveTier = "FREE";
        isExpired = true;
      }
    }

    console.log(`\n  📊 Effective Tier:    ${effectiveTier}`);
    console.log(`  ⏰ Đã hết hạn:        ${isExpired ? "YES ❌" : "NO ✅"}`);
    
    if (user.subscriptionExpiry) {
      const daysLeft = Math.ceil((new Date(user.subscriptionExpiry) - now) / (1000 * 60 * 60 * 24));
      console.log(`  📅 Ngày còn lại:      ${daysLeft} ngày`);
    }

    // Kiểm tra isPremium virtual
    console.log(`\n  🏷️  isPremium (virtual): ${user.isPremium}`);

    // Kiểm tra quyền tạo phòng DISCUSSION
    const canCreateDiscussion = effectiveTier !== "FREE" || user.role === "ADMIN";
    console.log(`\n  🎤 Tạo phòng Thảo luận: ${canCreateDiscussion ? "ĐƯỢC PHÉP ✅" : "KHÔNG ĐƯỢC PHÉP ❌"}`);

    // Kiểm tra moderation bans
    console.log("\n" + "=" .repeat(60));
    console.log("🚫 MODERATION STATUS");
    console.log("=" .repeat(60));
    console.log(`  chatBannedUntil:  ${user.chatBannedUntil || "N/A"}`);
    console.log(`  roomBannedUntil:  ${user.roomBannedUntil || "N/A"}`);
    console.log(`  violationCount:   ${user.violationCount}`);
    console.log(`  warnings:         ${user.warnings?.length || 0}`);

    // Kiểm tra các phòng đang có
    console.log("\n" + "=" .repeat(60));
    console.log("🏠 PHÒNG HIỆN TẠI");
    console.log("=" .repeat(60));
    console.log(`  currentRoomId:       ${user.currentRoomId || "N/A"}`);
    console.log(`  activePersonalRoomId: ${user.activePersonalRoomId || "N/A"}`);
    console.log(`  ownedRoomCount:      ${user.ownedRoomCount}`);
    console.log(`  todayRoomCreatedCount: ${user.todayRoomCreatedCount}`);
    console.log(`  lastRoomCreatedDate: ${user.lastRoomCreatedDate || "N/A"}`);

    console.log("\n" + "=" .repeat(60));

    await mongoose.disconnect();
  } catch (error) {
    console.error("❌ Lỗi:", error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

main();
