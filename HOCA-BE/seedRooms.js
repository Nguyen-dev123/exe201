const mongoose = require("mongoose");
require("dotenv").config();

const Room = require("./src/models/Room");
const RoomCategory = require("./src/models/RoomCategory");

const sampleRooms = [
  {
    name: "📚 Phòng Học Chung - Sáng",
    isPublic: true,
    maxParticipants: 50,
    roomType: "SILENT",
    timerMode: "POMODORO_25_5",
    isAdminRoom: true,
    isActive: true,
  },
  {
    name: "🌙 Phòng Học Đêm - Yên Tĩnh",
    isPublic: true,
    maxParticipants: 50,
    roomType: "SILENT",
    timerMode: "POMODORO_50_10",
    isAdminRoom: true,
    isActive: true,
  },
  {
    name: "💻 Phòng Lập Trình",
    isPublic: true,
    maxParticipants: 40,
    roomType: "SILENT",
    timerMode: "COUNT_UP",
    isAdminRoom: true,
    isActive: true,
  },
  {
    name: "📖 Phòng Đọc Sách",
    isPublic: true,
    maxParticipants: 30,
    roomType: "SILENT",
    timerMode: "POMODORO_45_5",
    isAdminRoom: true,
    isActive: true,
  },
  {
    name: "🎯 Phòng Thi Cử - Tập Trung",
    isPublic: true,
    maxParticipants: 50,
    roomType: "SILENT",
    timerMode: "POMODORO_50_10",
    isAdminRoom: true,
    isActive: true,
  },
  {
    name: "🎓 Phòng Ôn Tập Đại Học",
    isPublic: true,
    maxParticipants: 45,
    roomType: "SILENT",
    timerMode: "POMODORO_25_5",
    isAdminRoom: true,
    isActive: true,
  },
  {
    name: "✍️ Phòng Viết Luận Văn",
    isPublic: true,
    maxParticipants: 25,
    roomType: "SILENT",
    timerMode: "COUNT_UP",
    isAdminRoom: true,
    isActive: true,
  },
  {
    name: "🧮 Phòng Học Toán",
    isPublic: true,
    maxParticipants: 35,
    roomType: "SILENT",
    timerMode: "POMODORO_45_5",
    isAdminRoom: true,
    isActive: true,
  },
  {
    name: "🌍 Phòng Học Ngoại Ngữ",
    isPublic: true,
    maxParticipants: 30,
    roomType: "DISCUSSION",
    timerMode: "POMODORO_25_5",
    isAdminRoom: true,
    isActive: true,
  },
  {
    name: "🎨 Phòng Sáng Tạo",
    isPublic: true,
    maxParticipants: 20,
    roomType: "SILENT",
    timerMode: "COUNT_UP",
    isAdminRoom: true,
    isActive: true,
  },
  {
    name: "⚡ Phòng Học Nhanh - 25 phút",
    isPublic: true,
    maxParticipants: 50,
    roomType: "SILENT",
    timerMode: "POMODORO_25_5",
    isAdminRoom: true,
    isActive: true,
  },
  {
    name: "🔥 Phòng Marathon - 50 phút",
    isPublic: true,
    maxParticipants: 40,
    roomType: "SILENT",
    timerMode: "POMODORO_50_10",
    isAdminRoom: true,
    isActive: true,
  },
];

async function seedRooms() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ Connected to MongoDB");

    // Get or create default category
    let category = await RoomCategory.findOne({ name: "Học Tập Chung" });
    if (!category) {
      category = await RoomCategory.create({
        name: "Học Tập Chung",
        description: "Phòng học chung cho mọi người",
        icon: "📚",
      });
      console.log("✅ Created default category");
    }

    // Delete existing admin rooms
    await Room.deleteMany({ isAdminRoom: true });
    console.log("🗑️  Deleted old admin rooms");

    // Create new rooms
    const roomsToCreate = sampleRooms.map((room) => ({
      ...room,
      category: category._id,
      owner: null, // Admin rooms have no owner
      activeParticipants: [],
    }));

    const createdRooms = await Room.insertMany(roomsToCreate);
    console.log(`✅ Created ${createdRooms.length} sample rooms`);

    console.log("\n📋 Sample Rooms:");
    createdRooms.forEach((room, index) => {
      console.log(
        `${index + 1}. ${room.name} (${room.roomType}, ${room.maxParticipants} người)`,
      );
    });

    console.log("\n🎉 Seed completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error seeding rooms:", error);
    process.exit(1);
  }
}

seedRooms();
