const jwt = require('jsonwebtoken');
const { supabase } = require('../config/supabase');

const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ message: 'Access denied. No token provided.' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // For Supabase, we'll just use the userId from the token
    // In a full implementation, you'd verify the user exists in Supabase
    req.userId = decoded.userId;
    req.user = { id: decoded.userId }; // Minimal user object for compatibility
    
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Invalid token.' });
    } else if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expired.' });
    } else {
      console.error('Auth middleware error:', error);
      return res.status(500).json({ message: 'Server error during authentication.' });
    }
  }
};

const adminAuth = async (req, res, next) => {
  try {
    await auth(req, res, () => {
      if (req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Access denied. Admin privileges required.' });
      }
      next();
    });
  } catch (error) {
    return res.status(500).json({ message: 'Server error during admin authentication.' });
  }
};

module.exports = {
  auth,
  adminAuth
};