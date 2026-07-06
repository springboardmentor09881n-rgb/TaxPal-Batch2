const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { generateToken } = require('../utils/jwt');

const registerUser = async (userData) => {
  const { name, email, password, country, incomeBracket } = userData;

  // Check duplicate email
  const userExists = await User.findOne({ email });
  if (userExists) {
    const error = new Error('User already exists with this email');
    error.statusCode = 400;
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
    income_bracket: incomeBracket,
  });

  // Generate token
  const token = generateToken(user._id);

  // Exclude password from the returned object
  const { password: _pw, ...userWithoutPassword } = user.toObject();

  return {
    user: userWithoutPassword,
    token,
  };
};

const loginUser = async (email, password) => {
  // Find user
  const user = await User.findOne({ email });
  if (!user) {
    const error = new Error('Invalid credentials');
    error.statusCode = 401;
    throw error;
  }

  // Compare password
  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    const error = new Error('Invalid credentials');
    error.statusCode = 401;
    throw error;
  }

  // Generate token
  const token = generateToken(user._id);

  const { password: _pw, ...userWithoutPassword } = user.toObject();

  return {
    user: userWithoutPassword,
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
  return user;
};

module.exports = {
  registerUser,
  loginUser,
  getCurrentUser,
};
