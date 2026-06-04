require("dotenv").config();
const mongoose = require("mongoose");

async function fixRoomsPublic() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ Connected to MongoDB");

    const Room = require("./src/models/Room");

    // Update all rooms to be public if they don't have a password
    const result = await Room.updateMany(
      {
        $or: [{ isPublic: { $exists: false } }, { isPublic: false }],
        password: { $exists: false },
      },
      {
        $set: { isPublic: true },
      },
    );

    console.log(`✅ Updated ${result.modifiedCount} rooms to be public`);

    // Show all rooms after update
    const allRooms = await Room.find().select(
      "name isPublic isActive roomType owner",
    );
    console.log("\n📊 All Rooms after update:");
    allRooms.forEach((room) => {
      console.log(
        `- ${room.name}: isPublic=${room.isPublic}, isActive=${room.isActive}, type=${room.roomType}`,
      );
    });

    await mongoose.connection.close();
    console.log("\n✅ Done!");
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
}

fixRoomsPublic();
