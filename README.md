# 🚔 PM Alerta — Anotador de Audiências

> Nunca mais perca uma audiência. Lembretes no celular, "do que se trata" em segundos e busca do seu nome em fontes públicas — feito especialmente para **policiais militares**, aberto para qualquer pessoa.

**Status:** 🟡 Em desenvolvimento · v0.1.0 (MVP pronto para configurar e publicar)

## ✨ O que o app faz
| Grátis | ⭐ Premium (R$ 10 · 1 ano, Pix) |
|---|---|
| Até 3 audiências agendadas | Audiências ilimitadas |
| Lembretes 7 dias, 1 dia e 2 h antes | Lembretes personalizados (14 dias a 30 min) |
| Tela "Do que se trata", Maps/Waze, sala virtual | Busca do nome em comunicações do CNJ e diários oficiais |
| Google Agenda e .ics por audiência | Exportar todas para a agenda do celular com alarmes |
| Com anúncios | Sem anúncios |

Também tem: cadastro por **e-mail e senha** (com confirmação de e-mail e recuperação de senha), perfil de PM (nome de guerra, posto, unidade), validação do nº de processo no padrão CNJ, histórico (realizada/adiada/cancelada), **doações por Pix**, modo escuro automático, funciona offline e instala como app (PWA) no **iPhone e Android**.

## 🛠️ Painel administrativo (`admin.html`)
- 📊 **Visão geral:** usuários, PMs, Premium ativos, receita do mês e total, checklist para lucrar.
- 💰 **Pagamentos:** cada pedido tem um código (ex.: `PMA3K9…`) que vai dentro do Pix. Confira no extrato e clique **Aprovar** → Premium liberado na hora.
- 👥 **Usuários:** busca, dar/ajustar/remover Premium manualmente.
- ⭐ **Preço e Pix:** preço, dias de acesso, limite do grátis, benefícios, chave Pix, valores de doação, WhatsApp/e-mail.
- 📢 **Anúncios:** para cada posição (topo, abaixo da próxima audiência, meio da lista, rodapé) escolha **Desligado / Google AdSense (automático) / Anúncio próprio**. Cadastre patrocinadores (título, texto, link, imagem).
- 📣 **Aviso geral:** recado no topo do app para todos.

## 🧱 Arquitetura
Site estático (HTML/CSS/JS puro, zero dependências npm) + **Firebase** (Auth e Firestore, plano gratuito).
```
index.html          app (rotas por #hash)
admin.html          painel administrativo
assets/js/
  config.js         conexão com o Firebase (única coisa a editar à mão)
  store.js          camada de dados: Firebase ou modo demonstração (localStorage)
  app.js            telas, lembretes, busca, Premium/Pix
  admin.js          painel
  ads.js            AdSense + anúncios próprios por posição
  util.js           escape de HTML, Pix (BR Code), CNJ, .ics
  vendor/qrcode.js  gerador de QR Code (MIT), versionado no repositório
firestore.rules     regras de segurança (a proteção de verdade)
sw.js               offline + clique na notificação
```
Sem Firebase configurado o app roda em **modo demonstração** (dados só no navegador; a 1ª conta criada vira admin) — ótimo para testar.

## 🚀 Colocar no ar (passo a passo)
1. **Firebase** — em [console.firebase.google.com](https://console.firebase.google.com) crie o projeto `pm-alerta`.
   - *Authentication → Sign-in method*: ative **E-mail/senha**. Em *Templates* deixe os e-mails em português.
   - *Firestore Database*: crie em modo produção (região `southamerica-east1`, São Paulo).
   - *Firestore → Regras*: cole o conteúdo de `firestore.rules` e publique.
   - *Configurações do projeto → Seus apps → Web*: copie o objeto de configuração para `assets/js/config.js` (campo `"firebase"`). Essas chaves são públicas por natureza; quem protege os dados são as regras.
2. **Virar administrador** — crie sua conta no app. No console: *Firestore → Iniciar coleção* `admins` → ID do documento = seu **UID** (em *Authentication → Usuários*) → campo `nome` = seu nome. Pronto: o botão **⚙️ Painel administrativo** aparece no app.
3. **Publicar** — GitHub Pages (workflow incluso em `.github/workflows/pages.yml`), Cloudflare Pages ou Firebase Hosting (`firebase deploy`, usa `firebase.json`). Em *Authentication → Settings → Domínios autorizados* adicione seu domínio.
4. **Configurar no painel** — chave Pix, preço, contato; depois AdSense.
5. **Domínio próprio** (ex.: `pmalerta.com.br` no Registro.br, ~R$ 40/ano) — necessário para o AdSense aprovar.

## 💸 Como o app gera renda
1. **Premium R$ 10/ano via Pix** — sem taxa de intermediário.
2. **Google AdSense** — renda automática pelos acessos do plano grátis.
3. **Anúncios próprios** — venda espaço direto (advogados militares, cursos, lojas de equipamento) e receba por Pix.
4. **Doações** — página "Apoie" com QR Code Pix.

## 🗺️ Próximos passos
- [ ] Repositório próprio `pm-alerta-audiencias` (esta pasta já está pronta para ser a raiz dele).
- [ ] **Pix com confirmação automática** (Mercado Pago / Efí / Asaas + Cloud Function de webhook) — elimina a aprovação manual.
- [ ] **Push pelo servidor** (Firebase Cloud Messaging + Cloud Function agendada): lembrete chega mesmo com o app fechado há dias.
- [ ] **Monitoramento diário automático** do nome (job agendado) com alerta por push/e-mail.
- [ ] Login com Google/Apple e 2FA (Firebase Identity Platform).
- [ ] Firebase App Check (reCAPTCHA Enterprise) contra robôs.

## ⚠️ Limitações honestas
- **Lembretes** hoje são disparados pelo app/navegador (com o app aberto ou em segundo plano recente). Para garantia total, o botão **"Agenda do celular (.ics)"** cria alarmes no calendário do aparelho, que tocam sempre. No **iPhone** as notificações exigem iOS 16.4+ e o app instalado pela Tela de Início.
- **Busca de nome:** depende das fontes públicas permitirem consulta pelo navegador; quando não permitem, o app abre a consulta oficial já preenchida. Homônimos são comuns.
- **Pix:** a aprovação é manual pelo painel até integrar um PSP (ver próximos passos).

## 🔐 Segurança
Ver [SECURITY.md](SECURITY.md).

## 📄 Licença
Código sob licença MIT. QR Code: biblioteca de Kazuhiko Arase (MIT).
