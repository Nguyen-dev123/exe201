/**
 * Call quickUpdatePrices API endpoint
 * Run: node callQuickUpdate.js
 */

const axios = require("axios");

// Change this to your backend URL
const BACKEND_URL =
  process.env.BACKEND_URL || "https://hoca-backend-d1fg.onrender.com";
const ADMIN_EMAIL = "admin@hoca.com";
const ADMIN_PASSWORD = "adminpassword123";

async function callQuickUpdate() {
  try {
    console.log("🔐 Logging in as admin...");

    // Login to get token
    const loginResponse = await axios.post(`${BACKEND_URL}/api/auth/login`, {
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
    });

    const token = loginResponse.data.token;
    console.log("✅ Login successful!");

    console.log("\n💰 Updating pricing...");

    // Call quick update endpoint
    const updateResponse = await axios.post(
      `${BACKEND_URL}/api/admin/pricing/quick-update`,
      {},
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    console.log("✅ Pricing updated successfully!\n");
    console.log("📋 Updated plans:");
    updateResponse.data.allPlans.forEach((plan) => {
      console.log(
        `   ${plan.tier}: ${plan.price.toLocaleString("vi-VN")}đ (${plan.durationDays} days)`,
      );
    });

    console.log("\n✅ Done!");
  } catch (error) {
    console.error("❌ Error:", error.response?.data?.message || error.message);
    if (error.response?.data) {
      console.error("Details:", JSON.stringify(error.response.data, null, 2));
    }
  }
}

callQuickUpdate();
