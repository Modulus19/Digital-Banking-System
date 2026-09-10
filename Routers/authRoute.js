const express = require("express");
const { body } = require("express-validator");

const {
  registerCustomer,
  loginCustomer,
} = require("../Controllers/authController");

const validate = require("../Middleware/validation");

const router = express.Router();

router.post(
  "/register",

  [
    body("name")
      .trim()
      .notEmpty()
      .withMessage("Name is required")
      .isLength({ min: 2, max: 100 })
      .withMessage("Name must be between 2 and 100 characters"),

    body("email")
      .trim()
      .isEmail()
      .withMessage("Please provide a valid email")
      .normalizeEmail(),

    body("phone").trim().notEmpty().withMessage("Phone number is required"),

    body("password")
      .isLength({ min: 6 })
      .withMessage("Password must be at least 6 characters"),

    body("gender")
      .isIn(["male", "female", "other"])
      .withMessage("Gender must be male, female, or other"),

    body("dateOfBirth")
      .isISO8601()
      .withMessage("Please provide a valid date of birth"),

    body("address")
      .trim()
      .notEmpty()
      .withMessage("Address is required")
      .isLength({ max: 250 })
      .withMessage("Address cannot exceed 250 characters"),

    body("state").trim().notEmpty().withMessage("State is required"),

    body("country")
      .optional()
      .trim()
      .notEmpty()
      .withMessage("Country cannot be empty"),
  ],

  validate,

  registerCustomer,
);

router.post(
  "/login",

  [
    body("email")
      .trim()
      .isEmail()
      .withMessage("Please provide a valid email")
      .normalizeEmail(),

    body("password").notEmpty().withMessage("Password is required"),
  ],

  validate,

  loginCustomer,
);

module.exports = router;
