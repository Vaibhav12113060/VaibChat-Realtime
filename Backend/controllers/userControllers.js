const userModel = require("../models/userModel");

const getUserController = async (req, res) => {
  try {
    // const user = await userModel.findById({ _id: req.userId });
    const user = await userModel.findById(req.params.id);

    if (!user) {
      return res.status(500).send({
        success: "false",
        message: "User Not Found",
      });
    }

    user.password = undefined;

    res.status(200).send({
      success: "true",
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

module.exports = { getUserController };
