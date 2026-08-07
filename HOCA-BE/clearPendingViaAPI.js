/**
 * Clear pending transactions via API
 * Run: node clearPendingViaAPI.js
 */

const axios = require("axios");

const BACKEND_URL = "https://hoca-backend-d1fg.onrender.com";
const ADMIN_EMAIL = "admin@hoca.com";
const ADMIN_PASSWORD = "adminpassword123";

async function clearPending() {
  try {
    console.log("🔐 Logging in as admin...");

    // Login to get token
    const loginResponse = await axios.post(`${BACKEND_URL}/api/auth/login`, {
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
    });

    const token = loginResponse.data.token;
    console.log("✅ Login successful!");

    // Get all transactions
    console.log("\n📋 Fetching transactions...");
    const txnResponse = await axios.get(
      `${BACKEND_URL}/api/admin/transactions?status=PENDING&limit=100`,
      { headers: { Authorization: `Bearer ${token}` } },
    );

    const pending = txnResponse.data.transactions || [];
    console.log(`Found ${pending.length} PENDING transactions`);

    if (pending.length === 0) {
      console.log("✅ No pending transactions to clear!");
      return;
    }

    // Show pending transactions
    pending.forEach((txn, i) => {
      console.log(
        `${i + 1}. ${txn.user?.email} - ${txn.type} - ${txn.amount?.toLocaleString("vi-VN")}đ`,
      );
    });

    // Delete each pending transaction
    console.log("\n🗑️  Deleting pending transactions...");
    let deleted = 0;

    for (const txn of pending) {
      try {
        await axios.delete(`${BACKEND_URL}/api/admin/transactions/${txn._id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        deleted++;
        console.log(`✅ Deleted transaction ${txn._id}`);
      } catch (err) {
        console.error(
          `❌ Failed to delete ${txn._id}:`,
          err.response?.data?.message || err.message,
        );
      }
    }

    console.log(`\n✅ Deleted ${deleted}/${pending.length} transactions`);
    console.log("You can now try purchasing again!");
  } catch (error) {
    console.error("❌ Error:", error.response?.data?.message || error.message);
    if (error.response?.data) {
      console.error("Details:", JSON.stringify(error.response.data, null, 2));
    }
  }
}

clearPending();
