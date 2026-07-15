const controller = require("../controllers/study-goal.controller");
const { protect } = require("../middlewares/auth.middleware");

module.exports = async (fastify) => {
  fastify.addHook("onRequest", protect);
  fastify.get("/", controller.getGoals);
  fastify.get("/active", controller.getActiveGoal);
  fastify.post("/", controller.createGoal);
  fastify.patch("/:id/complete", controller.completeGoal);
  fastify.patch("/:id", controller.updateGoal);
  fastify.delete("/:id", controller.deleteGoal);
};
