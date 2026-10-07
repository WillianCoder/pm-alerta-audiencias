/*
 * Alerta Audiência — camada de dados.
 * Mesma interface para dois modos:
 *   - Firebase (produção): Auth por e-mail/senha + Firestore protegido por regras (firestore.rules).
 *   - Demonstração: localStorage, quando config.js não tem Firebase configurado.
 * As regras do Firestore são a segurança de verdade: o navegador nunca é confiável
 * para decidir quem é Premium ou administrador.
 */
export const DEFAULT_SITE = {
  premium: {
    preco: 10,
    dias: 365,
    limiteGratis: 3,
    beneficios: [
      'Audiências ilimitadas',
      'Busca do seu nome em diários oficiais e comunicações da Justiça',
      'Sem anúncios',
      'Exportar todas as audiências para a agenda do celular com alarmes',
      'Lembretes extras personalizados'
    ]
  },
  // Limites de uso por conta (as regras do Firestore conferem os mesmos números no servidor).
  limites: { buscasGratisMes: 2, buscasPremiumDia: 5, buscasPremiumMes: 60 },
  pix: { chave: '', nome: '', cidade: '', doacoes: [5, 10, 20, 50] },
  contato: { email: '', whatsapp: '' },
  // posição -> 'off' | 'adsense' | 'proprio'
  ads: {
    client: '',
    slots: { topo: '', destaque: '', lista: '', busca: '', artigos: '', rodape: '' },
    posicoes: { topo: 'off', destaque: 'off', lista: 'off', busca: 'off', artigos: 'off', rodape: 'off' }
  },
  anuncios: [],
  // Página "Anuncie aqui": pacotes vendidos direto aos anunciantes.
  pacotes: [
    { nome: 'Destaque na tela inicial', preco: 'R$ 49 por semana', desc: 'Seu anúncio logo abaixo da próxima audiência, a área mais vista do app.' },
    { nome: 'Patrocinador da busca', preco: 'R$ 79 por mês', desc: 'Apareça para quem acabou de procurar o próprio nome em processos — público com necessidade imediata.' },
    { nome: 'Rodapé em todas as telas', preco: 'R$ 99 por mês', desc: 'Presença constante em todas as telas do app e nos artigos do guia.' },
    { nome: 'Pacote completo', preco: 'R$ 199 por mês', desc: 'Todas as posições acima. Ideal para escritórios de advocacia, cursos e serviços jurídicos.' }
  ],
  publico: '',
  aviso: ''
};

const POSICOES = ['topo', 'destaque', 'lista', 'busca', 'artigos', 'rodape'];
const MAX_PAGAMENTOS_DIA = 3; // avisos de "Já paguei" por conta, por dia (mesmo número nas regras)
export { POSICOES };

export function mergeSite(raw) {
  const r = raw || {};
  const s = JSON.parse(JSON.stringify(DEFAULT_SITE));
  Object.assign(s.premium, r.premium || {});
  Object.assign(s.pix, r.pix || {});
  Object.assign(s.contato, r.contato || {});
  if (r.ads) {
    s.ads.client = r.ads.client || '';
    Object.assign(s.ads.slots, r.ads.slots || {});
    Object.assign(s.ads.posicoes, r.ads.posicoes || {});
  }
  Object.assign(s.limites, r.limites || {});
  s.anuncios = Array.isArray(r.anuncios) ? r.anuncios : [];
  if (Array.isArray(r.pacotes)) s.pacotes = r.pacotes;
  s.publico = r.publico || '';
  s.aviso = r.aviso || '';
  return s;
}

// Períodos em UTC, iguais aos que as regras do Firestore conferem (request.time).
export function periodos(d = new Date()) {
  const p = (n) => String(n).padStart(2, '0');
  const mes = `${d.getUTCFullYear()}-${p(d.getUTCMonth() + 1)}`;
  return { mes, dia: `${mes}-${p(d.getUTCDate())}`, compacto: `${d.getUTCFullYear()}${p(d.getUTCMonth() + 1)}${p(d.getUTCDate())}` };
}
export function limitesBusca(site, premium) {
  const L = site.limites;
  return premium ? { mes: Number(L.buscasPremiumMes), dia: Number(L.buscasPremiumDia) } : { mes: Number(L.buscasGratisMes), dia: Number(L.buscasGratisMes) };
}
const limiteErr = (code) => { const e = new Error(code); e.code = code; return e; };

export const isPremium = (perfil) => !!(perfil && perfil.plano && perfil.plano.ate && new Date(perfil.plano.ate) > new Date());

const uid = () => (crypto.randomUUID ? crypto.randomUUID() : String(Date.now()) + Math.random().toString(16).slice(2)).replace(/-/g, '').slice(0, 20);

/* =================================================================
   Modo demonstração (localStorage)
   ================================================================= */
function localStore() {
  const K = 'pma-demo-v1';
  const load = () => { try { return JSON.parse(localStorage.getItem(K)) || {}; } catch { return {}; } };
  let db = load();
  db.users = db.users || {}; db.aud = db.aud || {}; db.pag = db.pag || {}; db.site = db.site || null; db.uso = db.uso || {};
  const save = () => { try { localStorage.setItem(K, JSON.stringify(db)); } catch { /* armazenamento cheio ou bloqueado */ } };
  let current = null; try { current = sessionStorage.getItem('pma-demo-user'); } catch { /* sem sessionStorage */ }
  const listeners = new Set();
  const user = () => (current && db.users[current]) ? { uid: current, email: db.users[current].email, emailVerified: true } : null;
  const emit = () => listeners.forEach((cb) => cb(user()));
  // Hash simples só para não guardar a senha em texto puro no modo demonstração.
  const hash = async (s) => {
    const b = await crypto.subtle.digest('SHA-256', new TextEncoder().encode('pma-demo:' + s));
    return Array.from(new Uint8Array(b)).map((x) => x.toString(16).padStart(2, '0')).join('');
  };
  const err = (code) => { const e = new Error(code); e.code = code; throw e; };
  const isAdmin = () => !!(current && db.users[current] && db.users[current].admin);

  return {
    mode: 'demo',
    onAuth(cb) { listeners.add(cb); setTimeout(() => cb(user()), 0); return () => listeners.delete(cb); },
    async signUp(email, senha, perfil) {
      email = email.trim().toLowerCase();
      if (Object.values(db.users).some((u) => u.email === email)) err('auth/email-already-in-use');
      const id = uid();
      const first = Object.keys(db.users).length === 0; // no modo demo, a 1ª conta é administradora
      db.users[id] = { ...perfil, email, senha: await hash(senha), criadoEm: new Date().toISOString(), plano: null, admin: first };
      save(); current = id; try { sessionStorage.setItem('pma-demo-user', id); } catch { /* ok */ } emit();
    },
    async signIn(email, senha) {
      email = email.trim().toLowerCase();
      const h = await hash(senha);
      const id = Object.keys(db.users).find((k) => db.users[k].email === email && db.users[k].senha === h);
      if (!id) err('auth/invalid-credential');
      current = id; try { sessionStorage.setItem('pma-demo-user', id); } catch { /* ok */ } emit();
    },
    async signOut() { current = null; try { sessionStorage.removeItem('pma-demo-user'); } catch { /* ok */ } emit(); },
    async resetPassword() { /* demonstração: nada a enviar */ },
    async resendVerification() { /* demonstração */ },
    async getProfile() { const u = db.users[current]; if (!u) return null; const { senha, ...p } = u; return { ...p }; },
    async saveProfile(p) { const { plano, admin, email, criadoEm, senha, ...safe } = p; Object.assign(db.users[current], safe); save(); },
    async deleteAccount() {
      delete db.users[current];
      Object.keys(db.aud).forEach((k) => { if (db.aud[k].uid === current) delete db.aud[k]; });
      Object.keys(db.pag).forEach((k) => { if (db.pag[k].uid === current) delete db.pag[k]; });
      save(); await this.signOut();
    },
    async listAudiencias() { return Object.entries(db.aud).filter(([, a]) => a.uid === current).map(([id, a]) => ({ ...a, id })); },
    async saveAudiencia(a) { const id = a.id || uid(); const { id: _, ...data } = a; db.aud[id] = { ...data, uid: current, atualizadoEm: new Date().toISOString() }; save(); return id; },
    async removeAudiencia(id) { if (db.aud[id] && db.aud[id].uid === current) { delete db.aud[id]; save(); } },
    async getSite() { return mergeSite(db.site); },
    async criarPagamento(p) {
      const { compacto } = periodos();
      const k = [1, 2, 3].find((n) => !db.pag[`${current}-${compacto}-${n}`]);
      if (!k || k > MAX_PAGAMENTOS_DIA) throw limiteErr('limite/pagamentos');
      const id = `${current}-${compacto}-${k}`;
      db.pag[id] = { ...p, uid: current, email: db.users[current].email, status: 'pendente', criadoEm: new Date().toISOString() }; save(); return id;
    },
    async usoBusca() { const { mes, dia } = periodos(); const u = db.uso[current] || {}; return { mes: u[mes] || 0, dia: u[dia] || 0 }; },
    async registrarBusca(lim) {
      const { mes, dia } = periodos(); const u = db.uso[current] = db.uso[current] || {};
      if ((u[mes] || 0) >= lim.mes) throw limiteErr('limite/mes');
      if ((u[dia] || 0) >= lim.dia) throw limiteErr('limite/dia');
      u[mes] = (u[mes] || 0) + 1; u[dia] = (u[dia] || 0) + 1; save();
      return { mes: u[mes], dia: u[dia] };
    },
    async meusPagamentos() { return Object.entries(db.pag).filter(([, p]) => p.uid === current).map(([id, p]) => ({ ...p, id })); },
    // ----- administração -----
    async isAdmin() { return isAdmin(); },
    async adminListPagamentos() { if (!isAdmin()) err('permission-denied'); return Object.entries(db.pag).map(([id, p]) => ({ ...p, id })); },
    async adminDecidir(id, aprovar, dias) {
      if (!isAdmin()) err('permission-denied');
      const p = db.pag[id]; if (!p) return;
      p.status = aprovar ? 'aprovado' : 'recusado'; p.decididoEm = new Date().toISOString();
      if (aprovar && db.users[p.uid]) {
        const base = isPremium(db.users[p.uid]) ? new Date(db.users[p.uid].plano.ate) : new Date();
        base.setDate(base.getDate() + dias);
        db.users[p.uid].plano = { ate: base.toISOString(), origem: id };
      }
      save();
    },
    async adminListUsers() { if (!isAdmin()) err('permission-denied'); return Object.entries(db.users).map(([id, u]) => { const { senha, ...p } = u; return { ...p, id }; }); },
    async adminSetPremium(userId, dias) {
      if (!isAdmin()) err('permission-denied');
      const u = db.users[userId]; if (!u) return;
      if (dias <= 0) { u.plano = null; } else { const d = new Date(); d.setDate(d.getDate() + dias); u.plano = { ate: d.toISOString(), origem: 'manual' }; }
      save();
    },
    async adminSaveSite(site) { if (!isAdmin()) err('permission-denied'); db.site = site; save(); }
  };
}

/* =================================================================
   Firebase (produção)
   ================================================================= */
async function firebaseStore(cfg, v) {
  const base = `https://www.gstatic.com/firebasejs/${v}/`;
  const [{ initializeApp }, A, F] = await Promise.all([
    import(base + 'firebase-app.js'),
    import(base + 'firebase-auth.js'),
    import(base + 'firebase-firestore.js')
  ]);
  const app = initializeApp(cfg);
  const auth = A.getAuth(app);
  auth.languageCode = 'pt-BR';
  const db = F.getFirestore(app);
  // Só para testes locais: "emuladores": true em config.js usa os emuladores do Firebase.
  if ((window.PM_CONFIG || {}).emuladores) {
    A.connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
    F.connectFirestoreEmulator(db, '127.0.0.1', 8080);
  }
  const me = () => auth.currentUser;
  const meRef = () => F.doc(db, 'users', me().uid);
  const audCol = () => F.collection(db, 'users', me().uid, 'audiencias');
  const toISO = (x) => (x && x.toDate) ? x.toDate().toISOString() : x;
  const norm = (o) => { const r = { ...o }; for (const k of Object.keys(r)) r[k] = toISO(r[k]); if (r.plano) r.plano = { ...r.plano, ate: toISO(r.plano.ate) }; return r; };

  return {
    mode: 'firebase',
    onAuth(cb) { return A.onAuthStateChanged(auth, cb); },
    async signUp(email, senha, perfil) {
      const cred = await A.createUserWithEmailAndPassword(auth, email.trim(), senha);
      await F.setDoc(F.doc(db, 'users', cred.user.uid), { ...perfil, email: cred.user.email, criadoEm: F.serverTimestamp() });
      try { await A.sendEmailVerification(cred.user); } catch { /* reenviado depois pelo usuário */ }
    },
    signIn: (email, senha) => A.signInWithEmailAndPassword(auth, email.trim(), senha),
    signOut: () => A.signOut(auth),
    resetPassword: (email) => A.sendPasswordResetEmail(auth, email.trim()),
    resendVerification: () => A.sendEmailVerification(me()),
    async getProfile() { const s = await F.getDoc(meRef()); return s.exists() ? norm(s.data()) : null; },
    async saveProfile(p) { const { plano, email, criadoEm, ...safe } = p; await F.setDoc(meRef(), safe, { merge: true }); },
    async deleteAccount() {
      const snaps = await F.getDocs(audCol());
      const b = F.writeBatch(db);
      snaps.forEach((d) => b.delete(d.ref));
      b.delete(meRef());
      await b.commit();
      await A.deleteUser(me()); // pode pedir login recente (auth/requires-recent-login)
    },
    async listAudiencias() { const s = await F.getDocs(audCol()); return s.docs.map((d) => ({ ...norm(d.data()), id: d.id })); },
    async saveAudiencia(a) {
      const { id, ...data } = a;
      const ref = id ? F.doc(audCol(), id) : F.doc(audCol());
      await F.setDoc(ref, { ...data, atualizadoEm: F.serverTimestamp() });
      return ref.id;
    },
    removeAudiencia: (id) => F.deleteDoc(F.doc(audCol(), id)),
    async getSite() { try { const s = await F.getDoc(F.doc(db, 'config', 'site')); return mergeSite(s.exists() ? s.data() : null); } catch { return mergeSite(null); } },
    // ID = uid-AAAAMMDD-N (N de 1 a 3): as regras só aceitam 3 avisos por conta por dia e não deixam sobrescrever.
    async criarPagamento(p) {
      const { compacto } = periodos();
      for (let n = 1; n <= MAX_PAGAMENTOS_DIA; n++) {
        const ref = F.doc(db, 'pagamentos', `${me().uid}-${compacto}-${n}`);
        try {
          await F.setDoc(ref, { ...p, uid: me().uid, email: me().email, status: 'pendente', criadoEm: F.serverTimestamp() });
          return ref.id;
        } catch (e) { if (e.code !== 'permission-denied') throw e; } // já existe: tenta o próximo número
      }
      throw limiteErr('limite/pagamentos');
    },
    async usoBusca() {
      const { mes, dia } = periodos();
      const [a, b] = await Promise.all([F.getDoc(F.doc(db, 'users', me().uid, 'uso', mes)), F.getDoc(F.doc(db, 'users', me().uid, 'uso', dia))]);
      return { mes: a.exists() ? a.data().n : 0, dia: b.exists() ? b.data().n : 0 };
    },
    // Conta uma busca no mês e no dia. As regras recusam passar do limite, mesmo que alguém altere o app.
    async registrarBusca(lim) {
      const { mes, dia } = periodos();
      const rm = F.doc(db, 'users', me().uid, 'uso', mes), rd = F.doc(db, 'users', me().uid, 'uso', dia);
      return F.runTransaction(db, async (t) => {
        const [a, b] = [await t.get(rm), await t.get(rd)];
        const nm = (a.exists() ? a.data().n : 0) + 1, nd = (b.exists() ? b.data().n : 0) + 1;
        if (nm > lim.mes) throw limiteErr('limite/mes');
        if (nd > lim.dia) throw limiteErr('limite/dia');
        t.set(rm, { n: nm }); t.set(rd, { n: nd });
        return { mes: nm, dia: nd };
      });
    },
    async meusPagamentos() {
      const q = F.query(F.collection(db, 'pagamentos'), F.where('uid', '==', me().uid));
      const s = await F.getDocs(q); return s.docs.map((d) => ({ ...norm(d.data()), id: d.id }));
    },
    async isAdmin() { if (!me()) return false; try { return (await F.getDoc(F.doc(db, 'admins', me().uid))).exists(); } catch { return false; } },
    async adminListPagamentos() {
      const q = F.query(F.collection(db, 'pagamentos'), F.orderBy('criadoEm', 'desc'), F.limit(300));
      const s = await F.getDocs(q); return s.docs.map((d) => ({ ...norm(d.data()), id: d.id }));
    },
    async adminDecidir(id, aprovar, dias) {
      await F.runTransaction(db, async (t) => {
        const pRef = F.doc(db, 'pagamentos', id);
        const p = (await t.get(pRef)).data();
        if (!p) return;
        if (aprovar) {
          const uRef = F.doc(db, 'users', p.uid);
          const u = (await t.get(uRef)).data() || {};
          const atual = u.plano && u.plano.ate && u.plano.ate.toDate ? u.plano.ate.toDate() : null;
          const d = (atual && atual > new Date()) ? atual : new Date();
          d.setDate(d.getDate() + dias);
          t.set(uRef, { plano: { ate: F.Timestamp.fromDate(d), origem: id } }, { merge: true });
        }
        t.update(pRef, { status: aprovar ? 'aprovado' : 'recusado', decididoEm: F.serverTimestamp(), decididoPor: me().uid });
      });
    },
    async adminListUsers() {
      const q = F.query(F.collection(db, 'users'), F.orderBy('criadoEm', 'desc'), F.limit(500));
      const s = await F.getDocs(q); return s.docs.map((d) => ({ ...norm(d.data()), id: d.id }));
    },
    async adminSetPremium(userId, dias) {
      let plano = null;
      if (dias > 0) { const d = new Date(); d.setDate(d.getDate() + dias); plano = { ate: F.Timestamp.fromDate(d), origem: 'manual' }; }
      await F.setDoc(F.doc(db, 'users', userId), { plano }, { merge: true });
    },
    adminSaveSite: (site) => F.setDoc(F.doc(db, 'config', 'site'), site)
  };
}

export async function createStore() {
  const C = window.PM_CONFIG || {};
  if (C.firebase && C.firebase.apiKey) {
    try { return await firebaseStore(C.firebase, C.firebaseVersion || '10.12.2'); }
    catch (e) { console.error('Falha ao carregar o Firebase; usando modo demonstração.', e); }
  }
  return localStore();
}

export function authMessage(e) {
  const c = (e && e.code) || '';
  const map = {
    'auth/email-already-in-use': 'Este e-mail já tem cadastro. Tente entrar ou recuperar a senha.',
    'auth/invalid-email': 'E-mail inválido.',
    'auth/weak-password': 'Senha fraca: use pelo menos 8 caracteres, com letras e números.',
    'auth/invalid-credential': 'E-mail ou senha incorretos.',
    'auth/wrong-password': 'E-mail ou senha incorretos.',
    'auth/user-not-found': 'E-mail ou senha incorretos.',
    'auth/too-many-requests': 'Muitas tentativas. Aguarde alguns minutos e tente de novo.',
    'auth/network-request-failed': 'Sem conexão com a internet.',
    'auth/requires-recent-login': 'Por segurança, saia e entre de novo antes de excluir a conta.',
    'permission-denied': 'Você não tem permissão para isso.',
    'limite/mes': 'Você atingiu o limite de buscas deste mês.',
    'limite/dia': 'Você atingiu o limite de buscas de hoje. Tente amanhã.',
    'limite/pagamentos': 'Você já enviou 3 avisos de pagamento hoje. Aguarde a conferência ou fale com o suporte.'
  };
  return map[c] || 'Algo deu errado. Tente novamente.';
}
