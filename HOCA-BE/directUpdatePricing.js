/**
 * Direct MongoDB update for pricing
 * Run: node directUpdatePricing.js
 */

const axios = require("axios");

const BACKEND_URL = "https://hoca-backend-d1fg.onrender.com";
const ADMIN_EMAIL = "admin@hoca.com";
const ADMIN_PASSWORD = "adminpassword123";

async function directUpdate() {
  try {
    console.log("🔐 Logging in as admin...");

    // Login to get token
    const loginResponse = await axios.post(`${BACKEND_URL}/api/auth/login`, {
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
    });

    const token = loginResponse.data.token;
    console.log("✅ Login successful!");

    // Get all plans first
    console.log("\n📋 Current pricing plans:");
    const getResponse = await axios.get(`${BACKEND_URL}/api/pricing`);
    getResponse.data.forEach((plan) => {
      console.log(
        `   ${plan.tier}: ${plan.price.toLocaleString("vi-VN")}đ (ID: ${plan._id})`,
      );
    });

    // Update each plan individually
    console.log("\n💰 Updating pricing plans...\n");

    const updates = {
      MONTHLY: { price: 50000, name: "HOCA+ Tháng" },
      YEARLY: { price: 500000, name: "HOCA+ Năm" },
      LIFETIME: { price: 999000, name: "HOCA+ Vĩnh viễn" },
    };

    for (const plan of getResponse.data) {
      if (updates[plan.tier]) {
        const update = updates[plan.tier];
        console.log(`Updating ${plan.tier} (${plan._id})...`);

        try {
          await axios.put(
            `${BACKEND_URL}/api/admin/pricing/${plan._id}`,
            { price: update.price, name: update.name },
            { headers: { Authorization: `Bearer ${token}` } },
          );
          console.log(
            `✅ ${plan.tier}: ${plan.price.toLocaleString("vi-VN")}đ → ${update.price.toLocaleString("vi-VN")}đ`,
          );
        } catch (err) {
          console.error(
            `❌ Failed to update ${plan.tier}:`,
            err.response?.data?.message || err.message,
          );
        }
      }
    }

    // Verify updates
    console.log("\n📋 Updated pricing plans:");
    const verifyResponse = await axios.get(`${BACKEND_URL}/api/pricing`);
    verifyResponse.data.forEach((plan) => {
      console.log(`   ${plan.tier}: ${plan.price.toLocaleString("vi-VN")}đ`);
    });

    console.log("\n✅ Done! Refresh your frontend to see changes.");
  } catch (error) {
    console.error("❌ Error:", error.response?.data?.message || error.message);
    if (error.response?.data) {
      console.error("Details:", JSON.stringify(error.response.data, null, 2));
    }
  }
}

directUpdate();
