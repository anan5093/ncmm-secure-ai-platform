/**
 * Directory Watcher — NCMM Ingestion Pipeline
 * Monitors INGESTION_WATCH_DIR for new/changed documents.
 */
require('dotenv').config({ path: require('path').resolve(__dirname, '../../../.env') });

const chokidar = require('chokidar');
const path = require('path');
const { triggerIngestion } = require('./pipeline');

const WATCHED_DIR = process.env.INGESTION_WATCH_DIR || './data/secure-docs/incoming';

console.log(`[WATCHER] Monitoring: ${path.resolve(WATCHED_DIR)}`);

const watcher = chokidar.watch(WATCHED_DIR, {
  persistent: true,
  ignoreInitial: false,
  // Only process supported document types
  ignored: (filePath) => {
    const ext = path.extname(filePath).toLowerCase();
    // Ignore meta files and unsupported extensions
    if (filePath.endsWith('.meta.json')) return true;
    if (ext && !['.pdf', '.docx', '.txt'].includes(ext)) return true;
    return false;
  },
  awaitWriteFinish: {
    stabilityThreshold: 3000,
    pollInterval: 500
  }
});

watcher
  .on('add', (filePath) => {
    console.log(`[WATCHER] New file detected: ${filePath}`);
    triggerIngestion(filePath, 'add').catch(err => {
      console.error(`[WATCHER] Ingestion error for ${filePath}:`, err.message);
    });
  })
  .on('change', (filePath) => {
    console.log(`[WATCHER] File changed: ${filePath}`);
    triggerIngestion(filePath, 'change').catch(err => {
      console.error(`[WATCHER] Re-ingestion error for ${filePath}:`, err.message);
    });
  })
  .on('error', (error) => {
    console.error('[WATCHER] Error:', error);
  })
  .on('ready', () => {
    console.log(`[WATCHER] Ready. Watching for .pdf, .docx, .txt files.`);
  });

module.exports = { watcher };
