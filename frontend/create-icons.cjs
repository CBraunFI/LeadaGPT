const fs = require('fs');
const path = require('path');

// Create a simple SVG and convert it to PNG using a canvas approach
// Since we don't have image manipulation libraries, we'll create minimal valid PNGs

// This is a minimal valid 192x192 PNG (solid color)
// Create using base64 encoded data for a simple blue square
function createMinimalPNG(size, color = '#06206f') {
  // For now, we'll create a very simple SVG that can be used as a fallback
  // But actually, let's check if we can install a package
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
