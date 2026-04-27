const express = require("express");
const {
  sendMessageController,
  getMessagesController,
  uploadAttachmentController,
  markMessagesAsReadController,
} = require("../controllers/messageControllers");
const authMiddleware = require("../middlewares/authMiddleware");
const upload = require("../middlewares/uploadMiddleware");

const router = express.Router();

router.use(authMiddleware);

router.post("/send", sendMessageController);
router.post("/upload", upload.single("file"), uploadAttachmentController);
router.put("/read", markMessagesAsReadController);
router.get("/:id", getMessagesController);

module.exports = router;
