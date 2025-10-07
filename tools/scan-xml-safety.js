// Simple repo scanner to find potentially unsafe ampersands in files that may be served as XML/XHTML
// Usage: node tools/scan-xml-safety.js

const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const exts = ['.html', '.htm', '.xml', '.xhtml', '.svg'];
const entityRegex = /^#?\w+;$/; // simple check for &name; or &#123;

function isBinaryFile(filename) {
  const binExt = ['.png', '.jpg', '.jpeg', '.gif', '.ico', '.webp', '.mp3', '.ogg', '.wav', '.woff', '.woff2', '.ttf'];
  return binExt.includes(path.extname(filename).toLowerCase());
}

function walk(dir, cb) {
  const list = fs.readdirSync(dir, { withFileTypes: true });
  for (const d of list) {
    const full = path.join(dir, d.name);
    if (d.isDirectory()) {
      if (d.name === 'node_modules' || d.name === '.git') continue;
      walk(full, cb);
    } else {
      cb(full);
    }
  }
}

const issues = [];
walk(root, (file) => {
  const ext = path.extname(file).toLowerCase();
  if (!exts.includes(ext)) return;
  if (isBinaryFile(file)) return;
  try {
    const txt = fs.readFileSync(file, 'utf8');
    const lines = txt.split(/\r?\n/);
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      // find ampersands
      let idx = line.indexOf('&');
      while (idx !== -1) {
        // look ahead for a semicolon
        const rest = line.slice(idx + 1);
        const semicolonIdx = rest.indexOf(';');
        if (semicolonIdx === -1) {
          issues.push({ file, line: i + 1, col: idx + 1, snippet: line.trim() });
          break; // move to next line
        } else {
          const entity = rest.slice(0, semicolonIdx + 1); // include ;
          const entName = entity.slice(0, -1); // drop ;
          if (!entityRegex.test(entName)) {
            // If it doesn't look like a valid entity name, flag it
            issues.push({ file, line: i + 1, col: idx + 1, snippet: line.trim(), entity: entName });
            break;
          }
        }
        idx = line.indexOf('&', idx + 1);
      }
    }
  } catch (e) {
    // ignore unreadable
  }
});

if (issues.length === 0) {
  console.log('No likely XML-unsafe ampersands found in HTML/XML/SVG files.');
  process.exit(0);
}

console.log('Potential XML-unsafe ampersands found:');
for (const it of issues) {
  console.log(`${path.relative(root, it.file)}:${it.line}:${it.col}  -> ${it.snippet}` + (it.entity ? `  [entity: ${it.entity}]` : ''));
}
process.exit(1);
