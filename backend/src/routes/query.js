/**
 * Query Route — POST /api/v1/query
 * 5-stage RAG pipeline:
 * STEP 1 → OPA Pre-Filter
 * STEP 2 → Parallel: FAISS (k=50) + BM25 (k=50), constrained to permitted_doc_ids
 * STEP 3 → RRF fusion → top 20 candidates
 * STEP 4 → Cross-Encoder Re-Ranking → top-K parent chunks from MongoDB
 * STEP 5 → Prompt Firewall (L1→L2→L3) → POST to OLLAMA_URL/api/generate
 */
require("dotenv").config({
  path: require("path").resolve(__dirname, "../../../.env"),
});

const express = require("express");
const router = express.Router();
const http = require("http");
const https = require("https");
const mongoose = require("mongoose");

const { authenticateJWT } = require("../middleware/auth");
const { filterDocumentsByOPA } = require("../middleware/abac");
const { embedText } = require("../ingestion/embedder");
const { search: faissSearch } = require("../search/faissManager");
const { searchBM25 } = require("../search/bm25Manager");
const { reciprocalRankFusion } = require("../search/rrfFusion");
const { reRank } = require("../search/crossEncoder");
const { runFirewall } = require("../firewall");
const { parseCitations } = require("../firewall/layer3_vault");
const metrics = require("../telemetry/metrics");

const OLLAMA_URL = process.env.OLLAMA_URL || "http://localhost:11434";

// Chunk model (shared with pipeline.js)
const chunkSchema = new mongoose.Schema(
  {
    chunk_id: String,
    document_id: String,
    chunk_type: String,
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
    vector_hash: String,
    faiss_index_id: Number,
  },
  { collection: "chunks" },
);

const documentSchema = new mongoose.Schema(
  {
    document_id: String,
    clearance_level: Number,
    department: String,
    document_category: String,
    port_code: String,
  },
  { collection: "documents" },
);

let ChunkModel, DocumentModel;
function getModels() {
  if (!ChunkModel) {
    ChunkModel = mongoose.models.Chunk || mongoose.model("Chunk", chunkSchema);
    DocumentModel =
      mongoose.models.Document || mongoose.model("Document", documentSchema);
  }
  return { ChunkModel, DocumentModel };
}

/**
 * POST to LLM (Ollama or Mock).
 */
async function callLLM(prompt) {
  return new Promise((resolve, reject) => {
    const url = new URL(`${OLLAMA_URL}/api/generate`);
    const body = JSON.stringify({ model: "gemma:7b", prompt, stream: false });
    const lib = url.protocol === "https:" ? https : http;

    const options = {
      hostname: url.hostname,
      port: url.port || (url.protocol === "https:" ? 443 : 80),
      path: url.pathname,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(body),
      },
      timeout: 120000,
    };

    const req = lib.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        try {
          resolve(JSON.parse(data));
        } catch {
          reject(new Error("LLM response parse error"));
        }
      });
    });

    req.on("error", reject);
    req.on("timeout", () => {
      req.destroy();
      reject(new Error("LLM timeout"));
    });
    req.write(body);
    req.end();
  });
}

/**
 * POST /api/v1/query
 */
router.post("/", authenticateJWT, async (req, res) => {
  const queryStart = Date.now();
  const { query, synthesis_mode = false } = req.body;
  const user = req.user;

  if (!query || typeof query !== "string" || query.trim().length === 0) {
    return res
      .status(400)
      .json({ error: "query is required and must be a non-empty string" });
  }

  const K = synthesis_mode ? 10 : 5;

  try {
    const { ChunkModel, DocumentModel } = getModels();

    // ── STEP 1: OPA Pre-Filter ───────────────────────────────────────────────
    const allDocs = await DocumentModel.find({}).lean();
    const permittedDocIds = await filterDocumentsByOPA(user, allDocs);

    if (permittedDocIds.length === 0) {
      metrics.abacDenials.inc();
      return res.status(403).json({
        error: "No documents accessible under your current clearance and role",
        code: "OPA_NO_PERMITTED_DOCS",
      });
    }

    console.log(
      `[QUERY] OPA permitted ${permittedDocIds.length}/${allDocs.length} docs for user ${user.user_id}`,
    );

    // Get permitted chunk IDs (child chunks only for search)
    const permittedChunks = await ChunkModel.find(
      {
        document_id: { $in: permittedDocIds },
        chunk_type: "child",
      },
      { chunk_id: 1, faiss_index_id: 1 },
    ).lean();

    const permittedChunkIds = new Set(permittedChunks.map((c) => c.chunk_id));
    const permittedFaissIds = new Set(
      permittedChunks.map((c) => String(c.faiss_index_id)),
    );

    // ── STEP 2: Parallel FAISS + BM25 ────────────────────────────────────────
    const queryEmbedding = await embedText(query);
    console.log(
      `[QUERY] Query embedding: dim=${queryEmbedding.length}, type=${typeof queryEmbedding[0]}`,
    );
    console.log(
      `[QUERY] Permitted chunks: ${permittedChunks.length}, permittedFaissIds: ${Array.from(permittedFaissIds).slice(0, 5).join(",")}`,
    );

    const [faissResults, bm25Results] = await Promise.all([
      // FAISS semantic search
      (async () => {
        const raw = faissSearch(queryEmbedding, 50);
        console.log(
          `[QUERY] FAISS raw results: ${raw.length}, first few IDs: ${raw
            .slice(0, 3)
            .map((r) => r.id)
            .join(",")}`,
        );
        // Map faiss internal IDs to chunk_ids via lookup, filter by permitted
        const filtered = raw.filter((r) => permittedFaissIds.has(r.id));
        console.log(
          `[QUERY] FAISS after permission filter: ${filtered.length}`,
        );
        return filtered.map((r) => {
          const chunk = permittedChunks.find(
            (c) => String(c.faiss_index_id) === r.id,
          );
          return { id: chunk?.chunk_id || r.id, score: 1 / (1 + r.distance) };
        });
      })(),
      // BM25 lexical search
      searchBM25(query, 50, permittedChunkIds),
    ]);

    console.log(
      `[QUERY] FAISS: ${faissResults.length} results, BM25: ${bm25Results.length} results`,
    );

    // ── STEP 3: RRF Fusion → top 20 ──────────────────────────────────────────
    const rrfResults = reciprocalRankFusion(faissResults, bm25Results, 60, 20);
    console.log(`[QUERY] RRF fusion → ${rrfResults.length} candidates`);

    if (rrfResults.length === 0) {
      return res.json({
        query,
        response_text: "No relevant classified documents found for your query.",
        citations: [],
        synthesis_mode,
        query_latency_ms: Date.now() - queryStart,
      });
    }

    // ── STEP 4: Cross-Encoder Re-Ranking → top-K parent chunks ───────────────
    const topKParents = await reRank(query, rrfResults, ChunkModel, user, K);
    console.log(`[QUERY] Cross-encoder → ${topKParents.length} parent chunks`);

    if (topKParents.length === 0) {
      metrics.abacDenials.inc();
      return res.status(403).json({
        error:
          "No accessible documents matched your query after security filtering",
        code: "ABAC_POST_RERANK_EMPTY",
      });
    }

    // ── STEP 5: Firewall (L1→L2→L3) + LLM dispatch ───────────────────────────
    const firewallResult = await runFirewall(query, topKParents, {
      clearance_level: user.clearance_level,
      role: user.role,
      department: user.department,
    });

    if (firewallResult.blocked) {
      return res.status(400).json({
        error: "Query rejected by security firewall",
        code: firewallResult.code,
        layer: firewallResult.layer,
        reason: firewallResult.reason,
      });
    }

    // LLM dispatch
    const llmStart = Date.now();
    let llmResponse;
    try {
      llmResponse = await callLLM(firewallResult.prompt);
    } catch (err) {
      console.error("[QUERY] LLM dispatch error:", err.message);
      return res.status(502).json({
        error: "LLM service unavailable. Ensure mock-llm or Ollama is running.",
        code: "LLM_UNAVAILABLE",
      });
    }

    const llmLatency = Date.now() - llmStart;
    metrics.llmInferenceLatency.observe(llmLatency);

    const responseText = llmResponse.response || "";
    const citations = parseCitations(responseText, topKParents);

    // Total query latency
    const totalLatency = Date.now() - queryStart;
    metrics.queryLatency.observe(totalLatency);

    return res.json({
      query,
      response_text: responseText,
      citations,
      synthesis_mode,
      query_latency_ms: totalLatency,
      llm_latency_ms: llmLatency,
      sources_count: topKParents.length,
      firewall: {
        flags: firewallResult.flags || [],
        classifier_score: firewallResult.classifier?.score,
      },
    });
  } catch (err) {
    console.error("[QUERY] Unexpected error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
