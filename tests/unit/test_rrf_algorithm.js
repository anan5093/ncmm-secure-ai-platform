/**
 * Unit Test: Reciprocal Rank Fusion Algorithm
 */
const { reciprocalRankFusion } = require('../../backend/src/search/rrfFusion');

describe('Reciprocal Rank Fusion', () => {
  const semanticList = [
    { id: 'a', score: 0.95 },
    { id: 'b', score: 0.85 },
    { id: 'c', score: 0.75 },
    { id: 'd', score: 0.65 }
  ];

  const lexicalList = [
    { id: 'c', score: 10.5 },
    { id: 'a', score: 8.2 },
    { id: 'e', score: 7.1 },
    { id: 'b', score: 6.0 }
  ];

  test('returns items ranked by combined RRF score', () => {
    const results = reciprocalRankFusion(semanticList, lexicalList);
    expect(results.length).toBeGreaterThan(0);
    expect(results[0]).toHaveProperty('id');
    expect(results[0]).toHaveProperty('rrf_score');
  });

  test('items appearing in both lists rank higher', () => {
    const results = reciprocalRankFusion(semanticList, lexicalList);
    // 'a' is rank 0 in semantic, rank 1 in lexical — should rank high
    // 'e' is only in lexical — should rank lower
    const aResult = results.find(r => r.id === 'a');
    const eResult = results.find(r => r.id === 'e');
    if (aResult && eResult) {
      expect(aResult.rrf_score).toBeGreaterThan(eResult.rrf_score);
    }
  });

  test('RRF scores are computed correctly for known inputs', () => {
    const s = [{ id: 'x', score: 1.0 }];
    const l = [{ id: 'x', score: 1.0 }];
    const results = reciprocalRankFusion(s, l, 60);
    // Both at rank 0: RRF = 1/(60+1) + 1/(60+1) = 2/61 ≈ 0.0328
    expect(results[0].rrf_score).toBeCloseTo(2 / 61, 4);
  });

  test('respects topN limit', () => {
    const results = reciprocalRankFusion(semanticList, lexicalList, 60, 3);
    expect(results.length).toBeLessThanOrEqual(3);
  });

  test('handles empty semantic list', () => {
    const results = reciprocalRankFusion([], lexicalList);
    expect(results.length).toBe(lexicalList.length);
    expect(results[0].id).toBe('c'); // rank 0 in lexical
  });

  test('handles empty lexical list', () => {
    const results = reciprocalRankFusion(semanticList, []);
    expect(results.length).toBe(semanticList.length);
    expect(results[0].id).toBe('a'); // rank 0 in semantic
  });

  test('handles both empty lists', () => {
    const results = reciprocalRankFusion([], []);
    expect(results).toEqual([]);
  });

  test('handles overlapping IDs — does not double count IDs', () => {
    const s = [{ id: 'x' }, { id: 'y' }];
    const l = [{ id: 'x' }, { id: 'y' }];
    const results = reciprocalRankFusion(s, l);
    const ids = results.map(r => r.id);
    const uniqueIds = [...new Set(ids)];
    expect(ids.length).toBe(uniqueIds.length); // no duplicate IDs
  });

  test('results are sorted by descending rrf_score', () => {
    const results = reciprocalRankFusion(semanticList, lexicalList);
    for (let i = 1; i < results.length; i++) {
      expect(results[i - 1].rrf_score).toBeGreaterThanOrEqual(results[i].rrf_score);
    }
  });

  test('uses k=60 by default', () => {
    const s = [{ id: 'x' }];
    const l = [];
    const results = reciprocalRankFusion(s, l);
    // rank 0 in one list only: 1/(60+0+1) = 1/61
    expect(results[0].rrf_score).toBeCloseTo(1 / 61, 4);
  });

  test('custom k value changes scores correctly', () => {
    const s = [{ id: 'x' }];
    const l = [];
    const r10 = reciprocalRankFusion(s, l, 10);
    const r60 = reciprocalRankFusion(s, l, 60);
    // Smaller k = higher score
    expect(r10[0].rrf_score).toBeGreaterThan(r60[0].rrf_score);
  });
});
