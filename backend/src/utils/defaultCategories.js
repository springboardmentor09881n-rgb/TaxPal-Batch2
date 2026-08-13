const defaultExpenseCategories = [
  { name: "Food", color: "#EF4444", type: "expense" },
  { name: "Transport", color: "#3B82F6", type: "expense" },
  { name: "Rent/Mortgage", color: "#3B82F6", type: "expense" },
  { name: "Utilities", color: "#F59E0B", type: "expense" },
  { name: "Shopping", color: "#10B981", type: "expense" },
  { name: "Healthcare", color: "#EAB308", type: "expense" },
  { name: "Education", color: "#06B6D4", type: "expense" },
  { name: "Entertainment", color: "#14B8A6", type: "expense" },
  { name: "Travel", color: "#EC4899", type: "expense" },
  { name: "Software Subscriptions", color: "#8B5CF6", type: "expense" },
  { name: "Business Expenses", color: "#10B981", type: "expense" },
  { name: "Marketing", color: "#EC4899", type: "expense" },
  { name: "Other", color: "#6B7280", type: "expense" }
];

const defaultIncomeCategories = [
  { name: "Salary", color: "#22C55E", type: "income" },
  { name: "Freelancing", color: "#6366F1", type: "income" },
  { name: "Business", color: "#2563EB", type: "income" },
  { name: "Investments", color: "#A855F7", type: "income" },
  { name: "Bonus", color: "#F59E0B", type: "income" },
  { name: "Refund", color: "#0891B2", type: "income" },
  { name: "Consulting", color: "#10B981", type: "income" },
  { name: "Other Income", color: "#6B7280", type: "income" }
];

const defaultCategories = [...defaultExpenseCategories, ...defaultIncomeCategories];

module.exports = defaultCategories;
module.exports.defaultExpenseCategories = defaultExpenseCategories;
module.exports.defaultIncomeCategories = defaultIncomeCategories;
module.exports.defaultCategories = defaultCategories;
