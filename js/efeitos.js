/* ==========================================================================
   EFEITOS — som sintetizado, partículas de gelo, cortina de transição,
   confete, carimbo e avisos.
   ========================================================================== */
(function () {
  const reduz = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------------- SOM (Web Audio, sem arquivos) ---------------- */
  const Som = {
    ctx: null, ligado: true,
    init() {
      try { this.ligado = localStorage.getItem('pd26:som') !== '0'; } catch (e) {}
    },
    garantir() {
      if (!this.ctx) {
        const C = window.AudioContext || window.webkitAudioContext;
        if (!C) return null;
        this.ctx = new C();
      }
      if (this.ctx.state === 'suspended') this.ctx.resume();
      return this.ctx;
    },
    alternar() {
      this.ligado = !this.ligado;
      try { localStorage.setItem('pd26:som', this.ligado ? '1' : '0'); } catch (e) {}
      if (this.ligado) Trilha.tocar(); else Trilha.parar();
      return this.ligado;
    },
    _osc(tipo, freq, t0, dur, vol, ate) {
      const c = this.ctx, o = c.createOscillator(), g = c.createGain();
      o.type = tipo; o.frequency.setValueAtTime(freq, t0);
      if (ate) o.frequency.exponentialRampToValueAtTime(ate, t0 + dur);
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.exponentialRampToValueAtTime(vol, t0 + 0.012);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      o.connect(g).connect(c.destination); o.start(t0); o.stop(t0 + dur + 0.05);
    },
    _ruido(t0, dur, vol, de, ate, tipo = 'bandpass') {
      const c = this.ctx, n = c.sampleRate * dur, buf = c.createBuffer(1, n, c.sampleRate), d = buf.getChannelData(0);
      for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
      const s = c.createBufferSource(); s.buffer = buf;
      const f = c.createBiquadFilter(); f.type = tipo; f.Q.value = 0.8;
      f.frequency.setValueAtTime(de, t0); f.frequency.exponentialRampToValueAtTime(ate, t0 + dur);
      const g = c.createGain(); g.gain.setValueAtTime(0.0001, t0);
      g.gain.exponentialRampToValueAtTime(vol, t0 + dur * 0.3); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      s.connect(f).connect(g).connect(c.destination); s.start(t0); s.stop(t0 + dur);
    },
    tocar(nome) {
      if (!this.ligado || !this.garantir()) return;
      const t = this.ctx.currentTime + 0.01;
      switch (nome) {
        case 'clique': this._osc('triangle', 880, t, 0.08, 0.08, 1320); break;
        case 'seleciona': this._osc('triangle', 660, t, 0.1, 0.1); this._osc('triangle', 990, t + 0.06, 0.14, 0.09); break;
        case 'whoosh': this._ruido(t, 0.5, 0.22, 400, 4200); break;
        case 'carimbo':
          this._osc('sine', 140, t, 0.35, 0.5, 45); this._ruido(t, 0.12, 0.35, 2500, 600, 'lowpass');
          this._osc('triangle', 784, t + 0.05, 0.25, 0.08); this._osc('triangle', 1175, t + 0.12, 0.35, 0.08); break;
        case 'impacto': this._osc('sine', 110, t, 0.9, 0.6, 38); this._ruido(t, 0.4, 0.25, 3000, 300, 'lowpass'); break;
        case 'fanfarra': {
          const notas = [523.25, 659.25, 783.99, 1046.5];
          notas.forEach((f, i) => { this._osc('sawtooth', f, t + i * 0.11, 0.5, 0.05); this._osc('triangle', f, t + i * 0.11, 0.6, 0.08); });
          [523.25, 659.25, 783.99, 1046.5].forEach((f) => { this._osc('sawtooth', f, t + 0.5, 1.4, 0.035); this._osc('triangle', f / 2, t + 0.5, 1.6, 0.06); });
          break;
        }
        case 'brilho': [1568, 2093, 2637].forEach((f, i) => this._osc('sine', f, t + i * 0.07, 0.4, 0.05)); break;
      }
    },
    /* rufar de tambor (para revelações) — devolve função para parar */
    rufar(duracao = 3) {
      if (!this.ligado || !this.garantir()) return () => {};
      Trilha.abaixar(true); setTimeout(() => Trilha.abaixar(false), duracao * 1000 + 2500);
      const c = this.ctx, t0 = c.currentTime + 0.02;
      let parado = false; const fontes = [];
      const passos = Math.floor(duracao / 0.045);
      for (let i = 0; i < passos; i++) {
        const t = t0 + i * 0.045, vol = 0.04 + 0.22 * (i / passos);
        const n = c.sampleRate * 0.05, buf = c.createBuffer(1, n, c.sampleRate), d = buf.getChannelData(0);
        for (let j = 0; j < n; j++) d[j] = (Math.random() * 2 - 1) * Math.exp(-j / (n * 0.25));
        const s = c.createBufferSource(); s.buffer = buf;
        const f = c.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 900 + Math.random() * 200; f.Q.value = 0.6;
        const g = c.createGain(); g.gain.value = vol;
        s.connect(f).connect(g).connect(c.destination); s.start(t); fontes.push(s);
      }
      return () => { if (parado) return; parado = true; const agora = c.currentTime; fontes.forEach((s) => { try { s.stop(agora); } catch (e) {} }); };
    },
  };

  /* ---------------- TRILHA DE FUNDO (loop, abaixa sozinha) ---------------- */
  const Trilha = {
    src: null, base: 0.35, el: null, g: null, abaixada: false, tocando: false,
    configurar(src, vol) { this.src = src || null; if (vol != null) this.base = vol; },
    tocar() {
      if (!this.src || !Som.ligado) return;
      const ctx = Som.garantir();
      if (!this.el) {
        this.el = new Audio(this.src); this.el.loop = true; this.el.preload = 'auto';
        if (ctx && location.protocol !== 'file:') {
          try { const no = ctx.createMediaElementSource(this.el); this.g = ctx.createGain(); this.g.gain.value = 0; no.connect(this.g).connect(ctx.destination); } catch (e) { this.g = null; }
        }
        if (!this.g) this.el.volume = 0;
      }
      this.tocando = true;
      const p = this.el.play(); if (p) p.catch(() => { this.tocando = false; });
      this._volume(this.abaixada ? 0.12 : 1, 2.5);
    },
    parar() { this.tocando = false; if (!this.el) return; this._volume(0, 0.5); setTimeout(() => { if (!this.tocando && this.el) this.el.pause(); }, 550); },
    abaixar(sim) { this.abaixada = sim; if (this.el && this.tocando) this._volume(sim ? 0.12 : 1, sim ? 0.35 : 1.4); },
    _volume(fator, seg) {
      const v = this.base * fator;
      if (this.g && Som.ctx) {
        const t = Som.ctx.currentTime, gg = this.g.gain;
        gg.cancelScheduledValues(t); gg.setValueAtTime(gg.value, t); gg.linearRampToValueAtTime(v, t + seg);
      } else if (this.el) {
        clearInterval(this._iv); const v0 = this.el.volume, n = Math.max(1, Math.round(seg * 20)); let i = 0;
        this._iv = setInterval(() => { i++; try { this.el.volume = Math.max(0, Math.min(1, v0 + (v - v0) * (i / n))); } catch (e) {} if (i >= n) clearInterval(this._iv); }, 50);
      }
    },
  };

  /* ---------------- PARTÍCULAS DE GELO NO PALCO ---------------- */
  const Particulas = {
    iniciar(canvas) {
      if (reduz || !canvas) return;
      const ctx = canvas.getContext('2d');
      let w, h, dpr; const ps = [];
      const ajusta = () => { dpr = Math.min(2, window.devicePixelRatio || 1); w = canvas.clientWidth; h = canvas.clientHeight; canvas.width = w * dpr; canvas.height = h * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); };
      ajusta(); window.addEventListener('resize', ajusta);
      const qtd = Math.round(Math.min(70, (w * h) / 22000));
      for (let i = 0; i < qtd; i++) ps.push(nova(true));
      function nova(inicio) {
        return { x: Math.random() * w, y: inicio ? Math.random() * h : h + 10, r: 0.6 + Math.random() * 1.8, v: 0.12 + Math.random() * 0.35,
          o: 0.15 + Math.random() * 0.55, f: Math.random() * Math.PI * 2, ouro: Math.random() < 0.18 };
      }
      let ativo = true;
      document.addEventListener('visibilitychange', () => { ativo = !document.hidden; if (ativo) requestAnimationFrame(passo); });
      function passo() {
        if (!ativo) return;
        ctx.clearRect(0, 0, w, h);
        for (const p of ps) {
          p.y -= p.v; p.f += 0.01; p.x += Math.sin(p.f) * 0.25;
          if (p.y < -10) Object.assign(p, nova(false));
          const brilha = p.o * (0.6 + 0.4 * Math.sin(p.f * 3));
          ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
          ctx.fillStyle = p.ouro ? `rgba(255,214,120,${brilha})` : `rgba(190,220,255,${brilha})`; ctx.fill();
          if (p.r > 1.7) { ctx.fillStyle = p.ouro ? `rgba(255,214,120,${brilha * 0.15})` : `rgba(140,190,255,${brilha * 0.15})`; ctx.beginPath(); ctx.arc(p.x, p.y, p.r * 4, 0, Math.PI * 2); ctx.fill(); }
        }
        requestAnimationFrame(passo);
      }
      requestAnimationFrame(passo);
    },
  };

  /* ---------------- CORTINA DE TRANSIÇÃO ---------------- */
  const Cortina = {
    el: null,
    passar(meio) {
      if (!this.el) {
        this.el = document.createElement('div'); this.el.className = 'cortina'; this.el.setAttribute('aria-hidden', 'true');
        this.el.innerHTML = '<i></i><i></i><i></i><img src="assets/img/logo-256.png" alt="">';
        document.body.appendChild(this.el);
      }
      if (reduz) { meio && meio(); return Promise.resolve(); }
      Som.tocar('whoosh');
      const el = this.el;
      el.classList.remove('vai'); void el.offsetWidth; el.classList.add('vai');
      return new Promise((res) => {
        setTimeout(() => { meio && meio(); }, 480);
        setTimeout(() => { el.classList.remove('vai'); res(); }, 1150);
      });
    },
  };

  /* ---------------- CONFETE ---------------- */
  function confete(opts = {}) {
    if (reduz) return;
    const cv = document.createElement('canvas'); cv.className = 'confete'; document.body.appendChild(cv);
    const ctx = cv.getContext('2d'); const dpr = Math.min(2, devicePixelRatio || 1);
    const W = cv.width = innerWidth * dpr, H = cv.height = innerHeight * dpr;
    const cores = opts.cores || ['#f2c14e', '#ffe7a3', '#1e8cf0', '#a9ccf2', '#ffffff', '#c88d1c'];
    const n = opts.quantidade || 160; const ps = [];
    const ox = (opts.x != null ? opts.x : 0.5) * W, oy = (opts.y != null ? opts.y : 0.45) * H;
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2, v = (4 + Math.random() * 11) * dpr;
      ps.push({ x: ox, y: oy, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 6 * dpr, g: 0.22 * dpr, w: (5 + Math.random() * 7) * dpr, h: (3 + Math.random() * 5) * dpr,
        r: Math.random() * 6, vr: (Math.random() - 0.5) * 0.3, c: cores[(Math.random() * cores.length) | 0], vida: 0 });
    }
    let t = 0;
    (function passo() {
      t++; ctx.clearRect(0, 0, W, H);
      for (const p of ps) {
        p.vx *= 0.985; p.vy = p.vy * 0.985 + p.g; p.x += p.vx; p.y += p.vy; p.r += p.vr;
        ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.r); ctx.scale(1, Math.cos(p.r * 2));
        ctx.fillStyle = p.c; ctx.globalAlpha = Math.max(0, 1 - t / 220); ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h); ctx.restore();
      }
      if (t < 220) requestAnimationFrame(passo); else cv.remove();
    })();
  }

  /* ---------------- CARIMBO ---------------- */
  function carimbo(texto, alvo) {
    const el = document.createElement('div');
    el.className = 'carimbo adesivo adesivo--ouro'; el.textContent = texto; el.dataset.texto = texto; el.setAttribute('aria-hidden', 'true');
    document.body.appendChild(el);
    Som.tocar('carimbo');
    requestAnimationFrame(() => el.classList.add('vai'));
    if (alvo && !reduz) { setTimeout(() => { alvo.classList.remove('treme'); void alvo.offsetWidth; alvo.classList.add('treme'); }, 200); }
    setTimeout(() => el.remove(), 1100);
  }

  /* ---------------- AVISO (toast) ---------------- */
  let toastEl, toastT;
  function aviso(msg) {
    if (!toastEl) { toastEl = document.createElement('div'); toastEl.className = 'toast'; toastEl.setAttribute('role', 'status'); document.body.appendChild(toastEl); }
    toastEl.textContent = msg; toastEl.classList.add('ve');
    clearTimeout(toastT); toastT = setTimeout(() => toastEl.classList.remove('ve'), 3200);
  }

  Som.init();
  Trilha.configurar(window.DADOS && DADOS.evento && DADOS.evento.trilha, window.DADOS && DADOS.evento && DADOS.evento.volumeTrilha);
  // em qualquer página, a música começa no primeiro toque (exigência dos navegadores)
  document.addEventListener('pointerdown', () => { if (!Trilha.tocando && !document.body.classList.contains('pagina-cerimonia')) Trilha.tocar(); }, { once: true, capture: true });
  window.FX = { Som, Trilha, Particulas, Cortina, confete, carimbo, aviso, reduz };
})();
