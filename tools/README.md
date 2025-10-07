Tools README

1) Generate PNG preview from SVG
   - Requires 'sharp' (npm install sharp)
   - Run: node tools/generate-preview.js
   - Output: games-HTML5/preview.png (1200x630)

2) Regenerate sitemap.xml from HTML pages
   - Run (Node): node tools/generate-sitemap.js
   - Or run (Python): python tools/generate_sitemap.py
   - Output: sitemap.xml at repo root

Notes:
 - These tools are small helpers intended to be run locally before deployment.
 - If you need a GitHub Action to auto-generate these on push, I can add that next.
 - The repository includes a GitHub Action `generate-assets.yml` that runs these tools on push and commits generated assets.
