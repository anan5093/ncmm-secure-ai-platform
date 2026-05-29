/**
 * Reciprocal Rank Fusion (RRF)
 * Merges semantic (FAISS) and lexical (BM25) result lists.
 * k=60 is the standard RRF constant (prevents high-rank dominance).
 * Returns top-20 candidates for cross-encoder re-ranking.
 */

/**
 * Reciprocal Rank Fusion over two ranked lists.
 * @param {Array<{id: string, score?: number, distance?: number}>} semanticList - FAISS results
 * @param {Array<{id: string, score: number}>} lexicalList - BM25 results
 * @param {number} k - RRF constant (default 60)
 * @param {number} topN - Number of top results to return (default 20)
 * @returns {Array<{id: string, rrf_score: number}>}
 */
function reciprocalRankFusion(semanticList, lexicalList, k = 60, topN = 20) {
  const scores = new Map();

  [semanticList, lexicalList].forEach(list => {
    list.forEach((item, rank) => {
      const prev = scores.get(item.id) || 0;
      scores.set(item.id, prev + 1 / (k + rank + 1));
    });
  });

  return [...scores.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, topN)
    .map(([id, rrf_score]) => ({ id, rrf_score }));
}

module.exports = { reciprocalRankFusion };
