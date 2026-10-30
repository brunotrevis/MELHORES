/* ==========================================================================
   BACKEND — login e votos.
   Modo demonstração (sem Firebase): tudo fica no navegador.
   Modo Firebase: login por link no e-mail ou Google, votos no Firestore.
   ========================================================================== */
(function () {
  const C = window.CONFIG || {};
  const VERSAO_FB = '10.12.2';
  const LS = {
    get(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} },
    del(k) { try { localStorage.removeItem(k); } catch (e) {} },
  };

  function carregar(src) {
    return new Promise((ok, erro) => {
      const s = document.createElement('script'); s.src = src; s.onload = ok; s.onerror = () => erro(new Error('Não foi possível carregar ' + src));
      document.head.appendChild(s);
    });
  }

  function hash(t) { let h = 0; for (const c of t) h = (h * 31 + c.charCodeAt(0)) | 0; return 'demo-' + Math.abs(h).toString(36); }
  const emailValido = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(e || '').trim());
  const normal = (e) => String(e || '').trim().toLowerCase();

  const B = {
    modo: C.firebase ? 'firebase' : 'demo',
    usuario: null,
    ouvintes: [],
    auth: null, db: null,
    precisaConfirmarEmail: false,

    aoMudarUsuario(fn) { this.ouvintes.push(fn); },
    _avisar() { this.ouvintes.forEach((fn) => fn(this.usuario)); },

    ehAdmin(email) {
      if (this.modo === 'demo') return true;
      return (C.admins || []).map(normal).includes(normal(email));
    },
    podeVotar(email) {
      const lista = (C.emailsPermitidos || []).map(normal);
      return !lista.length || lista.includes(normal(email));
    },

    async iniciar() {
      if (this.modo === 'demo') {
        this.usuario = LS.get('pd26:demo:usuario', null);
        this._avisar();
        return;
      }
      await carregar(`https://www.gstatic.com/firebasejs/${VERSAO_FB}/firebase-app-compat.js`);
      await carregar(`https://www.gstatic.com/firebasejs/${VERSAO_FB}/firebase-auth-compat.js`);
      await carregar(`https://www.gstatic.com/firebasejs/${VERSAO_FB}/firebase-firestore-compat.js`);
      firebase.initializeApp(C.firebase);
      this.auth = firebase.auth();
      this.db = firebase.firestore();
      await this.auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL);
      if (this.auth.isSignInWithEmailLink(location.href)) {
        const email = LS.get('pd26:emailParaLink', null);
        if (email) await this.concluirLink(email);
        else this.precisaConfirmarEmail = true;
      }
      await new Promise((ok) => {
        let primeiro = true;
        this.auth.onAuthStateChanged((u) => {
          this.usuario = u ? { uid: u.uid, email: u.email } : null;
          this._avisar();
          if (primeiro) { primeiro = false; ok(); }
        });
      });
    },

    async concluirLink(email) {
      await this.auth.signInWithEmailLink(normal(email), location.href);
      LS.del('pd26:emailParaLink');
      this.precisaConfirmarEmail = false;
      history.replaceState(null, '', location.pathname + '#/entrar');
    },

    async enviarLink(email) {
      email = normal(email);
      if (!emailValido(email)) throw new Error('Digite um e-mail válido, tipo nome@gmail.com.');
      if (!this.podeVotar(email)) throw new Error('Este e-mail não está na lista do clã. Fale com o Cabalístico.');
      if (this.modo === 'demo') return this.entrarDemo(email);
      await this.auth.sendSignInLinkToEmail(email, { url: location.origin + location.pathname, handleCodeInApp: true });
      LS.set('pd26:emailParaLink', email);
      return 'link-enviado';
    },

    async entrarGoogle() {
      if (this.modo === 'demo') throw new Error('No modo demonstração, entre digitando qualquer e-mail.');
      const prov = new firebase.auth.GoogleAuthProvider();
      prov.setCustomParameters({ prompt: 'select_account' });
      const r = await this.auth.signInWithPopup(prov);
      if (!this.podeVotar(r.user.email)) { await this.auth.signOut(); throw new Error('Este e-mail não está na lista do clã.'); }
    },

    entrarDemo(email) {
      this.usuario = { uid: hash(normal(email)), email: normal(email) };
      LS.set('pd26:demo:usuario', this.usuario);
      this._avisar();
      return 'entrou';
    },

    async sair() {
      if (this.modo === 'demo') { LS.del('pd26:demo:usuario'); this.usuario = null; this._avisar(); return; }
      await this.auth.signOut();
    },

    async meuVoto() {
      if (!this.usuario) return null;
      if (this.modo === 'demo') return LS.get('pd26:demo:votos', {})[this.usuario.uid] || null;
      const d = await this.db.collection('votos').doc(this.usuario.uid).get();
      return d.exists ? d.data() : null;
    },

    async enviarVotos({ membro, respostas }) {
      if (!this.usuario) throw new Error('Entre com seu e-mail antes de enviar.');
      const doc = { email: this.usuario.email, membro: membro || null, respostas, versao: 1 };
      if (this.modo === 'demo') {
        const todos = LS.get('pd26:demo:votos', {});
        if (todos[this.usuario.uid]) throw new Error('Este e-mail já lacrou os votos.');
        todos[this.usuario.uid] = { ...doc, enviadoEm: new Date().toISOString() };
        LS.set('pd26:demo:votos', todos);
        return;
      }
      const ref = this.db.collection('votos').doc(this.usuario.uid);
      const atual = await ref.get();
      if (atual.exists) throw new Error('Este e-mail já lacrou os votos.');
      await ref.set({ ...doc, enviadoEm: firebase.firestore.FieldValue.serverTimestamp() });
    },

    /* Só para a cerimônia (admins) */
    async todosVotos() {
      if (this.modo === 'demo') return Object.entries(LS.get('pd26:demo:votos', {})).map(([uid, v]) => ({ uid, ...v }));
      const snap = await this.db.collection('votos').get();
      return snap.docs.map((d) => {
        const v = d.data();
        const t = v.enviadoEm && v.enviadoEm.toDate ? v.enviadoEm.toDate().toISOString() : v.enviadoEm || null;
        return { uid: d.id, ...v, enviadoEm: t };
      });
    },

    /* Modo demonstração: gera votos aleatórios para testar a cerimônia */
    demoGerarVotos(dados, quantos = 9) {
      const todos = LS.get('pd26:demo:votos', {});
      const membros = dados.membros.map((m) => m.id);
      for (let i = 0; i < quantos; i++) {
        const quem = membros[i % membros.length];
        const respostas = {};
        dados.categorias.forEach((cat) => {
          const ids = cat.tipo === 'opcoes' ? cat.opcoes.map((o) => o.id) : (cat.indicados || membros);
          const peso = ids.map((_, j) => 1 + ((j * 7 + cat.id.length) % 5));
          let r = Math.random() * peso.reduce((a, b) => a + b, 0);
          respostas[cat.id] = ids[peso.findIndex((p) => (r -= p) < 0)];
        });
        todos['teste-' + i + '-' + Date.now().toString(36)] = { email: `teste${i + 1}@demo.local`, membro: quem, respostas, versao: 1, enviadoEm: new Date().toISOString(), teste: true };
      }
      LS.set('pd26:demo:votos', todos);
    },
    demoLimpar() { LS.del('pd26:demo:votos'); },

    LS, emailValido,
  };

  window.Backend = B;
})();
