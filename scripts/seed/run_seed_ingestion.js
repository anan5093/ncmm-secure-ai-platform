/**
 * Run Full Seed Ingestion
 * Runs the complete ingestion pipeline on all 20 seed documents.
 * Expected output: 20 docs, ~400 chunks, ~200 FAISS vectors (384-dim)
 *
 * Run: node scripts/seed/run_seed_ingestion.js
 */
require("dotenv").config({
  path: require("path").resolve(__dirname, "../../.env"),
});

const path = require("path");
const fs = require("fs");
const {
  triggerIngestion,
  mongoose,
} = require("../../backend/src/ingestion/pipeline");
const { loadIndex } = require("../../backend/src/search/faissManager");

const DOCS_DIR = path.resolve(__dirname, "documents");
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017";

async function runSeedIngestion() {
  console.log("\n╔════════════════════════════════════════════╗");
  console.log("║    NCMM Seed Ingestion — 20 Documents     ║");
  console.log("╚════════════════════════════════════════════╝\n");

  // Connect MongoDB
  console.log("[SEED] Connecting to MongoDB...");
  await mongoose.connect(MONGODB_URI, {
    dbName: "ncmm_intel",
    serverSelectionTimeoutMS: 30000,
    socketTimeoutMS: 60000,
    maxPoolSize: 20,
    minPoolSize: 5,
    maxIdleTimeMS: 60000,
    waitQueueTimeoutMS: 30000,
    retryWrites: true,
    w: "majority",
  });
  console.log("[SEED] ✅ MongoDB connected\n");

  // Warm up the connection pool with a test query
  console.log("[SEED] Warming up connection pool...");
  await mongoose.connection.db.collection("documents").countDocuments();
  await new Promise((resolve) => setTimeout(resolve, 500)); // Brief delay
  console.log("[SEED] ✅ Connection ready\n");

  // Load FAISS index
  console.log("[SEED] Loading FAISS index...");
  try {
    loadIndex();
    console.log("[SEED] ✅ FAISS index loaded\n");
  } catch (err) {
    console.warn(
      "[SEED] ⚠️  FAISS index load failed (expected if empty):",
      err.message,
    );
  }

  // Find all .txt files in seed documents directory
  const allFiles = fs.readdirSync(DOCS_DIR);
  const docFiles = allFiles
    .filter((f) => f.endsWith(".txt") && !f.includes("node_modules"))
    .map((f) => path.join(DOCS_DIR, f));

  console.log(`[SEED] Found ${docFiles.length} documents to ingest:`);
  docFiles.forEach((f) => console.log(`  - ${path.basename(f)}`));
  console.log("");

  let succeeded = 0;
  let skipped = 0;
  let failed = 0;

  // Ingest each document
  for (const filePath of docFiles) {
    try {
      console.log(`\n[SEED] Processing: ${path.basename(filePath)}`);
      const result = await triggerIngestion(filePath, "add");

      if (result.skipped) {
        console.log(`[SEED] ⚠️  Skipped (${result.reason})`);
        skipped++;
      } else {
        console.log(
          `[SEED] ✅ Ingested — ${result.parents} parents, ${result.embedded} children embedded`,
        );
        succeeded++;
      }
    } catch (err) {
      console.error(
        `[SEED] ❌ Failed: ${path.basename(filePath)} — ${err.message}`,
      );
      failed++;
    }
  }

  // Summary
  console.log("\n" + "═".repeat(50));
  console.log("INGESTION SUMMARY");
  console.log("═".repeat(50));
  console.log(`Documents processed: ${docFiles.length}`);
  console.log(`Succeeded: ${succeeded}`);
  console.log(`Skipped (duplicate): ${skipped}`);
  console.log(`Failed: ${failed}`);

  // Verify MongoDB state
  const db = mongoose.connection.db;
  const docCount = await db.collection("documents").countDocuments();
  const chunkCount = await db.collection("chunks").countDocuments();
  const childCount = await db
    .collection("chunks")
    .countDocuments({ chunk_type: "child" });
  const abacCount = await db.collection("abac_policies").countDocuments();

  console.log("\nMONGODB STATE:");
  console.log(`  documents:     ${docCount} (expected: ~20)`);
  console.log(`  chunks total:  ${chunkCount} (expected: ~400)`);
  console.log(`  chunks child:  ${childCount} (FAISS vectors: expected ~200)`);
  console.log(
    `  abac_policies: ${abacCount} (expected: 6, run seed_abac_policies.js first)`,
  );

  // Verify FAISS
  try {
    const { getIndex } = require("../../backend/src/search/faissManager");
    const idx = getIndex();
    if (idx) {
      console.log(`\nFAISS STATE:`);
      console.log(
        `  Total vectors: ${idx.ntotal()} (expected: ~${childCount})`,
      );
      console.log(
        `  Dimension: ${parseInt(process.env.EMBEDDING_DIM || "384")} (expected: 384)`,
      );
    }
  } catch {}

  const allPass = docCount >= 15 && chunkCount >= 200;
  console.log(
    `\n${allPass ? "✅" : "⚠️ "} Seed ${allPass ? "PASSED" : "PARTIALLY COMPLETE"}`,
  );
  console.log("\nNext steps:");
  console.log("  node scripts/dev/verify_faiss_index.js");
  console.log("  node scripts/dev/check_db_health.js");

  await mongoose.disconnect();
}

runSeedIngestion().catch((err) => {
  console.error("[SEED] ❌ Fatal error:", err);
  process.exit(1);
});
