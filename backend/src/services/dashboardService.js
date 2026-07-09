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

const getSummary = async (userId) => {
  const transactions = await Transaction.find({ userId });

  const monthlyIncome = transactions
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + t.amount, 0);

  const monthlyExpenses = transactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + t.amount, 0);

  const savingsRate = monthlyIncome > 0 
    ? parseFloat((((monthlyIncome - monthlyExpenses) / monthlyIncome) * 100).toFixed(1))
    : 0;
  
  const estimatedTaxDue = parseFloat((monthlyIncome * 0.15).toFixed(2));

  return {
    monthlyIncome,
    incomeTrend: 0, // historical data not yet implemented
    monthlyExpenses,
    expenseTrend: 0, // historical data not yet implemented
    estimatedTaxDue,
    savingsRate,
    savingsTrend: 0 // historical data not yet implemented
  };
};

const getRecentTransactions = async (userId) => {
  const transactions = await Transaction.find({ userId }).sort({ date: -1 }).limit(5);
  return transactions.map(formatTransaction);
};

module.exports = {
  getSummary,
  getRecentTransactions,
};
