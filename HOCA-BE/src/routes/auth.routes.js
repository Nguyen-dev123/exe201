const authController = require("../controllers/auth.controller");
const { protect } = require("../middlewares/auth.middleware");
const { authRateLimit } = require("../config/rateLimit");

const authRoutes = async (fastify, options) => {
  // Stricter rate limit for auth endpoints
  fastify.register(async function (authRoutes) {
    authRoutes.addHook("onRequest", async (request, reply) => {
      // Apply auth rate limit
      await fastify.rateLimit(authRateLimit)(request, reply);
    });

    authRoutes.post("/register", authController.register);
    authRoutes.post("/login", authController.login);
    authRoutes.post("/verify-otp", authController.verifyOtp);
    authRoutes.post("/resend-otp", authController.resendOtp);
    authRoutes.post("/forgot-password", authController.forgotPassword);
    authRoutes.post("/reset-password/:token", authController.resetPassword);
    authRoutes.post("/google", authController.googleLogin);
  });

  // Normal rate limit for token refresh
  fastify.post("/refresh-token", authController.refreshToken);

  // Protected Routes
  fastify.post(
    "/change-password",
    { preHandler: protect },
    authController.changePassword,
  );
};

module.exports = authRoutes;
