#!/usr/bin/env node
/**
 * Suzuki Bike System - Image Download Script
 *
 * Downloads motorcycle and scooter images from Pexels/Unsplash URLs
 * and saves them to frontend/app/public/assets/images/bikes/ and scooters/
 *
 * USAGE:
 *   1. Edit the URLS config below - paste your Pexels/Unsplash image URLs
 *   2. Run: node tools/download-images.js
 *      Or from project root: node tools/download-images.js
 *
 * For Pexels: Right-click image → Copy image address (use the direct image URL)
 * For Unsplash: Click "Download" → copy the URL, or use format:
 *   https://images.unsplash.com/photo-XXXXX?w=800
 *
 * You can also pass a config file: node tools/download-images.js path/to/urls.json
 */

import { createWriteStream } from 'fs';
import { mkdir, access } from 'fs/promises';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = join(__dirname, '..');
const IMAGES_ROOT = join(PROJECT_ROOT, 'frontend', 'app', 'public', 'assets', 'images');
const BIKES_DIR = join(IMAGES_ROOT, 'bikes');
const SCOOTERS_DIR = join(IMAGES_ROOT, 'scooters');

// -------------------------------------------------------------------------
// PASTE YOUR URLs HERE (replace empty strings with actual image URLs)
// -------------------------------------------------------------------------
const URLS = {
  bikes: [
    '', '', '', '', '', '', '', ''
  ],
  scooters: [
    '', '', '', ''
  ]
};

// Fallback: sample Unsplash motorcycle/scooter URLs (royalty-free, no API key needed)
// Replace these with your own URLs for better variety
const FALLBACK_URLS = {
  bikes: [
    'https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=800',
    'https://images.unsplash.com/photo-1449426468159-d96dbf08f19f?w=800',
    'https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?w=800',
    'https://images.unsplash.com/photo-1609630875171-b1321377ee65?w=800',
    'https://images.unsplash.com/photo-1619767886558-efdc259cde1a?w=800',
    'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800',
    'https://images.unsplash.com/photo-1609630875171-b1321377ee65?w=800',
    'https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=800'
  ],
  scooters: [
    'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800',
    'https://images.unsplash.com/photo-1609630875171-b1321377ee65?w=800',
    'https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?w=800',
    'https://images.unsplash.com/photo-1619767886558-efdc259cde1a?w=800'
  ]
};

function getUrls() {
  const bikes = URLS.bikes.filter(Boolean).length > 0 ? URLS.bikes : FALLBACK_URLS.bikes;
  const scooters = URLS.scooters.filter(Boolean).length > 0 ? URLS.scooters : FALLBACK_URLS.scooters;
  return { bikes, scooters };
}

async function ensureDir(dir) {
  try {
    await access(dir);
  } catch {
    await mkdir(dir, { recursive: true });
  }
}

async function downloadImage(url, filepath) {
  const res = await fetch(url, { redirect: 'follow' });
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${url}`);
  const buffer = await res.arrayBuffer();
  const writeStream = createWriteStream(filepath);
  writeStream.write(Buffer.from(buffer));
  writeStream.end();
  return new Promise((resolve, reject) => {
    writeStream.on('finish', resolve);
    writeStream.on('error', reject);
  });
}

async function main() {
  const configPath = process.argv[2];
  let urls = getUrls();

  if (configPath) {
    try {
      const mod = await import(join(process.cwd(), configPath));
      urls = mod.default || mod.URLS || mod;
      if (!urls.bikes || !urls.scooters) throw new Error('Config must have bikes and scooters arrays');
    } catch (e) {
      console.error('Failed to load config:', e.message);
      process.exit(1);
    }
  }

  await ensureDir(BIKES_DIR);
  await ensureDir(SCOOTERS_DIR);

  const tasks = [
    ...urls.bikes.slice(0, 8).map((url, i) => ({ url, dir: BIKES_DIR, file: `bike-${i + 1}.jpg` })),
    ...urls.scooters.slice(0, 4).map((url, i) => ({ url, dir: SCOOTERS_DIR, file: `scooter-${i + 1}.jpg` }))
  ];

  console.log('Downloading images to', IMAGES_ROOT);
  for (const { url, dir, file } of tasks) {
    if (!url) {
      console.warn(`  Skipping ${file} (no URL)`);
      continue;
    }
    const filepath = join(dir, file);
    try {
      await downloadImage(url, filepath);
      console.log(`  ✓ ${file}`);
    } catch (e) {
      console.error(`  ✗ ${file}: ${e.message}`);
    }
  }
  console.log('Done.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
