const express = require("express");
const {
  userController,
  getUserController,
} = require("../controllers/userControllers");

const router = express.Router();

// Routes

// GET user
router.get("/getUser", getUserController);

module.exports = router;
