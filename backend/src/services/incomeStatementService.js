const Transaction = require("../models/Transaction");
const mongoose = require("mongoose");

// Groups income and expense transactions by category for a given period,
// and returns totals + category breakdown.
async function getIncomeStatementData(userId, startDate, endDate) {
  const breakdown = await Transaction.aggregate([
    {
      $match: {
        userId: new mongoose.Types.ObjectId(userId),
        date: { $gte: startDate, $lte: endDate },
      },
    },
    {
      $group: {
        _id: { type: "$type", category: "$category" },
        total: { $sum: "$amount" },
      },
    },
  ]);

  const incomeBreakdown = breakdown
    .filter((row) => row._id.type === "income")
    .map((row) => ({ category: row._id.category, total: row.total }));

  const expenseBreakdown = breakdown
    .filter((row) => row._id.type === "expense")
    .map((row) => ({ category: row._id.category, total: row.total }));

  const totalIncome = incomeBreakdown.reduce((sum, row) => sum + row.total, 0);
  const totalExpenses = expenseBreakdown.reduce(
    (sum, row) => sum + row.total,
    0,
  );
  const netIncome = totalIncome - totalExpenses;

  return {
    totalIncome,
    totalExpenses,
    netIncome,
    incomeBreakdown,
    expenseBreakdown,
  };
}

module.exports = { getIncomeStatementData };
