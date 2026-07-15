const User = require("../models/User");
const Room = require("../models/Room");

const STUDY_TOTAL_CACHE_MS = 60 * 1000;
let studyTotalCache = { value: 0, expiresAt: 0 };

const getTotalStudyMinutes = async () => {
  if (Date.now() < studyTotalCache.expiresAt) return studyTotalCache.value;

  const totals = await User.aggregate([
    {
      $match: {
        accountStatus: "ACTIVE",
        isBlocked: { $ne: true },
      },
    },
    {
      $group: {
        _id: null,
        totalStudyMinutes: { $sum: { $ifNull: ["$totalStudyMinutes", 0] } },
      },
    },
  ]);

  const value = totals[0]?.totalStudyMinutes || 0;
  studyTotalCache = {
    value,
    expiresAt: Date.now() + STUDY_TOTAL_CACHE_MS,
  };
  return value;
};

// GET /api/public/students - danh sách học viên nổi bật (công khai, cho trang chủ)
// Trả về tối đa 6 học viên có thời gian học nhiều nhất.
const getFeaturedStudents = async (req, reply) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 6, 12);
    const students = await User.find({
      role: "MEMBER",
      accountStatus: "ACTIVE",
      searchable: { $ne: false },
      profileVisibility: "PUBLIC",
    })
      .sort({ totalStudyMinutes: -1, xp: -1 })
      .limit(limit)
      .select("displayName avatar totalStudyMinutes currentStreak xp");

    reply.send(students);
  } catch (error) {
    reply.code(500).send({ message: error.message });
  }
};

// GET /api/public/students/:id - hồ sơ công khai của một học viên
// Chỉ trả về các trường an toàn để hiển thị công khai.
const getPublicProfile = async (req, reply) => {
  try {
    const user = await User.findOne({ _id: req.params.id, profileVisibility: "PUBLIC" })
      .select(
        "displayName avatar bio totalStudyMinutes currentStreak longestStreak xp subscriptionTier badges createdAt showStudyStats",
      )
      .populate("badges", "name icon description");

    if (!user) {
      return reply.code(404).send({ message: "Không tìm thấy học viên" });
    }

    const output = user.toObject();
    if (!user.showStudyStats) {
      delete output.totalStudyMinutes; delete output.currentStreak;
      delete output.longestStreak; delete output.xp;
    }
    reply.send(output);
  } catch (error) {
    reply.code(404).send({ message: error.message });
  }
};

const getPublicLeaderboard = async (req, reply) => {
  try {
    // Public leaderboard: treat missing/unset fields permissively
    // so users created before privacy fields existed still appear.
    const visibleUsers = {
      role: "MEMBER",
      accountStatus: "ACTIVE",
      isBlocked: { $ne: true },
      $and: [
        { $or: [{ searchable: { $exists: false } }, { searchable: { $ne: false } }] },
        { $or: [{ profileVisibility: { $exists: false } }, { profileVisibility: "PUBLIC" }] },
        { $or: [{ showStudyStats: { $exists: false } }, { showStudyStats: { $ne: false } }] },
      ],
    };
    const fields = "displayName avatar totalStudyMinutes currentStreak";
    const [topStudy, topStreak] = await Promise.all([
      User.find(visibleUsers).sort({ totalStudyMinutes: -1 }).limit(50).select(fields).lean(),
      User.find(visibleUsers).sort({ currentStreak: -1 }).limit(50).select(fields).lean(),
    ]);
    reply.send({ topStudy, topStreak });
  } catch (error) {
    req.log.error({ err: error }, "Public leaderboard query failed");
    reply.code(500).send({ message: "Không thể tải bảng xếp hạng" });
  }
};

// GET /api/public/platform-stats - live public footer/status data
const getPlatformStats = async (req, reply) => {
  try {
    const [activeRooms, totalStudyMinutes] = await Promise.all([
      Room.countDocuments({ isActive: true }),
      getTotalStudyMinutes(),
    ]);
    const connectedUserIds = new Set();

    if (global.io?.sockets?.sockets) {
      for (const socket of global.io.sockets.sockets.values()) {
        if (socket.user?.id) connectedUserIds.add(String(socket.user.id));
      }
    }

    return reply.send({
      status: "operational",
      onlineUsers: connectedUserIds.size,
      activeRooms,
      totalStudyMinutes,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    req.log.error(error);
    return reply.code(503).send({
      status: "degraded",
      message: "Dịch vụ đang phản hồi chậm.",
      updatedAt: new Date().toISOString(),
    });
  }
};

module.exports = { getFeaturedStudents, getPublicLeaderboard, getPublicProfile, getPlatformStats };
