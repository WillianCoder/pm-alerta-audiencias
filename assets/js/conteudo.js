/*
 * Alerta Audiência — conteúdo para o público em geral:
 * papéis, áreas, tipos de audiência explicados em linguagem simples,
 * lista do que levar e leitura automática do texto da intimação.
 * Informação geral: não substitui a orientação de advogado ou da Defensoria Pública.
 */

export const PAPEIS = ['Autor / quem entrou com a ação', 'Réu / quem está sendo processado', 'Testemunha', 'Vítima', 'Jurado', 'Advogado(a)', 'Perito', 'Acompanhante', 'Outro'];

export const AREAS = ['Cível', 'Juizado Especial Cível (pequenas causas)', 'Família', 'Trabalhista', 'Previdenciária / INSS', 'Consumidor', 'Criminal', 'Juizado Especial Criminal', 'Administrativa', 'Outra'];

// Tipo de audiência → explicação simples do que acontece lá.
export const FASES = {
  'Conciliação ou mediação': 'Encontro para tentar um acordo, com a ajuda de um conciliador ou mediador. Ninguém é obrigado a aceitar acordo; se não houver acordo, o processo continua. Faltar sem justificativa pode trazer multa ou prejuízo ao processo.',
  'Instrução e julgamento': 'O juiz ouve as partes e as testemunhas e analisa as provas. Em alguns casos a decisão (sentença) sai no mesmo dia.',
  'Una (trabalhista)': 'Na Justiça do Trabalho, tudo pode acontecer no mesmo dia: tentativa de acordo, defesa, depoimentos e testemunhas. Leve suas provas e testemunhas.',
  'Inicial (trabalhista)': 'Primeira audiência na Justiça do Trabalho: tentativa de acordo e entrega da defesa da empresa. Se o trabalhador faltar, o processo pode ser arquivado.',
  'Depoimento de testemunha': 'Você vai contar o que viu ou sabe sobre o caso. A testemunha tem o dever de comparecer e de dizer a verdade. Faltar sem justificativa pode levar à condução pela polícia e a multa.',
  'Júri (jurado convocado)': 'Você foi sorteado para ser jurado num julgamento. O comparecimento é obrigatório; a falta sem justificativa pode gerar multa.',
  'Perícia': 'Um perito (médico, engenheiro, contador…) faz uma avaliação para o processo ou para o INSS. Leve todos os laudos, exames e documentos.',
  'Outra': ''
};
export const FASES_LISTA = Object.keys(FASES);

/* ---------- O que levar / como se preparar ---------- */
export function checklist(a) {
  const itens = ['Documento oficial com foto (RG, CNH ou carteira de trabalho)', 'A intimação ou carta que você recebeu', 'Número do processo anotado'];
  const papel = a.papel || '', fase = a.fase || '', area = a.tipo || '';
  if (a.modalidade === 'virtual') {
    itens.push('Testar o link da sala um dia antes', 'Celular ou computador carregado, com câmera e microfone', 'Internet estável e um lugar silencioso e iluminado', 'Entrar na sala 10 minutos antes');
  } else {
    itens.push('Chegar 30 minutos antes (tem fila na entrada do fórum)', 'Roupa adequada: evite bermuda, regata e chinelo', 'Conferir o endereço e a sala/andar');
  }
  if (/Autor|Réu/.test(papel)) itens.push('Falar antes com seu advogado ou com a Defensoria Pública', 'Provas: contratos, comprovantes, prints, fotos, notas fiscais', 'Avisar suas testemunhas da data e hora');
  if (/Trabalhista/.test(area) || /trabalhista/.test(fase)) itens.push('Carteira de trabalho, holerites e extrato do FGTS');
  if (/Perícia/.test(fase) || /INSS/.test(area)) itens.push('Laudos, exames, receitas e atestados (originais e cópias)');
  if (/Testemunha|Jurado|Vítima/.test(papel)) itens.push('Pedir a declaração de comparecimento para apresentar no trabalho');
  return itens;
}

/* ---------- Leitura automática do texto da intimação ---------- */
const MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
const pad = (n) => String(n).padStart(2, '0');

export function lerIntimacao(texto) {
  const t = String(texto || '').replace(/\s+/g, ' ');
  const r = {};
  const hoje = new Date(); hoje.setHours(0, 0, 0, 0);

  const proc = t.match(/\b\d{7}-?\d{2}\.?\d{4}\.?\d\.?\d{2}\.?\d{4}\b/);
  if (proc) r.processo = proc[0];

  // Datas: numéricas (12/11/2026) e por extenso (12 de novembro de 2026). Fica a primeira que ainda não passou.
  const datas = [];
  for (const m of t.matchAll(/\b(\d{1,2})\/(\d{1,2})\/(\d{2,4})\b/g)) {
    const ano = m[3].length === 2 ? 2000 + Number(m[3]) : Number(m[3]);
    datas.push({ i: m.index, d: new Date(ano, Number(m[2]) - 1, Number(m[1])) });
  }
  for (const m of t.matchAll(/\b(\d{1,2})º?\s+de\s+([a-zç]+)\s+de\s+(\d{4})\b/gi)) {
    const mes = MESES.indexOf(m[2].toLowerCase().replace('marco', 'março'));
    if (mes >= 0) datas.push({ i: m.index, d: new Date(Number(m[3]), mes, Number(m[1])) });
  }
  const futura = datas.filter((x) => !isNaN(x.d) && x.d >= hoje).sort((a, b) => a.i - b.i)[0];
  if (futura) r.data = `${futura.d.getFullYear()}-${pad(futura.d.getMonth() + 1)}-${pad(futura.d.getDate())}`;

  // Hora: "às 14h30", "às 9:00", "14 horas", "horário: 13h".
  // (Sem \b antes de "às": em JavaScript o \b não reconhece letras acentuadas.)
  const h = t.match(/(?:^|[\s,(])(?:às|as|hor[áa]rio:?|hora:?)\s*(\d{1,2})\s*(?:h|:|horas?)\s*(\d{2})?/i) || t.match(/\b(\d{1,2})[:h](\d{2})\b/);
  if (h && Number(h[1]) < 24) r.hora = `${pad(h[1])}:${pad(h[2] || '00')}`;

  const link = t.match(/https?:\/\/[^\s<>"')]+/i);
  if (link) { r.link = link[0].replace(/[.,;]+$/, ''); r.modalidade = 'virtual'; }
  else if (/videoconfer|virtual|telepresencial|on-?line|zoom|teams|webex|google meet/i.test(t)) r.modalidade = 'virtual';

  const vara = t.match(/\b(\d{1,3}[ªºa]?\s*Vara[^,.;:\n]{0,60}|Juizado Especial[^,.;:\n]{0,60}|Vara [^,.;:\n]{3,60}|CEJUSC[^,.;:\n]{0,40})/i);
  if (vara) r.vara = vara[0].trim();

  if (/concilia|media[çc][ãa]o|cejusc/i.test(t)) r.fase = 'Conciliação ou mediação';
  else if (/instru[çc][ãa]o/i.test(t)) r.fase = 'Instrução e julgamento';
  else if (/audi[êe]ncia una/i.test(t)) r.fase = 'Una (trabalhista)';
  else if (/per[íi]cia/i.test(t)) r.fase = 'Perícia';
  else if (/j[úu]ri|jurado/i.test(t)) r.fase = 'Júri (jurado convocado)';
  else if (/testemunha/i.test(t)) r.fase = 'Depoimento de testemunha';

  if (/testemunha/i.test(t)) r.papel = 'Testemunha';
  else if (/jurado/i.test(t)) r.papel = 'Jurado';

  if (/trabalh|reclamante|reclamad/i.test(t)) r.tipo = 'Trabalhista';
  else if (/juizado especial c[íi]vel/i.test(t)) r.tipo = 'Juizado Especial Cível (pequenas causas)';
  else if (/juizado especial criminal|jecrim/i.test(t)) r.tipo = 'Juizado Especial Criminal';
  else if (/fam[íi]lia|aliment|guarda|div[óo]rcio/i.test(t)) r.tipo = 'Família';
  else if (/inss|previdenci/i.test(t)) r.tipo = 'Previdenciária / INSS';
  else if (/criminal|penal|crime/i.test(t)) r.tipo = 'Criminal';

  return r;
}
