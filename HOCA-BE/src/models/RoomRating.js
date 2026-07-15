const mongoose = require('mongoose');
const schema = new mongoose.Schema({
  room: { type: mongoose.Schema.Types.ObjectId, ref: 'Room', required: true, index: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  rating: { type: Number, min: 1, max: 5, required: true },
  comment: { type: String, maxlength: 1000, default: '' },
}, { timestamps: true });
schema.index({ room: 1, user: 1 }, { unique: true });
module.exports = mongoose.model('RoomRating', schema);
