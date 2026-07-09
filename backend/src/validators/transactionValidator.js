const { check, validationResult } = require('express-validator');

const transactionValidation = [
  check('type', 'Type must be either income or expense').isIn(['income', 'expense']),
  check('category', 'Category is required').not().isEmpty(),
  check('amount', 'Amount must be a positive number').isFloat({ gt: 0 }),
  check('date', 'Date must be a valid date').isISO8601(),
  check('description').optional().isString(),
  check('notes').optional().isString(),
];

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation Error',
      errors: errors.array()
    });
  }
  next();
};

module.exports = {
  transactionValidation,
  validate
};
