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

    //  prevents duplicate 2-way chats forever
    conversationKey: {
      type: String,
      sparse: true, // only applies to Two_Way
      unique: true,
    },

    lastMessage: String,
    lastMessageAt: Date,

    groupName: {
      type: String,
      trim: true,
    },

    groupAdmin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    groupImage: String,

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

//////////////////////////////////////////////////////
// SAFE INDEXES
//////////////////////////////////////////////////////

// fast user conversation fetch
conversationSchema.index({ participants: 1 });

// sort by recent chats
conversationSchema.index({ lastMessageAt: -1 });

// DO NOT create unique index on participants!

module.exports = mongoose.model("Conversation", conversationSchema);
