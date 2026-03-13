const messageModel = require("../models/messageModel");
const conversationModel = require("../models/conversationModel");
const mongoose = require("mongoose");
const cloudinary = require("../config/cloudinaryConfig");
const { Readable } = require("stream");

// Send Message
const sendMessageController = async (req, res) => {
  try {
    const senderId = req.user._id; // Assumes auth middleware
    const { conversationId, content, messageType, replyTo } = req.body;

    if (!conversationId || !content) {
      return res.status(400).send({
        success: false,
        message: "Conversation ID and content are required",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(conversationId)) {
      return res.status(400).send({
        success: false,
        message: "Invalid Conversation ID",
      });
    }

    // Security: Check if user is participant before sending
    const conversation = await conversationModel.findById(conversationId);
    if (!conversation) {
      return res.status(404).send({
        success: false,
        message: "Conversation not found",
      });
    }

    const isParticipant = conversation.participants.some(
      (p) => p.userId.toString() === senderId.toString(),
    );

    if (!isParticipant) {
      return res.status(403).send({
        success: false,
        message: "You are not a participant of this conversation",
      });
    }

    const newMessage = await messageModel.create({
      senderId,
      conversationId,
      content,
      messageType: messageType || "text",
      replyTo: replyTo || null,
    });

    // Update conversation lastMessage & lastMessageAt
    await conversationModel.findByIdAndUpdate(conversationId, {
      lastMessage: newMessage._id,
      lastMessageAt: newMessage.createdAt,
    });

    // Populate sender info for immediate frontend display
    const populatedMessage = await newMessage.populate(
      "senderId",
      "userName email profile",
    );

    res.status(201).send({
      success: true,
      message: "Message sent successfully",
      data: populatedMessage,
    });
  } catch (error) {
    console.error("SEND MESSAGE ERROR:", error);
    res.status(500).send({
      success: false,
      message: "Error in Send Message API",
      error: error.message,
    });
  }
};

// Get Messages for Conversation
const getMessagesController = async (req, res) => {
  try {
    const conversationId = req.params.id;
    const userId = req.user._id;
    // Pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    if (!mongoose.Types.ObjectId.isValid(conversationId)) {
      return res.status(400).send({
        success: false,
        message: "Invalid Conversation ID",
      });
    }

    // Security: Check if user is participant
    const conversation = await conversationModel.findById(conversationId);
    if (!conversation) {
      return res
        .status(404)
        .send({ success: false, message: "Conversation not found" });
    }

    const isParticipant = conversation.participants.some(
      (p) => p.userId.toString() === userId.toString(),
    );
    if (!isParticipant) {
      return res
        .status(403)
        .send({ success: false, message: "You are not a participant" });
    }

    // Fetch messages
    // Assuming 'deletedFor' is a field in messageModel for soft deletes (optional logic)
    const messages = await messageModel
      .find({
        conversationId,
        // deletedFor: { $ne: userId }, // Uncomment if messageModel supports soft delete per user
      })
      .sort({ createdAt: -1 }) // Get newest first
      .skip(skip)
      .limit(limit)
      .populate("senderId", "userName profile")
      .populate("replyTo", "content senderId");

    // Reverse to display oldest -> newest on frontend if needed, or handle there
    res.status(200).send({
      success: true,
      message: "Messages fetched successfully",
      data: messages.reverse(),
      pagination: {
        page,
        limit,
        hasMore: messages.length === limit,
      },
    });
  } catch (error) {
    console.error("GET MESSAGES ERROR:", error);
    res.status(500).send({
      success: false,
      message: "Error in Get Messages API",
      error: error.message,
    });
  }
};

// Upload Attachment (Image/Video/File)
const uploadAttachmentController = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).send({
        success: false,
        message: "No file uploaded",
      });
    }

    // Stream upload to Cloudinary
    const streamUpload = (buffer) => {
      return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { resource_type: "auto", folder: "chat_app_uploads" },
          (error, result) => {
            if (result) resolve(result);
            else reject(error);
          },
        );
        Readable.from(buffer).pipe(stream);
      });
    };

    const result = await streamUpload(req.file.buffer);

    res.status(200).send({
      success: true,
      message: "File uploaded successfully",
      url: result.secure_url,
      type: result.resource_type, // 'image', 'video', 'raw'
    });
  } catch (error) {
    console.error("UPLOAD ERROR:", error);
    res
      .status(500)
      .send({
        success: false,
        message: "File upload failed",
        error: error.message,
      });
  }
};

module.exports = {
  sendMessageController,
  getMessagesController,
  uploadAttachmentController,
};
