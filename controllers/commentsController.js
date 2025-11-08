const mongoose = require("mongoose");
const Comment = require("../models/Comment");
const Post = require("../models/Post");
const User = require("../models/User");

async function createComment(req, res, next) {
  try {
    const userId = req.authUserId || req.body?.userId;
    const { comment, postId } = req.body;
    if (!userId)
      return res
        .status(400)
        .json({ success: false, error: { message: "userId required" } });
    if (!comment || !postId)
      return res.status(400).json({
        success: false,
        error: { message: "comment and postId required" },
      });
    if (!mongoose.Types.ObjectId.isValid(postId))
      return res
        .status(400)
        .json({ success: false, error: { message: "Invalid postId" } });

    const post = await Post.findOne({ _id: postId, isDeleted: false });
    if (!post)
      return res
        .status(404)
        .json({ success: false, error: { message: "Post not found" } });

    const created = await Comment.create({ comment, postId, userId });
    res.status(201).json({ success: true, data: created });
  } catch (err) {
    next(err);
  }
}

async function listCommentsByPost(req, res, next) {
  const userId = req.authUserId || req.body?.userId;
  try {
    if (!userId) {
      return res
        .status(400)
        .json({ success: false, error: { message: "userId required" } });
    }
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

    const comments = await Comment.find({ postId, isDeleted: false })
      .sort({ createdAt: -1 })
      .lean();

    // populate user basic info
    const userIds = Array.from(new Set(comments.map((c) => c.userId)));
    const users = await User.find({ userId: { $in: userIds } }).lean();
    const usersMap = new Map(
      users.map((u) => [u.userId, { name: u.name, imageUrl: u.imageUrl }])
    );

    const results = comments.map((c) => ({
      _id: c._id,
      comment: c.comment,
      postId: c.postId,
      userId: c.userId,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
      user: usersMap.get(c.userId) || null,
    }));

    res.json({ success: true, data: results });
  } catch (err) {
    next(err);
  }
}

async function deleteComment(req, res, next) {
  try {
    const userId = req.authUserId || req.body?.userId;
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id))
      return res
        .status(400)
        .json({ success: false, error: { message: "Invalid comment id" } });

    const comment = await Comment.findOne({ _id: id, isDeleted: false });
    if (!comment)
      return res
        .status(404)
        .json({ success: false, error: { message: "Comment not found" } });
    if (!userId || comment.userId !== userId)
      return res
        .status(403)
        .json({ success: false, error: { message: "Not authorized" } });

    comment.isDeleted = true;
    await comment.save();

    res.json({ success: true, message: "Comment deleted" });
  } catch (err) {
    next(err);
  }
}

module.exports = { createComment, listCommentsByPost, deleteComment };
