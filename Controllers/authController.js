const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const Customer = require("../Models/customer.model");

const registerCustomer = async (req, res, next) => {
  try {
    const {
      name,
      email,
      phone,
      password,
      gender,
      dateOfBirth,
      address,
      state,
      country,
    } = req.body;

    // Check if email already exists
    const existingEmail = await Customer.findOne({ email });

    if (existingEmail) {
      return res.status(409).json({
        success: false,
        message: "A customer with this email already exists",
      });
    }

    // Check if phone number already exists
    const existingPhone = await Customer.findOne({ phone });

    if (existingPhone) {
      return res.status(409).json({
        success: false,
        message: "A customer with this phone number already exists",
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create customer
    const customer = await Customer.create({
      name,
      email,
      phone,
      password: hashedPassword,
      gender,
      dateOfBirth,
      address,
      state,
      country: country || "Nigeria",
    });

    res.status(201).json({
      success: true,
      message: "Customer registered successfully",
      data: {
        customer: {
          id: customer._id,
          name: customer.name,
          email: customer.email,
          phone: customer.phone,
          gender: customer.gender,
          dateOfBirth: customer.dateOfBirth,
          address: customer.address,
          state: customer.state,
          country: customer.country,
          onboardingStatus: customer.onboardingStatus,
          isVerified: customer.isVerified,
          hasAccount: customer.hasAccount,
          status: customer.status,
          createdAt: customer.createdAt,
        },
      },
    });
  } catch (error) {
    // Handle duplicate MongoDB fields
    if (error.code === 11000) {
      const duplicatedField = Object.keys(error.keyPattern)[0];

      return res.status(409).json({
        success: false,
        message: `A customer with this ${duplicatedField} already exists`,
      });
    }

    // Handle Mongoose validation errors
    if (error.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: "Customer data validation failed",
        errors: Object.values(error.errors).map((err) => err.message),
      });
    }

    next(error);
  }
};

const loginCustomer = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Find customer and explicitly include the password
    const customer = await Customer.findOne({ email }).select("+password");

    if (!customer) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // Check customer account status
    if (customer.status !== "active") {
      return res.status(403).json({
        success: false,
        message: "Customer account is not active",
      });
    }

    // Compare password
    const isPasswordCorrect = await bcrypt.compare(password, customer.password);

    if (!isPasswordCorrect) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // Update last login
    customer.lastLogin = new Date();
    await customer.save();

    // Generate JWT
    const token = jwt.sign(
      {
        id: customer._id,
        email: customer.email,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "1d",
      },
    );

    res.status(200).json({
      success: true,
      message: "Login successful",
      data: {
        token,
        customer: {
          id: customer._id,
          name: customer.name,
          email: customer.email,
          phone: customer.phone,
          onboardingStatus: customer.onboardingStatus,
          isVerified: customer.isVerified,
          hasAccount: customer.hasAccount,
          status: customer.status,
          lastLogin: customer.lastLogin,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  registerCustomer,
  loginCustomer,
};
