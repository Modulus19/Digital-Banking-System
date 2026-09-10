const express = require("express");
const { body } = require("express-validator");

const {
  onboardWithBvn,
  onboardWithNin,
} = require("../Controllers/onboardingController");

const protect = require("../Middleware/auth");
const validate = require("../Middleware/validation");

const router = express.Router();

// ===============================
// BVN ONBOARDING
// ===============================

router.post(
  "/bvn",
  protect,
  [
    body("bvn")
      .trim()
      .notEmpty()
      .withMessage("BVN is required")
      .isNumeric()
      .withMessage("BVN must contain only numbers")
      .isLength({ min: 11, max: 11 })
      .withMessage("BVN must be exactly 11 digits"),
  ],
  validate,
  onboardWithBvn,
);

// ===============================
// NIN ONBOARDING
// ===============================

router.post(
  "/nin",
  protect,
  [
    body("nin")
      .trim()
      .notEmpty()
      .withMessage("NIN is required")
      .isNumeric()
      .withMessage("NIN must contain only numbers")
      .isLength({ min: 11, max: 11 })
      .withMessage("NIN must be exactly 11 digits"),
  ],
  validate,
  onboardWithNin,
);

module.exports = router;
