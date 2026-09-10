const express = require("express");
const { body, param } = require("express-validator");

const {
  createAccount,
  getMyAccount,
  performNameEnquiry,
  getBalance,
  transfer,
} = require("../Controllers/accountController");

const protect = require("../Middleware/auth");
const validate = require("../Middleware/validation");

const router = express.Router();

// Create account
router.post("/create", protect, createAccount);

// Get my account
router.get("/me", protect, getMyAccount);

// Name enquiry
router.get(
  "/name-enquiry/:accountNumber",
  protect,
  [
    param("accountNumber")
      .trim()
      .isNumeric()
      .withMessage("Account number must contain only numbers")
      .isLength({ min: 10, max: 10 })
      .withMessage("Account number must be exactly 10 digits"),
  ],
  validate,
  performNameEnquiry,
);

// Get balance
router.get("/balance", protect, getBalance);

// Transfer funds
router.post(
  "/transfer",
  protect,
  [
    body("to")
      .trim()
      .notEmpty()
      .withMessage("Recipient account number is required")
      .isNumeric()
      .withMessage("Recipient account number must contain only numbers"),

    body("amount")
      .isFloat({ gt: 0 })
      .withMessage("Transfer amount must be greater than 0"),
  ],
  validate,
  transfer,
);

module.exports = router;
