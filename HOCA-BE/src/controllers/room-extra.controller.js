const Room = require('../models/Room');
const User = require('../models/User');
const RoomInvite = require('../models/RoomInvite');
const RoomRating = require('../models/RoomRating');
const StudySession = require('../models/StudySession');
const Message = require('../models/Message');
const Notification = require('../models/Notification');

const ensureOwner = async (roomId, user) => {
  const room = await Room.findById(roomId);
  if (!room) throw Object.assign(new Error('Không tìm thấy phòng'), { statusCode: 404 });
  if (String(room.owner || '') !== String(user._id) && user.role !== 'ADMIN') throw Object.assign(new Error('Chỉ chủ phòng được thực hiện thao tác này'), { statusCode: 403 });
  return room;
};
const invite = async (req, reply) => {
  try {
    const room = await ensureOwner(req.params.id, req.user);
    if (String(req.body?.userId) === String(req.user._id)) return reply.code(400).send({ message: 'Không thể tự mời chính mình' });
    const email = String(req.body?.email || '').trim().toLowerCase();
    let invitee = email ? await User.findOne({ email }) : null;
    if (!invitee && req.body?.userId && require('mongoose').isValidObjectId(req.body.userId)) invitee = await User.findById(req.body.userId);
    if (String(invitee?._id || '') === String(req.user._id)) return reply.code(400).send({ message: 'Không thể tự mời chính mình' });
    if (!invitee) return reply.code(404).send({ message: 'Không tìm thấy người dùng' });
    const item = await RoomInvite.findOneAndUpdate(
      { room: room._id, invitee: invitee._id, status: 'PENDING' },
      { $set: { inviter: req.user._id, expiresAt: new Date(Date.now()+7*86400000) } },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );
    const notification = await Notification.create({ user: invitee._id, type: 'ROOM_INVITE', title: 'Lời mời vào phòng học', message: `${req.user.displayName} mời bạn vào phòng ${room.name}`, data: { url: '/rooms', inviteId: item._id, roomId: room._id } });
    global.io?.to(`user:${invitee._id}`).emit('notification', notification.toObject());
    reply.code(201).send(item);
  } catch (error) { reply.code(error.statusCode || 400).send({ message: error.message }); }
};
const invitations = async (req, reply) => reply.send(await RoomInvite.find({ invitee: req.user._id, status: 'PENDING', expiresAt: { $gt: new Date() } }).sort('-createdAt').populate('room','name roomType scheduledFor isActive').populate('inviter','displayName avatar'));
const respondInvite = async (req, reply) => {
  const status = req.body?.status === 'ACCEPTED' ? 'ACCEPTED' : req.body?.status === 'DECLINED' ? 'DECLINED' : null;
  if (!status) return reply.code(400).send({ message: 'Phản hồi không hợp lệ' });
  const item = await RoomInvite.findOneAndUpdate({ _id: req.params.inviteId, invitee: req.user._id, status: 'PENDING', expiresAt: { $gt: new Date() } }, { status }, { new: true }).populate('room','name isActive scheduledFor');
  if (!item) return reply.code(404).send({ message: 'Lời mời không tồn tại hoặc đã hết hạn' });
  reply.send(item);
};
const recent = async (req, reply) => {
  const sessions = await StudySession.find({ user: req.user._id }).sort('-startTime').limit(100).select('room').lean();
  const ids = [...new Set(sessions.map((item) => String(item.room || '')).filter(Boolean))];
  const rooms = await Room.find({ _id: { $in: ids.slice(0, 20) } })
    .populate('owner', 'displayName avatar')
    .lean();
  const roomById = new Map(rooms.map((room) => [String(room._id), room]));

  // MongoDB does not preserve the order of values passed to $in. Rebuild the
  // result in session order so the first item is always the room used latest.
  reply.send(ids.slice(0, 20).map((id) => roomById.get(id)).filter(Boolean));
};
const history = async (req, reply) => reply.send(await StudySession.find({ user: req.user._id }).sort('-startTime').limit(100).populate('room','name roomType'));
const favorites = async (req, reply) => { const user = await User.findById(req.user._id).populate('favoriteRooms'); reply.send(user.favoriteRooms || []); };
const favorite = async (req, reply) => { await User.updateOne({ _id: req.user._id }, { $addToSet: { favoriteRooms: req.params.id } }); reply.send({ success: true }); };
const unfavorite = async (req, reply) => { await User.updateOne({ _id: req.user._id }, { $pull: { favoriteRooms: req.params.id } }); reply.send({ success: true }); };
const exportRoom = async (req, reply) => {
  const participated = await StudySession.exists({ room: req.params.id, user: req.user._id });
  const room = await Room.findById(req.params.id).lean();
  if (!room || (!participated && String(room.owner || '') !== String(req.user._id) && req.user.role !== 'ADMIN')) return reply.code(403).send({ message: 'Bạn không có quyền xuất nội dung phòng' });
  const [sessions, messages] = await Promise.all([StudySession.find({ room: room._id }).select('startTime endTime duration').lean(), Message.find({ room: room._id }).sort('createdAt').populate('sender','displayName').lean()]);
  reply.header('Content-Disposition', `attachment; filename="room-${room._id}.json"`).send({ room, sessions, messages });
};
const rate = async (req, reply) => {
  const participated = await StudySession.exists({ room: req.params.id, user: req.user._id });
  if (!participated) return reply.code(403).send({ message: 'Bạn cần tham gia phòng trước khi đánh giá' });
  const rating = Number(req.body?.rating); if (rating < 1 || rating > 5) return reply.code(400).send({ message: 'Điểm đánh giá không hợp lệ' });
  await RoomRating.findOneAndUpdate({ room: req.params.id, user: req.user._id }, { rating, comment: String(req.body?.comment || '').slice(0,1000) }, { upsert: true });
  const stats = await RoomRating.aggregate([{ $match: { room: new (require('mongoose').Types.ObjectId)(req.params.id) } }, { $group: { _id: null, average: { $avg: '$rating' }, count: { $sum: 1 } } }]);
  await Room.updateOne({ _id: req.params.id }, { averageRating: stats[0]?.average || 0, ratingCount: stats[0]?.count || 0 }); reply.send({ success: true, ...stats[0] });
};
module.exports = { invite, invitations, respondInvite, recent, history, favorites, favorite, unfavorite, exportRoom, rate };
