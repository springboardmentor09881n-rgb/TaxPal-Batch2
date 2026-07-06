const transactionService = require("../services/transactionService");

// CREATE
const addTransaction = async (req, res) => {
  try {
    const transactionData = {
      ...req.body,
      userId: req.user?.id || "TEMP_USER_ID",
    };

    const transaction = await transactionService.createTransaction(transactionData);
    res.status(201).json(transaction);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET ALL
const getAllTransactions = async (req, res) => {
  try {
    const userId = req.user?.id || "TEMP_USER_ID";

    const transactions = await transactionService.getAllTransactions(userId);
    res.status(200).json(transactions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET ONE
const getTransactionById = async (req, res) => {
  try {
    const transaction = await transactionService.getTransactionById(req.params.id);

    if (!transaction) {
      return res.status(404).json({ message: "Transaction not found" });
    }

    res.status(200).json(transaction);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// UPDATE
const updateTransaction = async (req, res) => {
  try {
    const updated = await transactionService.updateTransaction(
      req.params.id,
      req.body
    );

    if (!updated) {
      return res.status(404).json({ message: "Transaction not found" });
    }

    res.status(200).json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// DELETE
const deleteTransaction = async (req, res) => {
  try {
    const deleted = await transactionService.deleteTransaction(req.params.id);

    if (!deleted) {
      return res.status(404).json({ message: "Transaction not found" });
    }

    res.status(200).json({ message: "Transaction deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  addTransaction,
  getAllTransactions,
  getTransactionById,
  updateTransaction,
  deleteTransaction,
};
