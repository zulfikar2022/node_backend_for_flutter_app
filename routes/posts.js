const express = require("express");
const router = express.Router();
const { upload } = require("../middlewares/multerConfig.js");
const { extractUserId } = require("../middlewares/extractUserId.js");
const postsController = require("../controllers/postsController.js");

router.get("/", extractUserId, postsController.listPosts);

router.post(
  "/",
  extractUserId,
  upload.single("image"),
  postsController.createPost
);

router.get("/:id", postsController.getPost);
router.put("/:id", extractUserId, postsController.updatePost);
router.delete("/:id", extractUserId, postsController.deletePost);

module.exports = router;
