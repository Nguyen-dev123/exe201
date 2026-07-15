const mongoose = require('mongoose');

const studySessionSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  room: { type: mongoose.Schema.Types.ObjectId, ref: 'Room' },
  
  startTime: { type: Date, default: Date.now },
  endTime: { type: Date },
  duration: { type: Number, default: 0 }, // minutes
  
  isCompleted: { type: Boolean, default: false }
}, { timestamps: true });

// A user can have only one unfinished session in the same room. This also
// protects against duplicate Socket.IO join events arriving concurrently.
studySessionSchema.index(
  { user: 1, room: 1 },
  { unique: true, partialFilterExpression: { isCompleted: false } },
);

module.exports = mongoose.model('StudySession', studySessionSchema);
