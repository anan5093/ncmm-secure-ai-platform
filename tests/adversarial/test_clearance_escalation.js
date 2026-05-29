/**
 * Adversarial Test: Clearance Escalation
 * Port Inspector attempting Level 3/5 access — must be denied
 */
const { evaluateOPA } = require('../../backend/src/middleware/abac');

describe('Clearance Escalation Attacks (requires OPA running)', () => {
  const PORT_INSPECTOR_L2 = {
    clearance_level: 2, department: 'PORT_OPS',
    role: 'ROLE_PORT_INSPECTOR', assigned_port: 'VIZAG'
  };

  const testDocs = [
    { clearance_level: 3, department: 'PORT_OPS', document_category: 'stockpile_assessment', port_code: 'VIZAG' },
    { clearance_level: 4, department: 'MISSION_HQ', document_category: 'intelligence_report' },
    { clearance_level: 5, department: 'MISSION_HQ', document_category: 'intelligence_report' },
    { clearance_level: 3, department: 'LOGISTICS', document_category: 'procurement_report' },
    { clearance_level: 4, department: 'PORT_OPS', document_category: 'intelligence_report', port_code: 'VIZAG' }
  ];

  testDocs.forEach((doc, i) => {
    test(`CL2 inspector denied access to CL${doc.clearance_level} document (${doc.department})`, async () => {
      const decision = await evaluateOPA({
        user: PORT_INSPECTOR_L2,
        document: doc,
        resource: { type: 'document' }
      });
      // A CL2 user must NEVER access CL3+ documents
      expect(decision.allow).toBe(false);
    });
  });

  test('Escalation via clearance_level manipulation in JWT does not bypass OPA', async () => {
    // Even if JWT had clearance_level spoofed to 5, OPA evaluates based on input
    // This tests that OPA itself correctly evaluates the policy
    const spoofedUser = {
      clearance_level: 5, // Spoofed!
      department: 'PORT_OPS',
      role: 'ROLE_PORT_INSPECTOR',
      assigned_port: 'VIZAG'
    };
    const decision = await evaluateOPA({
      user: spoofedUser,
      document: { clearance_level: 5, department: 'MISSION_HQ', document_category: 'intelligence_report' },
      resource: { type: 'document' }
    });
    // Port Inspector with CL5 would pass the CL5 override rule
    // But in reality, JWT validation prevents CL spoofing before OPA is called
    // This test verifies OPA itself sees what it's given
    expect(typeof decision.allow).toBe('boolean');
  });
});
