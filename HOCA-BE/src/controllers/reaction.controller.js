const SystemConfig = require("../models/SystemConfig");
const CommunityReaction = require("../models/CommunityReaction");

const HEARTS_KEY = "community_hearts";

// GET /api/reactions/community-hearts -> { count }
const getHearts = async (req, reply) => {
  try {
    const count = await SystemConfig.getValue(HEARTS_KEY, 0);
    reply.send({ count: Number(count) || 0 });
  } catch (error) {
    reply.code(500).send({ message: error.message });
  }
};

const updateHeartCount = async (delta, reply) => {
  try {
    // The atomic pipeline prevents simultaneous clicks from overwriting each other.
    const config = await SystemConfig.findOneAndUpdate(
      { key: HEARTS_KEY },
      [
        {
          $set: {
            key: HEARTS_KEY,
            value: {
              $max: [
                0,
                {
                  $add: [
                    {
                      $convert: {
                        input: "$value",
                        to: "double",
                        onError: 0,
                        onNull: 0,
                      },
                    },
                    delta,
                  ],
                },
              ],
            },
            description:
              "Tổng số lượt cùng cam kết Quy tắc cộng đồng HOCA",
          },
        },
      ],
      { upsert: true, new: true },
    );

    reply.send({ count: Number(config.value) || 0 });
  } catch (error) {
    reply.code(500).send({ message: error.message });
  }
};

// POST /api/reactions/community-hearts -> { count }
const addHeart = async (req, reply) => {
  try {
    const result = await CommunityReaction.updateOne(
      { user: req.user._id, key: HEARTS_KEY },
      { $setOnInsert: { user: req.user._id, key: HEARTS_KEY } },
      { upsert: true },
    );
    if (result.upsertedCount === 0) {
      const count = await SystemConfig.getValue(HEARTS_KEY, 0);
      return reply.send({ count: Number(count) || 0, reacted: true });
    }
    return updateHeartCount(1, reply);
  } catch (error) {
    return reply.code(500).send({ message: "Không thể cập nhật lượt thích" });
  }
};

// DELETE /api/reactions/community-hearts -> { count }
const removeHeart = async (req, reply) => {
  try {
    const result = await CommunityReaction.deleteOne({ user: req.user._id, key: HEARTS_KEY });
    if (!result.deletedCount) {
      const count = await SystemConfig.getValue(HEARTS_KEY, 0);
      return reply.send({ count: Number(count) || 0, reacted: false });
    }
    return updateHeartCount(-1, reply);
  } catch (error) {
    return reply.code(500).send({ message: "Không thể cập nhật lượt thích" });
  }
};

module.exports = { getHearts, addHeart, removeHeart };
