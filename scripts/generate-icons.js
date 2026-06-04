// Gera ícones do app (icon, adaptive-icon, splash-icon, favicon) a partir de SVG.
// Rodar com: node scripts/generate-icons.js

const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const PRIMARY = '#820AD1';
const PRIMARY_DARK = '#5F0A9E';
const GOLD = '#F7C948';

function svgLogo({ bg, fg = '#FFFFFF', size = 1024, padding = 0.2, withCircle = true }) {
  const innerSize = size * (1 - padding * 2);
  const offset = size * padding;
  const cx = size / 2;
  const cy = size / 2;
  const r = innerSize / 2;
  const vPath = `
    M ${cx - r * 0.44} ${cy - r * 0.44}
    L ${cx} ${cy + r * 0.44}
    L ${cx + r * 0.44} ${cy - r * 0.44}
    L ${cx + r * 0.28} ${cy - r * 0.44}
    L ${cx} ${cy + r * 0.16}
    L ${cx - r * 0.28} ${cy - r * 0.44}
    Z
  `;
  const dotR = r * 0.08;
  return `
<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <defs>
    <linearGradient id="grad" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${PRIMARY}"/>
      <stop offset="1" stop-color="${PRIMARY_DARK}"/>
    </linearGradient>
  </defs>
  ${
    withCircle
      ? `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${bg === 'gradient' ? 'url(#grad)' : bg}"/>`
      : `<rect x="0" y="0" width="${size}" height="${size}" fill="${bg === 'gradient' ? 'url(#grad)' : bg}"/>`
  }
  <path d="${vPath}" fill="${fg}"/>
  <circle cx="${cx + r * 0.44}" cy="${cy - r * 0.44}" r="${dotR}" fill="${GOLD}"/>
</svg>
  `.trim();
}

async function generate() {
  const out = path.join(__dirname, '..', 'assets');
  if (!fs.existsSync(out)) fs.mkdirSync(out);

  const items = [
    // icon.png — ícone principal iOS / Android (1024x1024)
    { file: 'icon.png', size: 1024, bg: 'gradient', withCircle: false, padding: 0.18 },
    // adaptive-icon.png — foreground do Android (apenas o V, fundo definido em app.json)
    { file: 'adaptive-icon.png', size: 1024, bg: 'gradient', withCircle: false, padding: 0.28 },
    // splash-icon.png — splash centralizada
    { file: 'splash-icon.png', size: 1024, bg: 'transparent', withCircle: true, padding: 0.15 },
    // favicon.png — para web
    { file: 'favicon.png', size: 256, bg: 'gradient', withCircle: false, padding: 0.18 },
  ];

  for (const it of items) {
    const svg = svgLogo({
      bg: it.bg,
      size: it.size,
      padding: it.padding,
      withCircle: it.withCircle,
    });
    const target = path.join(out, it.file);
    await sharp(Buffer.from(svg)).png().toFile(target);
    console.log(`✓ ${it.file} (${it.size}x${it.size})`);
  }

  console.log('\n✅ Ícones gerados em assets/');
}

generate().catch((e) => {
  console.error(e);
  process.exit(1);
});
