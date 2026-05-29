/**
 * Adversarial Test: ABAC Bypass Attempts
 * Level-1 user querying Level-5 documents must get 0 L5 citations.
 * Tests the OPA policy evaluation logic directly.
 */
const { evaluateOPA } = require('../../backend/src/middleware/abac');

// Note: These tests require OPA to be running (docker-compose up -d)
// They test the OPA REST API directly

const PORT_INSPECTOR_VIZAG = {
  clearance_level: 2,
  department: 'PORT_OPS',
  role: 'ROLE_PORT_INSPECTOR',
  assigned_port: 'VIZAG'
};

const LOGISTICS_ANALYST = {
  clearance_level: 3,
  department: 'LOGISTICS',
  role: 'ROLE_LOGISTICS_ANALYST'
};

const MISSION_DIRECTOR = {
  clearance_level: 5,
  department: 'MISSION_HQ',
  role: 'ROLE_MISSION_DIRECTOR'
};

const SYSADMIN = {
  clearance_level: 1,
  department: 'IT_OPS',
  role: 'ROLE_SYSADMIN'
};

describe('ABAC Bypass Attempts (requires OPA running)', () => {

  const makeInput = (user, doc) => ({
    user,
    document: doc,
    resource: { type: 'document' }
  });

  // ── L1 user cannot access L5 documents ────────────────────────────────────
  test('Port Inspector (CL2) cannot access Mission HQ CL5 intelligence', async () => {
    const input = makeInput(PORT_INSPECTOR_VIZAG, {
      clearance_level: 5,
      department: 'MISSION_HQ',
      document_category: 'intelligence_report'
    });
    const decision = await evaluateOPA(input);
    expect(decision.allow).toBe(false);
  });

  test('Port Inspector (CL2) cannot access Logistics CL3 documents', async () => {
    const input = makeInput(PORT_INSPECTOR_VIZAG, {
      clearance_level: 3,
      department: 'LOGISTICS',
      document_category: 'stockpile_assessment'
    });
    const decision = await evaluateOPA(input);
    expect(decision.allow).toBe(false);
  });

  // ── Port isolation (different port) ───────────────────────────────────────
  test('VIZAG inspector cannot access JNPT manifests', async () => {
    const input = makeInput(PORT_INSPECTOR_VIZAG, {
      clearance_level: 1,
      department: 'PORT_OPS',
      port_code: 'JNPT',
      document_category: 'port_manifest'
    });
    const decision = await evaluateOPA(input);
    expect(decision.allow).toBe(false);
  });

  test('VIZAG inspector CAN access VIZAG manifests', async () => {
    const input = makeInput(PORT_INSPECTOR_VIZAG, {
      clearance_level: 1,
      department: 'PORT_OPS',
      port_code: 'VIZAG',
      document_category: 'port_manifest'
    });
    const decision = await evaluateOPA(input);
    expect(decision.allow).toBe(true);
  });

  // ── Department isolation ───────────────────────────────────────────────────
  test('Logistics Analyst cannot access PORT_OPS documents (wrong department)', async () => {
    const input = makeInput(LOGISTICS_ANALYST, {
      clearance_level: 1,
      department: 'PORT_OPS',
      port_code: 'VIZAG',
      document_category: 'port_manifest'
    });
    const decision = await evaluateOPA(input);
    expect(decision.allow).toBe(false);
  });

  test('Logistics Analyst CAN access LOGISTICS documents at their clearance', async () => {
    const input = makeInput(LOGISTICS_ANALYST, {
      clearance_level: 3,
      department: 'LOGISTICS',
      document_category: 'stockpile_assessment'
    });
    const decision = await evaluateOPA(input);
    expect(decision.allow).toBe(true);
  });

  // ── Sysadmin document denial ───────────────────────────────────────────────
  test('Sysadmin is DENIED access to any document (ROLE_SYSADMIN deny rule)', async () => {
    const input = makeInput(SYSADMIN, {
      clearance_level: 1,
      department: 'PORT_OPS',
      port_code: 'VIZAG',
      document_category: 'port_manifest'
    });
    const decision = await evaluateOPA(input);
    expect(decision.deny).toBe(true);
    expect(decision.allow).toBe(false);
  });

  // ── Mission Director bypass ────────────────────────────────────────────────
  test('Mission Director (CL5) can access any document', async () => {
    const input = makeInput(MISSION_DIRECTOR, {
      clearance_level: 5,
      department: 'MISSION_HQ',
      document_category: 'intelligence_report'
    });
    const decision = await evaluateOPA(input);
    expect(decision.allow).toBe(true);
  });

  test('Mission Director can access PORT_OPS L1 docs via CL5 override', async () => {
    const input = makeInput(MISSION_DIRECTOR, {
      clearance_level: 1,
      department: 'PORT_OPS',
      port_code: 'VIZAG',
      document_category: 'port_manifest'
    });
    const decision = await evaluateOPA(input);
    expect(decision.allow).toBe(true);
  });
});
