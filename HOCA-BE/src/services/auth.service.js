const User = require("../models/User");
const Notification = require("../models/Notification");
const jwt = require("jsonwebtoken");
const { JWT_SECRET, CLIENT_URL, NODE_ENV } = require("../config/env");
const { OAuth2Client } = require("google-auth-library");
const { GOOGLE_CLIENT_ID } = require("../config/env");
const client = new OAuth2Client(GOOGLE_CLIENT_ID);
const crypto = require("crypto");
const emailService = require("./email.service");
const AuthSession = require("../models/AuthSession");
const totpService = require("./totp.service");

const escapeHtml = (value) =>
  String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

const sendVerificationEmail = async (user, verificationCode) => {
  const {
    EMAIL_SERVICE_URL,
    EMAIL_SERVICE_API_KEY,
    CLIENT_URL,
  } = require("../config/env");
  const baseUrl = String(CLIENT_URL || "http://localhost:3001").replace(/\/$/, "");
  const verifyLink = `${baseUrl}/auth/verify?email=${encodeURIComponent(user.email)}&code=${verificationCode}`;

  if (EMAIL_SERVICE_URL) {
    try {
      const axios = require("axios");
      const verifyEmailUrl = EMAIL_SERVICE_URL.replace(
        "send-reset-email",
        "send-verify-email",
      );
      await axios.post(
        verifyEmailUrl,
        {
          email: user.email,
          displayName: user.displayName,
          verificationCode,
          verifyLink,
          apiKey: EMAIL_SERVICE_API_KEY,
        },
        { headers: { "Content-Type": "application/json" }, timeout: 10000 },
      );
      return true;
    } catch (error) {
      console.error("Verification microservice failed, using SMTP:", error.message);
    }
  }

  const displayName = escapeHtml(user.displayName || "bạn");
  await emailService.sendEmail({
    to: user.email,
    subject: `${verificationCode} là mã xác minh HOCA của bạn`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;color:#1f2937">
        <h2 style="color:#f97316">Xác minh tài khoản HOCA</h2>
        <p>Xin chào ${displayName},</p>
        <p>Mã xác minh của bạn là:</p>
        <p style="font-size:32px;font-weight:700;letter-spacing:8px;margin:24px 0">${verificationCode}</p>
        <p>Mã có hiệu lực trong 5 phút và chỉ sử dụng được một lần.</p>
        <p><a href="${verifyLink}" style="color:#ea580c;font-weight:700">Xác minh tài khoản</a></p>
        <p style="color:#6b7280;font-size:13px">Nếu bạn không đăng ký HOCA, hãy bỏ qua email này.</p>
      </div>
    `,
  });
  return true;
};

// Helper to create admin notification for blocked login attempts
const notifyAdminBlockedLogin = async (user) => {
  try {
    // Find all admin users
    const admins = await User.find({ role: "ADMIN" });

    // Create notification for each admin
    const notifications = admins.map((admin) => ({
      user: admin._id,
      type: "BLOCKED_LOGIN_ATTEMPT",
      title: "Blocked User Login Attempt",
      message: `Người dùng bị khóa "${user.displayName}" (${user.email}) đã cố gắng đăng nhập.`,
      icon: "block",
      data: {
        userId: user._id,
        userEmail: user.email,
        userName: user.displayName,
        lockReason: user.lockReason || "Vi phạm quy định cộng đồng",
        attemptTime: new Date(),
      },
      isAdminNotification: true,
    }));

    if (notifications.length > 0) {
      await Notification.insertMany(notifications);
    }
  } catch (err) {
    console.error("Failed to notify admins of blocked login attempt:", err);
  }
};

const signToken = (id, role, subscriptionTier, authVersion = 0, sessionId) => {
  return jwt.sign({ id, role, subscriptionTier, authVersion, sessionId }, JWT_SECRET, {
    expiresIn: "7d",
  });
};

const signRefreshToken = (id, authVersion = 0, sessionId) => {
  return jwt.sign({ id, authVersion, sessionId }, JWT_SECRET, { expiresIn: "30d" });
};

const issueSessionTokens = async (user, context = {}) => {
  const sessionId = crypto.randomUUID();
  await AuthSession.create({
    user: user._id,
    sessionId,
    userAgent: String(context.userAgent || '').slice(0, 500),
    ip: String(context.ip || '').slice(0, 100),
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  });
  return {
    token: signToken(user._id, user.role, user.subscriptionTier, user.authVersion, sessionId),
    refreshToken: signRefreshToken(user._id, user.authVersion, sessionId),
  };
};

const toRegistrationUser = (user) => ({
  id: user._id,
  email: user.email,
  displayName: user.displayName,
  accountStatus: user.accountStatus,
  role: user.role,
  subscriptionTier: user.subscriptionTier,
});

const registerUser = async (userData, context = {}) => {
  const { displayName, password } = userData;
  const email = userData.email.trim().toLowerCase();

  // Email OTP is intentionally disabled: registration activates the account immediately.
  const directExisting = await User.findOne({ email }).select("+password");
  if (directExisting) {
    const passwordMatches = Boolean(directExisting.password) &&
      (await directExisting.matchPassword(password));
    if (directExisting.accountStatus === "INACTIVE" && passwordMatches) {
      directExisting.accountStatus = "ACTIVE";
      directExisting.verificationCode = undefined;
      directExisting.verificationCodeExpires = undefined;
      directExisting.verificationCodeSentAt = undefined;
      await directExisting.save({ validateBeforeSave: false });
      const tokens = await issueSessionTokens(directExisting, context);
      return { user: toRegistrationUser(directExisting), ...tokens, message: "Registration successful." };
    }
    const existingError = new Error("Email này đã được sử dụng. Vui lòng đăng nhập.");
    existingError.statusCode = 409;
    existingError.code = "ACCOUNT_EXISTS";
    throw existingError;
  }

  const directUser = await User.create({
    displayName,
    email,
    password,
    accountStatus: "ACTIVE",
  });
  const directTokens = await issueSessionTokens(directUser, context);
  return { user: toRegistrationUser(directUser), ...directTokens, message: "Registration successful." };

  // Check if user exists
  const userExists = await User.findOne({ email }).select(
    "+password +verificationCodeSentAt",
  );
  if (userExists) {
    if (userExists.accountStatus === "INACTIVE") {
      const passwordMatches = Boolean(userExists.password) &&
        (await userExists.matchPassword(password));
      if (passwordMatches) {
        let otpSent = false;
        let developmentCode;
        try {
          const resendResult = await resendOtp(email);
          developmentCode = resendResult.developmentCode;
          otpSent = true;
        } catch (error) {
          // A recent code may still be valid. Let the user continue to the OTP
          // page, where resend remains available once the cooldown expires.
          if (error.statusCode === 429) {
            otpSent = true;
          } else {
            console.error("Could not refresh pending registration OTP:", error.message);
          }
        }

        return {
          user: toRegistrationUser(userExists),
          otpSent,
          developmentCode,
          message: "Registration is waiting for email verification.",
        };
      }
    }

    const error = new Error("Email này đã được sử dụng. Vui lòng đăng nhập.");
    error.statusCode = 409;
    error.code = "ACCOUNT_EXISTS";
    throw error;
  }

  // Generate 6-digit OTP
  const verificationCode = crypto.randomInt(100000, 1000000).toString();
  const verificationCodeExpires = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

  // Accounts must verify their email before a session can be issued.
  const user = await User.create({
    displayName,
    email,
    password,
    accountStatus: "INACTIVE",
    verificationCode,
    verificationCodeExpires,
    verificationCodeSentAt: new Date(),
    verificationAttempts: 0,
  });

  let developmentCode;
  try {
    await sendVerificationEmail(user, verificationCode);
  } catch (error) {
    console.error("Failed to send verification email:", error.message);
    // Do not start the resend cooldown when delivery failed.
    user.verificationCodeSentAt = undefined;
    await user.save({ validateBeforeSave: false });
    if (NODE_ENV === "development") {
      developmentCode = verificationCode;
    } else {
      const deliveryError = new Error(
        "Không thể gửi mã xác minh. Vui lòng thử gửi lại sau hoặc liên hệ hỗ trợ.",
      );
      deliveryError.statusCode = 503;
      deliveryError.code = "OTP_DELIVERY_FAILED";
      throw deliveryError;
    }
  }

  return {
    user: toRegistrationUser(user),
    otpSent: true,
    developmentCode,
    message: "Registration successful. Check your email for the verification code.",
  };
};

const loginUser = async ({ email, password }, context = {}) => {
  // Check user
  const user = await User.findOne({
    email: email.trim().toLowerCase(),
  }).select("+password +authVersion +twoFactorSecret");
  if (!user) {
    throw new Error("Invalid credentials");
  }

  // Check if account is verified
  if (user.accountStatus === "INACTIVE") {
    throw new Error(
      "Please verify your email before logging in. Check your inbox for the verification code.",
    );
  }

  if (user.isLocked || user.isBlocked) {
    // Notify admins about blocked user login attempt
    await notifyAdminBlockedLogin(user);
    throw new Error("User is locked");
  }

  // Check password
  const isMatch = await user.matchPassword(password);
  if (!isMatch) {
    throw new Error("Invalid credentials");
  }

  if (user.twoFactorEnabled) {
    const challengeToken = jwt.sign(
      { id: user._id, purpose: "2fa-login" },
      JWT_SECRET,
      { expiresIn: "5m" },
    );
    return { requiresTwoFactor: true, challengeToken };
  }

  const { token, refreshToken } = await issueSessionTokens(user, context);

  // Return user without password
  const userObj = user.toObject();
  delete userObj.password;

  return { user: userObj, token, refreshToken };
};

const changePassword = async (userId, oldPassword, newPassword) => {
  const user = await User.findById(userId).select("+password +authVersion");
  if (!user) {
    throw new Error("User not found");
  }

  const isMatch = await user.matchPassword(oldPassword);
  if (!isMatch) {
    throw new Error("Incorrect password");
  }

  user.password = newPassword;
  user.authVersion = (user.authVersion || 0) + 1;
  await user.save(); // triggers pre('save') hash

  return true;
};

const forgotPassword = async (email) => {
  const user = await User.findOne({ email: email.trim().toLowerCase() });
  if (!user) {
    // Do not reveal whether an email is registered.
    return true;
  }

  // Generate Reset Token
  const resetToken = crypto.randomBytes(20).toString("hex");

  // Hash and set to resetPasswordToken field
  user.resetPasswordToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  // Set expire (1 hour)
  user.resetPasswordExpire = Date.now() + 60 * 60 * 1000;

  await user.save({ validateBeforeSave: false });

  // Create reset url
  const baseUrl = CLIENT_URL.endsWith("/")
    ? CLIENT_URL.slice(0, -1)
    : CLIENT_URL;
  const resetUrl = `${baseUrl}/auth/reset-password/${resetToken}`;

  try {
    const { EMAIL_SERVICE_URL, EMAIL_SERVICE_API_KEY } = require("../config/env");
    if (EMAIL_SERVICE_URL) {
      const axios = require("axios");
      const response = await axios.post(
        EMAIL_SERVICE_URL,
        { email: user.email, resetLink: resetUrl, apiKey: EMAIL_SERVICE_API_KEY },
        { headers: { "Content-Type": "application/json" }, timeout: 10000 },
      );
      if (!response.data.success) throw new Error("Email service returned error");
    } else {
      await emailService.sendEmail({
        to: user.email,
        subject: "Đặt lại mật khẩu HOCA",
        html: `<p>Bạn đã yêu cầu đặt lại mật khẩu HOCA.</p><p><a href="${resetUrl}">Đặt lại mật khẩu</a></p><p>Liên kết có hiệu lực trong 60 phút.</p>`,
      });
    }
    return true;
  } catch (error) {
    console.error("Reset email error:", error.message);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();
    const deliveryError = new Error("Không thể gửi email đặt lại mật khẩu. Vui lòng thử lại sau.");
    deliveryError.statusCode = 503;
    deliveryError.code = "RESET_EMAIL_DELIVERY_FAILED";
    throw deliveryError;
  }

};

const completeTwoFactorLogin = async (challengeToken, code, context = {}) => {
  const decoded = jwt.verify(challengeToken, JWT_SECRET);
  if (decoded.purpose !== '2fa-login') throw new Error('Yêu cầu 2FA không hợp lệ');
  const user = await User.findById(decoded.id).select('+twoFactorSecret +authVersion');
  if (!user?.twoFactorEnabled || !user.twoFactorSecret || !totpService.verifyCode(user.twoFactorSecret, code)) {
    throw new Error('Mã xác thực hai lớp không chính xác');
  }
  const { token, refreshToken } = await issueSessionTokens(user, context);
  return { user, token, refreshToken };
};

const beginTwoFactorSetup = async (userId) => {
  const user = await User.findById(userId).select('+twoFactorPendingSecret');
  if (!user) throw new Error('User not found');
  const secret = totpService.generateSecret();
  user.twoFactorPendingSecret = secret;
  await user.save({ validateBeforeSave: false });
  return { secret, otpauthUri: `otpauth://totp/HOCA:${encodeURIComponent(user.email)}?secret=${secret}&issuer=HOCA` };
};
const confirmTwoFactorSetup = async (userId, code) => {
  const user = await User.findById(userId).select('+twoFactorPendingSecret +twoFactorSecret');
  if (!user?.twoFactorPendingSecret || !totpService.verifyCode(user.twoFactorPendingSecret, code)) throw new Error('Mã xác thực không chính xác');
  user.twoFactorSecret = user.twoFactorPendingSecret;
  user.twoFactorPendingSecret = undefined;
  user.twoFactorEnabled = true;
  await user.save({ validateBeforeSave: false });
  return true;
};
const disableTwoFactor = async (userId, password, code) => {
  const user = await User.findById(userId).select('+password +twoFactorSecret');
  if (!user || !(await user.matchPassword(password)) || !totpService.verifyCode(user.twoFactorSecret, code)) throw new Error('Mật khẩu hoặc mã 2FA không chính xác');
  user.twoFactorEnabled = false; user.twoFactorSecret = undefined; user.twoFactorPendingSecret = undefined;
  await user.save({ validateBeforeSave: false }); return true;
};

const resetPassword = async (token, newPassword, context = {}) => {
  // Get hashed token
  const resetPasswordToken = crypto
    .createHash("sha256")
    .update(token)
    .digest("hex");

  const user = await User.findOne({
    resetPasswordToken,
    resetPasswordExpire: { $gt: Date.now() },
  }).select("+authVersion");

  if (!user) {
    throw new Error("Invalid token");
  }

  // Set new password
  user.password = newPassword;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;

  await user.save();

  user.authVersion = (user.authVersion || 0) + 1;
  await user.save();
  await AuthSession.updateMany({ user: user._id, revokedAt: null }, { revokedAt: new Date() });
  const { token: newToken, refreshToken } = await issueSessionTokens(user, context);
  return { token: newToken, refreshToken, user };
};

const googleLogin = async (token, context = {}) => {
  let googleId, email, name, picture, emailVerified;

  try {
    // Try verify as ID Token
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    googleId = payload.sub;
    email = payload.email;
    name = payload.name;
    picture = payload.picture;
    emailVerified = payload.email_verified;
  } catch (error) {
    console.log("[Google Auth] ID Token verify failed:", error.message);
    // If fails, try as Access Token
    try {
      // Create a new client instance to avoid state pollution/race conditions
      const requestClient = new OAuth2Client(GOOGLE_CLIENT_ID);
      requestClient.setCredentials({ access_token: token });

      const response = await requestClient.request({
        url: "https://www.googleapis.com/oauth2/v3/userinfo",
      });
      const data = response.data;
      googleId = data.sub;
      email = data.email;
      name = data.name;
      picture = data.picture;
      emailVerified = data.email_verified;
    } catch (err) {
      console.error("[Google Auth] Access Token verify failed:", err);
      throw new Error("Invalid Google Token: " + err.message);
    }
  }

  if (!email || emailVerified !== true) {
    const verificationError = new Error("Tài khoản Google chưa xác minh email");
    verificationError.statusCode = 401;
    throw verificationError;
  }
  email = email.trim().toLowerCase();

  // Check if user exists
  let user = await User.findOne({ email }).select("+authVersion");

  if (user) {
    // If user exists but no googleId (registered via email/password), link it
    if (!user.googleId) {
      user.googleId = googleId;
      if (!user.avatar) user.avatar = picture;
    }
    if (user.accountStatus === "INACTIVE") user.accountStatus = "ACTIVE";
    user.verificationCode = undefined;
    user.verificationCodeExpires = undefined;
    user.verificationCodeSentAt = undefined;
    user.verificationAttempts = 0;
    await user.save({ validateBeforeSave: false });
  } else {
    // Create new user
    const isNewUser = true;
    user = await User.create({
      displayName: name,
      email,
      googleId,
      avatar: picture,
      accountStatus: "ACTIVE",
      // Random password for google users
      password: crypto.randomBytes(16).toString("hex"),
    });

    // Send welcome email for new Google users (non-blocking)
    if (isNewUser) {
      try {
        const axios = require("axios");
        const {
          EMAIL_SERVICE_URL,
          EMAIL_SERVICE_API_KEY,
        } = require("../config/env");

        const welcomeUrl = EMAIL_SERVICE_URL?.replace(
          "send-reset-email",
          "send-welcome-email",
        );

        if (welcomeUrl) axios
          .post(
            welcomeUrl,
            {
              email: user.email,
              displayName: user.displayName,
              apiKey: EMAIL_SERVICE_API_KEY,
            },
            {
              headers: { "Content-Type": "application/json" },
              timeout: 10000,
            },
          )
          .catch((error) => {
            console.error(
              "Failed to send welcome email (Google):",
              error.message,
            );
          });
      } catch (error) {
        console.error("Welcome email error (Google):", error.message);
      }
    }
  }

  if (user.isLocked || user.isBlocked) {
    // Notify admins about blocked user login attempt
    await notifyAdminBlockedLogin(user);
    throw new Error("User is locked");
  }

  const { token: tokenJWT, refreshToken } = await issueSessionTokens(user, context);
  return { user, token: tokenJWT, refreshToken };
};

/**
 * Verify OTP code and activate account
 */
const verifyOtp = async (email, code, context = {}) => {
  const normalizedEmail = email.trim().toLowerCase();
  const normalizedCode = String(code).trim();
  const user = await User.findOne({ email: normalizedEmail }).select(
    "+verificationCode +verificationCodeExpires +verificationAttempts",
  );

  if (!user) {
    throw new Error("User not found");
  }

  if (user.accountStatus === "ACTIVE") {
    throw new Error("Account is already verified");
  }

  if ((user.verificationAttempts || 0) >= 5) {
    throw new Error("Too many incorrect attempts. Please request a new code.");
  }

  // Check if code matches and not expired.
  const storedCode = String(user.verificationCode || "");
  const codesMatch =
    storedCode.length === normalizedCode.length &&
    storedCode.length > 0 &&
    crypto.timingSafeEqual(Buffer.from(storedCode), Buffer.from(normalizedCode));
  if (!codesMatch) {
    user.verificationAttempts = (user.verificationAttempts || 0) + 1;
    await user.save({ validateBeforeSave: false });
    throw new Error("Invalid verification code");
  }

  if (new Date() > user.verificationCodeExpires) {
    throw new Error("Verification code has expired. Please request a new one.");
  }

  // Activate account
  user.accountStatus = "ACTIVE";
  user.verificationCode = undefined;
  user.verificationCodeExpires = undefined;
  user.verificationCodeSentAt = undefined;
  user.verificationAttempts = 0;
  await user.save();

  // Generate token for auto-login
  const { token, refreshToken } = await issueSessionTokens(user, context);

  // Send welcome email after successful verification
  try {
    const axios = require("axios");
    const {
      EMAIL_SERVICE_URL,
      EMAIL_SERVICE_API_KEY,
    } = require("../config/env");

    const welcomeUrl = EMAIL_SERVICE_URL.replace(
      "send-reset-email",
      "send-welcome-email",
    );

    axios
      .post(
        welcomeUrl,
        {
          email: user.email,
          displayName: user.displayName,
          apiKey: EMAIL_SERVICE_API_KEY,
        },
        {
          headers: { "Content-Type": "application/json" },
          timeout: 10000,
        },
      )
      .catch((error) => {
        console.error("Failed to send welcome email:", error.message);
      });
  } catch (error) {
    console.error("Welcome email error:", error.message);
  }

  return { user, token, refreshToken };
};

/**
 * Resend verification OTP
 */
const resendOtp = async (email) => {
  const normalizedEmail = email.trim().toLowerCase();
  const user = await User.findOne({ email: normalizedEmail }).select(
    "+verificationCode +verificationCodeSentAt",
  );

  if (!user) {
    throw new Error("User not found");
  }

  if (user.accountStatus === "ACTIVE") {
    throw new Error("Account is already verified");
  }

  const resendCooldownMs = 60 * 1000;
  const elapsedMs = user.verificationCodeSentAt
    ? Date.now() - new Date(user.verificationCodeSentAt).getTime()
    : resendCooldownMs;
  if (elapsedMs < resendCooldownMs) {
    const retryAfterSeconds = Math.ceil((resendCooldownMs - elapsedMs) / 1000);
    if (NODE_ENV === "development" && user.verificationCode) {
      return {
        message: "SMTP chưa gửi được. Sử dụng mã phát triển để tiếp tục.",
        developmentCode: user.verificationCode,
        emailDelivered: false,
        retryAfterSeconds,
      };
    }
    const error = new Error(
      `Please wait ${retryAfterSeconds} seconds before requesting another code.`,
    );
    error.statusCode = 429;
    throw error;
  }

  // Generate new 6-digit OTP
  const verificationCode = crypto.randomInt(100000, 1000000).toString();
  const verificationCodeExpires = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

  user.verificationCode = verificationCode;
  user.verificationCodeExpires = verificationCodeExpires;
  user.verificationCodeSentAt = new Date();
  user.verificationAttempts = 0;
  await user.save();

  try {
    await sendVerificationEmail(user, verificationCode);
    return {
      message: "Verification code sent. Check your email.",
      emailDelivered: true,
    };
  } catch (error) {
    console.error("Resend verification email error:", error.message);
    // Delivery failed, so the next retry must not be blocked by cooldown.
    user.verificationCodeSentAt = undefined;
    await user.save({ validateBeforeSave: false });
    if (NODE_ENV === "development") {
      return {
        message: "SMTP chưa gửi được. Sử dụng mã phát triển để tiếp tục.",
        developmentCode: verificationCode,
        emailDelivered: false,
      };
    }
    throw new Error("Không thể gửi email xác minh. Vui lòng kiểm tra cấu hình email.");
  }
};

/**
 * Refresh access token using refresh token
 */
const refreshAccessToken = async (refreshToken) => {
  try {
    // Verify refresh token
    const decoded = jwt.verify(refreshToken, JWT_SECRET);

    // Get user
    const user = await User.findById(decoded.id).select("+authVersion");
    if (!user) {
      throw new Error("User not found");
    }
    if (user.accountStatus !== "ACTIVE" || user.isLocked || user.isBlocked) {
      throw new Error("Account is not allowed to refresh this session");
    }
    if (Number(decoded.authVersion || 0) !== Number(user.authVersion || 0)) {
      throw new Error("Session has been revoked");
    }
    const session = await AuthSession.findOne({
      user: user._id,
      sessionId: decoded.sessionId,
      revokedAt: null,
      expiresAt: { $gt: new Date() },
    });
    if (!session) throw new Error("Session has been revoked");
    session.lastUsedAt = new Date();
    await session.save();

    if (user.isLocked || user.isBlocked) {
      throw new Error("User is locked");
    }

    // Generate new tokens
    const newToken = signToken(user._id, user.role, user.subscriptionTier, user.authVersion, session.sessionId);
    const newRefreshToken = signRefreshToken(user._id, user.authVersion, session.sessionId);

    return { token: newToken, refreshToken: newRefreshToken };
  } catch (error) {
    throw new Error("Invalid or expired refresh token");
  }
};

const listSessions = (userId) => AuthSession.find({ user: userId, revokedAt: null, expiresAt: { $gt: new Date() } })
  .select('sessionId userAgent ip lastUsedAt createdAt').sort('-lastUsedAt').lean();
const revokeSession = async (userId, sessionId) => {
  const result = await AuthSession.updateOne({ user: userId, sessionId, revokedAt: null }, { revokedAt: new Date() });
  if (!result.modifiedCount) throw new Error('Không tìm thấy phiên đăng nhập');
  return true;
};
const revokeAllSessions = async (userId) => {
  await Promise.all([
    AuthSession.updateMany({ user: userId, revokedAt: null }, { revokedAt: new Date() }),
    User.updateOne({ _id: userId }, { $inc: { authVersion: 1 } }),
  ]);
  return true;
};

module.exports = {
  registerUser,
  loginUser,
  changePassword,
  forgotPassword,
  resetPassword,
  googleLogin,
  verifyOtp,
  resendOtp,
  refreshAccessToken,
  listSessions,
  revokeSession,
  revokeAllSessions,
  completeTwoFactorLogin,
  beginTwoFactorSetup,
  confirmTwoFactorSetup,
  disableTwoFactor,
};
