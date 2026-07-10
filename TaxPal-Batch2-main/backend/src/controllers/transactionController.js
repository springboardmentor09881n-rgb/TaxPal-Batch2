const transactionService = require("../services/transactionService");

// CREATE
const addTransaction = async (req, res, next) => {
  try {
    const transactionData = {
      ...req.body,
      userId: req.user.id,
    };

    const transaction = await transactionService.createTransaction(transactionData);
    res.status(201).json({
      success: true,
      message: "Transaction created successfully.",
      data: transaction
    });
  } catch (error) {
    next(error);
  }
};

// GET ALL
const getAllTransactions = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const transactions = await transactionService.getAllTransactions(userId);
    res.status(200).json({
      success: true,
      message: "Transactions retrieved successfully.",
      data: transactions
    });
  } catch (error) {
    next(error);
  }
};

// GET ONE
const getTransactionById = async (req, res, next) => {
  try {
    const transaction = await transactionService.getTransactionById(req.params.id, req.user.id);
    res.status(200).json({
      success: true,
      message: "Transaction retrieved successfully.",
      data: transaction
    });
  } catch (error) {
    next(error);
  }
};

// UPDATE
const updateTransaction = async (req, res, next) => {
  try {
    const updated = await transactionService.updateTransaction(
      req.params.id,
      req.user.id,
      req.body
    );
    res.status(200).json({
      success: true,
      message: "Transaction updated successfully.",
      data: updated
    });
  } catch (error) {
    next(error);
  }
};

// DELETE
const deleteTransaction = async (req, res, next) => {
  try {
    await transactionService.deleteTransaction(req.params.id, req.user.id);
    res.status(200).json({
      success: true,
      message: "Transaction deleted successfully.",
      data: null
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  addTransaction,
  getAllTransactions,
  getTransactionById,
  updateTransaction,
  deleteTransaction,
};
