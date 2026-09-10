const mongoose = require("mongoose");

const accountSchema = new mongoose.Schema(
  {
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
      unique: true,
      index: true,
    },

    accountNumber: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    accountName: {
      type: String,
      required: true,
      trim: true,
    },

    balance: {
      type: Number,
      required: true,
      default: 15000,
      min: 0,
    },

    bankCode: {
      type: String,
      required: true,
    },

    status: {
      type: String,
      enum: ["active", "inactive", "frozen", "closed"],
      default: "active",
    },

    currency: {
      type: String,
      default: "NGN",
      uppercase: true,
    },

    openedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("Account", accountSchema);
