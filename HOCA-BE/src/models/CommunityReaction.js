const mongoose = require("mongoose");

const communityReactionSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    key: { type: String, required: true, default: "community_hearts" },
  },
  { timestamps: true },
);

communityReactionSchema.index({ user: 1, key: 1 }, { unique: true });

module.exports = mongoose.model("CommunityReaction", communityReactionSchema);
