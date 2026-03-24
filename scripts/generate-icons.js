#!/usr/bin/env node
/**
 * Generate PWA icons (192x192 and 512x512) as valid PNG files.
 * Pure Node.js — no external dependencies.
 * Creates a purple gradient background with a bold "Z" letter.
 */

const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

function createPNG(width, height, pixelData) {
  // PNG signature
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR chunk
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;  // bit depth
  ihdr[9] = 2;  // color type: RGB
  ihdr[10] = 0; // compression
  ihdr[11] = 0; // filter
  ihdr[12] = 0; // interlace
  const ihdrChunk = makeChunk('IHDR', ihdr);

  // IDAT chunk — raw image data with filter bytes
  const rawData = Buffer.alloc(height * (1 + width * 3));
  for (let y = 0; y < height; y++) {
    rawData[y * (1 + width * 3)] = 0; // filter: None
    for (let x = 0; x < width; x++) {
      const srcIdx = (y * width + x) * 3;
      const dstIdx = y * (1 + width * 3) + 1 + x * 3;
      rawData[dstIdx] = pixelData[srcIdx];
      rawData[dstIdx + 1] = pixelData[srcIdx + 1];
      rawData[dstIdx + 2] = pixelData[srcIdx + 2];
    }
  }
  const compressed = zlib.deflateSync(rawData);
  const idatChunk = makeChunk('IDAT', compressed);

  // IEND chunk
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

function makeChunk(type, data) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);
  const typeB = Buffer.from(type, 'ascii');
  const crcData = Buffer.concat([typeB, data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(crcData), 0);
  return Buffer.concat([length, typeB, data, crc]);
}

// CRC32 for PNG
function crc32(buf) {
  let table = crc32.table;
  if (!table) {
    table = crc32.table = new Uint32Array(256);
    for (let i = 0; i < 256; i++) {
      let c = i;
      for (let j = 0; j < 8; j++) {
        c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
      }
      table[i] = c;
    }
  }
  let crc = 0xFFFFFFFF;
  for (let i = 0; i < buf.length; i++) {
    crc = table[(crc ^ buf[i]) & 0xFF] ^ (crc >>> 8);
  }
  return (crc ^ 0xFFFFFFFF) >>> 0;
}

function lerp(a, b, t) {
  return Math.round(a + (b - a) * t);
}

function generateIcon(size) {
  const pixels = Buffer.alloc(size * size * 3);

  // Colors for gradient: #7c5aff -> #b794ff
  const c1 = { r: 124, g: 90, b: 255 };
  const c2 = { r: 183, g: 148, b: 255 };

  const cornerRadius = Math.round(size * 0.18);

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const idx = (y * size + x) * 3;

      // Check rounded corners — is this pixel inside the rounded rect?
      if (!insideRoundedRect(x, y, size, size, cornerRadius)) {
        // Transparent substitute: white background (since we're RGB, no alpha)
        pixels[idx] = 255;
        pixels[idx + 1] = 255;
        pixels[idx + 2] = 255;
        continue;
      }

      // Diagonal gradient (top-left to bottom-right)
      const t = ((x / size) + (y / size)) / 2;
      let r = lerp(c1.r, c2.r, t);
      let g = lerp(c1.g, c2.g, t);
      let b = lerp(c1.b, c2.b, t);

      // Draw "Z" letter
      if (isZLetter(x, y, size)) {
        r = 255;
        g = 255;
        b = 255;
      }

      pixels[idx] = r;
      pixels[idx + 1] = g;
      pixels[idx + 2] = b;
    }
  }

  return createPNG(size, size, pixels);
}

function insideRoundedRect(x, y, w, h, r) {
  // Check four corners
  if (x < r && y < r) {
    return (x - r) * (x - r) + (y - r) * (y - r) <= r * r;
  }
  if (x >= w - r && y < r) {
    return (x - (w - r - 1)) * (x - (w - r - 1)) + (y - r) * (y - r) <= r * r;
  }
  if (x < r && y >= h - r) {
    return (x - r) * (x - r) + (y - (h - r - 1)) * (y - (h - r - 1)) <= r * r;
  }
  if (x >= w - r && y >= h - r) {
    return (x - (w - r - 1)) * (x - (w - r - 1)) + (y - (h - r - 1)) * (y - (h - r - 1)) <= r * r;
  }
  return true;
}

function isZLetter(x, y, size) {
  // Define Z in a coordinate space relative to icon size
  const margin = size * 0.22;
  const thickness = size * 0.09;

  const left = margin;
  const right = size - margin;
  const top = margin;
  const bottom = size - margin;
  const zWidth = right - left;
  const zHeight = bottom - top;

  // Top bar of Z
  if (x >= left && x <= right && y >= top && y <= top + thickness) {
    return true;
  }

  // Bottom bar of Z
  if (x >= left && x <= right && y >= bottom - thickness && y <= bottom) {
    return true;
  }

  // Diagonal of Z (from top-right to bottom-left)
  // The diagonal connects (right, top+thickness) to (left, bottom-thickness)
  const diagY = y - (top + thickness);
  const diagHeight = (bottom - thickness) - (top + thickness);
  if (diagHeight <= 0) return false;

  const t = diagY / diagHeight;
  if (t < 0 || t > 1) return false;

  const diagX = right - t * zWidth;

  // Check if pixel is within thickness of the diagonal line
  const halfT = thickness * 0.7; // slightly thinner diagonal
  if (x >= diagX - halfT && x <= diagX + halfT && y > top + thickness && y < bottom - thickness) {
    return true;
  }

  return false;
}

// Generate both sizes
const outDir = path.join(__dirname, '..', 'public', 'icons');

console.log('Generating 192x192 icon...');
const icon192 = generateIcon(192);
fs.writeFileSync(path.join(outDir, 'icon-192.png'), icon192);
console.log(`  Written: icon-192.png (${icon192.length} bytes)`);

console.log('Generating 512x512 icon...');
const icon512 = generateIcon(512);
fs.writeFileSync(path.join(outDir, 'icon-512.png'), icon512);
console.log(`  Written: icon-512.png (${icon512.length} bytes)`);

console.log('Done!');
