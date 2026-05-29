/**
 * Prompt Firewall Orchestrator
 * Executes Layer 1 → Layer 2 → Layer 3 in sequence.
 * Rejection at any layer = immediate HTTP 400, no LLM call.
 */
const { normalizeInput } = require('./layer1_normalizer');
const { classifyIntent } = require('./layer2_classifier');
const { buildStructuredPrompt, validatePromptStructure } = require('./layer3_vault');

/**
 * Run the full 3-layer firewall on a user query.
 *
 * @param {string} rawQuery
 * @param {Array} parentChunks - Retrieved parent chunks from cross-encoder
 * @param {object} userCtx - { clearance_level, role, department }
 * @returns {{ blocked: boolean, reason?: string, layer?: number, prompt?: string, normalized?: string, flags?: string[] }}
 */
async function runFirewall(rawQuery, parentChunks = [], userCtx = {}) {
  // ── Layer 1: Unicode Normalization ──────────────────────────────────────────
  let normResult;
  try {
    normResult = normalizeInput(rawQuery);
  } catch (err) {
    return {
      blocked: true,
      layer: 1,
      reason: `L1_NORMALIZER_REJECTED: ${err.message}`,
      code: 'EMPTY_QUERY'
    };
  }

  const { normalized, flagged, flags } = normResult;

  // Log suspicious inputs (don't block on flags alone — L2 handles intent)
  if (flagged) {
    console.warn('[FIREWALL L1] Suspicious input flags:', flags, '| Query:', normalized.substring(0, 50));
  }

  // ── Layer 2: Intent Classification ──────────────────────────────────────────
  let classifyResult;
  try {
    classifyResult = await classifyIntent(normalized);
  } catch (err) {
    console.error('[FIREWALL L2] Classifier error:', err.message);
    // Fail open for classifier errors (don't block legitimate users on model errors)
    classifyResult = { safe: true, score: 0.0, label: 'SAFE_FALLBACK', bypassed: false };
  }

  if (!classifyResult.safe) {
    console.warn('[FIREWALL L2] Query blocked — UNSAFE intent detected', {
      score: classifyResult.score,
      label: classifyResult.label,
      query_prefix: normalized.substring(0, 80)
    });
    return {
      blocked: true,
      layer: 2,
      reason: `L2_CLASSIFIER_REJECTED: Intent score ${classifyResult.score.toFixed(3)} >= threshold ${require('./layer2_classifier').REJECT_THRESHOLD}`,
      code: 'UNSAFE_INTENT',
      score: classifyResult.score
    };
  }

  // ── Layer 3: XML Vault Construction ─────────────────────────────────────────
  const prompt = buildStructuredPrompt(normalized, parentChunks, userCtx);

  const validation = validatePromptStructure(prompt);
  if (!validation.valid) {
    console.error('[FIREWALL L3] Prompt validation failed:', validation.errors);
    return {
      blocked: true,
      layer: 3,
      reason: `L3_VAULT_INVALID: ${validation.errors.join('; ')}`,
      code: 'PROMPT_STRUCTURE_ERROR'
    };
  }

  return {
    blocked: false,
    prompt,
    normalized,
    flags,
    classifier: {
      safe: classifyResult.safe,
      score: classifyResult.score,
      bypassed: classifyResult.bypassed
    }
  };
}

module.exports = { runFirewall };
