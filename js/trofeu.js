/* ==========================================================================
   TROFÉUS — estatueta dourada do Pinguim Doidim sobre pedestal laqueado,
   com emblema da categoria e placa gravada. Gerados em SVG.
   ========================================================================== */
(function () {
  const IMG_OURO = 'assets/img/mascote-ouro.png';
  const IMG_CRISTAL = 'assets/img/mascote-cristal.png';

  const DEFS = `
  <svg width="0" height="0" style="position:absolute" aria-hidden="true" focusable="false">
    <defs>
      <linearGradient id="tr-ouro-v" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#fff3c9"/><stop offset=".3" stop-color="#f6cd5a"/>
        <stop offset=".62" stop-color="#b57d16"/><stop offset=".85" stop-color="#ffe08a"/><stop offset="1" stop-color="#c48a1a"/>
      </linearGradient>
      <linearGradient id="tr-ouro-h" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stop-color="#8f600f"/><stop offset=".35" stop-color="#ffe7a3"/>
        <stop offset=".7" stop-color="#c88d1c"/><stop offset=".9" stop-color="#fff3c9"/><stop offset="1" stop-color="#8f600f"/>
      </linearGradient>
      <linearGradient id="tr-laca" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stop-color="#091330"/><stop offset=".2" stop-color="#1d3166"/>
        <stop offset=".46" stop-color="#070d1e"/><stop offset=".8" stop-color="#11214a"/><stop offset="1" stop-color="#040812"/>
      </linearGradient>
      <linearGradient id="tr-reflexo" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#fff" stop-opacity=".16"/><stop offset=".45" stop-color="#fff" stop-opacity="0"/>
      </linearGradient>
      <radialGradient id="tr-medalha" cx=".4" cy=".35" r=".8">
        <stop offset="0" stop-color="#1d55bd"/><stop offset=".6" stop-color="#0a2259"/><stop offset="1" stop-color="#050f2a"/>
      </radialGradient>
      <linearGradient id="tr-brilho" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".5" stop-color="#fff" stop-opacity=".85"/><stop offset="1" stop-color="#fff" stop-opacity="0"/>
      </linearGradient>
      <linearGradient id="tr-gelo" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stop-color="#0a2a66"/><stop offset=".22" stop-color="#4f9ef0"/><stop offset=".42" stop-color="#e3f2ff"/>
        <stop offset=".62" stop-color="#2b6fd0"/><stop offset=".85" stop-color="#7fc0ff"/><stop offset="1" stop-color="#0a2050"/>
      </linearGradient>
      <radialGradient id="tr-sombra" cx=".5" cy=".5" r=".5">
        <stop offset="0" stop-color="#000" stop-opacity=".7"/><stop offset="1" stop-color="#000" stop-opacity="0"/>
      </radialGradient>
      <radialGradient id="lacre-cera" cx=".38" cy=".32" r=".75">
        <stop offset="0" stop-color="#3d8cff"/><stop offset=".55" stop-color="#0b4fb8"/><stop offset="1" stop-color="#062466"/>
      </radialGradient>
      <path id="lacre-arco" d="M40 100 A60 60 0 0 1 160 100" fill="none"/>
      <mask id="tr-mascara-ouro" maskUnits="userSpaceOnUse" x="0" y="-60" width="240" height="440" style="mask-type:alpha">
        <image href="${IMG_OURO}" x="24" y="8" width="192" height="154"/>
      </mask>
      <mask id="tr-mascara-cristal" maskUnits="userSpaceOnUse" x="0" y="-60" width="240" height="440" style="mask-type:alpha">
        <image href="${IMG_CRISTAL}" x="24" y="8" width="192" height="154"/>
      </mask>
    </defs>
  </svg>`;

  function instalar() {
    if (document.getElementById('tr-ouro-v')) return;
    document.body.insertAdjacentHTML('afterbegin', DEFS);
  }

  function linhas(nome) {
    const n = nome.toUpperCase().trim();
    const m = n.match(/^(.*)\s+(DO ANO)$/);
    if (m) return [m[1], m[2]];
    const p = n.split(/\s+/);
    if (p.length === 1) return [n, ''];
    let melhor = [n, ''], dif = Infinity;
    for (let i = 1; i < p.length; i++) {
      const a = p.slice(0, i).join(' '), b = p.slice(i).join(' ');
      const d = Math.abs(a.length - b.length);
      if (d < dif) { dif = d; melhor = [a, b]; }
    }
    return melhor;
  }

  function esc(s) { return String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }

  function textoPlaca(t, y, tamanho, max) {
    if (!t) return '';
    const estimado = t.length * tamanho * 0.43;
    const ajuste = estimado > max ? ` textLength="${max}" lengthAdjust="spacingAndGlyphs"` : '';
    const estilo = `font-family:Saira,sans-serif;font-weight:800;font-stretch:68%;font-size:${tamanho}px;letter-spacing:.02em`;
    return `<text x="120" y="${y + 0.9}" text-anchor="middle" style="${estilo}" fill="#fff5d6" fill-opacity=".55"${ajuste}>${esc(t)}</text>
            <text x="120" y="${y}" text-anchor="middle" style="${estilo}" fill="#3b2504"${ajuste}>${esc(t)}</text>`;
  }

  function icone(nome, cx, cy, tam, cor) {
    const corpo = (window.ICONES && window.ICONES[nome]) || window.ICONES.trofeu;
    const s = tam / 24;
    return `<g transform="translate(${cx - tam / 2} ${cy - tam / 2}) scale(${s})" fill="none" stroke="${cor}" stroke-width="${tam > 27 ? 1.9 : 1.75}" stroke-linecap="round" stroke-linejoin="round">${corpo}</g>`;
  }

  /* Troféu de categoria */
  function svg(cat, opts = {}) {
    const [l1, l2] = linhas(opts.placa || cat.nome);
    const atraso = opts.atraso != null ? opts.atraso : Math.random() * 3;
    const rotulo = esc('Troféu ' + cat.nome);
    return `<svg class="trofeu" viewBox="0 0 240 360" role="img" aria-label="${rotulo}">
      <ellipse cx="120" cy="334" rx="118" ry="14" fill="url(#tr-sombra)"/>
      <path d="M12 334 H228 L220 314 H20 Z" fill="url(#tr-laca)"/>
      <path d="M12 334 H228 L220 314 H20 Z" fill="url(#tr-reflexo)"/>
      <rect x="20" y="312" width="200" height="3.2" fill="url(#tr-ouro-h)"/>
      <path d="M36 180 H204 L212 312 H28 Z" fill="url(#tr-laca)"/>
      <path d="M36 180 H204 L212 312 H28 Z" fill="url(#tr-reflexo)"/>
      <path d="M58 180 H72 L66 312 H50 Z" fill="#fff" fill-opacity=".05"/>
      <rect x="35" y="186" width="170" height="2.4" fill="url(#tr-ouro-h)"/>
      <rect x="30" y="303" width="180" height="2.4" fill="url(#tr-ouro-h)"/>
      <circle cx="120" cy="223" r="25" fill="url(#tr-medalha)" stroke="url(#tr-ouro-v)" stroke-width="3.6"/>
      <circle cx="120" cy="223" r="19.5" fill="none" stroke="#f2c14e" stroke-opacity=".35" stroke-width="1"/>
      ${icone(cat.icone, 120, 223, 29, 'url(#tr-ouro-v)')}
      <rect x="48" y="256" width="144" height="42" rx="2" fill="url(#tr-ouro-v)"/>
      <rect x="51.5" y="259.5" width="137" height="35" fill="none" stroke="#6b4508" stroke-opacity=".55" stroke-width="1"/>
      ${l2 ? textoPlaca(l1, 275, 15, 126) + textoPlaca(l2, 290.5, 12, 110) : textoPlaca(l1, 282, 16, 126)}
      <path d="M28 166 H212 L205 181 H35 Z" fill="url(#tr-ouro-v)"/>
      <path d="M28 166 H212 L211 169 H29 Z" fill="#fff8de" fill-opacity=".7"/>
      <image href="${IMG_OURO}" x="24" y="8" width="192" height="154"/>
      <g mask="url(#tr-mascara-ouro)" style="mix-blend-mode:screen">
        <rect class="brilho-varre" x="0" y="0" width="54" height="170" fill="url(#tr-brilho)" style="animation-delay:${atraso.toFixed(2)}s"/>
      </g>
    </svg>`;
  }

  /* Troféu supremo: Pinguim Imperador (cristal + coroa) */
  function supremo(nome = 'Pinguim Imperador') {
    const [l1, l2] = linhas(nome);
    return `<svg class="trofeu trofeu--supremo" viewBox="0 -46 240 406" role="img" aria-label="${esc('Troféu ' + nome)}">
      <ellipse cx="120" cy="336" rx="120" ry="15" fill="url(#tr-sombra)"/>
      <path d="M8 336 H232 L222 312 H18 Z" fill="url(#tr-laca)"/>
      <rect x="18" y="310" width="204" height="3.4" fill="url(#tr-ouro-h)"/>
      <path d="M40 182 H200 L214 310 H26 Z" fill="url(#tr-gelo)"/>
      <path d="M40 182 L84 246 L26 310 Z M200 182 L156 246 L214 310 Z" fill="#fff" fill-opacity=".14"/>
      <path d="M84 246 L120 182 L156 246 L120 310 Z" fill="#06173f" fill-opacity=".25"/>
      <path d="M40 182 H200 L214 310 H26 Z" fill="none" stroke="#e3f2ff" stroke-opacity=".6" stroke-width="1"/>
      <rect x="37" y="186" width="166" height="2.6" fill="url(#tr-ouro-h)"/>
      <circle cx="120" cy="226" r="26" fill="url(#tr-medalha)" stroke="url(#tr-ouro-v)" stroke-width="4"/>
      ${icone('coroa', 120, 226, 28, 'url(#tr-ouro-v)')}
      <rect x="44" y="260" width="152" height="40" rx="2" fill="url(#tr-ouro-v)"/>
      <rect x="47.5" y="263.5" width="145" height="33" fill="none" stroke="#6b4508" stroke-opacity=".55" stroke-width="1"/>
      ${textoPlaca(l1, 278, 15, 134)}${textoPlaca(l2, 293, 14, 134)}
      <path d="M26 166 H214 L206 182 H34 Z" fill="url(#tr-ouro-v)"/>
      <image href="${IMG_CRISTAL}" x="24" y="8" width="192" height="154"/>
      <g mask="url(#tr-mascara-cristal)" style="mix-blend-mode:screen">
        <rect class="brilho-varre" x="0" y="0" width="54" height="170" fill="url(#tr-brilho)"/>
      </g>
      <g transform="translate(92 -40) rotate(6 32 30)">
        <path d="M2 50 L0 12 L16 28 L32 0 L48 28 L64 12 L62 50 Z" fill="url(#tr-ouro-v)" stroke="#6b4508" stroke-width="1.5" stroke-linejoin="round"/>
        <rect x="1" y="42" width="62" height="10" rx="1.5" fill="url(#tr-ouro-h)" stroke="#6b4508" stroke-width="1"/>
        <circle cx="32" cy="47" r="3.6" fill="#22c35a" stroke="#0b5a26" stroke-width=".8"/>
        <circle cx="15" cy="47" r="2.6" fill="#1e8cf0"/><circle cx="49" cy="47" r="2.6" fill="#1e8cf0"/>
        <circle cx="0" cy="12" r="3.2" fill="#fff3c9"/><circle cx="32" cy="0" r="3.6" fill="#fff3c9"/><circle cx="64" cy="12" r="3.2" fill="#fff3c9"/>
      </g>
    </svg>`;
  }

  /* Emblema pequeno (lista de revisão, painel) */
  function emblema(cat) {
    return `<svg class="emblema" viewBox="0 0 60 60" aria-hidden="true">
      <circle cx="30" cy="30" r="27" fill="url(#tr-medalha)" stroke="url(#tr-ouro-v)" stroke-width="3.5"/>
      ${icone(cat.icone, 30, 30, 30, 'url(#tr-ouro-v)')}
    </svg>`;
  }

  /* Lacre de cera com o mascote (tela final) */
  function lacre() {
    return `<svg viewBox="0 0 200 200" aria-hidden="true">
      <path d="M100 6 C126 4 140 18 158 26 C178 36 196 54 194 80 C192 100 200 116 192 136 C182 160 166 176 142 188 C120 198 92 198 70 190 C44 182 22 166 12 140 C4 118 4 96 10 74 C18 46 38 22 64 12 C76 8 88 6 100 6 Z" fill="url(#lacre-cera)"/>
      <circle cx="100" cy="100" r="70" fill="none" stroke="#a9ccf2" stroke-opacity=".45" stroke-width="2"/>
      <circle cx="100" cy="100" r="62" fill="#062466" fill-opacity=".35"/>
      <image href="${IMG_OURO}" x="40" y="52" width="120" height="96"/>
      <text style="font-family:Saira,sans-serif;font-weight:800;font-stretch:70%;font-size:15px;letter-spacing:.18em" fill="#d8e9ff"><textPath href="#lacre-arco" startOffset="50%" text-anchor="middle">VOTOS LACRADOS</textPath></text>
    </svg>`;
  }

  window.Trofeu = { instalar, svg, supremo, emblema, lacre, linhas };
})();
