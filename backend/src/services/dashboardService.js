const Transaction = require("../models/Transaction");

const getDashboardData = async (userId) => {
  const transactions = await Transaction.find({ userId }).sort({ date: -1 });

  const totalIncome = transactions
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpense = transactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + t.amount, 0);

  const balance = totalIncome - totalExpense;

  const recentTransactions = transactions.slice(0, 5);

  return {
    totalIncome,
    totalExpense,
    balance,
    recentTransactions,
  };
};

module.exports = {
  getDashboardData,
};