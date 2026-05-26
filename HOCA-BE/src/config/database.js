const mongoose = require("mongoose");
const { MONGODB_URI } = require("./env");
const dns = require("dns");

// Configure DNS to use Google DNS servers
dns.setServers(["8.8.8.8", "8.8.4.4"]);

const connectDatabase = async () => {
  try {
    if (!MONGODB_URI) {
      console.log("⚠️  MongoDB URI not found, skipping connection");
      return false;
    }

    console.log("🔍 Attempting to connect to MongoDB...");
    console.log("🌐 Using Google DNS (8.8.8.8, 8.8.4.4)");

    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
    });

    console.log("✅ MongoDB connected successfully");
    return true;
  } catch (error) {
    console.error("❌ MongoDB connection error:", error.message);
    console.log("⚠️  Continuing without MongoDB (development mode)");
    return false;
  }
};

module.exports = connectDatabase;
