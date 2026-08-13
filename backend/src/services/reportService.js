const Report = require("../models/Report");
const { resolvePeriod } = require("../utils/periodResolver");
const { getIncomeStatementData } = require("./incomeStatementService");
const { getTaxSummaryData } = require("./taxSummaryReportService");
const { getBudgetPerformanceData } = require("./budgetPerformanceService");
const { generateCSV, generatePDF } = require("../utils/exportUtils");

async function generateReport(
  userId,
  { reportType, period, format, year, month },
) {
  let reportData;
  let reportName;
  let periodLabel;

  if (reportType === "income_statement") {
    const { startDate, endDate, label } = resolvePeriod(period, year);
    periodLabel = label;
    reportData = await getIncomeStatementData(userId, startDate, endDate);
    reportName = `Income Statement - ${label}`;
  } else if (reportType === "tax_summary") {
    periodLabel = `${period} ${year}`;
    reportData = await getTaxSummaryData(userId, period, year);
    reportName = `Tax Summary - ${periodLabel}`;
  } else if (reportType === "budget_performance") {
    const { startDate, endDate, label } = resolvePeriod(period, year);
    periodLabel = label;
    reportData = await getBudgetPerformanceData(
      userId,
      month,
      startDate,
      endDate,
    );
    reportName = `Budget Performance - ${label}`;
  } else {
    throw new Error(`Unknown report type: ${reportType}`);
  }

  const safeFileName = `${reportType}_${userId}_${Date.now()}`;

  let filePath;
  if (format === "CSV") {
    const rows = flattenForCSV(reportType, reportData);
    filePath = generateCSV(safeFileName, rows);
  } else {
    const summaryLines = flattenForPDF(reportType, reportData);
    filePath = generatePDF(safeFileName, reportName, summaryLines);
  }

  const report = await Report.create({
    userId,
    reportName,
    reportType,
    period: periodLabel,
    format,
    filePath,
  });

  return report;
}

// Turns each report's data shape into flat rows for CSV export.
function flattenForCSV(reportType, data) {
  if (reportType === "income_statement") {
    return [
      ...data.incomeBreakdown.map((r) => ({
        type: "Income",
        category: r.category,
        amount: r.total,
      })),
      ...data.expenseBreakdown.map((r) => ({
        type: "Expense",
        category: r.category,
        amount: r.total,
      })),
    ];
  }
  if (reportType === "tax_summary") {
    return [data];
  }
  if (reportType === "budget_performance") {
    return data.categoryPerformance;
  }
  return [];
}

// Turns each report's data shape into readable text lines for PDF export.
function flattenForPDF(reportType, data) {
  if (reportType === "income_statement") {
    return [
      `Total Income: $${data.totalIncome}`,
      `Total Expenses: $${data.totalExpenses}`,
      `Net Income: $${data.netIncome}`,
    ];
  }
  if (reportType === "tax_summary") {
    return [
      `Gross Income: $${data.grossIncome}`,
      `Total Deductions: $${data.totalDeductions}`,
      `Taxable Income: $${data.taxableIncome}`,
      `Total Estimated Tax: $${data.totalEstimatedTax}`,
      `National Tax: $${data.nationalTax}`,
      `State Tax: $${data.stateTax}`,
      `Effective Tax Rate: ${data.effectiveTaxRate}%`,
      `Due Date: ${data.dueDate}`,
    ];
  }
  if (reportType === "budget_performance") {
    return [
      `Total Limit: $${data.totalLimit}`,
      `Total Actual Spent: $${data.totalActualSpent}`,
      `Remaining Balance: $${data.remainingBalance}`,
      `Over Budget: ${data.isOverBudget ? "Yes" : "No"}`,
    ];
  }
  return [];
}

module.exports = { generateReport };
