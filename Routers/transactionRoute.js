const express = require("express");

const {
  getTransactionStatus,
  getTransactionHistory,
} = require("../Controllers/transactionController");

const protect = require("../Middleware/auth");

const router = express.Router();

router.get("/history", protect, getTransactionHistory);

router.get("/:ref", protect, getTransactionStatus);

module.exports = router;
