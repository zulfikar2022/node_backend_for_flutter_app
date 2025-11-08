const express = require("express");
const router = express.Router();
const { extractUserId } = require("../middlewares/extractUserId.js");
const commentsController = require("../controllers/commentsController.js");

router.post("/", extractUserId, commentsController.createComment);
router.get("/:postId", extractUserId, commentsController.listCommentsByPost);
router.delete("/:id", extractUserId, commentsController.deleteComment);

module.exports = router;
