require("dotenv").config();
const mongoose = require("mongoose");

async function checkUsersAndRooms() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ Connected to MongoDB\n");

    const User = require("./src/models/User");
    const Room = require("./src/models/Room");

    // Get all users
    const users = await User.find().select("displayName email _id");
    console.log(`👥 Total users: ${users.length}\n`);

    const userMap = {};
    users.forEach((user, i) => {
      console.log(`${i + 1}. ${user.displayName} (${user.email})`);
      console.log(`   ID: ${user._id}\n`);
      userMap[user._id.toString()] = user.displayName;
    });

    // Get all active public rooms
    const rooms = await Room.find({
      isPublic: true,
      isActive: true,
    }).populate("owner", "displayName email");

    console.log(`\n🏠 Total active public rooms: ${rooms.length}\n`);

    rooms.forEach((room, i) => {
      const ownerName = room.owner?.displayName || "Unknown";
      const ownerEmail = room.owner?.email || "N/A";
      console.log(`${i + 1}. "${room.name}"`);
      console.log(`   Owner: ${ownerName} (${ownerEmail})`);
      console.log(`   Room ID: ${room._id}\n`);
    });

    // Group rooms by owner
    const roomsByOwner = {};
    rooms.forEach((room) => {
      const ownerId = room.owner?._id?.toString();
      if (!roomsByOwner[ownerId]) {
        roomsByOwner[ownerId] = [];
      }
      roomsByOwner[ownerId].push(room.name);
    });

    console.log("\n📊 Rooms grouped by owner:\n");
    Object.entries(roomsByOwner).forEach(([ownerId, roomNames]) => {
      const ownerName = userMap[ownerId] || "Unknown";
      console.log(`${ownerName}:`);
      roomNames.forEach((name) => console.log(`  - ${name}`));
      console.log();
    });

    await mongoose.connection.close();
    console.log("✅ Done!");
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
}

checkUsersAndRooms();
