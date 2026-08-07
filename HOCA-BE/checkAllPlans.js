/**
 * Check all pricing plans in database
 * Run: node checkAllPlans.js
 */

const axios = require("axios");

const BACKEND_URL = "https://hoca-backend-d1fg.onrender.com";

async function checkPlans() {
  try {
    console.log("📋 Fetching all pricing plans...\n");

    const response = await axios.get(`${BACKEND_URL}/api/pricing`);
    const plans = response.data;

    console.log(`Found ${plans.length} plans:\n`);

    plans.forEach((plan, i) => {
      console.log(`${i + 1}. ${plan.tier} (${plan._id})`);
      console.log(`   Name: ${plan.name}`);
      console.log(`   Price: ${plan.price.toLocaleString("vi-VN")}đ`);
      console.log(`   Duration: ${plan.durationDays} days`);
      console.log(`   Active: ${plan.isActive}`);
      console.log(`   Created: ${plan.createdAt}`);
      console.log(`   Updated: ${plan.updatedAt}`);
      console.log("");
    });

    // Check for duplicates
    const tierCounts = {};
    plans.forEach((plan) => {
      tierCounts[plan.tier] = (tierCounts[plan.tier] || 0) + 1;
    });

    console.log("🔍 Duplicate check:");
    Object.entries(tierCounts).forEach(([tier, count]) => {
      if (count > 1) {
        console.log(`   ⚠️  ${tier}: ${count} plans (DUPLICATE!)`);
      } else {
        console.log(`   ✅ ${tier}: ${count} plan`);
      }
    });
  } catch (error) {
    console.error("❌ Error:", error.response?.data?.message || error.message);
  }
}

checkPlans();
