const {
  generateIncomeStatement,
} = require("./incomeStatementService");

const {
  generateTaxSummary,
} = require("./taxSummaryReportService");

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

  switch (reportType) {
    case "income_statement":
      return await generateIncomeStatement(userId, period);

    case "tax_summary":
      return await generateTaxSummary(userId, period);

    default:
      throw new Error(`Unsupported report type: ${reportType}`);
  }
};

module.exports = {
  generateReport,
};