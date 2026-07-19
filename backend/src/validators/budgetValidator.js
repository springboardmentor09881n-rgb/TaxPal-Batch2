const { check, validationResult } = require('express-validator');

const budgetValidation = [
  check('category', 'Category is required').not().isEmpty(),
  check('limit', 'Budget limit must be greater than 0').isFloat({ gt: 0 }),
  check('month', 'Month must be in YYYY-MM format').matches(/^\d{4}-(0[1-9]|1[0-2])$/),
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
  budgetValidation,
  validate
};
