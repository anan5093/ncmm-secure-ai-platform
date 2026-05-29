/**
 * Auth Routes
 * POST /api/v1/auth/login  — returns JWT
 * POST /api/v1/auth/verify — verify token validity
 */
const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

const JWT_SECRET = process.env.JWT_SECRET || 'change-this-to-a-secure-random-secret-min-32-chars';
const JWT_EXPIRY = process.env.JWT_EXPIRY || '8h';

// ABAC policy schema
const abacSchema = new mongoose.Schema({
  user_id:          { type: String, unique: true, required: true },
  username:         String,
  password_hash:    String, // bcrypt in production; plaintext dev placeholder
  role:             String,
  clearance_level:  Number,
  department:       String,
  assigned_port:    String,
  email:            String
}, { collection: 'abac_policies' });

let AbacPolicy;
function getAbacModel() {
  if (!AbacPolicy) AbacPolicy = mongoose.models.AbacPolicy || mongoose.model('AbacPolicy', abacSchema);
  return AbacPolicy;
}

/**
 * POST /api/v1/auth/login
 * Body: { username, password }
 * Returns: { token, user: { user_id, role, clearance_level, department } }
 */
router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'username and password are required' });
  }

  try {
    const AbacPolicy = getAbacModel();
    const user = await AbacPolicy.findOne({ username }).lean();

    if (!user) {
      // Timing-safe: don't reveal whether user exists
      return res.status(401).json({ error: 'Invalid credentials', code: 'INVALID_CREDENTIALS' });
    }

    // DEV: plain password check. Production: bcrypt.compare(password, user.password_hash)
    if (password !== user.password_hash) {
      return res.status(401).json({ error: 'Invalid credentials', code: 'INVALID_CREDENTIALS' });
    }

    const payload = {
      sub: user.user_id,
      user_id: user.user_id,
      username: user.username,
      role: user.role,
      clearance_level: user.clearance_level,
      department: user.department,
      assigned_port: user.assigned_port || null,
      iat: Math.floor(Date.now() / 1000)
    };

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRY });

    return res.json({
      token,
      user: {
        user_id: user.user_id,
        username: user.username,
        role: user.role,
        clearance_level: user.clearance_level,
        department: user.department,
        assigned_port: user.assigned_port || null
      }
    });
  } catch (err) {
    console.error('[AUTH] Login error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/v1/auth/verify
 * Verifies a token and returns decoded payload.
 */
router.post('/verify', (req, res) => {
  const authHeader = req.headers['authorization'];
  if (!authHeader) return res.status(401).json({ error: 'No token provided' });

  const token = authHeader.replace(/^Bearer\s+/i, '');
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return res.json({ valid: true, user: decoded });
  } catch (err) {
    return res.status(401).json({ valid: false, error: err.message });
  }
});

module.exports = router;
