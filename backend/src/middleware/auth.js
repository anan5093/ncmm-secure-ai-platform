/**
 * JWT Authentication Middleware
 */
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'change-this-to-a-secure-random-secret-min-32-chars';

/**
 * Verify Bearer JWT on all protected routes.
 * Attaches decoded user to req.user.
 */
function authenticateJWT(req, res, next) {
  const authHeader = req.headers['authorization'];

  if (!authHeader) {
    return res.status(401).json({
      error: 'Authentication required',
      code: 'MISSING_AUTH_HEADER'
    });
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0].toLowerCase() !== 'bearer') {
    return res.status(401).json({
      error: 'Invalid Authorization header format. Expected: Bearer <token>',
      code: 'INVALID_AUTH_FORMAT'
    });
  }

  const token = parts[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: 'Token has expired',
        code: 'TOKEN_EXPIRED'
      });
    }
    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({
        error: 'Invalid token',
        code: 'INVALID_TOKEN'
      });
    }
    return res.status(401).json({
      error: 'Authentication failed',
      code: 'AUTH_FAILED'
    });
  }
}

/**
 * Role-based access control middleware.
 * Usage: requireRole('ROLE_SYSADMIN') or requireRole(['ROLE_LOGISTICS_ANALYST', 'ROLE_MISSION_DIRECTOR'])
 */
function requireRole(roles) {
  const allowedRoles = Array.isArray(roles) ? roles : [roles];
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated', code: 'NOT_AUTHENTICATED' });
    }
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: 'Insufficient role',
        code: 'ROLE_FORBIDDEN',
        required: allowedRoles,
        actual: req.user.role
      });
    }
    next();
  };
}

module.exports = { authenticateJWT, requireRole };
