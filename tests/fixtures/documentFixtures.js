/**
 * Document and chunk fixtures for unit tests
 */

const SAMPLE_CHUNKS = {
  VIZAG_L1_PARENT: {
    chunk_id: 'test-parent-vizag-001',
    document_id: 'test-doc-vizag-001',
    chunk_type: 'parent',
    chunk_index: 0,
    chunk_text: 'Battery-Grade Lithium Carbonate consignment of 2,400 metric tonnes arrived at Visakhapatnam Port from Pilbara Lithium Exports, Australia. Customs clearance completed on 16 March 2025. Storage assigned to VIZAG-W7 temperature-controlled warehouse.',
    token_count: 38,
    clearance_level: 1,
    department: 'PORT_OPS',
    source_path: '/seed/vizag_lithium_manifest_2025.txt',
    document_category: 'port_manifest',
    port_code: 'VIZAG',
    parent_chunk_id: null
  },
  JNPT_L1_PARENT: {
    chunk_id: 'test-parent-jnpt-001',
    document_id: 'test-doc-jnpt-001',
    chunk_type: 'parent',
    chunk_index: 0,
    chunk_text: 'Cobalt hydroxide consignment of 1,800 metric tonnes arrived at Jawaharlal Nehru Port Trust (JNPT) from Democratic Republic of Congo. Grade: battery-grade, >60% Co content. Vessel: MV BENGAL STAR. Bill of lading JNPT-2025-CO-0127.',
    token_count: 39,
    clearance_level: 1,
    department: 'PORT_OPS',
    source_path: '/seed/jnpt_cobalt_manifest_2025.txt',
    document_category: 'port_manifest',
    port_code: 'JNPT',
    parent_chunk_id: null
  },
  LOGISTICS_L3_PARENT: {
    chunk_id: 'test-parent-logistics-001',
    document_id: 'test-doc-logistics-001',
    chunk_type: 'parent',
    chunk_index: 0,
    chunk_text: 'India\'s cobalt strategic reserve stands at 8,400 metric tonnes as of Q1 FY2025. Current depletion rate is approximately 320 MT per month. At this rate, reserves cover 26 months of consumption. DRC supplies 67% of import volume representing a significant concentration risk.',
    token_count: 45,
    clearance_level: 3,
    department: 'LOGISTICS',
    source_path: '/seed/logistics_cobalt_stockpile_q1_2025.txt',
    document_category: 'stockpile_assessment',
    port_code: null,
    parent_chunk_id: null
  },
  MISSION_HQ_L5_PARENT: {
    chunk_id: 'test-parent-mission-001',
    document_id: 'test-doc-mission-001',
    chunk_type: 'parent',
    chunk_index: 0,
    chunk_text: 'China controls approximately 65% of global lithium refining capacity and 70% of cobalt processing capacity. India\'s dependency on Chinese-controlled supply chains creates a strategic vulnerability. In a conflict scenario, supply disruption within 18 months would critically impair India\'s EV transition program.',
    token_count: 43,
    clearance_level: 5,
    department: 'MISSION_HQ',
    source_path: '/seed/mission_hq_china_mineral_dominance_brief.txt',
    document_category: 'intelligence_report',
    port_code: null,
    parent_chunk_id: null
  }
};

const SAMPLE_DOCUMENTS = {
  VIZAG_DOC: {
    document_id: 'test-doc-vizag-001',
    title: 'VIZAG Lithium Carbonate Manifest March 2025',
    clearance_level: 1,
    department: 'PORT_OPS',
    document_category: 'port_manifest',
    port_code: 'VIZAG'
  },
  JNPT_DOC: {
    document_id: 'test-doc-jnpt-001',
    title: 'JNPT Cobalt Hydroxide Manifest 2025',
    clearance_level: 1,
    department: 'PORT_OPS',
    document_category: 'port_manifest',
    port_code: 'JNPT'
  },
  LOGISTICS_DOC: {
    document_id: 'test-doc-logistics-001',
    title: 'Cobalt Stockpile Assessment Q1 FY2025',
    clearance_level: 3,
    department: 'LOGISTICS',
    document_category: 'stockpile_assessment',
    port_code: null
  },
  MISSION_DOC: {
    document_id: 'test-doc-mission-001',
    title: 'China Mineral Dominance Intelligence Brief 2025',
    clearance_level: 5,
    department: 'MISSION_HQ',
    document_category: 'intelligence_report',
    port_code: null
  }
};

module.exports = { SAMPLE_CHUNKS, SAMPLE_DOCUMENTS };
