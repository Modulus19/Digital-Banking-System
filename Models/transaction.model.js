const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema(
  {
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
      index: true,
    },

    reference: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    type: {
      type: String,
      enum: ["prefunding", "intra-bank-transfer", "inter-bank-transfer"],
      required: true,
    },

    amount: {
      type: Number,
      required: true,
      min: 1,
    },

    senderAccount: {
      type: String,
      required: true,
    },

    senderName: {
      type: String,
      default: null,
    },

    senderBankCode: {
      type: String,
      default: null,
    },

    recipientAccount: {
      type: String,
      required: true,
    },

    recipientName: {
      type: String,
      default: null,
    },

    recipientBankCode: {
      type: String,
      default: null,
    },

    narration: {
      type: String,
      default: "",
      maxlength: 200,
    },

    status: {
      type: String,
      enum: ["pending", "successful", "failed"],
      default: "pending",
    },

    providerReference: {
      type: String,
      default: null,
    },

    provider: {
      type: String,
      default: "NIBSS By Phoenix",
    },

    failureReason: {
      type: String,
      default: null,
    },

    completedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("Transaction", transactionSchema);
