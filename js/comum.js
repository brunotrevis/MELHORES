/* ==========================================================================
   COMUM — peças compartilhadas entre a votação e a cerimônia
   ========================================================================== */
(function () {
  const D = window.DADOS;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const ic = (nome, extra = '') => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" ${extra}>${(window.ICONES || {})[nome] || ''}</svg>`;
  const membro = (id) => D.membros.find((m) => m.id === id);
  const categoria = (id) => D.categorias.find((c) => c.id === id);
  const adesivo = (texto, classe = '', tag = 'span') => `<${tag} class="adesivo ${classe}" data-texto="${esc(texto)}">${esc(texto)}</${tag}>`;

  /* Tamanho do nick no cartão (cabe sem quebrar) */
  function tamanhoNick(nick) { return `font-size:min(15cqw, ${Math.round(200 / Math.max(6, nick.length))}cqw)`; }

  function nomeEscolha(cat, id) {
    if (!id) return '';
    if (cat.tipo === 'opcoes') { const o = (cat.opcoes || []).find((x) => x.id === id); return o ? o.titulo : id; }
    const m = membro(id); return m ? m.nick : id;
  }

  function indicados(cat, eu) {
    if (cat.tipo === 'opcoes') return cat.opcoes || [];
    let lista = cat.indicados ? cat.indicados.map(membro).filter(Boolean) : D.membros.slice();
    if (eu && window.CONFIG && window.CONFIG.votoEmSiMesmo === false) lista = lista.filter((m) => m.id !== eu);
    return lista;
  }

  /* -------- Cartão de membro -------- */
  function cartaoMembro(m, o = {}) {
    const img = m.recorte || m.foto;
    const plena = !m.recorte;
    return `<button type="button" class="cartao ${o.classe || ''}" data-id="${esc(m.id)}" aria-pressed="${o.selecionado ? 'true' : 'false'}" style="container-type:inline-size" aria-label="${esc(m.nick)}, ${esc(m.nome)}">
      <span class="cartao__dentro">
        <span class="cartao__nick-fundo" aria-hidden="true">${esc(m.nick)}</span>
        <img class="cartao__foto ${plena ? 'cartao__foto--plena' : ''}" src="${esc(img)}" alt="" loading="lazy" draggable="false">
        <span class="cartao__rodape">
          <span class="adesivo cartao__nick" data-texto="${esc(m.nick)}" style="${tamanhoNick(m.nick)}">${esc(m.nick)}</span>
          ${o.semNome ? '' : `<span class="cartao__nome">${esc(m.nome)}</span>`}
        </span>
        <span class="cartao__brilho"></span>
      </span>
      ${o.tag ? `<span class="cartao__tag">${esc(o.tag)}</span>` : ''}
      <span class="cartao__selo" aria-hidden="true">${ic('check')}</span>
    </button>`;
  }

  /* -------- Player de áudio com forma de onda -------- */
  function player(src, onda, o = {}) {
    const barras = (onda && onda.length ? onda : Array.from({ length: 40 }, (_, i) => 0.25 + 0.6 * Math.abs(Math.sin(i * 1.7) * Math.cos(i * 0.6))))
      .map((v) => `<i style="--h:${Math.max(0.08, v)}"></i>`).join('');
    return `<div class="player ${o.grande ? 'player--grande' : ''}" data-src="${esc(src)}">
      <span class="player__botao" role="button" tabindex="0" aria-label="Ouvir ${esc(o.rotulo || 'áudio')}">${ic('play', 'class="i-play" fill="currentColor"')}${ic('pause', 'class="i-pause"')}</span>
      <span class="player__onda" aria-hidden="true">${barras}</span>
      <span class="player__tempo">${o.dur ? fmt(o.dur) : ''}</span>
    </div>`;
  }
  const fmt = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

  const Audio_ = {
    el: null, atual: null,
    tocar(playerEl) {
      const src = playerEl.dataset.src;
      if (this.atual === playerEl && this.el && !this.el.paused) { this.el.pause(); return; }
      this.parar();
      this.el = new Audio(src); this.atual = playerEl;
      const barras = $$('.player__onda i', playerEl), tempo = $('.player__tempo', playerEl);
      playerEl.classList.add('tocando'); FX.Trilha.abaixar(true);
      this.el.addEventListener('timeupdate', () => {
        const p = this.el.currentTime / (this.el.duration || 1);
        barras.forEach((b, i) => b.classList.toggle('passou', i / barras.length <= p));
        if (tempo) tempo.textContent = fmt(this.el.currentTime);
      });
      const fim = () => { FX.Trilha.abaixar(false); playerEl.classList.remove('tocando'); barras.forEach((b) => b.classList.remove('passou')); if (tempo && this.el) tempo.textContent = fmt(this.el.duration || 0); };
      this.el.addEventListener('ended', fim); this.el.addEventListener('pause', () => { playerEl.classList.remove('tocando'); if (!this.el || this.el.paused) FX.Trilha.abaixar(false); });
      this.el.play().catch(() => { fim(); FX.aviso('Não foi possível tocar este áudio.'); });
    },
    parar() { if (this.el) { this.el.pause(); this.el = null; } if (this.atual) { this.atual.classList.remove('tocando'); $$('.player__onda i', this.atual).forEach((b) => b.classList.remove('passou')); } this.atual = null; },
  };
  document.addEventListener('click', (e) => {
    const b = e.target.closest('.player__botao');
    if (b) { e.stopPropagation(); e.preventDefault(); Audio_.tocar(b.closest('.player')); }
  }, true);
  document.addEventListener('keydown', (e) => {
    const b = e.target.closest && e.target.closest('.player__botao');
    if (b && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); Audio_.tocar(b.closest('.player')); }
  });

  /* -------- Vídeo (mp4 ou YouTube) -------- */
  function youtube(url) {
    const m = String(url).match(/(?:youtu\.be\/|v=|shorts\/|embed\/)([\w-]{11})/);
    return m ? m[1] : null;
  }
  function abrirVideo(url) {
    Audio_.parar();
    const yt = youtube(url);
    const corpo = yt ? `<iframe src="https://www.youtube.com/embed/${yt}?autoplay=1&rel=0" allow="autoplay; encrypted-media; fullscreen" allowfullscreen title="Vídeo"></iframe>`
      : `<video src="${esc(url)}" controls autoplay playsinline></video>`;
    const m = document.createElement('div'); m.className = 'modal'; m.setAttribute('role', 'dialog'); m.setAttribute('aria-label', 'Vídeo');
    m.innerHTML = `<div class="modal__caixa">${corpo}<button class="btn btn--linha btn--icone modal__fechar" aria-label="Fechar">${ic('x')}</button></div>`;
    FX.Trilha.abaixar(true);
    const fechar = () => { m.remove(); document.removeEventListener('keydown', esc_); FX.Trilha.abaixar(false); };
    const esc_ = (e) => { if (e.key === 'Escape') fechar(); };
    m.addEventListener('click', (e) => { if (e.target === m || e.target.closest('.modal__fechar')) fechar(); });
    document.addEventListener('keydown', esc_);
    document.body.appendChild(m); $('.modal__fechar', m).focus();
  }

  /* -------- Cartão de opção (frase, áudio, vídeo...) -------- */
  function cartaoOpcao(cat, o, opts = {}) {
    const autor = o.autor ? membro(o.autor) : null;
    let midia = '';
    if (o.audio) midia = player(o.audio, o.onda, { rotulo: o.titulo, grande: true });
    else if (o.video) {
      const yt = youtube(o.video);
      const capa = o.imagem ? `<img src="${esc(o.imagem)}" alt="">` : yt ? `<img src="https://i.ytimg.com/vi/${yt}/hqdefault.jpg" alt="">` : `<video src="${esc(o.video)}#t=0.5" muted playsinline preload="metadata"></video>`;
      midia = `<span class="video-capa" data-video="${esc(o.video)}" role="button" tabindex="0" aria-label="Assistir ${esc(o.titulo)}">${capa}<span>${ic('video-play', 'fill="currentColor" stroke="none"')}</span></span>`;
    } else if (/video|pubg|fifa/.test(cat.icone) && o.provisorio) {
      midia = `<span class="video-capa" aria-hidden="true"><span>${ic('video-play', 'fill="currentColor" stroke="none"')}</span><small>Vídeo a enviar</small></span>`;
    } else if (o.imagem) {
      midia = `<span class="video-capa"><img src="${esc(o.imagem)}" alt=""></span>`;
    }
    const aspas = !o.audio && !o.video && !(/video|pubg|fifa/.test(cat.icone)) ? `<svg class="opcao__aspas" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONES.frase}</svg>` : '';
    const tipo = o.audio ? 'audio' : (o.video || /video|pubg|fifa/.test(cat.icone)) ? 'video' : 'texto';
    return `<button type="button" class="opcao opcao--${tipo}" data-id="${esc(o.id)}" aria-pressed="${opts.selecionado ? 'true' : 'false'}">
      <span class="opcao__dentro">
        ${aspas}
        <span class="opcao__titulo">${esc(o.titulo)}</span>
        ${midia}
        ${autor ? `<span class="opcao__autor"><img src="${esc(autor.recorte || autor.foto)}" alt="">${esc(autor.nick)}</span>` : ''}
        ${o.provisorio ? '<span class="opcao__provisorio">Indicação provisória</span>' : ''}
      </span>
      <span class="cartao__selo" aria-hidden="true">${ic('check')}</span>
    </button>`;
  }
  document.addEventListener('click', (e) => {
    const v = e.target.closest('[data-video]');
    if (v) { e.stopPropagation(); e.preventDefault(); abrirVideo(v.dataset.video); }
  }, true);

  /* -------- Arrastar com o mouse em trilhos horizontais -------- */
  function arrastavel(trilho) {
    let x0 = 0, s0 = 0, ativo = false, moveu = false;
    trilho.addEventListener('pointerdown', (e) => {
      if (e.pointerType !== 'mouse' || e.button !== 0) return;
      ativo = true; moveu = false; x0 = e.clientX; s0 = trilho.scrollLeft;
    });
    window.addEventListener('pointermove', (e) => {
      if (!ativo) return;
      const dx = e.clientX - x0;
      if (Math.abs(dx) > 5) { moveu = true; trilho.classList.add('arrastando'); }
      if (moveu) trilho.scrollLeft = s0 - dx;
    });
    window.addEventListener('pointerup', () => {
      if (!ativo) return; ativo = false;
      if (moveu) {
        trilho.classList.remove('arrastando');
        const bloqueia = (ev) => { ev.stopPropagation(); ev.preventDefault(); };
        trilho.addEventListener('click', bloqueia, { capture: true, once: true });
        setTimeout(() => trilho.removeEventListener('click', bloqueia, { capture: true }), 50);
      }
    });
  }

  /* -------- Grade de cubos do palco -------- */
  function gradeCubos(svg) {
    if (!svg) return;
    const d = 'M34.64 0.00 L69.28 20.00 L69.28 60.00 L34.64 80.00 L0.00 60.00 L0.00 20.00 Z M34.64 40.00 L0.00 20.00 M34.64 40.00 L69.28 20.00 M34.64 40.00 L34.64 80.00 M0.00 60.00 L34.64 80.00 L34.64 120.00 L0.00 140.00 L-34.64 120.00 L-34.64 80.00 Z M0.00 100.00 L-34.64 80.00 M0.00 100.00 L34.64 80.00 M0.00 100.00 L0.00 140.00 M69.28 60.00 L103.92 80.00 L103.92 120.00 L69.28 140.00 L34.64 120.00 L34.64 80.00 Z M69.28 100.00 L34.64 80.00 M69.28 100.00 L103.92 80.00 M69.28 100.00 L69.28 140.00 M0.00 -60.00 L34.64 -40.00 L34.64 0.00 L0.00 20.00 L-34.64 0.00 L-34.64 -40.00 Z M0.00 -20.00 L-34.64 -40.00 M0.00 -20.00 L34.64 -40.00 M0.00 -20.00 L0.00 20.00 M69.28 -60.00 L103.92 -40.00 L103.92 0.00 L69.28 20.00 L34.64 0.00 L34.64 -40.00 Z M69.28 -20.00 L34.64 -40.00 M69.28 -20.00 L103.92 -40.00 M69.28 -20.00 L69.28 20.00';
    svg.innerHTML = `<defs><pattern id="cubos" width="69.282" height="120" patternUnits="userSpaceOnUse" patternTransform="scale(1.15)">
      <path d="${d}" fill="none" stroke="#5aa2ff" stroke-opacity=".16" stroke-width="1"/></pattern>
      <radialGradient id="cubos-revela"><stop offset="0" stop-color="#fff"/><stop offset=".7" stop-color="#fff"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>
      <mask id="cubos-mascara"><circle id="cubos-circulo" cx="50%" cy="45%" r="0" fill="url(#cubos-revela)"/></mask></defs>
      <rect width="100%" height="100%" fill="url(#cubos)" mask="url(#cubos-mascara)"/>`;
  }
  function revelarCubos(instantaneo) {
    const c = document.getElementById('cubos-circulo'); if (!c) return;
    if (instantaneo || FX.reduz) { c.setAttribute('r', '150%'); return; }
    const t0 = performance.now(), dur = 2200;
    (function passo(t) { const p = Math.max(0, Math.min(1, (t - t0) / dur)), e = 1 - Math.pow(1 - p, 3); c.setAttribute('r', (e * 150) + '%'); if (p < 1) requestAnimationFrame(passo); })(t0);
  }

  function dataBR(iso, comHora = true) {
    if (!iso) return null;
    const d = new Date(iso); if (isNaN(d)) return null;
    const dia = d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' });
    return comHora ? `${dia}, às ${d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}` : dia;
  }

  window.UI = { $, $$, esc, ic, membro, categoria, adesivo, cartaoMembro, cartaoOpcao, player, Audio: Audio_, abrirVideo, arrastavel, gradeCubos, revelarCubos, indicados, nomeEscolha, dataBR, tamanhoNick };
})();
