# 🚔 Projeto: Anotador de Audiências — PM Alerta

> **Ideia salva para desenvolvimento futuro.** Copie o bloco abaixo e cole no Claude para iniciar o projeto.

---

```text
Quero que você crie do zero um site/app completo chamado "PM Alerta – Anotador de Audiências".

## 🎯 OBJETIVO
Um sistema simples, rápido e seguro para lembrar pessoas das suas audiências judiciais,
com foco ESPECIAL e dedicado aos POLICIAIS MILITARES (que frequentemente são intimados
como testemunhas/condutores em audiências criminais). Qualquer pessoa pode usar, mas a
experiência, linguagem e recursos devem ser pensados primeiro para o PM.

## 📱 PLATAFORMA
- PWA (Progressive Web App) instalável no iOS (Safari → "Adicionar à Tela de Início") e Android (Chrome).
- Mobile-first, funcionando perfeitamente também em navegador desktop.
- Funcionar offline para consultar audiências já salvas (Service Worker + cache).
- Notificações push (Web Push; no iOS 16.4+ via PWA instalado). Fallback: e-mail e/ou Telegram/WhatsApp link.

## ✅ FUNCIONALIDADES PRINCIPAIS
1. Cadastro/login do usuário (nome completo, nome de guerra, matrícula/RE opcional, batalhão/unidade, UF).
2. Perfil "Policial Militar" com campos e alertas dedicados.
3. Cadastro manual de audiência: nº do processo (padrão CNJ), vara/fórum, endereço, data, hora,
   modalidade (presencial/virtual + link), papel (testemunha, condutor, vítima, réu), observações,
   anexo da intimação (foto/PDF).
4. Lembretes automáticos configuráveis: 7 dias, 3 dias, 1 dia, 2 horas antes (personalizável).
5. Tela "Do que se trata": resumo claro da audiência (tipo, classe processual, assunto, partes
   quando públicas, local, como chegar — link Google Maps/Waze, link da sala virtual).
6. 🔎 MONITORAMENTO AUTOMÁTICO EM FONTES PÚBLICAS E GRATUITAS:
   - Buscar periodicamente o nome do usuário (e variações: nome de guerra, matrícula) em:
     • API Pública do DataJud (CNJ) — consulta por número de processo;
     • Diários de Justiça Eletrônicos (DJe / DJEN – Comunicações Processuais do CNJ);
     • Diários Oficiais (via Querido Diário / Open Knowledge Brasil, quando aplicável);
     • Consultas públicas dos Tribunais (TJ estaduais) quando houver acesso aberto.
   - Ao encontrar intimação/menção → criar alerta e sugerir cadastro da audiência com dados pré-preenchidos.
   - Respeitar termos de uso, robots.txt e limites de requisição; usar apenas dados públicos.
7. Calendário (mês/semana/lista) + exportar para Google Agenda / Apple Calendar (.ics).
8. Histórico de audiências realizadas, adiadas, canceladas.
9. Modo escuro, fonte ajustável, interface em português do Brasil.

## 🔐 SEGURANÇA (OBRIGATÓRIO)
- HTTPS obrigatório, HSTS, CSP restritiva, X-Frame-Options, headers de segurança.
- Senhas com Argon2/bcrypt; login com opção de 2FA (TOTP) e/ou login por link mágico/passkey.
- Proteção contra XSS, CSRF, SQL Injection, força bruta (rate limiting + bloqueio temporário).
- Criptografia dos dados sensíveis em repouso (nº de processos, matrícula, anexos).
- Princípio do menor privilégio; cada usuário só acessa os próprios dados (row-level security).
- Conformidade com a LGPD: consentimento explícito, política de privacidade, exportar e excluir conta.
- Dados de PMs tratados com cuidado extra (segurança pessoal): nunca expor endereço/unidade publicamente,
  sem perfis públicos, sem indexação em buscadores.
- Logs de auditoria de acesso e variáveis secretas apenas em variáveis de ambiente.

## ⚡ OTIMIZAÇÃO
- Carregamento < 2s em 4G; Lighthouse ≥ 90 em Performance, Acessibilidade, Boas Práticas, SEO.
- Bundle leve, imagens otimizadas (WebP/AVIF), lazy loading, cache inteligente.
- Acessibilidade (WCAG AA): contraste, botões grandes, leitores de tela.

## 🛠️ STACK SUGERIDA (pode propor melhor, justificando)
- Front: Next.js (ou SvelteKit) + TypeScript + Tailwind, como PWA.
- Back/DB: Supabase (Postgres + Auth + RLS + Storage) ou Firebase — com plano gratuito.
- Notificações: Web Push (VAPID) + Firebase Cloud Messaging; jobs agendados (cron) para buscas e lembretes.
- Deploy: Vercel/Netlify (gratuito) com domínio HTTPS.

## 🎨 DESIGN
- Visual limpo, institucional e confiável (tons azul-marinho/cinza, detalhes em dourado).
- Tela inicial: "Próxima audiência" em destaque com contagem regressiva.
- Ícones claros, poucos cliques, botão grande "+ Nova audiência".

## 📋 ENTREGA ESPERADA
1. Comece apresentando a arquitetura e o plano em etapas (MVP → versão completa).
2. Monte o MVP primeiro: login, cadastro de audiência, lembretes push, calendário, PWA instalável.
3. Depois: monitoramento automático em fontes públicas, 2FA, exportação .ics, painel de histórico.
4. Inclua README com instruções de instalação, variáveis de ambiente e deploy.
5. Escreva testes para as partes críticas (autenticação, permissões, agendamento de lembretes).
6. Avise com clareza qualquer limitação legal/técnica das fontes públicas (ex.: tribunais que não
   permitem consulta automatizada) e proponha alternativas.

Trabalhe na pasta PROJETOS/anotador-audiencias deste repositório.
```

---

📌 *Ideia registrada em 04/10/2026.*
