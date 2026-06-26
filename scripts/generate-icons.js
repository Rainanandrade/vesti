// Gera ícones do app (icon, adaptive-icon, splash-icon, favicon).
// Usa o SVG fonte em assets/icon-source.svg + paleta Esmeralda + Champagne.
// Rodar: node scripts/generate-icons.js

const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const PRIMARY = '#0B5345';      // Esmeralda profundo
const PRIMARY_LIGHT = '#1A7565';
const ACCENT = '#C9A961';        // Champagne dourado

// Gera o SVG inline (mesmo do icon-source.svg)
function buildLogoSvg({ size = 1024, withBg = true, padding = 0 }) {
  const inner = size - padding * 2;
  const scale = inner / 1024;
  const off = padding;

  const bgRect = withBg
    ? `<rect x="${off}" y="${off}" width="${inner}" height="${inner}" rx="${230 * scale}" fill="${PRIMARY}"/>`
    : '';
  const glow = withBg
    ? `<defs><radialGradient id="g" cx="50%" cy="40%" r="60%">
         <stop offset="0%" stop-color="${PRIMARY_LIGHT}" stop-opacity="0.5"/>
         <stop offset="100%" stop-color="${PRIMARY}" stop-opacity="0"/>
       </radialGradient></defs>
       <rect x="${off}" y="${off}" width="${inner}" height="${inner}" rx="${230 * scale}" fill="url(#g)"/>`
    : '';

  // Transformação pra coordenadas do logo (originalmente em 1024)
  const t = (x) => off + x * scale;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    ${bgRect}
    ${glow}
    <!-- Folha esquerda topo -->
    <path d="M ${t(342)} ${t(367)} C ${t(311)} ${t(304)} ${t(311)} ${t(246)} ${t(354)} ${t(200)}
             C ${t(397)} ${t(246)} ${t(397)} ${t(304)} ${t(367)} ${t(367)} Z"
          fill="${ACCENT}"/>
    <!-- Folha direita topo -->
    <path d="M ${t(682)} ${t(367)} C ${t(713)} ${t(304)} ${t(713)} ${t(246)} ${t(670)} ${t(200)}
             C ${t(627)} ${t(246)} ${t(627)} ${t(304)} ${t(657)} ${t(367)} Z"
          fill="${ACCENT}"/>
    <!-- Asa esquerda descendo -->
    <path d="M ${t(342)} ${t(367)} C ${t(342)} ${t(512)} ${t(397)} ${t(640)} ${t(487)} ${t(736)}
             C ${t(499)} ${t(750)} ${t(512)} ${t(750)} ${t(512)} ${t(736)}"
          fill="none" stroke="${ACCENT}" stroke-width="${58 * scale}" stroke-linecap="round"/>
    <!-- Asa direita descendo -->
    <path d="M ${t(682)} ${t(367)} C ${t(682)} ${t(512)} ${t(627)} ${t(640)} ${t(537)} ${t(736)}
             C ${t(525)} ${t(750)} ${t(512)} ${t(750)} ${t(512)} ${t(736)}"
          fill="none" stroke="${ACCENT}" stroke-width="${58 * scale}" stroke-linecap="round"/>
    <!-- Gota central -->
    <circle cx="${t(512)}" cy="${t(754)}" r="${34 * scale}" fill="${ACCENT}"/>
  </svg>`;
}

async function generate() {
  const out = path.join(__dirname, '..', 'assets');
  if (!fs.existsSync(out)) fs.mkdirSync(out);

  const items = [
    // icon.png — ícone principal iOS / Android (1024x1024, com fundo)
    { file: 'icon.png',          size: 1024, withBg: true,  padding: 0 },
    // adaptive-icon.png — foreground Android com margem (cor fundo definida em app.json)
    { file: 'adaptive-icon.png', size: 1024, withBg: true,  padding: 100 },
    // splash-icon.png — splash centralizada (com fundo)
    { file: 'splash-icon.png',   size: 1024, withBg: true,  padding: 50 },
    // favicon.png — para web
    { file: 'favicon.png',       size: 256,  withBg: true,  padding: 0 },
  ];

  for (const it of items) {
    const svg = buildLogoSvg({ size: it.size, withBg: it.withBg, padding: it.padding });
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
