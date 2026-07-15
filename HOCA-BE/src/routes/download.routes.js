const downloadController = require("../controllers/download.controller");
const { protect, admin } = require("../middlewares/auth.middleware");

const downloadRoutes = async (fastify, options) => {
  // Public: Download APK (tracks analytics)
  fastify.get("/apk", downloadController.downloadApk);

  // Public: Track external download links (Cloudflare/manual share)
  fastify.get("/track", downloadController.trackExternalDownload);

  // Public: Get simple download count (no auth required)
  fastify.get("/count", downloadController.getDownloadCount);

  // Admin only: View download statistics
  fastify.get(
    "/stats",
    { preHandler: [protect, admin] },
    downloadController.getDownloadStats,
  );
};

module.exports = downloadRoutes;
