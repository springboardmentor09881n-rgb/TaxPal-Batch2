const Transaction = require("../models/Transaction");

const createTransaction = async (transactionData) => {
  return await Transaction.create(transactionData);
};

const getAllTransactions = async (userId) => {
  return await Transaction.find({ userId }).sort({ date: -1 });
};

const getTransactionById = async (id, userId) => {
  const transaction = await Transaction.findOne({ _id: id, userId });
  if (!transaction) {
    const error = new Error("Transaction not found.");
    error.statusCode = 404;
    throw error;
  }
  return transaction;
};

const updateTransaction = async (id, userId, updateData) => {
  const transaction = await Transaction.findOneAndUpdate(
    { _id: id, userId },
    updateData,
    { new: true }
  );
  if (!transaction) {
    const error = new Error("Transaction not found.");
    error.statusCode = 404;
    throw error;
  }
  return transaction;
};

const deleteTransaction = async (id, userId) => {
  const transaction = await Transaction.findOneAndDelete({ _id: id, userId });
  if (!transaction) {
    const error = new Error("Transaction not found.");
    error.statusCode = 404;
    throw error;
  }
  return transaction;
};

module.exports = {
  createTransaction,
  getAllTransactions,
  getTransactionById,
  updateTransaction,
  deleteTransaction,
};
