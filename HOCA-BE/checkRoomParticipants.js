require("dotenv").config();
const mongoose = require("mongoose");
const Room = require("./src/models/Room");

async function checkRoomParticipants() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ Connected to MongoDB\n");

    const rooms = await Room.find()
      .populate("owner", "displayName")
      .populate("activeParticipants", "displayName")
      .sort({ createdAt: -1 })
      .limit(10);

    console.log(`📊 Total rooms in database: ${rooms.length}\n`);
    console.log("🏠 Recent Rooms:\n");
    console.log("=".repeat(120));
    console.log(
      "| Room Name                | Owner       | Active    | Max | Participants                    | Status |",
    );
    console.log("=".repeat(120));

    rooms.forEach((room) => {
      const name = (room.name || "Unnamed").substring(0, 24).padEnd(24);
      const owner = (room.owner?.displayName || "Unknown")
        .substring(0, 11)
        .padEnd(11);
      const active = String(room.activeParticipants?.length || 0).padEnd(9);
      const max = String(room.maxParticipants || 30).padEnd(3);

      const participants = room.activeParticipants
        ?.map((p) => p.displayName)
        .join(", ");
      const participantsStr = (participants || "None")
        .substring(0, 31)
        .padEnd(31);

      const status = room.status === "ACTIVE" ? "ACTIVE" : room.status;

      console.log(
        `| ${name} | ${owner} | ${active} | ${max} | ${participantsStr} | ${status.padEnd(6)} |`,
      );
    });

    console.log("=".repeat(120));

    // Find rooms with activeParticipants > 0
    const activeRooms = rooms.filter(
      (r) => r.activeParticipants && r.activeParticipants.length > 0,
    );
    console.log(`\n📈 Rooms with active participants: ${activeRooms.length}`);

    if (activeRooms.length > 0) {
      console.log("\n🔍 Detailed Active Rooms:");
      activeRooms.forEach((room) => {
        console.log(`\n  Room: ${room.name}`);
        console.log(`  ID: ${room._id}`);
        console.log(`  Owner: ${room.owner?.displayName}`);
        console.log(
          `  Active Participants (${room.activeParticipants.length}):`,
        );
        room.activeParticipants.forEach((p) => {
          console.log(`    - ${p.displayName} (${p._id})`);
        });
      });
    }

    // Check for ghost participants (users that left but still in array)
    const User = require("./src/models/User");
    console.log("\n\n🔍 Checking for ghost participants...");

    for (const room of activeRooms) {
      for (const participant of room.activeParticipants) {
        const user = await User.findById(participant._id);
        if (user && user.currentRoomId) {
          const currentRoom = user.currentRoomId.toString();
          const thisRoom = room._id.toString();
          if (currentRoom !== thisRoom) {
            console.log(
              `  ⚠️  GHOST: ${user.displayName} in room ${room.name} but currentRoomId = ${currentRoom}`,
            );
          }
        } else if (user && !user.currentRoomId) {
          console.log(
            `  ⚠️  GHOST: ${user.displayName} in room ${room.name} but currentRoomId = null (should have left!)`,
          );
        }
      }
    }

    console.log("\n✅ Check complete!");
  } catch (error) {
    console.error("❌ Error:", error.message);
  } finally {
    await mongoose.disconnect();
    console.log("\nDisconnected from MongoDB");
  }
}

checkRoomParticipants();
