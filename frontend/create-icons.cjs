/**
 * Icon Generator Script
 *
 * This script generates PWA icons for the Leada Chat application.
 *
 * IMPORTANT: This script requires the 'sharp' package to be installed.
 * Since sharp is not in package.json (to avoid build issues on Render),
 * you need to install it manually when regenerating icons:
 *
 *   npm install sharp --no-save
 *
 * Then run this script:
 *   node create-icons.cjs
 *
 * The generated icons are already committed to the repository,
 * so this script only needs to be run when icons need to be updated.
 */

const fs = require('fs');
const path = require('path');

function createMinimalPNG(size, color = '#06206f') {
  console.log('Checking for image manipulation packages...');

  try {
    // Try to use sharp if available
    const sharp = require('sharp');
    console.log('Using sharp to create icons');

    const svg192 = `
      <svg width="192" height="192" xmlns="http://www.w3.org/2000/svg">
        <rect width="192" height="192" fill="${color}"/>
        <text x="96" y="120" font-size="80" text-anchor="middle" fill="white" font-family="Arial, sans-serif" font-weight="bold">L</text>
      </svg>
    `;

    const svg512 = `
      <svg width="512" height="512" xmlns="http://www.w3.org/2000/svg">
        <rect width="512" height="512" fill="${color}"/>
        <text x="256" y="320" font-size="220" text-anchor="middle" fill="white" font-family="Arial, sans-serif" font-weight="bold">L</text>
      </svg>
    `;

    const iconsDir = path.join(__dirname, 'public', 'icons');
    if (!fs.existsSync(iconsDir)) {
      fs.mkdirSync(iconsDir, { recursive: true });
    }

    Promise.all([
      sharp(Buffer.from(svg192))
        .png()
        .toFile(path.join(iconsDir, 'icon-192.png')),
      sharp(Buffer.from(svg512))
        .png()
        .toFile(path.join(iconsDir, 'icon-512.png'))
    ]).then(() => {
      console.log('Icons created successfully!');
    }).catch(err => {
      console.error('Error creating icons:', err);
    });

  } catch (e) {
    console.log('sharp not available, installing...');
    console.log('Please run: npm install sharp --save-dev');
    process.exit(1);
  }
}

createMinimalPNG(192);
