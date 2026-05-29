/**
 * Prometheus Metrics — NCMM
 * Four required metrics per spec.
 */
const client = require('prom-client');

// Create a Registry which registers the metrics
const register = new client.Registry();

// Add default Node.js metrics
client.collectDefaultMetrics({ register });

// ── NCMM Custom Metrics ────────────────────────────────────────────────────────

/** Counter: total child chunks ingested into FAISS */
const chunksIngested = new client.Counter({
  name: 'ai_chunks_ingested_total',
  help: 'Total number of child chunks ingested into FAISS index',
  registers: [register]
});

/** Counter: total ABAC denials from OPA */
const abacDenials = new client.Counter({
  name: 'ai_abac_denials_total',
  help: 'Total number of ABAC policy denials from OPA pre-filter',
  registers: [register]
});

/** Histogram: end-to-end query latency in milliseconds */
const queryLatency = new client.Histogram({
  name: 'ai_query_latency_ms',
  help: 'End-to-end query pipeline latency in milliseconds',
  buckets: [100, 500, 1000, 2000, 5000, 10000, 15000, 30000],
  registers: [register]
});

/** Histogram: LLM inference (mock or real) latency in milliseconds */
const llmInferenceLatency = new client.Histogram({
  name: 'ai_llm_inference_latency_ms',
  help: 'LLM inference dispatch latency in milliseconds (mock or Ollama)',
  buckets: [50, 100, 200, 500, 1000, 2000, 5000],
  registers: [register]
});

module.exports = {
  register,
  chunksIngested,
  abacDenials,
  queryLatency,
  llmInferenceLatency
};
