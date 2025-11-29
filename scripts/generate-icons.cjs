/**
 * Icon Generator for Ninja Toolkit
 *
 * Generates proper ICO and PNG icons from a base image or creates
 * programmatic icons if no source is available.
 *
 * Usage: node scripts/generate-icons.js [source-image.png]
 */

const fs = require('fs');
const path = require('path');

const ICON_DIR = path.join(__dirname, '..', 'assets', 'icons');

// Ensure icon directory exists
if (!fs.existsSync(ICON_DIR)) {
  fs.mkdirSync(ICON_DIR, { recursive: true });
}

/**
 * Create a simple ICO file with basic structure
 * ICO format: Header + Directory entries + Image data
 */
function createIcoFile(pngBuffers, outputPath) {
  // ICO Header (6 bytes)
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);     // Reserved (must be 0)
  header.writeUInt16LE(1, 2);     // Type (1 = ICO)
  header.writeUInt16LE(pngBuffers.length, 4); // Number of images

  // Calculate offsets
  const headerSize = 6;
  const dirEntrySize = 16;
  const dirSize = dirEntrySize * pngBuffers.length;
  let currentOffset = headerSize + dirSize;

  // Directory entries
  const dirEntries = [];
  const sizes = [256, 48, 32, 16]; // Icon sizes

  pngBuffers.forEach((png, i) => {
    const entry = Buffer.alloc(16);
    const size = sizes[i] || 16;
    entry.writeUInt8(size === 256 ? 0 : size, 0); // Width (0 = 256)
    entry.writeUInt8(size === 256 ? 0 : size, 1); // Height (0 = 256)
    entry.writeUInt8(0, 2);                        // Color palette
    entry.writeUInt8(0, 3);                        // Reserved
    entry.writeUInt16LE(1, 4);                     // Color planes
    entry.writeUInt16LE(32, 6);                    // Bits per pixel
    entry.writeUInt32LE(png.length, 8);            // Image size
    entry.writeUInt32LE(currentOffset, 12);        // Image offset
    dirEntries.push(entry);
    currentOffset += png.length;
  });

  // Combine all parts
  const ico = Buffer.concat([header, ...dirEntries, ...pngBuffers]);
  fs.writeFileSync(outputPath, ico);
  console.log(`Created ICO: ${outputPath} (${ico.length} bytes)`);
}

/**
 * Create a simple PNG with a ninja-themed icon
 * Creates a basic 8-bit PNG programmatically
 */
function createSimplePng(size) {
  // PNG structure: Signature + Chunks (IHDR, IDAT, IEND)

  // PNG Signature
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR chunk (image header)
  const width = size;
  const height = size;
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData.writeUInt8(8, 8);   // Bit depth
  ihdrData.writeUInt8(6, 9);   // Color type (RGBA)
  ihdrData.writeUInt8(0, 10);  // Compression
  ihdrData.writeUInt8(0, 11);  // Filter
  ihdrData.writeUInt8(0, 12);  // Interlace

  // Create pixel data with a ninja star design
  const pixels = [];
  const centerX = size / 2;
  const centerY = size / 2;
  const radius = size * 0.4;

  for (let y = 0; y < height; y++) {
    pixels.push(0); // Filter byte for each row
    for (let x = 0; x < width; x++) {
      const dx = x - centerX;
      const dy = y - centerY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const angle = Math.atan2(dy, dx);

      // Create ninja star pattern
      const starRadius = radius * (0.7 + 0.3 * Math.abs(Math.sin(angle * 4)));
      const inStar = dist < starRadius;
      const inCenter = dist < radius * 0.25;

      if (inCenter) {
        // White center
        pixels.push(255, 255, 255, 255);
      } else if (inStar) {
        // Gradient teal to purple (primary colors from theme)
        const t = (dist - radius * 0.25) / (starRadius - radius * 0.25);
        const r = Math.floor(99 + (139 - 99) * t);   // Teal to purple
        const g = Math.floor(200 + (90 - 200) * t);
        const b = Math.floor(165 + (241 - 165) * t);
        pixels.push(r, g, b, 255);
      } else {
        // Transparent background
        pixels.push(0, 0, 0, 0);
      }
    }
  }

  const rawData = Buffer.from(pixels);

  // Compress with zlib (simple deflate)
  const zlib = require('zlib');
  const compressed = zlib.deflateSync(rawData, { level: 9 });

  // IDAT chunk
  const idatChunk = createPngChunk('IDAT', compressed);

  // IHDR chunk
  const ihdrChunk = createPngChunk('IHDR', ihdrData);

  // IEND chunk
  const iendChunk = createPngChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

/**
 * Create a PNG chunk with CRC
 */
function createPngChunk(type, data) {
  const typeBuffer = Buffer.from(type);
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);

  const crcData = Buffer.concat([typeBuffer, data]);
  const crc = crc32(crcData);
  const crcBuffer = Buffer.alloc(4);
  crcBuffer.writeUInt32BE(crc >>> 0);

  return Buffer.concat([length, typeBuffer, data, crcBuffer]);
}

/**
 * CRC32 calculation for PNG chunks
 */
function crc32(data) {
  // CRC32 lookup table
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let j = 0; j < 8; j++) {
      c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
    }
    table[i] = c;
  }

  let crc = 0xffffffff;
  for (let i = 0; i < data.length; i++) {
    crc = table[(crc ^ data[i]) & 0xff] ^ (crc >>> 8);
  }
  return crc ^ 0xffffffff;
}

// Main execution
async function main() {
  console.log('Ninja Toolkit Icon Generator');
  console.log('============================\n');

  const sourceArg = process.argv[2];

  if (sourceArg && fs.existsSync(sourceArg)) {
    console.log(`Using source image: ${sourceArg}`);
    // If source provided, just copy it
    const dest = path.join(ICON_DIR, 'icon.png');
    fs.copyFileSync(sourceArg, dest);
    console.log(`Copied to: ${dest}`);
  } else {
    console.log('No source image provided, generating programmatic icons...\n');

    // Generate PNGs at different sizes
    const sizes = [256, 48, 32, 16];
    const pngBuffers = [];

    for (const size of sizes) {
      const png = createSimplePng(size);
      pngBuffers.push(png);

      // Save individual PNG
      const pngPath = path.join(ICON_DIR, `icon-${size}.png`);
      fs.writeFileSync(pngPath, png);
      console.log(`Created PNG: ${pngPath} (${size}x${size})`);
    }

    // Save 256px as main icon.png
    const mainPngPath = path.join(ICON_DIR, 'icon.png');
    fs.writeFileSync(mainPngPath, pngBuffers[0]);
    console.log(`Created main PNG: ${mainPngPath}`);

    // Create ICO file with all sizes
    const icoPath = path.join(ICON_DIR, 'icon.ico');
    createIcoFile(pngBuffers, icoPath);
  }

  console.log('\nIcon generation complete!');
}

main().catch(console.error);
