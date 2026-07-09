const Transaction = require("../models/Transaction");

const formatTransaction = (t) => {
  return {
    id: t._id,
    type: t.type,
    category: t.category,
    amount: t.amount,
    date: t.date,
    description: t.description,
    notes: t.notes,
  };
};

const createTransaction = async (transactionData) => {
  const transaction = await Transaction.create(transactionData);
  return formatTransaction(transaction);
};

const getAllTransactions = async (userId) => {
  const transactions = await Transaction.find({ userId }).sort({ date: -1 });
  return transactions.map(formatTransaction);
};

const getTransactionById = async (id, userId) => {
  const transaction = await Transaction.findOne({ _id: id, userId });
  if (!transaction) {
    const error = new Error("Transaction not found.");
    error.statusCode = 404;
    throw error;
  }
  return formatTransaction(transaction);
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
  return formatTransaction(transaction);
};

const deleteTransaction = async (id, userId) => {
  const transaction = await Transaction.findOneAndDelete({ _id: id, userId });
  if (!transaction) {
    const error = new Error("Transaction not found.");
    error.statusCode = 404;
    throw error;
  }
  return formatTransaction(transaction);
};

module.exports = {
  createTransaction,
  getAllTransactions,
  getTransactionById,
  updateTransaction,
  deleteTransaction,
};
