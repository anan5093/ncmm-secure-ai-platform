/**
 * Ingestion Pipeline — NCMM
 * Orchestrates: extract → validate → chunk → embed → store in MongoDB + FAISS
 * SHA-256 idempotency guard prevents duplicate ingestion.
 */
require("dotenv").config({
  path: require("path").resolve(__dirname, "../../../.env"),
});

const path = require("path");
const crypto = require("crypto");
const mongoose = require("mongoose");

// Configure Mongoose to use longer timeouts for Atlas
mongoose.set("bufferTimeoutMS", 30000);

const { extractText, loadMetadata } = require("./extractor");
const { chunkDocument } = require("./chunker");
const { embedText, hashEmbedding, EMBEDDING_DIM } = require("./embedder");

// Lazy import to avoid circular deps with server.js
let faissManager = null;
let bm25Manager = null;
let metrics = null;

function getFaissManager() {
  if (!faissManager) faissManager = require("../search/faissManager");
  return faissManager;
}
function getBm25Manager() {
  if (!bm25Manager) bm25Manager = require("../search/bm25Manager");
  return bm25Manager;
}
function getMetrics() {
  if (!metrics) {
    try {
      metrics = require("../telemetry/metrics");
    } catch {
      metrics = null;
    }
  }
  return metrics;
}

// ─── MongoDB Models ──────────────────────────────────────────────────────────────

const documentSchema = new mongoose.Schema(
  {
    document_id: { type: String, unique: true, required: true },
    title: String,
    source_path: String,
    file_sha256: String,
    text_sha256: { type: String, unique: true },
    clearance_level: { type: Number, min: 1, max: 5, required: true },
    department: { type: String, required: true },
    document_category: { type: String, required: true },
    port_code: String,
    classification: { type: String, default: "CLASSIFIED" },
    ingested_at: { type: Date, default: Date.now },
    chunk_count: Number,
    author: String,
    date_issued: String,
    keywords: [String],
  },
  { collection: "documents" },
);

const chunkSchema = new mongoose.Schema(
  {
    chunk_id: { type: String, unique: true, required: true },
    document_id: String,
    chunk_type: { type: String, enum: ["parent", "child"] },
    chunk_index: Number,
    chunk_text: String,
    token_count: Number,
    clearance_level: Number,
    department: String,
    source_path: String,
    document_category: String,
    port_code: String,
    parent_chunk_id: String,
    embedding_model: String,
    embedding_dim: Number,
    vector_hash: { type: String, sparse: true },
    faiss_index_id: Number,
    created_at: { type: Date, default: Date.now },
  },
  { collection: "chunks" },
);

let Document, Chunk;

function getModels() {
  if (!Document) {
    // Log connection status
    if (!mongoose.connection.readyState) {
      console.log(
        `[PIPELINE] Warning: Mongoose not connected (state: ${mongoose.connection.readyState})`,
      );
    }

    Document =
      mongoose.models.Document || mongoose.model("Document", documentSchema);
    Chunk = mongoose.models.Chunk || mongoose.model("Chunk", chunkSchema);

    console.log(
      `[PIPELINE] Models created/retrieved (connection state: ${mongoose.connection.readyState})`,
    );
  }
  return { Document, Chunk };
}

// ─── Main ingestion function ──────────────────────────────────────────────────

/**
 * Trigger the full ingestion pipeline for a single file.
 * @param {string} filePath
 * @param {'add'|'change'} event
 */
async function triggerIngestion(filePath, event) {
  const startTime = Date.now();
  console.log(
    `\n[PIPELINE] Starting ingestion: ${path.basename(filePath)} (${event})`,
  );

  try {
    // 1. Load metadata sidecar
    const meta = loadMetadata(filePath);
    console.log(
      `[PIPELINE] Metadata: CL${meta.clearance_level} / ${meta.department} / ${meta.document_category}`,
    );

    // 2. Extract text
    const { text, sha256: textSha256 } = await extractText(filePath);
    console.log(
      `[PIPELINE] Extracted ${text.length} chars, SHA256: ${textSha256.substring(0, 8)}...`,
    );

    // 3. Idempotency guard — skip if same text hash exists
    const { Document: Doc, Chunk: ChunkModel } = getModels();
    console.log(
      `[PIPELINE] Querying for existing document with text_sha256: ${textSha256.substring(0, 8)}...`,
    );
    const queryStart = Date.now();
    // Use raw MongoDB collection for better Atlas compatibility
    const db = mongoose.connection.db;
    const docCollection = db.collection("documents");
    const existing = await docCollection.findOne(
      { text_sha256: textSha256 },
      { maxTimeMS: 30000 },
    );
    console.log(`[PIPELINE] Query completed in ${Date.now() - queryStart}ms`);
    if (existing && event === "add") {
      console.log(
        `[PIPELINE] Skipping — identical content already ingested (doc_id: ${existing.document_id})`,
      );
      return {
        skipped: true,
        reason: "duplicate",
        document_id: existing.document_id,
      };
    }

    // 4. Create document record
    const fileSha256 = crypto
      .createHash("sha256")
      .update(require("fs").readFileSync(filePath))
      .digest("hex");
    const docId = crypto.randomUUID();
    const docRecord = {
      document_id: docId,
      title: meta.title || path.basename(filePath),
      source_path: path.resolve(filePath),
      file_sha256: fileSha256,
      text_sha256: textSha256,
      clearance_level: meta.clearance_level,
      department: meta.department,
      document_category: meta.document_category,
      port_code: meta.port_code || null,
      classification: meta.classification || "CLASSIFIED",
      author: meta.author || "NCMM",
      date_issued: meta.date_issued || new Date().toISOString().split("T")[0],
      keywords: meta.keywords || [],
    };

    // 5. Chunk document
    const { parents, children } = chunkDocument(text, docRecord);
    docRecord.chunk_count = parents.length + children.length;
    console.log(
      `[PIPELINE] Chunked: ${parents.length} parents, ${children.length} children`,
    );

    // 6. Embed child chunks and update FAISS
    const fm = getFaissManager();
    const bm = getBm25Manager();
    const m = getMetrics();

    const embeddedChildren = [];
    const embeddingVectors = [];
    const embeddingHashes = [];

    console.log(`[PIPELINE] Embedding ${children.length} child chunks...`);
    for (const child of children) {
      const embedding = await embedText(child.chunk_text);
      const vectorHash = hashEmbedding(embedding);

      // Check for duplicate vector
      const chunkCollection = db.collection("chunks");
      const dupChunk = await chunkCollection.findOne(
        { vector_hash: vectorHash },
        { maxTimeMS: 30000 },
      );
      if (dupChunk) {
        console.log(
          `[PIPELINE] Skipping duplicate child chunk (hash: ${vectorHash.substring(0, 8)}...)`,
        );
        continue;
      }

      child.embedding_model =
        process.env.EMBEDDING_MODEL || "Xenova/all-MiniLM-L6-v2";
      child.embedding_dim = EMBEDDING_DIM;
      child.vector_hash = vectorHash;

      embeddedChildren.push(child);
      embeddingVectors.push(embedding);
      embeddingHashes.push(vectorHash);
    }

    // 7. Add to FAISS and get index IDs
    let faissStartId = -1;
    if (embeddingVectors.length > 0) {
      faissStartId = fm.getIndex().ntotal();
      fm.addEmbeddings(embeddingVectors, embeddingHashes);
      console.log(
        `[PIPELINE] Added ${embeddingVectors.length} vectors to FAISS (total: ${fm.getIndex().ntotal()})`,
      );

      // Assign faiss_index_id to each child
      embeddedChildren.forEach((child, i) => {
        child.faiss_index_id = faissStartId + i;
      });
    }

    // 8. Save to MongoDB
    if (existing && event === "change") {
      // Update existing document
      await Doc.updateOne(
        { text_sha256: existing.text_sha256 },
        { $set: { ...docRecord, ingested_at: new Date() } },
      );
      await ChunkModel.deleteMany({ document_id: existing.document_id });
    } else {
      await Doc.create(docRecord);
    }

    const allChunks = [...parents, ...embeddedChildren];
    if (allChunks.length > 0) {
      await ChunkModel.insertMany(allChunks, { ordered: false });
    }

    // 9. Update BM25 index with new child chunk texts
    if (bm && embeddedChildren.length > 0) {
      await bm.addDocuments(
        embeddedChildren.map((c) => ({ id: c.chunk_id, text: c.chunk_text })),
      );
    }

    // 10. Prometheus counter
    if (m) {
      m.chunksIngested.inc(embeddedChildren.length);
    }

    const elapsed = Date.now() - startTime;
    console.log(
      `[PIPELINE] ✅ Done in ${elapsed}ms — ${parents.length} parents, ${embeddedChildren.length} children embedded`,
    );

    return {
      document_id: docId,
      parents: parents.length,
      children: children.length,
      embedded: embeddedChildren.length,
      elapsed_ms: elapsed,
    };
  } catch (err) {
    console.error(`[PIPELINE] ❌ Error ingesting ${filePath}:`, err);
    throw err;
  }
}

module.exports = { triggerIngestion, getModels, mongoose };
