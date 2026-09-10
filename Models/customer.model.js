const mongoose = require("mongoose");

const customerSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 100,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    phone: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    password: {
      type: String,
      required: true,
      minlength: 6,
      select: false,
    },

    gender: {
      type: String,
      enum: ["male", "female", "other"],
      required: true,
    },

    dateOfBirth: {
      type: Date,
      required: true,
    },

    address: {
      type: String,
      required: true,
      trim: true,
      maxlength: 250,
    },

    state: {
      type: String,
      required: true,
      trim: true,
    },

    country: {
      type: String,
      default: "Nigeria",
      trim: true,
    },

    onboardingStatus: {
      type: String,
      enum: ["pending", "verified", "failed"],
      default: "pending",
    },

    identityType: {
      type: String,
      enum: ["bvn", "nin", null],
      default: null,
    },

    isVerified: {
      type: Boolean,
      default: false,
    },

    hasAccount: {
      type: Boolean,
      default: false,
    },

    account: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Account",
      default: null,
    },

    status: {
      type: String,
      enum: ["active", "inactive", "suspended"],
      default: "active",
    },

    lastLogin: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("Customer", customerSchema);
