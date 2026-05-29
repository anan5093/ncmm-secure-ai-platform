/**
 * ABAC Middleware — OPA Pre-Filter
 * Calls OPA at http://127.0.0.1:8181 before data access.
 * Every OPA decision (allow/deny) is logged to audit_logs.
 */
const http = require('http');
const mongoose = require('mongoose');

const OPA_URL = process.env.OPA_URL || 'http://127.0.0.1:8181';
const OPA_POLICY_PATH = '/v1/data/ncmm/authz';

// Audit log schema
const auditLogSchema = new mongoose.Schema({
  timestamp:      { type: Date, default: Date.now },
  user_id:        String,
  user_role:      String,
  user_clearance: Number,
  query_text:     String,
  document_id:    String,
  document_clearance: Number,
  policy_result:  { type: String, enum: ['ALLOW', 'DENY', 'DENY_SYSADMIN'] },
  opa_decision:   Object,
  ip_address:     String
}, { collection: 'audit_logs' });

let AuditLog;
function getAuditModel() {
  if (!AuditLog) AuditLog = mongoose.models.AuditLog || mongoose.model('AuditLog', auditLogSchema);
  return AuditLog;
}

/**
 * Call OPA policy endpoint.
 * @param {object} input - OPA input payload
 * @returns {Promise<{allow: boolean, deny: boolean}>}
 */
async function evaluateOPA(input) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({ input });
    const url = new URL(`${OPA_URL}${OPA_POLICY_PATH}`);

    const options = {
      hostname: url.hostname,
      port: url.port || 8181,
      path: url.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body)
      },
      timeout: 3000
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({
            allow: parsed.result?.allow === true,
            deny: parsed.result?.deny === true
          });
        } catch {
          reject(new Error('OPA response parse error'));
        }
      });
    });

    req.on('error', reject);
    req.on('timeout', () => reject(new Error('OPA timeout')));
    req.write(body);
    req.end();
  });
}

/**
 * Filter a list of document IDs through OPA.
 * Returns only document IDs that OPA allows for this user.
 * @param {object} user
 * @param {Array<{document_id: string, clearance_level: number, department: string, port_code?: string}>} documents
 * @returns {Promise<string[]>} Permitted document IDs
 */
async function filterDocumentsByOPA(user, documents) {
  const AuditLog = getAuditModel();
  const permittedIds = [];

  for (const doc of documents) {
    const input = {
      user: {
        clearance_level: user.clearance_level,
        department: user.department,
        role: user.role,
        assigned_port: user.assigned_port || null
      },
      document: {
        clearance_level: doc.clearance_level,
        department: doc.department,
        port_code: doc.port_code || null,
        document_category: doc.document_category
      },
      resource: { type: 'document' }
    };

    let decision;
    try {
      decision = await evaluateOPA(input);
    } catch (err) {
      console.error('[OPA] Policy evaluation failed:', err.message);
      decision = { allow: false, deny: true };
    }

    const allowed = decision.allow && !decision.deny;

    // Write audit log
    try {
      await AuditLog.create({
        user_id: user.user_id || user.sub,
        user_role: user.role,
        user_clearance: user.clearance_level,
        document_id: doc.document_id,
        document_clearance: doc.clearance_level,
        policy_result: decision.deny ? 'DENY_SYSADMIN' : (allowed ? 'ALLOW' : 'DENY'),
        opa_decision: decision
      });
    } catch (auditErr) {
      console.warn('[OPA] Audit log write failed:', auditErr.message);
    }

    if (allowed) {
      permittedIds.push(doc.document_id);
    }
  }

  return permittedIds;
}

/**
 * Check a single document access for a user.
 * @param {object} user
 * @param {object} doc
 * @returns {Promise<boolean>}
 */
async function checkDocumentAccess(user, doc) {
  const input = {
    user: {
      clearance_level: user.clearance_level,
      department: user.department,
      role: user.role,
      assigned_port: user.assigned_port || null
    },
    document: {
      clearance_level: doc.clearance_level,
      department: doc.department,
      port_code: doc.port_code || null,
      document_category: doc.document_category
    },
    resource: { type: 'document' }
  };

  try {
    const decision = await evaluateOPA(input);
    return decision.allow && !decision.deny;
  } catch {
    return false;
  }
}

module.exports = { filterDocumentsByOPA, checkDocumentAccess, evaluateOPA };
