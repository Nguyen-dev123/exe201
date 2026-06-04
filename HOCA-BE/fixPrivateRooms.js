/**
 * Script to fix private rooms - make password-protected rooms public (searchable)
 * This allows users to find rooms with passwords in search results
 */

require("dotenv").config();
const mongoose = require("mongoose");
const Room = require("./src/models/Room");

const fixPrivateRooms = async () => {
  try {
    console.log("🔍 Connecting to database...");
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ Connected to database");

    // Find all private rooms that are still active
    const privateRooms = await Room.find({
      isPublic: false,
      isActive: true,
    }).populate("owner", "displayName email");

    console.log(`\n📊 Found ${privateRooms.length} private active rooms`);

    if (privateRooms.length === 0) {
      console.log("✅ No private rooms to fix!");
      process.exit(0);
    }

    console.log("\n📋 Private rooms:");
    privateRooms.forEach((room, index) => {
      const hasPassword = room.password ? "🔒 Has Password" : "No Password";
      const owner = room.owner ? room.owner.displayName : "No Owner";
      console.log(
        `${index + 1}. ${room.name} - ${hasPassword} - Owner: ${owner}`,
      );
    });

    // Update all private rooms to public
    const result = await Room.updateMany(
      { isPublic: false, isActive: true },
      { $set: { isPublic: true } },
    );

    console.log(
      `\n✅ Updated ${result.modifiedCount} rooms to public (searchable)`,
    );
    console.log(
      "💡 These rooms will now appear in search results. Password protection still works!",
    );

    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
};

fixPrivateRooms();
