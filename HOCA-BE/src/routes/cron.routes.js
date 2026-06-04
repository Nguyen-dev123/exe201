const cronController = require("../controllers/cron.controller");

const cronRoutes = async (fastify, options) => {
  // Manual triggers for external cron services (e.g., cron-job.org)
  // Protected by CRON_SECRET in controller
  fastify.get("/cleanup", cronController.runCleanup);
  fastify.get("/streak-maintenance", cronController.runStreakMaintenance);
  fastify.get("/room-maintenance", cronController.runRoomMaintenance);
  fastify.get("/fix-rooms-public", cronController.fixRoomsPublic);
  fastify.get("/check-rooms-ownership", cronController.checkRoomsOwnership);
  fastify.get("/list-all-rooms", cronController.listAllRooms);
};

module.exports = cronRoutes;
