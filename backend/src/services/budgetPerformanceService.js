const Budget = require("../models/Budget");
const Transaction = require("../models/Transaction");
const mongoose = require("mongoose");

// Compares each budget's limit against actual spending in the period,
// and flags whether the category (and overall) went over budget.
async function getBudgetPerformanceData(userId, month, startDate, endDate) {
  const budgets = await Budget.find({ userId, month });

  const categoryPerformance = await Promise.all(
    budgets.map(async (budget) => {
      const spentResult = await Transaction.aggregate([
        {
          $match: {
            userId: new mongoose.Types.ObjectId(userId),
            category: budget.category,
            type: "expense",
            date: { $gte: startDate, $lte: endDate },
          },
        },
        { $group: { _id: null, totalSpent: { $sum: "$amount" } } },
      ]);

      const actualSpent = spentResult[0]?.totalSpent || 0;
      const variance = budget.limit - actualSpent;
      const status = actualSpent > budget.limit ? "Limit Exceeded" : "On Track";

      return {
        category: budget.category,
        budgetLimit: budget.limit,
        actualSpent,
        variance,
        status,
      };
    }),
  );

  const totalLimit = categoryPerformance.reduce(
    (sum, row) => sum + row.budgetLimit,
    0,
  );
  const totalActualSpent = categoryPerformance.reduce(
    (sum, row) => sum + row.actualSpent,
    0,
  );
  const remainingBalance = totalLimit - totalActualSpent;
  const isOverBudget = totalActualSpent > totalLimit;

  return {
    totalLimit,
    totalActualSpent,
    remainingBalance,
    isOverBudget,
    categoryPerformance,
  };
}

module.exports = { getBudgetPerformanceData };
