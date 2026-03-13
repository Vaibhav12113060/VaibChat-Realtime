// const mongoose = require("mongoose");

// //////////////////////////////////////////////////////
// // PARTICIPANT SUB-SCHEMA
// //////////////////////////////////////////////////////

// const participantSchema = new mongoose.Schema(
//   {
//     userId: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "User",
//       required: true,
//     },

//     role: {
//       type: String,
//       enum: ["owner", "admin", "member"],
//       default: "member",
//     },

//     archived: {
//       type: Boolean,
//       default: false,
//     },

//     deleted: {
//       type: Boolean,
//       default: false, // delete-for-me
//     },
//   },
//   { _id: false },
// );

// //////////////////////////////////////////////////////
// // CONVERSATION SCHEMA
// //////////////////////////////////////////////////////

// const conversationSchema = new mongoose.Schema(
//   {
//     type: {
//       type: String,
//       enum: ["direct", "group"],
//       default: "direct",
//       required: true,
//     },

//     participants: {
//       type: [participantSchema],
//       required: true,

//       validate: [
//         {
//           // Only ONE owner for GROUP chats
//           validator: function (participants) {
//             if (this.type !== "group") return true;

//             const owners = participants.filter((p) => p.role === "owner");

//             return owners.length === 1;
//           },
//           message: "A group must have exactly one owner.",
//         },

//         {
//           // Minimum participants
//           validator: function (participants) {
//             return participants.length >= 2;
//           },
//           message: "Conversation must have at least 2 participants.",
//         },
//       ],
//     },

//     //////////////////////////////////////////////////
//     // DIRECT CHAT ONLY
//     //////////////////////////////////////////////////

//     conversationKey: {
//       type: String,
//       unique: true,
//       sparse: true, // only for direct chats
//     },

//     //////////////////////////////////////////////////
//     // LAST MESSAGE (REFERENCE)
//     //////////////////////////////////////////////////

//     lastMessage: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "Message",
//     },

//     lastMessageAt: {
//       type: Date,
//       index: true,
//     },

//     //////////////////////////////////////////////////
//     // GROUP-ONLY METADATA
//     //////////////////////////////////////////////////

//     groupName: {
//       type: String,
//       trim: true,
//       required: function () {
//         return this.type === "group";
//       },
//     },

//     groupDescription: {
//       type: String,
//       trim: true,
//       default: "",
//     },

//     groupProfile: {
//       type: String, // image URL
//       default: "",
//     },
//   },
//   { timestamps: true },
// );

// //////////////////////////////////////////////////////
// // INDEXES (PERFORMANCE CRITICAL)
// //////////////////////////////////////////////////////

// // Fast lookup for user's conversations
// conversationSchema.index({ "participants.userId": 1 });

// // Sort by recent activity
// conversationSchema.index({ lastMessageAt: -1 });

// //////////////////////////////////////////////////////

// module.exports = mongoose.model("Conversation", conversationSchema);

const mongoose = require("mongoose");

//////////////////////////////////////////////////////
// PARTICIPANT SUB-SCHEMA
//////////////////////////////////////////////////////

const participantSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Role ONLY matters in GROUPS
    role: {
      type: String,
      enum: ["owner", "admin", "member"],
      default: "member",
    },

    archived: {
      type: Boolean,
      default: false,
    },

    deleted: {
      type: Boolean,
      default: false, // delete-for-me
    },

    // ⭐ VERY IMPORTANT (future unread system)
    lastSeenMessage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Message",
      default: null,
    },
  },
  { _id: false },
);

//////////////////////////////////////////////////////
// CONVERSATION SCHEMA
//////////////////////////////////////////////////////

const conversationSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["direct", "group"],
      default: "direct",
      required: true,
    },

    participants: {
      type: [participantSchema],
      required: true,

      validate: [
        {
          // ONLY ONE OWNER (GROUP ONLY)
          validator: function (participants) {
            if (this.type !== "group") return true;

            const owners = participants.filter((p) => p.role === "owner");

            return owners.length === 1;
          },
          message: "A group must have exactly one owner.",
        },

        {
          // Minimum users
          validator: function (participants) {
            return participants.length >= 2;
          },
          message: "Conversation must have at least 2 participants.",
        },
      ],
    },

    //////////////////////////////////////////////////
    // DIRECT CHAT ONLY
    //////////////////////////////////////////////////

    conversationKey: {
      type: String, // ⚠️ Index defined below
    },

    //////////////////////////////////////////////////
    // LAST MESSAGE
    //////////////////////////////////////////////////

    lastMessage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Message",
    },

    lastMessageAt: {
      type: Date,
      default: Date.now,
      index: true,
    },

    //////////////////////////////////////////////////
    // GROUP METADATA
    //////////////////////////////////////////////////

    groupName: {
      type: String,
      trim: true,
      required: function () {
        return this.type === "group";
      },
    },

    groupDescription: {
      type: String,
      trim: true,
      default: "",
    },

    groupProfile: {
      type: String, // image URL
      default: "",
    },
  },
  { timestamps: true },
);

//////////////////////////////////////////////////////
// INDEXES (PRODUCTION LEVEL)
//////////////////////////////////////////////////////

// 🔥 Prevent duplicate direct chats
conversationSchema.index(
  { conversationKey: 1 },
  { unique: true, sparse: true },
);

// 🔥 Fast user conversation lookup
conversationSchema.index({ "participants.userId": 1 });

// 🔥 Sort by recent chats
conversationSchema.index({ lastMessageAt: -1 });

//////////////////////////////////////////////////////

module.exports = mongoose.model("Conversation", conversationSchema);
