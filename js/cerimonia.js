/* ==========================================================================
   CERIMÔNIA DE REVELAÇÃO AO VIVO
   Nenhum resultado aparece antes do clique em "Revelar ganhador".
   Os votos são carregados na memória e cada categoria só é apurada
   na hora da revelação, na frente de todo mundo.
   ========================================================================== */
(function () {
  const D = window.DADOS, C = window.CONFIG, B = window.Backend;
  const { $, $$, esc, ic, membro, adesivo, cartaoMembro, cartaoOpcao, indicados, nomeEscolha } = window.UI;
  const { Som, Cortina, confete, carimbo, aviso } = window.FX;
  const CATS = D.categorias, TOTAL = CATS.length, ano = D.evento.ano;
  const espera = (ms) => new Promise((r) => setTimeout(r, ms));
  const lista = (a) => a.length <= 1 ? (a[0] || '') : a.slice(0, -1).join(', ') + ' e ' + a[a.length - 1];

  const est = { votos: [], idx: 0, ocupado: false, tela: null, reveladas: new Set(B.LS.get('pd26:reveladas', [])), overlay: null };
  const salvarReveladas = () => B.LS.set('pd26:reveladas', [...est.reveladas]);

  /* ---------------- apuração (só em memória) ---------------- */
  const autorDe = (cat, id) => {
    if (cat.tipo !== 'opcoes') return id;
    const o = (cat.opcoes || []).find((x) => x.id === id); return o && o.autor ? o.autor : null;
  };
  function apurarCategoria(cat) {
    const cont = {}; let total = 0;
    est.votos.forEach((v) => { const r = v.respostas && v.respostas[cat.id]; if (r) { cont[r] = (cont[r] || 0) + 1; total++; } });
    const max = Math.max(0, ...Object.values(cont));
    const vencedores = max ? Object.keys(cont).filter((k) => cont[k] === max) : [];
    return { cont, total, max, vencedores };
  }
  function placar(ate = TOTAL) {
    const trofeus = {}, soma = {};
    D.membros.forEach((m) => { trofeus[m.id] = 0; soma[m.id] = 0; });
    CATS.slice(0, ate).forEach((cat) => {
      const r = apurarCategoria(cat);
      r.vencedores.forEach((id) => { const a = autorDe(cat, id); if (a in trofeus) trofeus[a]++; });
      Object.entries(r.cont).forEach(([id, n]) => { const a = autorDe(cat, id); if (a in soma) soma[a] += n; });
    });
    const ordem = D.membros.map((m) => m.id).sort((a, b) => trofeus[b] - trofeus[a] || soma[b] - soma[a]);
    return { trofeus, soma, ordem };
  }

  /* ---------------- telas ---------------- */
  function mostrar(id, render) {
    window.UI.Audio.parar();
    $$('#app > section').forEach((s) => s.classList.toggle('ativa', s.id === id));
    est.tela = id; render && render();
    const sec = document.getElementById(id); if (sec) sec.scrollTop = 0;
    $('#topo').classList.toggle('oculto', id === 'c-abertura');
    $('#botao-indice').hidden = !(id === 'c-categoria' || id === 'c-imperador');
  }
  const trocar = (id, render) => Cortina.passar(() => mostrar(id, render));

  /* ======================= PORTÃO ======================= */
  function rPortao() {
    const sec = $('#c-portao');
    let corpo;
    if (B.modo === 'demo') {
      corpo = `${adesivo('Área da comissão', '', 'h2')}
        <p>Aqui a apuração acontece ao vivo. Nenhum resultado aparece antes do clique em revelar.</p>
        <p class="aviso">Modo demonstração: a cerimônia usa os votos guardados neste navegador. Você pode gerar votos de teste no painel.</p>
        <div class="porta__acoes" style="margin-top:20px"><button class="btn btn--ouro" id="entrar-demo">Entrar no painel ${ic('seta-dir')}</button></div>`;
    } else if (B.precisaConfirmarEmail) {
      corpo = `${adesivo('Confirme seu e-mail', '', 'h2')}<p>Digite o mesmo e-mail que recebeu o link.</p>
        <form id="form-confirmar"><label class="campo"><span>E-mail</span><input type="email" name="email" required></label><div class="porta__acoes"><button class="btn btn--ouro">Concluir acesso</button></div></form><div id="msg"></div>`;
    } else if (!B.usuario) {
      corpo = `${adesivo('Área da comissão', '', 'h2')}
        <p>Entre com o e-mail da comissão para abrir a cerimônia.</p>
        <form id="form-email"><label class="campo"><span>E-mail da comissão</span><input type="email" name="email" autocomplete="email" required></label>
        <div class="porta__acoes"><button class="btn btn--ouro">Receber link de acesso ${ic('mail')}</button>
        ${C.login && C.login.google ? `<div class="ou">ou</div><button type="button" class="btn btn--linha" id="entrar-google">${ic('google')} Entrar com Google</button>` : ''}</div></form><div id="msg"></div>`;
    } else if (!B.ehAdmin(B.usuario.email)) {
      corpo = `${adesivo('Acesso restrito', '', 'h2')}<p>O e-mail ${esc(B.usuario.email)} não está na lista da comissão. Coloque-o em <strong>admins</strong> no arquivo js/config.js e nas regras do Firestore.</p>
        <div class="porta__acoes"><button class="btn btn--linha" id="sair">Sair</button></div>`;
    } else { return entrarPainel(); }
    sec.innerHTML = `<div class="etapa__miolo"><div class="porta"><div class="porta__caixa entra">${corpo}</div></div></div>`;
    const msg = (t, e) => { const m = $('#msg'); if (m) m.innerHTML = `<p class="aviso ${e ? 'aviso--erro' : ''}">${esc(t)}</p>`; };
    const d = $('#entrar-demo'); if (d) d.onclick = () => { Som.garantir(); entrarPainel(); };
    const fe = $('#form-email'); if (fe) fe.onsubmit = async (e) => { e.preventDefault(); try { await B.enviarLink(fe.email.value); msg('Link enviado. Abra o e-mail neste aparelho e toque no link.'); } catch (err) { msg(err.message, true); } };
    const fc = $('#form-confirmar'); if (fc) fc.onsubmit = async (e) => { e.preventDefault(); try { await B.concluirLink(fc.email.value); rPortao(); } catch (err) { msg(err.message, true); } };
    const g = $('#entrar-google'); if (g) g.onclick = async () => { try { await B.entrarGoogle(); rPortao(); } catch (err) { msg(err.message, true); } };
    const s = $('#sair'); if (s) s.onclick = async () => { await B.sair(); rPortao(); };
  }

  /* ======================= PAINEL (sem spoiler) ======================= */
  async function entrarPainel() {
    await carregarVotos();
    mostrar('c-painel', rPainel);
  }
  async function carregarVotos() {
    try { est.votos = await B.todosVotos(); }
    catch (err) { console.error(err); aviso('Não foi possível ler os votos. Confira se seu e-mail está nas regras do Firestore.'); est.votos = []; }
  }
  function rPainel() {
    const sec = $('#c-painel');
    const votaram = new Set(est.votos.map((v) => v.membro).filter(Boolean));
    const outros = est.votos.filter((v) => !v.membro || !membro(v.membro)).length;
    const n = D.membros.filter((m) => votaram.has(m.id)).length;
    const nRev = est.reveladas.size;
    sec.innerHTML = `<div class="etapa__miolo">
      <div class="painel entra">
        <div class="painel__texto">
          ${adesivo('Apuração ao vivo', 'titulo-etapa', 'h1')}
          <p>Nenhum resultado aparece nesta tela. Cada ganhador só é calculado e mostrado quando você clicar em <strong>Revelar ganhador</strong>, com todo mundo assistindo.</p>
          <p class="painel__contagem"><b>${n}</b> de ${D.membros.length} membros lacraram os votos${outros ? `, mais ${outros} ${outros > 1 ? 'votos de e-mails' : 'voto de e-mail'} sem membro identificado` : ''}.</p>
          <div class="painel__acoes">
            <button class="btn btn--ouro btn--grande" id="abrir" ${est.votos.length ? '' : 'disabled'}>${ic('trofeu')} ${nRev ? 'Continuar a cerimônia' : 'Abrir a cerimônia'}</button>
            <button class="btn btn--linha" id="atualizar">Atualizar votos</button>
          </div>
          ${nRev ? `<p class="rotulo">${nRev} de ${TOTAL} categorias já reveladas. <button class="link" id="recomecar">Recomeçar do zero</button></p>` : ''}
          ${B.modo === 'demo' ? `<div class="painel__demo"><p class="aviso">Modo demonstração. Gere votos fictícios para ensaiar a cerimônia.</p>
            <button class="btn btn--linha btn--pequeno" id="gerar">Gerar votos de teste</button>
            <button class="btn btn--linha btn--pequeno" id="limpar">Apagar votos de teste</button></div>` : ''}
          <p class="painel__csv"><button class="link" id="csv">${ic('download', 'style="width:16px;height:16px;vertical-align:-3px"')} Exportar todos os votos (CSV)</button></p>
        </div>
        <div class="quem painel__membros">${D.membros.map((m) => cartaoMembro(m, { selecionado: votaram.has(m.id), semNome: true, tag: votaram.has(m.id) ? 'Votou' : 'Pendente', classe: votaram.has(m.id) ? '' : 'pendente' })).join('')}</div>
      </div>
    </div>`;
    $('#abrir').onclick = () => { Som.garantir(); FX.Trilha.tocar(); est.reveladas.size ? irCategoria(primeiraNaoRevelada(), true) : trocar('c-abertura', rAbertura); };
    $('#atualizar').onclick = async () => { await carregarVotos(); rPainel(); aviso(`${est.votos.length} votos carregados.`); };
    const rc = $('#recomecar'); if (rc) rc.onclick = () => { est.reveladas.clear(); salvarReveladas(); rPainel(); };
    const g = $('#gerar'); if (g) g.onclick = async () => { B.demoGerarVotos(D, 9); await carregarVotos(); rPainel(); aviso('Votos de teste gerados.'); };
    const l = $('#limpar'); if (l) l.onclick = async () => { B.demoLimpar(); await carregarVotos(); rPainel(); };
    $('#csv').onclick = exportarCSV;
    $$('.painel__membros .cartao').forEach((c) => { c.tabIndex = -1; c.style.cursor = 'default'; });
  }
  const primeiraNaoRevelada = () => { const i = CATS.findIndex((c) => !est.reveladas.has(c.id)); return i < 0 ? TOTAL - 1 : i; };

  function exportarCSV() {
    if (!confirm('O arquivo mostra todos os votos. Exporte só depois da cerimônia, para não estragar a surpresa. Exportar agora?')) return;
    const cab = ['email', 'membro', 'enviado_em', ...CATS.map((c) => c.nome)];
    const linhas = est.votos.map((v) => [v.email, v.membro ? (membro(v.membro) || {}).nick || v.membro : '', v.enviadoEm || '', ...CATS.map((c) => nomeEscolha(c, v.respostas && v.respostas[c.id]))]);
    const csv = [cab, ...linhas].map((l) => l.map((x) => `"${String(x == null ? '' : x).replace(/"/g, '""')}"`).join(';')).join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' }));
    a.download = `votos-melhores-do-ano-${ano}.csv`; a.click();
  }

  /* ======================= ABERTURA DA CERIMÔNIA ======================= */
  function rAbertura() {
    const sec = $('#c-abertura');
    const t = D.evento.titulo;
    const letras = [...t].map((ch, i) => ch === ' ' ? '<span class="letra">&nbsp;</span>' : `<span class="letra" style="--i:${i}">${esc(ch)}</span>`).join('');
    sec.innerHTML = `<div class="abertura__flash"></div>
      <div class="abertura__miolo">
        <div class="abertura__apresenta">A noite da revelação</div>
        <img class="abertura__logo" src="assets/img/logo.png" alt="Logo do clã ${esc(D.evento.cla)}">
        <h1 class="adesivo abertura__titulo" data-texto="${esc(t)}">${letras}</h1>
        <div class="abertura__ano" data-texto="${ano}">${ano}</div>
        <p class="abertura__linha">${TOTAL} troféus na estante, ${est.votos.length} votos lacrados e um Pinguim Imperador. Que comece a apuração.</p>
        <div class="abertura__acoes"><button class="btn btn--ouro btn--grande" id="primeira">Primeira categoria ${ic('seta-dir')}</button></div>
      </div>`;
    sec.classList.remove('toca', 'pronta'); void sec.offsetWidth; sec.classList.add('toca');
    FX.Trilha.tocar();
    const tt = (ms, f) => setTimeout(f, ms);
    tt(500, () => Som.tocar('whoosh')); tt(1700, () => Som.tocar('impacto')); tt(3350, () => Som.tocar('fanfarra')); tt(3800, () => Som.tocar('brilho'));
    $('#primeira').onclick = () => irCategoria(0);
  }

  /* ======================= CATEGORIA ======================= */
  function irCategoria(i, comCortina = true) {
    est.idx = Math.max(0, Math.min(TOTAL - 1, i));
    if (comCortina) trocar('c-categoria', rCategoria); else mostrar('c-categoria', rCategoria);
  }

  function rCategoria() {
    const cat = CATS[est.idx];
    const sec = $('#c-categoria');
    const revelada = est.reveladas.has(cat.id);
    const r = revelada ? apurarCategoria(cat) : null;
    const lista = indicados(cat);
    const cartoes = cat.tipo === 'opcoes'
      ? lista.map((o) => cartaoOpcao(cat, o)).join('')
      : lista.map((m) => cartaoMembro(m, { semNome: true })).join('');
    $('#topo-progresso').innerHTML = `<span class="progresso__conta">Categoria <b>${est.idx + 1}</b> de ${TOTAL}</span>`;
    sec.innerHTML = `<div class="etapa__miolo">
      <div class="c-cabeca entra">
        <div class="c-cabeca__trofeu trofeu-palco trofeu-palco--flutua">${Trofeu.svg(cat, { atraso: 0.4 })}</div>
        <div>
          ${adesivo(cat.nome, 'c-cabeca__nome', 'h1')}
          <p class="categoria__texto">${esc(cat.texto || '')}</p>
        </div>
      </div>
      <div class="c-indicados ${cat.tipo === 'opcoes' ? 'c-indicados--opcoes' : ''} ${revelada ? 'revelado' : ''}" id="indicados">${cartoes}</div>
      <div class="c-acoes">
        <button class="btn btn--linha btn--icone" id="ant" aria-label="Categoria anterior" ${est.idx === 0 ? 'disabled' : ''}>${ic('seta-esq')}</button>
        ${revelada
          ? `<button class="btn btn--linha" id="rever">Ver resultado de novo</button><button class="btn btn--ouro btn--grande" id="prox">${est.idx === TOTAL - 1 ? 'Rumo ao Pinguim Imperador' : 'Próxima categoria'} ${ic('seta-dir')}</button>`
          : `<button class="btn btn--ouro btn--grande" id="revelar">${ic('trofeu')} Revelar ganhador</button>`}
        <button class="btn btn--linha btn--icone" id="pular" aria-label="Pular para a próxima categoria" ${est.idx === TOTAL - 1 ? 'disabled' : ''}>${ic('seta-dir')}</button>
      </div>
    </div>`;
    $$('#indicados .cartao, #indicados .opcao').forEach((c) => { c.setAttribute('aria-pressed', 'false'); });
    if (revelada) marcarVencedores(r.vencedores);
    $('#ant').onclick = () => irCategoria(est.idx - 1);
    $('#pular').onclick = () => irCategoria(est.idx + 1);
    const rv = $('#revelar'); if (rv) rv.onclick = () => revelar(cat);
    const p = $('#prox'); if (p) p.onclick = proxima;
    const re = $('#rever'); if (re) re.onclick = () => mostrarVencedor(cat, apurarCategoria(cat), false);
    // clique nos cartões não seleciona nada aqui
    $('#indicados').addEventListener('click', (e) => { if (!e.target.closest('.player__botao, [data-video]')) e.preventDefault(); });
  }

  function marcarVencedores(ids) {
    $$('#indicados > *').forEach((c) => {
      const v = ids.includes(c.dataset.id);
      c.classList.toggle('vencedor', v); c.classList.toggle('apagado', !v);
      c.setAttribute('aria-pressed', String(v));
    });
  }

  function proxima() {
    if (est.idx === TOTAL - 1) trocar('c-imperador', rImperador);
    else irCategoria(est.idx + 1);
  }

  /* -------- sequência de revelação -------- */
  async function revelar(cat) {
    if (est.ocupado) return; est.ocupado = true;
    const r = apurarCategoria(cat);
    const box = $('#indicados');
    const cards = $$('#indicados > *');
    $('.c-acoes').classList.add('some');
    document.body.classList.add('escuro');
    if (!r.vencedores.length) {
      await espera(400); carimbo('Sem votos', box);
      est.reveladas.add(cat.id); salvarReveladas(); est.ocupado = false; document.body.classList.remove('escuro'); rCategoria(); return;
    }
    const alvo = Math.max(0, cards.findIndex((c) => c.dataset.id === r.vencedores[0]));
    const parar = Som.rufar(3.6);
    box.classList.add('girando');
    const saltos = 26; let atual = -1;
    for (let k = 0; k < saltos; k++) {
      let prox;
      if (k === saltos - 1) prox = alvo;
      else { do { prox = (Math.random() * cards.length) | 0; } while (prox === atual || (k === saltos - 2 && prox === alvo)); }
      atual = prox;
      cards.forEach((c, j) => c.classList.toggle('foco', j === atual));
      if (k > saltos * 0.55) Som.tocar('clique');
      await espera(55 + 360 * Math.pow(k / saltos, 2.3));
    }
    parar();
    Som.tocar('impacto');
    box.classList.remove('girando');
    cards.forEach((c) => c.classList.remove('foco'));
    marcarVencedores(r.vencedores);
    flash();
    if (r.vencedores.length > 1) { await espera(500); carimbo('Empate!', box); await espera(700); }
    await espera(650);
    est.reveladas.add(cat.id); salvarReveladas();
    document.body.classList.remove('escuro');
    est.ocupado = false;
    mostrarVencedor(cat, r, true);
  }

  function flash() {
    const f = document.createElement('div'); f.className = 'flash-tela'; document.body.appendChild(f);
    setTimeout(() => f.remove(), 900);
  }

  /* -------- tela do vencedor -------- */
  function mostrarVencedor(cat, r, comFesta) {
    fecharOverlay();
    const ehOpcao = cat.tipo === 'opcoes';
    const vencedores = r.vencedores;
    const cartoes = vencedores.map((id) => {
      if (ehOpcao) { const o = cat.opcoes.find((x) => x.id === id); return o ? cartaoOpcao(cat, o, { selecionado: true }) : ''; }
      const m = membro(id); return m ? cartaoMembro(m, { selecionado: true }) : '';
    }).join('');
    const empate = vencedores.length > 1;
    const nomes = vencedores.map((id) => nomeEscolha(cat, id));
    const titulo = empate ? 'Empate' : nomes[0];
    let sub = '';
    if (empate) sub = `${lista(nomes)} dividem o troféu.`;
    else if (ehOpcao) { const a = autorDe(cat, vencedores[0]); sub = a && membro(a) ? `Troféu para ${membro(a).nick}` : ''; }
    else { const m = membro(vencedores[0]); sub = m ? m.nome : ''; }
    const ranking = Object.entries(r.cont).sort((a, b) => b[1] - a[1]).slice(0, 5);
    const barras = C.mostrarContagemNaRevelacao !== false ? `<div class="votos-barras">${ranking.map(([id, n]) => {
      const a = autorDe(cat, id), m = a ? membro(a) : null;
      return `<div class="votos-barras__linha ${vencedores.includes(id) ? 'ganhou' : ''}">
        <span class="votos-barras__nome">${m && !ehOpcao ? `<img src="${esc(m.recorte || m.foto)}" alt="">` : ''}${esc(nomeEscolha(cat, id))}</span>
        <span class="votos-barras__trilha"><i style="--p:${(n / r.max) * 100}%"></i></span>
        <span class="votos-barras__n">${n} ${n > 1 ? 'votos' : 'voto'}</span></div>`;
    }).join('')}</div>` : '';
    const ultimo = est.idx === TOTAL - 1;
    const el = document.createElement('div');
    el.className = 'revelacao' + (comFesta ? ' festa' : ''); el.setAttribute('role', 'dialog'); el.setAttribute('aria-label', `Vencedor de ${cat.nome}`);
    el.innerHTML = `<div class="revelacao__raios" aria-hidden="true"></div>
      <div class="revelacao__miolo">
        <div class="revelacao__cat">${adesivo(cat.nome, 'adesivo--ouro')}</div>
        <div class="revelacao__palco ${empate ? 'duplo' : ''}">
          <div class="revelacao__cartoes">${cartoes}</div>
          <div class="revelacao__trofeu trofeu-palco">${Trofeu.svg(cat, { atraso: 1 })}</div>
        </div>
        <h2 class="revelacao__nome">${adesivo(titulo, 'adesivo--ouro')}</h2>
        ${sub ? `<p class="revelacao__sub">${esc(sub)}</p>` : ''}
        ${barras}
        <div class="revelacao__acoes">
          <button class="btn btn--linha" data-fechar>Fechar</button>
          <button class="btn btn--ouro btn--grande" data-prox>${ultimo ? 'Rumo ao Pinguim Imperador' : 'Próxima categoria'} ${ic('seta-dir')}</button>
        </div>
      </div>`;
    document.body.appendChild(el); est.overlay = el;
    el.addEventListener('click', (e) => {
      if (e.target.closest('[data-fechar]')) { fecharOverlay(); rCategoria(); }
      else if (e.target.closest('[data-prox]')) { fecharOverlay(); proxima(); }
      else if (!e.target.closest('.player__botao, [data-video]') && e.target.closest('.cartao, .opcao')) e.preventDefault();
    });
    if (comFesta) {
      Som.tocar('fanfarra');
      setTimeout(() => confete({ y: 0.4 }), 350);
      setTimeout(() => confete({ x: 0.15, y: 0.6, quantidade: 80 }), 900);
      setTimeout(() => confete({ x: 0.85, y: 0.6, quantidade: 80 }), 1100);
    }
    const pl = $('.player', el);
    if (pl && comFesta) setTimeout(() => { if (est.overlay === el) window.UI.Audio.tocar(pl); }, 1600);
    setTimeout(() => { const b = $('[data-prox]', el); if (b) b.focus({ preventScroll: true }); }, 300);
  }
  function fecharOverlay() { window.UI.Audio.parar(); if (est.overlay) { est.overlay.remove(); est.overlay = null; } }

  /* ======================= PINGUIM IMPERADOR ======================= */
  function rImperador() {
    const sec = $('#c-imperador');
    const faltam = CATS.filter((c) => !est.reveladas.has(c.id)).length;
    $('#topo-progresso').innerHTML = `<span class="progresso__conta">Prêmio final</span>`;
    sec.innerHTML = `<div class="etapa__miolo">
      <div class="imperio entra">
        <div class="imperio__trofeu trofeu-palco trofeu-palco--flutua">${Trofeu.supremo(D.premioSupremo.nome)}</div>
        <div class="imperio__lado">
          ${adesivo(D.premioSupremo.nome + ' ' + ano, 'titulo-etapa', 'h1')}
          <p class="categoria__texto">${esc(D.premioSupremo.descricao)} Em caso de empate em troféus, leva quem somou mais votos em todas as categorias.</p>
          ${faltam ? `<p class="aviso aviso--erro">Ainda faltam ${faltam} ${faltam > 1 ? 'categorias' : 'categoria'} sem revelar. A contagem considera todas.</p>` : ''}
          <div class="corrida" id="corrida">${D.membros.map((m, i) => `<div class="corrida__linha" data-id="${esc(m.id)}" style="--pos:${i}">
            <img src="${esc(m.recorte || m.foto)}" alt=""><span class="corrida__nick">${esc(m.nick)}</span>
            <span class="corrida__trilha"><i style="--p:0%"></i></span><b class="corrida__n">0</b></div>`).join('')}</div>
          <div class="c-acoes c-acoes--esq">
            <button class="btn btn--linha btn--icone" id="voltar-cat" aria-label="Voltar para a última categoria">${ic('seta-esq')}</button>
            <button class="btn btn--ouro btn--grande" id="coroar">${ic('coroa')} Revelar o ${esc(D.premioSupremo.nome)}</button>
          </div>
        </div>
      </div>
    </div>`;
    $('#voltar-cat').onclick = () => irCategoria(TOTAL - 1);
    $('#coroar').onclick = coroar;
  }

  async function coroar() {
    if (est.ocupado) return; est.ocupado = true;
    $('.imperio .c-acoes').classList.add('some');
    document.body.classList.add('escuro');
    const parar = Som.rufar(CATS.length * 0.22 + 1.2);
    const linhas = {}; $$('#corrida .corrida__linha').forEach((l) => { linhas[l.dataset.id] = l; });
    let final;
    for (let k = 1; k <= TOTAL; k++) {
      const p = placar(k); final = p;
      const max = Math.max(1, ...Object.values(p.trofeus));
      p.ordem.forEach((id, pos) => {
        const l = linhas[id]; if (!l) return;
        l.style.setProperty('--pos', pos);
        $('i', l).style.setProperty('--p', (p.trofeus[id] / max) * 100 + '%');
        const n = $('.corrida__n', l); if (n.textContent !== String(p.trofeus[id])) { n.textContent = p.trofeus[id]; n.classList.remove('pula'); void n.offsetWidth; n.classList.add('pula'); }
      });
      await espera(220);
    }
    parar();
    await espera(500);
    const topo = final.ordem[0];
    const empatados = final.ordem.filter((id) => final.trofeus[id] === final.trofeus[topo] && final.soma[id] === final.soma[topo]);
    Object.values(linhas).forEach((l) => l.classList.toggle('lider', empatados.includes(l.dataset.id)));
    Som.tocar('impacto'); flash();
    await espera(900);
    document.body.classList.remove('escuro');
    est.ocupado = false;
    mostrarImperador(empatados, final);
  }

  function mostrarImperador(ids, p) {
    fecharOverlay();
    const ms = ids.map(membro).filter(Boolean);
    const el = document.createElement('div');
    el.className = 'revelacao festa imperial'; el.setAttribute('role', 'dialog'); el.setAttribute('aria-label', D.premioSupremo.nome);
    el.innerHTML = `<div class="revelacao__raios" aria-hidden="true"></div>
      <div class="revelacao__miolo">
        <div class="revelacao__cat">${adesivo(D.premioSupremo.nome + ' ' + ano, '')}</div>
        <div class="revelacao__palco ${ms.length > 1 ? 'duplo' : ''}">
          <div class="revelacao__cartoes">${ms.map((m) => `<div class="coroado">${cartaoMembro(m, { selecionado: true })}<span class="coroado__coroa">${coroaSVG()}</span></div>`).join('')}</div>
          <div class="revelacao__trofeu trofeu-palco">${Trofeu.supremo(D.premioSupremo.nome)}</div>
        </div>
        <h2 class="revelacao__nome">${adesivo(lista(ms.map((m) => m.nick)), 'adesivo--ouro')}</h2>
        <p class="revelacao__sub">${ms.length > 1 ? 'Empate imperial. ' : ''}${p.trofeus[ids[0]]} ${p.trofeus[ids[0]] === 1 ? 'troféu' : 'troféus'} na noite. Salve o novo ${esc(D.premioSupremo.nome)}.</p>
        <div class="revelacao__acoes"><button class="btn btn--linha" data-fechar>Fechar</button><button class="btn btn--ouro" data-painel>Voltar ao painel</button></div>
      </div>`;
    document.body.appendChild(el); est.overlay = el;
    el.addEventListener('click', (e) => {
      if (e.target.closest('[data-fechar]')) fecharOverlay();
      else if (e.target.closest('[data-painel]')) { fecharOverlay(); trocar('c-painel', rPainel); }
      else if (e.target.closest('.cartao')) e.preventDefault();
    });
    Som.tocar('fanfarra');
    setTimeout(() => Som.tocar('brilho'), 1500);
    [0, 600, 1200, 2000].forEach((t, i) => setTimeout(() => confete({ x: [0.5, 0.2, 0.8, 0.5][i], y: [0.35, 0.55, 0.55, 0.3][i], quantidade: 140 }), t + 300));
  }
  function coroaSVG() {
    return `<svg viewBox="-4 -6 72 62" aria-hidden="true"><path d="M2 50 L0 12 L16 28 L32 0 L48 28 L64 12 L62 50 Z" fill="url(#tr-ouro-v)" stroke="#6b4508" stroke-width="1.5" stroke-linejoin="round"/>
      <rect x="1" y="42" width="62" height="10" rx="1.5" fill="url(#tr-ouro-h)" stroke="#6b4508"/><circle cx="32" cy="47" r="3.6" fill="#22c35a"/>
      <circle cx="15" cy="47" r="2.6" fill="#1e8cf0"/><circle cx="49" cy="47" r="2.6" fill="#1e8cf0"/>
      <circle cx="0" cy="12" r="3.2" fill="#fff3c9"/><circle cx="32" cy="0" r="3.6" fill="#fff3c9"/><circle cx="64" cy="12" r="3.2" fill="#fff3c9"/></svg>`;
  }

  /* ======================= ÍNDICE ======================= */
  function abrirIndice() {
    const m = document.createElement('div'); m.className = 'indice'; m.setAttribute('role', 'dialog'); m.setAttribute('aria-label', 'Categorias');
    m.innerHTML = `<div class="indice__caixa">
      <div class="indice__cabeca">${adesivo(`${est.reveladas.size} de ${TOTAL} reveladas`, '', 'h2')}<button class="btn btn--linha btn--icone" data-fechar aria-label="Fechar">${ic('x')}</button></div>
      <div class="revisao">${CATS.map((c, i) => {
        const rev = est.reveladas.has(c.id); const r = rev ? apurarCategoria(c) : null;
        return `<button class="revisao__item" data-cat="${i}"><span class="revisao__emblema">${Trofeu.emblema(c)}</span>
          <span class="revisao__texto"><small>${esc(c.nome)}</small><b class="${rev ? '' : 'falta'}">${rev ? esc(lista(r.vencedores.map((id) => nomeEscolha(c, id))) || 'Sem votos') : 'A revelar'}</b></span></button>`;
      }).join('')}</div>
      <div class="etapa__rodape"><button class="btn btn--linha" data-painel>Painel</button><button class="btn btn--ouro" data-imp>${ic('coroa')} ${esc(D.premioSupremo.nome)}</button></div>
    </div>`;
    const fechar = () => m.remove();
    m.addEventListener('click', (e) => {
      if (e.target === m || e.target.closest('[data-fechar]')) return fechar();
      const it = e.target.closest('[data-cat]'); if (it) { fechar(); fecharOverlay(); irCategoria(+it.dataset.cat); }
      if (e.target.closest('[data-painel]')) { fechar(); fecharOverlay(); trocar('c-painel', rPainel); }
      if (e.target.closest('[data-imp]')) { fechar(); fecharOverlay(); trocar('c-imperador', rImperador); }
    });
    document.body.appendChild(m); $('[data-fechar]', m).focus();
  }

  /* ======================= ATALHOS DE TECLADO ======================= */
  document.addEventListener('keydown', (e) => {
    if (e.target.matches('input, textarea') || est.ocupado) return;
    if (e.key === 'Escape' && est.overlay) { fecharOverlay(); if (est.tela === 'c-categoria') rCategoria(); return; }
    if (est.tela !== 'c-categoria' || est.overlay || $('.indice')) return;
    if (e.key === 'ArrowRight') irCategoria(est.idx + 1);
    if (e.key === 'ArrowLeft') irCategoria(est.idx - 1);
  });

  /* ======================= INÍCIO ======================= */
  async function iniciar() {
    Trofeu.instalar();
    window.UI.gradeCubos($('#grade'));
    window.UI.revelarCubos(true);
    window.FX.Particulas.iniciar($('#particulas'));
    const bs = $('#botao-som');
    const pinta = () => { bs.innerHTML = ic(Som.ligado ? 'volume' : 'mudo'); bs.setAttribute('aria-label', Som.ligado ? 'Desligar som' : 'Ligar som'); };
    pinta(); bs.onclick = () => { Som.alternar(); pinta(); };
    $('#botao-indice').innerHTML = ic('grade'); $('#botao-indice').onclick = abrirIndice;
    try { await B.iniciar(); } catch (err) { console.error(err); aviso('Não foi possível conectar ao Firebase.'); }
    B.aoMudarUsuario(() => { if (est.tela === 'c-portao') rPortao(); });
    mostrar('c-portao', rPortao);
  }
  iniciar();
})();
