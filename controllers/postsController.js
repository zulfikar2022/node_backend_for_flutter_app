const mongoose = require("mongoose");
const Post = require("../models/Post.js");
const Like = require("../models/Like.js");
const Comment = require("../models/Comment.js");
const User = require("../models/User.js");
const { uploadImage, deleteImage } = require("../utils/cloudinary.js");
const { truncateText } = require("../utils/helpers.js");

async function listPosts(req, res, next) {
  const userId = req?.authUserId || req.body?.userId;

  try {
    if (!userId) {
      return res.status(400).json({
        success: false,
        error: { message: "userId is required in header or body" },
      });
    }
    const user = await User.findOne({ userId, isDeleted: false }).lean();
    if (!user)
      return res
        .status(404)
        .json({ success: false, error: { message: "User not found" } });

    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.max(parseInt(req.query.limit) || 10, 1);
    const skip = (page - 1) * limit;

    const match = { isDeleted: false };

    const totalItems = await Post.countDocuments(match);

    const posts = await Post.find(match)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    // attach counts
    const postIds = posts.map((p) => p._id);

    const likesCounts = await Like.aggregate([
      { $match: { postId: { $in: postIds }, isDeleted: false } },
      { $group: { _id: "$postId", count: { $sum: 1 } } },
    ]);
    const commentsCounts = await Comment.aggregate([
      { $match: { postId: { $in: postIds }, isDeleted: false } },
      { $group: { _id: "$postId", count: { $sum: 1 } } },
    ]);

    const likesMap = new Map(likesCounts.map((l) => [String(l._id), l.count]));
    const commentsMap = new Map(
      commentsCounts.map((c) => [String(c._id), c.count])
    );

    const results = posts.map((p) => ({
      _id: p._id,
      title: p.title,
      description: truncateText(p.description, 100),
      imageUrl: p.imageUrl,
      userId: p.userId,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
      likeCount: likesMap.get(String(p._id)) || 0,
      commentCount: commentsMap.get(String(p._id)) || 0,
    }));

    res.json({
      success: true,
      data: {
        posts: results,
        page,
        limit,
        totalPages: Math.ceil(totalItems / limit),
        totalItems,
      },
    });
  } catch (err) {
    next(err);
  }
}

async function createPost(req, res, next) {
  try {
    const userId = req.authUserId || req.body?.userId;
    if (!userId)
      return res.status(400).json({
        success: false,
        error: { message: "userId is required in header or body" },
      });

    const { title, description } = req.body;
    if (!title || !description)
      return res.status(400).json({
        success: false,
        error: { message: "title and description required" },
      });

    let imageUrl = null;

    if (req.file) {
      const { path } = req.file;
      const uploaded = await uploadImage(path, "posts");
      imageUrl = uploaded.url;
    }

    const post = await Post.create({
      title,
      description,
      imageUrl,
      userId,
    });
    res.status(201).json({ success: true, data: post });
  } catch (err) {
    // handle duplicate index errors if any

    if (err.code === 11000) err.statusCode = 400;
    next(err);
  }
}

async function updatePost(req, res, next) {
  try {
    const userId = req.authUserId || req.body?.userId;
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id))
      return res
        .status(400)
        .json({ success: false, error: { message: "Invalid post id" } });

    const post = await Post.findOne({ _id: id, isDeleted: false });
    if (!post)
      return res
        .status(404)
        .json({ success: false, error: { message: "Post not found" } });
    if (!userId || post.userId !== userId)
      return res
        .status(403)
        .json({ success: false, error: { message: "Not authorized" } });

    const { title, description } = req.body;
    if (title) post.title = title;
    if (description) post.description = description;
    await post.save();

    res.json({ success: true, data: post });
  } catch (err) {
    next(err);
  }
}

async function getPost(req, res, next) {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id))
      return res
        .status(400)
        .json({ success: false, error: { message: "Invalid post id" } });

    const post = await Post.findOne({ _id: id, isDeleted: false }).lean();
    if (!post)
      return res
        .status(404)
        .json({ success: false, error: { message: "Post not found" } });

    const likeCount = await Like.countDocuments({
      postId: post._id,
      isDeleted: false,
    });
    const commentCount = await Comment.countDocuments({
      postId: post._id,
      isDeleted: false,
    });

    // optionally fetch author name
    const user = await User.findOne({ userId: post.userId }).lean();

    res.json({
      success: true,
      data: {
        ...post,
        likeCount,
        commentCount,
        author: { name: user.name, imageUrl: user.imageUrl },
      },
    });
  } catch (err) {
    next(err);
  }
}

async function deletePost(req, res, next) {
  try {
    const userId = req.authUserId || req.body?.userId;
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id))
      return res
        .status(400)
        .json({ success: false, error: { message: "Invalid post id" } });

    const post = await Post.findOne({ _id: id, isDeleted: false });
    if (!post)
      return res
        .status(404)
        .json({ success: false, error: { message: "Post not found" } });
    if (!userId || post.userId !== userId)
      return res
        .status(403)
        .json({ success: false, error: { message: "Not authorized" } });

    post.isDeleted = true;
    await post.save();

    // soft-delete likes and comments
    await Like.updateMany(
      { postId: post._id, isDeleted: false },
      { isDeleted: true }
    );
    await Comment.updateMany(
      { postId: post._id, isDeleted: false },
      { isDeleted: true }
    );

    // delete image from cloudinary if present
    // if (post.imageUrl) {
    //   try {
    //     await deleteImage(post.imagePublicId);
    //   } catch (e) {
    //     console.warn("Failed to delete image", e);
    //   }
    // }

    res.json({ success: true, message: "Post deleted" });
  } catch (err) {
    next(err);
  }
}

module.exports = { listPosts, createPost, updatePost, getPost, deletePost };
