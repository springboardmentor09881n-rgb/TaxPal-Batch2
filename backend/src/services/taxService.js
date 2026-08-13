const taxSlabs = require("../utils/taxSlabs");
const { getStateTaxRate } = require("../utils/stateTaxRates");

// National tax: quarterly taxable income -> annualize -> apply slabs -> back to quarterly
function calculateNationalTax(country, filingStatus, quarterlyTaxableIncome) {
  const slabs = taxSlabs[country]?.[filingStatus];
  if (!slabs) {
    throw new Error("Tax slabs not available for this country/filing status");
  }

  const annualTaxableIncome = quarterlyTaxableIncome * 4;

  let annualTax = 0;
  let previousLimit = 0;

  for (const slab of slabs) {
    if (annualTaxableIncome > previousLimit) {
      const taxableAtThisSlab =
        Math.min(annualTaxableIncome, slab.upTo) - previousLimit;
      annualTax += taxableAtThisSlab * slab.rate;
      previousLimit = slab.upTo;
    } else {
      break;
    }
  }

  return Math.round((annualTax / 4) * 100) / 100;
}

// State tax: flat rate, no slabs
function calculateStateTax(country, state, quarterlyTaxableIncome) {
  const rate = getStateTaxRate(country, state);
  const annualTaxableIncome = quarterlyTaxableIncome * 4;
  const annualStateTax = annualTaxableIncome * rate;
  return Math.round((annualStateTax / 4) * 100) / 100;
}

function getQuarterlyTaxableIncome(quarterlyGrossIncome, deductions) {
  const totalDeductions =
    (deductions.businessExpenses || 0) +
    (deductions.retirementContribution || 0) +
    (deductions.healthInsurancePremiums || 0) +
    (deductions.homeOfficeDeduction || 0);

  return {
    totalDeductions,
    taxableIncome: Math.max(0, quarterlyGrossIncome - totalDeductions),
  };
}

// Due dates per quarter (for a given year)
function getDueDateForQuarter(quarter, year) {
  const dueDates = {
    Q1: new Date(`${year}-04-15`),
    Q2: new Date(`${year}-06-15`),
    Q3: new Date(`${year}-09-15`),
    Q4: new Date(`${year + 1}-01-15`),
  };
  return dueDates[quarter];
}

function getQuarterlyDueDates(year) {
  return [
    { quarter: "Q1", dueDate: getDueDateForQuarter("Q1", year) },
    { quarter: "Q2", dueDate: getDueDateForQuarter("Q2", year) },
    { quarter: "Q3", dueDate: getDueDateForQuarter("Q3", year) },
    { quarter: "Q4", dueDate: getDueDateForQuarter("Q4", year) },
  ];
}

// Full summary — this is what the Tax Estimator page needs
function getFullTaxSummary({
  country,
  state,
  filingStatus,
  quarter,
  year,
  grossIncome,
  businessExpenses,
  retirementContribution,
  healthInsurancePremiums,
  homeOfficeDeduction,
}) {
  const { totalDeductions, taxableIncome } = getQuarterlyTaxableIncome(
    grossIncome,
    {
      businessExpenses,
      retirementContribution,
      healthInsurancePremiums,
      homeOfficeDeduction,
    },
  );

  const nationalTax = calculateNationalTax(
    country,
    filingStatus,
    taxableIncome,
  );
  const stateTax = calculateStateTax(country, state, taxableIncome);
  const totalEstimatedTax = Math.round((nationalTax + stateTax) * 100) / 100;
  const effectiveTaxRate =
    grossIncome > 0
      ? Math.round((totalEstimatedTax / grossIncome) * 10000) / 100
      : 0;
  const dueDate = getDueDateForQuarter(quarter, year);

  return {
    grossIncome,
    totalDeductions,
    taxableIncome,
    nationalTax,
    stateTax,
    totalEstimatedTax,
    effectiveTaxRate,
    quarter,
    dueDate,
  };
}

module.exports = {
  calculateNationalTax,
  calculateStateTax,
  getQuarterlyTaxableIncome,
  getDueDateForQuarter,
  getQuarterlyDueDates,
  getFullTaxSummary,
};
