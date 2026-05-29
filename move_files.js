const fs = require('fs');
const path = require('path');

const rootDir = __dirname;
const docsDir = path.join(rootDir, 'Docs');

if (!fs.existsSync(docsDir)) {
  fs.mkdirSync(docsDir);
  console.log('✅ Created Docs directory');
}

const filesToMove = [
  'DEBUG_SESSION.md',
  'Design.md',
  'QUERY_TEST_RESULTS.md',
  'Requirements.md',
  'SETUP_NO_DOCKER.md',
  'TEST_RESULTS_COMPREHENSIVE.md',
  'TEST_RESULTS_FINAL.md',
  'Task.md'
];

let movedCount = 0;

filesToMove.forEach(file => {
  const oldPath = path.join(rootDir, file);
  const newPath = path.join(docsDir, file);
  
  if (fs.existsSync(oldPath)) {
    fs.renameSync(oldPath, newPath);
    console.log(`✅ Moved ${file} -> Docs/`);
    movedCount++;
  }
});

console.log(`\n🎉 Successfully moved ${movedCount} markdown files to the Docs folder!`);
