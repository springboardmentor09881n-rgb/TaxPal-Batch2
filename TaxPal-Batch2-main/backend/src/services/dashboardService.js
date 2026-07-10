const Transaction = require("../models/Transaction");
const User = require("../models/User");

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

const getLast6MonthsData = (transactions) => {
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const result = [];
  
  const today = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
    const year = d.getFullYear();
    const month = d.getMonth();
    
    result.push({
      monthKey: `${year}-${String(month + 1).padStart(2, '0')}`,
      monthName: monthNames[month],
      income: 0,
      expense: 0
    });
  }
  
  transactions.forEach(t => {
    const tDate = new Date(t.date);
    const tYear = tDate.getFullYear();
    const tMonth = tDate.getMonth();
    const tKey = `${tYear}-${String(tMonth + 1).padStart(2, '0')}`;
    
    const monthObj = result.find(r => r.monthKey === tKey);
    if (monthObj) {
      if (t.type === 'income') {
        monthObj.income += t.amount;
      } else if (t.type === 'expense') {
        monthObj.expense += t.amount;
      }
    }
  });
  
  const maxVal = Math.max(...result.map(r => Math.max(r.income, r.expense)), 100);
  
  return result.map(r => ({
    month: r.monthName,
    income: r.income,
    expense: r.expense,
    incomePercent: parseFloat(((r.income / maxVal) * 100).toFixed(1)),
    expensePercent: parseFloat(((r.expense / maxVal) * 100).toFixed(1))
  }));
};

const getCategoryBreakdown = (transactions) => {
  const expenseCategories = {
    'Rent/Mortgage': { color: '#3b82f6', amount: 0 },
    'Business Expenses': { color: '#10b981', amount: 0 },
    'Utilities': { color: '#f59e0b', amount: 0 },
    'Food': { color: '#ef4444', amount: 0 },
    'Software Subscriptions': { color: '#ec4899', amount: 0 },
    'Other': { color: '#8b5cf6', amount: 0 }
  };
  
  let totalExpenses = 0;
  
  transactions.forEach(t => {
    if (t.type === 'expense') {
      totalExpenses += t.amount;
      const cat = expenseCategories[t.category] || expenseCategories['Other'];
      cat.amount += t.amount;
    }
  });
  
  const breakdown = [];
  for (const [name, data] of Object.entries(expenseCategories)) {
    const percentage = totalExpenses > 0 ? parseFloat(((data.amount / totalExpenses) * 100).toFixed(1)) : 0;
    breakdown.push({
      category: name,
      amount: data.amount,
      percentage: percentage,
      color: data.color
    });
  }
  
  return {
    totalExpenses,
    breakdown
  };
};

const getSummary = async (userId) => {
  const user = await User.findById(userId);
  const transactions = await Transaction.find({ userId });

  // Current month totals
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth(); // 0-11
  
  const currentMonthTransactions = transactions.filter(t => {
    const tDate = new Date(t.date);
    return tDate.getFullYear() === currentYear && tDate.getMonth() === currentMonth;
  });

  const monthlyIncome = currentMonthTransactions
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + t.amount, 0);

  const monthlyExpenses = currentMonthTransactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + t.amount, 0);

  // Savings rate
  const savingsRate = monthlyIncome > 0 
    ? parseFloat((((monthlyIncome - monthlyExpenses) / monthlyIncome) * 100).toFixed(1))
    : 0;
  
  // Tax bracket estimate
  let taxRate = 0.15; // default middle
  if (user && user.income_bracket) {
    if (user.income_bracket === 'low') taxRate = 0.10;
    else if (user.income_bracket === 'high') taxRate = 0.25;
  }
  const estimatedTaxDue = parseFloat((monthlyIncome * taxRate).toFixed(2));

  // Compute previous month's stats for real trends
  const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;
  const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;

  const prevMonthTransactions = transactions.filter(t => {
    const tDate = new Date(t.date);
    return tDate.getFullYear() === prevYear && tDate.getMonth() === prevMonth;
  });

  const prevMonthlyIncome = prevMonthTransactions
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + t.amount, 0);

  const prevMonthlyExpenses = prevMonthTransactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + t.amount, 0);

  const prevSavingsRate = prevMonthlyIncome > 0
    ? parseFloat((((prevMonthlyIncome - prevMonthlyExpenses) / prevMonthlyIncome) * 100).toFixed(1))
    : 0;

  const incomeTrend = prevMonthlyIncome > 0 
    ? parseFloat((((monthlyIncome - prevMonthlyIncome) / prevMonthlyIncome) * 100).toFixed(1)) 
    : null;

  const expenseTrend = prevMonthlyExpenses > 0 
    ? parseFloat((((monthlyExpenses - prevMonthlyExpenses) / prevMonthlyExpenses) * 100).toFixed(1)) 
    : null;

  const savingsTrend = prevSavingsRate > 0 
    ? parseFloat((savingsRate - prevSavingsRate).toFixed(1)) 
    : null;

  // Chart data
  const chartData = getLast6MonthsData(transactions);
  const breakdownData = getCategoryBreakdown(transactions);

  return {
    monthlyIncome,
    incomeTrend,
    monthlyExpenses,
    expenseTrend,
    estimatedTaxDue,
    savingsRate,
    savingsTrend,
    chartData,
    categoryBreakdown: breakdownData.breakdown
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
