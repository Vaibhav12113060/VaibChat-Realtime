const express = require("express");
const {
  getUserController,
  getAllUserController,
  updatePasswordController,
  updateProfileController,
  delete_user_controller,
} = require("../controllers/userControllers");

const authMiddleware = require("../middlewares/authMiddleware");

const router = express.Router();

// Routes

// GET user
router.get("/getUser/:id", authMiddleware, getUserController);
router.get("/getAllUser", authMiddleware, getAllUserController);
router.put("/updatePass", authMiddleware, updatePasswordController);
router.put("/updateProfile", authMiddleware, updateProfileController);
router.delete("/deleteUser", authMiddleware, delete_user_controller);
module.exports = router;
