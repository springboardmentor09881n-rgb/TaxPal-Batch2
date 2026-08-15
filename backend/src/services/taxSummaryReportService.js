const TaxEstimate = require("../models/TaxEstimate");

const generateTaxSummary = async (userId, period) => {
  const currentYear = new Date().getFullYear();

  const query = {
    userId,
    year: currentYear,
    quarter: period.toUpperCase(),
  };

  const taxEstimates = await TaxEstimate.find(query).sort({
    dueDate: 1,
  });

  let totalGrossIncome = 0;
  let totalDeductions = 0;
  let totalTaxableIncome = 0;
  let totalEstimatedTax = 0;
  let totalNationalTax = 0;
  let totalStateTax = 0;

  for (const estimate of taxEstimates) {
    totalGrossIncome += Number(estimate.grossIncomeForQuarter) || 0;
    totalDeductions += Number(estimate.totalDeductions) || 0;
    totalTaxableIncome += Number(estimate.taxableIncome) || 0;
    totalEstimatedTax += Number(estimate.estimatedTax) || 0;
    totalNationalTax += Number(estimate.nationalTax) || 0;
    totalStateTax += Number(estimate.stateTax) || 0;
  }

  const effectiveTaxRate =
    totalGrossIncome > 0
      ? Math.round(
          (totalEstimatedTax / totalGrossIncome) * 10000
        ) / 100
      : 0;

  const dueDate =
    taxEstimates.length > 0
      ? taxEstimates[0].dueDate
      : null;

  return {
    period,
    year: currentYear,

    totalGrossIncome,
    totalDeductions,
    totalTaxableIncome,

    totalEstimatedTax,
    totalNationalTax,
    totalStateTax,
    effectiveTaxRate,

    dueDate,

    quarters: taxEstimates,
  };
};

module.exports = {
  generateTaxSummary,
};