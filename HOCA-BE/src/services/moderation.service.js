const User = require("../models/User");
const Notification = require("../models/Notification");

/**
 * Auto-escalating punishment system.
 *
 * Levels based on total confirmed violations:
 *   1 violation  -> Warning only
 *   2 violations -> Chat + room creation banned for 3 days
 *   3 violations -> Chat + room creation banned for 7 days
 *   4+ violations -> Account locked permanently
 */
const PUNISHMENT_TIERS = {
  1: {
    label: "Cảnh cáo",
    apply: (user) => {
      // warning only
    },
    message:
      "Bạn đã nhận cảnh cáo do vi phạm quy tắc cộng đồng. Vi phạm tiếp theo sẽ bị hạn chế tính năng.",
  },
  2: {
    label: "Khóa chat & tạo phòng 3 ngày",
    apply: (user) => {
      const until = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
      user.chatBannedUntil = until;
      user.roomBannedUntil = until;
    },
    message:
      "Bạn đã vi phạm lần 2. Quyền chat và tạo phòng bị tạm khóa trong 3 ngày.",
  },
  3: {
    label: "Khóa chat & tạo phòng 7 ngày",
    apply: (user) => {
      const until = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      user.chatBannedUntil = until;
      user.roomBannedUntil = until;
    },
    message:
      "Bạn đã vi phạm lần 3. Quyền chat và tạo phòng bị tạm khóa trong 7 ngày.",
  },
};

const PERMANENT_LOCK_MESSAGE =
  "Tài khoản của bạn đã bị khóa vĩnh viễn do vi phạm nhiều lần quy tắc cộng đồng.";

/**
 * Register one confirmed violation against a user and auto-apply the
 * escalating punishment. Returns the applied tier info.
 * @param {string} userId
 * @param {string} reason
 */
const escalateViolation = async (
  userId,
  reason = "Vi phạm quy tắc cộng đồng",
) => {
  const user = await User.findById(userId);
  if (!user) throw new Error("User not found");

  user.violationCount = (user.violationCount || 0) + 1;
  user.lastViolationAt = new Date();

  // Always record a warning entry for history
  user.warnings.push({
    reason,
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  });

  const count = user.violationCount;
  let tierLabel;
  let notifyMessage;

  if (count >= 4) {
    // Permanent lock
    user.isLocked = true;
    user.lockReason = "Vi phạm nhiều lần quy tắc cộng đồng";
    tierLabel = "Khóa tài khoản vĩnh viễn";
    notifyMessage = PERMANENT_LOCK_MESSAGE;
  } else {
    const tier = PUNISHMENT_TIERS[count];
    tier.apply(user);
    tierLabel = tier.label;
    notifyMessage = tier.message;
  }

  await user.save();

  // Notify the user
  try {
    await Notification.create({
      user: userId,
      type: "ADMIN_ALERT",
      title: `Xử lý vi phạm (lần ${count})`,
      message: notifyMessage,
      icon: "warning",
      data: { violationCount: count, tier: tierLabel },
    });
  } catch (e) {
    console.error("Failed to create violation notification:", e.message);
  }

  return {
    violationCount: count,
    tier: tierLabel,
    message: notifyMessage,
    chatBannedUntil: user.chatBannedUntil,
    roomBannedUntil: user.roomBannedUntil,
    isLocked: user.isLocked,
  };
};

/**
 * Check whether a user is currently chat-banned.
 */
const isChatBanned = (user) => {
  if (!user?.chatBannedUntil) return false;
  return new Date(user.chatBannedUntil) > new Date();
};

/**
 * Check whether a user is currently room-banned.
 */
const isRoomBanned = (user) => {
  if (!user?.roomBannedUntil) return false;
  return new Date(user.roomBannedUntil) > new Date();
};

module.exports = {
  escalateViolation,
  isChatBanned,
  isRoomBanned,
};
