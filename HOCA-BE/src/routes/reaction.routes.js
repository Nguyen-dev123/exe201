const reactionController = require("../controllers/reaction.controller");
const { protect } = require("../middlewares/auth.middleware");

const reactionRoutes = async (fastify, options) => {
  // Public: anyone can view and add hearts
  fastify.get("/community-hearts", reactionController.getHearts);
  const mutationOptions = {
    preHandler: [protect],
    config: { rateLimit: { max: 10, timeWindow: "1 minute" } },
  };
  fastify.post("/community-hearts", mutationOptions, reactionController.addHeart);
  fastify.delete("/community-hearts", mutationOptions, reactionController.removeHeart);
};

module.exports = reactionRoutes;
