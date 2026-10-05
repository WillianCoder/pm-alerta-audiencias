/*
 * PM Alerta — painel administrativo.
 * Só abre para contas listadas na coleção "admins" do Firestore (ver README).
 * Mesmo que alguém altere este arquivo no navegador, as regras do Firestore
 * recusam qualquer gravação de quem não é administrador.
 */
import { createStore, authMessage, isPremium, POSICOES } from './store.js';
import { $, $$, esc, safeUrl, toast } from './util.js';
import { LABELS } from './ads.js';

const root = $('#adm');
const S = { store: null, site: null, pag: [], users: [], tab: 'geral' };

(async function init() {
  S.store = await createStore();
  if (S.store.mode === 'demo') $('#demo-banner').hidden = false;
  S.store.onAuth(async (u) => {
    if (!u) { renderLogin(); return; }
    if (!(await S.store.isAdmin())) {
      root.innerHTML = '<section class="card center"><h1>Acesso restrito</h1><p>Esta conta não é administradora.</p><a class="btn" href="./">Voltar ao app</a></section>';
      return;
    }
    await load(); render();
  });
})();

async function load() {
  [S.site, S.pag, S.users] = await Promise.all([S.store.getSite(), S.store.adminListPagamentos(), S.store.adminListUsers()]);
}

function renderLogin() {
  root.innerHTML = `<section class="card auth"><h1>Entrar no painel</h1>
    <form id="f-adm"><label>E-mail<input name="email" type="email" autocomplete="username" required></label>
    <label>Senha<input name="senha" type="password" autocomplete="current-password" required></label>
    <button class="btn primary block">Entrar</button></form></section>`;
  $('#f-adm').onsubmit = async (e) => {
    e.preventDefault(); const d = new FormData(e.target);
    try { await S.store.signIn(d.get('email'), d.get('senha')); } catch (er) { toast(authMessage(er), 'err'); }
  };
}

const TABS = [['geral', '📊 Visão geral'], ['pagamentos', '💰 Pagamentos'], ['usuarios', '👥 Usuários'], ['planos', '⭐ Preço e Pix'], ['anuncios', '📢 Anúncios'], ['avisos', '📣 Aviso geral']];

function render() {
  const pend = S.pag.filter((p) => p.status === 'pendente').length;
  root.innerHTML = `<nav class="adm-tabs">${TABS.map(([k, t]) => `<button class="${S.tab === k ? 'on' : ''}" data-tab="${k}">${t}${k === 'pagamentos' && pend ? ` <b class="badge">${pend}</b>` : ''}</button>`).join('')}</nav>
    <div id="adm-view">${({ geral, pagamentos, usuarios, planos, anuncios, avisos })[S.tab]()}</div>`;
  bind();
}

/* ---------- telas ---------- */
function geral() {
  const prem = S.users.filter(isPremium).length, pms = S.users.filter((u) => u.perfil === 'pm').length;
  const aprov = S.pag.filter((p) => p.status === 'aprovado');
  const receita = aprov.reduce((s, p) => s + Number(p.valor || 0), 0);
  const mes = new Date().toISOString().slice(0, 7);
  const receitaMes = aprov.filter((p) => String(p.decididoEm || p.criadoEm).startsWith(mes)).reduce((s, p) => s + Number(p.valor || 0), 0);
  const tile = (n, t) => `<div class="tile"><b>${n}</b><span>${t}</span></div>`;
  const ok = (c, t) => `<li class="${c ? 'ok' : 'todo'}">${c ? '✅' : '⬜'} ${t}</li>`;
  return `<div class="tiles">
      ${tile(S.users.length, 'Usuários')}${tile(pms, 'Policiais militares')}${tile(prem, 'Premium ativos')}
      ${tile('R$ ' + receitaMes.toFixed(2).replace('.', ','), 'Receita do mês')}${tile('R$ ' + receita.toFixed(2).replace('.', ','), 'Receita total')}
      ${tile(S.pag.filter((p) => p.status === 'pendente').length, 'Pix aguardando')}
    </div>
    <section class="card"><h2>Checklist para lucrar</h2><ul class="checklist">
      ${ok(S.store.mode === 'firebase', 'Firebase configurado (contas reais)')}
      ${ok(S.site.pix.chave, 'Chave Pix cadastrada — Premium e doações no ar')}
      ${ok(S.site.ads.client, 'Google AdSense configurado')}
      ${ok(Object.values(S.site.ads.posicoes).some((v) => v !== 'off'), 'Pelo menos uma posição de anúncio ligada')}
      ${ok(S.site.contato.whatsapp || S.site.contato.email, 'Contato para suporte e anunciantes')}
    </ul></section>`;
}

function pagamentos() {
  const st = { pendente: '⏳ Pendente', aprovado: '✅ Aprovado', recusado: '❌ Recusado' };
  const linhas = S.pag.slice().sort((a, b) => (a.status === 'pendente' ? -1 : 0) - (b.status === 'pendente' ? -1 : 0) || String(b.criadoEm).localeCompare(String(a.criadoEm)));
  return `<section class="card"><h2>Pagamentos Pix</h2>
    <p class="muted">Confira no extrato do seu banco um Pix de <b>R$ ${esc(S.site.premium.preco)}</b> com o <b>código</b> abaixo na identificação/descrição. Encontrou? Aprove — o Premium é liberado na hora (${esc(S.site.premium.dias)} dias, somando ao período atual).</p>
    ${linhas.length ? `<div class="table-wrap"><table><thead><tr><th>Código</th><th>E-mail</th><th>Valor</th><th>Data</th><th>Status</th><th></th></tr></thead><tbody>
    ${linhas.map((p) => `<tr><td class="mono">${esc(p.txid)}</td><td>${esc(p.email)}</td><td>R$ ${esc(p.valor)}</td><td>${esc(String(p.criadoEm || '').slice(0, 16).replace('T', ' '))}</td><td>${esc(st[p.status] || p.status)}</td>
      <td>${p.status === 'pendente' ? `<button class="btn small primary" data-ap="${esc(p.id)}">Aprovar</button> <button class="btn small" data-rec="${esc(p.id)}">Recusar</button>` : ''}</td></tr>`).join('')}
    </tbody></table></div>` : '<p class="muted">Nenhum pagamento ainda.</p>'}</section>`;
}

function usuarios() {
  return `<section class="card"><h2>Usuários</h2>
    <input id="u-busca" type="search" placeholder="Buscar por nome ou e-mail" aria-label="Buscar usuário">
    <div class="table-wrap"><table><thead><tr><th>Nome</th><th>E-mail</th><th>Perfil</th><th>UF</th><th>Plano</th><th></th></tr></thead><tbody id="u-rows">
    ${S.users.map((u) => `<tr data-q="${esc((u.nome + ' ' + u.email).toLowerCase())}"><td>${esc(u.posto || '')} ${esc(u.nome)}</td><td>${esc(u.email)}</td><td>${u.perfil === 'pm' ? '🚔 PM' : '👤'}</td><td>${esc(u.uf)}</td>
      <td>${isPremium(u) ? '⭐ até ' + esc(new Date(u.plano.ate).toLocaleDateString('pt-BR')) : 'Grátis'}</td>
      <td><button class="btn small" data-prem="${esc(u.id)}">${isPremium(u) ? 'Ajustar' : 'Dar Premium'}</button></td></tr>`).join('')}
    </tbody></table></div><p class="muted small">Dados pessoais: use só para suporte. Nunca exporte ou compartilhe (LGPD).</p></section>`;
}

function planos() {
  const p = S.site.premium, x = S.site.pix, c = S.site.contato;
  return `<form id="f-planos" class="card"><h2>Premium</h2>
    <div class="grid2"><label>Preço (R$)<input name="preco" type="number" min="1" step="0.01" value="${esc(p.preco)}" required></label>
    <label>Dias de acesso por pagamento<input name="dias" type="number" min="1" value="${esc(p.dias)}" required></label></div>
    <label>Limite de audiências no plano grátis<input name="limiteGratis" type="number" min="1" value="${esc(p.limiteGratis)}" required></label>
    <label>Benefícios (um por linha)<textarea name="beneficios" rows="5">${esc(p.beneficios.join('\n'))}</textarea></label>
    <h2>Pix</h2>
    <label>Chave Pix<input name="chave" value="${esc(x.chave)}" placeholder="CPF, CNPJ, e-mail, celular (+55…) ou chave aleatória" required></label>
    <div class="grid2"><label>Nome do recebedor <small>(até 25 letras)</small><input name="nome" maxlength="25" value="${esc(x.nome)}" required></label>
    <label>Cidade <small>(até 15 letras)</small><input name="cidade" maxlength="15" value="${esc(x.cidade)}" required></label></div>
    <label>Valores sugeridos de doação (R$, separados por vírgula)<input name="doacoes" value="${esc((x.doacoes || []).join(', '))}"></label>
    <h2>Contato</h2>
    <div class="grid2"><label>WhatsApp (com DDD)<input name="whatsapp" value="${esc(c.whatsapp)}" placeholder="5511999999999"></label>
    <label>E-mail de suporte<input name="email" type="email" value="${esc(c.email)}"></label></div>
    <button class="btn primary">Salvar</button></form>`;
}

function anuncios() {
  const a = S.site.ads;
  const modos = [['off', 'Desligado'], ['adsense', 'Google AdSense (automático)'], ['proprio', 'Anúncio próprio (patrocinador)']];
  return `<form id="f-ads" class="card"><h2>Onde os anúncios aparecem</h2>
    <p class="muted">Escolha o que mostrar em cada posição. Assinantes Premium nunca veem anúncios.</p>
    ${POSICOES.map((pos) => `<div class="pos-row"><label>${esc(LABELS[pos])}<select name="pos-${pos}">${modos.map(([v, t]) => `<option value="${v}" ${a.posicoes[pos] === v ? 'selected' : ''}>${t}</option>`).join('')}</select></label>
      <label>ID do bloco AdSense<input name="slot-${pos}" value="${esc(a.slots[pos])}" inputmode="numeric" placeholder="1234567890"></label></div>`).join('')}
    <h2>Google AdSense</h2>
    <p class="muted small">Renda automática: o Google escolhe e paga pelos anúncios. 1) Cadastre o site em <a href="https://adsense.google.com" target="_blank" rel="noopener">adsense.google.com</a> (precisa de domínio próprio). 2) Após aprovado, cole o ID de editor aqui e crie um "bloco de anúncio" por posição. 3) Atualize o arquivo <code>ads.txt</code> com seu ID.</p>
    <label>ID de editor<input name="client" value="${esc(a.client)}" placeholder="ca-pub-0000000000000000"></label>
    <button class="btn primary">Salvar posições</button></form>
    <section class="card"><h2>Anúncios próprios (patrocinadores)</h2>
    <p class="muted">Venda espaço direto para lojas, cursinhos, advogados… receba por Pix e cadastre aqui.</p>
    <div class="list">${S.site.anuncios.map((x, i) => `<div class="ad-item"><div><b>${esc(x.titulo)}</b> <small>${x.ativo ? '🟢 ativo' : '⚪ pausado'} · ${esc(x.posicao === 'todas' ? 'Todas as posições' : LABELS[x.posicao] || x.posicao)}</small><br><small class="muted">${esc(x.link)}</small></div>
      <div class="row"><button class="btn small" data-ad-toggle="${i}">${x.ativo ? 'Pausar' : 'Ativar'}</button><button class="btn small danger" data-ad-del="${i}">Excluir</button></div></div>`).join('') || '<p class="muted">Nenhum ainda.</p>'}</div>
    <form id="f-ad-new"><h3>Novo anúncio</h3>
      <label>Título<input name="titulo" maxlength="60" required></label>
      <label>Texto<input name="texto" maxlength="140"></label>
      <div class="grid2"><label>Link (https://)<input name="link" type="url" required></label><label>Imagem (https://, opcional)<input name="imagem" type="url"></label></div>
      <label>Posição<select name="posicao"><option value="todas">Todas as posições</option>${POSICOES.map((p) => `<option value="${p}">${esc(LABELS[p])}</option>`).join('')}</select></label>
      <button class="btn primary">Adicionar</button></form></section>`;
}

function avisos() {
  return `<form id="f-aviso" class="card"><h2>Aviso geral</h2><p class="muted">Aparece no topo do app para todos (ex.: manutenção, novidade). Deixe vazio para esconder.</p>
    <textarea name="aviso" rows="3" maxlength="300">${esc(S.site.aviso)}</textarea><button class="btn primary">Salvar</button></form>`;
}

/* ---------- ações ---------- */
async function saveSite(msg = 'Salvo ✅') {
  try { await S.store.adminSaveSite(S.site); toast(msg); render(); } catch (er) { toast(authMessage(er), 'err'); }
}

function bind() {
  $$('[data-tab]', root).forEach((b) => { b.onclick = () => { S.tab = b.dataset.tab; render(); }; });
  $$('[data-ap],[data-rec]', root).forEach((b) => {
    b.onclick = async () => {
      const ap = !!b.dataset.ap, id = b.dataset.ap || b.dataset.rec;
      if (!confirm(ap ? 'Confirmou o Pix no extrato? Aprovar e liberar o Premium?' : 'Recusar este pagamento?')) return;
      b.disabled = true;
      try { await S.store.adminDecidir(id, ap, Number(S.site.premium.dias)); await load(); render(); toast(ap ? 'Premium liberado ✅' : 'Recusado.'); }
      catch (er) { toast(authMessage(er), 'err'); b.disabled = false; }
    };
  });
  $$('[data-prem]', root).forEach((b) => {
    b.onclick = async () => {
      const d = prompt('Quantos dias de Premium a partir de hoje? (0 remove o Premium)', String(S.site.premium.dias));
      if (d === null || !/^\d+$/.test(d.trim())) return;
      try { await S.store.adminSetPremium(b.dataset.prem, Number(d)); await load(); render(); toast('Atualizado ✅'); } catch (er) { toast(authMessage(er), 'err'); }
    };
  });
  const ub = $('#u-busca');
  if (ub) ub.oninput = () => { const q = ub.value.toLowerCase(); $$('#u-rows tr').forEach((tr) => { tr.hidden = !tr.dataset.q.includes(q); }); };

  const fp = $('#f-planos');
  if (fp) fp.onsubmit = (e) => {
    e.preventDefault(); const d = Object.fromEntries(new FormData(fp));
    const preco = Number(d.preco), dias = parseInt(d.dias, 10), lim = parseInt(d.limiteGratis, 10);
    if (!(preco > 0) || !(dias > 0) || !(lim > 0)) return toast('Preço, dias e limite devem ser maiores que zero.', 'err');
    S.site.premium = { preco, dias, limiteGratis: lim, beneficios: d.beneficios.split('\n').map((s) => s.trim()).filter(Boolean).slice(0, 12) };
    S.site.pix = { chave: d.chave.trim(), nome: d.nome.trim(), cidade: d.cidade.trim(), doacoes: d.doacoes.split(',').map((v) => Number(v.trim().replace(',', '.'))).filter((v) => v > 0).slice(0, 6) };
    S.site.contato = { whatsapp: d.whatsapp.replace(/\D/g, ''), email: d.email.trim() };
    saveSite();
  };
  const fa = $('#f-ads');
  if (fa) fa.onsubmit = (e) => {
    e.preventDefault(); const d = Object.fromEntries(new FormData(fa));
    const client = d.client.trim();
    if (client && !/^ca-pub-\d{10,20}$/.test(client)) return toast('ID de editor deve ser ca-pub-0000000000000000', 'err');
    for (const p of POSICOES) {
      const slot = d['slot-' + p].trim();
      if (slot && !/^\d{6,20}$/.test(slot)) return toast('ID do bloco deve conter só números.', 'err');
      if (d['pos-' + p] === 'adsense' && (!client || !slot)) return toast(`"${LABELS[p]}": para usar AdSense, informe o ID de editor e o ID do bloco.`, 'err');
      S.site.ads.posicoes[p] = d['pos-' + p]; S.site.ads.slots[p] = slot;
    }
    S.site.ads.client = client;
    saveSite();
  };
  const fn = $('#f-ad-new');
  if (fn) fn.onsubmit = (e) => {
    e.preventDefault(); const d = Object.fromEntries(new FormData(fn));
    if (!safeUrl(d.link) || (d.imagem && !safeUrl(d.imagem))) return toast('Use links começando com https://', 'err');
    S.site.anuncios.push({ titulo: d.titulo.trim(), texto: d.texto.trim(), link: safeUrl(d.link), imagem: d.imagem ? safeUrl(d.imagem) : '', posicao: d.posicao, ativo: true });
    saveSite('Anúncio adicionado ✅ — lembre de ligar a posição como "Anúncio próprio".');
  };
  $$('[data-ad-toggle]', root).forEach((b) => { b.onclick = () => { const x = S.site.anuncios[b.dataset.adToggle]; x.ativo = !x.ativo; saveSite(); }; });
  $$('[data-ad-del]', root).forEach((b) => { b.onclick = () => { if (confirm('Excluir anúncio?')) { S.site.anuncios.splice(Number(b.dataset.adDel), 1); saveSite(); } }; });
  const fv = $('#f-aviso');
  if (fv) fv.onsubmit = (e) => { e.preventDefault(); S.site.aviso = new FormData(fv).get('aviso').trim(); saveSite(); };
}
