const roomController = require("../controllers/room.controller");
const { protect } = require("../middlewares/auth.middleware");
const extras = require('../controllers/room-extra.controller');

const roomRoutes = async (fastify, options) => {
  fastify.addHook("onRequest", protect);

  fastify.get("/", roomController.getRooms);
  fastify.post("/", roomController.createRoom);
  fastify.get("/categories", roomController.getCategories); // Public categories for users
  fastify.get("/my", roomController.getMyRooms); // My created rooms
  fastify.get("/check-eligibility", roomController.checkJoinEligibility); // Check before joining
  fastify.get(
    "/check-create-eligibility",
    roomController.checkCreateEligibility,
  ); // Check before creating
  fastify.get("/room-types", roomController.getAvailableRoomTypes); // Get available room types based on tier
  fastify.get('/invitations', extras.invitations);
  fastify.patch('/invitations/:inviteId', extras.respondInvite);
  fastify.get('/recent', extras.recent);
  fastify.get('/history', extras.history);
  fastify.get('/favorites', extras.favorites);
  fastify.post('/:id/invites', extras.invite);
  fastify.post('/:id/favorite', extras.favorite);
  fastify.delete('/:id/favorite', extras.unfavorite);
  fastify.get('/:id/export', extras.exportRoom);
  fastify.post('/:id/rating', extras.rate);
  fastify.get("/:id", roomController.getRoom);
  fastify.get("/:id/mic-permission", roomController.checkMicPermission); // Check mic permission in room
  fastify.post("/:id/join", roomController.joinRoom);
  fastify.post("/:id/leave", roomController.leaveRoom);
  fastify.post("/:id/close", roomController.closeRoom); // Owner closes their room
  fastify.delete("/:id", roomController.deleteRoom); // Delete room (owner or admin only)
};

module.exports = roomRoutes;
