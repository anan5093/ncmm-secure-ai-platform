/**
 * Unit Test: Parent-Child Chunker
 */
const { chunkDocument, tokenise, createWindows } = require('../../backend/src/ingestion/chunker');

const SAMPLE_DOC = {
  document_id: 'test-doc-001',
  clearance_level: 1,
  department: 'PORT_OPS',
  source_path: '/test/sample.txt',
  document_category: 'port_manifest',
  port_code: 'VIZAG'
};

// 600-word sample text about NCMM
const SAMPLE_TEXT = `National Critical Mineral Mission port operations report for Visakhapatnam.
Battery-grade lithium carbonate consignment of 2400 metric tonnes arrived from Australia.
The vessel MV Oceanic Pioneer docked at berth number seven on 15 March 2025.
Customs clearance was completed within 24 hours by Superintendent Ramachandra.
The consignment was stored in temperature-controlled warehouse VIZAG-W7.
Strategic reserves for lithium carbonate now stand at 18750 metric tonnes.
This covers approximately 8.2 months of current EV battery manufacturing demand.
The target reserve level for FY2025-26 is 25000 metric tonnes of lithium carbonate.
Next scheduled consignment from Pilbara Lithium Exports is expected on 5 April 2025.
Quality verification samples have been forwarded to the Geological Survey of India laboratory.
Cobalt hydroxide from Democratic Republic of Congo is also expected at VIZAG port.
Nickel shipments from Philippines are scheduled for the second week of April 2025.
Manganese ore from South Africa Kalahari fields will arrive by end of April 2025.
All consignments are subject to CIMS-III verification procedures as per NCMM guidelines.
Strategic reserve levels must be maintained above the 6-month minimum threshold.
The port operations team at VIZAG has been augmented with additional NCMM inspectors.
Supply chain risk assessments indicate high dependency on Australian lithium exports.
Diversification to Argentina and Chile sources is recommended in the procurement plan.
India currently imports 78 percent of its lithium requirements from international sources.
Domestic production from Rajasthan deposits is expected to commence by FY2027-28.
The Degana-Nagaur lithium deposit has an estimated resource of 5.9 million tonnes.
Cobalt demand is expected to grow by 340 percent by 2030 due to EV battery expansion.
Current cobalt strategic reserves stand at 8400 metric tonnes sufficient for 26 months.
The Democratic Republic of Congo supplies 67 percent of India's cobalt import volume.
Supplier diversification to Philippines and Australia is a high priority action item.
Grid-scale vanadium redox flow batteries require consistent vanadium pentoxide supply.
Vanadium imports from Russia totalled 800 metric tonnes in the latest quarterly report.
Rare earth elements including lanthanum cerium praseodymium and neodymium are critical.
China controls 82 percent of global rare earth processing creating concentration risk.
Australia's Lynas Rare Earths is a strategic alternative supplier for mixed rare earth oxides.
The NCMM FY2025-26 procurement budget allocation stands at 18500 crore Indian rupees.`;

describe('Document Chunker', () => {
  test('returns parents and children arrays', () => {
    const { parents, children } = chunkDocument(SAMPLE_TEXT, SAMPLE_DOC);
    expect(Array.isArray(parents)).toBe(true);
    expect(Array.isArray(children)).toBe(true);
  });

  test('produces at least one parent chunk', () => {
    const { parents } = chunkDocument(SAMPLE_TEXT, SAMPLE_DOC);
    expect(parents.length).toBeGreaterThan(0);
  });

  test('produces multiple child chunks per parent', () => {
    const { parents, children } = chunkDocument(SAMPLE_TEXT, SAMPLE_DOC);
    expect(children.length).toBeGreaterThan(parents.length);
  });

  test('parent chunks have chunk_type = parent', () => {
    const { parents } = chunkDocument(SAMPLE_TEXT, SAMPLE_DOC);
    parents.forEach(p => expect(p.chunk_type).toBe('parent'));
  });

  test('child chunks have chunk_type = child', () => {
    const { children } = chunkDocument(SAMPLE_TEXT, SAMPLE_DOC);
    children.forEach(c => expect(c.chunk_type).toBe('child'));
  });

  test('children reference their parent via parent_chunk_id', () => {
    const { parents, children } = chunkDocument(SAMPLE_TEXT, SAMPLE_DOC);
    const parentIds = new Set(parents.map(p => p.chunk_id));
    children.forEach(c => {
      expect(parentIds.has(c.parent_chunk_id)).toBe(true);
    });
  });

  test('clearance_level is propagated to all chunks', () => {
    const { parents, children } = chunkDocument(SAMPLE_TEXT, SAMPLE_DOC);
    [...parents, ...children].forEach(chunk => {
      expect(chunk.clearance_level).toBe(SAMPLE_DOC.clearance_level);
    });
  });

  test('department is propagated to all chunks', () => {
    const { parents, children } = chunkDocument(SAMPLE_TEXT, SAMPLE_DOC);
    [...parents, ...children].forEach(chunk => {
      expect(chunk.department).toBe(SAMPLE_DOC.department);
    });
  });

  test('source_path is propagated to all chunks', () => {
    const { parents, children } = chunkDocument(SAMPLE_TEXT, SAMPLE_DOC);
    [...parents, ...children].forEach(chunk => {
      expect(chunk.source_path).toBe(SAMPLE_DOC.source_path);
    });
  });

  test('port_code is propagated from document', () => {
    const { parents } = chunkDocument(SAMPLE_TEXT, SAMPLE_DOC);
    parents.forEach(p => expect(p.port_code).toBe('VIZAG'));
  });

  test('port_code is null when document has no port_code', () => {
    const doc = { ...SAMPLE_DOC, port_code: null };
    const { parents } = chunkDocument(SAMPLE_TEXT, doc);
    parents.forEach(p => expect(p.port_code).toBeNull());
  });

  test('each chunk has a unique chunk_id', () => {
    const { parents, children } = chunkDocument(SAMPLE_TEXT, SAMPLE_DOC);
    const ids = [...parents, ...children].map(c => c.chunk_id);
    const unique = new Set(ids);
    expect(unique.size).toBe(ids.length);
  });

  test('parent chunks have null parent_chunk_id', () => {
    const { parents } = chunkDocument(SAMPLE_TEXT, SAMPLE_DOC);
    parents.forEach(p => expect(p.parent_chunk_id).toBeNull());
  });

  test('tokenise splits on whitespace correctly', () => {
    const tokens = tokenise('hello world test');
    expect(tokens).toEqual(['hello', 'world', 'test']);
  });

  test('tokenise filters empty tokens', () => {
    const tokens = tokenise('  hello   world  ');
    expect(tokens).not.toContain('');
  });

  test('createWindows handles text shorter than window size', () => {
    const tokens = ['a', 'b', 'c'];
    const windows = createWindows(tokens, 512, 50);
    expect(windows.length).toBe(1);
    expect(windows[0]).toEqual(tokens);
  });
});
