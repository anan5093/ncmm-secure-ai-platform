/**
 * FAISS HNSW Index Manager
 * [DEV ADAPTATION] dim=384 (all-MiniLM-L6-v2). Index file: ncmm_dev.index
 * Production: dim=768 (nomic-embed-text-v1), file: ncmm_test.index
 */
require("dotenv").config({
  path: require("path").resolve(__dirname, "../../../.env"),
});

const fs = require("fs");
const path = require("path");

const DIM = parseInt(process.env.EMBEDDING_DIM || "384");
const INDEX_PATH = path.resolve(
  process.env.FAISS_INDEX_PATH || path.join(__dirname, "../../data/faiss/ncmm_dev.index")
);
const LOOKUP_PATH = path.resolve(
  process.env.FAISS_LOOKUP_PATH || path.join(__dirname, "../../data/faiss/ncmm_dev_lookup.json")
);

let faiss = null;
let index = null;
let lookupTable = new Map(); // faissInternalId → vectorHash

function getFaiss() {
  if (!faiss) {
    faiss = require("faiss-node");
  }
  return faiss;
}

/**
 * Ensure data/faiss directory exists.
 */
function ensureDir() {
  const dir = path.dirname(INDEX_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

/**
 * Load or create the FAISS HNSW index.
 * Call this at Express server startup.
 */
function loadIndex() {
  ensureDir();
  const f = getFaiss();

  if (fs.existsSync(INDEX_PATH)) {
    try {
      index = f.IndexFlatL2.read(INDEX_PATH);
      const raw = JSON.parse(fs.readFileSync(LOOKUP_PATH, "utf-8"));
      lookupTable = new Map(Object.entries(raw));
      console.log(
        `[FAISS] Loaded index: ${index.ntotal()} vectors, dim ${DIM}`,
      );
    } catch (err) {
      console.error("[FAISS] Failed to load index, creating new:", err.message);
      index = new f.IndexFlatL2(DIM);
      lookupTable = new Map();
    }
  } else {
    index = new f.IndexFlatL2(DIM);
    console.log(`[FAISS] Created new Flat L2 index, dim ${DIM}`);
  }
}

/**
 * Save index and lookup table to disk.
 */
function saveIndex() {
  if (!index) return;
  ensureDir();
  index.write(INDEX_PATH);
  fs.writeFileSync(
    LOOKUP_PATH,
    JSON.stringify(Object.fromEntries(lookupTable)),
  );
}

/**
 * Add embedding vectors to the index.
 * @param {number[][]} vectors - Array of float32 arrays of length DIM
 * @param {string[]} hashes - Corresponding vector hashes
 */
function addEmbeddings(vectors, hashes) {
  if (!index)
    throw new Error("[FAISS] Index not loaded. Call loadIndex() first.");
  const startId = index.ntotal();
  const flat = vectors.flat();
  index.add(flat);
  hashes.forEach((hash, i) => lookupTable.set(String(startId + i), hash));
  saveIndex();
}

/**
 * Search the index for nearest neighbours.
 * @param {number[]} queryVector - Float32 array of length DIM
 * @param {number} k - Number of results
 * @returns {Array<{id: string, distance: number, hash: string}>}
 */
function search(queryVector, k = 50) {
  if (!index)
    throw new Error("[FAISS] Index not loaded. Call loadIndex() first.");
  const actualK = Math.min(k, index.ntotal());
  console.log(
    `[FAISS] Search: queryVector dim=${queryVector.length}, k=${k}, actualK=${actualK}, indexSize=${index.ntotal()}`,
  );
  if (actualK === 0) return [];

  const result = index.search(queryVector, actualK);
  console.log(
    `[FAISS] Search result: ${result.labels.length} results, first label=${result.labels[0]}`,
  );
  return result.labels
    .map((id, i) => ({
      id: String(id),
      distance: result.distances[i],
      hash: lookupTable.get(String(id)) || null,
    }))
    .filter((r) => r.id !== "-1"); // FAISS returns -1 for unfilled slots
}

/**
 * Get the current index object (for ntotal, etc.).
 */
function getIndex() {
  return index;
}

/**
 * Delete the index (for testing).
 */
function resetIndex() {
  const f = getFaiss();
  index = new f.IndexFlatL2(DIM);
  lookupTable = new Map();
  saveIndex();
}

module.exports = {
  loadIndex,
  saveIndex,
  addEmbeddings,
  search,
  getIndex,
  resetIndex,
  DIM,
};
