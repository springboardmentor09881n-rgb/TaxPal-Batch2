const { check, validationResult } = require('express-validator');

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation Error',
      errors: errors.array(),
    });
  }
  next();
};

const createTaxEstimateValidation = [
  check('country').notEmpty().withMessage('Country is required'),
  check('filingStatus')
    .isIn(['Single', 'Married', 'Married Separately', 'Head of Household'])
    .withMessage('Invalid filing status'),
  check('quarter')
    .isIn(['Q1', 'Q2', 'Q3', 'Q4'])
    .withMessage('Invalid quarter'),
  check('year').isInt({ min: 2000 }).withMessage('Valid year is required'),
  check('grossIncomeForQuarter')
    .isFloat({ min: 0 })
    .withMessage('Gross income cannot be negative'),
  check('businessExpenses').optional().isFloat({ min: 0 }),
  check('retirementContribution').optional().isFloat({ min: 0 }),
  check('healthInsurancePremiums').optional().isFloat({ min: 0 }),
  check('homeOfficeDeduction').optional().isFloat({ min: 0 }),
];

const updateTaxEstimateValidation = [
  check('country').optional().notEmpty().withMessage('Country cannot be empty'),
  check('filingStatus')
    .optional()
    .isIn(['Single', 'Married', 'Married Separately', 'Head of Household'])
    .withMessage('Invalid filing status'),
  check('quarter')
    .optional()
    .isIn(['Q1', 'Q2', 'Q3', 'Q4'])
    .withMessage('Invalid quarter'),
  check('year').optional().isInt({ min: 2000 }).withMessage('Valid year is required'),
  check('grossIncomeForQuarter')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Gross income cannot be negative'),
  check('businessExpenses').optional().isFloat({ min: 0 }),
  check('retirementContribution').optional().isFloat({ min: 0 }),
  check('healthInsurancePremiums').optional().isFloat({ min: 0 }),
  check('homeOfficeDeduction').optional().isFloat({ min: 0 }),
];

const taxEstimateIdValidation = [
  check('id').isMongoId().withMessage('Invalid Tax Estimate ID'),
];

module.exports = {
  validate,
  createTaxEstimateValidation,
  updateTaxEstimateValidation,
  taxEstimateIdValidation,
};
