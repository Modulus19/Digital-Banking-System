const Customer = require("../Models/customer.model");
const Account = require("../Models/account.model");
const Transaction = require("../Models/transaction.model");
const IdentityVerification = require("../Models/identityVerification.model");

const {
  generateNibssToken,
  createNibssAccount,
  nameEnquiry,
  getAccountBalance,
  transferFunds,
} = require("../Services/nibssService");

// ======================================================
// CREATE ACCOUNT
// ======================================================

const createAccount = async (req, res) => {
  try {
    const customer = await Customer.findById(req.user.id);

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    // Customer must be verified before account creation
    if (!customer.isVerified) {
      return res.status(400).json({
        success: false,
        message:
          "Customer must complete identity verification before opening an account",
      });
    }

    // Only one account per customer
    const existingAccount = await Account.findOne({
      customerId: customer._id,
    });

    if (existingAccount) {
      return res.status(400).json({
        success: false,
        message: "Customer already has an account",
        data: {
          account: {
            accountNumber: existingAccount.accountNumber,
            accountName: existingAccount.accountName,
            balance: existingAccount.balance,
          },
        },
      });
    }

    // Find successful identity verification
    const verification = await IdentityVerification.findOne({
      customerId: customer._id,
      status: "verified",
    }).sort({ createdAt: -1 });

    if (!verification) {
      return res.status(400).json({
        success: false,
        message: "No successful identity verification found",
      });
    }

    const kycType = verification.identityType;
    const kycID = verification.identityNumber;

    if (!kycType || !kycID) {
      return res.status(400).json({
        success: false,
        message: "Identity verification information is incomplete",
      });
    }

    // Generate NIBSS token
    const tokenResponse = await generateNibssToken();
    const token = tokenResponse.token;

    // Data sent to NIBSS
    const accountData = {
      kycType: kycType.toLowerCase(),
      kycID,
      dob: customer.dateOfBirth
        ? new Date(customer.dateOfBirth).toISOString().split("T")[0]
        : undefined,
    };

    console.log("Account creation payload:");
    console.log(accountData);

    // Create the account on NIBSS
    const nibssResponse = await createNibssAccount(accountData, token);

    console.log("Raw NIBSS account response:");
    console.log(nibssResponse);

    // NIBSS may return the account in different structures
    const nibssAccount =
      nibssResponse?.account ||
      nibssResponse?.data?.account ||
      nibssResponse?.data ||
      nibssResponse;

    const accountNumber =
      nibssAccount?.accountNumber ||
      nibssAccount?.accountNo ||
      nibssAccount?.account_number;

    const bankCode = nibssAccount?.bankCode || nibssAccount?.bank_code || "964";

    const bankName =
      nibssAccount?.bankName || nibssAccount?.bank_name || "DIG Bank Trust";

    const accountName =
      nibssAccount?.accountName || nibssAccount?.account_name || customer.name;

    const balance =
      nibssAccount?.balance !== undefined
        ? Number(nibssAccount.balance)
        : 15000;

    // NIBSS must return an account number
    if (!accountNumber) {
      console.error(
        "NIBSS account response did not contain an account number:",
        nibssResponse,
      );

      return res.status(502).json({
        success: false,
        message:
          "NIBSS account creation succeeded but no account number was returned",
        data: nibssResponse,
      });
    }

    // Save the NIBSS-created account locally
    const account = await Account.create({
      customerId: customer._id,
      accountNumber: String(accountNumber),
      accountName,
      bankCode: String(bankCode),
      bankName,
      balance,
      currency: "NGN",
      status: "active",
    });

    // Update customer with account information
    customer.accountNumber = String(accountNumber);
    customer.bankCode = String(bankCode);
    customer.bankName = bankName;
    customer.balance = balance;
    customer.hasAccount = true;

    await customer.save();

    return res.status(201).json({
      success: true,
      message: "Account created successfully",
      data: {
        account: {
          id: account._id,
          accountNumber: account.accountNumber,
          accountName: account.accountName,
          bankCode: account.bankCode,
          bankName: account.bankName,
          balance: account.balance,
          currency: account.currency,
          status: account.status,
        },
      },
    });
  } catch (error) {
    console.error(
      "Create account error:",
      error.response?.data || error.message,
    );

    return res.status(error.response?.status || 500).json({
      success: false,
      message:
        error.response?.data?.message ||
        error.response?.data?.error ||
        error.message ||
        "Account creation failed",
    });
  }
};

// ======================================================
// GET MY ACCOUNT
// ======================================================

const getMyAccount = async (req, res) => {
  try {
    const account = await Account.findOne({
      customerId: req.user.id,
    }).select(
      "accountNumber accountName balance bankCode bankName currency status openedAt",
    );

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
          bankName: account.bankName,
          currency: account.currency,
          status: account.status,
          openedAt: account.openedAt,
        },
      },
    });
  } catch (error) {
    console.error("Get account error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Failed to retrieve account",
    });
  }
};

// ======================================================
// NAME ENQUIRY
// ======================================================

const performNameEnquiry = async (req, res) => {
  try {
    const { accountNumber } = req.params;

    // First check our own database
    const localAccount = await Account.findOne({
      accountNumber: String(accountNumber),
    });

    if (localAccount) {
      return res.status(200).json({
        success: true,
        message: "Name enquiry successful",
        data: {
          accountName: localAccount.accountName,
          accountNumber: localAccount.accountNumber,
          bankCode: localAccount.bankCode,
          bankName: localAccount.bankName,
        },
      });
    }

    // External account - ask NIBSS
    const tokenResponse = await generateNibssToken();
    const token = tokenResponse.token;

    const nibssResponse = await nameEnquiry(accountNumber, token);

    const data = nibssResponse?.data || nibssResponse;

    return res.status(200).json({
      success: true,
      message: "Name enquiry successful",
      data: {
        accountName: data?.accountName || data?.account_name,

        accountNumber:
          data?.accountNumber || data?.account_number || accountNumber,

        bankCode: data?.bankCode || data?.bank_code,
      },
    });
  } catch (error) {
    console.error("Name enquiry error:", error.response?.data || error.message);

    return res.status(error.response?.status || 500).json({
      success: false,
      message:
        error.response?.data?.message ||
        error.response?.data?.error ||
        "Name enquiry failed",
    });
  }
};

// ======================================================
// GET BALANCE
// ======================================================

const getBalance = async (req, res) => {
  try {
    const account = await Account.findOne({
      customerId: req.user.id,
    });

    if (!account) {
      return res.status(404).json({
        success: false,
        message: "Account not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Balance retrieved successfully",
      data: {
        accountNumber: account.accountNumber,
        balance: account.balance,
        currency: account.currency || "NGN",
      },
    });
  } catch (error) {
    console.error("Get balance error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Failed to retrieve balance",
    });
  }
};

// ======================================================
// TRANSFER
// ======================================================

const transfer = async (req, res) => {
  try {
    const { to, amount } = req.body;

    const transferAmount = Number(amount);

    if (!to) {
      return res.status(400).json({
        success: false,
        message: "Recipient account number is required",
      });
    }

    if (!Number.isFinite(transferAmount) || transferAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Transfer amount must be greater than 0",
      });
    }

    // --------------------------------------------------
    // FIND SENDER
    // --------------------------------------------------

    const senderAccount = await Account.findOne({
      customerId: req.user.id,
    });

    if (!senderAccount) {
      return res.status(404).json({
        success: false,
        message: "Sender account not found",
      });
    }

    // --------------------------------------------------
    // CHECK BALANCE
    // --------------------------------------------------

    if (Number(senderAccount.balance) < transferAmount) {
      return res.status(400).json({
        success: false,
        message: "Insufficient balance",
      });
    }

    // --------------------------------------------------
    // CHECK IF RECIPIENT IS OUR CUSTOMER
    // --------------------------------------------------

    const localRecipient = await Account.findOne({
      accountNumber: String(to),
    });

    // ==================================================
    // INTERNAL / INTRA-BANK TRANSFER
    // ==================================================

    if (localRecipient) {
      // Prevent sending to yourself
      if (String(localRecipient._id) === String(senderAccount._id)) {
        return res.status(400).json({
          success: false,
          message: "You cannot transfer money to your own account",
        });
      }

      // Debit sender
      senderAccount.balance = Number(senderAccount.balance) - transferAmount;

      // Credit recipient
      localRecipient.balance = Number(localRecipient.balance) + transferAmount;

      await senderAccount.save();
      await localRecipient.save();

      const reference = `TRX-${Date.now()}-${Math.floor(
        Math.random() * 100000,
      )}`;

      await Transaction.create({
        customerId: req.user.id,
        accountId: senderAccount._id,
        type: "transfer",
        amount: transferAmount,
        status: "successful",
        reference,
        provider: "Digital Banking System",
        description: `Transfer to ${localRecipient.accountNumber}`,
      });

      return res.status(200).json({
        success: true,
        message: "Transfer successful",
        data: {
          reference,
          type: "intra-bank",
          from: senderAccount.accountNumber,
          to: localRecipient.accountNumber,
          recipientName: localRecipient.accountName,
          amount: transferAmount,
          balance: senderAccount.balance,
        },
      });
    }

    // ==================================================
    // EXTERNAL / INTER-BANK TRANSFER
    // ==================================================

    console.log("External inter-bank transfer detected");

    // Get NIBSS token
    const tokenResponse = await generateNibssToken();
    const token = tokenResponse.token;

    // --------------------------------------------------
    // STEP 1: NAME ENQUIRY
    // --------------------------------------------------

    console.log(`Performing name enquiry for external account ${to}`);

    const enquiryResponse = await nameEnquiry(String(to), token);

    console.log("Name enquiry response:");
    console.log(enquiryResponse);

    const enquiryData = enquiryResponse?.data || enquiryResponse;

    const recipientName = enquiryData?.accountName || enquiryData?.account_name;

    const bankCode = enquiryData?.bankCode || enquiryData?.bank_code;

    if (!bankCode) {
      return res.status(400).json({
        success: false,
        message: "NIBSS did not return a bank code for this recipient",
      });
    }

    if (!recipientName) {
      return res.status(400).json({
        success: false,
        message: "NIBSS did not return the recipient account name",
      });
    }

    // --------------------------------------------------
    // STEP 2: GENERATE UNIQUE REFERENCE
    // --------------------------------------------------

    const reference = `TRX-${Date.now()}-${Math.floor(
      Math.random() * 1000000,
    )}`;

    // --------------------------------------------------
    // STEP 3: PREPARE NIBSS TRANSFER PAYLOAD
    // --------------------------------------------------

    const transferPayload = {
      from: String(senderAccount.accountNumber),
      to: String(to),
      amount: String(transferAmount),
      bankCode: String(bankCode),
      narration: `Transfer to ${recipientName}`,
      reference,
    };

    console.log("Final NIBSS inter-bank transfer payload:");
    console.log(transferPayload);

    // --------------------------------------------------
    // STEP 4: SEND TRANSFER TO NIBSS
    // --------------------------------------------------

    const nibssTransferResponse = await transferFunds(transferPayload, token);

    console.log("NIBSS transfer response:");
    console.log(nibssTransferResponse);

    // --------------------------------------------------
    // STEP 5: ONLY DEBIT AFTER NIBSS SUCCESS
    // --------------------------------------------------

    const transferSuccessful =
      nibssTransferResponse?.success === true ||
      nibssTransferResponse?.status === "success" ||
      nibssTransferResponse?.status === "successful" ||
      nibssTransferResponse?.data?.success === true;

    if (!transferSuccessful) {
      console.log("NIBSS did not confirm successful transfer");

      return res.status(400).json({
        success: false,
        message:
          nibssTransferResponse?.message ||
          nibssTransferResponse?.error ||
          "NIBSS did not confirm the transfer",
        data: {
          providerResponse: nibssTransferResponse,
        },
      });
    }

    // Debit sender only after success
    senderAccount.balance = Number(senderAccount.balance) - transferAmount;

    await senderAccount.save();

    // Save transaction
    await Transaction.create({
      customerId: req.user.id,
      accountId: senderAccount._id,
      type: "transfer",
      amount: transferAmount,
      status: "successful",
      reference,
      provider: "NIBSS",
      description: `Inter-bank transfer to ${recipientName}`,
    });

    return res.status(200).json({
      success: true,
      message: "Inter-bank transfer successful",
      data: {
        reference,
        type: "inter-bank",
        from: senderAccount.accountNumber,
        to: String(to),
        recipientName,
        bankCode: String(bankCode),
        amount: transferAmount,
        balance: senderAccount.balance,
        providerResponse: nibssTransferResponse,
      },
    });
  } catch (error) {
    console.error("Transfer error:");

    console.error(error.response?.data || error.message);

    return res.status(error.response?.status || 500).json({
      success: false,
      message:
        error.response?.data?.message ||
        error.response?.data?.error ||
        error.message ||
        "Transfer failed",
    });
  }
};

module.exports = {
  createAccount,
  getMyAccount,
  performNameEnquiry,
  getBalance,
  transfer,
};
