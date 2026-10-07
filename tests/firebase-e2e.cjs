/*
 * Teste de ponta a ponta com o Firebase de verdade (emuladores de Auth e Firestore + regras reais).
 * Uso:
 *   npx http-server -p 8766 -s . &
 *   FIREBASE_DIR=node_modules/firebase npx firebase emulators:exec --only auth,firestore --project demo-alerta "node tests/firebase-e2e.cjs"
 * FIREBASE_DIR aponta para o pacote npm "firebase" (10.x), que traz os mesmos arquivos do CDN gstatic.
 */
const { chromium, devices } = require('playwright');
const fs = require('fs');
const path = require('path');
const BASE = process.env.BASE || 'http://localhost:8766/';
const FB = process.env.FIREBASE_DIR;
const V = JSON.parse(fs.readFileSync(path.join(FB, 'package.json'))).version;
const ok = (c, m) => { console.log((c ? '✅ ' : '❌ ') + m); if (!c) process.exitCode = 1; };
const CONFIG = `window.PM_CONFIG = { firebase: { apiKey: 'demo-key', authDomain: 'demo-alerta.firebaseapp.com', projectId: 'demo-alerta', appId: '1:1:web:1' }, firebaseVersion: '${V}', emuladores: true };`;

async function rest(url, body, method = 'POST') {
  const r = await fetch(url, { method, headers: { 'Content-Type': 'application/json', Authorization: 'Bearer owner' }, body: JSON.stringify(body) });
  if (!r.ok) throw new Error(url + ' → ' + r.status + ' ' + await r.text());
  return r.json();
}
const FS = 'http://127.0.0.1:8080/v1/projects/demo-alerta/databases/(default)/documents/';

async function novaPagina(b) {
  // serviceWorkers: 'block' para que as rotas simuladas valham também depois de recarregar.
  const ctx = await b.newContext({ ...devices['iPhone 13'], bypassCSP: true, serviceWorkers: 'block', permissions: ['notifications'] });
  await ctx.route('**/assets/js/config.js', (r) => r.fulfill({ contentType: 'text/javascript', body: CONFIG }));
  await ctx.route(`https://www.gstatic.com/firebasejs/${V}/*`, (r) => r.fulfill({ contentType: 'text/javascript', body: fs.readFileSync(path.join(FB, path.basename(new URL(r.request().url()).pathname))) }));
  await ctx.route('**/comunicaapi.pje.jus.br/**', (r) => r.fulfill({ json: { items: [] } }));
  await ctx.route('**/api.queridodiario.ok.org.br/**', (r) => r.fulfill({ json: { gazettes: [] } }));
  const p = await ctx.newPage();
  p.errs = []; p.on('pageerror', (e) => p.errs.push(e.message)); if (process.env.DEBUG) p.on('console', (m) => console.log('   [console]', m.type(), m.text().slice(0, 200)));
  p.on('dialog', (d) => d.accept());
  return p;
}

(async () => {
  // Administrador criado direto nos emuladores (no mundo real: pelo console do Firebase).
  const admin = await rest('http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1/accounts:signUp?key=demo-key', { email: 'admin@teste.com', password: 'senha1234', returnSecureToken: true });
  await rest(FS + 'admins?documentId=' + admin.localId, { fields: { nome: { stringValue: 'Admin' } } });
  await rest(FS + 'users?documentId=' + admin.localId, { fields: { nome: { stringValue: 'Willian' }, uf: { stringValue: 'SP' }, email: { stringValue: 'admin@teste.com' } } });

  const b = await chromium.launch();
  const u = await novaPagina(b), a = await novaPagina(b);

  // Usuária comum
  await u.goto(BASE + '#/cadastro'); await u.waitForSelector('#f-cad');
  ok(!(await u.isVisible('#demo-banner')), 'App conectado ao Firebase (sem modo demonstração)');
  await u.fill('[name=nome]', 'Joana da Silva'); await u.fill('[name=email]', 'joana@teste.com'); await u.fill('[name=senha]', 'senha1234');
  await u.check('[name=aceite]'); await u.click('#f-cad button[type=submit]'); await u.waitForSelector('.hello', { timeout: 15000 });
  ok(true, 'Cadastro com e-mail e senha no Firebase Auth');
  await u.goto(BASE + '#/nova'); await u.waitForSelector('#f-aud');
  await u.fill('[name=titulo]', 'Conciliação com a operadora'); await u.fill('[name=data]', '2026-12-10'); await u.fill('[name=hora]', '10:00');
  await u.selectOption('[name=fase]', 'Conciliação ou mediação');
  await u.click('#f-aud button[type=submit]'); await u.waitForSelector('.explica', { timeout: 15000 });
  ok(true, 'Audiência salva no Firestore (regras aceitaram)');

  // Limite de buscas contado no servidor
  await u.goto(BASE + '#/buscar'); await u.waitForSelector('#f-busca');
  for (let i = 0; i < 2; i++) { await u.click('#f-busca button[type=submit]'); await u.waitForSelector('#res section', { timeout: 15000 }); await u.waitForTimeout(500); }
  ok((await u.textContent('#uso')).includes('2/2'), 'Contador de buscas no servidor: 2/2');
  await u.click('#f-busca button[type=submit]'); await u.waitForTimeout(1500);
  ok(await u.isVisible('text=limite de buscas deste mês'), '3ª busca grátis bloqueada');
  await u.reload(); await u.waitForSelector('#uso', { timeout: 15000 }); await u.waitForTimeout(1500);
  ok((await u.textContent('#uso')).includes('2/2'), 'Contador continua 2/2 depois de recarregar (está no servidor)');

  // Admin configura o Pix
  await a.goto(BASE + 'admin.html'); await a.waitForSelector('#f-adm');
  await a.fill('[name=email]', 'admin@teste.com'); await a.fill('[name=senha]', 'senha1234'); await a.click('#f-adm button');
  await a.waitForSelector('.adm-tabs', { timeout: 15000 }); ok(true, 'Admin entra no painel');
  await a.click('text=⭐ Planos, limites e Pix');
  await a.fill('[name=whatsapp]', '5511988887777'); await a.fill('[name=chave]', 'pix@exemplo.com'); await a.fill('#f-planos [name=nome]', 'WILLIAN SALLES'); await a.fill('[name=cidade]', 'SAO PAULO');
  await a.click('#f-planos button'); await a.waitForTimeout(1500);

  // Usuária paga e avisa
  await u.goto(BASE + '#/premium'); await u.reload(); await u.waitForSelector('[data-act=pagar]', { timeout: 15000 });
  await u.click('[data-act=pagar]'); await u.waitForSelector('.qr svg'); await u.click('[data-act=ja-paguei]');
  await u.waitForSelector('text=Recebemos seu aviso', { timeout: 15000 }); ok(true, 'Aviso de pagamento salvo (ID com limite diário)');

  // Admin aprova
  await a.reload(); await a.waitForSelector('.adm-tabs', { timeout: 15000 }); await a.click('text=💰 Pagamentos');
  await a.waitForSelector('[data-ap]'); await a.click('[data-ap]'); await a.waitForSelector('text=✅ Aprovado', { timeout: 15000 });
  ok(true, 'Admin aprova o pagamento');
  await a.click('text=👥 Usuários'); ok(await a.isVisible('text=joana@teste.com'), 'Admin vê a usuária na lista');

  await u.goto(BASE + '#/premium'); await u.reload(); await u.waitForTimeout(2500);
  ok(await u.isVisible('text=Você é Premium'), 'Premium liberado para a usuária');
  await u.goto(BASE + '#/buscar'); await u.waitForSelector('#uso'); await u.waitForTimeout(1500);
  ok((await u.textContent('#uso')).includes('/5'), 'Premium: limite passa para 5 por dia');
  await u.click('#f-busca button[type=submit]'); await u.waitForSelector('#res section', { timeout: 15000 });
  ok(!(await u.isVisible('text=limite de buscas')), 'Premium consegue buscar de novo');

  // Páginas estáticas leem a configuração pública pela API REST (sem login)
  await u.goto(BASE + 'sobre.html'); await u.waitForSelector('[data-contato] a', { timeout: 15000 });
  ok((await u.getAttribute('[data-contato] a', 'href')).includes('5511988887777'), 'Sobre e contato lê o WhatsApp do painel (API REST)');

  ok(u.errs.length + a.errs.length === 0, 'Sem erros de JavaScript' + (u.errs.concat(a.errs).length ? ': ' + u.errs.concat(a.errs).join(' | ') : ''));
  await b.close();
})().catch((e) => { console.error('❌', e.message); process.exit(1); });
