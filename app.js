require("dotenv").config();

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");

const connectDB = require("./Config/database");
const errorHandler = require("./Middleware/errorHandler");
const authRoute = require("./Routers/authRoute");
const onboardingRoute = require("./Routers/onboardingRoute");
const accountRoute = require("./Routers/accountRoute");
const transactionRoute = require("./Routers/transactionRoute");
const protect = require("./Middleware/auth");

const app = express();

// Connect to database
connectDB();

// Security middleware
app.use(helmet());
app.use(cors());

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// HTTP request logging
app.use(morgan("dev"));

// Health check
app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Digital Banking System API is running",
  });
});

// Authentication routes
app.use("/api/auth", authRoute);

app.use("/api/onboarding", onboardingRoute);

app.use("/api/account", accountRoute);

app.use("/api/transactions", transactionRoute);

app.get("/api/auth/test", protect, (req, res) => {
  res.status(200).json({
    success: true,
    message: "Authentication middleware is working",
    user: req.user,
  });
});

// Global error handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
