const express = require("express");
const {
  createChatController,
} = require("../controllers/conversationControllers");
const router = express.Router();

// Routes

router.post("/:id/createChat", createChatController);

module.exports = router;
