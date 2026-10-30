/* ==========================================================================
   CONFIGURAÇÃO
   Enquanto "firebase" for null, o site roda em MODO DEMONSTRAÇÃO:
   os votos ficam guardados só no navegador de quem está testando.
   Para valer de verdade, siga o passo a passo do README.md e cole aqui
   o objeto de configuração do seu app web do Firebase.
   ========================================================================== */

window.CONFIG = {
  firebase: null,
  /* Exemplo (troque pelos dados do seu projeto):
  firebase: {
    apiKey: 'AIza...',
    authDomain: 'pinguim-doidim.firebaseapp.com',
    projectId: 'pinguim-doidim',
    appId: '1:000000000000:web:0000000000000000',
  },
  */

  // VOTAÇÃO ABERTA?
  // false = modo "vem aí": o site mostra abertura, clã, membros e troféus,
  //         e no lugar da votação aparece a tela "a votação abre em breve".
  // true  = votação liberada (precisa do Firebase configurado para valer).
  votacaoAberta: false,

  // Quando a votação abre (mostra contagem regressiva no modo "vem aí").
  // Formato 'AAAA-MM-DDTHH:MM:00-03:00' ou null para "em breve".
  aberturaVotacao: null,

  // E-mails que podem abrir a cerimônia de revelação (cerimonia.html)
  admins: ['SEU-EMAIL@gmail.com'],

  // Formas de entrar para votar
  login: { google: true, linkPorEmail: true },

  // Se tiver algo aqui, só esses e-mails conseguem votar. Vazio = qualquer e-mail.
  emailsPermitidos: [],

  // Pode votar em si mesmo?
  votoEmSiMesmo: true,

  // Datas exibidas no site (formato 'AAAA-MM-DDTHH:MM:00-03:00') ou null = "a definir"
  encerramento: null,
  cerimonia: null,

  // Na revelação, mostrar quantos votos cada indicado recebeu depois do ganhador
  mostrarContagemNaRevelacao: true,
};
