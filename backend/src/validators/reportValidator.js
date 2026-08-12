const { check, param, validationResult } = require("express-validator");
const mongoose = require("mongoose");

const reportGenerationValidation = [
  check("reportType", "Invalid or missing reportType")
    .not()
    .isEmpty()
    .isIn(["income_statement", "tax_summary", "budget_performance"]),
  
  check("period", "Invalid or missing period")
    .not()
    .isEmpty()
    .isIn(["current_month", "last_month", "q1", "q2", "q3", "q4", "current_year"]),

  check("format", "Invalid or missing format")
    .not()
    .isEmpty()
    .isIn(["PDF", "CSV"]),

  check("year", "Year must be a valid number")
    .optional()
    .isInt({ min: 1900, max: 2100 }),

  // Custom validation for tax_summary period restriction
  check("period").custom((value, { req }) => {
    if (req.body.reportType === "tax_summary") {
      const allowedQuarters = ["q1", "q2", "q3", "q4"];
      if (!allowedQuarters.includes(value)) {
        throw new Error("Tax Summary reports are only valid for quarters (q1, q2, q3, q4)");
      }
    }
    return true;
  }),
];

const reportIdValidation = [
  param("id", "Invalid report ID").custom((value) => {
    if (!mongoose.Types.ObjectId.isValid(value)) {
      throw new Error("Invalid MongoDB ObjectId");
    }
    return true;
  }),
];

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: "Validation Error",
      errors: errors.array(),
    });
  }
  next();
};

module.exports = {
  reportGenerationValidation,
  reportIdValidation,
  validate,
};
