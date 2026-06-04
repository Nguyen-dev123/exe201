require("dotenv").config();
const mongoose = require("mongoose");

async function updateAllRoomsPublic() {
  try {
    console.log("🔄 Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ Connected to MongoDB\n");

    const Room = require("./src/models/Room");

    // Find all rooms that are not public and don't have password
    const roomsToUpdate = await Room.find({
      $or: [{ isPublic: false }, { isPublic: { $exists: false } }],
    }).select("name isPublic password owner");

    console.log(`📊 Found ${roomsToUpdate.length} rooms that are not public\n`);

    if (roomsToUpdate.length === 0) {
      console.log("✅ All rooms are already public!");
      await mongoose.connection.close();
      return;
    }

    // Show rooms before update
    console.log("Rooms to be updated:");
    roomsToUpdate.forEach((room, index) => {
      console.log(
        `  ${index + 1}. "${room.name}" - isPublic: ${room.isPublic}, hasPassword: ${!!room.password}`,
      );
    });

    // Update all rooms without password to be public
    const result = await Room.updateMany(
      {
        $or: [{ isPublic: false }, { isPublic: { $exists: false } }],
      },
      {
        $set: { isPublic: true },
      },
    );

    console.log(`\n✅ Updated ${result.modifiedCount} rooms to public!`);

    // Verify the update
    const publicRoomsCount = await Room.countDocuments({
      isPublic: true,
      isActive: true,
    });
    const totalRoomsCount = await Room.countDocuments();

    console.log(`\n📈 Database status:`);
    console.log(`   Total rooms: ${totalRoomsCount}`);
    console.log(`   Public & active rooms: ${publicRoomsCount}`);

    await mongoose.connection.close();
    console.log("\n✅ Done! You can now search for all rooms.");
  } catch (error) {
    console.error("❌ Error:", error.message);
    if (error.code === "ECONNREFUSED") {
      console.log(
        "\n💡 Tip: Make sure MongoDB connection is working. Check if you have internet connection.",
      );
    }
    process.exit(1);
  }
}

updateAllRoomsPublic();
