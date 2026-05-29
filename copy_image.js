const fs = require('fs');
const path = require('path');

const srcPath = 'C:\\Users\\ANAND RAJ\\.gemini\\antigravity\\brain\\0d93337a-1b57-4eb1-85c8-744552c23f66\\media__1780053375546.jpg';
const destPath = path.join(__dirname, 'frontend', 'public', 'vision.jpg');

try {
  // Check if public folder exists, create if not
  const publicDir = path.join(__dirname, 'frontend', 'public');
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }

  // Copy the file
  fs.copyFileSync(srcPath, destPath);
  console.log('✅ Successfully copied the new mineral pile image to frontend/public/vision.jpg!');
} catch (error) {
  console.error('❌ Error copying image:', error.message);
}
