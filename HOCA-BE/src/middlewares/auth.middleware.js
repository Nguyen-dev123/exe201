const User = require('../models/User');
const AuthSession = require('../models/AuthSession');

const protect = async (req, reply) => {
  try {
    await req.jwtVerify();

    // Fetch full user object after JWT is verified
    // This ensures req.user has both .id and ._id for compatibility
    const tokenPayload = req.user;
    const user = await User.findById(tokenPayload.id).select('+authVersion');
    if (!user) {
      return reply.code(401).send({ message: 'User not found' });
    }
    if (Number(tokenPayload.authVersion || 0) !== Number(user.authVersion || 0)) {
      return reply.code(401).send({ message: 'Phiên đăng nhập đã bị thu hồi' });
    }
    if (tokenPayload.sessionId) {
      const session = await AuthSession.findOne({
        user: user._id,
        sessionId: tokenPayload.sessionId,
        revokedAt: null,
        expiresAt: { $gt: new Date() },
      });
      if (!session) return reply.code(401).send({ message: 'Phiên đăng nhập đã bị thu hồi' });
      req.userSessionId = tokenPayload.sessionId;
    }

    // Check if user is locked/blocked
    // This ensures locked users are immediately denied access even with valid tokens
    if (user.isLocked || user.isBlocked) {
      return reply.code(403).send({
        message: 'Tài khoản của bạn đã bị khóa',
        lockReason: user.lockReason || 'Vi phạm quy định cộng đồng'
      });
    }

    // Set full user object on request (includes _id, role, subscriptionTier, etc.)
    req.user = user;
  } catch (err) {
    reply.send(err);
  }
};

const admin = async (req, reply) => {
  if (req.user && req.user.role === 'ADMIN') {
    // Authorized
  } else {
    reply.code(403).send({ message: 'Not authorized as admin' });
  }
};

module.exports = {
  protect,
  admin
};
