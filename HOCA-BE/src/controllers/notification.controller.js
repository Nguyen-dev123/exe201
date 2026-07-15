const Notification = require('../models/Notification');

/**
 * Get user's notifications (paginated)
 */
const getNotifications = async (req, reply) => {
    try {
        if (req.user.notificationEnabled === false) {
            return reply.send({
                notifications: [], unreadCount: 0,
                pagination: { page: 1, limit: 20, total: 0, pages: 0 },
                disabled: true,
            });
        }
        const userId = req.user._id;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;

        const [notifications, total, unreadCount] = await Promise.all([
            Notification.find({ user: userId, isArchived: req.query.archived === 'true' })
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            Notification.countDocuments({ user: userId, isArchived: req.query.archived === 'true' }),
            Notification.countDocuments({ user: userId, isRead: false, isArchived: false })
        ]);

        reply.send({
            notifications,
            unreadCount,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        reply.code(500).send({ message: error.message });
    }
};

/**
 * Get unread notification count
 */
const getUnreadCount = async (req, reply) => {
    try {
        if (req.user.notificationEnabled === false) {
            return reply.send({ unreadCount: 0, disabled: true });
        }
        const userId = req.user._id;
        const unreadCount = await Notification.countDocuments({ user: userId, isRead: false });
        reply.send({ unreadCount });
    } catch (error) {
        reply.code(500).send({ message: error.message });
    }
};

/**
 * Mark notification(s) as read
 */
const markAsRead = async (req, reply) => {
    try {
        const userId = req.user._id;
        const { notificationIds } = req.body; // Array of IDs or 'all'

        if (notificationIds === 'all') {
            await Notification.updateMany(
                { user: userId, isRead: false },
                { isRead: true }
            );
        } else if (Array.isArray(notificationIds)) {
            await Notification.updateMany(
                { _id: { $in: notificationIds }, user: userId },
                { isRead: true }
            );
        }

        reply.send({ success: true });
    } catch (error) {
        reply.code(500).send({ message: error.message });
    }
};

/**
 * Delete old notifications (older than 30 days)
 */
const deleteOldNotifications = async (req, reply) => {
    try {
        const userId = req.user._id;
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

        const result = await Notification.deleteMany({
            user: userId,
            createdAt: { $lt: thirtyDaysAgo }
        });

        reply.send({ deleted: result.deletedCount });
    } catch (error) {
        reply.code(500).send({ message: error.message });
    }
};

const archiveNotification = async (req, reply) => {
    try {
        const notification = await Notification.findOneAndUpdate(
            { _id: req.params.id, user: req.user._id },
            { isArchived: true, isRead: true },
            { new: true },
        );
        if (!notification) return reply.code(404).send({ message: 'Không tìm thấy thông báo' });
        reply.send(notification);
    } catch (error) {
        reply.code(400).send({ message: 'Thông báo không hợp lệ' });
    }
};

const deleteNotification = async (req, reply) => {
    try {
        const result = await Notification.deleteOne({ _id: req.params.id, user: req.user._id });
        if (!result.deletedCount) return reply.code(404).send({ message: 'Không tìm thấy thông báo' });
        reply.send({ success: true });
    } catch (error) {
        reply.code(400).send({ message: 'Thông báo không hợp lệ' });
    }
};

/**
 * Get admin notifications (blocked login attempts, etc.) - Admin only
 */
const getAdminNotifications = async (req, reply) => {
    try {
        const userId = req.user._id;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;
        const type = req.query.type; // Optional filter by type

        const query = { user: userId, isAdminNotification: true };
        if (type) {
            query.type = type;
        }

        const [notifications, total, unreadCount] = await Promise.all([
            Notification.find(query)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            Notification.countDocuments(query),
            Notification.countDocuments({ ...query, isRead: false })
        ]);

        reply.send({
            notifications,
            unreadCount,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        reply.code(500).send({ message: error.message });
    }
};

/**
 * Get admin unread notification count - Admin only
 */
const getAdminUnreadCount = async (req, reply) => {
    try {
        const userId = req.user._id;
        const unreadCount = await Notification.countDocuments({ 
            user: userId, 
            isAdminNotification: true,
            isRead: false 
        });
        reply.send({ unreadCount });
    } catch (error) {
        reply.code(500).send({ message: error.message });
    }
};

module.exports = {
    getNotifications,
    getUnreadCount,
    markAsRead,
    deleteOldNotifications,
    archiveNotification,
    deleteNotification,
    getAdminNotifications,
    getAdminUnreadCount
};
