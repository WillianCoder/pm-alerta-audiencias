/*
 * PM Alerta — configuração de instalação.
 * Só o que NÃO muda pelo painel fica aqui: a conexão com o Firebase.
 * Preços, Pix, anúncios e textos são editados no Painel do Administrador (admin.html)
 * e ficam salvos no Firestore (documento config/site).
 *
 * Enquanto "firebase" for null o site roda em MODO DEMONSTRAÇÃO: tudo fica salvo
 * apenas neste navegador, útil para testar. Veja o README, seção "Colocar no ar".
 */
window.PM_CONFIG = {
  "firebase": null,
  /* Exemplo (copie do console do Firebase → Configurações do projeto → Seus apps → Web):
  "firebase": {
    "apiKey": "AIza...",
    "authDomain": "pm-alerta.firebaseapp.com",
    "projectId": "pm-alerta",
    "storageBucket": "pm-alerta.appspot.com",
    "messagingSenderId": "000000000000",
    "appId": "1:000000000000:web:0000000000000000"
  },
  */
  "firebaseVersion": "10.12.2"
};
