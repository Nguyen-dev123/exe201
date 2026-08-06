require("dotenv").config();
const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema({
  user: mongoose.Schema.Types.ObjectId,
  plan: mongoose.Schema.Types.ObjectId,
  type: String,
  status: String,
  amount: Number,
  txnRef: String,
  paymentMethod: String,
  createdAt: Date,
});

const Transaction = mongoose.model("Transaction", transactionSchema);

async function cleanupPending() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ Connected to MongoDB\n");

    // Find all pending transactions
    const pending = await Transaction.find({
      status: "PENDING",
      type: "PREMIUM_SUBSCRIPTION",
    });

    console.log(`📊 Found ${pending.length} pending transactions\n`);

    if (pending.length === 0) {
      console.log("✅ No pending transactions to clean up");
      mongoose.connection.close();
      return;
    }

    // Cancel all pending transactions older than 5 minutes
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const result = await Transaction.updateMany(
      {
        status: "PENDING",
        type: "PREMIUM_SUBSCRIPTION",
        createdAt: { $lt: fiveMinutesAgo },
      },
      { $set: { status: "CANCELLED" } },
    );

    console.log(
      `✅ Cancelled ${result.modifiedCount} old pending transactions (older than 5 minutes)\n`,
    );

    // Show remaining pending
    const remaining = await Transaction.countDocuments({
      status: "PENDING",
      type: "PREMIUM_SUBSCRIPTION",
    });

    console.log(`📊 Remaining pending transactions: ${remaining}`);

    mongoose.connection.close();
  } catch (error) {
    console.error("❌ Error:", error.message);
    mongoose.connection.close();
  }
}

cleanupPending();
