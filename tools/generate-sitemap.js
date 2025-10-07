// Scans games-HTML5 for .html files and writes sitemap.xml at repo root
// Usage: node tools/generate-sitemap.js
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const pagesDir = path.join(root, 'games-HTML5');
const outPath = path.join(root, 'sitemap.xml');

function walk(dir) {
  const files = [];
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) {
      files.push(...walk(full));
    } else if (stat.isFile() && name.endsWith('.html')) {
      files.push(full);
    }
  }
  return files;
}

function toUrl(file) {
  const rel = path.relative(pagesDir, file).replace(/\\/g, '/');
  return `https://javasnake.com/${rel}`;
}

const files = walk(pagesDir);
const now = new Date().toISOString().split('T')[0];

const xml = ['<?xml version="1.0" encoding="UTF-8"?>', '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'];
// Add root
xml.push('  <url>');
xml.push('    <loc>https://javasnake.com/</loc>');
xml.push(`    <lastmod>${now}</lastmod>`);
xml.push('    <changefreq>weekly</changefreq>');
xml.push('    <priority>1.0</priority>');
xml.push('  </url>');

for (const f of files) {
  xml.push('  <url>');
  xml.push(`    <loc>${toUrl(f)}</loc>`);
  xml.push(`    <lastmod>${now}</lastmod>`);
  xml.push('    <changefreq>weekly</changefreq>');
  xml.push('    <priority>0.8</priority>');
  xml.push('  </url>');
}
xml.push('</urlset>');

fs.writeFileSync(outPath, xml.join('\n'));
console.log('sitemap written to', outPath);
