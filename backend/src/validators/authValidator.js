const { check, validationResult } = require('express-validator');

const registerValidation = [
  check('email', 'Please include a valid email').isEmail(),
  check('username', 'Username is required').not().isEmpty(),
  check('password', 'Please enter a password with 6 or more characters').isLength({ min: 6 }),
  check('country', 'Country is required').not().isEmpty(),
  check('incomeBracket', 'Invalid income bracket').optional({ checkFalsy: true }).isIn(['low', 'middle', 'high']),
  check().custom((value, { req }) => {
    if (!req.body.name && !req.body.fullName) {
      throw new Error('Name or fullName is required');
    }
    return true;
  })
];

const loginValidation = [
  check().custom((value, { req }) => {
    if (!req.body.email && !req.body.username && !req.body.identifier) {
      throw new Error('Please provide email, username, or identifier');
    }
    return true;
  }),
  check('password', 'Password is required').exists(),
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
  registerValidation,
  loginValidation,
  validate
};
