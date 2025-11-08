function truncateText(text, length = 100) {
  if (!text) return text;
  if (text.length <= length) return text;
  return text.slice(0, length) + "...";
}

function getPublicIdFromUrl(url) {
  if (!url) return null;
  // Cloudinary url example: https://res.cloudinary.com/<cloud>/image/upload/v12345/folder/name.jpg
  // public_id is folder/name (without extension). We try a best-effort parse.
  try {
    const parts = url.split("/");
    const uploadIndex = parts.findIndex((p) => p === "upload");
    if (uploadIndex === -1) return null;
    const publicPath = parts.slice(uploadIndex + 2).join("/");
    // remove extension
    return publicPath.replace(/\.[^/.]+$/, "");
  } catch (e) {
    return null;
  }
}

module.exports = { truncateText, getPublicIdFromUrl };
