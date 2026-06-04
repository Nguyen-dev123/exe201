const pricingController = require("../controllers/pricing.controller");
const { protect, admin } = require("../middlewares/auth.middleware");

const pricingRoutes = async (fastify, options) => {
  // Public
  fastify.get("/", pricingController.getPlans);

  // Public seed endpoint (for development)
  fastify.post("/seed", pricingController.seedPlans);

  // Admin Only
  fastify.register(async (adminRoutes) => {
    adminRoutes.addHook("onRequest", protect);
    adminRoutes.addHook("onRequest", admin);

    adminRoutes.post("/", pricingController.createPlan);
    adminRoutes.put("/:id", pricingController.updatePlan);
    adminRoutes.delete("/:id", pricingController.deletePlan);

    // Quick update endpoint for Yearly and Lifetime plans
    adminRoutes.post("/quick-update", pricingController.quickUpdatePrices);
  });
};

module.exports = pricingRoutes;
