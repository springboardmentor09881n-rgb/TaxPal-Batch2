const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { generateToken } = require('../utils/jwt');

const formatUserResponse = (user) => {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    country: user.country,
    incomeBracket: user.income_bracket
  };
};

const registerUser = async (userData) => {
  const { name, email, password, country, incomeBracket } = userData;

const normalizedIncomeBracket = incomeBracket
  ? incomeBracket.toLowerCase()
  : "";

  // Check duplicate email
  const userExists = await User.findOne({ email });
  if (userExists) {
    const error = new Error('User with this email already exists.');
    error.statusCode = 409;
    throw error;
  }

  // Hash password
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  // Create new user
  const user = await User.create({
    name,
    email,
    password: hashedPassword,
    country,
    income_bracket: normalizedIncomeBracket,
  });

  // Generate token
  const token = generateToken(user._id);

  // Exclude password and map fields for the returned object
  return {
    user: formatUserResponse(user),
    token,
  };
};

const loginUser = async (email, password) => {
  // Find user
  const user = await User.findOne({ email });
  if (!user) {
    const error = new Error('Invalid email or password.');
    error.statusCode = 401;
    throw error;
  }

  // Compare password
  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    const error = new Error('Invalid email or password.');
    error.statusCode = 401;
    throw error;
  }

  // Generate token
  const token = generateToken(user._id);

  return {
    user: formatUserResponse(user),
    token,
  };
};

const getCurrentUser = async (userId) => {
  const user = await User.findById(userId).select('-password');
  if (!user) {
    const error = new Error('User not found');
    error.statusCode = 404;
    throw error;
  }
  return formatUserResponse(user);
};

module.exports = {
  registerUser,
  loginUser,
  getCurrentUser,
};
