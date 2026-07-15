const mongoose = require('mongoose');
const roomInviteSchema = new mongoose.Schema({
  room: { type: mongoose.Schema.Types.ObjectId, ref: 'Room', required: true, index: true },
  inviter: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  invitee: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  status: { type: String, enum: ['PENDING','ACCEPTED','DECLINED','CANCELLED'], default: 'PENDING', index: true },
  expiresAt: { type: Date, required: true },
}, { timestamps: true });
roomInviteSchema.index({ room: 1, invitee: 1, status: 1 });
module.exports = mongoose.model('RoomInvite', roomInviteSchema);
