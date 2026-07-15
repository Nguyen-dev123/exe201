const cron = require('node-cron');
const Notification = require('../models/Notification');
const Room = require('../models/Room');
const RoomInvite = require('../models/RoomInvite');
const StudyGoal = require('../models/StudyGoal');
const User = require('../models/User');

const emitNotification = (io, notification) => {
  io?.to(`user:${notification.user}`).emit('notification', notification.toObject());
};

const createOnce = async (io, data) => {
  const exists = await Notification.exists({
    user: data.user,
    'data.reminderKey': data.data.reminderKey,
  });
  if (exists) return null;
  let notification;
  try { notification = await Notification.create(data); }
  catch (error) { if (error?.code === 11000) return null; throw error; }
  emitNotification(io, notification);
  return notification;
};

const sendRoomReminderForRoom = async (io, room, now = new Date()) => {
  if (!room?.scheduledFor || room.isActive === false) return [];

  const scheduledFor = new Date(room.scheduledFor);
  const dueAt = new Date(scheduledFor.getTime() - (room.reminderMinutes ?? 15) * 60000);
  if (dueAt > now) return [];

  const invites = await RoomInvite.find({ room: room._id, status: 'ACCEPTED' }).select('invitee');
  const recipients = new Set([room.owner?.toString(), ...invites.map((item) => item.invitee.toString())].filter(Boolean));
  const startTime = new Intl.DateTimeFormat('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh', hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric', hour12: false }).format(scheduledFor);
  const hasStarted = scheduledFor <= now;
  const created = [];

  for (const user of recipients) {
    const notification = await createOnce(io, {
      user,
      type: 'ROOM_REMINDER',
      title: hasStarted ? 'Đã đến giờ học' : 'Sắp đến giờ học',
      message: `Phòng “${room.name}” ${hasStarted ? 'đã đến giờ bắt đầu' : `sẽ bắt đầu lúc ${startTime}`}. Bấm để vào phòng.`,
      data: {
        roomId: room._id,
        url: `/rooms/${room._id}`,
        scheduledFor,
        reminderKey: `room:${room._id}:${scheduledFor.toISOString()}`,
      },
    });
    if (notification) created.push(notification);
  }

  return created;
};

const sendRoomReminders = async (io, now) => {
  const horizon = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const graceStart = new Date(now.getTime() - 10 * 60 * 1000);
  const rooms = await Room.find({
    isActive: true,
    // A short grace window prevents delayed or restarted cron runs from losing reminders.
    scheduledFor: { $gt: graceStart, $lte: horizon },
  }).select('name owner scheduledFor reminderMinutes');

  for (const room of rooms) {
    await sendRoomReminderForRoom(io, room, now);
  }
};

const sendGoalReminders = async (io, now) => {
  const goals = await StudyGoal.find({ status: 'ACTIVE', reminderAt: { $lte: now } });
  for (const goal of goals) {
    const originalReminder = new Date(goal.reminderAt);
    await createOnce(io, {
      user: goal.user,
      type: 'GOAL_REMINDER',
      title: 'Nhắc mục tiêu học tập',
      message: goal.text,
      data: {
        goalId: goal._id,
        url: '/dashboard',
        reminderKey: `goal:${goal._id}:${originalReminder.toISOString()}`,
      },
    });
    if (goal.recurrence === 'DAILY') goal.reminderAt = new Date(originalReminder.getTime() + 86400000);
    else if (goal.recurrence === 'WEEKLY') goal.reminderAt = new Date(originalReminder.getTime() + 7 * 86400000);
    else goal.reminderAt = null;
    while (goal.reminderAt && goal.reminderAt <= now) {
      goal.reminderAt = new Date(goal.reminderAt.getTime() + (goal.recurrence === 'WEEKLY' ? 7 : 1) * 86400000);
    }
    await goal.save();
  }
};

const sendSubscriptionReminders = async (io, now) => {
  const horizon = new Date(now.getTime() + 7 * 86400000);
  const users = await User.find({
    subscriptionTier: { $nin: ['FREE', 'LIFETIME'] },
    subscriptionExpiry: { $gt: now, $lte: horizon },
  }).select('subscriptionExpiry subscriptionTier');
  for (const user of users) {
    const days = Math.ceil((user.subscriptionExpiry - now) / 86400000);
    if (![1, 3, 7].includes(days)) continue;
    await createOnce(io, {
      user: user._id,
      type: 'SUBSCRIPTION_EXPIRY',
      title: 'Gói thành viên sắp hết hạn',
      message: `Gói ${user.subscriptionTier} của bạn còn ${days} ngày.`,
      data: { url: '/profile?tab=billing', reminderKey: `subscription:${user._id}:${user.subscriptionExpiry.toISOString()}:${days}` },
    });
  }
};

const runReminders = async (io) => {
  const now = new Date();
  await Promise.all([
    sendRoomReminders(io, now),
    sendGoalReminders(io, now),
    sendSubscriptionReminders(io, now),
  ]);
};

const startReminderJob = (io) => {
  cron.schedule('* * * * *', () => runReminders(io).catch((error) => {
    console.error('[Reminder Job]', error.message);
  }));
  console.log('[Reminder Job] Room, goal and subscription reminders scheduled');
};

module.exports = { startReminderJob, runReminders, sendRoomReminderForRoom };
