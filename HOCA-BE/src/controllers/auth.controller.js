const authService = require("../services/auth.service");

const register = async (req, reply) => {
  try {
    const { displayName, email, password } = req.body;

    // Basic validation
    if (!displayName || !email || !password) {
      return reply.code(400).send({ message: "Missing required fields" });
    }
    if (password.length < 6) {
      return reply.code(400).send({ message: "Password must be at least 6 characters" });
    }

    const result = await authService.registerUser(
      { displayName, email, password },
      { userAgent: req.headers["user-agent"], ip: req.ip },
    );

    reply.code(201).send({
      message: result.message,
      user: result.user,
      token: result.token,
      refreshToken: result.refreshToken,
      requiresVerification: false,
    });
  } catch (error) {
    reply.code(error.statusCode || 400).send({
      message: error.message,
      code: error.code,
    });
  }
};

const verifyOtp = async (req, reply) => {
  try {
    const { email, code } = req.body;

    if (!email || !code || !/^\d{6}$/.test(String(code))) {
      return reply
        .code(400)
        .send({ message: "Email and a 6-digit verification code are required" });
    }

    const { user, token, refreshToken } = await authService.verifyOtp(email, code, { userAgent: req.headers['user-agent'], ip: req.ip });

    reply.send({
      message: "Email verified successfully. Welcome to HOCA!",
      user,
      token,
      refreshToken,
    });
  } catch (error) {
    reply.code(error.statusCode || 400).send({ message: error.message, code: error.code });
  }
};

const resendOtp = async (req, reply) => {
  try {
    const { email } = req.body;

    if (!email) {
      return reply.code(400).send({ message: "Email is required" });
    }

    const result = await authService.resendOtp(email);

    reply.send(result);
  } catch (error) {
    reply.code(error.statusCode || 400).send({ message: error.message, code: error.code });
  }
};

const login = async (req, reply) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return reply.code(400).send({ message: "Missing email or password" });
    }

    const result = await authService.loginUser({
      email,
      password,
    }, { userAgent: req.headers['user-agent'], ip: req.ip });

    if (result.requiresTwoFactor) {
      return reply.send({ requiresTwoFactor: true, challengeToken: result.challengeToken });
    }
    const { user, token, refreshToken } = result;

    reply.send({
      message: "Login successful",
      user: user,
      token,
      refreshToken,
    });
  } catch (error) {
    reply.code(401).send({ message: error.message });
  }
};

const changePassword = async (req, reply) => {
  try {
    const { oldPassword, newPassword } = req.body;
    // req.user is populated by authenticate middleware (to be added in route)
    if (!req.user || !req.user.id) {
      return reply.code(401).send({ message: "Unauthorized" });
    }

    await authService.changePassword(req.user.id, oldPassword, newPassword);

    reply.send({ message: "Password updated successfully" });
  } catch (error) {
    reply.code(400).send({ message: error.message });
  }
};

const forgotPassword = async (req, reply) => {
  try {
    const { email } = req.body;
    if (!email) {
      return reply.code(400).send({ message: "Email is required" });
    }

    await authService.forgotPassword(email);

    reply.send({ message: "Email sent" });
  } catch (error) {
    reply.code(error.statusCode || 400).send({ message: error.message, code: error.code });
  }
};

const resetPassword = async (req, reply) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    if (!password || password.length < 6) {
      return reply.code(400).send({ message: "New password must be at least 6 characters" });
    }

    const { user, token: newToken, refreshToken } = await authService.resetPassword(
      token,
      password,
      { userAgent: req.headers['user-agent'], ip: req.ip },
    );

    reply.send({
      message: "Password reset successful",
      token: newToken,
      refreshToken,
      user,
    });
  } catch (error) {
    reply.code(400).send({ message: error.message });
  }
};

const googleLogin = async (req, reply) => {
  try {
    const { token: idToken } = req.body;
    if (!idToken) {
      return reply.code(400).send({ message: "Google Token is required" });
    }

    const { user, token, refreshToken } =
      await authService.googleLogin(idToken, { userAgent: req.headers['user-agent'], ip: req.ip });

    reply.send({
      message: "Google login successful",
      user,
      token,
      refreshToken,
    });
  } catch (error) {
    reply.code(400).send({ message: error.message });
  }
};

const refreshToken = async (req, reply) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return reply.code(400).send({ message: "Refresh token is required" });
    }

    const result = await authService.refreshAccessToken(refreshToken);

    reply.send({
      message: "Token refreshed successfully",
      token: result.token,
      refreshToken: result.refreshToken,
    });
  } catch (error) {
    reply.code(401).send({ message: error.message });
  }
};

const verifyTwoFactorLogin = async (req, reply) => {
  try {
    const result = await authService.completeTwoFactorLogin(
      req.body?.challengeToken,
      req.body?.code,
      { userAgent: req.headers['user-agent'], ip: req.ip },
    );
    reply.send({ message: 'Login successful', ...result });
  } catch (error) { reply.code(401).send({ message: error.message }); }
};
const beginTwoFactorSetup = async (req, reply) => {
  try { reply.send(await authService.beginTwoFactorSetup(req.user._id)); }
  catch (error) { reply.code(400).send({ message: error.message }); }
};
const confirmTwoFactorSetup = async (req, reply) => {
  try { await authService.confirmTwoFactorSetup(req.user._id, req.body?.code); reply.send({ success: true }); }
  catch (error) { reply.code(400).send({ message: error.message }); }
};
const disableTwoFactor = async (req, reply) => {
  try { await authService.disableTwoFactor(req.user._id, req.body?.password, req.body?.code); reply.send({ success: true }); }
  catch (error) { reply.code(400).send({ message: error.message }); }
};

const getSessions = async (req, reply) => {
  const sessions = await authService.listSessions(req.user._id);
  reply.send(sessions.map((session) => ({
    ...session,
    current: session.sessionId === req.userSessionId,
  })));
};
const revokeSession = async (req, reply) => {
  try { await authService.revokeSession(req.user._id, req.params.sessionId); reply.send({ success: true }); }
  catch (error) { reply.code(404).send({ message: error.message }); }
};
const logoutCurrent = async (req, reply) => {
  if (req.userSessionId) {
    await authService.revokeSession(req.user._id, req.userSessionId);
  }
  reply.send({ success: true });
};
const logoutAll = async (req, reply) => {
  await authService.revokeAllSessions(req.user._id);
  reply.send({ success: true });
};

module.exports = {
  register,
  login,
  changePassword,
  forgotPassword,
  resetPassword,
  googleLogin,
  verifyOtp,
  resendOtp,
  refreshToken,
  getSessions,
  revokeSession,
  logoutCurrent,
  logoutAll,
  verifyTwoFactorLogin,
  beginTwoFactorSetup,
  confirmTwoFactorSetup,
  disableTwoFactor,
};
