/* ==========================================================================
   DADOS DA CERIMÔNIA — edite aqui. Nada de código: só texto entre aspas.
   - membros: ordem de exibição, nick, nome, título, bio, fotos e áudio.
   - categorias: ordem da votação, textos, tipo de voto e opções.
   Fotos: coloque o arquivo em assets/membros/ e troque o caminho.
   Áudios: coloque em midia/audios/ (mp3 toca em qualquer celular).
   Vídeos: midia/videos/arquivo.mp4  ou um link do YouTube.
   ========================================================================== */

window.DADOS = {
  evento: {
    cla: 'Pinguim Doidim',
    titulo: 'Melhores do Ano',
    ano: 2026,
    // Foto oficial do clã (troque quando tiver): 'assets/img/foto-cla.jpg'
    fotoCla: null,
    // Áudio de abertura opcional (toca no botão "Ouvir a abertura")
    audioAbertura: null,
    // Música de fundo da cerimônia (loop). Troque por outro mp3 se quiser, ou null para tirar.
    trilha: 'midia/musica/solenidade.mp3',
    volumeTrilha: 0.35,
  },

  // Prêmio para quem vencer mais categorias
  premioSupremo: {
    nome: 'Pinguim Imperador',
    descricao:
      'A maior honraria do clã. Vai para quem levar mais troféus na apuração final e carrega o título até a próxima cerimônia.',
  },

  /* ------------------------------------------------------------------ */
  /* MEMBROS                                                             */
  /* titulo: frase curta em dourado acima da bio (opcional, '' = sem)    */
  /* recorte: foto sem fundo (PNG) usada nos cartões; se não tiver,      */
  /*          o site usa a foto normal.                                  */
  /* escalaGrupo: ajusta o tamanho na foto montada do clã (opcional)     */
  /* ------------------------------------------------------------------ */
  membros: [
    {
      id: 'cabalistico', nick: 'Cabalístico', nome: 'Bruno',
      titulo: '',
      bio: 'Poliatleta do clã. Sempre foi o piadista do clã, independente se tinha mulher perto ou não.',
      foto: 'assets/membros/cabalistico.jpg', recorte: 'assets/membros/recorte/cabalistico.png', audio: null,
    },
    {
      id: 'robson-cv', nick: 'Robson CV', nome: 'Dyeisson',
      titulo: '',
      bio: 'O cara virou carreteiro só para pegar mulher.',
      foto: 'assets/membros/robson-cv.jpg', recorte: 'assets/membros/recorte/robson-cv.png', audio: null,
    },
    {
      id: 'joaozinho', nick: 'Joãozinho', nome: 'João Vitor Cardoso',
      titulo: '',
      bio: 'O mais feio do clã. E cobra somente R$ 50.',
      foto: 'assets/membros/joaozinho.jpg', recorte: 'assets/membros/recorte/joaozinho.png', audio: null,
    },
    {
      id: 'joilson', nick: 'Joílson', nome: 'Joílson',
      titulo: '',
      bio: 'Saiu do clã para evoluir.',
      foto: 'assets/membros/joilson.jpg', recorte: 'assets/membros/recorte/joilson.png', audio: null, escalaGrupo: 0.8,
    },
    {
      id: 'lucas-pc', nick: 'Lucas PC', nome: 'Lucas',
      titulo: '',
      bio: 'A lenda, o mito, o GOAT, o maior. O cara com mais selos na história das redes sociais.',
      foto: 'assets/membros/lucas-pc.jpg', recorte: 'assets/membros/recorte/lucas-pc.png', audio: null,
    },
    {
      id: 'guguzinho', nick: 'Guguzinho', nome: 'Luiz Gustavo Mores',
      titulo: '',
      bio: 'Está há 5 anos esperando uma resposta no vácuo do Instagram, mas garante para todo mundo que ficou com ela.',
      foto: 'assets/membros/guguzinho.jpg', recorte: 'assets/membros/recorte/guguzinho.png', audio: null, escalaGrupo: 0.72,
    },
    {
      id: 'faxinal', nick: 'Faxinal', nome: 'Nelian',
      titulo: '',
      bio: 'Tem 50 anos, mas age como se tivesse 22.',
      foto: 'assets/membros/faxinal.jpg', recorte: 'assets/membros/recorte/faxinal.png', audio: null,
    },
    {
      id: 'nicolas', nick: 'Nicolas', nome: 'Nicollas Verbaneck',
      titulo: '',
      bio: 'O low profile que mais faz de tudo para pegar mulher. Sofre em silêncio por causa de uma menina que viajou para a Dinamarca.',
      foto: 'assets/membros/nicolas.jpg', recorte: 'assets/membros/recorte/nicolas.png', audio: null,
    },
    {
      id: 'patrick', nick: 'Patrick', nome: 'Patrick',
      titulo: '',
      bio: 'Tá na Santa Maria até hoje tentando pegar menina.',
      foto: 'assets/membros/patrick.jpg', recorte: 'assets/membros/recorte/patrick.png', audio: null,
    },
    {
      id: 'zheus', nick: 'Zheus Rotweeiler', nome: 'Thomas',
      titulo: '',
      bio: 'Expulso de casa por votar no Bolsonaro e recordista em voltar com a ex.',
      foto: 'assets/membros/zheus.jpg', recorte: 'assets/membros/recorte/zheus.png', audio: null,
    },
  ],

  /* ------------------------------------------------------------------ */
  /* CATEGORIAS                                                          */
  /* tipo 'membros' → vota em um membro do clã                           */
  /* tipo 'opcoes'  → vota em uma opção (frase, áudio, vídeo, lance...)  */
  /*   cada opção: { id, titulo, autor (id do membro ou null),           */
  /*                 audio, video, imagem, provisorio }                  */
  /* indicados: lista de ids para limitar os membros (opcional)          */
  /* icone: nome do emblema no troféu (veja js/icones.js)                */
  /* ------------------------------------------------------------------ */
  categorias: [
    {
      id: 'mais-feio', nome: 'Mais Feio do Ano', icone: 'mais-feio', tipo: 'membros',
      texto: 'A beleza é subjetiva. Esta categoria não é. Passe as fotos com calma e vote com a consciência tranquila.',
    },
    {
      id: 'pegar-mulher', nome: 'Faz de Tudo pra Pegar Mulher', icone: 'pegar-mulher', tipo: 'membros',
      texto: 'Esforço, criatividade e nenhum pingo de vergonha. Aqui se premia a dedicação, não o resultado.',
    },
    {
      id: 'frase', nome: 'Frase do Ano', icone: 'frase', tipo: 'opcoes',
      texto: 'A frase que virou bordão, figurinha e trauma coletivo. Escolha a que o clã nunca mais vai esquecer.',
      opcoes: [
        { id: 'f1', titulo: 'Frase indicada número 1', autor: null, provisorio: true },
        { id: 'f2', titulo: 'Frase indicada número 2', autor: null, provisorio: true },
        { id: 'f3', titulo: 'Frase indicada número 3', autor: null, provisorio: true },
      ],
    },
    {
      id: 'ze', nome: 'Zé do Ano', icone: 'ze', tipo: 'membros',
      texto: 'Todo clã tem um Zé. Hoje ele ganha nome, sobrenome e troféu.',
    },
    {
      id: 'boca-de-burro', nome: 'Boca de Burro do Ano', icone: 'boca-de-burro', tipo: 'membros',
      texto: 'Abriu a boca e o clã inteiro se arrependeu de ter ouvido. Mais de uma vez.',
    },
    {
      id: 'morador', nome: 'Tomou de Morador do Ano', icone: 'morador', tipo: 'membros',
      texto: 'Entrou na casa de peito aberto e saiu de caixão. Para quem mais caiu pra quem só estava esperando.',
    },
    {
      id: 'audio', nome: 'Áudio do Ano', icone: 'audio', tipo: 'opcoes',
      texto: 'Os áudios que rodaram o grupo até gastar. Dê o play em cada um antes de escolher.',
      opcoes: [
        { id: 'meu-pneu-murcho', titulo: 'Meu pneu murcho', autor: null, audio: 'midia/audios/meu-pneu-murcho.mp3',
          onda: [0.18,0.26,0.66,0.61,0.69,0.69,0.77,0.74,0.57,0.71,1,0.77,0.39,0.58,0.62,0.5,0.62,0.42,0.37,0.63,0.56,0.47,0.4,0.35,0.56,0.27,0.19,0.24,0.19,0.18,0.46,0.26,0.19,0.51,0.48,0.42,0.47,0.25,0.32,0.37] },
        { id: 'mudinho', titulo: 'Mudinho', autor: null, audio: 'midia/audios/mudinho.mp3',
          onda: [0.06,0.06,0.09,0.56,0.53,0.6,0.36,0.06,0.21,1,0.76,0.55,0.51,0.5,0.51,0.47,0.45,0.44,0.42,0.48,0.49,0.56,0.61,0.76,0.91,0.62,0.06,0.06,0.31,0.61,0.76,0.71,0.37,0.06,0.06,0.39,0.71,0.72,0.55,0.13] },
        { id: 'aii', titulo: 'Aii', autor: null, audio: 'midia/audios/aii.mp3',
          onda: [0.08,0.27,0.15,0.12,0.11,0.1,0.11,0.08,0.12,0.09,0.09,0.37,0.41,0.52,0.49,0.32,0.25,0.44,0.57,1,0.95,0.96,0.82,0.86,0.81,0.72,0.44,0.22,0.43,0.51,0.32,0.22,0.56,0.6,0.46,0.5,0.53,0.34,0.26,0.4] },
        { id: 'ai-que-susto', titulo: 'Ai que susto', autor: null, audio: 'midia/audios/ai-que-susto.mp3',
          onda: [0.07,0.13,0.28,0.38,0.31,0.25,0.21,0.21,0.22,0.2,0.2,0.37,0.17,0.11,0.15,0.81,1,0.5,0.1,0.32,0.21,0.13,0.12,0.16,0.8,0.32,0.7,0.81,0.65,0.88,0.6,0.85,0.92,0.75,0.77,0.82,0.51,0.67,0.93,0.71] },
        { id: 'que-delicia', titulo: 'Que delícia', autor: null, audio: 'midia/audios/que-delicia.mp3',
          onda: [0.06,0.06,0.06,0.06,0.06,0.06,0.4,0.7,1,0.89,0.91,0.97,0.83,0.72,0.78,0.81,0.78,0.79,0.65,0.55,0.6,0.64,0.62,0.49,0.57,0.58,0.41,0.26,0.24,0.3,0.82,0.54,0.5,0.59,0.26,0.18,0.29,0.24,0.32,0.22] },
        { id: 'gigante', titulo: 'Gigante', autor: null, audio: 'midia/audios/gigante.mp3',
          onda: [0.09,0.07,0.08,0.36,0.46,0.37,0.84,0.99,0.93,0.8,0.72,1,0.82,0.3,0.92,0.86,0.91,0.77,0.82,0.7,0.33,0.54,0.44,0.51,0.37,0.17,0.12,0.09,0.07,0.44,0.36,0.61,0.78,0.58,0.56,0.56,0.54,0.59,0.52,0.21] },
      ],
    },
    {
      id: 'selo', nome: 'Selo do Ano', icone: 'selo', tipo: 'membros',
      texto: 'Carimbado, registrado em ata e eternizado. Este ano o selo tem dono.',
    },
    {
      id: 'ex', nome: 'Voltou com a Ex do Ano', icone: 'ex', tipo: 'membros',
      texto: 'Jurou que tinha acabado de vez. O clã guardou os prints.',
    },
    {
      id: 'tiltada', nome: 'Tiltada do Ano', icone: 'tiltada', tipo: 'membros',
      texto: 'Controle arremessado, microfone estourado e dignidade perdida no meio da partida.',
    },
    {
      id: 'fake-news', nome: 'Fake News do Ano', icone: 'fake-news', tipo: 'opcoes',
      texto: 'A notícia que o clã inteiro acreditou por pelo menos cinco minutos.',
      opcoes: [
        { id: 'fn1', titulo: 'Fake news indicada número 1', autor: null, provisorio: true },
        { id: 'fn2', titulo: 'Fake news indicada número 2', autor: null, provisorio: true },
        { id: 'fn3', titulo: 'Fake news indicada número 3', autor: null, provisorio: true },
      ],
    },
    {
      id: 'evolucao', nome: 'Evolução do Ano', icone: 'evolucao', tipo: 'membros',
      texto: 'Quem mais subiu de patamar em 2026, dentro e fora do jogo.',
    },
    {
      id: 'xingamento', nome: 'Xingamento do Ano', icone: 'xingamento', tipo: 'opcoes',
      texto: 'O palavrão mais criativo, mais injusto ou mais bem colocado do ano.',
      opcoes: [
        { id: 'x1', titulo: 'Xingamento indicado número 1', autor: null, provisorio: true },
        { id: 'x2', titulo: 'Xingamento indicado número 2', autor: null, provisorio: true },
        { id: 'x3', titulo: 'Xingamento indicado número 3', autor: null, provisorio: true },
      ],
    },
    {
      id: 'analfabeto', nome: 'Analfabeto do Ano', icone: 'analfabeto', tipo: 'membros',
      texto: 'Erros de português que nem o corretor do celular conseguiu salvar.',
    },
    {
      id: 'video', nome: 'Vídeo do Ano', icone: 'video', tipo: 'opcoes',
      texto: 'O corte que rodou o grupo mais vezes. Assista de novo, se tiver coragem.',
      opcoes: [
        { id: 'v1', titulo: 'Vídeo indicado número 1', autor: null, video: null, provisorio: true },
        { id: 'v2', titulo: 'Vídeo indicado número 2', autor: null, video: null, provisorio: true },
        { id: 'v3', titulo: 'Vídeo indicado número 3', autor: null, video: null, provisorio: true },
      ],
    },
    {
      id: 'injusticado', nome: 'Injustiçado do Ano', icone: 'injusticado', tipo: 'membros',
      texto: 'Fez tudo certo e mesmo assim tomou. Para quem o universo perseguiu o ano todo.',
    },
    {
      id: 'tarado', nome: 'Tarado do Ano', icone: 'tarado', tipo: 'membros',
      texto: 'Comentário duvidoso em qualquer assunto. O clã ouviu, registrou e não esqueceu.',
    },
    {
      id: 'pubg', nome: 'Melhor Momento PUBG do Ano', icone: 'pubg', tipo: 'opcoes',
      texto: 'A jogada que até hoje é contada na call. Clutch, frigideira ou vexame histórico.',
      opcoes: [
        { id: 'p1', titulo: 'Momento PUBG indicado número 1', autor: null, video: null, provisorio: true },
        { id: 'p2', titulo: 'Momento PUBG indicado número 2', autor: null, video: null, provisorio: true },
        { id: 'p3', titulo: 'Momento PUBG indicado número 3', autor: null, video: null, provisorio: true },
      ],
    },
    {
      id: 'fifa', nome: 'Momento FIFA do Ano', icone: 'fifa', tipo: 'opcoes',
      texto: 'Golaço, virada ou controle quebrado: o lance que marcou o ano.',
      opcoes: [
        { id: 'fi1', titulo: 'Momento FIFA indicado número 1', autor: null, video: null, provisorio: true },
        { id: 'fi2', titulo: 'Momento FIFA indicado número 2', autor: null, video: null, provisorio: true },
        { id: 'fi3', titulo: 'Momento FIFA indicado número 3', autor: null, video: null, provisorio: true },
      ],
    },
    {
      id: 'atleta', nome: 'Atleta do Ano', icone: 'atleta', tipo: 'membros',
      texto: 'Para quem levou o corpo a sério em 2026. Treino comprovado, não só story.',
    },
    {
      id: 'evoluiu-no-cla', nome: 'Evoluiu sem Sair do Clã', icone: 'evoluiu-no-cla', tipo: 'membros',
      texto: 'Mudou de vida, subiu de nível e continuou aqui. Lealdade reconhecida.',
    },
    {
      id: 'carreteiro', nome: 'Carreteiro do Ano', icone: 'carreteiro', tipo: 'membros',
      texto: 'Carregou o time nas costas o ano inteiro, sem freio e sem reclamar.',
    },
  ],
};
