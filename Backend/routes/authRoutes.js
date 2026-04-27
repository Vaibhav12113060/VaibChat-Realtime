const express = require("express");

const {
  registerController,
  loginController,
} = require("../controllers/authControllers");

const router = express.Router();

// Register User router

router.post("/registerUser", registerController);

// Login User

router.post("/login", loginController);
module.exports = router;
