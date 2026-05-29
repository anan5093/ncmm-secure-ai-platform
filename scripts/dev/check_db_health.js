/**
 * DB Health Check
 * Run: node scripts/dev/check_db_health.js
 */
require("dotenv").config({
  path: require("path").resolve(__dirname, "../../.env"),
});

const mongoose = require("mongoose");

async function checkDbHealth() {
  console.log("\n═══ NCMM Database Health Check ═══\n");

  try {
    await mongoose.connect(
      process.env.MONGODB_URI || "mongodb://localhost:27017",
      {
        dbName: "ncmm_intel",
        serverSelectionTimeoutMS: 30000,
        socketTimeoutMS: 45000,
        maxPoolSize: 10,
        minPoolSize: 2,
        retryWrites: true,
        w: "majority",
      },
    );
  } catch (err) {
    console.error("❌ MongoDB connection FAILED:", err.message);
    console.error("   Ensure docker-compose up -d is running");
    process.exit(1);
  }

  console.log("✅ MongoDB: Connected\n");
  const db = mongoose.connection.db;

  const collections = [
    { name: "documents", expected: "~20" },
    { name: "chunks", expected: "~400" },
    { name: "abac_policies", expected: "6" },
    { name: "audit_logs", expected: "any" },
  ];

  let allGood = true;
  for (const { name, expected } of collections) {
    try {
      const count = await db.collection(name).countDocuments();
      const ok = count > 0 || name === "audit_logs";
      console.log(
        `${ok ? "✅" : "⚠️ "} ${name.padEnd(20)} count: ${String(count).padStart(5)}  (expected: ${expected})`,
      );
      if (!ok) allGood = false;
    } catch (err) {
      console.log(`❌ ${name}: ERROR — ${err.message}`);
      allGood = false;
    }
  }

  // Check indexes
  console.log("\n─── Index Check ───");
  try {
    const chunkIndexes = await db.collection("chunks").indexes();
    const auditIndexes = await db.collection("audit_logs").indexes();
    const ttlIndex = auditIndexes.find(
      (i) => i.expireAfterSeconds !== undefined,
    );
    console.log(`  chunks indexes:    ${chunkIndexes.length}`);
    console.log(
      `  audit TTL index:   ${ttlIndex ? "✅ Present (90 days)" : "⚠️  Missing — run init_db_indexes.js"}`,
    );
  } catch {}

  console.log(
    `\n${allGood ? "✅ All checks PASSED" : "⚠️  Some checks failed"}`,
  );

  if (!allGood) {
    console.log("\nTo fix: Run seed scripts:");
    console.log("  node scripts/setup/init_db_indexes.js");
    console.log("  node scripts/seed/seed_abac_policies.js");
    console.log("  node scripts/seed/run_seed_ingestion.js");
  }

  await mongoose.disconnect();
}

checkDbHealth().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
