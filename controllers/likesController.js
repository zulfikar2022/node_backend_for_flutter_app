const mongoose = require("mongoose");
const Like = require("../models/Like");
const Post = require("../models/Post");
const User = require("../models/User");

async function toggleLike(req, res, next) {
  try {
    const userId = req.authUserId || req.body?.userId;
    const { postId } = req.params;
    if (!userId)
      return res
        .status(400)
        .json({ success: false, error: { message: "userId required" } });
    if (!mongoose.Types.ObjectId.isValid(postId))
      return res
        .status(400)
        .json({ success: false, error: { message: "Invalid postId" } });

    const post = await Post.findOne({ _id: postId, isDeleted: false });
    if (!post)
      return res
        .status(404)
        .json({ success: false, error: { message: "Post not found" } });

    let like = await Like.findOne({ postId, userId }).exec();
    let liked;
    if (!like) {
      try {
        like = await Like.create({ postId, userId, isDeleted: false });
        liked = true;
      } catch (err) {
        // possible race: duplicate key -> fetch existing
        if (err.code === 11000) {
          like = await Like.findOne({ postId, userId });
        } else throw err;
      }
    } else {
      // toggle
      like.isDeleted = !like.isDeleted;
      await like.save();
      liked = !like.isDeleted;
    }

    const likeCount = await Like.countDocuments({ postId, isDeleted: false });

    res.json({ success: true, data: { liked, likeCount } });
  } catch (err) {
    next(err);
  }
}

async function listLikers(req, res, next) {
  const userId = req.authUserId || req.body?.userId;
  try {
    if (!userId)
      return res
        .status(400)
        .json({ success: false, error: { message: "userId required" } });

    const user = await User.findOne({ userId, isDeleted: false }).lean();
    if (!user)
      return res
        .status(404)
        .json({ success: false, error: { message: "User not found" } });

    const { postId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(postId))
      return res
        .status(400)
        .json({ success: false, error: { message: "Invalid postId" } });

    const likes = await Like.find({ postId, isDeleted: false }).lean();
    const userIds = likes.map((l) => l.userId);
    const users = await User.find({ userId: { $in: userIds } }).lean();
    const usersMap = new Map(users.map((u) => [u.userId, u]));

    const result = likes.map((l) => {
      const u = usersMap.get(l.userId);
      return {
        userId: l.userId,
        name: u ? u.name : null,
        imageUrl: u ? u.imageUrl : null,
      };
    });

    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

module.exports = { toggleLike, listLikers };
