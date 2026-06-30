/* ============================================================
   robustness — slide 10. A six-panel animated sequence, one panel per click:
     1  Multiverse decision nodes (two pre-registered forks -> 32 specs)
     2  Ridge plot of per-design Cohen's d across specs (Figure S8, animated)
     3  Specification curve (Figure S7, the published 3-panel figure)
     4  GOSH — setup schematic (what a GOSH plot does)
     5  GOSH plot — effect vs heterogeneity over random subsets (computed live)
     6  Leave-one-out — pooled effect omitting each study (computed live)
   Panels 5 & 6 are TRUE data-driven figures: a DerSimonian-Laird random-effects
   meta-analysis (the paper's estimator) is run in-browser on the 55 observed
   effects (window.MDC.forest_observed). Panel 3 is the published figure image.
   ============================================================ */
(function () {
  var MDC = window.MDC = window.MDC || {}; MDC.figures = MDC.figures || {};
  var NS = 'http://www.w3.org/2000/svg';

  // ---- DerSimonian-Laird random-effects meta-analysis ----
  function dlMeta(ss) {
    var k = ss.length; if (k < 2) return null;
    var i, w = [], sw = 0, sw2 = 0, swd = 0;
    for (i = 0; i < k; i++) { var wi = 1 / (ss[i].se * ss[i].se); w.push(wi); sw += wi; sw2 += wi * wi; swd += wi * ss[i].d; }
    var dF = swd / sw, Q = 0;
    for (i = 0; i < k; i++) Q += w[i] * (ss[i].d - dF) * (ss[i].d - dF);
    var C = sw - sw2 / sw;
    var t2 = Math.max(0, (Q - (k - 1)) / C);
    var wss = 0, wsd = 0;
    for (i = 0; i < k; i++) { var ws = 1 / (ss[i].se * ss[i].se + t2); wss += ws; wsd += ws * ss[i].d; }
    var d = wsd / wss;
    return { d: d, se: Math.sqrt(1 / wss), tau: Math.sqrt(t2),
      I2: Q > (k - 1) ? Math.max(0, (Q - (k - 1)) / Q) * 100 : 0, Q: Q, k: k };
  }
  // ---- seeded PRNG (mulberry32) so the GOSH cloud is reproducible ----
  function mulberry32(a) {
    return function () {
      a |= 0; a = a + 0x6D2B79F5 | 0;
      var t = Math.imul(a ^ a >>> 15, 1 | a);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }

  MDC.figures['robustness'] = function (mount, opts) {
    var P = (opts && opts.palette) || MDC.palette;
    mount.innerHTML = '';
    var studies = (window.MDC.forest_observed || []).map(function (o) {
      return { d: o.d, se: o.se, tid: o.tid };
    });
    var full = dlMeta(studies) || { d: 0.0629, tau: 0.123 };

    function layer() {
      var d = document.createElement('div');
      d.style.cssText = 'position:absolute;inset:0;opacity:0;transition:opacity .55s ease;';
      mount.appendChild(d); return d;
    }
    function title(parent, txt, sub) {
      var t = MDC.el('text', { x: 600, y: 30, 'text-anchor': 'middle', 'font-size': 23,
        'font-weight': 700, fill: P.greenDeep, text: txt }, parent);
      if (sub) MDC.el('text', { x: 600, y: 54, 'text-anchor': 'middle', 'font-size': 14,
        'font-weight': 500, fill: P.muted, text: sub }, parent);
      return t;
    }

    // ---------- LAYER 1: multiverse decision nodes ----------
    var L1 = layer(); buildMultiverse(L1, P);
    // ---------- LAYER 2: ridge (figS8) ----------
    var L2 = layer(); var ridgeCtrl = MDC.figures['figS8'](L2, opts); ridgeCtrl.reset();
    // ---------- LAYER 3: Figure S7 spec curve (published image, animated wipe) ----------
    var L3 = layer(); var s7Ctrl = buildS7(L3, P);
    // ---------- LAYER 4: GOSH setup schematic ----------
    var L4 = layer(); buildGoshSetup(L4, P, studies);
    // ---------- LAYER 5: GOSH cloud (computed) ----------
    var L5 = layer(); var goshCtrl = buildGosh(L5, P, studies, full);
    // ---------- LAYER 6: leave-one-out forest (computed) ----------
    var L6 = layer(); var looCtrl = buildLoo(L6, P, studies, full);

    var layers = [L1, L2, L3, L4, L5, L6];
    function show(idx) {
      for (var i = 0; i < layers.length; i++) layers[i].style.opacity = (i === idx) ? '1' : '0';
      if (idx === 1) ridgeCtrl.play(ridgeCtrl.steps); else ridgeCtrl.reset();
      if (idx === 2) s7Ctrl.play(); else s7Ctrl.reset();
      if (idx === 4) goshCtrl.play(); else goshCtrl.reset();
      if (idx === 5) looCtrl.play(); else looCtrl.reset();
    }
    return {
      steps: 6,
      play: function (i) { if (i < 1) { show(-1); return; } show(Math.min(i, 6) - 1); },
      reset: function () { show(-1); }
    };

    // ====================================================================
    //  BUILDERS
    // ====================================================================
    function buildMultiverse(host, P) {
      var s = MDC.svg(host, 600, 840);
      function E(tag, a, parent) { var e = document.createElementNS(NS, tag);
        for (var k in a) { if (k === 'text') e.textContent = a[k]; else e.setAttribute(k, a[k]); }
        (parent || s).appendChild(e); return e; }
      function chip(x, y, w, label) {
        E('rect', { x: x, y: y, width: w, height: 34, rx: 17, fill: P.bg2, stroke: P.amber, 'stroke-width': 1.1 });
        E('text', { x: x + w / 2, y: y + 22, 'text-anchor': 'middle', 'font-size': 14.5, 'font-weight': 700, fill: P.greenDeep, text: label }); }
      function fork(y, num, ttl) {
        E('rect', { x: 56, y: y, width: 488, height: 118, rx: 14, fill: '#fff', stroke: P.line2, 'stroke-width': 1.4 });
        E('circle', { cx: 92, cy: y + 30, r: 15, fill: P.green });
        E('text', { x: 92, y: y + 35, 'text-anchor': 'middle', 'font-size': 16, 'font-weight': 800, fill: '#fff', text: num });
        E('text', { x: 118, y: y + 36, 'font-size': 18, 'font-weight': 700, fill: P.greenDeep, text: ttl }); }
      function arrow(x, y1, y2) {
        E('line', { x1: x, x2: x, y1: y1, y2: y2 - 8, stroke: P.muted, 'stroke-width': 2 });
        E('path', { d: 'M' + (x - 5) + ',' + (y2 - 9) + ' L' + x + ',' + y2 + ' L' + (x + 5) + ',' + (y2 - 9) + ' Z', fill: P.muted }); }
      E('text', { x: 300, y: 50, 'text-anchor': 'middle', 'font-size': 27, 'font-weight': 700, fill: P.greenDeep, text: 'Multiverse analysis' });
      E('text', { x: 300, y: 82, 'text-anchor': 'middle', 'font-size': 16, 'font-weight': 500, fill: P.muted, text: 'each design re-analysed under every combination of two forks' });
      fork(120, '1', 'Control variables');
      chip(118, 168, 150, 'Sociodemographics'); chip(280, 168, 134, 'Private behaviour'); chip(426, 168, 118, 'Trust in gov’t');
      E('text', { x: 118, y: 232, 'font-size': 13.5, 'font-style': 'italic', fill: P.muted, text: 'every cross-combination — 8 control sets in total' });
      arrow(300, 238, 268);
      fork(268, '2', 'Drop observations · completion time');
      chip(118, 316, 96, 'None'); chip(224, 316, 86, '1%'); chip(320, 316, 96, '2.5%'); chip(426, 316, 96, '5%');
      E('text', { x: 118, y: 380, 'font-size': 13.5, 'font-style': 'italic', fill: P.muted, text: 'trimmed on both ends by time taken' });
      arrow(300, 392, 430);
      E('rect', { x: 120, y: 430, width: 360, height: 56, rx: 28, fill: P.greenDeep });
      E('text', { x: 300, y: 466, 'text-anchor': 'middle', 'font-size': 19, 'font-weight': 800, fill: '#fff', text: '8 × 4 = 32 specifications' });
      E('text', { x: 300, y: 524, 'text-anchor': 'middle', 'font-size': 15, 'font-weight': 500, fill: P.ink2, text: "Cohen's d re-estimated under each pathway, for every design" });
    }

    // Animated, data-driven specification curve (Figure S7). The 32 per-spec values were
    // extracted from the published figure's vector PDF into window.MDC.speccurve, so it is
    // faithful to the manuscript while animating like the other panels.
    function buildS7(host, P) {
      var s = MDC.svg(host, 1200, 690);
      var specs = (window.MDC.speccurve || []).slice();
      var anim = [];
      function fade(node, order) { node.style.opacity = '0'; node.style.transition = 'opacity .45s ease'; anim.push({ node: node, order: order }); return node; }
      var px0 = 150, px1 = 1140, sxSpec = MDC.scale(1, 32, px0, px1);
      MDC.el('text', { x: 600, y: 26, 'text-anchor': 'middle', 'font-size': 22, 'font-weight': 700, fill: P.greenDeep, text: 'Specification curve — every spec gives ~the same result' }, s);
      function median(arr) { var a = arr.slice().sort(function (x, y) { return x - y; }); return (a[15] + a[16]) / 2; }
      function panel(y0, y1, dom, ticks, key, ylab, allDark) {
        var sy = MDC.scale(dom[0], dom[1], y1, y0);
        ticks.forEach(function (t) {
          var y = sy(t);
          MDC.el('line', { x1: px0, x2: px1, y1: y, y2: y, stroke: P.line, 'stroke-width': 0.7 }, s);
          MDC.el('text', { x: px0 - 8, y: y + 4, 'text-anchor': 'end', 'font-size': 12, fill: P.muted, text: MDC.fmt(t, 3) }, s);
        });
        MDC.el('line', { x1: px0, x2: px0, y1: y0, y2: y1, stroke: P.ink2, 'stroke-width': 1 }, s);
        MDC.el('text', { x: 58, y: (y0 + y1) / 2, 'text-anchor': 'middle', 'font-size': 13.5, 'font-weight': 600, fill: P.ink, transform: 'rotate(-90 58 ' + ((y0 + y1) / 2) + ')', text: ylab }, s);
        var med = median(specs.map(function (z) { return z[key]; }));
        fade(MDC.el('line', { x1: px0, x2: px1, y1: sy(med), y2: sy(med), stroke: P.ink2, 'stroke-width': 1.4, 'stroke-dasharray': '6 4' }, s), 33);
        specs.forEach(function (z, i) {
          fade(MDC.el('circle', { cx: sxSpec(z.i), cy: sy(Math.max(dom[0], Math.min(dom[1], z[key]))), r: 4.2,
            fill: (allDark || z.sig === 'p<0.005') ? P.greenDeep : '#96c36e', stroke: '#fff', 'stroke-width': 0.7 }, s), i);
        });
      }
      // effect + heterogeneity panels
      panel(58, 196, [0.050, 0.068], [0.050, 0.055, 0.060, 0.065], 'meta_d', 'Meta-analytical effect d', false);
      fade(MDC.el('text', { x: px1 - 6, y: 192, 'text-anchor': 'end', 'font-size': 11.5, 'font-style': 'italic', fill: P.muted, text: 'Median z = 2.636,  p (one-tailed) = 0.0042' }, s), 34);
      panel(250, 380, [0.116, 0.130], [0.116, 0.120, 0.124, 0.128], 'tau', 'Heterogeneity τ', true);
      // significance legend (effect panel)
      MDC.el('circle', { cx: px0 + 14, cy: 46, r: 4.2, fill: P.greenDeep }, s);
      MDC.el('text', { x: px0 + 24, y: 50, 'font-size': 11.5, fill: P.ink2, text: 'p < 0.005 (N = 20)' }, s);
      MDC.el('circle', { cx: px0 + 150, cy: 46, r: 4.2, fill: '#96c36e' }, s);
      MDC.el('text', { x: px0 + 160, y: 50, 'font-size': 11.5, fill: P.ink2, text: '0.05 > p > 0.005 (N = 12)' }, s);
      // ===== billboard of analytical choices =====
      var groups = [
        { key: 'socio', label: 'Socioeconomic', levels: ['No', 'Yes'], col: '#C8654B' },
        { key: 'private', label: 'Private behavior', levels: ['No', 'Yes'], col: '#5A9BD4' },
        { key: 'trust', label: 'Trust in gov’t', levels: ['No', 'Yes'], col: '#6FB39A' },
        { key: 'drop', label: 'Drop obs.', levels: ['None', '1%', '2.5%', '5%'], col: '#8E7CC3' }
      ];
      var by = 430, rowH = 19, gGap = 11, rowY = {};
      groups.forEach(function (g) {
        MDC.el('text', { x: px0 - 56, y: by + (g.levels.length * rowH) / 2 + 3, 'text-anchor': 'end', 'font-size': 11, 'font-weight': 700, fill: g.col, text: g.label }, s);
        g.levels.forEach(function (lv) {
          rowY[g.key + '|' + lv] = by + rowH / 2;
          MDC.el('line', { x1: px0, x2: px1, y1: by + rowH / 2, y2: by + rowH / 2, stroke: P.line, 'stroke-width': 0.5 }, s);
          MDC.el('text', { x: px0 - 10, y: by + rowH / 2 + 3, 'text-anchor': 'end', 'font-size': 10, fill: P.muted, text: lv }, s);
          by += rowH;
        });
        by += gGap;
      });
      specs.forEach(function (z, i) {
        groups.forEach(function (g) {
          var ry = rowY[g.key + '|' + z.choices[g.key]];
          if (ry == null) return;
          fade(MDC.el('circle', { cx: sxSpec(z.i), cy: ry, r: 2.7, fill: g.col }, s), i);
        });
      });
      MDC.el('text', { x: (px0 + px1) / 2, y: by + 18, 'text-anchor': 'middle', 'font-size': 14, 'font-weight': 600, fill: P.ink, text: 'Specification (sorted by effect size)' }, s);

      function play() {
        var stat = window.MDC && window.MDC.qaStatic;
        anim.forEach(function (a) {
          if (stat) { a.node.style.transition = 'none'; a.node.style.opacity = '1'; return; }
          a.node.style.transitionDelay = (Math.min(a.order, 32) / 32 * 1.1).toFixed(3) + 's';
          a.node.style.opacity = '1';
        });
      }
      function reset() { anim.forEach(function (a) { a.node.style.transition = 'none'; a.node.style.transitionDelay = '0s'; a.node.style.opacity = '0'; }); }
      return { play: play, reset: reset };
    }

    function buildGoshSetup(host, P) {
      var s = MDC.svg(host, 1200, 600);
      title(s, 'GOSH — Graphical display Of Study Heterogeneity', 'fit the meta-analysis to a great many random subsets of the 55 designs');
      // row of 55 study dots
      var dotsY = 150, x0 = 120, x1 = 1080, n = 55;
      for (var i = 0; i < n; i++) {
        var cx = x0 + (x1 - x0) * (i / (n - 1));
        MDC.el('circle', { cx: cx, cy: dotsY, r: 5, fill: '#C9C2B0' }, s);
      }
      MDC.el('text', { x: 600, y: dotsY - 26, 'text-anchor': 'middle', 'font-size': 16, 'font-weight': 700, fill: P.ink2, text: 'all 55 designs' }, s);
      // pick a random subset (highlight some)
      var sub = [3, 7, 9, 14, 18, 22, 27, 31, 36, 40, 44, 49];
      sub.forEach(function (k) {
        var cx = x0 + (x1 - x0) * (k / (n - 1));
        MDC.el('circle', { cx: cx, cy: dotsY, r: 7, fill: P.green, stroke: '#fff', 'stroke-width': 1.5 }, s);
      });
      MDC.el('text', { x: 600, y: dotsY + 34, 'text-anchor': 'middle', 'font-size': 13.5, 'font-style': 'italic', fill: P.muted, text: 'draw a random subset (here ' + sub.length + ' of 55) …' }, s);
      // arrow down
      MDC.el('line', { x1: 600, x2: 600, y1: 210, y2: 286, stroke: P.muted, 'stroke-width': 2 }, s);
      MDC.el('path', { d: 'M595,286 L600,296 L605,286 Z', fill: P.muted }, s);
      // compute (effect, tau) box
      MDC.el('rect', { x: 430, y: 300, width: 340, height: 74, rx: 12, fill: '#fff', stroke: P.line2, 'stroke-width': 1.4 }, s);
      MDC.el('text', { x: 600, y: 330, 'text-anchor': 'middle', 'font-size': 16, 'font-weight': 700, fill: P.greenDeep, text: 're-run the meta-analysis' }, s);
      MDC.el('text', { x: 600, y: 354, 'text-anchor': 'middle', 'font-size': 14, fill: P.ink2, text: '→ one point: ( pooled effect ,  τ )' }, s);
      // arrow down
      MDC.el('line', { x1: 600, x2: 600, y1: 384, y2: 430, stroke: P.muted, 'stroke-width': 2 }, s);
      MDC.el('path', { d: 'M595,430 L600,440 L605,430 Z', fill: P.muted }, s);
      // repeat pill
      MDC.el('rect', { x: 360, y: 446, width: 480, height: 52, rx: 26, fill: P.greenDeep }, s);
      MDC.el('text', { x: 600, y: 478, 'text-anchor': 'middle', 'font-size': 18, 'font-weight': 800, fill: '#fff', text: 'repeat 1,000,000 times  →  a cloud' }, s);
      MDC.el('text', { x: 600, y: 536, 'text-anchor': 'middle', 'font-size': 13.5, 'font-style': 'italic', fill: P.muted, text: 'a tight cloud means no single design drives the result' }, s);
    }

    function buildGosh(host, P, studies, full) {
      var s = MDC.svg(host, 1200, 600);
      title(s, 'GOSH plot — effect vs heterogeneity across random subsets', 'each point = a re-run meta-analysis on a random subset of designs');
      var plotX0 = 120, plotX1 = 1120, plotY0 = 86, plotY1 = 520;
      var xDom = [-0.08, 0.18], yDom = [0, 0.26];
      var sx = MDC.scale(xDom[0], xDom[1], plotX0, plotX1);
      var sy = MDC.scale(yDom[0], yDom[1], plotY1, plotY0);
      // gridlines + ticks
      MDC.ticks(xDom[0], xDom[1], 0.05).forEach(function (t) {
        var x = sx(t);
        MDC.el('line', { x1: x, x2: x, y1: plotY0, y2: plotY1, stroke: P.line, 'stroke-width': 0.7 }, s);
        MDC.el('text', { x: x, y: plotY1 + 22, 'text-anchor': 'middle', 'font-size': 13, fill: P.muted, text: MDC.fmt(t, 2) }, s);
      });
      MDC.ticks(yDom[0], yDom[1], 0.05).forEach(function (t) {
        var y = sy(t);
        MDC.el('line', { x1: plotX0, x2: plotX1, y1: y, y2: y, stroke: P.line, 'stroke-width': 0.7 }, s);
        MDC.el('text', { x: plotX0 - 10, y: y + 4, 'text-anchor': 'end', 'font-size': 13, fill: P.muted, text: MDC.fmt(t, 2) }, s);
      });
      MDC.el('line', { x1: plotX0, x2: plotX1, y1: plotY1, y2: plotY1, stroke: P.ink2, 'stroke-width': 1 }, s);
      MDC.el('line', { x1: plotX0, x2: plotX0, y1: plotY0, y2: plotY1, stroke: P.ink2, 'stroke-width': 1 }, s);
      MDC.el('text', { x: (plotX0 + plotX1) / 2, y: plotY1 + 46, 'text-anchor': 'middle', 'font-size': 16, 'font-weight': 600, fill: P.ink, text: 'Meta-analytical effect (Cohen’s d)' }, s);
      MDC.el('text', { x: 40, y: (plotY0 + plotY1) / 2, 'text-anchor': 'middle', 'font-size': 16, 'font-weight': 600, fill: P.ink, transform: 'rotate(-90 40 ' + ((plotY0 + plotY1) / 2) + ')', text: 'Heterogeneity τ' }, s);
      // generate subsets (seeded)
      var rnd = mulberry32(20251212);
      var N = 1800, pts = [], idx = studies.map(function (_, i) { return i; });
      for (var p = 0; p < N; p++) {
        var m = 9 + Math.floor(rnd() * 38);                 // subset size 9..46
        for (var i = idx.length - 1; i > 0; i--) { var j = Math.floor(rnd() * (i + 1)); var t = idx[i]; idx[i] = idx[j]; idx[j] = t; }
        var sub = []; for (i = 0; i < m; i++) sub.push(studies[idx[i]]);
        var r = dlMeta(sub); if (r) pts.push(r);
      }
      var cloud = MDC.g(s, {});
      var circles = [];
      pts.forEach(function (r) {
        var c = MDC.el('circle', { cx: sx(Math.max(xDom[0], Math.min(xDom[1], r.d))),
          cy: sy(Math.max(yDom[0], Math.min(yDom[1], r.tau))), r: 2.0,
          fill: P.greenDeep, 'fill-opacity': 0 }, cloud);
        circles.push(c);
      });
      // full-sample marker
      var fm = MDC.g(s, {});
      var fx = sx(full.d), fy = sy(full.tau);
      MDC.el('path', { d: 'M' + (fx - 8) + ',' + fy + ' L' + fx + ',' + (fy - 8) + ' L' + (fx + 8) + ',' + fy + ' L' + fx + ',' + (fy + 8) + ' Z',
        fill: P.amber, stroke: '#fff', 'stroke-width': 1.6 }, fm);
      MDC.el('text', { x: fx + 14, y: fy - 8, 'font-size': 13.5, 'font-weight': 700, fill: P.amber, text: 'all 55: d=' + MDC.fmt(full.d, 3) + ', τ=' + MDC.fmt(full.tau, 2) }, fm);
      fm.style.opacity = '0'; fm.style.transition = 'opacity .5s ease .6s';
      function play() {
        for (var i = 0; i < circles.length; i++) {
          circles[i].style.transition = 'fill-opacity .5s ease';
          circles[i].style.transitionDelay = (i / circles.length * 1.1).toFixed(3) + 's';
          circles[i].setAttribute('fill-opacity', '0.14');
        }
        fm.style.opacity = '1';
      }
      function reset() {
        for (var i = 0; i < circles.length; i++) { circles[i].style.transition = 'none'; circles[i].style.transitionDelay = '0s'; circles[i].setAttribute('fill-opacity', '0'); }
        fm.style.opacity = '0';
      }
      return { play: play, reset: reset };
    }

    function buildLoo(host, P, studies, full) {
      var s = MDC.svg(host, 1200, 640);
      title(s, 'Leave-one-out — pooled effect omitting each design', 'every estimate stays small and positive; no single design drives the result');
      var rows = studies.slice().sort(function (a, b) { return a.tid < b.tid ? -1 : 1; });
      var loo = rows.map(function (r) {
        var sub = studies.filter(function (x) { return x.tid !== r.tid; });
        var m = dlMeta(sub);
        return { tid: r.tid, d: m.d, se: m.se, tau: m.tau, I2: m.I2 || 0, Q: m.Q };
      });
      // forest on the left, Q / I² / τ columns on the right — matches the published Figure S11
      // x-scale mirrors the published Figure S11: a NARROW forest column with the axis
      // spanning -0.05..0.10, so the 95% CIs read as compact bars (not stretched-out ones).
      var plotX0 = 200, plotX1 = 700, plotY0 = 86, plotY1 = 588;
      var xDom = [-0.06, 0.115];
      var sx = MDC.scale(xDom[0], xDom[1], plotX0, plotX1);
      var n = loo.length, pitch = (plotY1 - plotY0) / (n - 1);
      // gridlines + ticks
      MDC.ticks(xDom[0], xDom[1], 0.05).forEach(function (t) {
        var x = sx(t), zero = Math.abs(t) < 1e-9;
        MDC.el('line', { x1: x, x2: x, y1: plotY0 - 6, y2: plotY1 + 6, stroke: zero ? P.ink2 : P.line, 'stroke-width': zero ? 1.2 : 0.6 }, s);
        MDC.el('text', { x: x, y: plotY1 + 24, 'text-anchor': 'middle', 'font-size': 13, fill: P.muted, text: MDC.fmt(t, 2) }, s);
      });
      // full-sample reference (dashed)
      var fxr = sx(full.d);
      MDC.el('line', { x1: fxr, x2: fxr, y1: plotY0 - 6, y2: plotY1 + 6, stroke: P.green, 'stroke-width': 1.2, 'stroke-dasharray': '5 4' }, s);
      MDC.el('text', { x: fxr, y: plotY0 - 14, 'text-anchor': 'middle', 'font-size': 12.5, 'font-weight': 700, fill: P.green, text: 'full sample d = ' + MDC.fmt(full.d, 3) }, s);
      MDC.el('text', { x: (plotX0 + plotX1) / 2, y: plotY1 + 48, 'text-anchor': 'middle', 'font-size': 15, 'font-weight': 600, fill: P.ink, text: 'Meta-analytical effect (Cohen’s d), one design removed' }, s);
      // Q / I² / τ column headers
      var colQ = 800, colI = 945, colT = 1090;
      MDC.el('text', { x: colQ, y: plotY0 - 14, 'text-anchor': 'middle', 'font-size': 12.5, 'font-weight': 700, 'font-style': 'italic', fill: P.ink2, text: 'Q' }, s);
      MDC.el('text', { x: colI, y: plotY0 - 14, 'text-anchor': 'middle', 'font-size': 12.5, 'font-weight': 700, 'font-style': 'italic', fill: P.ink2, text: 'I²' }, s);
      MDC.el('text', { x: colT, y: plotY0 - 14, 'text-anchor': 'middle', 'font-size': 12.5, 'font-weight': 700, 'font-style': 'italic', fill: P.ink2, text: 'τ' }, s);
      // rows
      var rowG = MDC.g(s, {}); var nodes = [];
      loo.forEach(function (r, i) {
        var y = plotY0 + i * pitch;
        var g = MDC.g(rowG, {});
        var lo = sx(r.d - 1.96 * r.se), hi = sx(r.d + 1.96 * r.se), cx = sx(r.d);
        // 95% CI line
        MDC.el('line', { x1: lo, x2: hi, y1: y, y2: y, stroke: P.green2, 'stroke-width': 1.0, 'stroke-opacity': 0.8 }, g);
        // SMALL diamond at the point estimate (cream fill, dark outline) — not spanning the CI
        var dw = 3.0, dh = 2.4;
        MDC.el('path', { d: 'M' + (cx - dw) + ',' + y + ' L' + cx + ',' + (y - dh) + ' L' + (cx + dw) + ',' + y + ' L' + cx + ',' + (y + dh) + ' Z',
          fill: '#EFEADD', stroke: P.greenDeep, 'stroke-width': 0.9 }, g);
        // tid label (left)
        MDC.el('text', { x: plotX0 - 8, y: y + 2.6, 'text-anchor': 'end', 'font-size': 7.6, fill: P.ink2, text: r.tid }, s);
        // Q (always p<0.005 here) / I² / τ columns
        MDC.el('text', { x: colQ, y: y + 2.6, 'text-anchor': 'middle', 'font-size': 8.2, fill: P.ink2, text: MDC.fmt(r.Q, 1) + '**' }, g);
        MDC.el('text', { x: colI, y: y + 2.6, 'text-anchor': 'middle', 'font-size': 8.2, fill: P.ink2, text: MDC.fmt(r.I2, 1) + '%' }, g);
        MDC.el('text', { x: colT, y: y + 2.6, 'text-anchor': 'middle', 'font-size': 8.2, fill: P.ink2, text: MDC.fmt(r.tau, 2) }, g);
        g.style.opacity = '0'; g.style.transition = 'opacity .45s ease';
        nodes.push(g);
      });
      function play() { for (var i = 0; i < nodes.length; i++) { nodes[i].style.transitionDelay = (i / nodes.length * 0.7).toFixed(3) + 's'; nodes[i].style.opacity = '1'; } }
      function reset() { for (var i = 0; i < nodes.length; i++) { nodes[i].style.transitionDelay = '0s'; nodes[i].style.opacity = '0'; } }
      return { play: play, reset: reset };
    }
  };
})();
