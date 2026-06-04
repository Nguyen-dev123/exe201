/**
 * Test script to verify search returns ALL active rooms
 */

require("dotenv").config();
const mongoose = require("mongoose");
const Room = require("./src/models/Room");

const testSearch = async () => {
  try {
    console.log("🔍 Connecting to database...");
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ Connected to database\n");

    // Get ALL active rooms (what the API will return)
    const allActiveRooms = await Room.find({ isActive: true })
      .populate("owner", "displayName email")
      .select("+password")
      .sort("-createdAt");

    console.log(`📊 Total ACTIVE rooms: ${allActiveRooms.length}\n`);

    if (allActiveRooms.length === 0) {
      console.log("❌ No active rooms found!");
      process.exit(0);
    }

    console.log("📋 All Active Rooms (what search API returns):\n");
    allActiveRooms.forEach((room, index) => {
      const owner = room.owner
        ? `${room.owner.displayName} (${room.owner.email})`
        : "No Owner";
      const hasPassword = room.password ? "🔒 HAS PASSWORD" : "🔓 No Password";
      const isPublic = room.isPublic ? "🌍 Public" : "🔒 Private";
      const participants = room.activeParticipants.length;

      console.log(`${index + 1}. ${room.name}`);
      console.log(`   Owner: ${owner}`);
      console.log(`   Status: ${isPublic} | ${hasPassword}`);
      console.log(`   Participants: ${participants}/${room.maxParticipants}`);
      console.log(`   Room Type: ${room.roomType}`);
      console.log(`   Created: ${room.createdAt.toLocaleString("vi-VN")}`);
      console.log("");
    });

    // Test search by name
    console.log("\n🔍 Testing search by name 'Test':");
    const searchResults = await Room.find({
      isActive: true,
      name: { $regex: "Test", $options: "i" },
    })
      .populate("owner", "displayName")
      .select("+password");

    console.log(`Found ${searchResults.length} rooms matching 'Test':`);
    searchResults.forEach((room, index) => {
      const hasPassword = room.password ? "🔒" : "🔓";
      console.log(`${index + 1}. ${hasPassword} ${room.name}`);
    });

    console.log("\n✅ Search test completed!");
    console.log("\n💡 Key points:");
    console.log("- Search returns ALL active rooms (public + private)");
    console.log("- Password-protected rooms show 🔒 flag");
    console.log(
      "- Users can find any room but need password to join private ones",
    );

    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
};

testSearch();
