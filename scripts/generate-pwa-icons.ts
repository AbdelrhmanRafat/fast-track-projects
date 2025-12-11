/**
 * PWA Icon Generator Script
 * 
 * Run this script to generate all required PWA icon sizes from the source image.
 * 
 * Prerequisites:
 * npm install sharp
 * 
 * Usage:
 * npx tsx scripts/generate-pwa-icons.ts
 * OR
 * node scripts/generate-pwa-icons.js (after compiling)
 */

import sharp from 'sharp';
import * as fs from 'fs';
import * as path from 'path';

const SOURCE_IMAGE = path.join(__dirname, '../public/app-Icon.jpg');
const OUTPUT_DIR = path.join(__dirname, '../public/icons');

const ICON_SIZES = [72, 96, 128, 144, 152, 192, 384, 512];

async function generateIcons() {
  // Ensure output directory exists
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  console.log('🎨 Generating PWA icons...\n');

  for (const size of ICON_SIZES) {
    const outputPath = path.join(OUTPUT_DIR, `icon-${size}x${size}.png`);
    
    try {
      await sharp(SOURCE_IMAGE)
        .resize(size, size, {
          fit: 'cover',
          position: 'center',
        })
        .png({ quality: 90 })
        .toFile(outputPath);
      
      console.log(`✅ Generated: icon-${size}x${size}.png`);
    } catch (error) {
      console.error(`❌ Failed to generate icon-${size}x${size}.png:`, error);
    }
  }

  console.log('\n✨ Icon generation complete!');
  console.log(`📁 Icons saved to: ${OUTPUT_DIR}`);
}

// Run the generator
generateIcons().catch(console.error);
