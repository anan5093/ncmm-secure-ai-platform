/**
 * Mock LLM Server — NCMM Local Dev Edition
 * [DEV ADAPTATION] Replaces Gemma 7B / Ollama on Node 2.
 * Mirrors the Ollama /api/generate contract exactly.
 * Set MOCK_LLM_RESPONSE_DELAY_MS=0 for fast test runs.
 */
require('dotenv').config({ path: require('path').resolve(__dirname, '../../../.env') });

const express = require('express');
const app = express();
app.use(express.json());

const MOCK_DELAY_MS = parseInt(process.env.MOCK_LLM_RESPONSE_DELAY_MS || '500');

// Mirrors Ollama /api/generate contract exactly
app.post('/api/generate', async (req, res) => {
  const { prompt, model } = req.body;

  if (!prompt) {
    return res.status(400).json({ error: 'prompt is required' });
  }

  // Simulate processing delay (configurable — set to 0 for fast tests)
  await new Promise(r => setTimeout(r, MOCK_DELAY_MS));

  // Extract context IDs from the XML vault prompt to produce grounded citations
  const contextMatches = [...prompt.matchAll(/<context id="(\d+)"/g)];
  const contextIds = contextMatches.map(m => m[1]);

  const citationText = contextIds.length > 0
    ? contextIds.map(id => `[${id}]`).join(' ')
    : '[No context provided]';

  // Extract the user query for a more realistic response
  const queryMatch = prompt.match(/<user_query[^>]*>([\s\S]*?)<\/user_query>/);
  const userQuery = queryMatch ? queryMatch[1].trim() : 'your query';

  // Response mirrors Ollama's response schema
  res.json({
    model: model || 'mock-gemma-7b',
    response: `Based on the classified intelligence documents provided, here is the analysis for: "${userQuery.substring(0, 80)}". ` +
              `The retrieved context indicates relevant operational data has been identified and processed. ` +
              `Sources cited: ${citationText}. ` +
              `This response confirms the full RAG pipeline executed correctly ` +
              `through OPA → FAISS → BM25 → RRF → Cross-Encoder → Firewall → LLM dispatch. ` +
              `[MOCK LLM — Replace with Ollama + Gemma 7B in production]`,
    done: true,
    context: [],
    total_duration: MOCK_DELAY_MS * 1000000,
    load_duration: 0,
    prompt_eval_count: prompt.length,
    eval_count: 50,
    eval_duration: MOCK_DELAY_MS * 1000000
  });
});

// Health check — mirrors Ollama health endpoint
app.get('/api/tags', (req, res) => {
  res.json({ models: [{ name: 'mock-gemma-7b', size: 0, digest: 'mock-dev', modified_at: new Date().toISOString() }] });
});

// Version endpoint
app.get('/api/version', (req, res) => {
  res.json({ version: '0.0.1-mock' });
});

const PORT = parseInt(process.env.MOCK_LLM_PORT || '11434');
app.listen(PORT, '127.0.0.1', () => {
  console.log('');
  console.log('╔══════════════════════════════════════════════════╗');
  console.log('║           NCMM MOCK LLM SERVER                  ║');
  console.log('╠══════════════════════════════════════════════════╣');
  console.log(`║  Endpoint: http://127.0.0.1:${PORT}              ║`);
  console.log(`║  Delay:    ${MOCK_DELAY_MS}ms (set MOCK_LLM_RESPONSE_DELAY_MS=0) ║`);
  console.log('║  Model:    mock-gemma-7b                         ║');
  console.log('║  ⚠️  NOT a real LLM — for development only       ║');
  console.log('╚══════════════════════════════════════════════════╝');
  console.log('');
});

module.exports = app; // for testing
