const mongoose = require("mongoose");
require("dotenv").config();

const User = require("./src/models/User");

async function listUsers() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ Connected to MongoDB\n");

    const users = await User.find().select("email displayName role").limit(20);

    console.log(`📋 Found ${users.length} users:\n`);
    users.forEach((u, index) => {
      console.log(
        `${index + 1}. ${u.email} - ${u.displayName} (${u.role || "USER"})`,
      );
    });

    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
}

listUsers();
