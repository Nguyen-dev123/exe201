/**
 * Debug script to check all rooms in database
 */

require("dotenv").config();
const mongoose = require("mongoose");
const Room = require("./src/models/Room");

const debugRooms = async () => {
  try {
    console.log("🔍 Connecting to database...");
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ Connected to database\n");

    // Get ALL rooms (active and inactive)
    const allRooms = await Room.find({})
      .populate("owner", "displayName email")
      .sort("-createdAt")
      .limit(20);

    console.log(`📊 Total rooms in database: ${allRooms.length}\n`);

    if (allRooms.length === 0) {
      console.log("❌ No rooms found in database!");
      process.exit(0);
    }

    console.log("📋 Room Details:\n");
    allRooms.forEach((room, index) => {
      const owner = room.owner
        ? `${room.owner.displayName} (${room.owner.email})`
        : "No Owner";
      const password = room.password ? "🔒 Has Password" : "🔓 No Password";
      const isPublic = room.isPublic ? "🌍 Public" : "🔒 Private";
      const isActive = room.isActive ? "✅ Active" : "❌ Closed";
      const participants = room.activeParticipants.length;

      console.log(`${index + 1}. ${room.name}`);
      console.log(`   ID: ${room._id}`);
      console.log(`   Owner: ${owner}`);
      console.log(`   Status: ${isActive} | ${isPublic} | ${password}`);
      console.log(`   Participants: ${participants}/${room.maxParticipants}`);
      console.log(`   Room Type: ${room.roomType}`);
      console.log(`   Created: ${room.createdAt}`);
      console.log("");
    });

    // Check what getRooms endpoint would return
    console.log("🔍 Checking what search API would return:\n");
    const publicActiveRooms = await Room.find({
      isPublic: true,
      isActive: true,
    })
      .populate("owner", "displayName email")
      .select("-password");

    console.log(`📊 Public Active Rooms: ${publicActiveRooms.length}`);
    publicActiveRooms.forEach((room, index) => {
      const owner = room.owner ? `${room.owner.displayName}` : "No Owner";
      console.log(`${index + 1}. ${room.name} - Owner: ${owner}`);
    });

    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
};

debugRooms();
