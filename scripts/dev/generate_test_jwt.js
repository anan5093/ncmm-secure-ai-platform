/**
 * Generate Test JWT — Dev Tool
 * Run: node scripts/dev/generate_test_jwt.js --role ROLE_MISSION_DIRECTOR
 *      node scripts/dev/generate_test_jwt.js --role ROLE_PORT_INSPECTOR --port VIZAG
 */
require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });

const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'change-this-to-a-secure-random-secret-min-32-chars';
const JWT_EXPIRY = process.env.JWT_EXPIRY || '8h';

const ROLE_CONFIGS = {
  ROLE_PORT_INSPECTOR: (port = 'VIZAG') => ({
    user_id: `dev-pi-${port.toLowerCase()}-001`,
    username: `inspector.${port.toLowerCase()}`,
    role: 'ROLE_PORT_INSPECTOR',
    clearance_level: 2,
    department: 'PORT_OPS',
    assigned_port: port
  }),
  ROLE_LOGISTICS_ANALYST: () => ({
    user_id: 'dev-la-001',
    username: 'analyst.logistics',
    role: 'ROLE_LOGISTICS_ANALYST',
    clearance_level: 3,
    department: 'LOGISTICS',
    assigned_port: null
  }),
  ROLE_MISSION_DIRECTOR: () => ({
    user_id: 'dev-md-001',
    username: 'director.mission',
    role: 'ROLE_MISSION_DIRECTOR',
    clearance_level: 5,
    department: 'MISSION_HQ',
    assigned_port: null
  }),
  ROLE_SYSADMIN: () => ({
    user_id: 'dev-sa-001',
    username: 'admin',
    role: 'ROLE_SYSADMIN',
    clearance_level: 1,
    department: 'IT_OPS',
    assigned_port: null
  })
};

const args = process.argv.slice(2);
const roleArg = args[args.indexOf('--role') + 1] || 'ROLE_MISSION_DIRECTOR';
const portArg = args[args.indexOf('--port') + 1] || 'VIZAG';

const configFn = ROLE_CONFIGS[roleArg];
if (!configFn) {
  console.error(`Unknown role: ${roleArg}`);
  console.error('Available roles:', Object.keys(ROLE_CONFIGS).join(', '));
  process.exit(1);
}

const payload = configFn(portArg);
payload.sub = payload.user_id;
payload.iat = Math.floor(Date.now() / 1000);

const token = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRY });

console.log('\n═══ NCMM Test JWT Generator ═══');
console.log(`Role: ${payload.role}`);
console.log(`User: ${payload.username}`);
console.log(`CL:   ${payload.clearance_level}`);
console.log(`Dept: ${payload.department}`);
if (payload.assigned_port) console.log(`Port: ${payload.assigned_port}`);
console.log(`Exp:  ${JWT_EXPIRY}`);
console.log('\nToken:');
console.log(token);
console.log('\nCurl example:');
console.log(`curl -X POST http://localhost:3000/api/v1/query \\`);
console.log(`  -H "Authorization: Bearer ${token}" \\`);
console.log(`  -H "Content-Type: application/json" \\`);
console.log(`  -d '{"query":"What is the current critical mineral stockpile status?"}'`);
console.log('');
