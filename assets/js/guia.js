/*
 * Alerta Audiência — script leve das páginas estáticas (Guia, Sobre).
 * Não carrega o Firebase: lê a configuração pública (config/site) pela API REST do Firestore
 * só para mostrar anúncios e o contato. Sem login, sem cookies próprios.
 */
import { mergeSite } from './store.js';
import { adHtml, fillAds } from './ads.js';
import { esc } from './util.js';

// Converte o formato da API REST do Firestore ({stringValue: …}) para objeto comum.
function val(v) {
  if (!v) return null;
  if ('stringValue' in v) return v.stringValue;
  if ('integerValue' in v) return Number(v.integerValue);
  if ('doubleValue' in v) return v.doubleValue;
  if ('booleanValue' in v) return v.booleanValue;
  if ('nullValue' in v) return null;
  if ('timestampValue' in v) return v.timestampValue;
  if ('arrayValue' in v) return (v.arrayValue.values || []).map(val);
  if ('mapValue' in v) return obj(v.mapValue.fields || {});
  return null;
}
const obj = (f) => Object.fromEntries(Object.entries(f).map(([k, v]) => [k, val(v)]));

async function lerSite() {
  const C = window.PM_CONFIG || {};
  if (C.firebase && C.firebase.projectId) {
    try {
      const host = C.emuladores ? 'http://127.0.0.1:8080' : 'https://firestore.googleapis.com'; // emulador só em testes locais
      const r = await fetch(`${host}/v1/projects/${encodeURIComponent(C.firebase.projectId)}/databases/(default)/documents/config/site?key=${encodeURIComponent(C.firebase.apiKey)}`, { credentials: 'omit' });
      if (r.ok) return mergeSite(obj((await r.json()).fields || {}));
    } catch { /* sem rede */ }
    return mergeSite(null);
  }
  try { return mergeSite((JSON.parse(localStorage.getItem('pma-demo-v1')) || {}).site); } catch { return mergeSite(null); }
}

(async function () {
  const site = await lerSite();
  document.querySelectorAll('[data-ad-pos]').forEach((el) => { el.outerHTML = adHtml(site, el.dataset.adPos, false); });
  fillAds(document.body, site);
  const c = site.contato;
  document.querySelectorAll('[data-contato]').forEach((el) => {
    el.innerHTML = (c.whatsapp ? `<a class="btn primary" href="https://wa.me/${esc(c.whatsapp)}" target="_blank" rel="noopener">💬 WhatsApp</a> ` : '') +
      (c.email ? `<a class="btn" href="mailto:${esc(c.email)}">✉️ ${esc(c.email)}</a>` : '') ||
      '<p class="muted">Use a página de <a href="./#/ajuda">Ajuda</a> do app.</p>';
  });
})();
