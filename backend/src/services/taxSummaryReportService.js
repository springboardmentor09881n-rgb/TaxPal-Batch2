const TaxEstimate = require("../models/TaxEstimate");

// Pulls the saved TaxEstimate for the selected quarter/year and
// reshapes it into the fields the Tax Summary report needs.
async function getTaxSummaryData(userId, quarter, year) {
  const estimate = await TaxEstimate.findOne({ userId, quarter, year }).sort({
    createdAt: -1,
  });

  if (!estimate) {
    throw new Error(`No tax estimate found for ${quarter} ${year}`);
  }

  return {
    grossIncome: estimate.grossIncomeForQuarter,
    totalDeductions: estimate.totalDeductions,
    taxableIncome: estimate.taxableIncome,
    totalEstimatedTax: estimate.estimatedTax,
    deductionsBreakdown: {
      businessExpenses: estimate.businessExpenses,
      retirementContribution: estimate.retirementContribution,
      healthInsurancePremiums: estimate.healthInsurancePremiums,
      homeOfficeDeduction: estimate.homeOfficeDeduction,
    },
    nationalTax: estimate.nationalTax,
    stateTax: estimate.stateTax,
    effectiveTaxRate: estimate.effectiveTaxRate,
    dueDate: estimate.dueDate,
  };
}

module.exports = { getTaxSummaryData };
