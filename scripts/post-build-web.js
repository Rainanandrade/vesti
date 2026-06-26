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
    name: 'Vesti — Sua Carteira em Tempo Real',
    short_name: 'Vesti',
    description: 'Acompanhe sua carteira da B3, calcule IR, gere DARF e receba análises com IA.',
    start_url: '/',
    display: 'standalone',
    background_color: '#FFFFFF',
    theme_color: '#0B5345',
    orientation: 'portrait',
    categories: ['finance', 'productivity'],
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
    <meta name="theme-color" content="#0B5345" />
    <meta name="apple-mobile-web-app-capable" content="yes" />
    <meta name="mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
    <meta name="apple-mobile-web-app-title" content="Vesti" />
    <meta name="description" content="Acompanhe sua carteira da B3, calcule IR, gere DARF e receba análises com IA." />
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

  // Páginas legais estáticas (Apple/Google exigem URL pública)
  writeLegalPages();

  console.log('\n✅ PWA configurado em dist/');
}

function writeLegalPages() {
  // Importa os textos a partir do arquivo TS via require sintético
  const legalDocsPath = path.join(ROOT, 'src', 'data', 'legalDocs.ts');
  if (!fs.existsSync(legalDocsPath)) {
    console.warn('  ⚠️ legalDocs.ts não encontrado, pulando páginas legais');
    return;
  }
  const src = fs.readFileSync(legalDocsPath, 'utf-8');
  const grab = (varName) => {
    const m = src.match(new RegExp(`export const ${varName} = \`([\\s\\S]*?)\`\\.trim\\(\\);`));
    return m ? m[1].trim() : '';
  };
  const dateMatch = src.match(/LEGAL_DATE = '([^']+)'/);
  const date = dateMatch ? dateMatch[1] : new Date().toLocaleDateString('pt-BR');
  const emailMatch = src.match(/SUPPORT_EMAIL = '([^']+)'/);
  const email = emailMatch ? emailMatch[1] : 'contato@vesti.app';

  const privacy = grab('PRIVACY_POLICY').replace(/\$\{LEGAL_DATE\}/g, date).replace(/\$\{SUPPORT_EMAIL\}/g, email);
  const terms = grab('TERMS_OF_USE').replace(/\$\{LEGAL_DATE\}/g, date).replace(/\$\{SUPPORT_EMAIL\}/g, email);

  const legalDir = path.join(DIST, 'legal');
  if (!fs.existsSync(legalDir)) fs.mkdirSync(legalDir, { recursive: true });

  fs.writeFileSync(path.join(legalDir, 'privacy.html'), htmlWrap('Política de Privacidade', privacy));
  fs.writeFileSync(path.join(legalDir, 'terms.html'), htmlWrap('Termos de Uso', terms));
  console.log('  write legal/privacy.html, legal/terms.html');
}

function htmlWrap(title, markdown) {
  // Converte markdown leve → html
  const lines = markdown.split('\n');
  let html = '';
  let inList = false;
  for (const line of lines) {
    const t = line.trim();
    if (t === '---') { html += '<hr/>'; continue; }
    if (!t) { if (inList) { html += '</ul>'; inList = false; } html += '<br/>'; continue; }
    if (t.startsWith('## ')) { if (inList) { html += '</ul>'; inList = false; } html += `<h2>${esc(t.slice(3))}</h2>`; continue; }
    if (t.startsWith('# ')) { if (inList) { html += '</ul>'; inList = false; } html += `<h1>${esc(t.slice(2))}</h1>`; continue; }
    if (t.startsWith('- ')) {
      if (!inList) { html += '<ul>'; inList = true; }
      html += `<li>${md(esc(t.slice(2)))}</li>`; continue;
    }
    if (inList) { html += '</ul>'; inList = false; }
    html += `<p>${md(esc(t))}</p>`;
  }
  if (inList) html += '</ul>';
  return `<!DOCTYPE html><html lang="pt-BR"><head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)} — Vesti</title>
<meta name="theme-color" content="#0B5345">
<style>
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:720px;margin:0 auto;padding:32px 24px;color:#0F172A;line-height:1.65;background:#FFFFFF}
h1{color:#0B5345;font-size:28px;margin-bottom:8px}
h2{color:#0B5345;font-size:20px;margin-top:32px;margin-bottom:12px}
hr{border:none;border-top:1px solid #E2E8F0;margin:24px 0}
p{margin:8px 0}
ul{padding-left:24px;margin:8px 0}
strong{color:#0B5345}
a{color:#0B5345}
.back{display:inline-block;margin-bottom:24px;color:#0B5345;text-decoration:none;font-weight:600}
</style></head><body>
<a class="back" href="/">← Voltar pro Vesti</a>
${html}
</body></html>`;
}

function esc(s) { return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
function md(s) {
  return s.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
          .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2">$1</a>');
}

main();
