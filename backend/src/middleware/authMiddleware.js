const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // Extract token
      token = req.headers.authorization.split(' ')[1];

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Find user and attach to request
      const user = await User.findById(decoded.id).select('name email');
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Not authorized. Invalid or expired token.'
        });
      }
      req.user = { id: user._id, email: user.email, name: user.name };

      next();
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized. Invalid or expired token.'
      });
    }
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized. Invalid or expired token.'
    });
  }
};

module.exports = { protect };
