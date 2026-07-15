const PricingPlan = require("../models/PricingPlan");
const { logAdminAction } = require("../services/admin-audit.service");

const createPlan = async (req, reply) => {
  try {
    const plan = await PricingPlan.create(req.body);
    await logAdminAction(req, "CREATE_PRICING_PLAN", {
      targetType: "PRICING_PLAN",
      targetId: plan._id,
      targetLabel: plan.name,
      metadata: { tier: plan.tier, price: plan.price },
    });
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
    if (!plan) return reply.code(404).send({ message: "Plan not found" });
    await logAdminAction(req, "UPDATE_PRICING_PLAN", {
      targetType: "PRICING_PLAN",
      targetId: plan._id,
      targetLabel: plan.name,
      metadata: { tier: plan.tier, price: plan.price, isActive: plan.isActive },
    });
    reply.send(plan);
  } catch (error) {
    reply.code(400).send({ message: error.message });
  }
};

const deletePlan = async (req, reply) => {
  try {
    const plan = await PricingPlan.findByIdAndDelete(req.params.id);
    if (!plan) return reply.code(404).send({ message: "Plan not found" });
    await logAdminAction(req, "DELETE_PRICING_PLAN", {
      targetType: "PRICING_PLAN",
      targetId: plan._id,
      targetLabel: plan.name,
    });
    reply.send({ message: "Deleted" });
  } catch (error) {
    reply.code(400).send({ message: error.message });
  }
};

// Quick update pricing for Yearly and Lifetime plans
const quickUpdatePrices = async (req, reply) => {
  try {
    // Update Yearly plan to 599,000 VND
    const yearlyUpdate = await PricingPlan.findOneAndUpdate(
      { tier: "YEARLY" },
      {
        price: 599000,
        name: "HOCA+ Năm",
        description: "Học lâu dài, tiết kiệm 37% và không giới hạn phòng",
        durationDays: 365,
        isActive: true,
        features: [
          "Toàn bộ quyền lợi của HOCA+ Tháng",
          "Tạo phòng không giới hạn mỗi ngày",
          "Phòng học & Smart Discussion không giới hạn thời lượng",
          "Tải nền ảo cá nhân của riêng bạn",
          "Lưu bảng chung, quiz, tài liệu & nhiệm vụ",
          "AI tổng kết & flashcard cho mọi buổi thảo luận",
          "Hiệu lực liên tục trong 365 ngày",
        ],
      },
      { new: true },
    );

    // Update Lifetime plan to 1,499,000 VND
    const lifetimeUpdate = await PricingPlan.findOneAndUpdate(
      { tier: "LIFETIME" },
      {
        price: 1499000,
        name: "HOCA+ Vĩnh viễn",
        description: "Thanh toán một lần, sử dụng HOCA+ trọn đời",
        durationDays: -1,
        isActive: true,
        features: [
          "Toàn bộ quyền lợi của HOCA+ Năm",
          "Học & tạo phòng không giới hạn trọn đời",
          "Smart Discussion, quiz & AI Thư ký trọn đời",
          "Tải tài liệu & nền ảo cá nhân",
          "Không gia hạn, không phát sinh phí hằng năm",
          "Nhận các nâng cấp mới của HOCA+ trong tương lai",
          "Gói không bao giờ hết hạn",
        ],
      },
      { new: true },
    );

    // Get all plans to show results
    const allPlans = await PricingPlan.find().sort({ price: 1 });

    await logAdminAction(req, "QUICK_UPDATE_PRICING", {
      targetType: "PRICING_PLAN",
      targetLabel: "YEARLY, LIFETIME",
    });

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

// Seed initial pricing plans (Admin only, protected in pricing routes)
const seedPlans = async (req, reply) => {
  try {
    const plans = [
      {
        name: "HOCA+ Tháng",
        description: "Trọn bộ công cụ học nhóm trong 30 ngày",
        price: 79000,
        tier: "MONTHLY",
        durationDays: 30,
        isActive: true,
        features: [
          "Toàn bộ quyền lợi gói Free",
          "Học không giới hạn thời gian, không quảng cáo",
          "Tạo phòng không giới hạn mỗi ngày, không giới hạn thời lượng",
          "Tạo HOCA Smart Discussion & dùng mic thảo luận",
          "Giơ tay, điều phối phát biểu & đồng chủ phòng",
          "Bảng cộng tác, tài liệu, nhiệm vụ & quiz trực tiếp",
          "AI Thư ký, tổng kết & flashcard",
          "Nền ảo có sẵn, tải nền riêng & mật khẩu bảo vệ phòng",
        ],
      },
      {
        name: "HOCA+ Năm",
        description: "Học lâu dài, tiết kiệm 37% và không giới hạn phòng",
        price: 599000,
        tier: "YEARLY",
        durationDays: 365,
        isActive: true,
        features: [
          "Toàn bộ quyền lợi của HOCA+ Tháng",
          "Tạo phòng không giới hạn mỗi ngày",
          "Phòng học & Smart Discussion không giới hạn thời lượng",
          "Lưu bảng chung, quiz, tài liệu & nhiệm vụ",
          "AI tổng kết & flashcard cho mọi buổi thảo luận",
          "Hiệu lực liên tục trong 365 ngày",
        ],
      },
      {
        name: "HOCA+ Vĩnh viễn",
        description: "Thanh toán một lần, sử dụng HOCA+ trọn đời",
        price: 1499000,
        tier: "LIFETIME",
        durationDays: -1,
        isActive: true,
        features: [
          "Toàn bộ quyền lợi của HOCA+ Năm",
          "Học & tạo phòng không giới hạn trọn đời",
          "Smart Discussion, quiz & AI Thư ký trọn đời",
          "Tải tài liệu & nền ảo cá nhân",
          "Không gia hạn, không phát sinh phí hằng năm",
          "Nhận các nâng cấp mới của HOCA+ trong tương lai",
          "Gói không bao giờ hết hạn",
        ],
      },
    ];

    // Delete existing plans
    await PricingPlan.deleteMany({});

    // Create new plans
    const created = await PricingPlan.insertMany(plans);

    await logAdminAction(req, "RESEED_PRICING_PLANS", {
      targetType: "PRICING_PLAN",
      targetLabel: `${created.length} plans`,
      metadata: { count: created.length },
    });

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
