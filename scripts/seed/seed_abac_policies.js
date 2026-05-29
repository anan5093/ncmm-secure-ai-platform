/**
 * Seed ABAC Policies — 6 test users
 * Run: node scripts/seed/seed_abac_policies.js
 */
require("dotenv").config({
  path: require("path").resolve(__dirname, "../../.env"),
});

const mongoose = require("mongoose");

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017";

const abacSchema = new mongoose.Schema(
  {
    user_id: { type: String, unique: true },
    username: { type: String, unique: true },
    password_hash: String,
    role: String,
    clearance_level: Number,
    department: String,
    assigned_port: String,
    email: String,
    created_at: { type: Date, default: Date.now },
  },
  { collection: "abac_policies" },
);

const TEST_USERS = [
  {
    user_id: "test-pi-vizag-001",
    username: "r.sharma",
    password_hash: "vizag-inspector-pass-2025",
    role: "ROLE_PORT_INSPECTOR",
    clearance_level: 2,
    department: "PORT_OPS",
    assigned_port: "VIZAG",
    email: "r.sharma@vizagport.ncmm.gov.in",
  },
  {
    user_id: "test-pi-jnpt-002",
    username: "a.mehta",
    password_hash: "jnpt-inspector-pass-2025",
    role: "ROLE_PORT_INSPECTOR",
    clearance_level: 2,
    department: "PORT_OPS",
    assigned_port: "JNPT",
    email: "a.mehta@jnpt.ncmm.gov.in",
  },
  {
    user_id: "test-la-003",
    username: "p.krishnan",
    password_hash: "logistics-analyst-pass-2025",
    role: "ROLE_LOGISTICS_ANALYST",
    clearance_level: 3,
    department: "LOGISTICS",
    assigned_port: null,
    email: "p.krishnan@logistics.ncmm.gov.in",
  },
  {
    user_id: "test-md-004",
    username: "s.iyer",
    password_hash: "mission-director-pass-2025",
    role: "ROLE_MISSION_DIRECTOR",
    clearance_level: 5,
    department: "MISSION_HQ",
    assigned_port: null,
    email: "s.iyer@hq.ncmm.gov.in",
  },
  {
    user_id: "test-sa-005",
    username: "admin",
    password_hash: "sysadmin-pass-2025",
    role: "ROLE_SYSADMIN",
    clearance_level: 1,
    department: "IT_OPS",
    assigned_port: null,
    email: "admin@it.ncmm.gov.in",
  },
  {
    user_id: "test-up-006",
    username: "guest.user",
    password_hash: "guest-pass-2025",
    role: "ROLE_VIEWER",
    clearance_level: 0,
    department: "NONE",
    assigned_port: null,
    email: "guest@ncmm.gov.in",
  },
];

async function seedAbacPolicies() {
  console.log("[SEED] Connecting to MongoDB...");
  await mongoose.connect(MONGODB_URI, {
    dbName: "ncmm_intel",
    serverSelectionTimeoutMS: 30000,
    socketTimeoutMS: 45000,
    maxPoolSize: 10,
    minPoolSize: 2,
    retryWrites: true,
    w: "majority",
  });

  const AbacPolicy = mongoose.model("AbacPolicy", abacSchema);

  console.log("[SEED] Seeding ABAC policies (6 users)...");
  let inserted = 0;
  let skipped = 0;

  for (const user of TEST_USERS) {
    try {
      await AbacPolicy.findOneAndUpdate(
        { user_id: user.user_id },
        { $set: user },
        { upsert: true, new: true },
      );
      console.log(
        `[SEED] ✅ ${user.username} (${user.role}, CL${user.clearance_level})`,
      );
      inserted++;
    } catch (err) {
      if (err.code === 11000) {
        console.log(`[SEED] ⚠️  ${user.username} already exists — skipping`);
        skipped++;
      } else {
        throw err;
      }
    }
  }

  const total = await AbacPolicy.countDocuments();
  console.log(
    `\n[SEED] Done. Inserted: ${inserted}, Skipped: ${skipped}, Total: ${total}`,
  );
  console.log("\n[SEED] Test credentials:");
  TEST_USERS.forEach((u) => {
    console.log(`  ${u.username}:${u.password_hash} (${u.role})`);
  });

  await mongoose.disconnect();
}

seedAbacPolicies().catch((err) => {
  console.error("[SEED] ❌ Error:", err);
  process.exit(1);
});
