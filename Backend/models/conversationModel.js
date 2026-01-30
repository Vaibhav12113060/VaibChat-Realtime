const mongoose = require("mongoose");

const conversationSchema = new mongoose.Schema(
  {
    chat_type: {
      type: String,
      enum: ["Personal", "Two_Way", "Group"],
      default: "Two_Way",
      required: true,
    },
    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
    ],
    lastMessage: {
      type: String,
    },
    lastMessageAt: {
      type: Date,
    },
    // Group specific fields
    groupName: {
      type: String,
    },
    groupAdmin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    groupImage: {
      type: String,
    },
    isArchived: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        archived: {
          type: Boolean,
          default: false,
        },
      },
    ],
  },
  { timestamps: true },
);

module.exports = mongoose.model("Conversation", conversationSchema);
