// Script to clear pending transactions for testing
require("dotenv").config();
const mongoose = require("mongoose");

const Transaction = require("./src/models/Transaction");
const User = require("./src/models/User");
const PricingPlan = require("./src/models/PricingPlan");

async function clearPendingTransactions() {
  try {
    console.log("🔍 Connecting to MongoDB...");
    console.log("🌐 Using Google DNS (8.8.8.8, 8.8.4.4)");
    const dns = require("dns");
    dns.setServers(["8.8.8.8", "8.8.4.4"]);

    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ Connected to MongoDB");

    // Find all pending transactions
    const pending = await Transaction.find({ status: "PENDING" })
      .populate("user", "email displayName")
      .populate("plan", "name");

    console.log(`\n📋 Found ${pending.length} pending transactions:`);
    pending.forEach((txn, i) => {
      console.log(
        `${i + 1}. ${txn.user?.email} - ${txn.plan?.name} - ${txn.paymentMethod} - Created: ${txn.createdAt}`,
      );
    });

    if (pending.length === 0) {
      console.log("\n✅ No pending transactions to clear!");
      process.exit(0);
    }

    // Delete all pending transactions
    console.log("\n🗑️  Deleting all pending transactions...");
    const result = await Transaction.deleteMany({ status: "PENDING" });
    console.log(`✅ Deleted ${result.deletedCount} pending transactions`);

    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
}

clearPendingTransactions();
