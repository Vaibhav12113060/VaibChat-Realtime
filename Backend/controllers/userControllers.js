const userModel = require("../models/userModel");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

//  Get ALl Users from the database
const getAllUserController = async (req, res) => {
  try {
    const user = await userModel.find({});

    if (!user || (await user).length === 0) {
      return res.status(500).send({
        success: false,
        message: "No User is there",
      });
    }

    res.status(200).send({
      success: true,
      message: "All Users Successfully fetched",
      user,
      totalCount: (await user).length,
    });
  } catch (error) {
    console.log("Get All User API Error: ", error);
    return res.status(500).send({
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
      return res.status(500).send({
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
      return res.status(500).send({
        success: false,
        message: "Email Not Exist",
      });
    }

    // match password

    const check_pass = await bcrypt.compare(old_pass, user.password);

    if (!check_pass) {
      return res.status(500).send({
        success: false,
        message: "Password Incorrect",
      });
    }

    // hash new password & Update

    var salt = bcrypt.genSaltSync(10);
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

// Delete User by Email

const delete_user_controller = async (req, res) => {
  try {
    const { email, phone } = req.body;

    if (!email || !phone) {
      return res.status(500).send({
        success: false,
        message: "All fields are required",
      });
    }

    // Validating the user

    const user = await userModel.find({
      $or: [{ email }, { phone }],
    });

    if (!user) {
      return res.status(500).send({
        success: false,
        message: "User Invalid",
      });
    }

    await userModel.findOneAndDelete({ email }, { phone });

    res.status(200).send({
      success: true,
      message: `Successfully deleted user- Email: ${email} & Phone: ${phone} !!!!`,
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
  delete_user_controller,
};
