const userModel = require("../models/userModel");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

// Register Controller

const registerController = async (req, res) => {
  try {
    const { userName, email, phone, password } = req.body;

    // Validation

    if (!userName || !email || !phone || !password) {
      return res.status(500).send({
        success: false,
        message: "Please provide all fields",
      });
    }

    // Check whether already exist or Not

    const existingUser = await userModel.findOne({
      $or: [{ email }, { userName }, { phone }],
    });

    if (existingUser) {
      return res.status(500).send({
        success: false,
        message: "User already exist",
      });
    }

    // hash password

    var salt = bcrypt.genSaltSync(10);
    const hashPassword = await bcrypt.hash(password, salt);

    // create New User

    const user = await userModel.create({
      userName,
      email,
      password: hashPassword,
      phone,
    });

    res.status(200).send({
      success: true,
      message: "User Successfully Registered",
      user,
    });
  } catch (error) {
    console.error("REGISTER ERROR ", error);
    return res.status(500).send({
      success: false,
      message: "Error in Register API",
      error: error.message,
    });
  }
};

// Login Controller

const loginController = async (req, res) => {
  try {
    const { email, phone, password } = req.body;

    if ((!email && !phone) || !password) {
      return res.status(500).send({
        success: false,
        message: "All fields are required",
      });
    }

    const user = await userModel.findOne({
      $and: [{ email }, { phone }],
    });

    if (!user) {
      return res.status(500).send({
        success: false,
        message: "User Not Found",
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(500).send({
        success: false,
        message: "Incorrect Password",
      });
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    //console.log("JWT Secret being used to sign:", process.env.JWT_SECRET);

    user.password = undefined;

    res.status(200).send({
      success: true,
      message: "Successfully Login",
      token,
      user,
    });
  } catch (error) {
    console.log("Login Error:", error);
    return res.status(500).send({
      success: false,
      message: "Error in Login API",
      error: error.message,
    });
  }
};

module.exports = { registerController, loginController };
