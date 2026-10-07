/*
 * Teste de ponta a ponta (modo demonstração) num iPhone simulado.
 * Uso:  npx http-server -p 8766 -s .   (em outro terminal)   e depois   node tests/e2e.cjs
 * Requer Playwright instalado (npm i -g playwright). Fotos das telas vão para tests/telas/.
 */
const { chromium, devices } = require('playwright');
const fs = require('fs');
const BASE = process.env.BASE || 'http://localhost:8766/';
const OUT = __dirname + '/telas/';
fs.mkdirSync(OUT, { recursive: true });
const ok = (cond, msg) => { console.log((cond ? '✅ ' : '❌ ') + msg); if (!cond) process.exitCode = 1; };

(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ ...devices['iPhone 13'], permissions: ['notifications'] });
  const p = await ctx.newPage();
  const errs = []; p.on('pageerror', (e) => errs.push(e.message)); p.on('console', (m) => m.type() === 'error' && !/adsbygoogle|googlesyndication|ERR_/.test(m.text()) && errs.push(m.text()));
  // Fontes públicas simuladas (o ambiente de teste não acessa a internet).
  await ctx.route('**/comunicaapi.pje.jus.br/**', (r) => r.fulfill({ json: { items: [{ siglaTribunal: 'TJSP', nomeOrgao: '3ª Vara Cível de Campinas', data_disponibilizacao: '2026-10-01', numeroprocessocommascara: '1001234-56.2026.8.26.0114', texto: 'Fica intimada a parte JOANA DA SILVA para audiência de conciliação...', link: 'https://comunica.pje.jus.br/' }] } }));
  await ctx.route('**/api.queridodiario.ok.org.br/**', (r) => r.fulfill({ json: { gazettes: [] } }));
  const S = (n) => p.screenshot({ path: OUT + n + '.png', fullPage: true });
  const dialogs = []; p.on('dialog', (d) => { dialogs.push(d.message()); d.accept(); });

  // Páginas públicas sem login
  await p.goto(BASE); await p.waitForSelector('.hero'); await S('01-entrada');
  await p.goto(BASE + '#/anuncie'); await p.waitForSelector('.pacote'); ok((await p.$$('.pacote')).length === 4, 'Página Anuncie aqui mostra 4 pacotes sem login'); await S('02-anuncie');
  await p.goto(BASE + '#/ajuda'); await p.waitForSelector('.faq'); ok((await p.$$('.faq')).length >= 6, 'Página de Ajuda abre sem login');

  // Cadastro
  await p.goto(BASE + '#/cadastro'); await p.waitForSelector('#f-cad');
  await p.fill('[name=nome]', 'Joana da Silva'); await p.fill('[name=email]', 'joana@teste.com'); await p.fill('[name=senha]', 'senha1234');
  await p.check('[name=aceite]'); await p.click('#f-cad button[type=submit]');
  await p.waitForSelector('.hello'); ok(await p.isVisible('text=Olá, Joana'), 'Cadastro e login');

  // Colar intimação
  await p.goto(BASE + '#/nova'); await p.waitForSelector('#intimacao');
  await p.fill('#intimacao', 'Processo nº 1001234-56.2026.8.26.0114. Fica V. Sa. intimada para a audiência de conciliação designada para o dia 18/11/2026, às 14h30, a ser realizada por videoconferência pelo link https://tjsp.zoom.us/j/123456789 — 3ª Vara Cível de Campinas.');
  await S('03-colar-intimacao');
  await p.click('[data-act=ler-intimacao]');
  ok(await p.inputValue('[name=data]') === '2026-11-18', 'Intimação: data lida');
  ok(await p.inputValue('[name=hora]') === '14:30', 'Intimação: hora lida');
  ok((await p.inputValue('[name=processo]')).startsWith('1001234-56.2026.8.26.0114'), 'Intimação: processo lido');
  ok(await p.inputValue('[name=link]') === 'https://tjsp.zoom.us/j/123456789', 'Intimação: link da sala lido');
  ok(await p.inputValue('[name=fase]') === 'Conciliação ou mediação', 'Intimação: tipo de audiência reconhecido');
  ok((await p.inputValue('[name=vara]')).includes('3ª Vara Cível'), 'Intimação: vara lida');
  await p.fill('[name=titulo]', 'Acordo com a operadora de celular'); await p.selectOption('[name=papel]', 'Autor / quem entrou com a ação');
  await S('04-form-preenchido');
  await p.click('#f-aud button[type=submit]'); await p.waitForSelector('.explica');
  ok(await p.isVisible('text=O que acontece nessa audiência'), 'Explicação do tipo de audiência');
  ok((await p.$$('.todo li')).length >= 8, 'Lista do que levar');
  await p.check('.todo input >> nth=0'); await p.reload(); await p.waitForSelector('.todo');
  ok(await p.isChecked('.todo input >> nth=0'), 'Item marcado na lista fica salvo');
  await S('05-detalhe');

  // Mais 2 audiências e limite grátis (3)
  for (const dia of ['20', '25']) {
    await p.goto(BASE + '#/nova'); await p.waitForSelector('#f-aud');
    await p.fill('[name=titulo]', 'Testemunha em processo trabalhista ' + dia); await p.fill('[name=data]', `2026-12-${dia}`); await p.fill('[name=hora]', '09:00');
    await p.fill('[name=local]', 'Fórum Trabalhista, Av. José de Souza Campos, 422, Campinas');
    await p.click('#f-aud button[type=submit]'); await p.waitForSelector('.explica, .todo');
  }
  await p.goto(BASE + '#/nova'); await p.waitForTimeout(300); ok(await p.isVisible('text=Limite do plano grátis'), 'Limite de 3 audiências no plano grátis');
  await p.goto(BASE + '#/'); await p.waitForTimeout(300); await S('06-inicio');
  await p.goto(BASE + '#/audiencias'); await p.waitForTimeout(300); await S('07-lista');

  // Busca com limite grátis (2 por mês)
  await p.goto(BASE + '#/buscar'); await p.waitForSelector('#f-busca');
  await p.click('#f-busca button[type=submit]'); await p.waitForSelector('.hit');
  ok(await p.isVisible('text=1001234-56.2026.8.26.0114'), 'Busca mostra resultado do CNJ');
  ok((await p.textContent('#uso')).includes('1/2'), 'Contador de buscas: 1/2');
  await S('08-busca');
  await p.click('#f-busca button[type=submit]'); await p.waitForTimeout(400);
  await p.click('#f-busca button[type=submit]'); await p.waitForTimeout(400);
  ok(await p.isVisible('text=limite de buscas deste mês'), 'Terceira busca do mês bloqueada no plano grátis');
  await S('09-busca-limite');

  // Admin (1ª conta do modo demo): Pix, limites, anúncios
  await p.goto(BASE + 'admin.html'); await p.waitForSelector('.adm-tabs'); await S('10-admin');
  await p.click('text=⭐ Planos, limites e Pix');
  await p.fill('[name=chave]', 'pix@exemplo.com'); await p.fill('#f-planos [name=nome]', 'WILLIAN SALLES'); await p.fill('[name=cidade]', 'SAO PAULO');
  await p.fill('[name=whatsapp]', '5511999999999');
  await p.click('#f-planos button'); await p.waitForTimeout(300); await S('11-admin-planos');
  await p.click('text=📢 Anúncios');
  await p.selectOption('[name=pos-destaque]', 'proprio'); await p.selectOption('[name=pos-artigos]', 'proprio'); await p.selectOption('[name=pos-busca]', 'proprio');
  await p.click('#f-ads button'); await p.waitForTimeout(300);
  await p.fill('#f-ad-new [name=titulo]', 'Dra. Ana Lima — Advocacia'); await p.fill('#f-ad-new [name=texto]', 'Direito do consumidor e trabalhista. Primeira consulta online.');
  await p.fill('#f-ad-new [name=link]', 'https://exemplo.com/'); await p.click('#f-ad-new button'); await p.waitForTimeout(300);
  await p.fill('#f-ad-new [name=titulo]', 'Anúncio vencido'); await p.fill('#f-ad-new [name=link]', 'https://vencido.com/'); await p.fill('#f-ad-new [name=ate]', '2026-01-01');
  await p.click('#f-ad-new button'); await p.waitForTimeout(300); await S('12-admin-anuncios');
  await p.goto(BASE + '#/'); await p.waitForTimeout(400);
  ok(await p.isVisible('text=Dra. Ana Lima'), 'Anúncio próprio aparece no app');
  ok(!(await p.isVisible('text=Anúncio vencido')), 'Anúncio vencido não aparece');
  const href = await p.getAttribute('.ad-own a', 'href'); ok(href.includes('utm_source=alerta-audiencia'), 'Link do anúncio leva UTM para o anunciante medir');
  await S('13-inicio-anuncio');

  // Premium via Pix e aprovação
  await p.goto(BASE + '#/premium'); await p.waitForSelector('[data-act=pagar]'); await p.click('[data-act=pagar]'); await p.waitForSelector('.qr svg');
  ok((await p.inputValue('#pix-code')).startsWith('000201'), 'QR Code Pix gerado (carregado sob demanda)'); await S('14-pix');
  await p.click('[data-act=ja-paguei]'); await p.waitForTimeout(400);
  await p.goto(BASE + 'admin.html'); await p.waitForSelector('.adm-tabs'); await p.click('text=💰 Pagamentos'); await p.click('[data-ap]'); await p.waitForTimeout(400);
  await p.goto(BASE + '#/premium'); await p.waitForTimeout(400); ok(await p.isVisible('text=Você é Premium'), 'Premium liberado pelo painel');
  await p.goto(BASE + '#/'); await p.waitForTimeout(300); ok(!(await p.isVisible('text=Dra. Ana Lima')), 'Premium não vê anúncios');
  await p.goto(BASE + '#/buscar'); await p.waitForSelector('#f-busca'); await p.waitForTimeout(300);
  ok((await p.textContent('#uso')).includes('/5'), 'Premium: limite de 5 buscas por dia');

  // Guia
  await p.goto(BASE + 'guia/'); await p.waitForSelector('.guia-item'); ok((await p.$$('.guia-item')).length === 8, 'Guia com 8 artigos');
  await p.goto(BASE + 'guia/o-que-acontece-se-faltar-audiencia.html'); await p.waitForSelector('article'); await p.waitForTimeout(500);
  ok(await p.isVisible('text=Dra. Ana Lima'), 'Anúncio aparece no meio do artigo'); await S('15-artigo');
  await p.goto(BASE + 'sobre.html'); await p.waitForTimeout(500); ok(await p.isVisible('text=WhatsApp'), 'Sobre e contato mostra WhatsApp do painel');

  // XSS
  await p.goto(BASE + '#/conta'); await p.waitForSelector('#f-perfil');
  await p.fill('[name=outroNome]', '<img src=x onerror=alert(1)>'); await p.click('#f-perfil button[type=submit]'); await p.waitForTimeout(300);
  await p.goto(BASE + '#/buscar'); await p.waitForTimeout(400);
  ok(!(await p.$('img[src=x]')) && !dialogs.some((m) => m === '1'), 'Texto malicioso não executa (XSS bloqueado)');

  ok(errs.length === 0, 'Sem erros no console' + (errs.length ? ': ' + errs.join(' | ') : ''));
  await b.close();
})();
