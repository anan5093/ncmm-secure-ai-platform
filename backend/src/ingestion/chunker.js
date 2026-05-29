/**
 * Parent-Child Chunker — NCMM Ingestion Pipeline
 * Parent chunks: 512-token windows, 50-token overlap
 * Child chunks:  128-token windows, 20-token overlap per parent
 * All chunks inherit clearance_level, department, source_path from document.
 */
const { v4: uuidv4 } = (() => {
  try { return require('uuid'); }
  catch { return { v4: () => require('crypto').randomUUID() }; }
})();

const PARENT_CHUNK_SIZE = 512;  // tokens
const PARENT_OVERLAP    = 50;
const CHILD_CHUNK_SIZE  = 128;  // tokens
const CHILD_OVERLAP     = 20;

/**
 * Naive word-based tokeniser (approximates BPE token count).
 * 1 token ≈ 0.75 words on average, but for splitting we use words directly.
 */
function tokenise(text) {
  return text.split(/\s+/).filter(Boolean);
}

function joinTokens(tokens) {
  return tokens.join(' ');
}

/**
 * Create overlapping windows over a token array.
 */
function createWindows(tokens, windowSize, overlap) {
  const windows = [];
  const step = windowSize - overlap;
  for (let i = 0; i < tokens.length; i += step) {
    const window = tokens.slice(i, i + windowSize);
    windows.push(window);
    if (i + windowSize >= tokens.length) break;
  }
  return windows;
}

/**
 * Chunk a document into parent-child hierarchy.
 * @param {string} text - Full document text
 * @param {object} docRecord - MongoDB document record (for field inheritance)
 * @returns {{ parents: object[], children: object[] }}
 */
function chunkDocument(text, docRecord) {
  const tokens = tokenise(text);
  const parentWindows = createWindows(tokens, PARENT_CHUNK_SIZE, PARENT_OVERLAP);

  const parents = [];
  const children = [];

  for (let pIdx = 0; pIdx < parentWindows.length; pIdx++) {
    const parentTokens = parentWindows[pIdx];
    const parentText = joinTokens(parentTokens);
    const parentChunkId = require('crypto').randomUUID();

    const parent = {
      chunk_id: parentChunkId,
      document_id: docRecord._id || docRecord.document_id,
      chunk_type: 'parent',
      chunk_index: pIdx,
      chunk_text: parentText,
      token_count: parentTokens.length,
      // Inherited security attributes
      clearance_level: docRecord.clearance_level,
      department: docRecord.department,
      source_path: docRecord.source_path,
      document_category: docRecord.document_category,
      port_code: docRecord.port_code || null,
      parent_chunk_id: null,
      // Embedding fields (set during embedding step)
      embedding_model: null,
      embedding_dim: null,
      vector_hash: null,
    };

    parents.push(parent);

    // Create child chunks for this parent
    const childWindows = createWindows(parentTokens, CHILD_CHUNK_SIZE, CHILD_OVERLAP);
    for (let cIdx = 0; cIdx < childWindows.length; cIdx++) {
      const childTokens = childWindows[cIdx];
      const childText = joinTokens(childTokens);

      const child = {
        chunk_id: require('crypto').randomUUID(),
        document_id: parent.document_id,
        chunk_type: 'child',
        chunk_index: cIdx,
        chunk_text: childText,
        token_count: childTokens.length,
        // Security inheritance
        clearance_level: docRecord.clearance_level,
        department: docRecord.department,
        source_path: docRecord.source_path,
        document_category: docRecord.document_category,
        port_code: docRecord.port_code || null,
        parent_chunk_id: parentChunkId,
        // Embedding fields
        embedding_model: null,
        embedding_dim: null,
        vector_hash: null,
      };

      children.push(child);
    }
  }

  return { parents, children };
}

module.exports = { chunkDocument, tokenise, createWindows };
