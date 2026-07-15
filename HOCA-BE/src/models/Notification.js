const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true }, // null for admin-only notifications
    type: {
        type: String,
        enum: ['BADGE_UNLOCK', 'RANK_UP', 'STREAK_MILESTONE', 'SYSTEM', 'ROOM_INVITE', 'ROOM_REMINDER', 'GOAL_REMINDER', 'SUBSCRIPTION_EXPIRY', 'ADMIN_ALERT', 'BLOCKED_LOGIN_ATTEMPT'],
        required: true
    },
    title: { type: String, required: true },
    message: { type: String, required: true },
    icon: { type: String }, // URL to icon
    data: { type: mongoose.Schema.Types.Mixed }, // Extra data (badgeId, rankId, userId for blocked attempts, etc.)
    isRead: { type: Boolean, default: false, index: true },
    isArchived: { type: Boolean, default: false, index: true },
    isAdminNotification: { type: Boolean, default: false } // For admin-only notifications
}, { timestamps: true });

// Index for efficient queries
notificationSchema.index({ user: 1, createdAt: -1 });
notificationSchema.index({ user: 1, isRead: 1 });
notificationSchema.index({ user: 1, 'data.reminderKey': 1 }, { sparse: true, unique: true });

module.exports = mongoose.model('Notification', notificationSchema);
