/**
 * Unit Test: Citation Builder
 */
const { parseCitations } = require('../../backend/src/firewall/layer3_vault');
const { SAMPLE_CHUNKS } = require('../fixtures/documentFixtures');

const PARENT_CHUNKS = [
  SAMPLE_CHUNKS.VIZAG_L1_PARENT,
  SAMPLE_CHUNKS.JNPT_L1_PARENT,
  SAMPLE_CHUNKS.LOGISTICS_L3_PARENT
];

describe('Citation Builder', () => {
  test('extracts single citation correctly', () => {
    const citations = parseCitations('Based on source [1], lithium reserves are adequate.', PARENT_CHUNKS);
    expect(citations.length).toBe(1);
    expect(citations[0].citation_id).toBe(1);
    expect(citations[0].chunk_id).toBe(SAMPLE_CHUNKS.VIZAG_L1_PARENT.chunk_id);
  });

  test('extracts multiple citations in order', () => {
    const citations = parseCitations('Data from [1] and [3] supports this.', PARENT_CHUNKS);
    expect(citations.length).toBe(2);
    expect(citations.map(c => c.citation_id)).toContain(1);
    expect(citations.map(c => c.citation_id)).toContain(3);
  });

  test('citation contains source_path', () => {
    const citations = parseCitations('See [2].', PARENT_CHUNKS);
    expect(citations[0].source_path).toBe(SAMPLE_CHUNKS.JNPT_L1_PARENT.source_path);
  });

  test('citation contains clearance_level from chunk', () => {
    const citations = parseCitations('See [3].', PARENT_CHUNKS);
    expect(citations[0].clearance_level).toBe(3);
  });

  test('citation contains chunk_id', () => {
    const citations = parseCitations('[1] confirms the data.', PARENT_CHUNKS);
    expect(citations[0].chunk_id).toBeDefined();
    expect(citations[0].chunk_id).toBe(PARENT_CHUNKS[0].chunk_id);
  });

  test('mock LLM response format parses correctly', () => {
    const mockResponse = '[MOCK LLM RESPONSE] This is a deterministic test response. Sources cited: [1] [2]. This confirms the pipeline worked.';
    const citations = parseCitations(mockResponse, PARENT_CHUNKS);
    expect(citations.length).toBe(2);
  });

  test('deduplicates citations', () => {
    const citations = parseCitations('[1] [1] [1]', PARENT_CHUNKS);
    expect(citations.length).toBe(1);
  });

  test('empty response returns empty citations', () => {
    const citations = parseCitations('', PARENT_CHUNKS);
    expect(citations).toEqual([]);
  });

  test('response with no citation markers returns empty', () => {
    const citations = parseCitations('No relevant information found.', PARENT_CHUNKS);
    expect(citations).toEqual([]);
  });

  test('citation IDs beyond available chunks are ignored', () => {
    const citations = parseCitations('[4] [5] [100]', PARENT_CHUNKS);
    expect(citations).toEqual([]);
  });

  test('citation [0] is ignored (1-indexed)', () => {
    const citations = parseCitations('[0]', PARENT_CHUNKS);
    expect(citations).toEqual([]);
  });

  test('source_name is derived from source_path filename', () => {
    const citations = parseCitations('[1]', PARENT_CHUNKS);
    expect(citations[0].source_name).toContain('vizag_lithium_manifest_2025.txt');
  });

  test('handles empty chunk list gracefully', () => {
    const citations = parseCitations('[1] [2]', []);
    expect(citations).toEqual([]);
  });
});
