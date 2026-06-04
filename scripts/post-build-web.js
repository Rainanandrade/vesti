// Post-processa o dist/ depois do `expo export -p web` pra:
// - injetar meta tags PWA (apple-touch-icon, theme-color)
// - gerar manifest.json
// - copiar ícones pra dist/
// - copiar fonte Ionicons e injetar @font-face (pra ícones funcionarem na web)

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const DIST = path.join(ROOT, 'dist');
const ASSETS = path.join(ROOT, 'assets');
const ICONS_TTF = path.join(
  ROOT,
  'node_modules',
  '@expo',
  'vector-icons',
  'build',
  'vendor',
  'react-native-vector-icons',
  'Fonts',
  'Ionicons.ttf',
);

function copy(src, dst) {
  fs.copyFileSync(src, dst);
  console.log(`  copy ${path.basename(dst)}`);
}

function main() {
  if (!fs.existsSync(DIST)) throw new Error(`Falta dist/`);

  // Ícones
  copy(path.join(ASSETS, 'icon.png'), path.join(DIST, 'icon.png'));
  copy(path.join(ASSETS, 'icon.png'), path.join(DIST, 'apple-touch-icon.png'));
  copy(path.join(ASSETS, 'favicon.png'), path.join(DIST, 'favicon.png'));
  copy(path.join(ASSETS, 'splash-icon.png'), path.join(DIST, 'splash-icon.png'));

  // Ionicons font
  if (fs.existsSync(ICONS_TTF)) {
    const fontsDir = path.join(DIST, 'fonts');
    if (!fs.existsSync(fontsDir)) fs.mkdirSync(fontsDir);
    copy(ICONS_TTF, path.join(fontsDir, 'Ionicons.ttf'));
  } else {
    console.warn('⚠️ Ionicons.ttf not found in node_modules');
  }

  // manifest.json (PWA)
  const manifest = {
    name: 'Vesti',
    short_name: 'Vesti',
    description: 'Acompanhe sua carteira em tempo real',
    start_url: '/',
    display: 'standalone',
    background_color: '#820AD1',
    theme_color: '#820AD1',
    orientation: 'portrait',
    icons: [
      { src: '/icon.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
      { src: '/icon.png', sizes: '192x192', type: 'image/png' },
    ],
  };
  fs.writeFileSync(path.join(DIST, 'manifest.json'), JSON.stringify(manifest, null, 2));
  console.log('  write manifest.json');

  // Injeta meta tags + @font-face no index.html
  const indexPath = path.join(DIST, 'index.html');
  let html = fs.readFileSync(indexPath, 'utf-8');

  const inject = `
    <meta name="theme-color" content="#820AD1" />
    <meta name="apple-mobile-web-app-capable" content="yes" />
    <meta name="mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
    <meta name="apple-mobile-web-app-title" content="Vesti" />
    <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
    <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
    <link rel="manifest" href="/manifest.json" />
    <style>
      @font-face {
        font-family: 'Ionicons';
        src: url('/fonts/Ionicons.ttf') format('truetype');
        font-weight: normal;
        font-style: normal;
      }
    </style>
`;

  // Remove favicon antigo, adiciona o novo
  html = html.replace(/<link rel="icon"[^>]*\/?>/g, '');
  html = html.replace('</head>', `    <link rel="icon" type="image/png" href="/favicon.png" />\n${inject}\n  </head>`);

  fs.writeFileSync(indexPath, html);
  console.log('  patch index.html');

  console.log('\n✅ PWA configurado em dist/');
}

main();
