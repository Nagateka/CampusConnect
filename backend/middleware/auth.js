// middleware/auth.js
const jwt = require('jsonwebtoken');

function auth(req, res, next) {
  const header = req.headers['authorization'];
  const token  = header && header.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Access denied. Please sign in.' });
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    res.status(403).json({ message: 'Session expired. Please sign in again.' });
  }
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user?.role))
      return res.status(403).json({ message: 'You do not have permission to perform this action.' });
    next();
  };
}

module.exports = { auth, requireRole };