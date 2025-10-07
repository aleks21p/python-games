#!/usr/bin/env python3
"""
Generate sitemap.xml by scanning the games-HTML5 directory for .html files.

Usage:
    python tools/generate_sitemap.py

This writes sitemap.xml at the repository root and uses https://javasnake.com/ as the base URL.
"""
import os
from pathlib import Path
from datetime import date

BASE_DIR = Path(__file__).resolve().parents[1]
PAGES_DIR = BASE_DIR / 'games-HTML5'
OUT_PATH = BASE_DIR / 'sitemap.xml'
BASE_URL = 'https://javasnake.com'


def iter_html_files(root: Path):
    for dirpath, dirnames, filenames in os.walk(root):
        for fn in filenames:
            if fn.lower().endswith('.html'):
                yield Path(dirpath) / fn


def file_url(file_path: Path):
    # Return absolute URL for a file under PAGES_DIR
    rel = file_path.relative_to(PAGES_DIR).as_posix()
    return f"{BASE_URL}/{rel}"


def main():
    files = sorted(iter_html_files(PAGES_DIR))
    today = date.today().isoformat()

    lines = [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'
    ]

    # add root
    lines += [
        '  <url>',
        f'    <loc>{BASE_URL}/</loc>',
        f'    <lastmod>{today}</lastmod>',
        '    <changefreq>weekly</changefreq>',
        '    <priority>1.0</priority>',
        '  </url>'
    ]

    for f in files:
        url = file_url(f)
        lines += [
            '  <url>',
            f'    <loc>{url}</loc>',
            f'    <lastmod>{today}</lastmod>',
            '    <changefreq>weekly</changefreq>',
            '    <priority>0.8</priority>',
            '  </url>'
        ]

    lines.append('</urlset>')

    OUT_PATH.write_text('\n'.join(lines), encoding='utf-8')
    print(f'Wrote sitemap to {OUT_PATH}')


if __name__ == '__main__':
    main()
