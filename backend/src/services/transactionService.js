const Transaction = require("../models/Transaction");

// CREATE
const createTransaction = async (transactionData) => {
  const { type, category, amount, date } = transactionData;

  if (!type || !category || !amount || !date) {
    throw new Error("All required fields must be provided");
  }

  return await Transaction.create(transactionData);
};

// GET ALL
const getAllTransactions = async (userId) => {
  return await Transaction.find({ userId }).sort({ date: -1 });
};

// GET ONE
const getTransactionById = async (id) => {
  return await Transaction.findById(id);
};

// UPDATE
const updateTransaction = async (id, updateData) => {
  return await Transaction.findByIdAndUpdate(id, updateData, {
    new: true,
  });
};

// DELETE
const deleteTransaction = async (id) => {
  return await Transaction.findByIdAndDelete(id);
};

module.exports = {
  createTransaction,
  getAllTransactions,
  getTransactionById,
  updateTransaction,
  deleteTransaction,
};