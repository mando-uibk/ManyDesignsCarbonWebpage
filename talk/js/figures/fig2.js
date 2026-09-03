/* ============================================================
   FIG 2 — Pooled meta-effects: two mini-forest panels.
   LEFT  (a) Primary outcomes (H1/H2), 6 outcomes x 2 rows.
   RIGHT (b) Secondary outcomes (H3), 6 outcomes x 2 rows.
   Each outcome: "No controls" (green diamond) + "Controls"
   (amber square), each a 95% CI line. To the right of each
   panel: three columns Q, I^2, tau. Significance stars.
   x-axis Cohen's d -0.05..0.15, gridlines, bold line at 0.
   STEPS (3): 1 primary draws; 2 secondary draws;
   3 highlight band over d in [0.04,0.08].
   ============================================================ */
(function () {
  var MDC = window.MDC;

  MDC.figures['fig2'] = function (mount, opts) {
    var P = opts.palette || MDC.palette;

    // ---- label order / selection ----
    var PRIMARY = [
      ['dv', 'General support', '(observed)'],
      ['cp_support', 'General support', '(stated)'],
      ['cp_raise', 'General price', 'increase'],
      ['sp_cp_support', 'Social price', null],
      ['ct_cp_support', 'Tax with rebates', null],
      ['spct_cp_support', 'Social price', 'with rebates']
    ];
    var SECONDARY = [
      ['cp_fairness', 'Fairness', null],
      ['will_climatefriendly_index', 'Adoption', null],
      ['beliefs_effectiveness_index', 'Effectiveness', null],
      ['worries_index', 'Worries', null],
      ['beliefs_netzero', 'Net-zero', null],
      ['beliefs_own', 'Climate change', 'harms own life']
    ];

    function index(arr) {
      var m = {};
      (arr || []).forEach(function (r) { m[r.variable + '|' + r.controls] = r; });
      return m;
    }
    var pm = index(window.MDC.meta_primary);
    var sm = index(window.MDC.meta_secondary);

    // ---- geometry ----
    var VBW = 1520, VBH = 720;
    var s = MDC.svg(mount, VBW, VBH);

    // domain
    var DMIN = -0.05, DMAX = 0.15;

    var topY = 70;            // top of plots
    var rowsPerPanel = 6;
    var groupH = 78;          // vertical space per outcome (2 marker rows)
    var plotBottom = topY + rowsPerPanel * groupH;   // 538
    var axisY = plotBottom + 4;

    var panelGap = 36;
    var blockW = (VBW - panelGap) / 2;   // ~742

    function makeBlock(x0) {
      var labelW = 222;      // left label gutter (wide enough for "Tax with rebates" etc. to clear the edge)
      var statW = 200;       // Q / I2 / tau columns on the right
      var plotX0 = x0 + labelW;
      var plotX1 = x0 + blockW - statW;
      return {
        x0: x0, labelW: labelW, statW: statW,
        plotX0: plotX0, plotX1: plotX1,
        sx: MDC.scale(DMIN, DMAX, plotX0, plotX1)
      };
    }
    var BL = makeBlock(0);
    var BR = makeBlock(blockW + panelGap);

    var offNo = -18, offCt = 18;

    function gridTicks() { return [-0.05, 0, 0.05, 0.10, 0.15]; }

    // ---------- per-block static chrome ----------
    function drawChrome(B, panelLetter) {
      var g = MDC.g(s);

      MDC.el('text', {
        x: B.x0, y: 30, text: panelLetter,
        'font-size': 30, 'font-weight': 700, fill: P.ink
      }, g);

      gridTicks().forEach(function (t) {
        var x = B.sx(t);
        var zero = Math.abs(t) < 1e-9;
        MDC.el('line', {
          x1: x, x2: x, y1: topY, y2: plotBottom,
          stroke: zero ? P.ink : P.line2,
          'stroke-width': zero ? 2.2 : 1
        }, g);
        MDC.el('text', {
          x: x, y: axisY + 26, text: MDC.fmt(t, 2),
          'font-size': 19, fill: P.ink2, 'text-anchor': 'middle'
        }, g);
      });

      // plot frame
      MDC.el('line', { x1: B.plotX0, x2: B.plotX1, y1: topY, y2: topY, stroke: P.line2, 'stroke-width': 1 }, g);
      MDC.el('line', { x1: B.plotX0, x2: B.plotX1, y1: plotBottom, y2: plotBottom, stroke: P.ink, 'stroke-width': 1.4 }, g);
      MDC.el('line', { x1: B.plotX0, x2: B.plotX0, y1: topY, y2: plotBottom, stroke: P.ink, 'stroke-width': 1.4 }, g);
      MDC.el('line', { x1: B.plotX1, x2: B.plotX1, y1: topY, y2: plotBottom, stroke: P.line2, 'stroke-width': 1 }, g);

      MDC.el('text', {
        x: (B.plotX0 + B.plotX1) / 2, y: axisY + 60,
        text: "Cohen's d", 'font-size': 23, 'font-style': 'italic',
        fill: P.ink, 'text-anchor': 'middle'
      }, g);

      // stat columns
      var statX0 = B.plotX1 + 18;
      var colQ = statX0;           // Q values left-anchored here
      var colI = statX0 + 104;     // I^2 centered here
      var colT = statX0 + 158;     // tau centered here
      B._colQ = colQ; B._colI = colI; B._colT = colT;

      MDC.el('text', { x: colQ + 34, y: topY - 16, text: 'Q', 'font-size': 21, 'font-style': 'italic', fill: P.ink, 'text-anchor': 'middle' }, g);
      var iLabel = MDC.el('text', { x: colI, y: topY - 16, 'font-size': 21, 'font-style': 'italic', fill: P.ink, 'text-anchor': 'middle' }, g);
      MDC.el('tspan', { text: 'I' }, iLabel);
      MDC.el('tspan', { text: '2', 'baseline-shift': 'super', 'font-size': 14 }, iLabel);
      MDC.el('text', { x: colT, y: topY - 16, text: 'τ', 'font-size': 21, 'font-style': 'italic', fill: P.ink, 'text-anchor': 'middle' }, g);

      return g;
    }

    function stars(p2) {
      if (p2 == null || isNaN(p2)) return '';
      if (p2 < 0.005) return '**';
      if (p2 < 0.05) return '*';
      return '';
    }

    // ---------- build one panel's data rows ----------
    function buildPanel(B, spec, dataIdx) {
      var anim = [];

      spec.forEach(function (row, gi) {
        var varName = row[0], lab1 = row[1], lab2 = row[2];
        var cy = topY + gi * groupH + groupH / 2;

        var g = MDC.g(s);

        var labX = B.plotX0 - 16;
        if (lab2) {
          MDC.el('text', { x: labX, y: cy - 9, text: lab1, 'font-size': 21, 'font-weight': 700, fill: P.ink, 'text-anchor': 'end' }, g);
          MDC.el('text', { x: labX, y: cy + 17, text: lab2, 'font-size': 21, 'font-weight': 700, fill: P.ink, 'text-anchor': 'end' }, g);
        } else {
          MDC.el('text', { x: labX, y: cy + 7, text: lab1, 'font-size': 21, 'font-weight': 700, fill: P.ink, 'text-anchor': 'end' }, g);
        }

        function drawEst(rec, yoff, kind) {
          if (!rec) return;
          var y = cy + yoff;
          var col = (kind === 'no') ? P.green : P.amber;
          var fill = (kind === 'no') ? P.greenLight : P.amberSoft;
          var x0 = B.sx(rec.ci_low), x1 = B.sx(rec.ci_high), xc = B.sx(rec.d);
          var xZero = B.sx(0);

          var rg = MDC.g(s, { opacity: 0 });
          rg.style.transition = 'opacity .45s ease, transform .55s ease';
          rg.style.transformOrigin = xZero + 'px ' + y + 'px';

          MDC.el('line', { x1: x0, x2: x1, y1: y, y2: y, stroke: col, 'stroke-width': 2.4 }, rg);
          MDC.el('line', { x1: x0, x2: x0, y1: y - 5, y2: y + 5, stroke: col, 'stroke-width': 2.0 }, rg);
          MDC.el('line', { x1: x1, x2: x1, y1: y - 5, y2: y + 5, stroke: col, 'stroke-width': 2.0 }, rg);

          if (kind === 'no') {
            var r = 11;
            MDC.el('polygon', {
              points: [xc, y - r, xc + r, y, xc, y + r, xc - r, y].join(' '),
              fill: fill, stroke: col, 'stroke-width': 2.0
            }, rg);
          } else {
            var hw = 9.5;
            MDC.el('rect', {
              x: xc - hw, y: y - hw, width: hw * 2, height: hw * 2,
              fill: fill, stroke: col, 'stroke-width': 2.0
            }, rg);
          }

          var st = stars(rec.p2);
          if (st) {
            MDC.el('text', {
              x: xc + 14, y: y - 6, text: st,
              'font-size': 21, 'font-weight': 700, fill: P.ink, 'text-anchor': 'start'
            }, rg);
          }

          // stat columns
          var sg = MDC.g(s, { opacity: 0 });
          sg.style.transition = 'opacity .45s ease';
          var qStr = MDC.fmt(rec.Q, 2);
          var qStar = stars(rec.Q_p);
          var qText = MDC.el('text', {
            x: B._colQ, y: y + 7, 'font-size': 19, fill: P.ink2, 'text-anchor': 'start'
          }, sg);
          MDC.el('tspan', { text: qStr }, qText);
          if (qStar) MDC.el('tspan', { text: qStar }, qText);
          MDC.el('text', {
            x: B._colI, y: y + 7, text: MDC.fmt(rec.I2, 1) + '%',
            'font-size': 19, fill: P.ink2, 'text-anchor': 'middle'
          }, sg);
          MDC.el('text', {
            x: B._colT, y: y + 7, text: MDC.fmt(rec.tau, 2),
            'font-size': 19, fill: P.ink2, 'text-anchor': 'middle'
          }, sg);

          anim.push({ row: rg, stat: sg, xc: xc, y: y, xZero: xZero });
        }

        drawEst(dataIdx[varName + '|0'], offNo, 'no');
        drawEst(dataIdx[varName + '|1'], offCt, 'ct');
      });

      return anim;
    }

    // ---------- highlight band (step 3) ----------
    function buildBand(B) {
      var x0 = B.sx(0.04), x1 = B.sx(0.08);
      var bg = MDC.g(s, { opacity: 0 });
      bg.style.transition = 'opacity .5s ease';
      MDC.el('rect', {
        x: x0, y: topY, width: x1 - x0, height: plotBottom - topY,
        fill: P.green, opacity: 0.10
      }, bg);
      MDC.el('line', { x1: x0, x2: x0, y1: topY, y2: plotBottom, stroke: P.green2, 'stroke-width': 1, 'stroke-dasharray': '4 4', opacity: 0.6 }, bg);
      MDC.el('line', { x1: x1, x2: x1, y1: topY, y2: plotBottom, stroke: P.green2, 'stroke-width': 1, 'stroke-dasharray': '4 4', opacity: 0.6 }, bg);
      // small pill label just above the plot, centered on band; clear of headers (which sit far right) and of markers
      var lx = (x0 + x1) / 2, lyb = topY - 22;
      MDC.el('rect', {
        x: lx - 64, y: lyb - 15, width: 128, height: 22, rx: 4,
        fill: P.bg, stroke: P.green2, 'stroke-width': 1, opacity: 0.92
      }, bg);
      MDC.el('text', {
        x: lx, y: lyb + 1,
        text: 'd ≈ 0.04–0.08',
        'font-size': 17, 'font-style': 'italic', fill: P.green, 'font-weight': 700,
        'text-anchor': 'middle'
      }, bg);
      return bg;
    }

    // ---------- legend ----------
    // Rendered as ONE <text> with coloured tspans (so it can never split into two rows
    // under reveal's scaled SVG rasterisation) and start-anchored at a *measured* centre
    // (so text-anchor:middle's headless metric bug can't shift it).
    function drawLegend() {
      var g = MDC.g(s);
      var ly = VBH - 22, cx = VBW / 2, fs = 19;
      var SEP = '  ';   // two em-spaces between items
      var parts = [
        { t: '◆ ', c: P.green },  { t: 'No controls', c: P.ink }, { t: SEP, c: P.ink },
        { t: '■ ', c: P.amber },  { t: 'Controls', c: P.ink },    { t: SEP, c: P.ink },
        { t: '— ', c: P.muted }, { t: '95% CI', c: P.ink }
      ];
      var str = parts.map(function (p) { return p.t; }).join('');
      var m = MDC.el('text', { x: -9999, y: -9999, 'font-size': fs,
        'font-family': "'Montserrat',sans-serif", 'font-weight': 600, text: str }, s);
      var w = m.getComputedTextLength ? m.getComputedTextLength() : str.length * fs * 0.55;
      s.removeChild(m);
      var txt = MDC.el('text', { x: cx - w / 2, y: ly + 6, 'text-anchor': 'start',
        'font-size': fs, 'font-weight': 600, fill: P.ink }, g);
      parts.forEach(function (p) {
        var ts = document.createElementNS(MDC.SVGNS, 'tspan');
        ts.setAttribute('fill', p.c); ts.textContent = p.t; txt.appendChild(ts);
      });
    }

    // ===== build everything =====
    drawChrome(BL, 'a');
    drawChrome(BR, 'b');
    var animL = buildPanel(BL, PRIMARY, pm);
    var animR = buildPanel(BR, SECONDARY, sm);
    var bandL = buildBand(BL);   // band/label only on the PRIMARY panel (a)
    drawLegend();

    function showAnim(list, on) {
      list.forEach(function (a, i) {
        var delay = (i * 0.06).toFixed(2) + 's';
        a.row.style.transitionDelay = on ? delay : '0s';
        a.stat.style.transitionDelay = on ? (i * 0.06 + 0.15).toFixed(2) + 's' : '0s';
        if (on) {
          a.row.style.opacity = 1;
          a.row.style.transform = 'none';
          a.stat.style.opacity = 1;
        } else {
          a.row.style.opacity = 0;
          a.row.style.transform = 'translateX(' + (a.xZero - a.xc) + 'px) scaleX(0.04)';
          a.stat.style.opacity = 0;
        }
      });
    }

    function play(i) {
      showAnim(animL, i >= 1);
      showAnim(animR, i >= 2);
      bandL.style.opacity = i >= 3 ? 1 : 0;
    }

    function reset() { play(0); }
    reset();

    return { steps: 3, play: play, reset: reset };
  };
})();
