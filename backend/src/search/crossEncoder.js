/**
 * Cross-Encoder Re-Ranker
 * Uses ms-marco-MiniLM-L-6-v2 ONNX model to re-rank top-20 RRF candidates.
 * K=5 for standard queries, K=10 for synthesis mode.
 * Secondary ABAC check on returned parent chunks.
 */
require('dotenv').config({ path: require('path').resolve(__dirname, '../../../.env') });

const path = require('path');
const fs = require('fs');

const MODEL_PATH = path.resolve('./models/cross-encoder');
let pipelineModule = null;
let crossEncoderPipeline = null;

/**
 * Load cross-encoder pipeline (lazy init).
 */
async function getCrossEncoder() {
  if (crossEncoderPipeline) return crossEncoderPipeline;

  const modelOnnx = path.join(MODEL_PATH, 'model.onnx');
  if (!fs.existsSync(modelOnnx)) {
    console.warn('[CROSS-ENCODER] ONNX model not found — using score pass-through');
    crossEncoderPipeline = 'passthrough';
    return crossEncoderPipeline;
  }

  try {
    if (!pipelineModule) {
      pipelineModule = await import('@xenova/transformers');
    }
    crossEncoderPipeline = await pipelineModule.pipeline(
      'text-classification',
      MODEL_PATH,
      { cache_dir: MODEL_PATH }
    );
    console.log('[CROSS-ENCODER] Model loaded from:', MODEL_PATH);
  } catch (err) {
    console.warn('[CROSS-ENCODER] Failed to load model, using pass-through:', err.message);
    crossEncoderPipeline = 'passthrough';
  }
  return crossEncoderPipeline;
}

/**
 * Re-rank candidates using cross-encoder.
 * Fetches parent chunks from MongoDB, applies secondary ABAC check,
 * then scores query-chunk pairs.
 *
 * @param {string} query - Normalized user query
 * @param {Array<{id: string, rrf_score: number}>} candidates - Top-20 from RRF (child chunk IDs)
 * @param {object} ChunkModel - Mongoose model for chunks collection
 * @param {object} user - Authenticated user context
 * @param {number} K - Number of final results (5 or 10)
 * @returns {Array<object>} Top-K parent chunks
 */
async function reRank(query, candidates, ChunkModel, user, K = 5) {
  if (candidates.length === 0) return [];

  const startTime = Date.now();

  // 1. Fetch child chunks from MongoDB
  const childChunkIds = candidates.map(c => c.id);
  const childChunks = await ChunkModel.find({ chunk_id: { $in: childChunkIds } }).lean();

  // 2. Collect unique parent chunk IDs
  const parentChunkIds = [...new Set(
    childChunks
      .filter(c => c.parent_chunk_id)
      .map(c => c.parent_chunk_id)
  )];

  if (parentChunkIds.length === 0) return [];

  // 3. Fetch parent chunks
  let parentChunks = await ChunkModel.find({ chunk_id: { $in: parentChunkIds } }).lean();

  // 4. Secondary ABAC check — mission director (CL5) bypasses, others must match
  parentChunks = parentChunks.filter(chunk => {
    // Clearance level check
    if (user.clearance_level < chunk.clearance_level) return false;

    // Department check (unless mission director)
    if (user.clearance_level < 5 && user.department !== chunk.department) return false;

    // Port inspector port check
    if (user.role === 'ROLE_PORT_INSPECTOR' && chunk.port_code && chunk.port_code !== user.assigned_port) {
      return false;
    }

    return true;
  });

  if (parentChunks.length === 0) return [];

  // 5. Score with cross-encoder
  const clf = await getCrossEncoder();

  let scored;
  if (clf === 'passthrough') {
    // Pass-through: use RRF scores from child chunks as proxy
    const rrfScoreMap = new Map(candidates.map(c => [c.id, c.rrf_score]));
    scored = parentChunks.map(chunk => {
      // Average RRF scores of child chunks that belong to this parent
      const relevantChildren = childChunks.filter(c => c.parent_chunk_id === chunk.chunk_id);
      const avgScore = relevantChildren.reduce((sum, c) => {
        return sum + (rrfScoreMap.get(c.chunk_id) || 0);
      }, 0) / Math.max(relevantChildren.length, 1);
      return { ...chunk, cross_encoder_score: avgScore };
    });
  } else {
    // Real cross-encoder scoring
    const pairs = parentChunks.map(chunk => [query, chunk.chunk_text.substring(0, 512)]);
    try {
      const results = await clf(pairs);
      scored = parentChunks.map((chunk, i) => ({
        ...chunk,
        cross_encoder_score: Array.isArray(results) ? results[i]?.score || 0 : 0
      }));
    } catch (err) {
      console.error('[CROSS-ENCODER] Scoring error:', err.message);
      scored = parentChunks.map(chunk => ({ ...chunk, cross_encoder_score: 0 }));
    }
  }

  // 6. Sort by score and return top-K
  const topK = scored
    .sort((a, b) => b.cross_encoder_score - a.cross_encoder_score)
    .slice(0, K);

  const elapsed = Date.now() - startTime;
  console.log(`[CROSS-ENCODER] Re-ranked ${parentChunks.length} parents → top ${topK.length} in ${elapsed}ms`);

  return topK;
}

module.exports = { reRank };
