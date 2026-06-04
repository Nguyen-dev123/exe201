require("dotenv").config();
const mongoose = require("mongoose");
const Room = require("./src/models/Room");

async function cleanRoomParticipants() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ Connected to MongoDB\n");

    // Get all rooms with activeParticipants
    const rooms = await Room.find({
      activeParticipants: { $exists: true, $ne: [] },
    });

    console.log(`📊 Found ${rooms.length} rooms with active participants\n`);

    if (rooms.length === 0) {
      console.log("✅ No rooms to clean!");
      return;
    }

    console.log("🧹 Cleaning activeParticipants...\n");

    for (const room of rooms) {
      console.log(`  Room: ${room.name}`);
      console.log(`    Before: ${room.activeParticipants.length} participants`);

      room.activeParticipants = [];
      await room.save();

      console.log(`    After: 0 participants ✅`);
    }

    console.log(`\n✅ Successfully cleaned ${rooms.length} rooms!`);
  } catch (error) {
    console.error("❌ Error:", error.message);
  } finally {
    await mongoose.disconnect();
    console.log("\nDisconnected from MongoDB");
  }
}

cleanRoomParticipants();
