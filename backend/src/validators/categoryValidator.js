const { check, validationResult } = require('express-validator');

const createCategoryValidation = [
  check('name', 'Name is required').not().isEmpty().trim(),
  check('type', 'Type must be either income or expense').isIn(['income', 'expense']),
  check('color', 'Color must be a valid hex code (e.g., #RRGGBB)')
    .optional()
    .matches(/^#([A-Fa-f0-9]{6})$/)
];

const updateCategoryValidation = [
  check('name')
    .optional()
    .notEmpty().withMessage('Name cannot be empty')
    .trim(),
  check('type', 'Type must be either income or expense')
    .optional()
    .isIn(['income', 'expense']),
  check('color', 'Color must be a valid hex code (e.g., #RRGGBB)')
    .optional()
    .matches(/^#([A-Fa-f0-9]{6})$/)
];

const categoryIdValidation = [
  check('id', 'Invalid category ID').isMongoId()
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
  createCategoryValidation,
  updateCategoryValidation,
  categoryIdValidation,
  validate
};
