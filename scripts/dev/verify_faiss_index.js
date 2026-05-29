/**
 * Verify FAISS Index
 * Run: node scripts/dev/verify_faiss_index.js
 */
require("dotenv").config({
  path: require("path").resolve(__dirname, "../../.env"),
});

const path = require("path");
const fs = require("fs");

const INDEX_PATH = path.resolve(
  process.env.FAISS_INDEX_PATH || "./data/faiss/ncmm_dev.index",
);
const LOOKUP_PATH = path.resolve(
  process.env.FAISS_LOOKUP_PATH || "./data/faiss/ncmm_dev_lookup.json",
);
const EXPECTED_DIM = parseInt(process.env.EMBEDDING_DIM || "384");

async function verifyFaissIndex() {
  console.log("\n═══ NCMM FAISS Index Verifier ═══\n");

  if (!fs.existsSync(INDEX_PATH)) {
    console.error(`❌ Index file not found: ${INDEX_PATH}`);
    console.error(
      "   Run seed ingestion first: node scripts/seed/run_seed_ingestion.js",
    );
    process.exit(1);
  }

  try {
    const faiss = require(
      path.resolve(__dirname, "../../backend/node_modules/faiss-node"),
    );
    const idx = faiss.IndexFlatL2.read(INDEX_PATH);

    console.log(`✅ Index file: ${INDEX_PATH}`);
    console.log(`   Total vectors: ${idx.ntotal()}`);
    console.log(
      `   Dimension: ${EXPECTED_DIM} [DEV ADAPTATION: 384-dim all-MiniLM-L6-v2]`,
    );

    if (idx.ntotal() < 100) {
      console.log(
        `\n⚠️  Only ${idx.ntotal()} vectors. Expected ~200 after full seed.`,
      );
      console.log("   Run: node scripts/seed/run_seed_ingestion.js");
    } else {
      console.log(
        `\n✅ Vector count looks correct (~200 expected for 20 docs)`,
      );
    }

    // Check lookup table
    if (fs.existsSync(LOOKUP_PATH)) {
      const lookup = JSON.parse(fs.readFileSync(LOOKUP_PATH, "utf-8"));
      const lookupSize = Object.keys(lookup).length;
      console.log(`\n✅ Lookup table: ${LOOKUP_PATH}`);
      console.log(
        `   Entries: ${lookupSize} (should match vector count: ${idx.ntotal()})`,
      );

      if (lookupSize !== idx.ntotal()) {
        console.warn(
          `   ⚠️  Mismatch: ${lookupSize} lookup entries vs ${idx.ntotal()} vectors`,
        );
      }
    } else {
      console.warn(`\n⚠️  Lookup file not found: ${LOOKUP_PATH}`);
    }

    // Test a dummy search
    console.log("\n─── Search Test ───");
    const dummyVector = new Array(EXPECTED_DIM).fill(0.1);
    const results = idx.search(dummyVector, Math.min(5, idx.ntotal()));
    console.log(
      `✅ Search test: returned ${results.labels.filter((l) => l !== -1).length} results`,
    );

    console.log("\n✅ FAISS index is healthy and searchable");
  } catch (err) {
    console.error("❌ FAISS verification failed:", err.message);
    console.error("   This may indicate faiss-node is not installed.");
    console.error("   Run: cd backend && npm install");
    process.exit(1);
  }
}

verifyFaissIndex();
