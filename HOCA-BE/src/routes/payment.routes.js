const paymentController = require("../controllers/payment.controller");
const { protect, admin } = require("../middlewares/auth.middleware");

const paymentRoutes = async (fastify, options) => {
  fastify.post(
    "/create_payment_url",
    { preHandler: protect },
    paymentController.createPayment,
  );
  // Endpoint to verify payment after PayOS redirect
  fastify.post(
    "/verify",
    { preHandler: protect },
    paymentController.verifyPayment,
  );
  fastify.get(
    "/transactions",
    { preHandler: protect },
    paymentController.getMyTransactions,
  );

  // Bank QR (manual transfer) flow
  fastify.post(
    "/qr/create",
    { preHandler: protect },
    paymentController.createQR,
  );
  fastify.get(
    "/qr/status/:memo",
    { preHandler: protect },
    paymentController.qrStatus,
  );

  // Admin: confirm bank transfers
  fastify.get(
    "/admin/pending",
    { preHandler: [protect, admin] },
    paymentController.listPending,
  );
  fastify.post(
    "/admin/confirm",
    { preHandler: [protect, admin] },
    paymentController.confirmPayment,
  );
};

module.exports = paymentRoutes;
