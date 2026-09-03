/* ============================================================
   MDC core — shared helpers + figure animation driver
   Global: window.MDC
   ------------------------------------------------------------
   Figure module contract (each js/figures/*.js registers one):

     MDC.figures['fig3'] = function(mount, opts){
        // mount: <div class="figmount"> DOM node (already sized)
        // opts:  { animate:boolean, palette:MDC.palette }
        // Build the SVG inside `mount`.
        // Return a controller:
        //   { steps:Number,            // number of animation steps
        //     play(i),                 // advance to step i (0..steps-1)
        //     reset() }                // jump back to initial state
     };

   Wiring (driven by this core, no work needed in modules):
     - A <section data-fig="fig3"> hosts a <div class="figmount"></div>.
     - When that slide becomes current the figure is instantiated once
       and reset() is called.
     - Fragments on the slide carrying data-figstep="N" call play(N)
       when shown (and play(N-1) when hidden), so Left/Right arrows
       step the animation. Use data-figstep on .fragment elements.
   ============================================================ */
(function () {
  const SVGNS = 'http://www.w3.org/2000/svg';
  const MDC = (window.MDC = window.MDC || {});
  MDC.figures = MDC.figures || {};
  MDC.data = MDC.data || {};

  MDC.palette = {
    green:'#1B5E3A', green2:'#2E7D52', greenDeep:'#0E3D24', greenLight:'#8DBF6F',
    amber:'#D98A2B', amberSoft:'#E9B872', rust:'#C8654B',
    blue:'#5A9BD4', blueSoft:'#9CC3E0', teal:'#6FB39A', purple:'#8E7CC3',
    red:'#B23B3B', ink:'#1A1A1A', ink2:'#3A4038', muted:'#6B7268',
    line:'#D8D2C4', line2:'#C4BDA8', bg:'#FAF8F3', bg2:'#F2EEE3', card:'#fff',
    cat:{ 'Information Treatment':'#9CC3E0', 'Behavioral Biases/Reflective Thinking':'#6FB39A',
          'Strategic Group Interactions':'#C8654B', 'Use of AI':'#8E7CC3' },
    catShort:{ info:'#9CC3E0', beh:'#6FB39A', strat:'#C8654B', ai:'#8E7CC3' },
    outcome:{ 'Donation':'#1B5E3A', 'Political Contact':'#3A4038',
              'Petition':'#6B7268', 'Market Price':'#D98A2B' }
  };

  /* ---------- SVG helpers ---------- */
  function el(tag, attrs, parent) {
    const n = document.createElementNS(SVGNS, tag);
    if (attrs) for (const k in attrs) {
      if (k === 'text') n.textContent = attrs[k];
      else if (attrs[k] != null) n.setAttribute(k, attrs[k]);
    }
    if (parent) parent.appendChild(n);
    return n;
  }
  function svg(mount, vbW, vbH) {
    mount.innerHTML = '';
    const s = el('svg', { viewBox: `0 0 ${vbW} ${vbH}`, preserveAspectRatio: 'xMidYMid meet' }, mount);
    s.style.width = '100%'; s.style.height = '100%';
    return s;
  }
  function g(parent, attrs) { return el('g', attrs, parent); }

  // linear scale
  function scale(d0, d1, r0, r1) {
    const m = (r1 - r0) / (d1 - d0);
    const f = v => r0 + (v - d0) * m;
    f.inv = p => d0 + (p - r0) / m;
    f.domain = [d0, d1]; f.range = [r0, r1];
    return f;
  }
  function ticks(d0, d1, step) {
    const out = []; const s = Math.sign(d1 - d0) || 1;
    const start = Math.ceil(Math.min(d0, d1) / step) * step;
    const end = Math.max(d0, d1);
    for (let v = start; v <= end + 1e-9; v += step) out.push(+v.toFixed(6));
    return out;
  }
  const fmt = (v, d = 2) => (v == null || isNaN(v)) ? '' : (v >= 0 ? '' : '−') + Math.abs(v).toFixed(d).replace(/^(\d)/, m => m);
  const fmtSigned = (v, d = 2) => (v == null || isNaN(v)) ? '' : (v >= 0 ? '+' : '−') + Math.abs(v).toFixed(d);

  /* ---------- count-up ---------- */
  function easeOut(t){ return 1 - Math.pow(1 - t, 3); }
  function countUp(node, opts) {
    const to = opts.to, from = opts.from || 0, dur = opts.dur || 1100,
      dec = opts.dec == null ? 0 : opts.dec, pre = opts.prefix || '', suf = opts.suffix || '',
      sign = opts.sign || false;
    let start = null;
    function frame(ts) {
      if (start == null) start = ts;
      const t = Math.min(1, (ts - start) / dur);
      const v = from + (to - from) * easeOut(t);
      let str = Math.abs(v).toFixed(dec);
      const parts = str.split('.');
      parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
      str = parts.join('.');
      if (sign) str = (v >= 0 ? '+' : '−') + str; else if (v < 0) str = '−' + str;
      node.textContent = pre + str + suf;
      if (t < 1) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }
  function fmtFinal(opts) {
    const v = opts.to, dec = opts.dec || 0;
    const parts = Math.abs(v).toFixed(dec).split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    let str = parts.join('.');
    if (opts.sign) str = (v >= 0 ? '+' : '−') + str; else if (v < 0) str = '−' + str;
    return (opts.prefix || '') + str + (opts.suffix || '');
  }
  function runCountUps(scope) {
    scope.querySelectorAll('.countup:not([data-done])').forEach(n => {
      n.setAttribute('data-done', '1');
      const opts = {
        to: parseFloat(n.dataset.to),
        from: n.dataset.from ? parseFloat(n.dataset.from) : 0,
        dec: n.dataset.dec ? +n.dataset.dec : 0,
        suffix: n.dataset.suffix || '', prefix: n.dataset.prefix || '',
        sign: n.dataset.sign === '1', dur: n.dataset.dur ? +n.dataset.dur : 1100
      };
      if (MDC.qaStatic) { n.textContent = fmtFinal(opts); return; }  // deterministic capture
      countUp(n, opts);
    });
  }

  MDC.svg = svg; MDC.el = el; MDC.g = g; MDC.scale = scale; MDC.ticks = ticks;
  MDC.fmt = fmt; MDC.fmtSigned = fmtSigned; MDC.countUp = countUp; MDC.SVGNS = SVGNS;

  /* ---------- figure driver ---------- */
  const instances = new Map(); // section -> controller

  function ensureInstance(section) {
    if (instances.has(section)) return instances.get(section);
    const id = section.getAttribute('data-fig');
    const mount = section.querySelector('.figmount');
    if (!id || !mount || !MDC.figures[id]) { instances.set(section, null); return null; }
    let ctrl = null;
    try { ctrl = MDC.figures[id](mount, { animate: true, palette: MDC.palette }); }
    catch (e) { console.error('figure build failed:', id, e); }
    instances.set(section, ctrl);
    // Flush SVG layout once the webfont is fully active. Figure <text> created/measured before
    // Montserrat is live keeps fallback metrics and won't re-flow on swap in reveal's scaled
    // context; reading getBBox forces the re-layout so labels settle into their boxes.
    if (ctrl && document.fonts && document.fonts.ready) {
      document.fonts.ready.then(function () {
        requestAnimationFrame(function () {
          try { mount.querySelectorAll('svg text').forEach(function (t) { t.getBBox(); }); } catch (e) {}
        });
      });
    }
    return ctrl;
  }

  function maxStepShown(section) {
    let mx = 0;
    section.querySelectorAll('.fragment.visible[data-figstep]').forEach(f => {
      mx = Math.max(mx, +f.getAttribute('data-figstep'));
    });
    return mx;
  }

  MDC.initDriver = function (deck) {
    function sync(section, animate) {
      const ctrl = ensureInstance(section);
      if (!ctrl) return;
      const defined = section.querySelectorAll('.fragment[data-figstep]').length;
      // figure slides with no explicit step-fragments just render fully
      const step = defined ? maxStepShown(section) : (ctrl.steps || 0);
      try {
        if (step <= 0 && animate && defined) ctrl.reset();
        ctrl.play(step);
      } catch (e) { console.error(e); }
    }
    deck.on('ready', e => { runCountUps(e.currentSlide); if (e.currentSlide.hasAttribute('data-fig')) sync(e.currentSlide, true); });
    deck.on('slidechanged', e => {
      runCountUps(e.currentSlide);
      if (e.currentSlide.hasAttribute('data-fig')) sync(e.currentSlide, true);
    });
    deck.on('fragmentshown', e => {
      const sec = e.fragment.closest('section');
      runCountUps(sec);
      if (sec && sec.hasAttribute('data-fig')) sync(sec, false);
    });
    deck.on('fragmenthidden', e => {
      const sec = e.fragment.closest('section');
      if (sec && sec.hasAttribute('data-fig')) sync(sec, false);
    });
  };

  MDC.runCountUps = runCountUps;
})();
