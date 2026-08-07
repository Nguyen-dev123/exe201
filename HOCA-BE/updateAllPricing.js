/**
 * Script to update all pricing plans to correct values
 * Run: node updateAllPricing.js
 */

require("dotenv").config();
const mongoose = require("mongoose");
const { MONGODB_URI } = require("./src/config/env");

const PricingPlan = require("./src/models/PricingPlan");

const CORRECT_PRICES = {
  MONTHLY: 50000,
  YEARLY: 500000,
  LIFETIME: 999000,
};

async function updatePricing() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("✅ Connected to MongoDB");

    // Update each tier
    for (const [tier, price] of Object.entries(CORRECT_PRICES)) {
      const result = await PricingPlan.updateMany(
        { tier },
        {
          $set: {
            price,
            updatedAt: new Date(),
          },
        },
      );
      console.log(
        `✅ Updated ${tier}: ${result.modifiedCount} plan(s) → ${price.toLocaleString("vi-VN")}đ`,
      );
    }

    // Show all current pricing
    console.log("\n📋 Current pricing in database:");
    const plans = await PricingPlan.find({ isActive: true }).sort({ price: 1 });
    plans.forEach((plan) => {
      console.log(
        `   ${plan.tier}: ${plan.price.toLocaleString("vi-VN")}đ (${plan.durationDays} days)`,
      );
    });

    console.log("\n✅ All pricing updated successfully!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
}

updatePricing();
