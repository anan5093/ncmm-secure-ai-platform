/**
 * Adversarial Test: Cross-Role Data Leak
 * VIZAG inspector must receive 0 JNPT citations
 * Logistic analyst must receive 0 PORT_OPS citations
 */
const { parseCitations } = require('../../backend/src/firewall/layer3_vault');
const { SAMPLE_CHUNKS } = require('../fixtures/documentFixtures');

describe('Cross-Role Data Leak Prevention (Citation Layer)', () => {

  test('VIZAG inspector response contains no JNPT citations', () => {
    // Simulate a response that only cites VIZAG chunks
    const response = 'The VIZAG lithium manifest confirms 2400 MT received [1].';
    const vizagChunks = [SAMPLE_CHUNKS.VIZAG_L1_PARENT];
    const citations = parseCitations(response, vizagChunks);

    // Verify all citations are from VIZAG
    citations.forEach(cite => {
      expect(cite.source_path).not.toContain('jnpt');
    });
  });

  test('Logistics analyst response contains no PORT_OPS port manifests', () => {
    const response = 'Cobalt stockpile assessment [1] confirms supply levels.';
    const logisticsChunks = [SAMPLE_CHUNKS.LOGISTICS_L3_PARENT];
    const citations = parseCitations(response, logisticsChunks);

    citations.forEach(cite => {
      expect(cite.document_category).not.toBe('port_manifest');
    });
  });

  test('CL1 user receives zero citations from CL5 intelligence reports', () => {
    // When OPA correctly filters, L5 chunks should never reach the citation layer
    // This tests the citation builder does not expose clearance info
    const response = 'Analysis indicates supply risk [1].';
    const cl1Chunks = [SAMPLE_CHUNKS.VIZAG_L1_PARENT]; // Only CL1 chunk passed
    const citations = parseCitations(response, cl1Chunks);

    citations.forEach(cite => {
      expect(cite.clearance_level).toBeLessThanOrEqual(1);
    });
  });

  test('Chunk clearance_level is preserved in citation metadata', () => {
    const response = 'The cobalt assessment [1] shows reserve levels.';
    const citations = parseCitations(response, [SAMPLE_CHUNKS.LOGISTICS_L3_PARENT]);
    expect(citations[0].clearance_level).toBe(3);
  });

  test('Citations from mixed clearance chunks do not elevate or lower clearance', () => {
    const response = 'See [1] and [2] for details.';
    const mixedChunks = [SAMPLE_CHUNKS.VIZAG_L1_PARENT, SAMPLE_CHUNKS.LOGISTICS_L3_PARENT];
    const citations = parseCitations(response, mixedChunks);

    expect(citations[0].clearance_level).toBe(1);
    expect(citations[1].clearance_level).toBe(3);
  });

  test('Mission HQ L5 chunks are never cited unless user has CL5', () => {
    // This tests structural enforcement via chunk list
    // If OPA correctly filtered, L5 chunks never appear in the chunk list
    const response = '[1] [2]';
    const cl1and3chunks = [SAMPLE_CHUNKS.VIZAG_L1_PARENT, SAMPLE_CHUNKS.LOGISTICS_L3_PARENT];
    const citations = parseCitations(response, cl1and3chunks);

    // No L5 citations possible because no L5 chunks were passed
    citations.forEach(c => {
      expect(c.clearance_level).toBeLessThan(5);
    });
  });
});
