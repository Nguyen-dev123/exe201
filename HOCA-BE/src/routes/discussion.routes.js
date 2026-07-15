const controller = require("../controllers/discussion.controller");
const { protect } = require("../middlewares/auth.middleware");

module.exports = async function discussionRoutes(fastify) {
  fastify.addHook("onRequest", protect);
  fastify.get("/:roomId", controller.getSession);
  fastify.post("/:roomId/action", controller.performAction);
  fastify.post("/:roomId/ai-summary", controller.generateAiSummary);
};
