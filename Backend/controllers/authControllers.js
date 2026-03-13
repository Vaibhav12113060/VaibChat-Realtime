const userModel = require("../models/userModel");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

// Register Controller

const registerController = async (req, res) => {
  try {
    const { userName, email, phone, password } = req.body;

    if (!userName || !email || !phone || !password) {
      return res.status(400).send({
        success: false,
        message: "Please provide all fields",
      });
    }

    const existingUser = await userModel.findOne({
      $or: [{ email }, { userName }, { phone }],
    });

    if (existingUser) {
      return res.status(409).send({
        success: false,
        message: "User already exists",
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashPassword = await bcrypt.hash(password, salt);

    const user = await userModel.create({
      userName,
      email,
      password: hashPassword,
      phone,
      role: "user", //  helpful for authorization
    });

    user.password = undefined;

    res.status(201).send({
      success: true,
      message: "User successfully registered",
      user,
    });
  } catch (error) {
    console.error("REGISTER ERROR:", error);
    res.status(500).send({
      success: false,
      message: "Error in Register API",
    });
  }
};

// Login Controller

const loginController = async (req, res) => {
  try {
    const { email, phone, password } = req.body;

    if ((!email && !phone) || !password) {
      return res.status(400).send({
        success: false,
        message: "Email/Phone and password are required",
      });
    }

    const user = await userModel.findOne({
      $or: [{ email }, { phone }],
    });

    if (!user) {
      return res.status(401).send({
        success: false,
        message: "User not found",
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).send({
        success: false,
        message: "Invalid credentials",
      });
    }

    const token = jwt.sign(
      {
        id: user._id,
        role: user.role, //  authorization
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || "2d" },
    );

    user.password = undefined;

    res.status(200).send({
      success: true,
      message: "Login successful",
      token,
      user,
    });
  } catch (error) {
    console.log("LOGIN ERROR:", error);
    res.status(500).send({
      success: false,
      message: "Error in Login API",
    });
  }
};

module.exports = { registerController, loginController };
