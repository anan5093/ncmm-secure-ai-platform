/**
 * Text Extractor — NCMM Ingestion Pipeline
 * Supports PDF, DOCX, and TXT files with sidecar .meta.json.
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

/**
 * Extract text from a document file.
 * @param {string} filePath - Absolute path to document
 * @returns {{ text: string, sha256: string }}
 */
async function extractText(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  let text = '';

  if (ext === '.pdf') {
    const pdfParse = require('pdf-parse');
    const dataBuffer = fs.readFileSync(filePath);
    const pdfData = await pdfParse(dataBuffer);
    text = pdfData.text;
  } else if (ext === '.docx') {
    const mammoth = require('mammoth');
    const result = await mammoth.extractRawText({ path: filePath });
    text = result.value;
  } else if (ext === '.txt') {
    text = fs.readFileSync(filePath, 'utf-8');
  } else {
    throw new Error(`Unsupported file type: ${ext}`);
  }

  // Normalise whitespace
  text = text.replace(/\r\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();

  const sha256 = crypto.createHash('sha256').update(text).digest('hex');
  return { text, sha256 };
}

/**
 * Load sidecar .meta.json for a document.
 * Required fields: clearance_level, department, document_category
 * @param {string} filePath - Document file path
 * @returns {object} Metadata object
 */
function loadMetadata(filePath) {
  const metaPath = filePath.replace(/\.[^.]+$/, '.meta.json');

  if (!fs.existsSync(metaPath)) {
    throw new Error(`Missing metadata file: ${metaPath}`);
  }

  const meta = JSON.parse(fs.readFileSync(metaPath, 'utf-8'));

  // Validate required fields
  const required = ['clearance_level', 'department', 'document_category', 'title'];
  for (const field of required) {
    if (meta[field] === undefined) {
      throw new Error(`Missing required metadata field: ${field} in ${metaPath}`);
    }
  }

  if (meta.clearance_level < 1 || meta.clearance_level > 5) {
    throw new Error(`clearance_level must be 1–5, got: ${meta.clearance_level}`);
  }

  return meta;
}

module.exports = { extractText, loadMetadata };
