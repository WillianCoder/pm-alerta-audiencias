# ⚖️ Alerta Audiência — Anotador de Audiências

> Nunca mais perca uma audiência. Cole a intimação, receba lembretes no celular, saiba do que se trata e o que levar — para qualquer pessoa.

**Status:** 🟡 Em desenvolvimento · v0.2.0 · [Abrir o app](https://williancoder.github.io/pm-alerta-audiencias/) · [Painel](https://williancoder.github.io/pm-alerta-audiencias/admin.html) · [Apresentação em PDF](docs/Apresentacao-Alerta-Audiencia.pdf)

## ✨ O que o app faz
| Grátis | ⭐ Premium (R$ 10 · 1 ano, Pix) |
|---|---|
| Até 3 audiências agendadas | Audiências ilimitadas |
| Lembretes 7 dias, 1 dia e 2 h antes | Lembretes personalizados (14 dias a 30 min) |
| Colar a intimação e preencher sozinho | ← igual |
| "O que acontece nessa audiência" + lista do que levar | ← igual |
| **2 buscas do nome por mês** | **5 buscas por dia** (até 60 por mês) |
| Google Agenda e .ics por audiência | Exportar todas para a agenda com alarmes |
| Com anúncios | Sem anúncios |

Também tem: cadastro por **e-mail e senha** (confirmação de e-mail e recuperação de senha), validação do nº de processo no padrão CNJ, histórico (realizada/adiada/cancelada), **doações por Pix**, página de **Ajuda**, **Guia de audiências** com 8 artigos, modo escuro, funciona offline e instala como app (PWA) no **iPhone e Android**.

## 🔒 Limites de uso (justos e conferidos no servidor)
| O quê | Grátis | Premium | Onde é garantido |
|---|---|---|---|
| Audiências agendadas | 3 | ilimitado | app |
| Buscas do nome | 2 por mês | 5 por dia, 60 por mês | **regras do Firestore** (`users/{uid}/uso`) |
| Avisos de "Já paguei" | 3 por dia | 3 por dia | **regras do Firestore** (ID do pagamento) |

Os números das buscas são editados no painel (aba *Planos, limites e Pix*) e as regras leem o mesmo valor. A busca é sempre pelo nome da própria conta (e um "outro nome" opcional).

## 🛠️ Painel administrativo (`admin.html`)
- 📊 **Visão geral:** usuários, Premium ativos, receita do mês e total, anúncios no ar, aviso de anúncios vencendo, checklist para lucrar.
- 💰 **Pagamentos:** cada pedido tem um código (ex.: `PMA3K9…`) que vai dentro do Pix. Confira no extrato e clique **Aprovar** → Premium liberado na hora.
- 👥 **Usuários:** busca, dar/ajustar/remover Premium manualmente.
- ⭐ **Planos, limites e Pix:** preço, dias, limite do grátis, benefícios, **limites de busca**, chave Pix, doações, WhatsApp/e-mail.
- 📢 **Anúncios:** para cada posição (topo, abaixo da próxima audiência, meio da lista, **tela de busca**, **artigos do guia**, rodapé) escolha **Desligado / Google AdSense / Anúncio próprio**. Anúncio próprio com **data de validade** (sai sozinho), botão **+30 dias** para renovar e link com **UTM** para o anunciante medir. Edita os **pacotes da página "Anuncie aqui"**.
- 📣 **Aviso geral:** recado no topo do app para todos.

## 🧱 Arquitetura
Site estático (HTML/CSS/JS puro, zero dependências npm em produção) + **Firebase** (Auth e Firestore, plano gratuito).
```
index.html          app (rotas por #hash: #/nova, #/buscar, #/ajuda, #/anuncie…)
admin.html          painel administrativo
sobre.html          sobre e contato (exigido pelo AdSense)
guia/               Guia de audiências (gerado por scripts/gerar-guia.py)
assets/js/
  config.js         conexão com o Firebase (única coisa a editar à mão)
  store.js          dados: Firebase ou modo demonstração; limites de uso
  app.js            telas, lembretes, busca, Premium/Pix, ajuda, anuncie
  conteudo.js       papéis, áreas, tipos de audiência, lista do que levar, leitura da intimação
  admin.js          painel
  ads.js            AdSense + anúncios próprios (validade, UTM)
  guia.js           script leve das páginas estáticas (anúncios e contato sem o SDK do Firebase)
  util.js           escape de HTML, Pix (BR Code), CNJ, .ics, QR sob demanda
  vendor/qrcode.js  gerador de QR Code (MIT), carregado só ao pagar/doar
firestore.rules     regras de segurança (a proteção de verdade)
sw.js               offline + clique na notificação
tests/              teste de ponta a ponta (iPhone simulado) e teste das regras no emulador
docs/               apresentação em PDF e a página HTML que a gera
```
Sem Firebase configurado o app roda em **modo demonstração** (dados só no navegador; a 1ª conta criada vira admin) — ótimo para testar.

## 🚀 Colocar no ar (passo a passo)
1. **Firebase** — em [console.firebase.google.com](https://console.firebase.google.com) crie o projeto.
   - *Authentication → Sign-in method*: ative **E-mail/senha**. Em *Templates* deixe os e-mails em português.
   - *Firestore Database*: crie em modo produção (região `southamerica-east1`, São Paulo).
   - *Firestore → Regras*: cole o conteúdo de `firestore.rules` e publique.
   - *Configurações do projeto → Seus apps → Web*: copie o objeto de configuração para `assets/js/config.js` (campo `"firebase"`). Essas chaves são públicas por natureza; quem protege os dados são as regras.
2. **Virar administrador** — crie sua conta no app. No console: *Firestore → Iniciar coleção* `admins` → ID do documento = seu **UID** (em *Authentication → Usuários*) → campo `nome` = seu nome.
3. **Publicar** — já é automático: cada push na `main` publica no GitHub Pages. Em *Authentication → Settings → Domínios autorizados* adicione o domínio do site.
4. **Configurar no painel** — chave Pix, preço, contato, pacotes de anúncio; depois AdSense.
5. **Domínio próprio** (ex.: `alertaaudiencia.com.br` no Registro.br, ~R$ 40/ano) — necessário para o AdSense. Depois troque `SITE_URL` em `scripts/gerar-guia.py`, rode o script e atualize o `robots.txt`.

## 💸 Como o app gera renda
1. **Premium R$ 10/ano via Pix** — sem taxa de intermediário.
2. **Google AdSense** — renda automática no plano grátis e no Guia.
3. **Anúncios próprios** — página "Anuncie aqui" com pacotes (R$ 49/semana a R$ 199/mês), recebimento por Pix.
4. **Doações** — página "Apoie" com QR Code Pix.

## 🧪 Testes
```bash
npx http-server -p 8766 -s . &       # servidor local
node tests/e2e.cjs                   # verificações no iPhone simulado (precisa do Playwright)
# regras do Firestore (precisa de Java, firebase-tools e @firebase/rules-unit-testing):
npx firebase emulators:exec --only firestore --project demo-alerta "node tests/regras.test.mjs"
```

## 🗺️ Próximos passos
- [x] Repositório próprio.
- [ ] Domínio próprio e cadastro no AdSense.
- [ ] **Pix com confirmação automática** (Mercado Pago / Efí / Asaas + Cloud Function de webhook).
- [ ] **Push pelo servidor** (Firebase Cloud Messaging + Cloud Function agendada): lembrete chega mesmo com o app fechado há dias.
- [ ] **Monitoramento diário automático** do nome (job agendado) com alerta por push/e-mail.
- [ ] Login com Google/Apple e Firebase App Check.

## ⚠️ Limitações honestas
- **Lembretes** são disparados pelo app/navegador. Para garantia total, o botão **"Agenda do celular (.ics)"** cria alarmes no calendário do aparelho. No **iPhone** as notificações exigem iOS 16.4+ e o app instalado pela Tela de Início.
- **Busca de nome:** depende das fontes públicas permitirem consulta pelo navegador; quando não permitem, o app mostra o link da consulta oficial. Homônimos são comuns.
- **Limite de 3 audiências do plano grátis** é aplicado pelo app (os limites de busca e de pagamento são garantidos pelo servidor).
- **Pix:** a aprovação é manual pelo painel até integrar um intermediador de pagamento.

## 🔐 Segurança
Ver [SECURITY.md](SECURITY.md).

## 📄 Licença
Código sob licença MIT. QR Code: biblioteca de Kazuhiko Arase (MIT).
