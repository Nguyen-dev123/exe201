const PricingPlan = require("../models/PricingPlan");

const createPlan = async (req, reply) => {
  try {
    const plan = await PricingPlan.create(req.body);
    reply.code(201).send(plan);
  } catch (error) {
    reply.code(400).send({ message: error.message });
  }
};

const getPlans = async (req, reply) => {
  try {
    // Admins see all, users check IsActive in frontend or query param?
    // Let's just return all for now, maybe filter in query
    const plans = await PricingPlan.find(req.query);
    reply.send(plans);
  } catch (error) {
    reply.code(500).send({ message: error.message });
  }
};

const updatePlan = async (req, reply) => {
  try {
    const plan = await PricingPlan.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    reply.send(plan);
  } catch (error) {
    reply.code(400).send({ message: error.message });
  }
};

const deletePlan = async (req, reply) => {
  try {
    await PricingPlan.findByIdAndDelete(req.params.id);
    reply.send({ message: "Deleted" });
  } catch (error) {
    reply.code(400).send({ message: error.message });
  }
};

// Quick update pricing for Yearly and Lifetime plans
const quickUpdatePrices = async (req, reply) => {
  try {
    // Update Yearly plan to 500,000 VND
    const yearlyUpdate = await PricingPlan.findOneAndUpdate(
      { tier: "YEARLY" },
      {
        price: 500000,
        name: "Gói Năm Premium",
        description: "Tiết kiệm 16% so với gói tháng",
        durationDays: 365,
        isActive: true,
      },
      { new: true },
    );

    // Update Lifetime plan to 999,000 VND
    const lifetimeUpdate = await PricingPlan.findOneAndUpdate(
      { tier: "LIFETIME" },
      {
        price: 999000,
        name: "Gói vĩnh viễn",
        description: "Truy cập đầy đủ tính năng vĩnh viễn",
        durationDays: -1,
        isActive: true,
      },
      { new: true },
    );

    // Get all plans to show results
    const allPlans = await PricingPlan.find().sort({ price: 1 });

    reply.send({
      message: "Đã cập nhật giá thành công",
      updated: {
        yearly: yearlyUpdate,
        lifetime: lifetimeUpdate,
      },
      allPlans,
    });
  } catch (error) {
    reply.code(500).send({ message: error.message });
  }
};

// Seed initial pricing plans (PUBLIC - for development only)
const seedPlans = async (req, reply) => {
  try {
    const plans = [
      {
        name: "Gói Tháng Premium",
        description: "Truy cập đầy đủ tính năng trong 30 ngày",
        price: 99000,
        tier: "MONTHLY",
        durationDays: 30,
        isActive: true,
        features: [
          "Màn hình ảo",
          "Phòng học không giới hạn",
          "Sticker độc quyền",
          "Chất lượng HD",
          "Huy hiệu độc quyền",
        ],
      },
      {
        name: "Gói Năm Premium",
        description: "Tiết kiệm 16% so với gói tháng",
        price: 500000,
        tier: "YEARLY",
        durationDays: 365,
        isActive: true,
        features: [
          "Màn hình ảo",
          "Phòng học không giới hạn",
          "Sticker độc quyền",
          "Chất lượng HD",
          "Huy hiệu độc quyền",
        ],
      },
      {
        name: "Gói vĩnh viễn",
        description: "Truy cập đầy đủ tính năng vĩnh viễn",
        price: 999000,
        tier: "LIFETIME",
        durationDays: -1,
        isActive: true,
        features: [
          "Màn hình ảo",
          "Phòng học không giới hạn",
          "Sticker độc quyền",
          "Chất lượng HD",
          "Huy hiệu độc quyền",
        ],
      },
    ];

    // Delete existing plans
    await PricingPlan.deleteMany({});

    // Create new plans
    const created = await PricingPlan.insertMany(plans);

    reply.send({
      message: "Seed thành công!",
      count: created.length,
      plans: created,
    });
  } catch (error) {
    reply.code(500).send({ message: error.message });
  }
};

module.exports = {
  createPlan,
  getPlans,
  updatePlan,
  deletePlan,
  quickUpdatePrices,
  seedPlans,
};
