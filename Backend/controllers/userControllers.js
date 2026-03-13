const userModel = require("../models/userModel");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

//  Get ALl Users from the database
const getAllUserController = async (req, res) => {
  try {
    const users = await userModel.find({}).select("-password");

    if (users.length === 0) {
      return res.status(404).send({
        success: false,
        message: "No users found",
      });
    }

    res.status(200).send({
      success: true,
      message: "All users fetched successfully",
      users,
      totalCount: users.length,
    });
  } catch (error) {
    console.log("Get All User API Error: ", error);
    res.status(500).send({
      success: false,
      message: "Get All User API Error",
      error: error.message,
    });
  }
};

const getUserController = async (req, res) => {
  try {
    // const user = await userModel.findById({ _id: req.userId });

    // Validate the User ID Format
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).send({
        success: false,
        message: "Invalid User ID",
      });
    }

    const user = await userModel.findById(req.params.id);

    if (!user) {
      return res.status(404).send({
        success: false,
        message: "User Not Found",
      });
    }

    user.password = undefined;

    res.status(200).send({
      success: true,
      message: "User get Successfully",
      user,
    });
  } catch (error) {
    return res.status(500).send({
      success: false,
      message: error,
    });
  }
};

// Update password

const updatePasswordController = async (req, res) => {
  try {
    const { email, old_pass, new_pass } = req.body;

    if (!email || !old_pass || !new_pass) {
      return res.status(500).send({
        success: false,
        message: "All fields are Required",
      });
    }

    // validate user
    const user = await userModel.findOne({ email });

    if (!user) {
      return res.status(404).send({
        success: false,
        message: "Email Not Exist",
      });
    }

    // match password

    const check_pass = await bcrypt.compare(old_pass, user.password);

    if (!check_pass) {
      return res.status(401).send({
        success: false,
        message: "Password Incorrect",
      });
    }

    // hash new password & Update

    const salt = await bcrypt.genSalt(10);
    const hashPassword = await bcrypt.hash(new_pass, salt);

    user.password = hashPassword;

    await user.save();

    user.password = undefined;

    res.status(200).send({
      success: true,
      message: "password updated Successfully",
      user,
    });
  } catch (error) {
    return res.status(500).send({
      success: false,
      message: "Error in Update password API",
      error: error.message,
    });
  }
};

// Update Profile (Name, Profile Pic, Status)
const updateProfileController = async (req, res) => {
  try {
    const userId = req.user._id; // from auth middleware
    const { userName, profile, status } = req.body;

    const user = await userModel.findByIdAndUpdate(
      userId,
      {
        userName,
        profile,
        status,
      },
      { new: true },
    );

    if (!user) {
      return res.status(404).send({
        success: false,
        message: "User not found",
      });
    }

    user.password = undefined;

    res.status(200).send({
      success: true,
      message: "Profile updated successfully",
      user,
    });
  } catch (error) {
    console.log("Update Profile Error: ", error);
    res.status(500).send({
      success: false,
      message: "Error in Update Profile API",
      error: error.message,
    });
  }
};

// Delete User by Email

const delete_user_controller = async (req, res) => {
  try {
    // Assuming Auth Middleware is applied to this route
    if (!req.user || !req.user._id) {
      return res.status(401).send({
        success: false,
        message: "Unauthorized request",
      });
    }

    const userId = req.user._id;
    const user = await userModel.findById(userId);

    if (!user) {
      return res.status(404).send({
        success: false,
        message: "User not found",
      });
    }

    await userModel.findByIdAndDelete(userId);

    res.status(200).send({
      success: true,
      message: "User account deleted successfully",
    });
  } catch (error) {
    return res.status(500).send({
      success: false,
      message: "Error in Delete User API",
      error: error.message,
    });
  }
};

module.exports = {
  getAllUserController,
  getUserController,
  updatePasswordController,
  updateProfileController,
  delete_user_controller,
};

// Inside the controllers folder-
// authControllers.js contactControllers.js conversationController.js  messageControllers.js userControllers.js are there
// Look at each files , read it, and include other functions if required for this project,and some empty files are also there include all the required functions and export them.
