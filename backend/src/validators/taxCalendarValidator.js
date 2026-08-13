const { query, param, validationResult } = require("express-validator");

// Validate year query parameter
const validateYear = [
  query("year")
    .optional()
    .isInt({ min: 2000, max: 2100 })
    .withMessage("Year must be between 2000 and 2100"),
];

// Validate quarter query parameter
const validateQuarter = [
  query("quarter")
    .optional()
    .isIn(["Q1", "Q2", "Q3", "Q4"])
    .withMessage("Quarter must be one of Q1, Q2, Q3 or Q4"),
];

// Validate reminder ID
const validateReminderId = [
  param("id")
    .isMongoId()
    .withMessage("Invalid reminder ID"),
];

// Common validation handler
const validate = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: errors.array(),
    });
  }

  next();
};

module.exports = {
  validateYear,
  validateQuarter,
  validateReminderId,
  validate,
};