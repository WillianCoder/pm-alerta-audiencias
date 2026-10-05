/*
 * PM Alerta — anúncios.
 * Cada posição da tela (topo, destaque, lista, rodape) é configurada no painel:
 *   'off'     → nada aparece
 *   'adsense' → bloco automático do Google AdSense (renda automática)
 *   'proprio' → anúncio cadastrado no painel (patrocinador que pagou direto via Pix)
 * Assinantes Premium nunca veem anúncios.
 */
import { esc, safeUrl } from './util.js';

let adsenseLoaded = false;
function loadAdSense(client) {
  if (adsenseLoaded || !/^ca-pub-\d{10,20}$/.test(client)) return;
  adsenseLoaded = true;
  const s = document.createElement('script');
  s.async = true; s.crossOrigin = 'anonymous';
  s.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=' + encodeURIComponent(client);
  document.head.appendChild(s);
}

export const LABELS = {
  topo: 'Topo da tela inicial',
  destaque: 'Abaixo da próxima audiência',
  lista: 'No meio da lista de audiências',
  rodape: 'Rodapé de todas as telas'
};

export function adHtml(site, pos, premium) {
  if (premium || !site) return '';
  const modo = site.ads.posicoes[pos] || 'off';
  if (modo === 'proprio') {
    const ativos = site.anuncios.filter((a) => a.ativo && (a.posicao === pos || a.posicao === 'todas'));
    if (!ativos.length) return '';
    const a = ativos[Math.floor(Math.random() * ativos.length)];
    const link = safeUrl(a.link), img = safeUrl(a.imagem);
    const inner = (img ? `<img src="${esc(img)}" alt="" loading="lazy" decoding="async">` : '') +
      `<div><strong>${esc(a.titulo)}</strong>${a.texto ? `<p>${esc(a.texto)}</p>` : ''}</div>`;
    return `<aside class="ad ad-own" aria-label="Publicidade"><span class="ad-tag">Patrocinado</span>` +
      (link ? `<a href="${esc(link)}" target="_blank" rel="noopener sponsored">${inner}</a>` : inner) + '</aside>';
  }
  if (modo === 'adsense' && site.ads.client && site.ads.slots[pos]) {
    return `<aside class="ad ad-google" aria-label="Publicidade" data-ad-pos="${esc(pos)}"><span class="ad-tag">Publicidade</span>` +
      `<ins class="adsbygoogle" style="display:block" data-ad-client="${esc(site.ads.client)}" data-ad-slot="${esc(site.ads.slots[pos])}" data-ad-format="auto" data-full-width-responsive="true"></ins></aside>`;
  }
  return '';
}

// Ativa os blocos AdSense recém-inseridos na tela.
export function fillAds(root, site) {
  const ins = root.querySelectorAll('ins.adsbygoogle:not([data-adsbygoogle-status])');
  if (!ins.length) return;
  loadAdSense(site.ads.client);
  ins.forEach(() => { try { (window.adsbygoogle = window.adsbygoogle || []).push({}); } catch { /* bloqueador de anúncios */ } });
}
