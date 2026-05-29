/**
 * Firewall Layer 2 — Intent Classifier
 * Uses ONNX runtime with a pre-trained classifier model.
 * [DEV ADAPTATION] Uses Xenova/toxic-bert as placeholder.
 * Production: Replace model.onnx with fine-tuned SAFE/UNSAFE NCMM classifier.
 *
 * Rejection threshold: 0.85 (configurable via CLASSIFIER_REJECT_THRESHOLD)
 * Allow-list: bypass classification for known safe NCMM queries
 */
require('dotenv').config({ path: require('path').resolve(__dirname, '../../../.env') });

const fs = require('fs');
const path = require('path');

const REJECT_THRESHOLD = parseFloat(process.env.CLASSIFIER_REJECT_THRESHOLD || '0.85');
const ALLOWLIST_PATH = process.env.CLASSIFIER_ALLOWLIST_PATH || './scripts/classifier_allowlist.json';
const MODEL_PATH = path.resolve('./models/intent-classifier');

let session = null;
let tokenizer = null;
let allowlist = null;
let pipelineModule = null;
let classifierPipeline = null;

/**
 * Load the allow-list from disk.
 */
function loadAllowlist() {
  if (allowlist) return allowlist;
  try {
    allowlist = JSON.parse(fs.readFileSync(ALLOWLIST_PATH, 'utf-8'));
  } catch {
    console.warn('[L2] Allow-list not found — using empty list');
    allowlist = { patterns: [], exact_phrases: [] };
  }
  return allowlist;
}

/**
 * Check if query matches allow-list patterns.
 */
function isAllowlisted(normalizedQuery) {
  const al = loadAllowlist();
  const lower = normalizedQuery.toLowerCase();

  // Exact phrase match
  if (al.exact_phrases && al.exact_phrases.some(p => lower.includes(p.toLowerCase()))) {
    return true;
  }

  // Pattern match
  if (al.patterns && al.patterns.some(p => {
    try { return new RegExp(p, 'i').test(normalizedQuery); }
    catch { return false; }
  })) {
    return true;
  }

  return false;
}

/**
 * Load classifier pipeline (lazy init).
 * Falls back to a heuristic classifier if model not found.
 */
async function getClassifier() {
  if (classifierPipeline) return classifierPipeline;

  // Check if ONNX model exists
  const modelOnnx = path.join(MODEL_PATH, 'model.onnx');
  if (!fs.existsSync(modelOnnx)) {
    console.warn('[L2] ONNX model not found — using heuristic classifier');
    console.warn('[L2] Run: node scripts/setup/download_models.ps1 to download models');
    classifierPipeline = 'heuristic';
    return classifierPipeline;
  }

  try {
    if (!pipelineModule) {
      pipelineModule = await import('@xenova/transformers');
    }
    classifierPipeline = await pipelineModule.pipeline(
      'text-classification',
      MODEL_PATH,
      { cache_dir: MODEL_PATH }
    );
    console.log('[L2] Classifier model loaded from:', MODEL_PATH);
  } catch (err) {
    console.warn('[L2] Failed to load ONNX model, using heuristic:', err.message);
    classifierPipeline = 'heuristic';
  }
  return classifierPipeline;
}

/**
 * Heuristic classifier for development when ONNX model is not available.
 * Checks for common injection patterns using regex.
 */
const INJECTION_PATTERNS = [
  // Prompt injection attempts
  /ignore\s+(previous|all|above|prior)\s+(instructions?|prompts?|commands?)/i,
  /forget\s+(everything|all|what|previous)/i,
  /you\s+are\s+now\s+(a|an|the|DAN|GPT|evil|uncensored)/i,
  /pretend\s+(you\s+are|to\s+be|that\s+you)/i,
  /act\s+as\s+(if|though|a|an)\s+(?:unrestricted|jailbreak|DAN)/i,
  /system\s*prompt\s*:/i,
  /\[SYSTEM\]/i,
  /\<system\>/i,
  /###\s*instruction/i,
  /human:\s*assistant:/i,

  // Jailbreak patterns
  /DAN\s+mode/i,
  /developer\s+mode/i,
  /jailbreak/i,
  /bypass\s+(filter|restriction|safety|policy)/i,
  /no\s+restrictions/i,
  /uncensored\s+mode/i,
  /AIM\s+mode/i,

  // Data extraction attempts
  /print\s+(your\s+)?(system|all|full)\s+(prompt|instructions)/i,
  /reveal\s+(your|the)\s+(system|hidden|secret)\s+(prompt|instructions)/i,
  /what\s+(are\s+your|is\s+your)\s+(system|hidden)\s+(instructions|prompt)/i,
  /show\s+me\s+(your\s+)?(instructions|prompt|context|document)/i,
  /output\s+(the\s+)?(raw|full|entire)\s+(context|document|prompt)/i,

  // Role confusion
  /you\s+are\s+not\s+(bound|restricted|limited)\s+by/i,
  /disregard\s+(any|all|your|the)\s+(previous|instructions|rules|constraints)/i,
  /override\s+(your|all|the)\s+(instructions|settings|rules|filters)/i,
  /from\s+now\s+on\s+(you|ignore|act|pretend)/i,
];

function heuristicClassify(query) {
  const score = INJECTION_PATTERNS.reduce((acc, pattern) => {
    return pattern.test(query) ? Math.max(acc, 0.90) : acc;
  }, 0.0);
  return { score, label: score >= REJECT_THRESHOLD ? 'UNSAFE' : 'SAFE' };
}

/**
 * Classify a normalized query.
 * @param {string} normalizedQuery
 * @returns {{ safe: boolean, score: number, label: string, bypassed: boolean }}
 */
async function classifyIntent(normalizedQuery) {
  // Allow-list check first (fast path)
  if (isAllowlisted(normalizedQuery)) {
    return { safe: true, score: 0.0, label: 'SAFE', bypassed: true };
  }

  const clf = await getClassifier();

  let score = 0.0;
  let label = 'SAFE';

  if (clf === 'heuristic') {
    const result = heuristicClassify(normalizedQuery);
    score = result.score;
    label = result.label;
  } else {
    try {
      const results = await clf(normalizedQuery, { topk: null });
      // Find the TOXIC/UNSAFE score
      const unsafeResult = results.find(r =>
        r.label.toUpperCase().includes('TOXIC') ||
        r.label.toUpperCase().includes('UNSAFE') ||
        r.label.toUpperCase() === 'LABEL_1'
      );
      score = unsafeResult ? unsafeResult.score : 0.0;
      label = score >= REJECT_THRESHOLD ? 'UNSAFE' : 'SAFE';
    } catch (err) {
      console.warn('[L2] Classifier error, using heuristic:', err.message);
      const result = heuristicClassify(normalizedQuery);
      score = result.score;
      label = result.label;
    }
  }

  return {
    safe: score < REJECT_THRESHOLD,
    score,
    label,
    bypassed: false
  };
}

module.exports = { classifyIntent, isAllowlisted, heuristicClassify, REJECT_THRESHOLD };
