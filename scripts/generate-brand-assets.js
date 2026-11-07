const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

// 1. Master SVG Vector for VYRA Monogram / App Icon (512x512)
const masterIconSvg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <!-- Background Gradient -->
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stopColor="#0D111A"/>
      <stop offset="100%" stopColor="#05070A"/>
    </linearGradient>

    <!-- Solar Amber Ascent Gradient -->
    <linearGradient id="amberGrad" x1="0%" y1="100%" x2="70%" y2="0%">
      <stop offset="0%" stopColor="#D97706"/>
      <stop offset="50%" stopColor="#F59E0B"/>
      <stop offset="100%" stopColor="#FDE68A"/>
    </linearGradient>

    <!-- Basalt Monolith Left Facet -->
    <linearGradient id="basaltGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stopColor="#334155"/>
      <stop offset="50%" stopColor="#1E293B"/>
      <stop offset="100%" stopColor="#0F172A"/>
    </linearGradient>

    <!-- Subtle Ambient Energy Core -->
    <radialGradient id="ambientGlow" cx="55%" cy="45%" r="50%">
      <stop offset="0%" stopColor="#F59E0B" stopOpacity="0.25"/>
      <stop offset="60%" stopColor="#F59E0B" stopOpacity="0.05"/>
      <stop offset="100%" stopColor="#000000" stopOpacity="0"/>
    </radialGradient>

    <!-- Drop Shadow for Upper Wing -->
    <filter id="vectorShadow" x="-20%" y="-20%" width="150%" height="150%">
      <feDropShadow dx="0" dy="8" stdDeviation="16" flood-color="#000000" flood-opacity="0.8"/>
    </filter>
    <filter id="amberGlow" x="-20%" y="-20%" width="150%" height="150%">
      <feDropShadow dx="0" dy="0" stdDeviation="12" flood-color="#F59E0B" flood-opacity="0.45"/>
    </filter>
  </defs>

  <!-- Container Base: Deep Basalt Squircle -->
  <rect width="512" height="512" rx="112" fill="url(#bgGrad)"/>
  <rect x="2" y="2" width="508" height="508" rx="110" fill="none" stroke="#1C2436" stroke-width="3"/>

  <!-- Ambient Energy Halo -->
  <rect width="512" height="512" rx="112" fill="url(#ambientGlow)"/>

  <!-- Subtle Microgrid Hairlines (Architectural Precision) -->
  <line x1="120" y1="256" x2="392" y2="256" stroke="#1C2436" stroke-width="1" stroke-dasharray="4 8" opacity="0.6"/>
  <line x1="256" y1="120" x2="256" y2="392" stroke="#1C2436" stroke-width="1" stroke-dasharray="4 8" opacity="0.6"/>

  <!-- ============================================== -->
  <!-- THE VYRA KINETIC VECTOR (V-MONOGRAM)           -->
  <!-- ============================================== -->

  <!-- Left Stem: Basalt Foundation Pillar -->
  <path
    d="M 124 140 
       L 194 140 
       L 256 320 
       L 256 384 
       L 218 384 
       L 124 140 Z"
    fill="url(#basaltGrad)"
    stroke="#334155"
    stroke-width="1.5"
    filter="url(#vectorShadow)"
  />

  <!-- Razor Central Tension Divider / Core Diamond -->
  <polygon 
    points="256,300 268,335 256,370 244,335" 
    fill="#090C11" 
    opacity="0.8"
  />

  <!-- Right Stem: Ascending Solar Vector (Kinetic Momentum) -->
  <path
    d="M 256 384 
       L 256 320 
       L 348 108 
       L 404 108 
       L 388 152 
       L 294 384 
       Z"
    fill="url(#amberGrad)"
    stroke="#FBBF24"
    stroke-width="1.5"
    filter="url(#amberGlow)"
  />

  <!-- Apex Kinetic Arrow Accent at Top-Right Vector Tip -->
  <polygon 
    points="348,108 404,108 388,152" 
    fill="#FFFBEB" 
    opacity="0.9"
  />

  <!-- Bottom Balance Horizon Bar (Athletic Stability) -->
  <rect x="210" y="398" width="92" height="4" rx="2" fill="#F59E0B" opacity="0.85"/>
</svg>
`;

// 2. Favicon SVG Vector (Clean, high-contrast at 16x16 / 32x32)
const faviconSvg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64">
  <defs>
    <linearGradient id="favAmber" x1="0%" y1="100%" x2="100%" y2="0%">
      <stop offset="0%" stopColor="#D97706"/>
      <stop offset="100%" stopColor="#FBBF24"/>
    </linearGradient>
    <linearGradient id="favBasalt" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stopColor="#475569"/>
      <stop offset="100%" stopColor="#1E293B"/>
    </linearGradient>
  </defs>
  <!-- Background Squircle -->
  <rect width="64" height="64" rx="14" fill="#090C11"/>
  <rect x="0.5" y="0.5" width="63" height="63" rx="13.5" fill="none" stroke="#1C2436"/>

  <!-- Left Stem -->
  <polygon points="14,16 23,16 31,40 31,48 26,48 14,16" fill="url(#favBasalt)"/>

  <!-- Right Stem (Solar Amber) -->
  <polygon points="32,48 32,40 45,12 52,12 50,18 38,48" fill="url(#favAmber)"/>
  
  <!-- Subtle Amber Tip -->
  <polygon points="45,12 52,12 50,18" fill="#FFFBEB"/>

  <!-- Base Anchor Dot -->
  <circle cx="32" cy="51" r="1.5" fill="#F59E0B"/>
</svg>
`;

async function main() {
  const publicDir = path.resolve(__dirname, '../public');
  const appDir = path.resolve(__dirname, '../src/app');

  console.log('1. Writing public/icon.svg...');
  fs.writeFileSync(path.join(publicDir, 'icon.svg'), masterIconSvg, 'utf8');

  console.log('2. Writing public/apple-touch-icon.svg...');
  fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.svg'), masterIconSvg, 'utf8');

  console.log('3. Writing public/favicon.svg...');
  fs.writeFileSync(path.join(publicDir, 'favicon.svg'), faviconSvg, 'utf8');

  console.log('4. Generating raster PNG icons...');
  const masterBuffer = Buffer.from(masterIconSvg);

  // 192x192 PNG
  await sharp(masterBuffer)
    .resize(192, 192)
    .png()
    .toFile(path.join(publicDir, 'icon-192.png'));
  console.log('✓ Generated icon-192.png');

  // 512x512 PNG
  await sharp(masterBuffer)
    .resize(512, 512)
    .png()
    .toFile(path.join(publicDir, 'icon-512.png'));
  console.log('✓ Generated icon-512.png');

  // 512x512 Maskable PNG
  await sharp(masterBuffer)
    .resize(512, 512)
    .png()
    .toFile(path.join(publicDir, 'icon-maskable-512.png'));
  console.log('✓ Generated icon-maskable-512.png');

  // 180x180 Apple Touch Icon PNG
  await sharp(masterBuffer)
    .resize(180, 180)
    .png()
    .toFile(path.join(publicDir, 'apple-touch-icon.png'));
  console.log('✓ Generated apple-touch-icon.png');

  // 32x32 Favicon PNG (Used to overwrite favicon.ico)
  const faviconBuffer = Buffer.from(faviconSvg);
  const fav32 = await sharp(faviconBuffer)
    .resize(32, 32)
    .png()
    .toBuffer();

  // Next.js App Router serves src/app/favicon.ico
  // Writing 32x32 PNG to src/app/favicon.ico (all modern browsers accept PNG-encoded favicons)
  fs.writeFileSync(path.join(appDir, 'favicon.ico'), fav32);
  fs.writeFileSync(path.join(publicDir, 'favicon.ico'), fav32);
  console.log('✓ Overwritten src/app/favicon.ico and public/favicon.ico with Vyra Monogram!');

  console.log('\nAll brand icon assets generated successfully!');
}

main().catch((err) => {
  console.error('Error generating assets:', err);
  process.exit(1);
});
