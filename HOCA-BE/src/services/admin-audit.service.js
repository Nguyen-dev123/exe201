const AdminAuditLog = require('../models/AdminAuditLog');

const logAdminAction = async (req, action, details = {}) => {
  if (!req.user?._id) return;
  try {
    await AdminAuditLog.create({
      admin: req.user._id,
      action,
      targetType: details.targetType || 'SYSTEM',
      targetId: details.targetId?.toString() || '',
      targetLabel: details.targetLabel || '',
      metadata: details.metadata || {},
      ip: req.ip || req.headers?.['x-forwarded-for'] || ''
    });
  } catch (error) {
    req.log?.error?.(error, 'Unable to write admin audit log');
  }
};

module.exports = { logAdminAction };
