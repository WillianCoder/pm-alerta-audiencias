# Segurança do PM Alerta

## Como reportar uma falha
**Não abra uma issue pública.** Use "Report a vulnerability" na aba *Security* do repositório ou o e-mail de suporte do app.

## Como o app se protege
| Camada | Proteção |
|---|---|
| Contas | Firebase Authentication: senha nunca passa pelo nosso código nem fica guardada por nós; mínimo de 8 caracteres com letras e números; confirmação de e-mail; bloqueio automático contra força bruta. A recuperação de senha não revela se um e-mail existe. |
| Autorização | **Regras do Firestore** (`firestore.rules`): cada pessoa só lê e grava as próprias audiências; ninguém altera o próprio Premium; pagamento é só "aviso" (pendente) e só administrador aprova; administradores ficam numa coleção que só o console do Firebase edita. Campos e tamanhos são validados no servidor. |
| Injeção de código (XSS) | Todo texto é escapado antes de ir para a tela; links aceitam só `http(s)`; teste automatizado com `<img onerror>`. |
| CSP | Política de conteúdo restrita: só scripts do próprio site, Firebase (gstatic) e AdSense; bloqueia plugins, `<base>` e formulários externos. |
| Clickjacking | `X-Frame-Options: DENY` / `frame-ancestors 'none'` e `frame-guard.js` (vale até no GitHub Pages). |
| Transporte | HTTPS obrigatório, HSTS e `upgrade-insecure-requests`. |
| Privacidade | Sem perfis públicos; painel com `noindex`; `Referrer-Policy` restrita; `Permissions-Policy` desliga câmera, microfone, localização; buscas externas sem cookies nem referer. LGPD: exportar e excluir conta pelo próprio app. |
| Painel | Sem senha no código: login normal + verificação de administrador pelo servidor (regras). Nunca entra no cache offline. |
| Dependências | Nenhum pacote npm em produção; QR Code versionado no repositório. |

## Checklist do responsável
- [ ] 2FA no GitHub, Google/Firebase e Registro.br.
- [ ] Publicar `firestore.rules` antes de divulgar o app.
- [ ] Em *Authentication → Settings*: só os domínios oficiais autorizados; ativar **proteção contra enumeração de e-mail**.
- [ ] Ativar **Firebase App Check** quando o app tiver tráfego.
- [ ] Alertas de orçamento no Google Cloud (evita surpresa de cobrança).
- [ ] Secret scanning, push protection e Dependabot no repositório.
