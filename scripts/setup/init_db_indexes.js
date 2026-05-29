/**
 * MongoDB Index Initialisation Script
 * Run: node scripts/setup/init_db_indexes.js
 */
require("dotenv").config({
  path: require("path").resolve(__dirname, "../../.env"),
});

const mongoose = require("mongoose");

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017";

async function initIndexes() {
  console.log("[DB INIT] Connecting to MongoDB...");
  await mongoose.connect(MONGODB_URI, {
    dbName: "ncmm_intel",
    serverSelectionTimeoutMS: 30000,
    socketTimeoutMS: 45000,
    maxPoolSize: 10,
    minPoolSize: 2,
    retryWrites: true,
    w: "majority",
  });
  console.log("[DB INIT] Connected.");

  const db = mongoose.connection.db;

  // ── documents collection ────────────────────────────────────────────────────
  console.log("[DB INIT] Creating documents indexes...");
  const docs = db.collection("documents");
  await docs.createIndex({ clearance_level: 1 });
  await docs.createIndex({ department: 1 });
  await docs.createIndex({ document_category: 1 });
  await docs.createIndex({ clearance_level: 1, department: 1 });
  await docs.createIndex({ document_id: 1 }, { unique: true });
  await docs.createIndex({ text_sha256: 1 }, { unique: true, sparse: true });
  console.log("[DB INIT] ✅ documents indexes created");

  // ── chunks collection ───────────────────────────────────────────────────────
  console.log("[DB INIT] Creating chunks indexes...");
  const chunks = db.collection("chunks");

  // Drop old vector_hash index if it exists
  try {
    await chunks.dropIndex("vector_hash_1");
  } catch (err) {
    // Index doesn't exist, which is fine
  }

  await chunks.createIndex({ document_id: 1 });
  await chunks.createIndex({ parent_chunk_id: 1 });
  // Unique index only for child chunks (with embeddings) to allow multiple parent chunks with vector_hash: null
  await chunks.createIndex(
    { vector_hash: 1 },
    {
      unique: true,
      partialFilterExpression: { chunk_type: "child" },
    },
  );
  await chunks.createIndex({ chunk_type: 1 });
  await chunks.createIndex({ clearance_level: 1, department: 1 });
  await chunks.createIndex({ chunk_id: 1 }, { unique: true });
  console.log("[DB INIT] ✅ chunks indexes created");

  // ── abac_policies collection ────────────────────────────────────────────────
  console.log("[DB INIT] Creating abac_policies indexes...");
  const policies = db.collection("abac_policies");
  await policies.createIndex({ user_id: 1 }, { unique: true });
  await policies.createIndex({ role: 1 });
  await policies.createIndex({ username: 1 }, { unique: true });
  console.log("[DB INIT] ✅ abac_policies indexes created");

  // ── audit_logs collection ───────────────────────────────────────────────────
  console.log("[DB INIT] Creating audit_logs indexes...");
  const logs = db.collection("audit_logs");
  await logs.createIndex({ timestamp: -1 });
  await logs.createIndex({ user_id: 1 });
  await logs.createIndex({ policy_result: 1 });
  // TTL index: auto-delete logs after 90 days
  await logs.createIndex({ timestamp: 1 }, { expireAfterSeconds: 7776000 });
  console.log("[DB INIT] ✅ audit_logs indexes created (TTL: 90 days)");

  console.log("\n[DB INIT] ✅ All indexes created successfully");
  await mongoose.disconnect();
}

initIndexes().catch((err) => {
  console.error("[DB INIT] ❌ Error:", err);
  process.exit(1);
});
