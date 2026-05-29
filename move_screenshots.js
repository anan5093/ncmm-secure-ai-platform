const fs = require('fs');
const path = require('path');

const srcDir = 'C:\\Users\\ANAND RAJ\\.gemini\\antigravity\\brain\\0d93337a-1b57-4eb1-85c8-744552c23f66';
const destDir = path.join(__dirname, 'Docs', 'screenshots');

// Ensure Docs/screenshots exists
if (!fs.existsSync(destDir)) {
  fs.mkdirSync(destDir, { recursive: true });
  console.log('✅ Created Docs/screenshots directory');
}

// Map the uploaded file IDs to descriptive names based on their content/upload order
const filesToMove = [
  { old: 'media__1780053727179.png', new: 'login_page.png' },
  { old: 'media__1780053742225.png', new: 'admin_dashboard_health.png' },
  { old: 'media__1780053742227.png', new: 'admin_dashboard_logs.png' },
  { old: 'media__1780053742265.png', new: 'admin_dashboard_metrics.png' },
  { old: 'media__1780053742299.png', new: 'admin_dashboard_query.png' }
];

let count = 0;
filesToMove.forEach(f => {
  const oldPath = path.join(srcDir, f.old);
  const newPath = path.join(destDir, f.new);
  
  if (fs.existsSync(oldPath)) {
    fs.copyFileSync(oldPath, newPath);
    console.log(`✅ Copied & Renamed: ${f.new}`);
    count++;
  } else {
    console.log(`⚠️ Warning: Could not find ${f.old}`);
  }
});

console.log(`\n🎉 Successfully organized ${count} screenshots into Docs/screenshots!`);
