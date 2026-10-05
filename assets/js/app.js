/* PM Alerta — aplicativo principal. */
import { createStore, authMessage, isPremium } from './store.js';
import { $, $$, esc, safeUrl, toast, when, fmtData, fmtHora, countdown, formatCNJ, validCNJ, pixPayload, qrSvg, novoTxid, buildICS, download, googleAgendaUrl, mapsUrl, wazeUrl } from './util.js';
import { adHtml, fillAds } from './ads.js';

const PAPEIS = ['Testemunha', 'Condutor do flagrante', 'Vítima', 'Réu / Acusado', 'Informante', 'Perito', 'Outro'];
const TIPOS = ['Criminal', 'JECRIM (Juizado Especial Criminal)', 'Justiça Militar', 'Cível', 'Juizado Especial Cível', 'Trabalhista', 'Família', 'Administrativa / Sindicância / PAD', 'Outro'];
const STATUS = { agendada: 'Agendada', realizada: 'Realizada', adiada: 'Adiada', cancelada: 'Cancelada' };
const LEMBRETES_PADRAO = [10080, 1440, 120]; // 7 dias, 1 dia, 2 horas (em minutos)
const LEMBRETE_OPCOES = [[20160, '14 dias'], [10080, '7 dias'], [4320, '3 dias'], [1440, '1 dia'], [720, '12 horas'], [240, '4 horas'], [120, '2 horas'], [60, '1 hora'], [30, '30 minutos']];
const UFS = 'AC AL AP AM BA CE DF ES GO MA MT MS MG PA PB PR PE PI RJ RN RS RO RR SC SP SE TO'.split(' ');

const S = { store: null, user: null, perfil: null, site: null, aud: [], admin: false, timer: null };
const app = $('#app');
const premium = () => isPremium(S.perfil);

/* ================= inicialização ================= */
(async function init() {
  S.store = await createStore();
  if (S.store.mode === 'demo') $('#demo-banner').hidden = false;
  S.site = await S.store.getSite();
  S.store.onAuth(async (u) => {
    S.user = u;
    if (u) {
      S.perfil = (await S.store.getProfile()) || {};
      S.aud = await S.store.listAudiencias();
      S.admin = await S.store.isAdmin();
      S.site = await S.store.getSite();
      startReminders();
    } else {
      S.perfil = null; S.aud = []; S.admin = false; clearInterval(S.timer);
    }
    render();
  });
  window.addEventListener('hashchange', render);
  if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(() => {});
})();

const route = () => (location.hash.replace(/^#\/?/, '') || 'inicio').split('/');
const go = (h) => { if (location.hash === h) render(); else location.hash = h; };

function render() {
  const [r, id] = route();
  if (!S.user) { renderAuth(r); return; }
  $('#nav').hidden = false;
  $$('#nav a').forEach((a) => a.classList.toggle('on', a.getAttribute('href') === '#/' + r || (r === 'inicio' && a.getAttribute('href') === '#/')));
  const views = { inicio: vInicio, audiencias: vLista, nova: () => vForm(), editar: () => vForm(id), ver: () => vVer(id), buscar: vBuscar, premium: vPremium, conta: vConta, apoie: vApoie };
  const html = (views[r] || vInicio)();
  const aviso = S.site.aviso ? `<div class="notice">${esc(S.site.aviso)}</div>` : '';
  app.innerHTML = aviso + html + adHtml(S.site, 'rodape', premium());
  app.focus({ preventScroll: true });
  window.scrollTo(0, 0);
  bind(r, id);
  fillAds(app, S.site);
}

/* ================= autenticação ================= */
function renderAuth(r) {
  $('#nav').hidden = true;
  const modo = ['cadastro', 'recuperar'].includes(r) ? r : 'entrar';
  const p = S.site.premium;
  app.innerHTML = `
  <section class="hero">
    <div class="hero-badge">🚔 Feito para policiais militares</div>
    <h1>Nunca mais perca uma audiência.</h1>
    <p>Anote suas intimações, receba lembretes no celular e saiba exatamente do que se trata, onde é e a que horas — em segundos.</p>
    <ul class="hero-list">
      <li>⏰ Lembretes 7 dias, 1 dia e 2 horas antes</li>
      <li>📍 Como chegar ao fórum ou link da sala virtual</li>
      <li>🔎 Premium: busca do seu nome em diários e comunicações oficiais</li>
      <li>📱 Funciona no iPhone, Android e computador</li>
    </ul>
  </section>
  <section class="card auth">
    <div class="tabs" role="tablist">
      <a role="tab" href="#/entrar" class="${modo === 'entrar' ? 'on' : ''}">Entrar</a>
      <a role="tab" href="#/cadastro" class="${modo === 'cadastro' ? 'on' : ''}">Criar conta grátis</a>
    </div>
    ${modo === 'entrar' ? `
    <form id="f-login" novalidate>
      <label>E-mail<input name="email" type="email" autocomplete="email" required inputmode="email"></label>
      <label>Senha<input name="senha" type="password" autocomplete="current-password" required minlength="8"></label>
      <button class="btn primary block" type="submit">Entrar</button>
      <p class="center"><a href="#/recuperar">Esqueci minha senha</a></p>
    </form>` : modo === 'recuperar' ? `
    <form id="f-rec" novalidate>
      <p class="muted">Enviaremos um link para você criar uma nova senha.</p>
      <label>E-mail<input name="email" type="email" autocomplete="email" required></label>
      <button class="btn primary block" type="submit">Enviar link</button>
      <p class="center"><a href="#/entrar">Voltar</a></p>
    </form>` : `
    <form id="f-cad" novalidate>
      <fieldset class="perfil-pick">
        <legend>Você é…</legend>
        <label class="pick"><input type="radio" name="perfil" value="pm" checked><span>🚔 Policial militar</span></label>
        <label class="pick"><input type="radio" name="perfil" value="geral"><span>👤 Outra pessoa</span></label>
      </fieldset>
      <label>Nome completo<input name="nome" autocomplete="name" required maxlength="120"></label>
      <div class="pm-only grid2">
        <label>Nome de guerra<input name="nomeGuerra" maxlength="40"></label>
        <label>Posto/graduação<input name="posto" maxlength="40" placeholder="Ex.: Sd, Cb, 3º Sgt"></label>
        <label>Batalhão / unidade<input name="unidade" maxlength="60" placeholder="Ex.: 12º BPM"></label>
      </div>
      <label>Estado (UF)<select name="uf">${UFS.map((u) => `<option>${u}</option>`).join('')}</select></label>
      <label>E-mail<input name="email" type="email" autocomplete="email" required></label>
      <label>Senha <small>(mín. 8 caracteres, com letras e números)</small><input name="senha" type="password" autocomplete="new-password" required minlength="8"></label>
      <label class="check"><input type="checkbox" name="aceite" required> Li e aceito os <a href="termos.html" target="_blank">Termos de uso</a> e a <a href="privacidade.html" target="_blank">Política de privacidade</a>.</label>
      <button class="btn primary block" type="submit">Criar conta grátis</button>
      <p class="muted center small">Grátis até ${p.limiteGratis} audiências. Premium por R$ ${p.preco} — ${p.dias >= 365 ? '1 ano' : p.dias + ' dias'} de acesso.</p>
    </form>`}
  </section>`;

  const busy = (f, on) => { const b = $('button[type=submit]', f); b.disabled = on; b.classList.toggle('loading', on); };
  const fl = $('#f-login'), fr = $('#f-rec'), fc = $('#f-cad');
  if (fl) fl.onsubmit = async (e) => {
    e.preventDefault(); const d = new FormData(fl); busy(fl, true);
    try { await S.store.signIn(d.get('email'), d.get('senha')); location.hash = '#/'; } catch (er) { toast(authMessage(er), 'err'); } finally { busy(fl, false); }
  };
  if (fr) fr.onsubmit = async (e) => {
    e.preventDefault(); busy(fr, true);
    try { await S.store.resetPassword(new FormData(fr).get('email')); } catch { /* não revela se o e-mail existe */ }
    toast('Se houver uma conta com esse e-mail, o link foi enviado.'); busy(fr, false);
  };
  if (fc) {
    const sync = () => $$('.pm-only', fc).forEach((x) => { x.hidden = fc.perfil.value !== 'pm'; });
    $$('input[name=perfil]', fc).forEach((r) => { r.onchange = sync; }); sync();
    fc.onsubmit = async (e) => {
      e.preventDefault(); const d = Object.fromEntries(new FormData(fc));
      if (!d.nome.trim()) return toast('Informe seu nome.', 'err');
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.email)) return toast('E-mail inválido.', 'err');
      if (d.senha.length < 8 || !/[A-Za-z]/.test(d.senha) || !/\d/.test(d.senha)) return toast('Senha fraca: mín. 8 caracteres, com letras e números.', 'err');
      if (!d.aceite) return toast('É preciso aceitar os termos.', 'err');
      const perfil = { perfil: d.perfil, nome: d.nome.trim(), uf: d.uf, nomeGuerra: (d.nomeGuerra || '').trim(), posto: (d.posto || '').trim(), unidade: (d.unidade || '').trim(), lembretes: LEMBRETES_PADRAO, aceiteEm: new Date().toISOString() };
      busy(fc, true);
      try { await S.store.signUp(d.email, d.senha, perfil); location.hash = '#/'; toast('Conta criada! Confira seu e-mail para confirmar.'); }
      catch (er) { toast(authMessage(er), 'err'); } finally { busy(fc, false); }
    };
  }
}

/* ================= helpers de audiência ================= */
const futuras = () => S.aud.filter((a) => a.status === 'agendada' && when(a) > new Date(Date.now() - 3 * 36e5)).sort((a, b) => when(a) - when(b));
const passadas = () => S.aud.filter((a) => !futuras().includes(a)).sort((a, b) => when(b) - when(a));
const limiteAtingido = () => !premium() && futuras().length >= S.site.premium.limiteGratis;

function audCard(a) {
  const d = when(a);
  return `<a class="aud" href="#/ver/${esc(a.id)}">
    <div class="aud-date"><b>${d.getDate()}</b><span>${d.toLocaleDateString('pt-BR', { month: 'short' })}</span></div>
    <div class="aud-body">
      <strong>${esc(a.titulo || 'Audiência')}</strong>
      <span>${esc(fmtHora(d))} · ${esc(a.modalidade === 'virtual' ? 'Virtual' : (a.local || a.vara || 'Local a definir'))}</span>
      <span class="tags"><em>${esc(a.papel || '')}</em>${a.status !== 'agendada' ? `<em class="st-${esc(a.status)}">${esc(STATUS[a.status])}</em>` : `<em class="cd">${esc(countdown(d))}</em>`}</span>
    </div></a>`;
}

/* ================= telas ================= */
function vInicio() {
  const f = futuras(), prox = f[0], p = S.perfil;
  const saud = p.perfil === 'pm' && (p.posto || p.nomeGuerra) ? `${esc(p.posto || '')} ${esc(p.nomeGuerra || p.nome.split(' ')[0])}` : esc((p.nome || '').split(' ')[0]);
  const notif = ('Notification' in window) && Notification.permission !== 'granted';
  return `
  ${adHtml(S.site, 'topo', premium())}
  <h1 class="hello">Olá, ${saud} 👋</h1>
  ${S.user.emailVerified === false ? `<div class="notice warn">Confirme seu e-mail para proteger sua conta. <button class="link" data-act="reenviar">Reenviar e-mail</button></div>` : ''}
  ${notif ? `<div class="notice"><span>🔔 Ative as notificações para receber os lembretes neste aparelho.</span> <button class="btn small" data-act="notif">Ativar</button></div>` : ''}
  ${prox ? `
  <section class="next card">
    <p class="eyebrow">Próxima audiência</p>
    <h2>${esc(prox.titulo || 'Audiência')}</h2>
    <p class="big-cd">${esc(countdown(when(prox)))}</p>
    <p>${esc(fmtData(when(prox)))} às <b>${esc(fmtHora(when(prox)))}</b></p>
    <p class="muted">${esc(prox.papel || '')}${prox.tipo ? ' · ' + esc(prox.tipo) : ''}</p>
    <div class="row"><a class="btn primary" href="#/ver/${esc(prox.id)}">Ver detalhes</a>
    ${prox.modalidade === 'virtual' && safeUrl(prox.link) ? `<a class="btn" href="${esc(safeUrl(prox.link))}" target="_blank" rel="noopener">Entrar na sala</a>` : prox.local ? `<a class="btn" href="${esc(mapsUrl(prox.local))}" target="_blank" rel="noopener">Como chegar</a>` : ''}</div>
  </section>` : `
  <section class="card empty">
    <h2>Nenhuma audiência agendada</h2>
    <p class="muted">Recebeu uma intimação? Cadastre em menos de 1 minuto.</p>
  </section>`}
  ${adHtml(S.site, 'destaque', premium())}
  <a class="btn primary block big" href="#/nova">＋ Nova audiência</a>
  ${f.length > 1 ? `<h3 class="sec">Em seguida</h3><div class="list">${f.slice(1, 4).map(audCard).join('')}</div>` : ''}
  ${!premium() ? `<a class="card upsell" href="#/premium"><b>⭐ Premium por R$ ${esc(S.site.premium.preco)}</b><span>Audiências ilimitadas, busca do seu nome em diários oficiais e sem anúncios.</span></a>` : ''}
  ${S.admin ? `<p class="center"><a class="btn small" href="admin.html">⚙️ Painel administrativo</a></p>` : ''}`;
}

function vLista() {
  const f = futuras(), ps = passadas();
  const meio = Math.min(2, f.length);
  return `
  <div class="head-row"><h1>Minhas audiências</h1><a class="btn primary small" href="#/nova">＋ Nova</a></div>
  <div class="row wrap">
    <button class="btn small" data-act="ics-all">📅 Exportar para a agenda${premium() ? '' : ' ⭐'}</button>
  </div>
  <h3 class="sec">Agendadas (${f.length})</h3>
  <div class="list">${f.length ? f.slice(0, meio).map(audCard).join('') + adHtml(S.site, 'lista', premium()) + f.slice(meio).map(audCard).join('') : '<p class="muted">Nenhuma.</p>'}</div>
  <h3 class="sec">Histórico (${ps.length})</h3>
  <div class="list">${ps.length ? ps.map(audCard).join('') : '<p class="muted">Nada por aqui ainda.</p>'}</div>`;
}

function vForm(id) {
  const a = id ? S.aud.find((x) => x.id === id) : null;
  if (id && !a) return '<p>Audiência não encontrada.</p>';
  if (!a && limiteAtingido()) {
    return `<section class="card center"><h1>Limite do plano grátis</h1>
      <p>Você já tem ${futuras().length} audiências agendadas. O plano grátis permite ${esc(S.site.premium.limiteGratis)}.</p>
      <a class="btn primary" href="#/premium">⭐ Liberar ilimitado por R$ ${esc(S.site.premium.preco)}</a></section>`;
  }
  const v = a || { status: 'agendada', modalidade: 'presencial', papel: S.perfil.perfil === 'pm' ? 'Testemunha' : '', tipo: S.perfil.perfil === 'pm' ? 'Criminal' : '' };
  const opt = (arr, cur) => arr.map((o) => `<option ${o === cur ? 'selected' : ''}>${esc(o)}</option>`).join('');
  return `
  <h1>${a ? 'Editar audiência' : 'Nova audiência'}</h1>
  <form id="f-aud" class="card" novalidate>
    <label>Do que se trata? <small>(resumo para você lembrar)</small>
      <input name="titulo" required maxlength="120" value="${esc(v.titulo)}" placeholder="Ex.: Testemunha — roubo na Av. Brasil (BO 1234/2026)"></label>
    <div class="grid2">
      <label>Data<input name="data" type="date" required value="${esc(v.data)}"></label>
      <label>Hora<input name="hora" type="time" required value="${esc(v.hora)}"></label>
    </div>
    <div class="grid2">
      <label>Seu papel<select name="papel">${opt(PAPEIS, v.papel)}</select></label>
      <label>Tipo<select name="tipo">${opt(TIPOS, v.tipo)}</select></label>
    </div>
    <label>Nº do processo <small>(padrão CNJ, opcional)</small>
      <input name="processo" inputmode="numeric" maxlength="25" value="${esc(v.processo)}" placeholder="0000000-00.0000.0.00.0000"><small id="cnj-msg" class="hint"></small></label>
    <label>Vara / juízo<input name="vara" maxlength="120" value="${esc(v.vara)}" placeholder="Ex.: 2ª Vara Criminal de Campinas"></label>
    <fieldset class="seg"><legend>Modalidade</legend>
      <label><input type="radio" name="modalidade" value="presencial" ${v.modalidade !== 'virtual' ? 'checked' : ''}><span>Presencial</span></label>
      <label><input type="radio" name="modalidade" value="virtual" ${v.modalidade === 'virtual' ? 'checked' : ''}><span>Virtual</span></label>
    </fieldset>
    <label class="m-pres">Endereço do fórum<input name="local" maxlength="200" value="${esc(v.local)}" placeholder="Rua, número, cidade"></label>
    <label class="m-virt">Link da sala virtual<input name="link" type="url" maxlength="500" value="${esc(v.link)}" placeholder="https://"></label>
    <label>Observações<textarea name="obs" rows="3" maxlength="1000" placeholder="Levar documento, farda, nº do BO, nome do réu…">${esc(v.obs)}</textarea></label>
    ${a ? `<label>Situação<select name="status">${Object.entries(STATUS).map(([k, t]) => `<option value="${k}" ${k === v.status ? 'selected' : ''}>${t}</option>`).join('')}</select></label>` : ''}
    <div class="row"><button class="btn primary" type="submit">Salvar</button><a class="btn" href="${a ? '#/ver/' + esc(a.id) : '#/'}">Cancelar</a></div>
  </form>`;
}

function vVer(id) {
  const a = S.aud.find((x) => x.id === id);
  if (!a) return '<p>Audiência não encontrada. <a href="#/audiencias">Voltar</a></p>';
  const d = when(a), link = safeUrl(a.link);
  const row = (k, v) => v ? `<div class="kv"><dt>${k}</dt><dd>${v}</dd></div>` : '';
  return `
  <a href="#/audiencias" class="back">← Minhas audiências</a>
  <section class="card">
    <p class="eyebrow">${esc(STATUS[a.status])} · ${esc(countdown(d))}</p>
    <h1>${esc(a.titulo || 'Audiência')}</h1>
    <h3 class="sec">Do que se trata</h3>
    <dl>
      ${row('Quando', esc(fmtData(d)) + ' às <b>' + esc(fmtHora(d)) + '</b>')}
      ${row('Seu papel', esc(a.papel))}
      ${row('Tipo', esc(a.tipo))}
      ${row('Processo', a.processo ? esc(a.processo) + (validCNJ(a.processo) ? '' : ' <small class="warn-t">(conferir número)</small>') : '')}
      ${row('Vara / juízo', esc(a.vara))}
      ${row('Modalidade', a.modalidade === 'virtual' ? 'Virtual (online)' : 'Presencial')}
      ${row('Local', esc(a.local))}
      ${row('Observações', esc(a.obs).replace(/\n/g, '<br>'))}
    </dl>
    <div class="row wrap">
      ${a.modalidade === 'virtual' && link ? `<a class="btn primary" href="${esc(link)}" target="_blank" rel="noopener">🎥 Entrar na sala virtual</a>` : ''}
      ${a.local ? `<a class="btn" href="${esc(mapsUrl(a.local))}" target="_blank" rel="noopener">📍 Google Maps</a><a class="btn" href="${esc(wazeUrl(a.local))}" target="_blank" rel="noopener">🚗 Waze</a>` : ''}
      <a class="btn" href="${esc(googleAgendaUrl(a))}" target="_blank" rel="noopener">📅 Google Agenda</a>
      <button class="btn" data-act="ics" data-id="${esc(a.id)}">📲 Agenda do celular (.ics)</button>
      ${a.processo ? `<button class="btn" data-act="copy" data-v="${esc(a.processo)}">📋 Copiar nº do processo</button>` : ''}
    </div>
  </section>
  <div class="row"><a class="btn" href="#/editar/${esc(a.id)}">✏️ Editar</a><button class="btn danger" data-act="del" data-id="${esc(a.id)}">Excluir</button></div>`;
}

function vBuscar() {
  const p = S.perfil;
  const nomes = [p.nome, p.nomeGuerra && p.nomeGuerra !== p.nome ? p.nomeGuerra : ''].filter(Boolean);
  const links = (n) => `
    <a class="btn small" href="https://comunica.pje.jus.br/consulta?nomeParte=${encodeURIComponent(n)}" target="_blank" rel="noopener">Comunicações processuais (CNJ)</a>
    <a class="btn small" href="https://queridodiario.ok.org.br/pesquisa?term=${encodeURIComponent('"' + n + '"')}" target="_blank" rel="noopener">Querido Diário (diários municipais)</a>
    <a class="btn small" href="https://www.jusbrasil.com.br/diarios/busca?q=${encodeURIComponent('"' + n + '"')}" target="_blank" rel="noopener">Diários oficiais (Jusbrasil)</a>`;
  return `
  <h1>Buscar meu nome</h1>
  <p class="muted">Procura seu nome em fontes <b>públicas e gratuitas</b>: comunicações processuais do CNJ (intimações publicadas pelos tribunais) e diários oficiais. Ao achar algo, cadastre a audiência com um toque.</p>
  ${premium() ? `
  <form id="f-busca" class="card">
    <label>Nome a procurar<select name="nome">${nomes.map((n) => `<option>${esc(n)}</option>`).join('')}</select></label>
    <label>Período<select name="dias"><option value="30">Últimos 30 dias</option><option value="90">Últimos 90 dias</option><option value="7">Últimos 7 dias</option></select></label>
    <button class="btn primary" type="submit">🔎 Buscar agora</button>
  </form>
  <div id="res"></div>` : `
  <section class="card center"><p>🔒 A busca automática faz parte do <b>Premium</b>.</p><a class="btn primary" href="#/premium">Assinar por R$ ${esc(S.site.premium.preco)}</a>
  <p class="muted small">Enquanto isso, você pode consultar manualmente:</p><div class="row wrap center">${links(nomes[0] || '')}</div></section>`}
  <p class="muted small">Atenção: homônimos são comuns — confira sempre o número do processo e o órgão. Este serviço não substitui a intimação oficial.</p>`;
}

async function buscar(nome, dias) {
  const res = $('#res'); res.innerHTML = '<p class="muted">Buscando…</p>';
  const ini = new Date(Date.now() - dias * 864e5).toISOString().slice(0, 10);
  const blocos = [];
  const fontes = [
    ['Comunicações processuais (CNJ / DJEN)', `https://comunicaapi.pje.jus.br/api/v1/comunicacao?nomeParte=${encodeURIComponent(nome)}&dataDisponibilizacaoInicio=${ini}&itensPorPagina=20&pagina=1`,
      (j) => (j.items || j.content || []).map((x) => ({ titulo: `${x.siglaTribunal || ''} · ${x.nomeOrgao || ''}`, data: x.data_disponibilizacao || x.dataDisponibilizacao, proc: x.numeroprocessocommascara || x.numero_processo || '', texto: String(x.texto || '').replace(/<[^>]+>/g, ' ').slice(0, 400), link: x.link })),
      `https://comunica.pje.jus.br/consulta?nomeParte=${encodeURIComponent(nome)}`],
    ['Diários oficiais municipais (Querido Diário)', `https://api.queridodiario.ok.org.br/gazettes?querystring=${encodeURIComponent('"' + nome + '"')}&published_since=${ini}&size=10`,
      (j) => (j.gazettes || []).map((g) => ({ titulo: `${g.territory_name || ''} - ${g.state_code || ''}`, data: g.date, proc: '', texto: (g.excerpts || []).join(' … ').slice(0, 400), link: g.url })),
      `https://queridodiario.ok.org.br/pesquisa?term=${encodeURIComponent('"' + nome + '"')}`]
  ];
  for (const [nomeFonte, url, map, manual] of fontes) {
    let itens = null;
    try {
      const ctl = new AbortController(); const t = setTimeout(() => ctl.abort(), 15000);
      const r = await fetch(url, { signal: ctl.signal, credentials: 'omit', referrerPolicy: 'no-referrer' }); clearTimeout(t);
      if (r.ok) itens = map(await r.json());
    } catch { itens = null; }
    blocos.push(`<section class="card"><h3>${esc(nomeFonte)}</h3>` + (itens === null
      ? `<p class="muted">Não foi possível consultar automaticamente agora. <a href="${esc(manual)}" target="_blank" rel="noopener">Abrir a consulta oficial ↗</a></p>`
      : !itens.length ? '<p class="muted">Nada encontrado no período. ✅</p>'
      : itens.map((i, k) => `<div class="hit"><b>${esc(i.titulo)}</b> <small>${esc(i.data || '')}</small>${i.proc ? `<div>Processo: ${esc(i.proc)}</div>` : ''}<p>${esc(i.texto)}…</p>
          <div class="row">${safeUrl(i.link) ? `<a class="btn small" href="${esc(safeUrl(i.link))}" target="_blank" rel="noopener">Ver original ↗</a>` : ''}<button class="btn small primary" data-act="from-hit" data-proc="${esc(i.proc)}" data-org="${esc(i.titulo)}" data-k="${k}">＋ Cadastrar audiência</button></div></div>`).join('')) + '</section>');
  }
  res.innerHTML = blocos.join('');
}

function vPremium() {
  const p = S.site.premium, pix = S.site.pix;
  const periodo = p.dias >= 365 ? '1 ano' : `${p.dias} dias`;
  if (premium()) {
    return `<section class="card center"><h1>⭐ Você é Premium</h1><p>Acesso liberado até <b>${esc(new Date(S.perfil.plano.ate).toLocaleDateString('pt-BR'))}</b>.</p>
      <p class="muted">Pode renovar a qualquer momento: o novo período soma ao atual.</p><button class="btn" data-act="pagar">Renovar por R$ ${esc(p.preco)}</button></section><div id="pix-box"></div>`;
  }
  return `
  <section class="card premium">
    <p class="eyebrow">PM Alerta Premium</p>
    <h1>R$ ${esc(p.preco)} <small>por ${periodo}</small></h1>
    <p class="muted">Pagamento único por Pix. Sem renovação automática, sem cartão.</p>
    <ul class="checks">${p.beneficios.map((b) => `<li>${esc(b)}</li>`).join('')}</ul>
    ${pix.chave ? `<button class="btn primary block big" data-act="pagar">Pagar R$ ${esc(p.preco)} com Pix</button>` : '<p class="notice warn">Pagamentos ainda não configurados.</p>'}
  </section>
  <div id="pix-box"></div>
  <div id="meus-pag"></div>`;
}

function pixBox(txid) {
  const p = S.site.premium, pix = S.site.pix;
  const code = pixPayload(pix, p.preco, txid, 'PM Alerta Premium');
  return `<section class="card center">
    <h2>Pague com Pix</h2>
    <p>Valor: <b>R$ ${esc(Number(p.preco).toFixed(2).replace('.', ','))}</b> · Código: <b>${esc(txid)}</b></p>
    <div class="qr">${qrSvg(code)}</div>
    <textarea readonly rows="3" class="mono" id="pix-code">${esc(code)}</textarea>
    <div class="row center wrap"><button class="btn" data-act="copy" data-v="${esc(code)}">📋 Copiar Pix copia e cola</button></div>
    <ol class="steps"><li>Abra o app do seu banco e pague o Pix.</li><li>Volte aqui e toque em <b>Já paguei</b>.</li><li>Liberamos seu Premium após conferir o pagamento (normalmente em poucas horas).</li></ol>
    <button class="btn primary block" data-act="ja-paguei" data-tx="${esc(txid)}">✅ Já paguei</button>
  </section>`;
}

function vApoie() {
  const pix = S.site.pix;
  if (!pix.chave) return '<p>Doações ainda não configuradas.</p>';
  return `<h1>Apoie o PM Alerta 💙</h1>
  <p class="muted">O app é mantido de forma independente. Qualquer valor ajuda a manter os servidores e criar novos recursos.</p>
  <div class="row wrap">${(pix.doacoes || []).map((v) => `<button class="btn" data-act="doar" data-v="${esc(v)}">R$ ${esc(v)}</button>`).join('')}<button class="btn" data-act="doar" data-v="0">Outro valor</button></div>
  <div id="doa-box"></div>`;
}

function vConta() {
  const p = S.perfil, lem = p.lembretes || LEMBRETES_PADRAO;
  return `
  <h1>Minha conta</h1>
  <form id="f-perfil" class="card">
    <label>Nome completo<input name="nome" maxlength="120" value="${esc(p.nome)}" required></label>
    ${p.perfil === 'pm' ? `<div class="grid2"><label>Nome de guerra<input name="nomeGuerra" maxlength="40" value="${esc(p.nomeGuerra)}"></label>
      <label>Posto/graduação<input name="posto" maxlength="40" value="${esc(p.posto)}"></label></div>
      <label>Batalhão / unidade<input name="unidade" maxlength="60" value="${esc(p.unidade)}"></label>` : ''}
    <label>UF<select name="uf">${UFS.map((u) => `<option ${u === p.uf ? 'selected' : ''}>${u}</option>`).join('')}</select></label>
    <fieldset><legend>Lembretes ${premium() ? '' : '<small>(personalizar é Premium ⭐)</small>'}</legend>
      <div class="chips">${LEMBRETE_OPCOES.map(([m, t]) => `<label class="chip"><input type="checkbox" name="lem" value="${m}" ${lem.includes(m) ? 'checked' : ''} ${premium() ? '' : 'disabled'}><span>${t} antes</span></label>`).join('')}</div>
    </fieldset>
    <button class="btn primary" type="submit">Salvar</button>
  </form>
  <section class="card">
    <p>E-mail: <b>${esc(S.user.email)}</b></p>
    <p>Plano: <b>${premium() ? '⭐ Premium até ' + esc(new Date(p.plano.ate).toLocaleDateString('pt-BR')) : 'Grátis'}</b></p>
    <div class="row wrap">
      <button class="btn" data-act="notif">🔔 Testar notificação</button>
      <button class="btn" data-act="export">⬇️ Baixar meus dados (LGPD)</button>
      ${S.site.pix.chave ? '<a class="btn" href="#/apoie">💙 Apoiar com doação</a>' : ''}
      <button class="btn" data-act="sair">Sair</button>
    </div>
  </section>
  <details class="card"><summary>Zona de perigo</summary>
    <p class="muted">Excluir a conta apaga para sempre seu perfil e suas audiências.</p>
    <button class="btn danger" data-act="excluir-conta">Excluir minha conta</button></details>
  <p class="center small"><a href="privacidade.html">Privacidade</a> · <a href="termos.html">Termos</a></p>`;
}

/* ================= eventos ================= */
async function reload() { S.aud = await S.store.listAudiencias(); S.perfil = (await S.store.getProfile()) || {}; }

function bind(r) {
  const fa = $('#f-aud');
  if (fa) {
    const sync = () => { const v = fa.modalidade.value === 'virtual'; $('.m-virt', fa).hidden = !v; };
    $$('input[name=modalidade]', fa).forEach((x) => { x.onchange = sync; }); sync();
    fa.processo.oninput = () => {
      const ok = validCNJ(fa.processo.value), n = fa.processo.value.replace(/\D/g, '').length;
      $('#cnj-msg').textContent = !n ? '' : n < 20 ? `${n}/20 dígitos` : ok ? '✓ número válido' : '⚠ dígito verificador não confere — confira a intimação';
    };
    fa.processo.onblur = () => { fa.processo.value = formatCNJ(fa.processo.value); };
    fa.onsubmit = async (e) => {
      e.preventDefault();
      const d = Object.fromEntries(new FormData(fa));
      if (!d.titulo.trim() || !d.data || !d.hora) return toast('Preencha o resumo, a data e a hora.', 'err');
      if (d.link && !safeUrl(d.link)) return toast('Link da sala inválido (use https://).', 'err');
      const [, id] = route();
      const a = { titulo: d.titulo.trim(), data: d.data, hora: d.hora, papel: d.papel, tipo: d.tipo, processo: formatCNJ(d.processo), vara: d.vara.trim(), modalidade: d.modalidade, local: d.local.trim(), link: d.modalidade === 'virtual' ? safeUrl(d.link) : '', obs: d.obs.trim(), status: d.status || 'agendada' };
      if (r === 'editar') a.id = id;
      const btn = $('button[type=submit]', fa); btn.disabled = true;
      try { const nid = await S.store.saveAudiencia(a); await reload(); toast('Audiência salva ✅'); go('#/ver/' + nid); }
      catch (er) { toast(authMessage(er), 'err'); btn.disabled = false; }
    };
    try { const pre = JSON.parse(sessionStorage.getItem('pma-prefill') || 'null'); if (pre && r === 'nova') { fa.processo.value = pre.proc || ''; fa.vara.value = pre.org || ''; fa.titulo.value = 'Intimação encontrada na busca'; sessionStorage.removeItem('pma-prefill'); } } catch { /* ok */ }
  }

  const fp = $('#f-perfil');
  if (fp) fp.onsubmit = async (e) => {
    e.preventDefault();
    const d = Object.fromEntries(new FormData(fp));
    const lem = premium() ? $$('input[name=lem]:checked', fp).map((x) => Number(x.value)) : (S.perfil.lembretes || LEMBRETES_PADRAO);
    await S.store.saveProfile({ ...S.perfil, nome: d.nome.trim(), nomeGuerra: (d.nomeGuerra || '').trim(), posto: (d.posto || '').trim(), unidade: (d.unidade || '').trim(), uf: d.uf, lembretes: lem.length ? lem : LEMBRETES_PADRAO });
    await reload(); toast('Dados salvos ✅');
  };

  const fb = $('#f-busca');
  if (fb) fb.onsubmit = (e) => { e.preventDefault(); buscar(fb.nome.value, Number(fb.dias.value)); };

  if (r === 'premium') loadMeusPagamentos();
}

async function loadMeusPagamentos() {
  const box = $('#meus-pag'); if (!box) return;
  const ps = (await S.store.meusPagamentos()).sort((a, b) => String(b.criadoEm).localeCompare(String(a.criadoEm)));
  if (!ps.length) return;
  const st = { pendente: '⏳ Em análise', aprovado: '✅ Aprovado', recusado: '❌ Não localizado' };
  box.innerHTML = `<section class="card"><h3>Meus pagamentos</h3>${ps.map((p) => `<div class="kv"><dt>${esc(p.txid)}</dt><dd>R$ ${esc(p.valor)} · ${esc(st[p.status] || p.status)}</dd></div>`).join('')}
    ${ps.some((p) => p.status === 'recusado') && S.site.contato.whatsapp ? `<p class="small">Pagou e não foi localizado? <a href="https://wa.me/${esc(S.site.contato.whatsapp.replace(/\D/g, ''))}" target="_blank" rel="noopener">Fale conosco</a> com o comprovante.</p>` : ''}</section>`;
}

app.addEventListener('click', async (e) => {
  const b = e.target.closest('[data-act]'); if (!b) return;
  const act = b.dataset.act;
  if (act === 'notif') return pedirNotificacao(true);
  if (act === 'reenviar') { try { await S.store.resendVerification(); toast('E-mail enviado.'); } catch (er) { toast(authMessage(er), 'err'); } return; }
  if (act === 'copy') { try { await navigator.clipboard.writeText(b.dataset.v); toast('Copiado!'); } catch { const t = $('#pix-code'); if (t) { t.select(); document.execCommand('copy'); toast('Copiado!'); } } return; }
  if (act === 'ics') { const a = S.aud.find((x) => x.id === b.dataset.id); download('audiencia.ics', buildICS([a], S.perfil.lembretes || LEMBRETES_PADRAO), 'text/calendar'); return; }
  if (act === 'ics-all') { if (!premium()) return go('#/premium'); download('minhas-audiencias.ics', buildICS(futuras(), S.perfil.lembretes || LEMBRETES_PADRAO), 'text/calendar'); return; }
  if (act === 'del') { if (!confirm('Excluir esta audiência?')) return; await S.store.removeAudiencia(b.dataset.id); await reload(); toast('Excluída.'); go('#/audiencias'); return; }
  if (act === 'pagar') { const tx = novoTxid(); $('#pix-box').innerHTML = pixBox(tx); $('#pix-box').scrollIntoView({ behavior: 'smooth' }); return; }
  if (act === 'ja-paguei') {
    b.disabled = true;
    try { await S.store.criarPagamento({ txid: b.dataset.tx, valor: Number(S.site.premium.preco), produto: 'premium' }); $('#pix-box').innerHTML = '<section class="card center"><h2>Recebemos seu aviso ✅</h2><p>Assim que o Pix for conferido, seu Premium é liberado automaticamente nesta conta.</p></section>'; loadMeusPagamentos(); }
    catch (er) { toast(authMessage(er), 'err'); b.disabled = false; }
    return;
  }
  if (act === 'doar') {
    let v = Number(b.dataset.v);
    if (!v) { v = Number(String(prompt('Valor da doação (R$):', '10') || '').replace(',', '.')); if (!(v > 0)) return; }
    const code = pixPayload(S.site.pix, v, 'DOACAO', 'Apoio PM Alerta');
    $('#doa-box').innerHTML = `<section class="card center"><p>Doação de <b>R$ ${esc(v.toFixed(2).replace('.', ','))}</b></p><div class="qr">${qrSvg(code)}</div><textarea readonly rows="3" class="mono" id="pix-code">${esc(code)}</textarea><button class="btn" data-act="copy" data-v="${esc(code)}">📋 Copiar Pix</button><p>Obrigado! 💙</p></section>`;
    return;
  }
  if (act === 'from-hit') { try { sessionStorage.setItem('pma-prefill', JSON.stringify({ proc: b.dataset.proc, org: b.dataset.org })); } catch { /* ok */ } go('#/nova'); return; }
  if (act === 'export') { download('meus-dados-pm-alerta.json', JSON.stringify({ email: S.user.email, perfil: S.perfil, audiencias: S.aud, pagamentos: await S.store.meusPagamentos() }, null, 2), 'application/json'); return; }
  if (act === 'sair') { await S.store.signOut(); location.hash = '#/entrar'; return; }
  if (act === 'excluir-conta') {
    if (prompt('Para confirmar, digite EXCLUIR') !== 'EXCLUIR') return;
    try { await S.store.deleteAccount(); toast('Conta excluída.'); location.hash = '#/entrar'; } catch (er) { toast(authMessage(er), 'err'); }
  }
});

/* ================= lembretes / notificações ================= */
async function pedirNotificacao(teste) {
  if (!('Notification' in window)) {
    toast(/iPhone|iPad/.test(navigator.userAgent) ? 'No iPhone: toque em Compartilhar → "Adicionar à Tela de Início" e abra o app por lá.' : 'Este navegador não suporta notificações.', 'err');
    return;
  }
  const p = await Notification.requestPermission();
  if (p !== 'granted') return toast('Notificações bloqueadas. Libere nas configurações do navegador.', 'err');
  if (teste) notify('PM Alerta 🔔', 'Notificações ativadas! Você será lembrado das suas audiências.', 'teste');
  render();
}
async function notify(title, body, tag) {
  try {
    const reg = await navigator.serviceWorker.getRegistration();
    const opts = { body, tag, icon: 'assets/img/icon-192.png', badge: 'assets/img/icon-192.png', data: { url: './#/audiencias' } };
    if (reg) await reg.showNotification(title, opts); else new Notification(title, opts);
  } catch { /* sem suporte */ }
}
function checkReminders() {
  if (!('Notification' in window) || Notification.permission !== 'granted') return;
  let sent = {}; try { sent = JSON.parse(localStorage.getItem('pma-sent') || '{}'); } catch { /* ok */ }
  const now = Date.now(), lem = S.perfil.lembretes || LEMBRETES_PADRAO;
  for (const a of futuras()) {
    const t = when(a).getTime();
    // Só o lembrete mais próximo já vencido, para não disparar vários de uma vez.
    const due = lem.filter((m) => now >= t - m * 6e4 && now < t).sort((x, y) => x - y)[0];
    if (due === undefined) continue;
    const key = `${a.id}:${a.data}T${a.hora}:${due}`;
    if (sent[key]) continue;
    sent[key] = now;
    notify(`⚖️ Audiência ${countdown(new Date(t))}`, `${a.titulo} — ${fmtData(new Date(t))} às ${fmtHora(new Date(t))}${a.local ? ' · ' + a.local : ''}`, key);
  }
  try { localStorage.setItem('pma-sent', JSON.stringify(sent)); } catch { /* ok */ }
}
function startReminders() { clearInterval(S.timer); checkReminders(); S.timer = setInterval(checkReminders, 60000); }
document.addEventListener('visibilitychange', () => { if (!document.hidden && S.user) checkReminders(); });
