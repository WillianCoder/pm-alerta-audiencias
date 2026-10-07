/*
 * Testa firestore.rules no emulador oficial do Firebase.
 * Uso: npx firebase emulators:exec --only firestore --project demo-alerta "node tests/regras.test.mjs"
 * Requer: Java, firebase-tools, @firebase/rules-unit-testing e firebase (npm i -D).
 */
import { initializeTestEnvironment, assertSucceeds, assertFails } from '@firebase/rules-unit-testing';
import { doc, setDoc, getDoc, updateDoc, deleteDoc, collection, getDocs, Timestamp, serverTimestamp } from 'firebase/firestore';
import { readFileSync } from 'node:fs';

const rules = readFileSync(process.env.RULES || new URL('../firestore.rules', import.meta.url), 'utf8');
const env = await initializeTestEnvironment({ projectId: 'demo-alerta', firestore: { rules } });
const p2 = (n) => String(n).padStart(2, '0');
const d = new Date();
const MES = `${d.getUTCFullYear()}-${p2(d.getUTCMonth() + 1)}`, DIA = `${MES}-${p2(d.getUTCDate())}`;
const HOJE = `${d.getUTCFullYear()}${p2(d.getUTCMonth() + 1)}${p2(d.getUTCDate())}`;
let falhas = 0;
async function t(nome, fn) { try { await fn(); console.log('✅ ' + nome); } catch (e) { falhas++; console.log('❌ ' + nome + ' — ' + e.message); } }

const ana = env.authenticatedContext('ana', { email: 'ana@teste.com' }).firestore();
const bia = env.authenticatedContext('bia', { email: 'bia@teste.com' }).firestore();
const adm = env.authenticatedContext('adm', { email: 'adm@teste.com' }).firestore();
const anon = env.unauthenticatedContext().firestore();
const perfil = (email) => ({ nome: 'Ana Souza', uf: 'SP', lembretes: [10080, 1440, 120], aceiteEm: '2026-10-07', email, criadoEm: serverTimestamp() });

await env.withSecurityRulesDisabled(async (c) => {
  const db = c.firestore();
  await setDoc(doc(db, 'admins/adm'), { nome: 'Admin' });
  await setDoc(doc(db, 'users/bia'), { ...perfil('bia@teste.com'), plano: { ate: Timestamp.fromDate(new Date(Date.now() + 30 * 864e5)), origem: 'teste' } });
});

// Perfil
await t('Usuário cria o próprio perfil', () => assertSucceeds(setDoc(doc(ana, 'users/ana'), perfil('ana@teste.com'))));
await t('Usuário NÃO cria perfil já com Premium', () => assertFails(setDoc(doc(bia, 'users/bia2'), { ...perfil('bia@teste.com'), plano: { ate: Timestamp.now() } })));
await t('Usuário NÃO se dá Premium editando o perfil', () => assertFails(setDoc(doc(ana, 'users/ana'), { plano: { ate: Timestamp.fromDate(new Date(2030, 0, 1)) } }, { merge: true })));
await t('Usuário edita nome e "outro nome"', () => assertSucceeds(setDoc(doc(ana, 'users/ana'), { nome: 'Ana S.', outroNome: 'Ana Lima' }, { merge: true })));
await t('Usuário NÃO lê perfil de outra pessoa', () => assertFails(getDoc(doc(ana, 'users/bia'))));
await t('Usuário comum NÃO lista usuários', () => assertFails(getDocs(collection(ana, 'users'))));
await t('Admin lista usuários', () => assertSucceeds(getDocs(collection(adm, 'users'))));

// Audiências
const aud = { titulo: 'Conciliação', data: '2026-11-18', hora: '14:30', fase: 'Conciliação ou mediação', papel: 'Testemunha', tipo: 'Cível', processo: '', vara: '', modalidade: 'presencial', local: '', link: '', obs: '', status: 'agendada', atualizadoEm: serverTimestamp() };
await t('Usuário cria audiência', () => assertSucceeds(setDoc(doc(ana, 'users/ana/audiencias/a1'), aud)));
await t('Audiência com campo desconhecido é recusada', () => assertFails(setDoc(doc(ana, 'users/ana/audiencias/a2'), { ...aud, hack: 1 })));
await t('Outra pessoa NÃO lê a audiência', () => assertFails(getDoc(doc(bia, 'users/ana/audiencias/a1'))));

// Limite de buscas — grátis: 2 por mês
await t('Grátis: 1ª busca do mês', () => assertSucceeds(setDoc(doc(ana, `users/ana/uso/${MES}`), { n: 1 })));
await t('Grátis: 2ª busca do mês', () => assertSucceeds(setDoc(doc(ana, `users/ana/uso/${MES}`), { n: 2 })));
await t('Grátis: 3ª busca do mês é BLOQUEADA', () => assertFails(setDoc(doc(ana, `users/ana/uso/${MES}`), { n: 3 })));
await t('Contador não pode pular números', () => assertFails(setDoc(doc(bia, `users/bia/uso/${MES}`), { n: 5 })));
await t('Contador não pode ser apagado no mês atual', () => assertFails(deleteDoc(doc(ana, `users/ana/uso/${MES}`))));
await t('Contador não pode voltar para trás', () => assertFails(setDoc(doc(ana, `users/ana/uso/${MES}`), { n: 1 })));
await t('Não dá para usar um mês antigo', () => assertFails(setDoc(doc(ana, 'users/ana/uso/2020-01'), { n: 1 })));
await t('Não dá para mexer no contador de outra pessoa', () => assertFails(setDoc(doc(ana, `users/bia/uso/${DIA}`), { n: 1 })));

// Premium: 5 por dia
for (let n = 1; n <= 5; n++) await t(`Premium: busca ${n} do dia`, () => assertSucceeds(setDoc(doc(bia, `users/bia/uso/${DIA}`), { n })));
await t('Premium: 6ª busca do dia é BLOQUEADA', () => assertFails(setDoc(doc(bia, `users/bia/uso/${DIA}`), { n: 6 })));

// Limite editado no painel vale no servidor
await env.withSecurityRulesDisabled((c) => setDoc(doc(c.firestore(), 'config/site'), { limites: { buscasGratisMes: 3, buscasPremiumDia: 5, buscasPremiumMes: 60 } }));
await t('Limite do painel (grátis = 3) é respeitado', () => assertSucceeds(setDoc(doc(ana, `users/ana/uso/${MES}`), { n: 3 })));
await t('…e a 4ª continua bloqueada', () => assertFails(setDoc(doc(ana, `users/ana/uso/${MES}`), { n: 4 })));

// Pagamentos: até 3 avisos por dia, sem sobrescrever
const pag = (n, extra = {}) => ({ txid: 'PMA' + n, valor: 10, produto: 'premium', uid: 'ana', email: 'ana@teste.com', status: 'pendente', criadoEm: serverTimestamp(), ...extra });
for (let n = 1; n <= 3; n++) await t(`Aviso de pagamento ${n} do dia`, () => assertSucceeds(setDoc(doc(ana, `pagamentos/ana-${HOJE}-${n}`), pag(n))));
await t('4º aviso no mesmo dia é BLOQUEADO', () => assertFails(setDoc(doc(ana, `pagamentos/ana-${HOJE}-4`), pag(4))));
await t('Aviso NÃO sobrescreve um existente', () => assertFails(setDoc(doc(ana, `pagamentos/ana-${HOJE}-1`), pag(9))));
await t('Aviso com data errada é bloqueado', () => assertFails(setDoc(doc(bia, 'pagamentos/bia-20200101-1'), { ...pag(1), uid: 'bia', email: 'bia@teste.com' })));
await t('Aviso em nome de outra pessoa é bloqueado', () => assertFails(setDoc(doc(bia, `pagamentos/ana-${HOJE}-1`), pag(1))));
await t('Usuário NÃO cria pagamento já aprovado', () => assertFails(setDoc(doc(bia, `pagamentos/bia-${HOJE}-1`), { ...pag(1), uid: 'bia', email: 'bia@teste.com', status: 'aprovado' })));
await t('Usuário NÃO aprova o próprio pagamento', () => assertFails(updateDoc(doc(ana, `pagamentos/ana-${HOJE}-1`), { status: 'aprovado' })));
await t('Admin aprova pagamento', () => assertSucceeds(updateDoc(doc(adm, `pagamentos/ana-${HOJE}-1`), { status: 'aprovado' })));
await t('Admin libera Premium', () => assertSucceeds(setDoc(doc(adm, 'users/ana'), { plano: { ate: Timestamp.fromDate(new Date(Date.now() + 365 * 864e5)), origem: 'x' } }, { merge: true })));

// Configuração pública
await t('Visitante lê a configuração pública', () => assertSucceeds(getDoc(doc(anon, 'config/site'))));
await t('Usuário comum NÃO altera a configuração', () => assertFails(setDoc(doc(ana, 'config/site'), { aviso: 'hack' })));
await t('Admin altera a configuração', () => assertSucceeds(setDoc(doc(adm, 'config/site'), { aviso: 'ok', limites: { buscasGratisMes: 2, buscasPremiumDia: 5, buscasPremiumMes: 60 } })));
await t('Ninguém se torna admin pelo app', () => assertFails(setDoc(doc(ana, 'admins/ana'), { nome: 'eu' })));

await env.cleanup();
console.log(falhas ? `\n${falhas} falha(s)` : '\nTodas as regras se comportaram como esperado.');
process.exit(falhas ? 1 : 0);
