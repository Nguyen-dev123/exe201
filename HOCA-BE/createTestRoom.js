require("dotenv").config();
const mongoose = require("mongoose");

async function createTestRoom() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ Connected to MongoDB");

    const Room = require("./src/models/Room");
    const User = require("./src/models/User");

    // Get first user as owner
    const user = await User.findOne();
    if (!user) {
      console.log("❌ No user found. Please create a user first.");
      process.exit(1);
    }

    // Create test room "Toán 12"
    const existingRoom = await Room.findOne({ name: "Toán 12" });
    if (existingRoom) {
      console.log('ℹ️  Room "Toán 12" already exists!');
      console.log(`   ID: ${existingRoom._id}`);
      console.log(`   Owner: ${user.displayName}`);
    } else {
      const room = await Room.create({
        name: "Toán 12",
        description: "Phòng học Toán lớp 12 - Test room",
        owner: user._id,
        isPublic: true,
        isActive: true,
        roomType: "SILENT",
        maxParticipants: 30,
        timerMode: "POMODORO_25_5",
      });

      console.log('✅ Created test room "Toán 12"');
      console.log(`   ID: ${room._id}`);
      console.log(`   Owner: ${user.displayName}`);
    }

    // Show all rooms
    const allRooms = await Room.find({ isActive: true, isPublic: true }).select(
      "name owner",
    );
    console.log(`\n📊 All active public rooms (${allRooms.length}):`);
    allRooms.forEach((room, i) => {
      console.log(`   ${i + 1}. ${room.name}`);
    });

    await mongoose.connection.close();
    console.log('\n✅ Done! Now search for "Toán 12" in the web app.');
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
}

createTestRoom();
