const mongoose = require("mongoose");
require("dotenv").config();

const User = require("./src/models/User");

async function resetUserRoomStatus() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ Connected to MongoDB");

    // Reset all users' activePersonalRoomId and room creation count
    const result = await User.updateMany(
      {},
      {
        $set: {
          activePersonalRoomId: null,
          todayRoomCreatedCount: 0,
        },
      },
    );

    console.log(`\n✅ Reset ${result.modifiedCount} user(s)`);
    console.log("🎉 Done! All users can now create rooms.");

    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
}

resetUserRoomStatus();
