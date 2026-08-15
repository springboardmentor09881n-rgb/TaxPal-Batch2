const fs = require("fs");

const Report = require("../models/Report");

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
  getPeriodRange,
  isQuarterPeriod,
} = require("../utils/periodResolver");

const {
  generateCSV,
  generatePDF,
} = require("../utils/exportUtils");


const VALID_REPORT_TYPES = [
  "income_statement",
  "tax_summary",
  "budget_performance",
];

const VALID_PERIODS = [
  "current_month",
  "last_month",
  "q1",
  "q2",
  "q3",
  "q4",
  "current_year",
];

const VALID_FORMATS = ["PDF", "CSV"];


/*
 * Validate common report parameters.
 */
const validateReportParams = (reportType, period, format) => {
  if (!VALID_REPORT_TYPES.includes(reportType)) {
    throw new Error(`Unsupported report type: ${reportType}`);
  }

  if (!VALID_PERIODS.includes(period)) {
    throw new Error(`Unsupported period: ${period}`);
  }

  if (!VALID_FORMATS.includes(format)) {
    throw new Error("Format must be PDF or CSV");
  }

  if (reportType === "tax_summary" && !isQuarterPeriod(period)) {
    throw new Error(
      "Tax summary reports only support quarterly periods: q1, q2, q3, q4"
    );
  }
};


/*
 * Generate the actual calculated report data.
 *
 * This function does NOT calculate anything itself.
 * It delegates to the existing report-specific services.
 */
const getReportData = async (userId, reportType, period) => {
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


/*
 * Convert report data into rows suitable for CSV.
 */
const flattenForCSV = (reportType, data) => {
  if (reportType === "income_statement") {
    return [
      ...Object.entries(data.incomeBreakdown || {}).map(
        ([category, amount]) => ({
          type: "Income",
          category,
          amount,
        })
      ),

      ...Object.entries(data.expenseBreakdown || {}).map(
        ([category, amount]) => ({
          type: "Expense",
          category,
          amount,
        })
      ),
    ];
  }

  if (reportType === "tax_summary") {
    return [
      {
        period: data.period,
        year: data.year,
        totalGrossIncome: data.totalGrossIncome,
        totalDeductions: data.totalDeductions,
        totalTaxableIncome: data.totalTaxableIncome,
        totalEstimatedTax: data.totalEstimatedTax,
      },
    ];
  }

  if (reportType === "budget_performance") {
    return Object.entries(data.categoryPerformance || {}).map(
      ([category, performance]) => ({
        category,
        limit: performance.limit,
        spent: performance.spent,
        variance: performance.variance,
        status: performance.status,
      })
    );
  }

  return [];
};


/*
 * Convert report data into readable PDF lines.
 */
const flattenForPDF = (reportType, data) => {
  if (reportType === "income_statement") {
    return [
      `Period: ${data.period}`,
      `Total Income: ${data.totalIncome}`,
      `Total Expenses: ${data.totalExpenses}`,
      `Net Income: ${data.netIncome}`,
    ];
  }

  if (reportType === "tax_summary") {
    return [
      `Period: ${data.period}`,
      `Year: ${data.year}`,
      `Gross Income: ${data.totalGrossIncome}`,
      `Total Deductions: ${data.totalDeductions}`,
      `Taxable Income: ${data.totalTaxableIncome}`,
      `Estimated Tax: ${data.totalEstimatedTax}`,
    ];
  }

  if (reportType === "budget_performance") {
    return [
      `Period: ${data.period}`,
      `Total Limit: ${data.totalLimit}`,
      `Total Actual Spent: ${data.totalActualSpent}`,
      `Remaining Balance: ${data.remainingBalance}`,
      `Over Budget: ${data.overBudget ? "Yes" : "No"}`,
    ];
  }

  return [];
};


/*
 * Generate a new report.
 *
 * Returns:
 * Report metadata + calculated report data.
 */
const generateReport = async (
  userId,
  reportType,
  period,
  format = "PDF"
) => {
  if (!userId) {
    throw new Error("User ID is required");
  }

  if (!reportType) {
    throw new Error("Report type is required");
  }

  if (!period) {
    throw new Error("Period is required");
  }

  validateReportParams(reportType, period, format);

  // Existing services perform all calculations.
  const reportData = await getReportData(
    userId,
    reportType,
    period
  );

  const reportName =
    `${reportType.replace(/_/g, " ")} - ${period}`;


  // Generate export file.
  const safeFileName =
    `${reportType}_${userId}_${Date.now()}`;

  let filePath;

  if (format === "CSV") {
    const rows = flattenForCSV(reportType, reportData);

    filePath = generateCSV(
      safeFileName,
      rows
    );
  } else {
    const summaryLines = flattenForPDF(
      reportType,
      reportData
    );

    filePath = generatePDF(
      safeFileName,
      reportName,
      summaryLines
    );
  }


  // Store only report metadata in MongoDB.
  const report = await Report.create({
    userId,
    reportName,
    reportType,
    period,
    format,
    filePath,
  });


  // Return metadata + calculated data.
  return {
    ...report.toJSON(),
    id: report._id,
    data: reportData,
  };
};


/*
 * Historical report preview.
 *
 * Does NOT create another Report.
 * Does NOT generate PDF/CSV.
 *
 * It retrieves the existing report metadata and
 * recalculates the logical report data using the
 * existing calculation service.
 */
const getReportPreview = async (reportId, userId) => {
  if (!reportId) {
    throw new Error("Report ID is required");
  }

  if (!userId) {
    throw new Error("User ID is required");
  }

  const report = await Report.findOne({
    _id: reportId,
    userId,
  });

  if (!report) {
    const error = new Error("Report not found");
    error.statusCode = 404;
    throw error;
  }


  /*
   * The current Report schema stores the period as a string.
   * The generation service stores values such as "q1".
   *
   * Therefore use the stored period directly when possible.
   */
  let period = report.period;

  /*
   * If the stored period contains a label such as
   * "q1 2026", extract the quarter.
   */
  const quarterMatch = String(period)
    .toLowerCase()
    .match(/\bq[1-4]\b/);

  if (quarterMatch) {
    period = quarterMatch[0];
  } else {
    const supportedPeriod = VALID_PERIODS.find(
      (value) =>
        String(period).toLowerCase() === value
    );

    if (supportedPeriod) {
      period = supportedPeriod;
    }
  }


  /*
   * Resolve/validate the period using the existing
   * period resolver.
   */
  getPeriodRange(period);


  const reportData = await getReportData(
    userId,
    report.reportType,
    period
  );


  return {
    id: report._id,
    reportType: report.reportType,
    period: report.period,
    format: report.format,
    generatedDate: report.createdAt,
    filePath: report.filePath,
    data: reportData,
  };
};


/*
 * Verify that the stored generated file still exists.
 */
const verifyReportFile = async (reportId, userId) => {
  const report = await Report.findOne({
    _id: reportId,
    userId,
  });

  if (!report) {
    const error = new Error("Report not found");
    error.statusCode = 404;
    throw error;
  }

  if (!fs.existsSync(report.filePath)) {
    const error = new Error("Generated report file not found");
    error.statusCode = 404;
    throw error;
  }

  return report;
};


module.exports = {
  generateReport,
  getReportPreview,
  verifyReportFile,
};