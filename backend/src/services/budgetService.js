const mongoose = require("mongoose");
const Budget = require("../models/Budget");
const Transaction = require("../models/Transaction");


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

module.exports = { getBudgetProgress };
