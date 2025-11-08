const cloudinary = require("cloudinary").v2;

function initCloudinary() {
  try {
    const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } =
      process.env;
    if (
      !CLOUDINARY_CLOUD_NAME ||
      !CLOUDINARY_API_KEY ||
      !CLOUDINARY_API_SECRET
    ) {
      console.warn("Cloudinary credentials are not fully set in env");
      return;
    }
    cloudinary.config({
      cloud_name: CLOUDINARY_CLOUD_NAME,
      api_key: CLOUDINARY_API_KEY,
      api_secret: CLOUDINARY_API_SECRET,
    });
    console.log("Cloudinary configured");
  } catch (error) {
    console.error("Error configuring Cloudinary:", error);
  }
}

module.exports = { initCloudinary, cloudinary };
