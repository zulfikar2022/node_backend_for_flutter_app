const express = require("express");
const router = express.Router();
const { extractUserId } = require("../middlewares/extractUserId.js");
const likesController = require("../controllers/likesController.js");

router.post("/:postId", extractUserId, likesController.toggleLike);
router.get("/:postId", extractUserId, likesController.listLikers);

module.exports = router;
