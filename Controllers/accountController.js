const Customer = require("../Models/customer.model");
const Account = require("../Models/account.model");
const Transaction = require("../Models/transaction.model");

const {
  generateNibssToken,
  nameEnquiry,
  getAccountBalance,
  transferFunds,
} = require("../Services/nibssService");

// Generate a unique 10-digit account number
const generateAccountNumber = async () => {
  let accountNumber;
  let existingAccount;

  do {
    accountNumber = Math.floor(
      1000000000 + Math.random() * 9000000000,
    ).toString();

    existingAccount = await Account.findOne({ accountNumber });
  } while (existingAccount);

  return accountNumber;
};

// ===============================
// CREATE ACCOUNT
// ===============================

const createAccount = async (req, res, next) => {
  try {
    const customer = await Customer.findById(req.user.id);

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    // Customer must complete onboarding first
    if (!customer.isVerified) {
      return res.status(403).json({
        success: false,
        message:
          "You must complete BVN or NIN verification before creating an account",
      });
    }

    // Customer can only have one account
    if (customer.hasAccount || customer.account) {
      return res.status(409).json({
        success: false,
        message: "Customer already has an account",
      });
    }

    // Extra database check
    const existingCustomerAccount = await Account.findOne({
      customer: customer._id,
    });

    if (existingCustomerAccount) {
      return res.status(409).json({
        success: false,
        message: "Customer already has an account",
      });
    }

    const accountNumber = await generateAccountNumber();

    const account = await Account.create({
      customer: customer._id,
      accountNumber,
      accountName: customer.name,
      balance: 15000,
      bankCode: process.env.NIBSS_BANK_CODE,
      status: "active",
      currency: "NGN",
    });

    // Create the initial ₦15,000 funding transaction
    const prefundingTransaction = await Transaction.create({
      customer: customer._id,
      reference: `PREFUND-${Date.now()}`,
      type: "prefunding",
      amount: 15000,
      senderAccount: "SYSTEM",
      senderName: customer.name,
      senderBankCode: process.env.NIBSS_BANK_CODE,
      recipientAccount: account.accountNumber,
      recipientName: account.accountName,
      recipientBankCode: process.env.NIBSS_BANK_CODE,
      narration: "Initial account prefunding",
      status: "successful",
      provider: "Digital Banking System",
      completedAt: new Date(),
    });

    // Update customer
    customer.hasAccount = true;
    customer.account = account._id;

    await customer.save();

    return res.status(201).json({
      success: true,
      message: "Account created successfully",
      data: {
        account: {
          id: account._id,
          accountNumber: account.accountNumber,
          accountName: account.accountName,
          balance: account.balance,
          bankCode: account.bankCode,
          currency: account.currency,
          status: account.status,
          openedAt: account.openedAt,
        },
        prefunding: {
          reference: prefundingTransaction.reference,
          amount: prefundingTransaction.amount,
          status: prefundingTransaction.status,
        },
      },
    });
  } catch (error) {
    console.error("Account creation error:", error);

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Account already exists",
      });
    }

    next(error);
  }
};

// ===============================
// GET MY ACCOUNT
// ===============================

const getMyAccount = async (req, res, next) => {
  try {
    const customer = await Customer.findById(req.user.id);

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    const account = await Account.findOne({
      customer: customer._id,
    });

    if (!account) {
      return res.status(404).json({
        success: false,
        message: "Account not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Account retrieved successfully",
      data: {
        account: {
          id: account._id,
          accountNumber: account.accountNumber,
          accountName: account.accountName,
          balance: account.balance,
          bankCode: account.bankCode,
          currency: account.currency,
          status: account.status,
          openedAt: account.openedAt,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// ===============================
// NAME ENQUIRY
// ===============================

const performNameEnquiry = async (req, res, next) => {
  try {
    const { accountNumber } = req.params;

    // Check that the account number exists locally
    const account = await Account.findOne({ accountNumber });

    if (account) {
      return res.status(200).json({
        success: true,
        message: "Name enquiry successful",
        data: {
          accountNumber: account.accountNumber,
          accountName: account.accountName,
          bankCode: account.bankCode,
        },
      });
    }

    // If it is not our local account, ask NIBSS
    const nibssResponse = await generateNibssToken();
    const token = nibssResponse.token;

    const enquiryResponse = await nameEnquiry(accountNumber, token);

    return res.status(200).json({
      success: true,
      message: "Name enquiry successful",
      data: enquiryResponse,
    });
  } catch (error) {
    console.error("Name enquiry error:", error.response?.data || error.message);

    if (error.response) {
      return res.status(error.response.status || 400).json({
        success: false,
        message: error.response.data?.message || "Name enquiry failed",
        error: error.response.data || null,
      });
    }

    next(error);
  }
};

// ===============================
// GET ACCOUNT BALANCE
// ===============================

const getBalance = async (req, res, next) => {
  try {
    const customer = await Customer.findById(req.user.id);

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    const account = await Account.findOne({
      customer: customer._id,
    });

    if (!account) {
      return res.status(404).json({
        success: false,
        message: "Account not found",
      });
    }

    // Our locally-created account
    return res.status(200).json({
      success: true,
      message: "Account balance retrieved successfully",
      data: {
        accountNumber: account.accountNumber,
        accountName: account.accountName,
        balance: account.balance,
        currency: account.currency,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ===============================
// TRANSFER FUNDS
// ===============================

const transfer = async (req, res, next) => {
  try {
    const customer = await Customer.findById(req.user.id);

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    const senderAccount = await Account.findOne({
      customer: customer._id,
    });

    if (!senderAccount) {
      return res.status(404).json({
        success: false,
        message: "Sender account not found",
      });
    }

    const { to } = req.body;
    const amount = Number(req.body.amount);

    // Check balance
    if (senderAccount.balance < amount) {
      return res.status(400).json({
        success: false,
        message: "Insufficient account balance",
      });
    }

    // Check if recipient is one of our local accounts
    const recipientAccount = await Account.findOne({
      accountNumber: to,
    });

    // ===============================
    // INTRA-BANK TRANSFER
    // ===============================

    if (recipientAccount) {
      if (recipientAccount._id.equals(senderAccount._id)) {
        return res.status(400).json({
          success: false,
          message: "You cannot transfer money to your own account",
        });
      }

      const reference = `TRX-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

      senderAccount.balance -= amount;
      recipientAccount.balance += amount;

      await senderAccount.save();
      await recipientAccount.save();

      const transaction = await Transaction.create({
        customer: customer._id,
        reference,
        type: "intra-bank-transfer",
        amount,
        senderAccount: senderAccount.accountNumber,
        senderName: senderAccount.accountName,
        senderBankCode: senderAccount.bankCode,
        recipientAccount: recipientAccount.accountNumber,
        recipientName: recipientAccount.accountName,
        recipientBankCode: recipientAccount.bankCode,
        narration: "Intra-bank transfer",
        status: "successful",
        provider: "Digital Banking System",
        completedAt: new Date(),
      });

      return res.status(200).json({
        success: true,
        message: "Intra-bank transfer successful",
        data: {
          reference: transaction.reference,
          amount: transaction.amount,
          senderAccount: transaction.senderAccount,
          recipientAccount: transaction.recipientAccount,
          recipientName: transaction.recipientName,
          status: transaction.status,
          remainingBalance: senderAccount.balance,
        },
      });
    }

    // ===============================
    // INTER-BANK TRANSFER
    // ===============================

    const nibssResponse = await generateNibssToken();
    const token = nibssResponse.token;

    const nibssTransferResponse = await transferFunds(
      {
        from: senderAccount.accountNumber,
        to,
        amount,
      },
      token,
    );

    const reference =
      nibssTransferResponse?.reference ||
      nibssTransferResponse?.transactionReference ||
      `TRX-${Date.now()}`;

    const transaction = await Transaction.create({
      customer: customer._id,
      reference,
      type: "inter-bank-transfer",
      amount,
      senderAccount: senderAccount.accountNumber,
      senderName: senderAccount.accountName,
      senderBankCode: senderAccount.bankCode,
      recipientAccount: to,
      recipientName: null,
      recipientBankCode: null,
      narration: "Inter-bank transfer",
      status: "successful",
      provider: "NIBSS By Phoenix",
      providerReference: reference,
      completedAt: new Date(),
    });

    senderAccount.balance -= amount;
    await senderAccount.save();

    return res.status(200).json({
      success: true,
      message: "Inter-bank transfer successful",
      data: {
        reference: transaction.reference,
        amount: transaction.amount,
        senderAccount: transaction.senderAccount,
        recipientAccount: transaction.recipientAccount,
        status: transaction.status,
        remainingBalance: senderAccount.balance,
        providerResponse: nibssTransferResponse,
      },
    });
  } catch (error) {
    console.error("Transfer error:", error.response?.data || error.message);

    if (error.response) {
      return res.status(error.response.status || 400).json({
        success: false,
        message: error.response.data?.message || "Transfer failed",
        error: error.response.data || null,
      });
    }

    next(error);
  }
};

module.exports = {
  createAccount,
  getMyAccount,
  performNameEnquiry,
  getBalance,
  transfer,
};
