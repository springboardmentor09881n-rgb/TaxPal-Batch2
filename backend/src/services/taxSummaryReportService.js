const TaxEstimate = require("../models/TaxEstimate");

const generateTaxSummary = async (userId, period) => {
  const currentYear = new Date().getFullYear();

  const query = {
    userId,
    year: currentYear,
  };

  if (["q1", "q2", "q3", "q4"].includes(period)) {
    query.quarter = period.toUpperCase();
  }

  const taxEstimates = await TaxEstimate.find(query).sort({
    dueDate: 1,
  });

  let totalGrossIncome = 0;
  let totalDeductions = 0;
  let totalEstimatedTax = 0;

  for (const estimate of taxEstimates) {
    totalGrossIncome += Number(estimate.grossIncome) || 0;
    totalDeductions += Number(estimate.deductions) || 0;
    totalEstimatedTax += Number(estimate.estimatedTax) || 0;
  }

  const totalTaxableIncome = totalGrossIncome - totalDeductions;

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