/* ============================================================
   FIG 4 — "What explains the variation?"  2x2 grid.
   a (top-left)  Intervention category   — horizontal forest of 4 categories
   b (top-right) Outcome type            — horizontal forest of 4 outcomes
   c (bot-left)  Peer-assessed informativeness — scatter d vs info_dm + reg line/band
   d (bot-right) Peer-assessed effect size     — scatter d vs eff_dm  + reg line/band

   Each forest row: predicted d point + 95% CI [lo,hi]; "d [lo; hi]" above the
   point, "p = …" below; dashed line at 0; light vertical gridlines. A stats box
   ("Q_M / p / τ / R²") sits in clear whitespace, not over data.
   Scatter panels: hollow grey bubbles sized inversely to se, tiny tid labels,
   the paper's meta-regression line + light-green 95% band, stats box bottom-right.

   STEPS (4):
     1 = panel a (forest + its stats box)   (CIs draw, then points)
     2 = panel b (forest + its stats box)   (CIs draw, then points)
     3 = panel c (scatter + its stats box)  (bubbles pop, then line+band)
     4 = panel d (scatter + its stats box)  (bubbles pop, then line+band)
   ============================================================ */
(function () {
  var MDC = window.MDC;

  MDC.figures['fig4'] = function (mount, opts) {
    var P = opts.palette || MDC.palette;
    var D = window.MDC.fig4 || {};
    var obs = (window.MDC.forest_observed || []).slice();

    var VBW = 1520, VBH = 820;
    var s = MDC.svg(mount, VBW, VBH);

    // ---------- animation registry ----------
    var anim = [];
    function reg(node, step, delay) {
      node.style.opacity = '0';
      node.style.transition = 'opacity .5s ease';
      if (delay) node.style.transitionDelay = delay + 's';
      anim.push({ node: node, step: step });
      return node;
    }

    // ---------- 2x2 grid geometry ----------
    var outer = 16;          // outer margin
    var colGap = 30;         // gap between left/right panels
    var rowGap = 26;         // gap between top/bottom rows
    var panelW = (VBW - 2 * outer - colGap) / 2;
    var panelH = (VBH - 2 * outer - rowGap) / 2;

    var panels = {
      a: { x: outer,                   y: outer },
      b: { x: outer + panelW + colGap, y: outer },
      c: { x: outer,                   y: outer + panelH + rowGap },
      d: { x: outer + panelW + colGap, y: outer + panelH + rowGap }
    };

    // panel letter tag (a,b,c,d) top-left, bold
    function panelTag(px, py, letter) {
      MDC.el('text', { x: px + 2, y: py + 22, 'font-size': 26, 'font-weight': 800,
        fill: P.ink, text: letter }, s);
    }

    // clamp a centered text so it stays inside [x0,x1] given half-width estimate
    function clampText(cx, str, x0, x1, charW) {
      var half = (str.length * charW) / 2 + 4;
      if (cx - half < x0) return x0 + half;
      if (cx + half > x1) return x1 - half;
      return cx;
    }

    // stats box anchored at bottom-right corner (ax,ay).
    function statsBox(ax, ay, lines) {
      var pad = 9, lh = 19, fs = 13.5;
      var w = 0;
      lines.forEach(function (l) { w = Math.max(w, l.length); });
      var boxW = w * 7.0 + pad * 2;
      var boxH = lines.length * lh + pad * 2 - 4;
      var bx = ax - boxW, by = ay - boxH;
      var grp = MDC.g(s, {});
      MDC.el('rect', { x: bx, y: by, width: boxW, height: boxH, rx: 4,
        fill: '#FFFFFF', 'fill-opacity': 0.92, stroke: P.line2, 'stroke-width': 1 }, grp);
      lines.forEach(function (l, i) {
        MDC.el('text', { x: bx + pad, y: by + pad + 14 + i * lh, 'font-size': fs,
          fill: P.ink2, text: l }, grp);
      });
      return grp;
    }

    // ============================================================
    //  FOREST PANELS (a, b)
    // ============================================================
    function buildForest(p, letter, rows, qm, stepNo) {
      panelTag(p.x, p.y, letter);
      // panel b (outcome type) is an exploratory, post-hoc analysis — label it so
      if (letter === 'b') {
        MDC.el('text', { x: p.x + 30, y: p.y + 20, 'font-size': 15.5, 'font-weight': 600,
          'font-style': 'italic', fill: P.muted, text: '(exploratory)' }, s);
      }
      var plotX0 = p.x + 150;                 // room for category labels on left
      var plotX1 = p.x + panelW - 14;
      var plotTop = p.y + 18;
      var axisY = p.y + panelH - 52;          // x axis baseline
      var sx = MDC.scale(-0.4, 0.6, plotX0, plotX1);

      // gridlines + dashed zero + tick labels
      MDC.ticks(-0.4, 0.6, 0.2).forEach(function (t) {
        var x = sx(t);
        var isZero = Math.abs(t) < 1e-9;
        MDC.el('line', { x1: x, x2: x, y1: plotTop, y2: axisY,
          stroke: isZero ? P.ink2 : P.line,
          'stroke-width': isZero ? 1.1 : 0.8,
          'stroke-dasharray': isZero ? '4 3' : '' }, s);
        MDC.el('text', { x: x, y: axisY + 22, 'text-anchor': 'middle',
          'font-size': 14, fill: P.muted, text: MDC.fmt(t, 1) }, s);
      });
      // axis line + title
      MDC.el('line', { x1: plotX0, x2: plotX1, y1: axisY, y2: axisY,
        stroke: P.ink2, 'stroke-width': 1 }, s);
      MDC.el('text', { x: (plotX0 + plotX1) / 2, y: axisY + 46,
        'text-anchor': 'middle', 'font-size': 16, 'font-weight': 600,
        fill: P.ink, text: 'Predicted effect size' }, s);

      // rows (top -> bottom as passed). Keep the lowest row's "p=" clear of the
      // stats box, which occupies the bottom-right strip just above the axis.
      var n = rows.length;
      var bandTop = plotTop + 40;
      var bandBot = axisY - 78;
      var step = (bandBot - bandTop) / (n - 1);

      rows.forEach(function (r, i) {
        var y = bandTop + i * step;
        var g = MDC.g(s, {});

        // category label (left), wrapped + (k = N)
        var labLines = wrapLabel(r.label, r.k);
        var lx = p.x + 142;
        var lineH = 17;
        var startY = y - (labLines.length - 1) * lineH / 2 + 5;
        labLines.forEach(function (ln, li) {
          MDC.el('text', { x: lx, y: startY + li * lineH, 'text-anchor': 'end',
            'font-size': 15, 'font-weight': 600, fill: P.ink2, text: ln }, s);
        });

        // CI line + caps (step 1)
        var ci = MDC.el('line', { x1: sx(r.lo), x2: sx(r.hi), y1: y, y2: y,
          stroke: P.green2, 'stroke-width': 1.6 }, g);
        var cap1 = MDC.el('line', { x1: sx(r.lo), x2: sx(r.lo), y1: y - 5, y2: y + 5,
          stroke: P.green2, 'stroke-width': 1.4 }, g);
        var cap2 = MDC.el('line', { x1: sx(r.hi), x2: sx(r.hi), y1: y - 5, y2: y + 5,
          stroke: P.green2, 'stroke-width': 1.4 }, g);
        reg(ci, stepNo); reg(cap1, stepNo); reg(cap2, stepNo);

        // point — uniform fixed size; significant filled darker
        var rad = 6.5;
        var sig = r.p < 0.05;
        var pt = MDC.el('circle', { cx: sx(r.d), cy: y, r: rad,
          fill: sig ? P.green : '#FFFFFF',
          stroke: P.green, 'stroke-width': 1.6 }, g);
        reg(pt, stepNo, 0.25);

        // "d [lo; hi]" above the point
        var lab = MDC.fmt(r.d, 3) + ' [' + MDC.fmt(r.lo, 3) + '; ' + MDC.fmt(r.hi, 3) + ']';
        var aX = clampText(sx(r.d), lab, plotX0, plotX1, 7.0);
        var tAbove = MDC.el('text', { x: aX, y: y - rad - 8, 'text-anchor': 'middle',
          'font-size': 13.5, fill: P.ink2, text: lab }, g);
        reg(tAbove, stepNo, 0.25);

        // "p = …" below the point
        var pl = 'p = ' + MDC.fmt(r.p, 3);
        var pX = clampText(sx(r.d), pl, plotX0, plotX1, 7.0);
        var tBelow = MDC.el('text', { x: pX, y: y + rad + 18, 'text-anchor': 'middle',
          'font-size': 13.5, 'font-style': 'italic', fill: P.muted, text: pl }, g);
        reg(tBelow, stepNo, 0.25);
      });

      // stats box — bottom-right of panel, below the lowest row's data.
      // appears together with this panel.
      var sb = statsBox(plotX1 - 4, axisY - 10, [
        'R² = ' + MDC.fmt(qm.R2, 1) + '%',
        'Qm(' + qm.df + ') = ' + MDC.fmt(qm.QM, 2) + ',  p = ' + MDC.fmt(qm.p, 3),
        'τ = ' + MDC.fmt(qm.tau, 3) + ', p < 0.001'
      ]);
      reg(sb, stepNo, 0.25);
    }

    // wrap a category label into <=2 lines, append "(k = N)"
    function wrapLabel(label, k) {
      var ksuf = '(k = ' + k + ')';
      if (label === 'Beh. Biases/Refl. Thinking')
        return ['Beh. Biases/', 'Refl. Thinking ' + ksuf];
      if (label === 'Strategic Group Interactions')
        return ['Strategic Group', 'Interactions ' + ksuf];
      if (label === 'Information Treatment')
        return ['Information', 'Treatment ' + ksuf];
      if (label === 'Political Contact')
        return ['Political', 'Contact ' + ksuf];
      return [label + ' ' + ksuf];
    }

    // ---------- panel a: intervention category ----------
    // top->bottom: Use of AI, Strategic, Beh, Information (matches published fig)
    var cats = D.categories || [];
    function byLabel(arr, lab) { for (var i = 0; i < arr.length; i++) if (arr[i].label === lab) return arr[i]; }
    buildForest(panels.a, 'a', [
      byLabel(cats, 'Use of AI'),
      byLabel(cats, 'Strategic Group Interactions'),
      byLabel(cats, 'Beh. Biases/Refl. Thinking'),
      byLabel(cats, 'Information Treatment')
    ], D.categories_QM || {}, 1);

    // ---------- panel b: outcome type ----------
    var outc = D.outcomes || [];
    buildForest(panels.b, 'b', [
      byLabel(outc, 'Political Contact'),
      byLabel(outc, 'Petition'),
      byLabel(outc, 'Market Price'),
      byLabel(outc, 'Donation')
    ], D.outcomes_QM || {}, 2);

    // ============================================================
    //  SCATTER PANELS (c, d)
    // ============================================================
    // The line/band reproduce the paper's meta-regression (metafor rma), NOT a raw
    // OLS of the plotted points. Because the moderator (info_dm / eff_dm) is centred,
    // the intercept is the pooled observed effect at the mean moderator and the
    // slope SE is recovered from the omnibus stat: Q_M = (beta / SE_beta)^2.

    function buildScatter(p, letter, xKey, xDom, xTickStep, xTitle, qm, stepNo) {
      panelTag(p.x, p.y, letter);
      var plotX0 = p.x + 66;
      var plotX1 = p.x + panelW - 18;
      var plotY0 = p.y + 22;
      var axisY = p.y + panelH - 50;
      var yDom = [-0.5, 0.7];

      var sx = MDC.scale(xDom[0], xDom[1], plotX0, plotX1);
      var sy = MDC.scale(yDom[0], yDom[1], axisY, plotY0);

      // y gridlines + ticks
      MDC.ticks(yDom[0], yDom[1], 0.2).forEach(function (t) {
        if (t < yDom[0] - 1e-9 || t > yDom[1] + 1e-9) return;
        var yy = sy(t);
        MDC.el('line', { x1: plotX0, x2: plotX1, y1: yy, y2: yy,
          stroke: P.line, 'stroke-width': 0.7 }, s);
        MDC.el('text', { x: plotX0 - 8, y: yy + 4, 'text-anchor': 'end',
          'font-size': 13, fill: P.muted, text: MDC.fmt(t, 1) }, s);
      });
      // x gridlines + ticks
      MDC.ticks(xDom[0], xDom[1], xTickStep).forEach(function (t) {
        var xx = sx(t);
        MDC.el('line', { x1: xx, x2: xx, y1: plotY0, y2: axisY,
          stroke: P.line, 'stroke-width': 0.7 }, s);
        MDC.el('text', { x: xx, y: axisY + 20, 'text-anchor': 'middle',
          'font-size': 13, fill: P.muted, text: MDC.fmt(t, xTickStep < 0.1 ? 2 : 1) }, s);
      });
      // axis lines
      MDC.el('line', { x1: plotX0, x2: plotX1, y1: axisY, y2: axisY, stroke: P.ink2, 'stroke-width': 1 }, s);
      MDC.el('line', { x1: plotX0, x2: plotX0, y1: plotY0, y2: axisY, stroke: P.ink2, 'stroke-width': 1 }, s);
      // titles
      MDC.el('text', { x: (plotX0 + plotX1) / 2, y: axisY + 44, 'text-anchor': 'middle',
        'font-size': 16, 'font-weight': 600, fill: P.ink, text: xTitle }, s);
      var ymid = (plotY0 + axisY) / 2;
      MDC.el('text', { x: p.x + 20, y: ymid, 'text-anchor': 'middle',
        'font-size': 16, 'font-weight': 600, fill: P.ink,
        transform: 'rotate(-90 ' + (p.x + 20) + ' ' + ymid + ')',
        text: 'Effect size' }, s);

      // collect points
      var pts = [];
      obs.forEach(function (o) {
        var xv = o[xKey];
        if (xv == null || o.d == null) return;
        pts.push({ x: xv, y: o.d, se: o.se, tid: o.tid });
      });

      // meta-regression line + 95% confidence band (matches the paper's rma fit)
      // intercept b0 = pooled observed effect (meta_primary: dv, no controls);
      // slope beta from the published moderator test; SE_beta recovered from Q_M.
      var pooled = (window.MDC.meta_primary || []).filter(function (m) {
        return m.variable === 'dv' && m.controls === 0;
      })[0] || { d: 0.0629, se: 0.0219 };
      var b0 = pooled.d, seB0 = pooled.se;
      var beta = qm.beta || 0;
      var seBeta = (qm.QM > 0) ? Math.abs(beta) / Math.sqrt(qm.QM) : 0;

      var bandG = MDC.g(s, {});
      var lineG = MDC.g(s, {});
      var N = 60, zcrit = 1.96;
      var upper = [], lower = [];
      for (var k = 0; k <= N; k++) {
        var xv = xDom[0] + (xDom[1] - xDom[0]) * (k / N);
        var yhat = b0 + beta * xv;
        // centred moderator => Cov(b0,beta)=0, so Var(yhat) = SE_b0^2 + x^2 SE_beta^2
        var sePred = Math.sqrt(seB0 * seB0 + xv * xv * seBeta * seBeta);
        var hi = Math.max(yDom[0], Math.min(yDom[1], yhat + zcrit * sePred));
        var lo = Math.max(yDom[0], Math.min(yDom[1], yhat - zcrit * sePred));
        upper.push(sx(xv) + ',' + sy(hi));
        lower.push(sx(xv) + ',' + sy(lo));
      }
      var band = MDC.el('polygon', { points: upper.concat(lower.slice().reverse()).join(' '),
        fill: P.greenLight, 'fill-opacity': 0.30, stroke: 'none' }, bandG);
      reg(band, stepNo, 0.45);

      // regression line + dashed band edges
      var line = MDC.el('line', {
        x1: sx(xDom[0]), y1: sy(b0 + beta * xDom[0]),
        x2: sx(xDom[1]), y2: sy(b0 + beta * xDom[1]),
        stroke: P.greenDeep, 'stroke-width': 2.2 }, lineG);
      reg(line, stepNo, 0.45);
      var edgeU = MDC.el('polyline', { points: upper.join(' '), fill: 'none',
        stroke: P.green2, 'stroke-width': 1, 'stroke-dasharray': '4 3', 'stroke-opacity': 0.7 }, lineG);
      var edgeL = MDC.el('polyline', { points: lower.join(' '), fill: 'none',
        stroke: P.green2, 'stroke-width': 1, 'stroke-dasharray': '4 3', 'stroke-opacity': 0.7 }, lineG);
      reg(edgeU, stepNo, 0.45); reg(edgeL, stepNo, 0.45);

      // bubbles (pop first), hollow grey, inverse-se sizing
      var bubG = MDC.g(s, {});
      pts.forEach(function (pt, i) {
        var cx = sx(pt.x), cy = sy(pt.y);
        var rad = Math.max(3.5, Math.min(11, 3 + (0.107 / pt.se) * 5));
        var c = MDC.el('circle', { cx: cx, cy: cy, r: rad, fill: 'none',
          stroke: '#9A9A8E', 'stroke-width': 1.1, 'stroke-opacity': 0.85 }, bubG);
        reg(c, stepNo, (i / pts.length) * 0.25);
        var t = MDC.el('text', { x: cx, y: cy - rad - 2, 'text-anchor': 'middle',
          'font-size': 7.5, fill: '#A8A89A', text: pt.tid }, bubG);
        reg(t, stepNo, (i / pts.length) * 0.25);
      });

      // stats box bottom-right (4 lines: R², Q_M, β, τ — matches paper)
      // appears together with this panel.
      var sb = statsBox(plotX1 - 4, axisY - 6, [
        'R² = ' + MDC.fmt(qm.R2, 1) + '%',
        'Qm(' + qm.df + ') = ' + MDC.fmt(qm.QM, 2) + ',  p = ' + MDC.fmt(qm.p, 3),
        'β = ' + MDC.fmt(qm.beta, 3) + ',  p = ' + MDC.fmt(qm.p, 3),
        'τ = ' + MDC.fmt(qm.tau, 3) + ', p < 0.001'
      ]);
      reg(sb, stepNo, 0.45);
    }

    buildScatter(panels.c, 'c', 'info_dm', [-2.2, 2.0], 0.5,
      'Peer-assessed informativeness', D.informativeness_QM || {}, 3);
    buildScatter(panels.d, 'd', 'eff_dm', [-0.16, 0.18], 0.05,
      'Peer-assessed effect size', D.peereffect_QM || {}, 4);

    // ============================================================
    //  CONTROLLER
    // ============================================================
    function apply(i) {
      for (var k = 0; k < anim.length; k++) {
        anim[k].node.style.opacity = (anim[k].step <= i) ? '1' : '0';
      }
    }
    return {
      steps: 4,
      play: function (i) { apply(i); },
      reset: function () { apply(0); }
    };
  };
})();
