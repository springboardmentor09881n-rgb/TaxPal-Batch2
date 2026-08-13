const TaxEstimate = require('../models/TaxEstimate');
const { getFullTaxSummary } = require('./taxService');

const formatTaxEstimate = (estimate) => {
  const obj = estimate.toObject();
  obj.id = obj._id;
  delete obj._id;
  delete obj.__v;
  return obj;
};

const mapAndCalculate = (payload) => {
  // Field Mapping: Engine Input (grossIncome) -> Database Field (grossIncomeForQuarter)
  const engineInput = {
    ...payload,
    grossIncome: payload.grossIncomeForQuarter,
  };
  
  // Call the calculation engine (taxService.js)
  const summary = getFullTaxSummary(engineInput);
  
  // Field Mapping: Engine Output (totalEstimatedTax) -> Database Field (estimatedTax)
  const dbData = {
    ...payload,
    totalDeductions: summary.totalDeductions,
    taxableIncome: summary.taxableIncome,
    nationalTax: summary.nationalTax,
    stateTax: summary.stateTax,
    estimatedTax: summary.totalEstimatedTax, 
    effectiveTaxRate: summary.effectiveTaxRate,
    dueDate: summary.dueDate,
  };
  
  return dbData;
};

const createEstimate = async (userId, payload) => {
  const data = mapAndCalculate(payload);
  data.userId = userId;
  const estimate = await TaxEstimate.create(data);
  return formatTaxEstimate(estimate);
};

const getEstimates = async (userId) => {
  const estimates = await TaxEstimate.find({ userId }).sort({ year: -1, quarter: 1 });
  return estimates.map(formatTaxEstimate);
};

const getEstimateById = async (id, userId) => {
  const estimate = await TaxEstimate.findOne({ _id: id, userId });
  if (!estimate) {
    const error = new Error('Tax Estimate not found');
    error.statusCode = 404;
    throw error;
  }
  return formatTaxEstimate(estimate);
};

const updateEstimate = async (id, userId, updateData) => {
  // Load the existing document
  const estimate = await TaxEstimate.findOne({ _id: id, userId });
  if (!estimate) {
    const error = new Error('Tax Estimate not found');
    error.statusCode = 404;
    throw error;
  }

  // Merge incoming updates
  const mergedPayload = {
    country: updateData.country !== undefined ? updateData.country : estimate.country,
    state: updateData.state !== undefined ? updateData.state : estimate.state,
    filingStatus: updateData.filingStatus !== undefined ? updateData.filingStatus : estimate.filingStatus,
    quarter: updateData.quarter !== undefined ? updateData.quarter : estimate.quarter,
    year: updateData.year !== undefined ? updateData.year : estimate.year,
    grossIncomeForQuarter: updateData.grossIncomeForQuarter !== undefined ? updateData.grossIncomeForQuarter : estimate.grossIncomeForQuarter,
    businessExpenses: updateData.businessExpenses !== undefined ? updateData.businessExpenses : estimate.businessExpenses,
    retirementContribution: updateData.retirementContribution !== undefined ? updateData.retirementContribution : estimate.retirementContribution,
    healthInsurancePremiums: updateData.healthInsurancePremiums !== undefined ? updateData.healthInsurancePremiums : estimate.healthInsurancePremiums,
    homeOfficeDeduction: updateData.homeOfficeDeduction !== undefined ? updateData.homeOfficeDeduction : estimate.homeOfficeDeduction,
  };

  // Recalculate using getFullTaxSummary() and update computed fields
  const calculatedData = mapAndCalculate(mergedPayload);
  
  // Save
  const updatedEstimate = await TaxEstimate.findOneAndUpdate(
    { _id: id, userId },
    calculatedData,
    { new: true, runValidators: true }
  );

  // Return the updated object
  return formatTaxEstimate(updatedEstimate);
};

const deleteEstimate = async (id, userId) => {
  const estimate = await TaxEstimate.findOneAndDelete({ _id: id, userId });
  if (!estimate) {
    const error = new Error('Tax Estimate not found');
    error.statusCode = 404;
    throw error;
  }
  return formatTaxEstimate(estimate);
};

module.exports = {
  createEstimate,
  getEstimates,
  getEstimateById,
  updateEstimate,
  deleteEstimate,
};
