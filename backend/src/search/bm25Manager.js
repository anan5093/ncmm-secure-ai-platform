/**
 * BM25 Index Manager
 * In-RAM BM25 index over all child chunk texts.
 * Rebuilt from MongoDB on server startup. Incremental on new ingestion.
 */
const winkNLP = require("wink-nlp");
const model = require("wink-eng-lite-web-model");
const BM25 = require("wink-bm25-text-search");

const nlp = winkNLP(model);
const its = nlp.its;

let engine = null;
let documentCount = 0;

/**
 * Prepare a text string for BM25 indexing.
 * Returns array of tokens after NLP pipeline.
 */
function prepareTokens(text) {
  const doc = nlp.readDoc(text);
  return doc
    .tokens()
    .filter(
      (t) => t.out(its.type) !== "punctuation" && t.out(its.type) !== "space",
    )
    .out(its.normal);
}

/**
 * Initialise a fresh BM25 engine.
 */
function createEngine() {
  const eng = BM25();
  eng.defineConfig({ fldWeights: { text: 1 } });
  eng.definePrepTasks([(text) => prepareTokens(text)]);
  return eng;
}

/**
 * Build BM25 index from scratch using an array of chunk objects.
 * Call this on server startup after loading MongoDB chunks.
 * @param {Array<{chunk_id: string, chunk_text: string}>} chunks
 */
function buildIndex(chunks) {
  console.log(`[BM25] Building index from ${chunks.length} chunks...`);
  engine = createEngine();

  chunks.forEach((chunk) => {
    try {
      engine.addDoc({ text: chunk.chunk_text }, chunk.chunk_id);
    } catch (err) {
      // Skip problematic chunks
    }
  });

  engine.consolidate(); // Finalize index
  documentCount = chunks.length;
  console.log(`[BM25] Index built with ${documentCount} documents`);
}

/**
 * Add new documents to the index (incremental update after ingestion).
 * Note: wink-bm25 does not support true incremental updates easily,
 * so we rebuild for small corpuses. For large corpuses, a full rebuild is triggered.
 * @param {Array<{id: string, text: string}>} docs
 */
async function addDocuments(docs) {
  // For dev corpus size (≤1000 chunks), rebuild is fast enough (<100ms)
  // We fetch all child chunks from MongoDB and rebuild the engine synchronously.
  console.log(
    `[BM25] Rebuilding BM25 index from MongoDB after adding ${docs.length} docs...`,
  );
  try {
    const mongoose = require("mongoose");
    const Chunk =
      mongoose.models.Chunk ||
      mongoose.model(
        "Chunk",
        new mongoose.Schema(
          {
            chunk_id: String,
            chunk_text: String,
            chunk_type: String,
          },
          { collection: "chunks" },
        ),
      );

    const childChunks = await Chunk.find(
      { chunk_type: "child" },
      { chunk_id: 1, chunk_text: 1 },
    ).lean();
    buildIndex(childChunks);
  } catch (err) {
    console.error(
      "[BM25] Failed to rebuild index after document addition:",
      err.message,
    );
  }
}

/**
 * Search BM25 index.
 * @param {string} queryText
 * @param {number} k - Top k results
 * @param {Set<string>} [permitIds] - Optional set of permitted chunk_ids (ABAC filter)
 * @returns {Array<{id: string, score: number}>}
 */
function searchBM25(queryText, k = 50, permitIds = null) {
  if (!engine) {
    console.warn("[BM25] Engine not initialised — returning empty results");
    return [];
  }

  try {
    if (!queryText || queryText.trim().length === 0) return [];

    // Pass queryText directly to engine.search() - it applies prep tasks internally
    const results = engine.search(queryText, k * 2); // Over-fetch then filter
    let filtered = results;

    if (permitIds && permitIds.size > 0) {
      filtered = results.filter(([id]) => permitIds.has(id));
    }

    return filtered.slice(0, k).map(([id, score]) => ({ id, score }));
  } catch (err) {
    console.error("[BM25] Search error:", err.message);
    return [];
  }
}

function getDocumentCount() {
  return documentCount;
}
function getEngine() {
  return engine;
}

module.exports = {
  buildIndex,
  addDocuments,
  searchBM25,
  getDocumentCount,
  getEngine,
  prepareTokens,
};
