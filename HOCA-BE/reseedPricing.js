/**
 * Call seed pricing API endpoint to reset pricing to correct values
 * Run: node reseedPricing.js
 */

const axios = require("axios");

// Change this to your backend URL
const BACKEND_URL =
  process.env.BACKEND_URL || "https://hoca-backend-d1fg.onrender.com";
const ADMIN_EMAIL = "admin@hoca.com";
const ADMIN_PASSWORD = "adminpassword123";

async function reseedPricing() {
  try {
    console.log("🔐 Logging in as admin...");

    // Login to get token
    const loginResponse = await axios.post(`${BACKEND_URL}/api/auth/login`, {
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
    });

    const token = loginResponse.data.token;
    console.log("✅ Login successful!");

    console.log("\n💰 Reseeding pricing with correct values...");
    console.log(
      "⚠️  This will DELETE all existing pricing plans and create new ones!\n",
    );

    // Call seed endpoint
    const seedResponse = await axios.post(
      `${BACKEND_URL}/api/admin/pricing/seed`,
      {},
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    console.log("✅ Pricing reseeded successfully!\n");
    console.log("📋 New pricing plans:");
    seedResponse.data.plans.forEach((plan) => {
      console.log(
        `   ${plan.tier}: ${plan.price.toLocaleString("vi-VN")}đ (${plan.durationDays} days)`,
      );
    });

    console.log("\n✅ Done! Refresh your frontend to see the new prices.");
  } catch (error) {
    console.error("❌ Error:", error.response?.data?.message || error.message);
    if (error.response?.data) {
      console.error("Details:", JSON.stringify(error.response.data, null, 2));
    }
  }
}

reseedPricing();
