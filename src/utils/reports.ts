// Gera HTML formatado pra relatórios e abre em nova aba pra imprimir/salvar PDF.
// No web: window.open() com CSS de impressão. No mobile: futuro via expo-print.

import { Platform, Alert, Linking } from 'react-native';
import { Wallet } from '../context/AppContext';
import { Quote } from '../api/brapi';
import { DividendInfo } from '../api/dividends';
import { computeReceivedProventos } from './receivedProventos';

const monthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

function fmt(v: number): string {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function baseCss(): string {
  return `
    * { box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif; color: #1a1a1a; margin: 0; padding: 40px; max-width: 800px; margin: 0 auto; }
    h1 { color: #0B5345; font-size: 28px; margin: 0 0 6px; }
    h2 { color: #0B5345; font-size: 18px; border-bottom: 2px solid #C9A961; padding-bottom: 6px; margin-top: 32px; }
    h3 { font-size: 14px; margin-top: 20px; color: #333; }
    p, td, th { font-size: 12px; line-height: 1.5; }
    table { width: 100%; border-collapse: collapse; margin: 12px 0; }
    th { text-align: left; background: #f5f5f5; padding: 8px; font-weight: 700; text-transform: uppercase; font-size: 10px; }
    td { padding: 8px; border-bottom: 1px solid #eee; }
    .right { text-align: right; }
    .green { color: #16a34a; font-weight: 700; }
    .red { color: #dc2626; font-weight: 700; }
    .brand { color: #0B5345; font-weight: 900; letter-spacing: -0.5px; }
    .meta { color: #666; font-size: 11px; margin-top: 4px; }
    .footer { margin-top: 40px; padding-top: 12px; border-top: 1px solid #ccc; color: #888; font-size: 10px; text-align: center; }
    @media print {
      body { padding: 20px; }
      h2 { page-break-before: auto; page-break-after: avoid; }
      table { page-break-inside: avoid; }
      .no-print { display: none; }
    }
    .btn { display: inline-block; background: #0B5345; color: white; padding: 10px 18px; border-radius: 6px; text-decoration: none; font-weight: 700; margin-top: 20px; }
  `;
}

export function buildMonthlyReport(
  wallet: Wallet | null,
  quotes: Record<string, Quote>,
  dividends: Record<string, DividendInfo | null>,
  userName: string,
  month: number, // 1-12
  year: number,
): string {
  const monthName = monthNames[month - 1];
  const assets = wallet?.assets || [];

  const totalValue = assets.reduce((s, a) => s + (quotes[a.symbol]?.regularMarketPrice ?? a.avgPrice) * a.quantity, 0);
  const totalInvested = assets.reduce((s, a) => s + a.avgPrice * a.quantity, 0);
  const profit = totalValue - totalInvested;
  const profitPct = totalInvested > 0 ? (profit / totalInvested) * 100 : 0;

  const allProventos = computeReceivedProventos(assets, dividends);
  const monthKey = `${year}-${String(month).padStart(2, '0')}`;
  const monthProventos = allProventos.filter((p) => p.date.startsWith(monthKey));
  const monthTotal = monthProventos.reduce((s, p) => s + p.amount, 0);

  const assetsRows = assets
    .map((a) => {
      const price = quotes[a.symbol]?.regularMarketPrice ?? a.avgPrice;
      const value = price * a.quantity;
      const inv = a.avgPrice * a.quantity;
      const rent = ((value - inv) / inv) * 100;
      return `<tr>
        <td><strong>${a.symbol}</strong> — ${a.name}</td>
        <td class="right">${a.quantity}</td>
        <td class="right">${fmt(a.avgPrice)}</td>
        <td class="right">${fmt(price)}</td>
        <td class="right">${fmt(value)}</td>
        <td class="right ${rent >= 0 ? 'green' : 'red'}">${rent >= 0 ? '+' : ''}${rent.toFixed(2)}%</td>
      </tr>`;
    })
    .join('');

  const proventosRows = monthProventos.length === 0
    ? '<tr><td colspan="4" style="text-align:center;color:#888;padding:16px;">Sem proventos registrados neste mês.</td></tr>'
    : monthProventos.map((p) => `
      <tr>
        <td>${p.date.split('-').reverse().join('/')}</td>
        <td><strong>${p.symbol}</strong></td>
        <td>${p.kind === 'dividendo' ? 'Dividendo' : p.kind === 'jcp' ? 'JCP' : 'Rendimento'}</td>
        <td class="right green">${fmt(p.amount)}</td>
      </tr>`).join('');

  return `<!doctype html>
<html><head><meta charset="utf-8"><title>Extrato ${monthName}/${year} — Vesti</title><style>${baseCss()}</style></head>
<body>
  <h1><span class="brand">Vesti</span></h1>
  <p class="meta">Extrato de ${monthName} de ${year} · ${userName}</p>

  <h2>Resumo da carteira</h2>
  <table>
    <tr><td>Patrimônio total</td><td class="right"><strong>${fmt(totalValue)}</strong></td></tr>
    <tr><td>Valor investido</td><td class="right">${fmt(totalInvested)}</td></tr>
    <tr><td>Lucro/Prejuízo</td><td class="right ${profit >= 0 ? 'green' : 'red'}">${fmt(profit)} (${profitPct >= 0 ? '+' : ''}${profitPct.toFixed(2)}%)</td></tr>
    <tr><td>Proventos recebidos no mês</td><td class="right green">${fmt(monthTotal)}</td></tr>
  </table>

  <h2>Posição consolidada</h2>
  <table>
    <thead><tr>
      <th>Ativo</th><th class="right">Qtd</th><th class="right">PM</th><th class="right">Preço</th><th class="right">Valor</th><th class="right">Rent.</th>
    </tr></thead>
    <tbody>${assetsRows || '<tr><td colspan="6" style="text-align:center;color:#888;padding:16px;">Sem ativos cadastrados.</td></tr>'}</tbody>
  </table>

  <h2>Proventos do mês</h2>
  <table>
    <thead><tr><th>Data</th><th>Ativo</th><th>Tipo</th><th class="right">Valor</th></tr></thead>
    <tbody>${proventosRows}</tbody>
  </table>

  <div class="no-print">
    <button class="btn" onclick="window.print()">Imprimir ou salvar como PDF</button>
  </div>

  <div class="footer">
    Gerado pelo Vesti em ${new Date().toLocaleString('pt-BR')} · vesti-nine.vercel.app
  </div>
</body></html>`;
}

export function buildAnnualReport(
  wallet: Wallet | null,
  quotes: Record<string, Quote>,
  dividends: Record<string, DividendInfo | null>,
  userName: string,
  year: number,
): string {
  const assets = wallet?.assets || [];
  const totalValue = assets.reduce((s, a) => s + (quotes[a.symbol]?.regularMarketPrice ?? a.avgPrice) * a.quantity, 0);

  const allProventos = computeReceivedProventos(assets, dividends);
  const yearProventos = allProventos.filter((p) => p.date.startsWith(String(year)));

  const bySymbol = new Map<string, { dividendo: number; jcp: number; rendimento: number; total: number }>();
  for (const p of yearProventos) {
    const cur = bySymbol.get(p.symbol) || { dividendo: 0, jcp: 0, rendimento: 0, total: 0 };
    cur[p.kind] += p.amount;
    cur.total += p.amount;
    bySymbol.set(p.symbol, cur);
  }

  const proventosRows = [...bySymbol.entries()].sort((a, b) => b[1].total - a[1].total).map(([sym, v]) => `
    <tr>
      <td><strong>${sym}</strong></td>
      <td class="right">${fmt(v.dividendo)}</td>
      <td class="right">${fmt(v.jcp)}</td>
      <td class="right">${fmt(v.rendimento)}</td>
      <td class="right"><strong>${fmt(v.total)}</strong></td>
    </tr>`).join('');

  const totalAno = yearProventos.reduce((s, p) => s + p.amount, 0);

  const posicaoRows = assets.map((a) => {
    const price = quotes[a.symbol]?.regularMarketPrice ?? a.avgPrice;
    return `<tr>
      <td><strong>${a.symbol}</strong></td>
      <td>${a.name}</td>
      <td class="right">${a.quantity}</td>
      <td class="right">${fmt(a.avgPrice)}</td>
      <td class="right">${fmt(price)}</td>
      <td class="right">${fmt(price * a.quantity)}</td>
    </tr>`;
  }).join('');

  return `<!doctype html>
<html><head><meta charset="utf-8"><title>Informe anual ${year} — Vesti</title><style>${baseCss()}</style></head>
<body>
  <h1><span class="brand">Vesti</span></h1>
  <p class="meta">Informe de rendimentos ${year} · ${userName}</p>
  <p class="meta">Uso: base pra declaração de IRPF. Consulte seu contador.</p>

  <h2>Resumo do ano</h2>
  <table>
    <tr><td>Patrimônio em ${new Date().toLocaleDateString('pt-BR')}</td><td class="right"><strong>${fmt(totalValue)}</strong></td></tr>
    <tr><td>Proventos recebidos em ${year}</td><td class="right green"><strong>${fmt(totalAno)}</strong></td></tr>
    <tr><td>Ativos em carteira</td><td class="right">${assets.length}</td></tr>
  </table>

  <h2>Proventos por ativo</h2>
  <table>
    <thead><tr>
      <th>Ativo</th><th class="right">Dividendos</th><th class="right">JCP</th><th class="right">Rendimentos</th><th class="right">Total</th>
    </tr></thead>
    <tbody>${proventosRows || '<tr><td colspan="5" style="text-align:center;color:#888;padding:16px;">Sem proventos no ano.</td></tr>'}</tbody>
  </table>

  <h2>Posição em ${new Date().toLocaleDateString('pt-BR')}</h2>
  <table>
    <thead><tr><th>Código</th><th>Nome</th><th class="right">Qtd</th><th class="right">Preço médio</th><th class="right">Preço atual</th><th class="right">Valor</th></tr></thead>
    <tbody>${posicaoRows || '<tr><td colspan="6" style="text-align:center;color:#888;padding:16px;">Sem ativos.</td></tr>'}</tbody>
  </table>

  <div class="no-print">
    <button class="btn" onclick="window.print()">Imprimir ou salvar como PDF</button>
  </div>

  <div class="footer">
    Gerado pelo Vesti em ${new Date().toLocaleString('pt-BR')} · vesti-nine.vercel.app
  </div>
</body></html>`;
}

export async function openReport(html: string, title: string) {
  if (Platform.OS === 'web') {
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const win = (globalThis as any).window?.open(url, '_blank');
    if (!win) {
      Alert.alert('Bloqueado', 'Permita janelas popup pra ver o relatório.');
    }
  } else {
    // Mobile: abre a URL em base64 no navegador do sistema.
    // Solução completa via expo-print virá em release futura.
    const encoded = encodeURIComponent(html);
    const dataUrl = `data:text/html;charset=utf-8,${encoded}`;
    const canOpen = await Linking.canOpenURL(dataUrl);
    if (canOpen) await Linking.openURL(dataUrl);
    else Alert.alert(title, 'Relatório pronto — abra a versão web pra baixar.');
  }
}
