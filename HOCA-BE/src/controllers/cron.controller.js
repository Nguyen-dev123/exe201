const { cleanupInactiveAccounts } = require("../jobs/cleanup.job");
const {
  performStreakMaintenance,
  performRoomMaintenance,
} = require("../jobs/streak.job");

const runCleanup = async (req, reply) => {
  try {
    // Simple security check
    const cronSecret = process.env.CRON_SECRET || "hoca_cron_secret_key";
    const authHeader = req.headers["x-cron-secret"];

    if (authHeader !== cronSecret && req.query.secret !== cronSecret) {
      return reply.code(401).send({ message: "Unauthorized" });
    }

    const result = await cleanupInactiveAccounts();
    reply.send({ message: "Cleanup job executed successfully", result });
  } catch (error) {
    console.error("Manual cleanup trigger error:", error);
    reply.code(500).send({ message: error.message });
  }
};

const runStreakMaintenance = async (req, reply) => {
  try {
    // Simple security check
    const cronSecret = process.env.CRON_SECRET || "hoca_cron_secret_key";
    const authHeader = req.headers["x-cron-secret"];

    if (authHeader !== cronSecret && req.query.secret !== cronSecret) {
      return reply.code(401).send({ message: "Unauthorized" });
    }

    const result = await performStreakMaintenance();
    reply.send({ message: "Streak maintenance executed successfully", result });
  } catch (error) {
    console.error("Manual streak maintenance trigger error:", error);
    reply.code(500).send({ message: error.message });
  }
};

const runRoomMaintenance = async (req, reply) => {
  try {
    // Simple security check
    const cronSecret = process.env.CRON_SECRET || "hoca_cron_secret_key";
    const authHeader = req.headers["x-cron-secret"];

    if (authHeader !== cronSecret && req.query.secret !== cronSecret) {
      return reply.code(401).send({ message: "Unauthorized" });
    }

    const result = await performRoomMaintenance();
    reply.send({ message: "Room maintenance executed successfully", result });
  } catch (error) {
    console.error("Manual room maintenance trigger error:", error);
    reply.code(500).send({ message: error.message });
  }
};

const fixRoomsPublic = async (req, reply) => {
  try {
    // Simple security check
    const cronSecret = process.env.CRON_SECRET || "hoca_cron_secret_key";
    const authHeader = req.headers["x-cron-secret"];

    if (authHeader !== cronSecret && req.query.secret !== cronSecret) {
      return reply.code(401).send({ message: "Unauthorized" });
    }

    const Room = require("../models/Room");

    // Get all rooms info first
    const allRooms = await Room.find().select(
      "name isPublic isActive closedAt owner",
    );

    // Update ALL rooms to be public AND active (reopen closed rooms)
    const result = await Room.updateMany(
      {},
      {
        $set: {
          isPublic: true,
          isActive: true,
        },
        $unset: {
          closedAt: "",
        },
      },
    );

    const publicRoomsCount = await Room.countDocuments({
      isPublic: true,
      isActive: true,
    });
    const totalRoomsCount = await Room.countDocuments();

    reply.send({
      message: "Rooms updated to public and active successfully",
      updatedCount: result.modifiedCount,
      totalRooms: totalRoomsCount,
      publicActiveRooms: publicRoomsCount,
      roomsBefore: allRooms.map((r) => ({
        name: r.name,
        isPublic: r.isPublic,
        isActive: r.isActive,
        wasClosed: !!r.closedAt,
      })),
    });
  } catch (error) {
    console.error("Fix rooms public error:", error);
    reply.code(500).send({ message: error.message });
  }
};

module.exports = {
  runCleanup,
  runStreakMaintenance,
  runRoomMaintenance,
  fixRoomsPublic,
};

const checkRoomsOwnership = async (req, reply) => {
  try {
    const cronSecret = process.env.CRON_SECRET || "hoca_cron_secret_key";
    const authHeader = req.headers["x-cron-secret"];

    if (authHeader !== cronSecret && req.query.secret !== cronSecret) {
      return reply.code(401).send({ message: "Unauthorized" });
    }

    const User = require("../models/User");
    const Room = require("../models/Room");

    const users = await User.find().select("displayName email _id");
    const rooms = await Room.find({
      isPublic: true,
      isActive: true,
    }).populate("owner", "displayName email");

    const userMap = {};
    users.forEach((u) => {
      userMap[u._id.toString()] = u.displayName;
    });

    const roomsByOwner = {};
    rooms.forEach((room) => {
      const ownerId = room.owner?._id?.toString() || "no-owner";
      if (!roomsByOwner[ownerId]) {
        roomsByOwner[ownerId] = {
          ownerName: userMap[ownerId] || "Unknown",
          rooms: [],
        };
      }
      roomsByOwner[ownerId].rooms.push(room.name);
    });

    reply.send({
      totalUsers: users.length,
      totalRooms: rooms.length,
      users: users.map((u) => ({
        id: u._id,
        name: u.displayName,
        email: u.email,
      })),
      roomsByOwner,
    });
  } catch (error) {
    console.error("Check rooms ownership error:", error);
    reply.code(500).send({ message: error.message });
  }
};

module.exports.checkRoomsOwnership = checkRoomsOwnership;

const listAllRooms = async (req, reply) => {
  try {
    const cronSecret = process.env.CRON_SECRET || "hoca_cron_secret_key";
    const authHeader = req.headers["x-cron-secret"];

    if (authHeader !== cronSecret && req.query.secret !== cronSecret) {
      return reply.code(401).send({ message: "Unauthorized" });
    }

    const Room = require("../models/Room");

    const allRooms = await Room.find()
      .populate("owner", "displayName email")
      .select("name isPublic isActive closedAt owner createdAt")
      .sort("-createdAt");

    reply.send({
      total: allRooms.length,
      rooms: allRooms.map((r) => ({
        name: r.name,
        owner: r.owner?.displayName || "Unknown",
        ownerEmail: r.owner?.email || "N/A",
        isPublic: r.isPublic,
        isActive: r.isActive,
        closedAt: r.closedAt,
        createdAt: r.createdAt,
        id: r._id,
      })),
    });
  } catch (error) {
    console.error("List all rooms error:", error);
    reply.code(500).send({ message: error.message });
  }
};

module.exports.listAllRooms = listAllRooms;
