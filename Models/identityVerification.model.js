const mongoose = require("mongoose");

const identityVerificationSchema = new mongoose.Schema(
  {
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
      unique: true,
    },

    verificationType: {
      type: String,
      enum: ["bvn", "nin"],
      required: true,
    },

    bvn: {
      type: String,
      default: null,
      select: false,
    },

    nin: {
      type: String,
      default: null,
      select: false,
    },

    dob: {
      type: Date,
      default: null,
    },

    status: {
      type: String,
      enum: ["pending", "verified", "failed"],
      default: "pending",
    },

    verificationReference: {
      type: String,
      default: null,
    },

    provider: {
      type: String,
      default: "NIBSS By Phoenix",
    },

    verifiedAt: {
      type: Date,
      default: null,
    },

    failureReason: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model(
  "IdentityVerification",
  identityVerificationSchema,
);
