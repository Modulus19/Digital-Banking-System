# Digital Banking System

A backend digital banking system built with Node.js, Express.js, MongoDB, and NIBSS By Phoenix APIs.

The system supports customer registration, authentication, BVN/NIN verification, account creation, account prefunding, balance enquiry, name enquiry, intra-bank transfers, inter-bank transfer integration, transaction status, and transaction history.

---

## Features

- Customer registration
- Customer login
- JWT authentication
- Password hashing with bcrypt
- BVN verification through NIBSS By Phoenix
- NIN verification through NIBSS By Phoenix
- KYC verification before account creation
- One account per customer
- Automatic ₦15,000 account prefunding
- Account balance enquiry
- Account name enquiry
- Intra-bank transfers
- Inter-bank transfer integration through NIBSS
- Transaction status
- Transaction history
- Customer transaction data isolation
- Request validation
- Centralized error handling
- Secure HTTP headers with Helmet
- CORS support
- Environment variable configuration

---

## Technologies Used

- Node.js
- Express.js
- MongoDB
- Mongoose
- JWT
- bcryptjs
- Axios
- Express Validator
- Helmet
- Morgan
- CORS
- NIBSS By Phoenix API

---

## Project Structure

```text
Digital Banking System/
│
├── Config/
│   ├── database.js
│   └── nibss.js
│
├── Controllers/
│   ├── authController.js
│   ├── onboardingController.js
│   ├── accountController.js
│   └── transactionController.js
│
├── Middleware/
│   ├── auth.js
│   ├── validation.js
│   └── errorHandler.js
│
├── Models/
│   ├── customer.model.js
│   ├── identityVerification.model.js
│   ├── account.model.js
│   └── transaction.model.js
│
├── Routers/
│   ├── authRoute.js
│   ├── onboardingRoute.js
│   ├── accountRoute.js
│   └── transactionRoute.js
│
├── Services/
│   └── nibssService.js
│
├── .env
├── .env.example
├── .gitignore
├── app.js
├── package.json
└── README.md


## Live API

https://digital-banking-system-gg1d.onrender.com
```
