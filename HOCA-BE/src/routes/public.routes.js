const publicController = require("../controllers/public.controller");
const newsletterController = require("../controllers/newsletter.controller");

// Các route công khai - KHÔNG yêu cầu đăng nhập
const publicRoutes = async (fastify, options) => {
  fastify.get("/students", publicController.getFeaturedStudents);
  fastify.get("/leaderboard", publicController.getPublicLeaderboard);
  fastify.get("/students/:id", publicController.getPublicProfile);
  fastify.get("/platform-stats", publicController.getPlatformStats);
  fastify.post(
    "/newsletter/subscribe",
    {
      config: {
        rateLimit: { max: 5, timeWindow: "1 hour" },
      },
    },
    newsletterController.subscribe,
  );
};

module.exports = publicRoutes;
