/* ============================================================
   violinS6 — Figure S6 (appendix) rebuilt as a TRUE data-driven
   animated violin figure (no bitmap). Four categories left->right:
     "No Controls"   (green)   = observed univariate d  (figS8.d_uni)
     "Controls"      (amber)   = observed multivariate d (figS8.d_ctrl)
     "RTs own belief"(blue)    = forest_observed.self
     "Peer RTs belief"(yellow) = forest_observed.peer
   Each violin = width-normalised gaussian KDE (Silverman bandwidth),
   mirrored as one closed path; overlaid with jittered points + a
   boxplot (Q1-Q3 box, median line, whiskers).
   Mann-Whitney brackets (overconfidence story): two stacked on TOP,
   two stacked on the BOTTOM.
   STEPS (4):
     1 -> No Controls + Controls violins bloom (scaleX 0->1) + pts + box
     2 -> RTs own belief violin blooms (tall thin spike) + pts + box
     3 -> Peer RTs belief violin blooms + pts + box
     4 -> the four Mann-Whitney brackets + r-labels fade in
   ============================================================ */
(function () {
  var MDC = (window.MDC = window.MDC || {});
  MDC.figures = MDC.figures || {};

  MDC.figures['violinS6'] = function (mount, opts) {
    var P = (opts && opts.palette) || MDC.palette;

    // ---------- assemble the four distributions ----------
    var s8 = {}; (MDC.figS8 || []).forEach(function (r) { s8[r.tid] = r; });
    var noctrl = [], ctrl = [], own = [], peer = [];
    (MDC.forest_observed || []).forEach(function (r) {
      var rec = s8[r.tid];
      if (rec) {
        if (rec.d_uni != null) noctrl.push(rec.d_uni);
        if (rec.d_ctrl != null) ctrl.push(rec.d_ctrl);
      }
      if (r.self != null) own.push(r.self);
      if (r.peer != null) peer.push(r.peer);
    });

    // ---------- local colours ----------
    var COL = {
      green:  { fill: '#BFD8A8', stroke: '#5E8C43' },
      amber:  { fill: '#F2C99A', stroke: '#C9802F' },
      blue:   { fill: '#A7C9E8', stroke: '#5B8FB9' },
      yellow: { fill: '#F1D88B', stroke: '#CDA53B' }
    };

    var CATS = [
      { key: 'noctrl', label: 'No Controls',     data: noctrl, col: COL.green },
      { key: 'ctrl',   label: 'Controls',        data: ctrl,   col: COL.amber },
      { key: 'own',    label: 'RTs own belief',  data: own,    col: COL.blue },
      { key: 'peer',   label: 'Peer RTs belief', data: peer,   col: COL.yellow }
    ];

    // ---------- geometry ----------
    var VBW = 1240, VBH = 720;
    var s = MDC.svg(mount, VBW, VBH);

    var mL = 120, mR = 36, mT = 118, mB = 150;
    var plotX0 = mL, plotX1 = VBW - mR;
    var plotW = plotX1 - plotX0;
    var plotY0 = mT, plotY1 = VBH - mB;          // top..bottom of plot
    var plotH = plotY1 - plotY0;

    var DMIN = -0.6, DMAX = 1.6;
    var y = MDC.scale(DMIN, DMAX, plotY1, plotY0);   // domain -> pixels (inverted)

    // even category spacing
    var nCat = CATS.length;
    var slotW = plotW / nCat;
    function cx(i) { return plotX0 + slotW * (i + 0.5); }
    var halfWidth = slotW * 0.40;   // max half-width of each violin

    // ---------- stats helpers ----------
    function quantile(sorted, q) {
      var n = sorted.length;
      var pos = (n - 1) * q;
      var lo = Math.floor(pos), hi = Math.ceil(pos);
      if (lo === hi) return sorted[lo];
      return sorted[lo] + (sorted[hi] - sorted[lo]) * (pos - lo);
    }
    function describe(arr) {
      var a = arr.slice().sort(function (x, y) { return x - y; });
      var n = a.length;
      var mean = a.reduce(function (s, v) { return s + v; }, 0) / n;
      var variance = a.reduce(function (s, v) { return s + (v - mean) * (v - mean); }, 0) / (n - 1);
      var sd = Math.sqrt(variance);
      var q1 = quantile(a, 0.25), med = quantile(a, 0.5), q3 = quantile(a, 0.75);
      var iqr = q3 - q1;
      // whiskers: 1.5*IQR Tukey fences, clamped to data extremes
      var loFence = q1 - 1.5 * iqr, hiFence = q3 + 1.5 * iqr;
      var wLo = a[0], wHi = a[n - 1];
      for (var k = 0; k < n; k++) { if (a[k] >= loFence) { wLo = a[k]; break; } }
      for (var j = n - 1; j >= 0; j--) { if (a[j] <= hiFence) { wHi = a[j]; break; } }
      return { sorted: a, n: n, sd: sd, q1: q1, med: med, q3: q3, iqr: iqr,
               min: a[0], max: a[n - 1], wLo: wLo, wHi: wHi };
    }

    // Silverman bandwidth: 0.9 * min(sd, IQR/1.349) * n^(-1/5)
    function silverman(st) {
      var spread = Math.min(st.sd, st.iqr / 1.349);
      if (!(spread > 0)) spread = st.sd || 0.05;
      return 0.9 * spread * Math.pow(st.n, -0.2);
    }
    function gauss(u) { return Math.exp(-0.5 * u * u) / Math.sqrt(2 * Math.PI); }

    // KDE evaluated on a fine y-grid; returns {grid:[dValues], dens:[...], maxDens}
    function kde(st, bw) {
      var grid = [], dens = [];
      // trim violin to the data extent (+ small pad ~ one bandwidth) so we don't
      // draw long thin density needles out to the plot edges, like the reference.
      var pad = bw * 1.6;
      var lo = st.min - pad;
      var hi = st.max + pad;
      var steps = 200;
      var maxD = 0;
      for (var g = 0; g <= steps; g++) {
        var dv = lo + (hi - lo) * (g / steps);
        var sum = 0;
        for (var k = 0; k < st.n; k++) sum += gauss((dv - st.sorted[k]) / bw);
        sum = sum / (st.n * bw);
        grid.push(dv); dens.push(sum);
        if (sum > maxD) maxD = sum;
      }
      return { grid: grid, dens: dens, maxDens: maxD };
    }

    // ---------- static chrome: y-axis, gridlines, ticks ----------
    var chrome = MDC.g(s);
    var gridVals = [-0.5, 0.0, 0.5, 1.0, 1.5];
    gridVals.forEach(function (gv) {
      var py = y(gv);
      var zero = Math.abs(gv) < 1e-9;
      MDC.el('line', {
        x1: plotX0, x2: plotX1, y1: py, y2: py,
        stroke: zero ? P.ink2 : P.line2,
        'stroke-width': zero ? 1.8 : 1,
        opacity: zero ? 0.85 : 0.7
      }, chrome);
      MDC.el('text', {
        x: plotX0 - 16, y: py + 6, 'text-anchor': 'end',
        'font-size': 22, fill: P.ink2,
        text: (gv === 0 ? '0.0' : gv.toFixed(1))
      }, chrome);
    });

    // y-axis title "Effect Size (Cohen's d)" with d italic
    var yt = MDC.el('text', {
      x: 34, y: (plotY0 + plotY1) / 2,
      'font-size': 24, fill: P.ink, 'text-anchor': 'middle',
      transform: 'rotate(-90 34 ' + ((plotY0 + plotY1) / 2) + ')'
    }, chrome);
    MDC.el('tspan', { text: "Effect Size (Cohen's " }, yt);
    MDC.el('tspan', { text: 'd', 'font-style': 'italic' }, yt);
    MDC.el('tspan', { text: ')' }, yt);

    // ---------- category labels (static, visible from step 1) ----------
    CATS.forEach(function (c, i) {
      MDC.el('text', {
        x: cx(i), y: plotY1 + 42, 'text-anchor': 'middle',
        'font-size': 23, 'font-weight': 700, fill: P.ink, text: c.label
      }, chrome);
    });

    // ---------- build each violin group ----------
    function buildViolin(c, i) {
      var st = describe(c.data);
      var bw = silverman(st);
      var k = kde(st, bw);
      var xc = cx(i);

      var g = MDC.g(s, { opacity: 0 });
      g.style.transformBox = 'fill-box';
      g.style.transformOrigin = 'center';
      g.style.transform = 'scaleX(0.03)';
      g.style.transition = 'opacity .55s ease, transform .6s cubic-bezier(.4,0,.2,1)';

      // --- violin path (width-normalised: maxDens -> halfWidth) ---
      var scaleW = halfWidth / k.maxDens;
      var right = [], left = [];
      for (var gi = 0; gi < k.grid.length; gi++) {
        var py = y(k.grid[gi]);
        var hw = k.dens[gi] * scaleW;
        right.push((xc + hw).toFixed(2) + ',' + py.toFixed(2));
        left.unshift((xc - hw).toFixed(2) + ',' + py.toFixed(2));
      }
      var dpath = 'M' + right.join(' L') + ' L' + left.join(' L') + ' Z';
      MDC.el('path', {
        d: dpath, fill: c.col.fill, 'fill-opacity': 0.78,
        stroke: c.col.stroke, 'stroke-width': 2, 'stroke-linejoin': 'round'
      }, g);

      // --- jittered individual points ---
      // deterministic jitter within the violin body at each point's d
      function densAt(dv) {
        // nearest-grid density lookup
        var t = (dv - k.grid[0]) / (k.grid[k.grid.length - 1] - k.grid[0]);
        var idx = Math.round(t * (k.grid.length - 1));
        idx = Math.max(0, Math.min(k.grid.length - 1, idx));
        return k.dens[idx];
      }
      var seed = (i + 1) * 99991;
      function rnd() { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; }
      var ptsG = MDC.g(g);
      c.data.forEach(function (dv) {
        var py = y(dv);
        var bodyHW = Math.max(2, densAt(dv) * scaleW);
        var jx = (rnd() * 2 - 1) * bodyHW * 0.62;
        MDC.el('circle', {
          cx: (xc + jx).toFixed(2), cy: py.toFixed(2), r: 3.0,
          fill: 'none', stroke: c.col.stroke, 'stroke-width': 1.0, opacity: 0.55
        }, ptsG);
      });

      // --- boxplot ---
      var boxHW = halfWidth * 0.16;   // narrow box
      var yQ1 = y(st.q1), yQ3 = y(st.q3), yMed = y(st.med);
      var yWlo = y(st.wLo), yWhi = y(st.wHi);
      var boxG = MDC.g(g);
      // whisker line
      MDC.el('line', { x1: xc, x2: xc, y1: yWhi, y2: yQ3, stroke: P.ink2, 'stroke-width': 1.3 }, boxG);
      MDC.el('line', { x1: xc, x2: xc, y1: yQ1, y2: yWlo, stroke: P.ink2, 'stroke-width': 1.3 }, boxG);
      // whisker caps
      MDC.el('line', { x1: xc - boxHW * 0.6, x2: xc + boxHW * 0.6, y1: yWhi, y2: yWhi, stroke: P.ink2, 'stroke-width': 1.3 }, boxG);
      MDC.el('line', { x1: xc - boxHW * 0.6, x2: xc + boxHW * 0.6, y1: yWlo, y2: yWlo, stroke: P.ink2, 'stroke-width': 1.3 }, boxG);
      // box
      MDC.el('rect', {
        x: xc - boxHW, y: yQ3, width: boxHW * 2, height: (yQ1 - yQ3),
        fill: '#FFFFFF', 'fill-opacity': 0.92, stroke: P.ink2, 'stroke-width': 1.4
      }, boxG);
      // median
      MDC.el('line', { x1: xc - boxHW, x2: xc + boxHW, y1: yMed, y2: yMed, stroke: P.ink, 'stroke-width': 2.0 }, boxG);

      return { g: g, st: st, xc: xc, bw: bw };
    }

    var violins = CATS.map(buildViolin);

    // ---------- Mann-Whitney brackets ----------
    // helper: a square bracket spanning category indices a..b at pixel yLevel,
    // ticks pointing toward the violins (dir = -1 means ticks go down to violins
    // for a TOP bracket; dir = +1 means ticks go up for a BOTTOM bracket).
    function bracket(parent, ia, ib, yLevel, dir, label, labelAbove) {
      var x1 = cx(ia), x2 = cx(ib);
      var tick = 12 * dir;   // tick length toward the violins
      var d = 'M' + x1 + ',' + (yLevel + tick) +
              ' L' + x1 + ',' + yLevel +
              ' L' + x2 + ',' + yLevel +
              ' L' + x2 + ',' + (yLevel + tick);
      MDC.el('path', { d: d, fill: 'none', stroke: P.ink2, 'stroke-width': 1.6 }, parent);
      var ly = labelAbove ? (yLevel - 10) : (yLevel + 22);
      MDC.el('text', {
        x: (x1 + x2) / 2, y: ly, 'text-anchor': 'middle',
        'font-size': 19, fill: P.ink, text: label
      }, parent);
    }

    var brG = MDC.g(s, { opacity: 0 });
    brG.style.transition = 'opacity .6s ease';

    // TOP brackets (ticks point DOWN toward violins): dir = +1 — match the paper's stacking:
    //   topmost : No Controls(0) <-> RTs own belief(2)  (wider span, r = 0.668)
    //   inner   : Controls(1)    <-> RTs own belief(2)  (closer to plot, r = 0.649)
    var topInnerY = plotY0 - 30;   // Controls <-> own  (closer to plot)
    var topOuterY = plotY0 - 78;   // No Controls <-> own  (topmost, wider span)
    bracket(brG, 0, 2, topOuterY, +1, 'r = 0.668, 99.5% CI [0.470; 0.800], p < 0.005', true);
    bracket(brG, 1, 2, topInnerY, +1, 'r = 0.649, 99.5% CI [0.450; 0.790], p < 0.005', true);

    // BOTTOM brackets (ticks point UP toward violins): dir = -1
    //   inner : Controls(1)    <-> Peer RTs belief(3)  (closer to plot, r = 0.671)
    //   outer : No Controls(0) <-> Peer RTs belief(3)  (lowest, wider span, r = 0.672)
    var botInnerY = plotY1 + 62;   // Controls <-> peer
    var botOuterY = plotY1 + 104;  // No Controls <-> peer (lower)
    bracket(brG, 1, 3, botInnerY, -1, 'r = 0.671, 99.5% CI [0.480; 0.810], p < 0.005', false);
    bracket(brG, 0, 3, botOuterY, -1, 'r = 0.672, 99.5% CI [0.470; 0.810], p < 0.005', false);

    // ---------- controller ----------
    function showViolin(v, on) {
      v.g.style.opacity = on ? 1 : 0;
      v.g.style.transform = on ? 'scaleX(1)' : 'scaleX(0.03)';
    }
    function play(i) {
      showViolin(violins[0], i >= 1);  // No Controls
      showViolin(violins[1], i >= 1);  // Controls
      showViolin(violins[2], i >= 2);  // RTs own belief
      showViolin(violins[3], i >= 3);  // Peer RTs belief
      brG.style.opacity = i >= 4 ? 1 : 0;
    }
    function reset() { play(0); }
    reset();

    return { steps: 4, play: play, reset: reset };
  };
})();
