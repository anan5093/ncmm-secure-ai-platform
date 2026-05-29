/**
 * Clear Test Data
 * SAFETY: Refuses to run if NODE_ENV != 'development'
 * Run: NODE_ENV=development node scripts/seed/clear_test_data.js
 */
require("dotenv").config({
  path: require("path").resolve(__dirname, "../../.env"),
});

const mongoose = require("mongoose");
const path = require("path");
const fs = require("fs");

if (process.env.NODE_ENV !== "development") {
  console.error(
    "❌ SAFETY GUARD: This script only runs in NODE_ENV=development",
  );
  console.error("   Current NODE_ENV:", process.env.NODE_ENV);
  console.error("   Set NODE_ENV=development before running.");
  process.exit(1);
}

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017";
const FAISS_INDEX_PATH = path.resolve(
  process.env.FAISS_INDEX_PATH || "./data/faiss/ncmm_dev.index",
);
const FAISS_LOOKUP_PATH = path.resolve(
  process.env.FAISS_LOOKUP_PATH || "./data/faiss/ncmm_dev_lookup.json",
);

async function clearTestData() {
  console.log(
    "\n⚠️  CLEARING ALL TEST DATA (NODE_ENV=development confirmed)\n",
  );

  await mongoose.connect(MONGODB_URI, {
    dbName: "ncmm_intel",
    serverSelectionTimeoutMS: 30000,
    socketTimeoutMS: 45000,
    maxPoolSize: 10,
    minPoolSize: 2,
    retryWrites: true,
    w: "majority",
  });
  const db = mongoose.connection.db;

  const collections = ["documents", "chunks", "abac_policies", "audit_logs"];
  for (const col of collections) {
    const result = await db.collection(col).deleteMany({});
    console.log(`[CLEAR] ${col}: deleted ${result.deletedCount} records`);
  }

  // Clear FAISS files
  if (fs.existsSync(FAISS_INDEX_PATH)) {
    fs.unlinkSync(FAISS_INDEX_PATH);
    console.log(`[CLEAR] Deleted: ${FAISS_INDEX_PATH}`);
  }
  if (fs.existsSync(FAISS_LOOKUP_PATH)) {
    fs.unlinkSync(FAISS_LOOKUP_PATH);
    console.log(`[CLEAR] Deleted: ${FAISS_LOOKUP_PATH}`);
  }

  console.log("\n✅ All test data cleared. Run seed scripts to re-populate.");
  await mongoose.disconnect();
}

clearTestData().catch((err) => {
  console.error("[CLEAR] Error:", err);
  process.exit(1);
});
