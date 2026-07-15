const mongoose = require('mongoose');
const authSessionSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  sessionId: { type: String, required: true, unique: true },
  userAgent: { type: String, maxlength: 500, default: '' },
  ip: { type: String, maxlength: 100, default: '' },
  lastUsedAt: { type: Date, default: Date.now },
  expiresAt: { type: Date, required: true, index: { expires: 0 } },
  revokedAt: { type: Date, default: null },
}, { timestamps: true });
authSessionSchema.index({ user: 1, revokedAt: 1, lastUsedAt: -1 });
module.exports = mongoose.model('AuthSession', authSessionSchema);
