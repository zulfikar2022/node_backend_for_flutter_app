const User = require("../models/User.js");
const { uploadImage, deleteImage } = require("../utils/cloudinary.js");
const { getPublicIdFromUrl } = require("../utils/helpers.js");

async function createUser(req, res, next) {
  try {
    const { userId, name, email, imageUrl } = req.body;
    // chekck if the user with userId already exists
    const existingUser = await User.findOne({ userId, isDeleted: false });
    if (existingUser) {
      return res
        .status(400)
        .json({ success: true, data: "user exists", message: "user exists" });
    }

    // let user = new User.create({ userId, name, email, imageUrl });
    let user = new User({ userId, name, email, imageUrl });
    user = await user.save();
    res.status(201).json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
}

async function updateUser(req, res, next) {
  try {
    const authUserId = req.authUserId;
    const { userId } = req.params;
    if (!authUserId || authUserId !== userId)
      return res
        .status(403)
        .json({ success: false, error: { message: "Not authorized" } });

    const { name, imageChanged } = req.body;

    const user = await User.findOne({ userId, isDeleted: false });
    if (!user)
      return res
        .status(404)
        .json({ success: false, error: { message: "User not found" } });

    if (name) user.name = name;

    if (imageChanged === "true" || imageChanged === true) {
      // if image provided, delete old and upload new
      if (req.file) {
        // delete old
        if (user.imagePublicId) {
          try {
            await deleteImage(user.imagePublicId);
          } catch (e) {
            console.warn("Failed to delete old image", e);
          }
        } else if (user.imageUrl) {
          const pid = getPublicIdFromUrl(user.imageUrl);
          if (pid)
            try {
              await deleteImage(pid);
            } catch (e) {
              console.warn("Failed to delete old image by parsed id", e);
            }
        }

        // upload new
        const uploaded = await uploadImage(req.file.path, "users");
        user.imageUrl = uploaded.url;
        user.imagePublicId = uploaded.public_id;
      }
    }

    await user.save();
    res.json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
}

module.exports = { updateUser, createUser };
