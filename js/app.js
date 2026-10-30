/* ==========================================================================
   APP DE VOTAÇÃO — etapas: abertura → clã → membros → troféus → entrar →
   votação (uma categoria por tela) → revisão → votos lacrados
   ========================================================================== */
(function () {
  const D = window.DADOS, C = window.CONFIG, B = window.Backend;
  const { $, $$, esc, ic, membro, adesivo, cartaoMembro, cartaoOpcao, indicados, nomeEscolha, dataBR } = window.UI;
  const { Som, Cortina, carimbo, confete, aviso } = window.FX;
  const CATS = D.categorias;
  const TOTAL = CATS.length;
  const ano = D.evento.ano;
  const ABERTA = C.votacaoAberta !== false;
  const ROTULO_VOTAR = ABERTA ? 'Ir para a votação' : 'Ver as categorias';

  const estado = { etapa: null, idx: 0, respostas: {}, membro: null, enviado: null, linkEnviadoPara: null, carregandoVoto: false };

  /* ---------------- rascunho local ---------------- */
  const chaveRascunho = () => 'pd26:rascunho:' + (B.usuario ? B.usuario.uid : 'anon');
  function salvarRascunho() { B.LS.set(chaveRascunho(), { respostas: estado.respostas, membro: estado.membro }); }
  function lerRascunho() { const r = B.LS.get(chaveRascunho(), null); estado.respostas = (r && r.respostas) || {}; estado.membro = (r && r.membro) || null; }
  const feitas = () => CATS.filter((c) => estado.respostas[c.id]).length;

  /* ---------------- roteamento ---------------- */
  function rota() {
    const h = (location.hash || '').replace(/^#\/?/, '');
    const [etapa, n] = h.split('/');
    return { etapa: etapa || 'abertura', n: parseInt(n, 10) || 1 };
  }
  function ir(etapa, n) { const alvo = '#/' + etapa + (n ? '/' + n : ''); if (location.hash === alvo) aplicar(); else location.hash = alvo; }

  async function aplicar(primeira) {
    let { etapa, n } = rota();
    if (!document.getElementById('etapa-' + etapa)) etapa = 'abertura';
    // regras de acesso
    if (!ABERTA && ['entrar', 'votar', 'revisao', 'fim'].includes(etapa)) etapa = 'embreve';
    if (etapa === 'votar' || etapa === 'revisao') {
      if (!B.usuario || !estado.membro) etapa = 'entrar';
      else if (estado.enviado) etapa = 'fim';
    }
    if (etapa === 'entrar' && B.usuario && estado.membro && !estado.enviado && rota().etapa === 'entrar' && estado._vindoDoLogin) { /* fica */ }
    if (etapa === 'fim' && !estado.enviado) etapa = B.usuario ? 'entrar' : 'abertura';

    const mesmaEtapa = estado.etapa === etapa;
    const trocar = () => mostrar(etapa, n, mesmaEtapa);
    if (primeira || mesmaEtapa || estado.etapa === null) trocar();
    else await Cortina.passar(trocar);
  }

  function mostrar(etapa, n, mesmaEtapa) {
    window.UI.Audio.parar();
    $$('#app > section').forEach((s) => s.classList.toggle('ativa', s.id === 'etapa-' + etapa));
    $('#topo').classList.toggle('oculto', etapa === 'abertura');
    $$('.topo__nav button').forEach((b) => b.setAttribute('aria-current', String(b.dataset.ir === etapa || (b.dataset.ir === 'votar' && ['entrar', 'revisao', 'fim', 'embreve'].includes(etapa)))));
    const anterior = estado.etapa; estado.etapa = etapa;
    document.body.dataset.etapa = etapa;
    const R = { abertura: rAbertura, cla: rCla, membros: rMembros, premios: rPremios, entrar: rEntrar, votar: rVotar, revisao: rRevisao, fim: rFim, embreve: rEmBreve }[etapa];
    R(n, { mesmaEtapa, anterior });
    const sec = document.getElementById('etapa-' + etapa);
    if (!mesmaEtapa && sec) sec.scrollTop = 0;
  }

  /* ======================= ABERTURA ======================= */
  let aberturaTocada = false;
  function rAbertura() {
    const sec = $('#etapa-abertura');
    const titulo = D.evento.titulo;
    const letras = [...titulo].map((ch, i) => ch === ' ' ? '<span class="letra">&nbsp;</span>' : `<span class="letra" style="--i:${i}">${esc(ch)}</span>`).join('');
    sec.innerHTML = `
      <div class="abertura__flash"></div>
      <div class="abertura__miolo">
        <div class="abertura__apresenta">Clã ${esc(D.evento.cla)} apresenta</div>
        <img class="abertura__logo" src="assets/img/logo.png" alt="Logo do clã ${esc(D.evento.cla)}">
        <h1 class="adesivo abertura__titulo" data-texto="${esc(titulo)}">${letras}</h1>
        <div class="abertura__ano" data-texto="${ano}" aria-label="${ano}">${ano}</div>
        <p class="abertura__linha">A cerimônia oficial de premiação do clã ${esc(D.evento.cla)}.</p>
        <div class="abertura__acoes">
          <button class="btn btn--ouro btn--grande" data-ir="cla">Começar a cerimônia</button>
          <button class="btn btn--linha" data-ir="votar">${ABERTA ? 'Ir direto para a votação' : 'Ver as categorias'}</button>
        </div>
      </div>
      <div class="inicio" id="inicio">
        <img src="assets/img/mascote-ghost.png" alt="">
        <button class="inicio__botao" id="botao-iniciar">Toque para começar</button>
        <small>Melhor com som ligado</small>
      </div>`;
    if (aberturaTocada) { sec.classList.add('toca', 'pronta'); $('#inicio').remove(); window.UI.revelarCubos(true); return; }
    $('#botao-iniciar').addEventListener('click', tocarAbertura, { once: true });
    $('#botao-iniciar').focus({ preventScroll: true });
  }

  function tocarAbertura() {
    aberturaTocada = true;
    Som.garantir();
    const sec = $('#etapa-abertura');
    const inicio = $('#inicio'); inicio.classList.add('sai'); setTimeout(() => inicio.remove(), 700);
    sec.classList.add('toca');
    window.UI.revelarCubos();
    const t = (ms, f) => setTimeout(f, ms);
    t(500, () => Som.tocar('whoosh'));
    t(1700, () => Som.tocar('impacto'));
    t(2500, () => Som.tocar('whoosh'));
    t(3350, () => Som.tocar('fanfarra'));
    t(3800, () => Som.tocar('brilho'));
    const pular = document.createElement('button'); pular.className = 'link abertura__pular'; pular.textContent = 'Pular abertura';
    pular.onclick = () => { sec.classList.add('pronta'); pular.remove(); };
    sec.appendChild(pular); t(5200, () => pular.remove());
  }

  /* ======================= O CLÃ ======================= */
  function rCla() {
    const sec = $('#etapa-cla');
    const foto = D.evento.fotoCla
      ? `<img class="foto" src="${esc(D.evento.fotoCla)}" alt="Foto oficial do clã ${esc(D.evento.cla)}">`
      : `<div class="fila-cla" role="img" aria-label="Os membros do clã reunidos">${filaCla()}</div>
         <p class="cla__legenda">Prévia montada com os recortes. A foto oficial do clã entra aqui.</p>`;
    const ouvir = D.evento.audioAbertura ? window.UI.player(D.evento.audioAbertura, null, { rotulo: 'abertura' }) : '';
    sec.innerHTML = `<div class="etapa__miolo">
      <div class="cla entra">
        <figure class="cla__foto" style="margin:0">${foto}<span class="moldura"></span></figure>
        <article class="edital">
          <span class="edital__lacre">${Trofeu.lacre()}</span>
          ${adesivo('Edital de convocação', 'titulo-edital', 'h2')}
          <p>O Clã <strong>${esc(D.evento.cla)}</strong> convoca seus <strong>${D.membros.length} membros</strong> para eleger os melhores de ${ano}.</p>
          <p>São <strong>${TOTAL} categorias</strong>. Cada membro vota uma única vez, escolhendo uma opção por categoria.</p>
          <p>Os votos ficam lacrados até a cerimônia de premiação, quando os vencedores são revelados ao vivo. Quem levar mais troféus recebe o título de <strong>${esc(D.premioSupremo.nome)}</strong>.</p>
          ${ouvir}
          <div class="edital__assinatura"><img src="assets/img/logo-256.png" alt=""><div><b>Comissão organizadora</b>Melhores do Ano ${ano}</div></div>
        </article>
      </div>
      <div class="etapa__rodape"><button class="btn btn--ouro" data-ir="membros">Conhecer os membros ${ic('seta-dir')}</button></div>
    </div>`;
  }

  function filaCla() {
    const ms = D.membros, n = ms.length, tras = Math.floor(n / 2), frente = n - tras;
    return ms.map((m, i) => {
      const naFrente = i >= tras, j = naFrente ? i - tras : i, qtd = naFrente ? frente : tras;
      const x = naFrente ? 12 + (76 * j) / Math.max(1, qtd - 1) : 20 + (60 * j) / Math.max(1, qtd - 1);
      const k = m.escalaGrupo || 1;
      const estilo = naFrente ? `left:${x}%;bottom:-3%;height:${64 * k}%;z-index:2` : `left:${x}%;bottom:24%;height:${54 * k}%;z-index:1;filter:brightness(.82)`;
      return `<img src="${esc(m.recorte || m.foto)}" alt="" style="${estilo}">`;
    }).join('');
  }

  /* ======================= MEMBROS ======================= */
  let membroAtual = 0;
  function rMembros() {
    const sec = $('#etapa-membros');
    sec.innerHTML = `<div class="etapa__miolo">
      <div class="selecao">
        <div class="selecao__palco" id="sel-palco">
          <div class="selecao__nick-fundo" id="sel-fundo" aria-hidden="true"></div>
          <div class="selecao__base"></div>
          <img class="selecao__foto" id="sel-foto" alt="">
        </div>
        <div class="selecao__info" id="sel-info" aria-live="polite"></div>
      </div>
      <div class="elenco" id="elenco" role="tablist" aria-label="Membros do clã">
        ${D.membros.map((m, i) => `<button role="tab" data-i="${i}" aria-label="${esc(m.nick)}"><img src="${esc(m.recorte || m.foto)}" alt="" loading="lazy"><span>${esc(m.nick)}</span></button>`).join('')}
      </div>
      <div class="etapa__rodape"><button class="btn btn--ouro" data-ir="premios">Ver os troféus ${ic('seta-dir')}</button></div>
    </div>`;
    $('#elenco').addEventListener('click', (e) => { const b = e.target.closest('[data-i]'); if (b) escolherMembro(+b.dataset.i); });
    window.UI.arrastavel($('#elenco'));
    // gesto de arrastar no personagem
    let x0 = null; const palco = $('#sel-palco');
    palco.addEventListener('touchstart', (e) => { x0 = e.touches[0].clientX; }, { passive: true });
    palco.addEventListener('touchend', (e) => { if (x0 == null) return; const dx = e.changedTouches[0].clientX - x0; if (Math.abs(dx) > 40) escolherMembro(membroAtual + (dx < 0 ? 1 : -1)); x0 = null; });
    escolherMembro(membroAtual, true);
  }
  function escolherMembro(i, inicial) {
    const n = D.membros.length; const dir = i > membroAtual ? 1 : -1;
    membroAtual = (i + n) % n; const m = D.membros[membroAtual];
    if (!inicial) Som.tocar('clique');
    $('#sel-fundo').textContent = m.nick;
    const foto = $('#sel-foto'); foto.src = m.recorte || m.foto; foto.alt = `${m.nick}, ${m.nome}`;
    foto.style.setProperty('--dir', dir); foto.classList.remove('troca'); void foto.offsetWidth; foto.classList.add('troca');
    const info = $('#sel-info');
    info.innerHTML = `
      ${adesivo(m.nick, 'selecao__nick', 'h2')}
      <p class="selecao__nome">${esc(m.nome)}</p>
      ${m.titulo ? `<p class="selecao__titulo texto-ouro">${esc(m.titulo)}</p>` : ''}
      <p class="selecao__bio">${esc(m.bio || '')}</p>
      ${m.audio ? window.UI.player(m.audio, m.onda, { rotulo: 'áudio de ' + m.nick }) : ''}
      <div class="selecao__setas">
        <button class="btn btn--linha btn--icone" data-passo="-1" aria-label="Membro anterior">${ic('seta-esq')}</button>
        <button class="btn btn--linha btn--icone" data-passo="1" aria-label="Próximo membro">${ic('seta-dir')}</button>
      </div>`;
    info.classList.remove('troca'); void info.offsetWidth; info.classList.add('troca');
    $$('[data-passo]', info).forEach((b) => b.addEventListener('click', () => escolherMembro(membroAtual + +b.dataset.passo)));
    $$('#elenco button').forEach((b, j) => b.setAttribute('aria-current', String(j === membroAtual)));
    const ativo = $(`#elenco button[data-i="${membroAtual}"]`);
    if (ativo && !inicial) ativo.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
  }

  /* ======================= TROFÉUS ======================= */
  function rPremios() {
    const sec = $('#etapa-premios');
    sec.innerHTML = `<div class="etapa__miolo">
      <div class="galeria entra">
        <div class="supremo">
          <div class="trofeu-palco trofeu-palco--flutua">${Trofeu.supremo(D.premioSupremo.nome)}</div>
          ${adesivo(D.premioSupremo.nome, '', 'h2')}
          <p>${esc(D.premioSupremo.descricao)}</p>
        </div>
        <div>
          ${adesivo('A estante de ' + ano, 'titulo-etapa', 'h2')}
          <p class="galeria__texto">${TOTAL} troféus banhados a ouro, um para cada categoria. Cada um vai para as mãos de quem o clã escolher.</p>
          <div class="estante">${CATS.map((c) => `<div class="estante__item">${Trofeu.svg(c)}<span>${esc(c.nome)}</span></div>`).join('')}</div>
        </div>
      </div>
      <div class="etapa__rodape"><button class="btn btn--ouro" data-ir="votar">${ROTULO_VOTAR} ${ic('seta-dir')}</button></div>
    </div>`;
  }

  /* ======================= ENTRAR ======================= */
  function rEntrar() {
    const sec = $('#etapa-entrar');
    const demo = B.modo === 'demo';
    let corpo;
    if (B.precisaConfirmarEmail) {
      corpo = `${adesivo('Confirme seu e-mail', '', 'h2')}
        <p>Você abriu o link em outro aparelho ou navegador. Digite o mesmo e-mail para concluir o acesso.</p>
        <form id="form-confirmar"><label class="campo"><span>E-mail</span><input type="email" name="email" autocomplete="email" required></label>
        <div class="porta__acoes"><button class="btn btn--ouro">Concluir acesso</button></div></form><div id="msg"></div>`;
    } else if (!B.usuario) {
      if (estado.linkEnviadoPara) {
        corpo = `${adesivo('Confira seu e-mail', '', 'h2')}
          <p>Enviamos um link de acesso para <strong>${esc(estado.linkEnviadoPara)}</strong>. Abra o e-mail e toque no link para entrar. Se não aparecer, olhe a caixa de spam.</p>
          <div class="porta__acoes"><button class="btn btn--linha" id="outro-email">Usar outro e-mail</button></div>`;
      } else {
        corpo = `${adesivo('Entre para votar', '', 'h2')}
          <p>Cada e-mail vota uma única vez. Seus votos ficam lacrados até a cerimônia de premiação.</p>
          <form id="form-email">
            <label class="campo"><span>Seu e-mail</span><input type="email" name="email" autocomplete="email" placeholder="nome@gmail.com" required></label>
            <div class="porta__acoes">
              <button class="btn btn--ouro">${demo ? 'Entrar' : 'Receber link de acesso'} ${ic('mail')}</button>
              ${!demo && C.login && C.login.google ? `<div class="ou">ou</div><button type="button" class="btn btn--linha" id="entrar-google">${ic('google')} Entrar com Google</button>` : ''}
            </div>
          </form>
          <div id="msg">${demo ? '<p class="aviso">Modo demonstração: os votos ficam guardados só neste navegador. Para valer, configure o Firebase (veja o README).</p>' : ''}</div>`;
      }
    } else {
      corpo = `${adesivo('Quem é você?', '', 'h2')}
        <p>Escolha seu cartão para a comissão saber quem votou. Seus votos continuam em sigilo até a cerimônia.</p>
        <div class="quem" id="quem">${D.membros.map((m) => cartaoMembro(m, { selecionado: estado.membro === m.id, semNome: true })).join('')}</div>
        <div class="porta__acoes">
          <button class="btn btn--ouro" id="comecar" ${estado.membro ? '' : 'disabled'}>${feitas() ? 'Continuar a votação' : 'Começar a votação'} ${ic('seta-dir')}</button>
        </div>
        <p class="rotulo" style="margin:14px 0 0">Entrou como ${esc(B.usuario.email)}. <button class="link" id="sair">Sair</button></p>`;
    }
    sec.innerHTML = `<div class="etapa__miolo"><div class="porta"><div class="porta__caixa entra">${corpo}</div></div></div>`;

    const msg = (t, erro) => { const m = $('#msg'); if (m) m.innerHTML = `<p class="aviso ${erro ? 'aviso--erro' : ''}">${esc(t)}</p>`; };
    const fe = $('#form-email');
    if (fe) fe.addEventListener('submit', async (e) => {
      e.preventDefault(); const email = fe.email.value; const btn = $('button', fe); btn.disabled = true;
      try {
        const r = await B.enviarLink(email);
        if (r === 'link-enviado') { estado.linkEnviadoPara = email.trim(); rEntrar(); }
        else { Som.tocar('seleciona'); await depoisDeEntrar(); }
      } catch (err) { msg(traduzErro(err), true); btn.disabled = false; }
    });
    const fc = $('#form-confirmar');
    if (fc) fc.addEventListener('submit', async (e) => { e.preventDefault(); try { await B.concluirLink(fc.email.value); await depoisDeEntrar(); } catch (err) { msg(traduzErro(err), true); } });
    const g = $('#entrar-google');
    if (g) g.addEventListener('click', async () => { try { await B.entrarGoogle(); await depoisDeEntrar(); } catch (err) { msg(traduzErro(err), true); } });
    const oe = $('#outro-email'); if (oe) oe.addEventListener('click', () => { estado.linkEnviadoPara = null; rEntrar(); });
    const sair = $('#sair'); if (sair) sair.addEventListener('click', async () => { await B.sair(); estado.enviado = null; estado.membro = null; estado.respostas = {}; rEntrar(); });
    const quem = $('#quem');
    if (quem) {
      quem.addEventListener('click', (e) => {
        const c = e.target.closest('.cartao'); if (!c) return;
        estado.membro = c.dataset.id; salvarRascunho(); Som.tocar('seleciona');
        $$('.cartao', quem).forEach((x) => x.setAttribute('aria-pressed', String(x === c)));
        $('#comecar').disabled = false;
      });
      $('#comecar').addEventListener('click', () => { const prox = CATS.findIndex((c) => !estado.respostas[c.id]); ir('votar', prox < 0 ? TOTAL : prox + 1); });
    }
  }

  function traduzErro(err) {
    const c = (err && err.code) || '';
    if (c.includes('popup-blocked') || c.includes('popup-closed')) return 'A janela do Google foi fechada ou bloqueada. Tente de novo ou use o link por e-mail.';
    if (c.includes('invalid-email')) return 'Este e-mail não parece válido.';
    if (c.includes('invalid-action-code') || c.includes('expired-action-code')) return 'Este link expirou ou já foi usado. Peça um novo.';
    if (c.includes('unauthorized-domain')) return 'Este endereço do site ainda não foi autorizado no Firebase (Authentication → Settings → Authorized domains).';
    if (c.includes('operation-not-allowed')) return 'Esse tipo de login não está ativado no Firebase.';
    if (c.includes('permission-denied')) return 'O servidor recusou o envio. Confira as regras do Firestore no README.';
    if (c.includes('network')) return 'Sem conexão. Confira a internet e tente de novo.';
    return (err && err.message) || 'Algo deu errado. Tente de novo.';
  }

  async function depoisDeEntrar() {
    lerRascunho();
    const v = await B.meuVoto().catch(() => null);
    estado.enviado = v;
    if (v) { ir('fim'); return; }
    if (rota().etapa === 'entrar') rEntrar(); else ir('entrar');
  }

  /* ======================= VOTAÇÃO ======================= */
  function rVotar(n, info) {
    const idx = Math.min(Math.max(1, n), TOTAL) - 1;
    estado.idx = idx;
    const cat = CATS[idx];
    const sec = $('#etapa-votar');
    const escolha = estado.respostas[cat.id];
    const lista = indicados(cat, estado.membro);
    const cartoes = cat.tipo === 'opcoes'
      ? lista.map((o) => cartaoOpcao(cat, o, { selecionado: escolha === o.id })).join('')
      : lista.map((m) => cartaoMembro(m, { selecionado: escolha === m.id })).join('');
    sec.innerHTML = `<div class="etapa__miolo">
      <div class="progresso">
        <span class="progresso__conta">Categoria <b>${idx + 1}</b> de ${TOTAL}</span>
        <span class="progresso__barra" aria-hidden="true">${CATS.map((c, i) => `<i class="${i === idx ? 'atual' : estado.respostas[c.id] ? 'feito' : ''}"></i>`).join('')}</span>
        <button class="btn btn--linha btn--icone" id="abrir-indice" aria-label="Ver todas as categorias">${ic('grade')}</button>
      </div>
      <div class="categoria ${info && info.mesmaEtapa ? 'troca' : ''}" id="categoria">
        <div class="categoria__topo">
          <div class="categoria__trofeu"><div class="trofeu-palco trofeu-palco--flutua">${Trofeu.svg(cat, { atraso: 0.6 })}</div></div>
          <div class="categoria__cabeca">
            ${adesivo(cat.nome, 'categoria__nome', 'h1')}
            <p class="categoria__texto">${esc(cat.texto || '')}</p>
          </div>
        </div>
        <div class="categoria__votos">
          <div class="carrossel">
            <div class="carrossel__setas">
              <button class="btn btn--linha btn--icone" data-rolar="-1" aria-label="Voltar indicados">${ic('seta-esq')}</button>
              <button class="btn btn--linha btn--icone" data-rolar="1" aria-label="Avançar indicados">${ic('seta-dir')}</button>
            </div>
            <div class="carrossel__trilho" id="trilho" role="listbox" aria-label="Indicados de ${esc(cat.nome)}">${cartoes}</div>
          </div>
          <p class="carrossel__dica">${cat.tipo === 'opcoes' ? 'Arraste para o lado, ouça ou assista, e toque na sua escolha.' : 'Arraste para o lado e toque no seu escolhido.'}</p>
        </div>
      </div>
      <div class="votar-barra">
        <button class="btn btn--linha btn--icone" id="anterior" aria-label="Categoria anterior" ${idx === 0 ? 'disabled' : ''}>${ic('seta-esq')}</button>
        <span class="votar-barra__escolha" id="escolha" aria-live="polite">${escolha ? `Seu voto: <b>${esc(nomeEscolha(cat, escolha))}</b>` : 'Escolha uma opção'}</span>
        <button class="btn btn--ouro" id="confirmar" ${escolha ? '' : 'disabled'}>Confirmar voto ${ic('check')}</button>
      </div>
    </div>`;

    const trilho = $('#trilho');
    window.UI.arrastavel(trilho);
    trilho.addEventListener('click', (e) => {
      const c = e.target.closest('.cartao, .opcao'); if (!c) return;
      estado.respostas[cat.id] = c.dataset.id; salvarRascunho();
      Som.tocar('seleciona');
      $$('.cartao, .opcao', trilho).forEach((x) => x.setAttribute('aria-pressed', String(x === c)));
      $('#escolha').innerHTML = `Seu voto: <b>${esc(nomeEscolha(cat, c.dataset.id))}</b>`;
      $('#confirmar').disabled = false;
      $$('.progresso__barra i')[idx].classList.add('feito');
    });
    $$('[data-rolar]', sec).forEach((b) => b.addEventListener('click', () => trilho.scrollBy({ left: +b.dataset.rolar * trilho.clientWidth * 0.8, behavior: 'smooth' })));
    $('#anterior').addEventListener('click', () => ir('votar', idx));
    $('#confirmar').addEventListener('click', () => {
      if (!estado.respostas[cat.id]) return;
      const btn = $('#confirmar'); btn.disabled = true;
      carimbo('Voto confirmado', $('#categoria'));
      setTimeout(() => {
        const prox = CATS.findIndex((c, i) => i > idx && !estado.respostas[c.id]);
        if (prox >= 0) ir('votar', prox + 1);
        else if (feitas() === TOTAL) ir('revisao');
        else ir('votar', Math.min(TOTAL, idx + 2));
      }, 900);
    });
    $('#abrir-indice').addEventListener('click', abrirIndice);
    // rola até o escolhido
    const sel = $('[aria-pressed="true"]', trilho);
    if (sel) requestAnimationFrame(() => { trilho.scrollLeft = Math.max(0, sel.offsetLeft - 20); });
  }

  function abrirIndice() {
    const m = document.createElement('div'); m.className = 'indice'; m.setAttribute('role', 'dialog'); m.setAttribute('aria-label', 'Todas as categorias');
    m.innerHTML = `<div class="indice__caixa">
      <div class="indice__cabeca">${adesivo(`${feitas()} de ${TOTAL} votadas`, '', 'h2')}<button class="btn btn--linha btn--icone" data-fechar aria-label="Fechar">${ic('x')}</button></div>
      <div class="revisao">${listaRevisao()}</div>
      ${feitas() === TOTAL ? `<div class="etapa__rodape"><button class="btn btn--ouro" data-revisao>Revisar e lacrar ${ic('seta-dir')}</button></div>` : ''}
    </div>`;
    const fechar = () => { m.remove(); document.removeEventListener('keydown', k); };
    const k = (e) => { if (e.key === 'Escape') fechar(); };
    m.addEventListener('click', (e) => {
      if (e.target === m || e.target.closest('[data-fechar]')) return fechar();
      const it = e.target.closest('[data-cat]'); if (it) { fechar(); ir('votar', +it.dataset.cat + 1); }
      if (e.target.closest('[data-revisao]')) { fechar(); ir('revisao'); }
    });
    document.addEventListener('keydown', k);
    document.body.appendChild(m); $('[data-fechar]', m).focus();
  }

  function listaRevisao() {
    return CATS.map((c, i) => {
      const id = estado.respostas[c.id];
      let av = '';
      if (id) {
        if (c.tipo === 'opcoes') { const o = c.opcoes.find((x) => x.id === id); const a = o && o.autor && membro(o.autor); av = a ? `<img class="revisao__avatar" src="${esc(a.recorte || a.foto)}" alt="">` : ''; }
        else { const mm = membro(id); av = mm ? `<img class="revisao__avatar" src="${esc(mm.recorte || mm.foto)}" alt="">` : ''; }
      }
      return `<button class="revisao__item" data-cat="${i}">
        <span class="revisao__emblema">${Trofeu.emblema(c)}</span>
        <span class="revisao__texto"><small>${esc(c.nome)}</small><b class="${id ? '' : 'falta'}">${id ? esc(nomeEscolha(c, id)) : 'Falta votar'}</b></span>
        ${av}
      </button>`;
    }).join('');
  }

  /* ======================= REVISÃO ======================= */
  function rRevisao() {
    const sec = $('#etapa-revisao');
    const faltam = TOTAL - feitas();
    sec.innerHTML = `<div class="etapa__miolo">
      <div class="revisao__cabeca entra">
        <div>${adesivo('Revise seus votos', 'titulo-etapa', 'h1')}
        <p>${faltam ? `Faltam <strong>${faltam}</strong> ${faltam > 1 ? 'categorias' : 'categoria'}. Toque em uma para votar.` : 'Tudo votado. Toque em qualquer categoria para trocar, ou lacre os votos para enviar.'}</p></div>
      </div>
      <div class="revisao" id="lista-revisao">${listaRevisao()}</div>
      <div class="etapa__rodape">
        <span class="rotulo">Depois de lacrar, os votos não podem ser alterados.</span>
        <button class="btn btn--ouro btn--grande" id="lacrar" ${faltam ? 'disabled' : ''}>${ic('lacre')} Lacrar e enviar votos</button>
      </div>
    </div>`;
    $('#lista-revisao').addEventListener('click', (e) => { const it = e.target.closest('[data-cat]'); if (it) ir('votar', +it.dataset.cat + 1); });
    $('#lacrar').addEventListener('click', confirmarLacre);
  }

  function confirmarLacre() {
    const m = document.createElement('div'); m.className = 'indice'; m.setAttribute('role', 'alertdialog');
    m.innerHTML = `<div class="indice__caixa" style="max-width:520px">
      ${adesivo('Lacrar os votos?', '', 'h2')}
      <p style="color:#d3e2f7;margin:14px 0 22px">Seus ${TOTAL} votos serão enviados para a comissão e ficam guardados até a cerimônia. Depois disso, não dá para mudar.</p>
      <div style="display:flex;gap:10px;flex-wrap:wrap;justify-content:flex-end">
        <button class="btn btn--linha" data-fechar>Voltar e revisar</button>
        <button class="btn btn--ouro" data-ok>${ic('lacre')} Lacrar e enviar</button>
      </div></div>`;
    document.body.appendChild(m); $('[data-ok]', m).focus();
    m.addEventListener('click', async (e) => {
      if (e.target === m || e.target.closest('[data-fechar]')) return m.remove();
      if (!e.target.closest('[data-ok]')) return;
      const ok = $('[data-ok]', m); ok.disabled = true; ok.textContent = 'Enviando...';
      try {
        await B.enviarVotos({ membro: estado.membro, respostas: estado.respostas });
        estado.enviado = { respostas: estado.respostas, membro: estado.membro, enviadoEm: new Date().toISOString(), agora: true };
        m.remove(); ir('fim');
      } catch (err) {
        ok.disabled = false; ok.innerHTML = `${ic('lacre')} Tentar de novo`;
        aviso(traduzErro(err));
        if (/já lacrou/.test(err.message)) { m.remove(); estado.enviado = await B.meuVoto(); ir('fim'); }
      }
    });
  }

  /* ======================= FIM ======================= */
  function rFim() {
    const sec = $('#etapa-fim');
    const v = estado.enviado || {};
    const m = membro(v.membro || estado.membro);
    const quando = dataBR(C.cerimonia);
    sec.innerHTML = `<div class="etapa__miolo"><div class="fim">
      <div>
        <div class="fim__lacre ${v.agora ? 'vai' : ''}">${Trofeu.lacre()}</div>
        ${adesivo('Votos lacrados', 'titulo-etapa', 'h1')}
        <p>${m ? `Obrigado, ${esc(m.nick)}. ` : ''}Seus ${TOTAL} votos estão guardados e ninguém vê nada até a cerimônia de premiação${quando ? `, em <strong>${esc(quando)}</strong>` : ''}. Os vencedores serão revelados ao vivo.</p>
        <div class="fim__acoes">
          <button class="btn btn--linha" data-ir="premios">Rever os troféus</button>
          <button class="btn btn--linha" data-ir="membros">Ver os membros</button>
        </div>
      </div>
    </div></div>`;
    if (v.agora) {
      v.agora = false;
      setTimeout(() => Som.tocar('impacto'), 500);
      setTimeout(() => { Som.tocar('fanfarra'); confete({ y: 0.35 }); }, 650);
    }
  }

  /* ======================= EM BREVE (votação fechada) ======================= */
  let relogio = null;
  function rEmBreve() {
    const sec = $('#etapa-embreve');
    const data = C.aberturaVotacao ? new Date(C.aberturaVotacao) : null;
    const temData = data && !isNaN(data) && data > new Date();
    sec.innerHTML = `<div class="etapa__miolo">
      <div class="embreve entra">
        <div class="embreve__topo">
          <div class="embreve__trofeu trofeu-palco trofeu-palco--flutua">${Trofeu.supremo(D.premioSupremo.nome)}</div>
          <div>
            ${adesivo('A votação abre em breve', 'titulo-etapa', 'h1')}
            <p class="embreve__texto">Os troféus já estão na estante. Quando a votação abrir, cada membro entra com o e-mail e lacra seus votos em ${TOTAL} categorias. No fim da noite, quem levar mais troféus vira o <strong>${esc(D.premioSupremo.nome)} ${ano}</strong>.</p>
            ${temData ? `<div class="contagem" id="contagem" aria-live="off">${['dias', 'horas', 'min', 'seg'].map((u) => `<span><b data-u="${u}">00</b><small>${u}</small></span>`).join('')}</div>
              <p class="rotulo">Abertura: ${esc(dataBR(C.aberturaVotacao))}</p>` : `<p class="embreve__data">Data de abertura: em breve. Fique de olho no grupo.</p>`}
          </div>
        </div>
        <h2 class="embreve__sub">As categorias de ${ano}</h2>
        <div class="revisao embreve__lista">${CATS.map((c) => `<div class="revisao__item"><span class="revisao__emblema">${Trofeu.emblema(c)}</span><span class="revisao__texto"><b>${esc(c.nome)}</b><small>${esc(c.texto || '')}</small></span></div>`).join('')}</div>
      </div>
      <div class="etapa__rodape">
        <button class="btn btn--linha" data-ir="membros">Conhecer os membros</button>
        <button class="btn btn--ouro" data-ir="premios">Ver os troféus ${ic('seta-dir')}</button>
      </div>
    </div>`;
    clearInterval(relogio);
    if (temData) {
      const tic = () => {
        const ms = Math.max(0, data - new Date()), s = Math.floor(ms / 1000);
        const v = { dias: Math.floor(s / 86400), horas: Math.floor(s / 3600) % 24, min: Math.floor(s / 60) % 60, seg: s % 60 };
        $$('#contagem b').forEach((b) => { b.textContent = String(v[b.dataset.u]).padStart(2, '0'); });
        if (!ms) { clearInterval(relogio); }
      };
      tic(); relogio = setInterval(tic, 1000);
    }
  }

  /* ======================= INICIALIZAÇÃO ======================= */
  function botaoSom() {
    const b = $('#botao-som');
    const pinta = () => { b.innerHTML = ic(Som.ligado ? 'volume' : 'mudo'); b.setAttribute('aria-label', Som.ligado ? 'Desligar som' : 'Ligar som'); };
    pinta(); b.addEventListener('click', () => { Som.alternar(); pinta(); if (Som.ligado) Som.tocar('clique'); });
  }

  document.addEventListener('click', (e) => {
    const a = e.target.closest('[data-ir]'); if (!a) return;
    e.preventDefault(); Som.tocar('clique');
    const alvo = a.dataset.ir;
    if (alvo === 'votar') {
      if (!ABERTA) return ir('embreve');
      if (estado.enviado) return ir('fim');
      if (!B.usuario || !estado.membro) return ir('entrar');
      const prox = CATS.findIndex((c) => !estado.respostas[c.id]);
      return prox < 0 ? ir('revisao') : ir('votar', prox + 1);
    }
    ir(alvo);
  });

  async function iniciar() {
    Trofeu.instalar();
    window.UI.gradeCubos($('#grade'));
    window.FX.Particulas.iniciar($('#particulas'));
    botaoSom();
    try { await B.iniciar(); } catch (err) { console.error(err); aviso('Não foi possível conectar ao servidor de votos. Recarregue a página.'); }
    lerRascunho();
    if (B.usuario) estado.enviado = await B.meuVoto().catch(() => null);
    B.aoMudarUsuario(() => { lerRascunho(); });
    if (B.precisaConfirmarEmail) location.hash = '#/entrar';
    if (rota().etapa !== 'abertura') { aberturaTocada = true; window.UI.revelarCubos(true); }
    window.addEventListener('hashchange', () => aplicar(false));
    aplicar(true);
  }
  iniciar();
})();
