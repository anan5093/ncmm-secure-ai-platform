/**
 * Embedder — NCMM Ingestion Pipeline
 * [DEV ADAPTATION] Uses all-MiniLM-L6-v2 (384-dim) instead of nomic-embed-text-v1 (768-dim)
 * Model is cached to disk by @xenova/transformers after first download (~90MB).
 */
require('dotenv').config({ path: require('path').resolve(__dirname, '../../../.env') });

const crypto = require('crypto');

const EMBEDDING_MODEL = process.env.EMBEDDING_MODEL || 'Xenova/all-MiniLM-L6-v2';
const EMBEDDING_DIM = parseInt(process.env.EMBEDDING_DIM || '384');

let embedder = null;
let pipelineModule = null;

/**
 * Lazy-initialise the embedding pipeline.
 * Model is downloaded on first call and cached locally.
 */
async function getEmbedder() {
  if (!embedder) {
    if (!pipelineModule) {
      console.log(`[EMBEDDER] Loading @xenova/transformers...`);
      pipelineModule = await import('@xenova/transformers');
    }
    console.log(`[EMBEDDER] Initialising model: ${EMBEDDING_MODEL} (${EMBEDDING_DIM}-dim)`);
    embedder = await pipelineModule.pipeline('feature-extraction', EMBEDDING_MODEL, {
      // Cache model to local disk
      cache_dir: './models/embeddings'
    });
    console.log(`[EMBEDDER] Model ready.`);
  }
  return embedder;
}

/**
 * Embed a single text string.
 * @param {string} text
 * @returns {number[]} Float32 array of length EMBEDDING_DIM
 */
async function embedText(text) {
  const fn = await getEmbedder();
  const output = await fn(text, { pooling: 'mean', normalize: true });
  return Array.from(output.data);
}

/**
 * Compute SHA-256 of an embedding vector for deduplication.
 * @param {number[]} embedding
 * @returns {string} hex hash
 */
function hashEmbedding(embedding) {
  const buffer = Buffer.from(new Float32Array(embedding).buffer);
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

/**
 * Embed a batch of texts (sequential to avoid OOM on 4GB machines).
 * @param {string[]} texts
 * @returns {number[][]}
 */
async function embedBatch(texts) {
  const embeddings = [];
  for (const text of texts) {
    const emb = await embedText(text);
    embeddings.push(emb);
  }
  return embeddings;
}

module.exports = { embedText, embedBatch, hashEmbedding, EMBEDDING_DIM };
