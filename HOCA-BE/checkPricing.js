require("dotenv").config();
const mongoose = require("mongoose");

const pricingPlanSchema = new mongoose.Schema({
  name: String,
  tier: String,
  price: Number,
  durationDays: Number,
  isActive: Boolean,
});

const PricingPlan = mongoose.model("PricingPlan", pricingPlanSchema);

async function checkPricing() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ Connected to MongoDB\n");

    const plans = await PricingPlan.find().sort({ price: 1 });

    console.log("📊 Current Pricing Plans in Database:\n");
    plans.forEach((plan) => {
      console.log(`${plan.tier} - ${plan.name}`);
      console.log(`   Price: ${plan.price.toLocaleString("vi-VN")} VND`);
      console.log(`   Duration: ${plan.durationDays} days`);
      console.log(`   Active: ${plan.isActive}`);
      console.log(`   ID: ${plan._id}\n`);
    });

    mongoose.connection.close();
  } catch (error) {
    console.error("❌ Error:", error.message);
    mongoose.connection.close();
  }
}

checkPricing();
