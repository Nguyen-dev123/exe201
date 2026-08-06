require("dotenv").config();
const mongoose = require("mongoose");

const pricingPlanSchema = new mongoose.Schema({
  name: String,
  tier: String,
  price: Number,
  durationDays: Number,
  isActive: Boolean,
  description: String,
  features: [String],
});

const PricingPlan = mongoose.model("PricingPlan", pricingPlanSchema);

async function updateMonthlyPrice() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ Connected to MongoDB\n");

    // Find MONTHLY plan
    const monthlyPlan = await PricingPlan.findOne({ tier: "MONTHLY" });

    if (!monthlyPlan) {
      console.log("❌ Không tìm thấy gói MONTHLY");
      mongoose.connection.close();
      return;
    }

    console.log("📋 Gói MONTHLY hiện tại:");
    console.log(`   Tên: ${monthlyPlan.name}`);
    console.log(`   Giá: ${monthlyPlan.price.toLocaleString("vi-VN")} VND\n`);

    // Update to 50,000 VND
    monthlyPlan.price = 50000;
    await monthlyPlan.save();

    console.log("✅ Đã cập nhật giá gói MONTHLY thành 50.000 VND\n");

    // Show all plans
    const allPlans = await PricingPlan.find().sort({ price: 1 });
    console.log("📊 Tất cả gói sau khi cập nhật:\n");
    allPlans.forEach((plan) => {
      console.log(
        `${plan.tier} - ${plan.name}: ${plan.price.toLocaleString("vi-VN")} VND`,
      );
    });

    mongoose.connection.close();
  } catch (error) {
    console.error("❌ Error:", error.message);
    mongoose.connection.close();
  }
}

updateMonthlyPrice();
