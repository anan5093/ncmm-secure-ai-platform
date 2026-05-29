/**
 * Unit Test: JWT Validator
 */
const { makeToken, makeExpiredToken, makeTamperedToken, JWT_SECRET, USERS } = require('../fixtures/jwtFixtures');
const jwt = require('jsonwebtoken');

// Inline the middleware function logic for unit testing
function verifyToken(token) {
  return jwt.verify(token, JWT_SECRET);
}

describe('JWT Validator', () => {

  // ── Valid tokens ───────────────────────────────────────────────────────────
  test('valid JWT decodes correctly for ROLE_PORT_INSPECTOR', () => {
    const token = makeToken('PORT_INSPECTOR_VIZAG');
    const decoded = verifyToken(token);
    expect(decoded.role).toBe('ROLE_PORT_INSPECTOR');
    expect(decoded.department).toBe('PORT_OPS');
    expect(decoded.assigned_port).toBe('VIZAG');
  });

  test('valid JWT contains all required NCMM fields', () => {
    const token = makeToken('LOGISTICS_ANALYST');
    const decoded = verifyToken(token);
    expect(decoded).toHaveProperty('user_id');
    expect(decoded).toHaveProperty('role');
    expect(decoded).toHaveProperty('clearance_level');
    expect(decoded).toHaveProperty('department');
  });

  test('valid JWT for MISSION_DIRECTOR has clearance_level 5', () => {
    const token = makeToken('MISSION_DIRECTOR');
    const decoded = verifyToken(token);
    expect(decoded.clearance_level).toBe(5);
  });

  test('valid JWT for SYSADMIN has role ROLE_SYSADMIN', () => {
    const token = makeToken('SYSADMIN');
    const decoded = verifyToken(token);
    expect(decoded.role).toBe('ROLE_SYSADMIN');
  });

  // ── Expired tokens ────────────────────────────────────────────────────────
  test('expired JWT throws TokenExpiredError', () => {
    const token = makeExpiredToken('PORT_INSPECTOR_VIZAG');
    expect(() => verifyToken(token)).toThrow('jwt expired');
  });

  test('expired JWT error name is TokenExpiredError', () => {
    const token = makeExpiredToken('LOGISTICS_ANALYST');
    try {
      verifyToken(token);
      fail('Should have thrown');
    } catch (err) {
      expect(err.name).toBe('TokenExpiredError');
    }
  });

  // ── Tampered tokens ───────────────────────────────────────────────────────
  test('tampered JWT throws JsonWebTokenError', () => {
    const token = makeTamperedToken('PORT_INSPECTOR_JNPT');
    expect(() => verifyToken(token)).toThrow();
  });

  test('token with wrong secret is rejected', () => {
    const token = jwt.sign({ user_id: 'hacker', role: 'ROLE_MISSION_DIRECTOR' }, 'wrong-secret');
    expect(() => verifyToken(token)).toThrow();
  });

  test('completely invalid token string is rejected', () => {
    expect(() => verifyToken('not.a.jwt')).toThrow();
  });

  test('empty string token is rejected', () => {
    expect(() => verifyToken('')).toThrow();
  });

  // ── Clearance levels in all roles ─────────────────────────────────────────
  test('all 6 user roles have correct clearance levels', () => {
    expect(USERS.PORT_INSPECTOR_VIZAG.clearance_level).toBe(2);
    expect(USERS.PORT_INSPECTOR_JNPT.clearance_level).toBe(2);
    expect(USERS.LOGISTICS_ANALYST.clearance_level).toBe(3);
    expect(USERS.MISSION_DIRECTOR.clearance_level).toBe(5);
    expect(USERS.SYSADMIN.clearance_level).toBe(1);
    expect(USERS.UNPRIVILEGED.clearance_level).toBe(0);
  });

  test('makeToken generates different tokens for different roles', () => {
    const t1 = makeToken('PORT_INSPECTOR_VIZAG');
    const t2 = makeToken('MISSION_DIRECTOR');
    expect(t1).not.toBe(t2);
  });
});
