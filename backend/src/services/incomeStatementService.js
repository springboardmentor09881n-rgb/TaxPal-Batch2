const Transaction = require("../models/Transaction");
const { getPeriodRange } = require("../utils/periodResolver");

const generateIncomeStatement = async (userId, period) => {
  const { startDate, endDate } = getPeriodRange(period);

  const transactions = await Transaction.find({
    userId,
    date: {
      $gte: startDate,
      $lte: endDate,
    },
  }).sort({ date: 1 });

  let totalIncome = 0;
  let totalExpenses = 0;

  const incomeBreakdown = {};
  const expenseBreakdown = {};

  for (const transaction of transactions) {
    const amount = Number(transaction.amount) || 0;
    const category = transaction.category;

    if (transaction.type === "income") {
      totalIncome += amount;

      incomeBreakdown[category] =
        (incomeBreakdown[category] || 0) + amount;
    }

    if (transaction.type === "expense") {
      totalExpenses += amount;

      expenseBreakdown[category] =
        (expenseBreakdown[category] || 0) + amount;
    }
  }

  const netIncome = totalIncome - totalExpenses;

  return {
    period,
    startDate,
    endDate,
    totalIncome,
    totalExpenses,
    netIncome,
    incomeBreakdown,
    expenseBreakdown,
  };
};

module.exports = {
  generateIncomeStatement,
};