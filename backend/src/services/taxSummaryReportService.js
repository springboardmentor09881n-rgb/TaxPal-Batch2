const TaxEstimate = require("../models/TaxEstimate");

const generateTaxSummary = async (userId, period) => {
  let query = { userId };

  const currentYear = new Date().getFullYear();

  if (period === "current_year") {
    query.year = currentYear;
  } else if (["q1", "q2", "q3", "q4"].includes(period)) {
    query.year = currentYear;
    query.quarter = period.toUpperCase();
  }

  const taxEstimates = await TaxEstimate.find(query).sort({
    dueDate: 1,
  });

  let totalGrossIncome = 0;
  let totalDeductions = 0;
  let totalTaxableIncome = 0;
  let totalEstimatedTax = 0;

  for (const estimate of taxEstimates) {
    totalGrossIncome += Number(estimate.grossIncomeForQuarter) || 0;
    totalDeductions += Number(estimate.totalDeductions) || 0;
    totalTaxableIncome += Number(estimate.taxableIncome) || 0;
    totalEstimatedTax += Number(estimate.estimatedTax) || 0;
  }

  return {
    period,
    year: currentYear,
    totalGrossIncome,
    totalDeductions,
    totalTaxableIncome,
    totalEstimatedTax,
    quarters: taxEstimates,
  };
};

module.exports = {
  generateTaxSummary,
};