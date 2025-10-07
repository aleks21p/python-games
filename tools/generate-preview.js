// Generates games-HTML5/preview.png from games-HTML5/preview.svg at 1200x630
// Usage: npm install sharp
//        node tools/generate-preview.js
const fs = require('fs');
const path = require('path');
async function run() {
  const svgPath = path.resolve(__dirname, '..', 'games-HTML5', 'preview.svg');
  const outPath = path.resolve(__dirname, '..', 'games-HTML5', 'preview.png');
  if (!fs.existsSync(svgPath)) {
    console.error('Missing preview.svg at', svgPath);
    process.exit(1);
  }
  let sharp;
  try {
    sharp = require('sharp');
  } catch (err) {
    console.error('Please install sharp first: npm install sharp');
    process.exit(1);
  }

  try {
    const svg = fs.readFileSync(svgPath);
    await sharp(svg)
      .png({ quality: 90 })
      .resize(1200, 630, { fit: 'cover' })
      .toFile(outPath);
    console.log('Wrote', outPath);
  } catch (err) {
    console.error('Failed to create PNG:', err);
    process.exit(1);
  }
}

run();
