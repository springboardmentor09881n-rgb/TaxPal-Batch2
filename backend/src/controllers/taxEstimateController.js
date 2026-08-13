const taxEstimateService = require('../services/taxEstimateService');

const createTaxEstimate = async (req, res, next) => {
  try {
    // Only explicitly whitelist input fields (prevent malicious injection of computed fields)
    const payload = {
      country: req.body.country,
      state: req.body.state,
      filingStatus: req.body.filingStatus,
      quarter: req.body.quarter,
      year: req.body.year,
      grossIncomeForQuarter: req.body.grossIncomeForQuarter,
      businessExpenses: req.body.businessExpenses,
      retirementContribution: req.body.retirementContribution,
      healthInsurancePremiums: req.body.healthInsurancePremiums,
      homeOfficeDeduction: req.body.homeOfficeDeduction,
    };

    const estimate = await taxEstimateService.createEstimate(req.user.id, payload);

    res.status(201).json({
      success: true,
      message: 'Tax estimate created successfully.',
      data: estimate,
    });
  } catch (error) {
    next(error);
  }
};

const getTaxEstimates = async (req, res, next) => {
  try {
    const estimates = await taxEstimateService.getEstimates(req.user.id);
    res.status(200).json({
      success: true,
      message: 'Tax estimates retrieved successfully.',
      data: estimates,
    });
  } catch (error) {
    next(error);
  }
};

const getTaxEstimateById = async (req, res, next) => {
  try {
    const estimate = await taxEstimateService.getEstimateById(req.params.id, req.user.id);
    res.status(200).json({
      success: true,
      message: 'Tax estimate retrieved successfully.',
      data: estimate,
    });
  } catch (error) {
    next(error);
  }
};

const updateTaxEstimate = async (req, res, next) => {
  try {
    const updateData = {};
    const allowedFields = [
      'country', 'state', 'filingStatus', 'quarter', 'year',
      'grossIncomeForQuarter', 'businessExpenses', 'retirementContribution',
      'healthInsurancePremiums', 'homeOfficeDeduction'
    ];

    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        updateData[field] = req.body[field];
      }
    });

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No fields provided for update.',
      });
    }

    const updatedEstimate = await taxEstimateService.updateEstimate(req.params.id, req.user.id, updateData);

    res.status(200).json({
      success: true,
      message: 'Tax estimate updated successfully.',
      data: updatedEstimate,
    });
  } catch (error) {
    next(error);
  }
};

const deleteTaxEstimate = async (req, res, next) => {
  try {
    const estimate = await taxEstimateService.deleteEstimate(req.params.id, req.user.id);
    res.status(200).json({
      success: true,
      message: 'Tax estimate deleted successfully.',
      data: estimate,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createTaxEstimate,
  getTaxEstimates,
  getTaxEstimateById,
  updateTaxEstimate,
  deleteTaxEstimate,
};
