const NewsletterSubscriber = require("../models/NewsletterSubscriber");

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const subscribe = async (req, reply) => {
  try {
    const email = String(req.body?.email || "")
      .trim()
      .toLowerCase();

    // Honeypot field. Bots get a neutral response without creating a record.
    if (req.body?.website) {
      return reply.code(200).send({
        success: true,
        message: "Đã đăng ký nhận cập nhật từ HOCA.",
      });
    }

    if (!email || email.length > 254 || !EMAIL_PATTERN.test(email)) {
      return reply.code(400).send({ message: "Email không hợp lệ." });
    }

    await NewsletterSubscriber.findOneAndUpdate(
      { email },
      {
        $set: {
          status: "ACTIVE",
          source: "footer",
          subscribedAt: new Date(),
          unsubscribedAt: null,
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );

    return reply.code(200).send({
      success: true,
      message: "Đã đăng ký nhận cập nhật từ HOCA.",
    });
  } catch (error) {
    req.log.error(error);
    return reply.code(500).send({
      message: "Chưa thể đăng ký lúc này. Vui lòng thử lại sau.",
    });
  }
};

module.exports = { subscribe };
