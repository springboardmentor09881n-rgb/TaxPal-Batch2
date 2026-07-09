const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { generateToken } = require('../utils/jwt');

const formatUserResponse = (user) => {
  return {
    id: user._id,
    name: user.name,
    fullName: user.name,
    username: user.username,
    email: user.email,
    country: user.country,
    incomeBracket: user.income_bracket
  };
};

const registerUser = async (userData) => {
  const { username, name, fullName, email, password, country, incomeBracket, income_bracket } = userData;

  const actualName = fullName || name;
  const actualIncomeBracket = (incomeBracket || income_bracket || "").toLowerCase();

  // Check duplicate email or username
  const userExists = await User.findOne({ $or: [{ email }, { username }] });
  if (userExists) {
    const error = new Error('User with this email or username already exists.');
    error.statusCode = 409;
    throw error;
  }

  // Hash password
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  // Create new user
  const user = await User.create({
    name: actualName,
    username,
    email,
    password: hashedPassword,
    country,
    income_bracket: actualIncomeBracket,
  });

  // Generate token
  const token = generateToken(user._id);

  return {
    user: formatUserResponse(user),
    token,
  };
};

const loginUser = async (identifier, password) => {
  // Find user by email OR username
  const user = await User.findOne({
    $or: [{ email: identifier }, { username: identifier }]
  });
  
  if (!user) {
    const error = new Error('Invalid email, username, or password.');
    error.statusCode = 401;
    throw error;
  }

  // Compare password
  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    const error = new Error('Invalid email, username, or password.');
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
