const express = require("express");
const {
  userController,
  getUserController,
  getAllUserController,
  updatePasswordController,
  delete_user_controller,
} = require("../controllers/userControllers");

const router = express.Router();

// Routes

// GET user
router.get("/getUser/:id", getUserController);
router.get("/getAllUser", getAllUserController);
router.put("/updatePass", updatePasswordController);
router.delete("/deleteUser", delete_user_controller);
module.exports = router;
