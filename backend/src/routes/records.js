/**
 * Records Route — Supply Chain Data Grid
 * GET /api/v1/records — OPA-filtered server-side
 */
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { authenticateJWT, requireRole } = require('../middleware/auth');
const { filterDocumentsByOPA } = require('../middleware/abac');

const documentSchema = new mongoose.Schema({
  document_id: String, title: String, source_path: String, clearance_level: Number,
  department: String, document_category: String, port_code: String,
  classification: String, author: String, date_issued: String,
  keywords: [String], ingested_at: Date, chunk_count: Number
}, { collection: 'documents' });

let DocumentModel;
function getModel() {
  if (!DocumentModel) DocumentModel = mongoose.models.Document || mongoose.model('Document', documentSchema);
  return DocumentModel;
}

/**
 * GET /api/v1/records
 * Query params: page (default 1), limit (default 25), category, port_code
 */
router.get('/', authenticateJWT, requireRole([
  'ROLE_LOGISTICS_ANALYST', 'ROLE_MISSION_DIRECTOR'
]), async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, parseInt(req.query.limit) || 25);
    const skip = (page - 1) * limit;
    const { category, port_code } = req.query;

    const Document = getModel();
    const allDocs = await Document.find({}).lean();

    // OPA server-side filter
    const permittedIds = await filterDocumentsByOPA(req.user, allDocs);
    let query = { document_id: { $in: permittedIds } };

    if (category) query.document_category = category;
    if (port_code) query.port_code = port_code.toUpperCase();

    const [records, total] = await Promise.all([
      Document.find(query)
        .skip(skip)
        .limit(limit)
        .sort({ ingested_at: -1 })
        .lean(),
      Document.countDocuments(query)
    ]);

    return res.json({
      records,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (err) {
    console.error('[RECORDS]', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/v1/records/:document_id
 */
router.get('/:document_id', authenticateJWT, async (req, res) => {
  try {
    const Document = getModel();
    const doc = await Document.findOne({ document_id: req.params.document_id }).lean();

    if (!doc) return res.status(404).json({ error: 'Document not found' });

    // Check OPA access
    const { filterDocumentsByOPA } = require('../middleware/abac');
    const permitted = await filterDocumentsByOPA(req.user, [doc]);
    if (permitted.length === 0) {
      return res.status(403).json({ error: 'Access denied', code: 'OPA_DENIED' });
    }

    return res.json(doc);
  } catch (err) {
    return res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
