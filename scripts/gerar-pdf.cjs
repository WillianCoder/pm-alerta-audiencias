/* Gera docs/Apresentacao-Alerta-Audiencia.pdf a partir de docs/apresentacao.html.
 * Uso: npx http-server -p 8766 -s . &   e depois   node scripts/gerar-pdf.cjs   (precisa do Playwright) */
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage();
  await p.goto((process.env.BASE || 'http://localhost:8766/') + 'docs/apresentacao.html', { waitUntil: 'networkidle' });
  await p.waitForSelector('body[data-pronto]');
  await p.pdf({ path: 'docs/Apresentacao-Alerta-Audiencia.pdf', format: 'A4', printBackground: true, preferCSSPageSize: true });
  await b.close(); console.log('PDF gerado em docs/Apresentacao-Alerta-Audiencia.pdf');
})();
