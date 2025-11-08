const mongoose = require("mongoose");

const LikeSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, index: true },
    postId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "Post",
      index: true,
    },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

LikeSchema.index({ userId: 1, postId: 1 }, { unique: true });

module.exports = mongoose.model("Like", LikeSchema);
