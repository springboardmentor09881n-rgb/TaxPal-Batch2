const Budget = require("../models/Budget");
const Transaction = require("../models/Transaction");
const { getPeriodRange } = require("../utils/periodResolver");

const generateBudgetPerformance = async (userId, period) => {
  const { startDate, endDate } = getPeriodRange(period);

  const budgets = await Budget.find({ userId });

  const transactions = await Transaction.find({
    userId,
    type: "expense",
    date: {
      $gte: startDate,
      $lte: endDate,
    },
  });

  const categoryPerformance = {};

  for (const budget of budgets) {
    const category = budget.category;

    const budgetMonth = String(budget.month).toLowerCase();

    const monthMatches =
      budgetMonth.includes(String(startDate.getFullYear())) ||
      budgetMonth.includes(
        startDate.toLocaleString("en-US", { month: "long" }).toLowerCase()
      ) ||
      budgetMonth.includes(
        String(startDate.getMonth() + 1).padStart(2, "0")
      );

    if (!monthMatches) {
      continue;
    }

    if (!categoryPerformance[category]) {
      categoryPerformance[category] = {
        limit: 0,
        spent: 0,
        variance: 0,
        status: "Within Budget",
      };
    }

    categoryPerformance[category].limit += Number(budget.limit) || 0;
  }

  for (const transaction of transactions) {
    const category = transaction.category;

    if (!categoryPerformance[category]) {
      categoryPerformance[category] = {
        limit: 0,
        spent: 0,
        variance: 0,
        status: "No Budget",
      };
    }

    categoryPerformance[category].spent += Number(transaction.amount) || 0;
  }

  let totalLimit = 0;
  let totalActualSpent = 0;

  for (const category of Object.keys(categoryPerformance)) {
    const item = categoryPerformance[category];

    item.variance = item.limit - item.spent;

    if (item.limit === 0) {
      item.status = "No Budget";
    } else if (item.spent > item.limit) {
      item.status = "Over Budget";
    } else {
      item.status = "Within Budget";
    }

    totalLimit += item.limit;
    totalActualSpent += item.spent;
  }

  const remainingBalance = totalLimit - totalActualSpent;

  return {
    period,
    startDate,
    endDate,
    totalLimit,
    totalActualSpent,
    remainingBalance,
    overBudget: totalActualSpent > totalLimit,
    categoryPerformance,
  };
};

module.exports = {
  generateBudgetPerformance,
};