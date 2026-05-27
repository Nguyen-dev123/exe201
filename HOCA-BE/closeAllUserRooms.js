const mongoose = require("mongoose");
require("dotenv").config();

const Room = require("./src/models/Room");
const User = require("./src/models/User");

async function closeAllUserRooms() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ Connected to MongoDB");

    // Get user email from command line argument
    const userEmail = process.argv[2];

    if (!userEmail) {
      console.log("Usage: node closeAllUserRooms.js <user-email>");
      console.log("Example: node closeAllUserRooms.js user@example.com");
      process.exit(1);
    }

    // Find user
    const user = await User.findOne({ email: userEmail });
    if (!user) {
      console.log(`❌ User not found: ${userEmail}`);
      process.exit(1);
    }

    console.log(`👤 Found user: ${user.displayName} (${user.email})`);

    // Find all active rooms owned by this user
    const activeRooms = await Room.find({
      owner: user._id,
      isActive: true,
    });

    if (activeRooms.length === 0) {
      console.log("✅ No active rooms found for this user");
      process.exit(0);
    }

    console.log(`\n📋 Found ${activeRooms.length} active room(s):`);
    activeRooms.forEach((room, index) => {
      console.log(`${index + 1}. ${room.name} (ID: ${room._id})`);
    });

    // Close all rooms
    const result = await Room.updateMany(
      { owner: user._id, isActive: true },
      {
        $set: {
          isActive: false,
          closedAt: new Date(),
        },
      },
    );

    console.log(`\n✅ Closed ${result.modifiedCount} room(s)`);
    console.log("🎉 Done! You can now create new rooms.");

    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
}

closeAllUserRooms();
