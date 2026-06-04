require("dotenv").config();
const mongoose = require("mongoose");

async function checkRooms() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ Connected to MongoDB");

    const Room = require("./src/models/Room");

    // Get all rooms
    const allRooms = await Room.find().populate("owner", "displayName email");

    console.log("\n📊 All Rooms in Database:");
    console.log("Total:", allRooms.length);
    console.log("-----------------------------------");

    allRooms.forEach((room, index) => {
      console.log(`\n${index + 1}. ${room.name}`);
      console.log(`   ID: ${room._id}`);
      console.log(
        `   Owner: ${room.owner?.displayName || "N/A"} (${room.owner?.email || "N/A"})`,
      );
      console.log(`   isPublic: ${room.isPublic}`);
      console.log(`   isActive: ${room.isActive}`);
      console.log(`   roomType: ${room.roomType}`);
      console.log(`   maxParticipants: ${room.maxParticipants}`);
      console.log(`   activeParticipants: ${room.activeParticipants.length}`);
      console.log(`   description: ${room.description || "None"}`);
      console.log(`   createdAt: ${room.createdAt}`);
    });

    // Check public rooms query (what getPublicRooms would return)
    console.log("\n\n🔍 Public & Active Rooms (search results):");
    const publicRooms = await Room.find({
      isPublic: true,
      isActive: true,
    }).populate("owner", "displayName email");

    console.log("Total:", publicRooms.length);
    publicRooms.forEach((room, index) => {
      console.log(
        `${index + 1}. ${room.name} (Owner: ${room.owner?.displayName || "N/A"})`,
      );
    });

    await mongoose.connection.close();
    console.log("\n✅ Done!");
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
}

checkRooms();
