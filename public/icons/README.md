# PWA Icons Generation Guide

This directory should contain PWA icons in various sizes.

## Required Icons

The manifest.json requires the following icon sizes:
- `icon-72x72.png`
- `icon-96x96.png`
- `icon-128x128.png`
- `icon-144x144.png`
- `icon-152x152.png`
- `icon-192x192.png`
- `icon-384x384.png`
- `icon-512x512.png`

## How to Generate Icons

### Option 1: Using Sharp (Node.js)
```bash
npm install sharp
```

Then run:
```javascript
const sharp = require('sharp');

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
const inputImage = '../app-Icon.jpg'; // Your source image

sizes.forEach(size => {
  sharp(inputImage)
    .resize(size, size)
    .png()
    .toFile(`icon-${size}x${size}.png`);
});
```

### Option 2: Online Tools
- [Real Favicon Generator](https://realfavicongenerator.net/)
- [PWA Builder](https://www.pwabuilder.com/)
- [Favicon.io](https://favicon.io/)

### Option 3: Using ImageMagick
```bash
# Install ImageMagick first
brew install imagemagick

# Generate all sizes
for size in 72 96 128 144 152 192 384 512; do
  convert ../app-Icon.jpg -resize ${size}x${size} icon-${size}x${size}.png
done
```

## Icon Requirements

1. **Format**: PNG with transparency support
2. **Shape**: Square (1:1 aspect ratio)
3. **Purpose**: Should include both "maskable" and "any" purposes
4. **Quality**: High resolution source image (at least 512x512)

## Maskable Icons

For better appearance on Android devices, consider creating separate maskable icons:
- The safe zone is the inner 80% of the icon
- Critical content should be within this safe zone
- Background should extend to the edges

Use the [Maskable.app](https://maskable.app/) tool to test your icons.
