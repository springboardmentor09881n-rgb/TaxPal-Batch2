const mongoose = require("mongoose");
const Budget = require("../models/Budget");
const Transaction = require("../models/Transaction");

const formatBudget = (b) => {
  return {
    id: b._id,
    category: b.category,
    limit: b.limit,
    month: b.month
  };
};

const createBudget = async (budgetData) => {
  try {
    const budget = await Budget.create(budgetData);
    return formatBudget(budget);
  } catch (err) {
    if (err.code === 11000) {
      const error = new Error(`A budget for category "${budgetData.category}" and month "${budgetData.month}" already exists.`);
      error.statusCode = 409;
      throw error;
    }
    throw err;
  }
};

const getBudgets = async (userId) => {
  const budgets = await Budget.find({ userId }).sort({ month: -1 });
  return budgets.map(formatBudget);
};

const getBudgetById = async (id, userId) => {
  const budget = await Budget.findOne({ _id: id, userId });
  if (!budget) {
    const error = new Error("Budget not found.");
    error.statusCode = 404;
    throw error;
  }
  return formatBudget(budget);
};

const updateBudget = async (id, userId, updateData) => {
  try {
    const budget = await Budget.findOneAndUpdate(
      { _id: id, userId },
      updateData,
      { new: true, runValidators: true }
    );
    if (!budget) {
      const error = new Error("Budget not found.");
      error.statusCode = 404;
      throw error;
    }
    return formatBudget(budget);
  } catch (err) {
    if (err.code === 11000) {
      const error = new Error("A budget for this category and month already exists.");
      error.statusCode = 409;
      throw error;
    }
    throw err;
  }
};

const deleteBudget = async (id, userId) => {
  const budget = await Budget.findOneAndDelete({ _id: id, userId });
  if (!budget) {
    const error = new Error("Budget not found.");
    error.statusCode = 404;
    throw error;
  }
  return formatBudget(budget);
};

async function getBudgetProgress(userId, month) {
  const budgets = await Budget.find({ userId, month });

  const results = await Promise.all(
    budgets.map(async (budget) => {
      const [year, monthNum] = month.split("-");
      const startDate = new Date(`${year}-${monthNum}-01`);
      const endDate = new Date(year, monthNum, 0); 

      const spentResult = await Transaction.aggregate([
        {
          $match: {
            userId: new mongoose.Types.ObjectId(userId),
            category: budget.category,
            type: "expense",
            date: { $gte: startDate, $lte: endDate },
          },
        },
        {
          $group: {
            _id: null,
            totalSpent: { $sum: "$amount" },
          },
        },
      ]);

      const spent = spentResult[0]?.totalSpent || 0;
      const remaining = budget.limit - spent;
      const percentUsed = ((spent / budget.limit) * 100).toFixed(1);

      let status = "Good";
      if (percentUsed >= 100) status = "Over Budget";
      else if (percentUsed >= 80) status = "Warning";

      return {
        category: budget.category,
        limit: budget.limit,
        spent,
        remaining,
        percentUsed,
        status,
      };
    }),
  );

  return results;
}

const getBudgetProgressFormatted = async (userId, month) => {
  const results = await getBudgetProgress(userId, month);
  return results.map(r => ({
    category: r.category,
    budget: r.limit,
    spent: r.spent,
    remaining: r.remaining,
    usagePercentage: parseFloat(r.percentUsed),
    status: r.status
  }));
};

module.exports = { 
  createBudget,
  getBudgets,
  getBudgetById,
  updateBudget,
  deleteBudget,
  getBudgetProgress,
  getBudgetProgressFormatted 
};
