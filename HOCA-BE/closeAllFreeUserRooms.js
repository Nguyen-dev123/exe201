const mongoose = require("mongoose");
require("dotenv").config();

const Room = require("./src/models/Room");

async function closeAllFreeUserRooms() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ Connected to MongoDB");

    // Find all active rooms
    const activeRooms = await Room.find({ isActive: true }).populate(
      "owner",
      "email displayName",
    );

    console.log(`\n📋 Found ${activeRooms.length} active room(s):\n`);

    if (activeRooms.length === 0) {
      console.log("No active rooms found");
      process.exit(0);
    }

    activeRooms.forEach((room, index) => {
      const ownerInfo = room.owner
        ? `${room.owner.displayName} (${room.owner.email})`
        : "No owner";
      console.log(`${index + 1}. ${room.name} - Owner: ${ownerInfo}`);
    });

    // Close all rooms
    const result = await Room.updateMany(
      { isActive: true },
      {
        $set: {
          isActive: false,
          closedAt: new Date(),
        },
      },
    );

    console.log(`\n✅ Closed ${result.modifiedCount} room(s)`);
    console.log("🎉 Done! All rooms are now closed.");

    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
}

closeAllFreeUserRooms();
