const { cloudinary } = require("../config/cloudinary.js");
const path = require("path");
const fs = require("fs");

async function uploadImage(filePath, folder = "flutter_story_images") {
  try {
    const res = await cloudinary.uploader.upload(filePath, { folder });
    // remove local file if exists
    try {
      fs.unlinkSync(filePath);
    } catch (e) {
      /* ignore */
    }
    return { url: res.secure_url, public_id: res.public_id };
  } catch (err) {
    // remove local file if exists
    try {
      fs.unlinkSync(filePath);
    } catch (e) {
      /* ignore */
    }
    throw err;
  }
}

async function deleteImage(publicId) {
  if (!publicId) return null;
  try {
    const res = await cloudinary.uploader.destroy(publicId);
    return res;
  } catch (err) {
    throw err;
  }
}

module.exports = { uploadImage, deleteImage };
