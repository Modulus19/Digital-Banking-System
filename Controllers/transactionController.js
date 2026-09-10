const Transaction = require("../Models/transaction.model");
const Account = require("../Models/account.model");

// ===============================
// GET TRANSACTION STATUS
// ===============================

const getTransactionStatus = async (req, res, next) => {
  try {
    const { ref } = req.params;

    const account = await Account.findOne({
      customer: req.user.id,
    });

    if (!account) {
      return res.status(404).json({
        success: false,
        message: "Account not found",
      });
    }

    const transaction = await Transaction.findOne({
      reference: ref,
      $or: [
        { customer: req.user.id },
        { recipientAccount: account.accountNumber },
      ],
    });

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: "Transaction not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Transaction retrieved successfully",
      data: {
        reference: transaction.reference,
        type: transaction.type,
        amount: transaction.amount,
        senderAccount: transaction.senderAccount,
        recipientAccount: transaction.recipientAccount,
        recipientName: transaction.recipientName,
        status: transaction.status,
        narration: transaction.narration,
        provider: transaction.provider,
        providerReference: transaction.providerReference,
        createdAt: transaction.createdAt,
        completedAt: transaction.completedAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ===============================
// GET MY TRANSACTION HISTORY
// ===============================

const getTransactionHistory = async (req, res, next) => {
  try {
    const account = await Account.findOne({
      customer: req.user.id,
    });

    if (!account) {
      return res.status(404).json({
        success: false,
        message: "Account not found",
      });
    }

    const transactions = await Transaction.find({
      $or: [
        { customer: req.user.id },
        { recipientAccount: account.accountNumber },
      ],
    })
      .select(
        "reference type amount senderAccount senderName senderBankCode recipientAccount recipientName recipientBankCode narration status provider providerReference failureReason completedAt createdAt",
      )
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      message: "Transaction history retrieved successfully",
      count: transactions.length,
      data: {
        transactions,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getTransactionStatus,
  getTransactionHistory,
};
