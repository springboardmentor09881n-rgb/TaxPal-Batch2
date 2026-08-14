const {
  generateIncomeStatement,
} = require("./incomeStatementService");

const {
  generateTaxSummary,
} = require("./taxSummaryReportService");

const {
  generateBudgetPerformance,
} = require("./budgetPerformanceService");

const {
  isQuarterPeriod,
} = require("../utils/periodResolver");

const generateReport = async (userId, reportType, period) => {
  if (!userId) {
    throw new Error("User ID is required");
  }

  if (!reportType) {
    throw new Error("Report type is required");
  }

  if (!period) {
    throw new Error("Period is required");
  }

  const validReportTypes = [
    "income_statement",
    "tax_summary",
    "budget_performance",
  ];

  if (!validReportTypes.includes(reportType)) {
    throw new Error(`Unsupported report type: ${reportType}`);
  }

  const validPeriods = [
    "current_month",
    "last_month",
    "q1",
    "q2",
    "q3",
    "q4",
    "current_year",
  ];

  if (!validPeriods.includes(period)) {
    throw new Error(`Unsupported period: ${period}`);
  }

  if (reportType === "tax_summary" && !isQuarterPeriod(period)) {
    throw new Error(
      "Tax summary reports only support quarterly periods: q1, q2, q3, q4"
    );
  }

  switch (reportType) {
    case "income_statement":
      return await generateIncomeStatement(userId, period);

    case "tax_summary":
      return await generateTaxSummary(userId, period);

    case "budget_performance":
      return await generateBudgetPerformance(userId, period);

    default:
      throw new Error(`Unsupported report type: ${reportType}`);
  }
};

module.exports = {
  generateReport,
};