/**
 * Test fixtures — JWT tokens for all 6 NCMM roles
 * Used in unit, adversarial, security, and e2e tests.
 */
require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });

const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'change-this-to-a-secure-random-secret-min-32-chars';

const USERS = {
  PORT_INSPECTOR_VIZAG: {
    user_id: 'test-pi-vizag-001',
    username: 'r.sharma',
    role: 'ROLE_PORT_INSPECTOR',
    clearance_level: 2,
    department: 'PORT_OPS',
    assigned_port: 'VIZAG'
  },
  PORT_INSPECTOR_JNPT: {
    user_id: 'test-pi-jnpt-002',
    username: 'a.mehta',
    role: 'ROLE_PORT_INSPECTOR',
    clearance_level: 2,
    department: 'PORT_OPS',
    assigned_port: 'JNPT'
  },
  LOGISTICS_ANALYST: {
    user_id: 'test-la-003',
    username: 'p.krishnan',
    role: 'ROLE_LOGISTICS_ANALYST',
    clearance_level: 3,
    department: 'LOGISTICS'
  },
  MISSION_DIRECTOR: {
    user_id: 'test-md-004',
    username: 's.iyer',
    role: 'ROLE_MISSION_DIRECTOR',
    clearance_level: 5,
    department: 'MISSION_HQ'
  },
  SYSADMIN: {
    user_id: 'test-sa-005',
    username: 'admin',
    role: 'ROLE_SYSADMIN',
    clearance_level: 1,
    department: 'IT_OPS'
  },
  UNPRIVILEGED: {
    user_id: 'test-up-006',
    username: 'guest.user',
    role: 'ROLE_VIEWER',
    clearance_level: 0,
    department: 'NONE'
  }
};

/**
 * Generate a valid JWT for a user role.
 */
function makeToken(userKey, expiresIn = '8h') {
  const user = USERS[userKey];
  if (!user) throw new Error(`Unknown user key: ${userKey}`);
  return jwt.sign({ ...user, sub: user.user_id }, JWT_SECRET, { expiresIn });
}

/**
 * Generate an expired JWT.
 */
function makeExpiredToken(userKey) {
  return makeToken(userKey, '-1s'); // expired 1 second ago
}

/**
 * Generate a tampered JWT (valid structure, invalid signature).
 */
function makeTamperedToken(userKey) {
  const token = makeToken(userKey);
  const parts = token.split('.');
  // Flip a byte in the signature
  parts[2] = parts[2].split('').reverse().join('');
  return parts.join('.');
}

const TOKENS = {};
Object.keys(USERS).forEach(key => {
  TOKENS[key] = makeToken(key);
});

module.exports = { USERS, TOKENS, makeToken, makeExpiredToken, makeTamperedToken, JWT_SECRET };
