const userService = require('../services/user.service');

const getProfile = async (req, reply) => {
  try {
    const user = await userService.getUserProfile(req.user.id);
    reply.send(user);
  } catch (error) {
    reply.code(404).send({ message: error.message });
  }
};

const updateProfile = async (req, reply) => {
  try {
    const user = await userService.updateUserProfile(req.user.id, req.body);
    reply.send(user);
  } catch (error) {
    reply.code(400).send({ message: error.message });
  }
};

const getDashboard = async (req, reply) => {
  try {
    const dashboard = await userService.getUserDashboard(req.user.id);
    reply.send(dashboard);
  } catch (error) {
    reply.code(400).send({ message: error.message });
  }
};

const getUserById = async (req, reply) => {
  try {
    const user = await userService.getUserById(req.params.id);
    reply.send(user);
  } catch (error) {
    reply.code(404).send({ message: error.message });
  }
};

const updateStudyTime = async (req, reply) => {
  try {
    const { minutes } = req.body;
    if (!minutes || minutes <= 0) {
      return reply.code(400).send({ message: 'Invalid minutes' });
    }
    const user = await userService.trackStudyTime(req.user.id, minutes);
    reply.send({
      message: 'Study time updated',
      todayStudyMinutes: user.todayStudyMinutes,
      totalStudyMinutes: user.totalStudyMinutes,
      currentStreak: user.currentStreak,
      longestStreak: user.longestStreak
    });
  } catch (error) {
    reply.code(400).send({ message: error.message });
  }
};

const getLeaderboard = async (req, reply) => {
  try {
    const data = await userService.getLeaderboard();
    reply.send(data);
  } catch (error) {
    reply.code(400).send({ message: error.message });
  }
};

const recoverStreak = async (req, reply) => {
  try {
    // Check if user is premium - they don't need ads but let's allow recovery anyway
    const result = await userService.recoverStreak(req.user.id);
    reply.send(result);
  } catch (error) {
    reply.code(400).send({ message: error.message });
  }
};

const updateVirtualBackground = async (req, reply) => {
  try {
    const user = await userService.updateVirtualBackground(req.user.id, req.body);
    reply.send({ message: 'Virtual background updated', virtualBackground: user.virtualBackground });
  } catch (error) {
    reply.code(400).send({ message: error.message });
  }
};

const getWeeklyActivity = async (req, reply) => {
  try {
    const activity = await userService.getWeeklyActivity(req.user.id);
    reply.send(activity);
  } catch (error) {
    reply.code(400).send({ message: error.message });
  }
};

const requestAccountDeletion = async (req, reply) => {
  try {
    const result = await userService.requestAccountDeletion(req.user.id, req.body?.password);
    reply.send(result);
  } catch (error) {
    reply.code(error.statusCode || 400).send({ message: error.message });
  }
};

const exportAccountData = async (req, reply) => {
  const mongoose = require('mongoose');
  const output = { exportedAt: new Date().toISOString(), profile: req.user.toObject() };
  for (const key of ['password','verificationCode','verificationCodeExpires','verificationCodeSentAt','twoFactorSecret','twoFactorPendingSecret','authVersion','resetPasswordToken','resetPasswordExpire','emailChangeCode','emailChangeExpires']) delete output.profile[key];
  const collections = {
    StudySession: { user: req.user._id }, StudyGoal: { user: req.user._id },
    Notification: { user: req.user._id }, AIUsage: { user: req.user._id },
    AIConversation: { user: req.user._id }, Transaction: { user: req.user._id },
    Feedback: { user: req.user._id }, SupportTicket: { user: req.user._id },
    AuthSession: { user: req.user._id }, CommunityReaction: { user: req.user._id },
    RoomRating: { user: req.user._id }, Message: { sender: req.user._id },
    Room: { $or: [{ owner: req.user._id }, { activeParticipants: req.user._id }] },
    RoomInvite: { $or: [{ inviter: req.user._id }, { invitee: req.user._id }] },
    Report: { $or: [{ submitter: req.user._id }, { targetUser: req.user._id }] },
  };
  for (const [name, query] of Object.entries(collections)) {
    try {
      const Model = mongoose.model(name);
      output[name] = await Model.find(query).lean();
    } catch { output[name] = []; }
  }
  reply.header('Content-Disposition', `attachment; filename="hoca-data-${req.user._id}.json"`);
  reply.type('application/json').send(output);
};
const requestEmailChange = async (req, reply) => {
  try { reply.send(await userService.requestEmailChange(req.user.id, req.body?.password, req.body?.newEmail)); }
  catch (error) { reply.code(error.statusCode || 400).send({ message: error.message }); }
};
const confirmEmailChange = async (req, reply) => {
  try { reply.send(await userService.confirmEmailChange(req.user.id, req.body?.code)); }
  catch (error) { reply.code(400).send({ message: error.message }); }
};

const deleteAccount = async (req, reply) => {
  try {
    const result = await userService.deleteAccount(
      req.user.id,
      req.body?.password,
      req.body?.code,
    );
    reply.send(result);
  } catch (error) {
    reply.code(400).send({ message: error.message });
  }
};

module.exports = {
  getProfile,
  updateProfile,
  getDashboard,
  getUserById,
  updateStudyTime,
  getLeaderboard,
  recoverStreak,
  updateVirtualBackground,
  getWeeklyActivity,
  exportAccountData,
  requestAccountDeletion,
  requestEmailChange,
  confirmEmailChange,
  deleteAccount
};
