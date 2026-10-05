/* PM Alerta — utilitários puros (sem acesso a rede ou banco). */

export const $ = (s, r = document) => r.querySelector(s);
export const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

// Todo texto vindo do usuário ou do banco passa por aqui antes de ir para o HTML.
export const esc = (v) => String(v == null ? '' : v)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;').replace(/'/g, '&#39;');

// Só aceita links http(s): bloqueia javascript:, data: etc.
export function safeUrl(u) {
  try { const x = new URL(String(u || '').trim()); return (x.protocol === 'https:' || x.protocol === 'http:') ? x.href : ''; }
  catch { return ''; }
}

export function toast(msg, kind = '') {
  document.querySelectorAll('.toast').forEach((x) => x.remove());
  const t = document.createElement('div');
  t.className = 'toast ' + kind; t.setAttribute('role', 'status'); t.textContent = msg;
  document.body.appendChild(t);
  requestAnimationFrame(() => t.classList.add('show'));
  setTimeout(() => { t.classList.remove('show'); setTimeout(() => t.remove(), 300); }, 3200);
}

/* ---------- datas ---------- */
export const pad = (n) => String(n).padStart(2, '0');
export function when(a) { return new Date(`${a.data}T${a.hora || '00:00'}:00`); }
export const fmtData = (d) => d.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' });
export const fmtHora = (d) => d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
export function countdown(d) {
  const ms = d - new Date();
  if (ms < 0) return 'já passou';
  const dias = Math.floor(ms / 864e5), h = Math.floor(ms / 36e5) % 24, m = Math.floor(ms / 6e4) % 60;
  if (dias > 1) return `faltam ${dias} dias`;
  if (dias === 1) return `amanhã · faltam ${dias * 24 + h}h`;
  if (h > 0) return `hoje · faltam ${h}h ${m}min`;
  return `faltam ${m} min`;
}

/* ---------- número de processo (padrão CNJ, Res. 65/2008) ---------- */
// NNNNNNN-DD.AAAA.J.TR.OOOO — confere os dígitos verificadores (módulo 97).
export function formatCNJ(v) {
  const d = String(v || '').replace(/\D/g, '').slice(0, 20);
  if (d.length !== 20) return String(v || '').trim();
  return `${d.slice(0, 7)}-${d.slice(7, 9)}.${d.slice(9, 13)}.${d.slice(13, 14)}.${d.slice(14, 16)}.${d.slice(16, 20)}`;
}
export function validCNJ(v) {
  const d = String(v || '').replace(/\D/g, '');
  if (d.length !== 20) return false;
  const n = d.slice(0, 7), dv = d.slice(7, 9), resto = d.slice(9);
  const mod = (s) => { let r = 0; for (const c of s) r = (r * 10 + Number(c)) % 97; return r; };
  return 98 - mod(n + resto + '00') === Number(dv);
}

/* ---------- Pix (BR Code estático, padrão do Banco Central) ---------- */
const tlv = (id, v) => id + String(v.length).padStart(2, '0') + v;
export function crc16(str) {
  let crc = 0xffff;
  for (let i = 0; i < str.length; i++) {
    crc ^= str.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) crc = ((crc & 0x8000) ? (crc << 1) ^ 0x1021 : crc << 1) & 0xffff;
  }
  return crc.toString(16).toUpperCase().padStart(4, '0');
}
const ascii = (s) => String(s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^A-Za-z0-9 .\-]/g, '').trim();
export function pixPayload({ chave, nome, cidade }, valor, txid = '***', descricao = '') {
  const conta = tlv('00', 'br.gov.bcb.pix') + tlv('01', String(chave).trim()) + (descricao ? tlv('02', ascii(descricao).slice(0, 40)) : '');
  const tx = String(txid).replace(/[^A-Za-z0-9]/g, '').slice(0, 25) || '***';
  const p = tlv('00', '01') + tlv('26', conta) + tlv('52', '0000') + tlv('53', '986') +
    (valor > 0 ? tlv('54', Number(valor).toFixed(2)) : '') +
    tlv('58', 'BR') + tlv('59', ascii(nome).toUpperCase().slice(0, 25)) + tlv('60', ascii(cidade).toUpperCase().slice(0, 15)) +
    tlv('62', tlv('05', tx)) + '6304';
  return p + crc16(p);
}
export function qrSvg(text) {
  if (typeof window.qrcode !== 'function') return '';
  const q = window.qrcode(0, 'M'); q.addData(text); q.make();
  return q.createSvgTag({ cellSize: 4, margin: 2, scalable: true });
}
export function novoTxid() {
  const a = new Uint8Array(6); crypto.getRandomValues(a);
  return 'PMA' + Array.from(a).map((x) => x.toString(36).padStart(2, '0')).join('').toUpperCase().slice(0, 10);
}

/* ---------- Agenda (.ics com alarmes) ---------- */
const icsEsc = (s) => String(s || '').replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/[,;]/g, (m) => '\\' + m);
const icsDate = (d) => d.getUTCFullYear() + pad(d.getUTCMonth() + 1) + pad(d.getUTCDate()) + 'T' + pad(d.getUTCHours()) + pad(d.getUTCMinutes()) + '00Z';
export function buildICS(lista, lembretesMin = [10080, 1440, 120]) {
  const now = icsDate(new Date());
  const ev = lista.map((a) => {
    const ini = when(a), fim = new Date(ini.getTime() + 2 * 36e5);
    const desc = [a.papel && `Papel: ${a.papel}`, a.processo && `Processo: ${a.processo}`, a.link && `Sala virtual: ${a.link}`, a.obs].filter(Boolean).join('\n');
    const alarms = lembretesMin.map((m) => `BEGIN:VALARM\r\nACTION:DISPLAY\r\nDESCRIPTION:${icsEsc('Audiência: ' + (a.titulo || 'audiência'))}\r\nTRIGGER:-PT${m}M\r\nEND:VALARM`).join('\r\n');
    return `BEGIN:VEVENT\r\nUID:${a.id || Math.random().toString(36).slice(2)}@pm-alerta\r\nDTSTAMP:${now}\r\nDTSTART:${icsDate(ini)}\r\nDTEND:${icsDate(fim)}\r\nSUMMARY:${icsEsc('⚖️ Audiência — ' + (a.titulo || a.vara || ''))}\r\nLOCATION:${icsEsc(a.local || a.vara || '')}\r\nDESCRIPTION:${icsEsc(desc)}\r\n${alarms}\r\nEND:VEVENT`;
  }).join('\r\n');
  return `BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//PM Alerta//Audiencias//PT-BR\r\nCALSCALE:GREGORIAN\r\n${ev}\r\nEND:VCALENDAR\r\n`;
}
export function download(nome, conteudo, tipo) {
  const url = URL.createObjectURL(new Blob([conteudo], { type: tipo }));
  const a = document.createElement('a'); a.href = url; a.download = nome; document.body.appendChild(a); a.click();
  setTimeout(() => { URL.revokeObjectURL(url); a.remove(); }, 500);
}
export function googleAgendaUrl(a) {
  const ini = when(a), fim = new Date(ini.getTime() + 2 * 36e5);
  const f = (d) => icsDate(d);
  const p = new URLSearchParams({ action: 'TEMPLATE', text: 'Audiência — ' + (a.titulo || ''), dates: `${f(ini)}/${f(fim)}`, location: a.local || '', details: [a.processo, a.papel, a.link].filter(Boolean).join(' · ') });
  return 'https://calendar.google.com/calendar/render?' + p.toString();
}
export const mapsUrl = (end) => 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(end);
export const wazeUrl = (end) => 'https://waze.com/ul?navigate=yes&q=' + encodeURIComponent(end);
