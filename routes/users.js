const express = require("express");
const router = express.Router();
const { upload } = require("../middlewares/multerConfig");
const { extractUserId } = require("../middlewares/extractUserId.js");
const usersController = require("../controllers/usersController.js");

router.post("/", usersController.createUser);

router.put("/:userId", extractUserId, usersController.updateUser);

module.exports = router;
