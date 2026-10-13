const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'climashield_tn_enterprise_jwt_secret_2026';

function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      error: 'Authentication Required: Missing or malformed Bearer token.',
    });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      error: 'Invalid or Expired JWT Token. Please re-authenticate.',
    });
  }
}

module.exports = {
  authMiddleware,
  JWT_SECRET,
};
