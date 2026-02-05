const conversationModel = require("../models/conversationModel");
const mongoose = require("mongoose");
const userModel = require("../models/userModel");

const createChatController = async (req, res) => {
  try {
    const senderId = req.params.id;

    /////////////////////////////////
    // Validate Sender
    /////////////////////////////////

    if (!mongoose.Types.ObjectId.isValid(senderId)) {
      return res.status(400).send({
        success: false,
        message: "Invalid sender ID",
      });
    }

    const senderExists = await userModel.exists({ _id: senderId });

    if (!senderExists) {
      return res.status(404).send({
        success: false,
        message: "Sender does not exist",
      });
    }

    let { chat_type = "Two_Way", participants = [], groupName } = req.body;

    if (!Array.isArray(participants)) {
      return res.status(400).send({
        success: false,
        message: "Participants must be an array",
      });
    }

    //////////////////////////////////////////
    // Normalize Participants
    //////////////////////////////////////////

    participants = [...new Set([...participants, senderId])]
      .map((id) => id.toString())
      .sort(); // CRITICAL

    //////////////////////////////////////////
    // Validate ObjectIds
    //////////////////////////////////////////

    const validIds = participants.every((id) =>
      mongoose.Types.ObjectId.isValid(id),
    );

    if (!validIds) {
      return res.status(400).send({
        success: false,
        message: "Invalid participant ID detected",
      });
    }

    //////////////////////////////////////////
    // Verify Users Exist (FAST VERSION)
    //////////////////////////////////////////

    const userCount = await userModel.countDocuments({
      _id: { $in: participants },
    });

    if (userCount !== participants.length) {
      return res.status(404).send({
        success: false,
        message: "One or more participants do not exist",
      });
    }

    //////////////////////////////////////////////////
    // PERSONAL CHAT
    //////////////////////////////////////////////////

    if (chat_type === "Personal") {
      participants = [senderId];
    }

    //////////////////////////////////////////////////
    // TWO WAY CHAT (ELITE DUPLICATE PROTECTION)
    //////////////////////////////////////////////////

    let conversationKey;

    if (chat_type === "Two_Way") {
      if (participants.length !== 2) {
        return res.status(400).send({
          success: false,
          message: "Two_Way chat must contain exactly 2 users",
        });
      }

      //  create deterministic unique key
      conversationKey = participants.join("_");

      const existingConversation = await conversationModel.findOne({
        conversationKey,
      });

      if (existingConversation) {
        return res.status(200).send({
          success: true,
          message: "Conversation already exists",
          conversation: existingConversation,
        });
      }
    }

    //////////////////////////////////////////////////
    // GROUP CHAT
    //////////////////////////////////////////////////

    if (chat_type === "Group") {
      if (participants.length < 3) {
        return res.status(400).send({
          success: false,
          message: "Group must have at least 3 participants",
        });
      }

      if (!groupName || !groupName.trim()) {
        return res.status(400).send({
          success: false,
          message: "Group name is required",
        });
      }
    }

    //////////////////////////////////////////////////
    // CREATE CONVERSATION
    //////////////////////////////////////////////////

    const conversation = await conversationModel.create({
      chat_type,
      participants,
      conversationKey: chat_type === "Two_Way" ? conversationKey : undefined,
      groupName: chat_type === "Group" ? groupName : undefined,
      groupAdmin: chat_type === "Group" ? senderId : undefined,
    });

    res.status(201).send({
      success: true,
      message: "Conversation created successfully",
      conversation,
    });
  } catch (error) {
    res.status(500).send({
      success: false,
      message: "Error in Create Conversation API",
      error: error.message,
    });
  }
};

module.exports = { createChatController };
