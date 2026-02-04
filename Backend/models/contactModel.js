const mongoose = require("mongoose");

const contactSchema = new mongoose.Schema(
  {
    ownerUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true, //  fast lookup by owner
    },

    contactUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    nickname: {
      type: String,
      trim: true,
    },

    isBlocked: {
      type: Boolean,
      default: false,
    },

    isMuted: {
      type: Boolean,
      default: false,
    },

    addedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true },
);

contactSchema.index({ ownerUserId: 1, contactUserId: 1 }, { unique: true });

contactSchema.index({ nickname: "text" });

module.exports = mongoose.model("Contact", contactSchema);
