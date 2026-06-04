/**
 * Script seed dữ liệu gói giá qua API
 * Yêu cầu: Backend server đang chạy
 */

const pricingPlans = [
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
    durationDays: -1,
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

async function seedViaAPI() {
  console.log("════════════════════════════════════════");
  console.log("  🌱 SEED GÓI GIÁ QUA API");
  console.log("════════════════════════════════════════\n");

  try {
    // Kiểm tra server có chạy không
    console.log("🔍 Kiểm tra server...");
    const healthCheck = await fetch("http://localhost:3000/api/pricing");

    if (!healthCheck.ok) {
      throw new Error("Server không phản hồi");
    }

    console.log("✅ Server đang chạy\n");

    // Lấy danh sách gói hiện tại
    const existing = await healthCheck.json();
    console.log(`📋 Có ${existing.length} gói trong database\n`);

    // Nếu đã có gói, hỏi có muốn xóa không
    if (existing.length > 0) {
      console.log("⚠️  Đã có dữ liệu. Script này sẽ THÊM gói mới.");
      console.log(
        "   Nếu muốn XÓA hết và tạo lại, vui lòng xóa thủ công qua MongoDB Compass\n",
      );
    }

    console.log("➕ Bắt đầu thêm gói giá...\n");

    let added = 0;
    let skipped = 0;

    for (const plan of pricingPlans) {
      // Kiểm tra xem tier đã tồn tại chưa
      const existingPlan = existing.find((p) => p.tier === plan.tier);

      if (existingPlan) {
        console.log(`⏭️  ${plan.name} (${plan.tier}) - Đã tồn tại, bỏ qua`);
        skipped++;
        continue;
      }

      console.log(`📝 Đang tạo: ${plan.name} (${plan.tier})`);
      console.log(`   Giá: ${plan.price.toLocaleString("vi-VN")} đ`);

      // API này yêu cầu admin token, nhưng ta sẽ thêm trực tiếp vào DB
      // Vì vậy ta cần dùng script khác hoặc tạo endpoint public tạm
      console.log("   ⚠️  Cần admin token để tạo qua API\n");
      skipped++;
    }

    console.log("\n════════════════════════════════════════");
    console.log("  📊 KẾT QUẢ");
    console.log("════════════════════════════════════════\n");
    console.log(`✅ Đã thêm: ${added} gói`);
    console.log(`⏭️  Bỏ qua: ${skipped} gói\n`);

    if (added === 0) {
      console.log("💡 GIẢI PHÁP:");
      console.log("\n1️⃣  Sử dụng MongoDB Compass:");
      console.log("   - Mở MongoDB Compass");
      console.log("   - Kết nối với database");
      console.log('   - Vào collection "pricingplans"');
      console.log('   - Nhấn "Insert Document" và paste JSON từ file này\n');

      console.log("2️⃣  Đợi admin API được cấu hình:");
      console.log("   - Cần có admin token");
      console.log("   - Hoặc tạo endpoint seed công khai tạm thời\n");

      console.log("3️⃣  Copy JSON để paste vào Compass:\n");
      console.log(JSON.stringify(pricingPlans, null, 2));
    }
  } catch (error) {
    console.error("\n❌ LỖI:", error.message);

    if (
      error.message.includes("fetch") ||
      error.message.includes("ECONNREFUSED")
    ) {
      console.log("\n💡 Đảm bảo backend đang chạy:");
      console.log("   cd HOCA-BE");
      console.log("   npm start");
      console.log("\n   Sau đó chạy lại script này\n");
    }
  }
}

seedViaAPI();
