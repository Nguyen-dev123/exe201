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

  // PayOS in-app QR flow (render QR inside our own UI)
  fastify.post(
    "/payos/create",
    { preHandler: protect },
    paymentController.createPayosQR,
  );
  fastify.get(
    "/payos/status/:orderCode",
    { preHandler: protect },
    paymentController.payosStatus,
  );
  fastify.get("/payos/public-status/:orderCode", paymentController.publicPayosStatus);
  fastify.post("/payos/webhook", paymentController.payosWebhook);
  fastify.get('/transactions/:transactionId/receipt', { preHandler: protect }, paymentController.downloadReceipt);
  fastify.post('/transactions/:transactionId/retry', { preHandler: protect }, paymentController.retryTransaction);
  fastify.post('/transactions/:transactionId/refund', { preHandler: protect }, paymentController.requestRefund);

  fastify.get(
    "/admin/pending",
    { preHandler: [protect, admin] },
    paymentController.listPendingAdminPayments,
  );
  fastify.post(
    "/admin/confirm/:txnRef",
    { preHandler: [protect, admin] },
    paymentController.confirmAdminPayment,
  );
  fastify.delete(
    "/admin/pending/:txnRef",
    { preHandler: [protect, admin] },
    paymentController.deletePendingAdminPayment,
  );
  fastify.post(
    "/admin/grant-plan",
    { preHandler: [protect, admin] },
    paymentController.grantPlanByAdmin,
  );

  // VNPay online payment gateway
  fastify.post(
    "/vnpay/create",
    { preHandler: protect },
    paymentController.createVnpay,
  );
  // Verify after redirect back (frontend-initiated, needs auth)
  fastify.post(
    "/vnpay/verify",
    { preHandler: protect },
    paymentController.verifyVnpay,
  );
  // IPN webhook: called server-to-server by VNPay -> must be PUBLIC (no auth)
  fastify.get("/vnpay/ipn", paymentController.vnpayIpn);
  fastify.post("/vnpay/ipn", paymentController.vnpayIpn);
};

module.exports = paymentRoutes;
