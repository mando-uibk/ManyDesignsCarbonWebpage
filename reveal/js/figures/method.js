/* method — analysis pipeline (study analysis). Clean pipeline + connected robustness band. */
(function () {
  var MDC = (window.MDC = window.MDC || {}); MDC.figures = MDC.figures || {};

  MDC.figures['method'] = function (mount, opts) {
    var P = (opts && opts.palette) || MDC.palette;
    var VBW = 1200, VBH = 440;
    var s = MDC.svg(mount, VBW, VBH);

    var defs = MDC.el('defs', {}, s);
    function marker(id, color) {
      var m = MDC.el('marker', { id: id, viewBox: '0 0 10 10', refX: 8.5, refY: 5,
        markerWidth: 7, markerHeight: 7, orient: 'auto-start-reverse' }, defs);
      MDC.el('path', { d: 'M0,0 L10,5 L0,10 Z', fill: color }, m);
    }
    marker('mh', P.muted); marker('ma', P.amber);

    var reg = [];
    function add(el, step) { el.style.opacity = '0'; el.style.transition = 'opacity .5s ease'; reg.push({ el: el, step: step }); return el; }
    function arrow(parent, d, opt) {
      opt = opt || {};
      return MDC.el('path', { d: d, fill: 'none', stroke: opt.stroke || P.muted, 'stroke-width': opt.sw || 2,
        'stroke-dasharray': opt.dash || 'none', 'marker-end': 'url(#' + (opt.m || 'mh') + ')' }, parent);
    }

    var cyTop = 90, cardH = 122, cy = cyTop + cardH / 2;          // 151
    function card(x, w, eyebrow, title, sub, opt) {
      opt = opt || {};
      var g = MDC.g(s, {});
      MDC.el('rect', { x: x, y: cyTop, width: w, height: cardH, rx: 12, fill: opt.fill || '#fff',
        stroke: opt.stroke || P.line2, 'stroke-width': 1.4 }, g);
      MDC.el('text', { x: x + w / 2, y: cyTop + 24, 'text-anchor': 'middle', 'font-size': 10.5,
        'font-weight': 700, 'letter-spacing': 1, fill: opt.ec || P.muted, text: eyebrow }, g);
      MDC.el('text', { x: x + w / 2, y: cyTop + 60, 'text-anchor': 'middle', 'font-size': opt.fs || 18,
        'font-weight': 700, fill: opt.tc || P.greenDeep, text: title }, g);
      if (opt.title2) MDC.el('text', { x: x + w / 2, y: cyTop + 82, 'text-anchor': 'middle', 'font-size': opt.fs || 18,
        'font-weight': 700, fill: opt.tc || P.greenDeep, text: opt.title2 }, g);
      if (sub) MDC.el('text', { x: x + w / 2, y: cyTop + (opt.title2 ? 102 : 86), 'text-anchor': 'middle',
        'font-size': 11.5, 'font-weight': 500, fill: opt.subc || P.muted, text: sub }, g);
      return g;
    }
    function chip(parent, x, y, w, label) {
      var g = MDC.g(parent, {});
      MDC.el('rect', { x: x, y: y, width: w, height: 40, rx: 20, fill: P.bg2, stroke: P.amber, 'stroke-width': 1.2 }, g);
      MDC.el('text', { x: x + w / 2, y: y + 25, 'text-anchor': 'middle', 'font-size': 13.5, 'font-weight': 700, fill: P.greenDeep, text: label }, g);
      return g;
    }

    // pipeline x-layout (5 boxes, equal gaps)
    var gap = 26;
    var x1 = 24, w1 = 146;
    var x2 = x1 + w1 + gap, w2 = 246;
    var x3 = x2 + w2 + gap, w3 = 212;
    var x4 = x3 + w3 + gap, w4 = 240;
    var x5 = x4 + w4 + gap, w5 = 186;     // ends at 1176

    // step 1: 55 studies + OLS
    var g1 = MDC.g(s, {});
    // INPUT card drawn manually so the dot grid + text fit cleanly with margin
    var c1 = MDC.g(g1, {});
    MDC.el('rect', { x: x1, y: cyTop, width: w1, height: cardH, rx: 12, fill: P.greenDeep, stroke: P.greenDeep, 'stroke-width': 1.4 }, c1);
    MDC.el('text', { x: x1 + w1 / 2, y: cyTop + 22, 'text-anchor': 'middle', 'font-size': 10.5, 'font-weight': 700, 'letter-spacing': 1, fill: '#9DBBA6', text: 'INPUT' }, c1);
    // compact dot grid (5 cols x 4 rows = 20 markers) sitting in its own band, no overlap
    var dcx = x1 + w1 / 2 - 18, dgy = cyTop + 36;
    for (var r = 0; r < 4; r++) for (var c = 0; c < 5; c++)
      MDC.el('circle', { cx: dcx + c * 9, cy: dgy + r * 7, r: 1.7, fill: '#7FB08F' }, c1);
    MDC.el('text', { x: x1 + w1 / 2, y: cyTop + 92, 'text-anchor': 'middle', 'font-size': 18, 'font-weight': 700, fill: '#fff', text: '55 studies' }, c1);
    MDC.el('text', { x: x1 + w1 / 2, y: cyTop + 112, 'text-anchor': 'middle', 'font-size': 11.5, 'font-weight': 500, fill: '#BFD6C6', text: 'one RCT per team' }, c1);
    arrow(g1, 'M' + (x1 + w1) + ',' + cy + ' H' + x2, {});
    // OLS card drawn manually so a proper centred regression plot fits between title and caption
    var c2 = MDC.g(g1, {});
    MDC.el('rect', { x: x2, y: cyTop, width: w2, height: cardH, rx: 12, fill: '#fff', stroke: P.line2, 'stroke-width': 1.4 }, c2);
    MDC.el('text', { x: x2 + w2 / 2, y: cyTop + 20, 'text-anchor': 'middle', 'font-size': 10.5, 'font-weight': 700, 'letter-spacing': 1, fill: P.green2, text: 'PER STUDY' }, c2);
    MDC.el('text', { x: x2 + w2 / 2, y: cyTop + 42, 'text-anchor': 'middle', 'font-size': 18, 'font-weight': 700, fill: P.greenDeep, text: 'OLS regression' }, c2);
    // centred regression plot (scatter + fitted line) — sized to sit cleanly in the card with margin
    var plW = 90, plH = 40;
    var plX = x2 + (w2 - plW) / 2, plY = cyTop + 52;   // band between title and caption
    // axes
    MDC.el('line', { x1: plX, y1: plY, x2: plX, y2: plY + plH, stroke: P.line2, 'stroke-width': 1.2 }, c2);
    MDC.el('line', { x1: plX, y1: plY + plH, x2: plX + plW, y2: plY + plH, stroke: P.line2, 'stroke-width': 1.2 }, c2);
    // fitted regression line (rises left->right within the plot frame, inset slightly)
    MDC.el('line', { x1: plX + 4, y1: plY + plH - 5, x2: plX + plW - 4, y2: plY + 6, stroke: P.green, 'stroke-width': 2 }, c2);
    // scatter of points around the line (fractions of plot width/height)
    var pts = [[0.08, 0.86], [0.22, 0.62], [0.30, 0.74], [0.44, 0.50], [0.55, 0.58], [0.66, 0.34], [0.78, 0.40], [0.90, 0.16]];
    pts.forEach(function (p) { MDC.el('circle', { cx: plX + p[0] * plW, cy: plY + p[1] * plH, r: 2.1, fill: P.green2 }, c2); });
    MDC.el('text', { x: x2 + w2 / 2, y: cyTop + 110, 'text-anchor': 'middle', 'font-size': 11.5, 'font-weight': 500, fill: P.muted, text: 'outcome ~ treatment · ±covariates' }, c2);
    add(g1, 1);

    // step 2: standardize -> Cohen's d (with proper-fraction formula)
    var g2 = MDC.g(s, {});
    arrow(g2, 'M' + (x2 + w2) + ',' + cy + ' H' + x3, {});
    var c3 = MDC.g(g2, {});
    MDC.el('rect', { x: x3, y: cyTop, width: w3, height: cardH, rx: 12, fill: '#fff', stroke: P.line2, 'stroke-width': 1.4 }, c3);
    MDC.el('text', { x: x3 + w3 / 2, y: cyTop + 22, 'text-anchor': 'middle', 'font-size': 10.5, 'font-weight': 700, 'letter-spacing': 1, fill: P.green2, text: 'STANDARDIZE' }, c3);
    // "d =" then a true centred fraction: numerator "effect size" / bar / denominator "pooled SD"
    var cxc = x3 + w3 / 2;
    var fracHalf = 40;                              // half-width of the fraction bar
    var gapEq = 10;                                 // gap between "d =" and the fraction
    var dEqW = 30;                                  // approx rendered width of "d ="
    var grpHalf = (dEqW + gapEq + 2 * fracHalf) / 2;
    var dEq = cxc - grpHalf;                        // start anchor of "d ="
    var dCenter = dEq + dEqW + gapEq + fracHalf;    // fraction centre
    var midY = cyTop + 66;                          // bar y; numerator above, denominator below
    MDC.el('text', { x: dEq, y: midY + 7, 'text-anchor': 'start', 'font-size': 20, 'font-weight': 700, 'font-style': 'italic', fill: P.greenDeep, text: 'd =' }, c3);
    MDC.el('text', { x: dCenter, y: midY - 8, 'text-anchor': 'middle', 'font-size': 12, 'font-weight': 600, fill: P.greenDeep, text: 'effect size' }, c3);
    MDC.el('line', { x1: dCenter - fracHalf, y1: midY, x2: dCenter + fracHalf, y2: midY, stroke: P.greenDeep, 'stroke-width': 1.6 }, c3);
    MDC.el('text', { x: dCenter, y: midY + 16, 'text-anchor': 'middle', 'font-size': 12, 'font-weight': 600, fill: P.greenDeep, text: 'pooled SD' }, c3);
    MDC.el('text', { x: cxc, y: cyTop + 104, 'text-anchor': 'middle', 'font-size': 11, 'font-weight': 500, fill: P.muted, text: 'effect size = β₁ (treatment dummy)' }, c3);
    add(g2, 2);

    // step 3: meta-analysis + heterogeneity output
    var g3 = MDC.g(s, {});
    arrow(g3, 'M' + (x3 + w3) + ',' + cy + ' H' + x4, {});
    g3.appendChild(card(x4, w4, 'POOL', 'Random-effects', 'DerSimonian–Laird', { title2: 'meta-analysis', fs: 17, ec: P.green2 }));
    arrow(g3, 'M' + (x4 + w4) + ',' + cy + ' H' + x5, {});
    g3.appendChild(card(x5, w5, 'OUTPUT', 'Pooled effect', 'heterogeneity: Q · I² · τ', { fill: '#EAF3EC', stroke: P.green, ec: P.green2 }));
    // pre-registered alpha integrated with the OUTPUT card (chip just below it)
    var aw = 168, ax = x5 + (w5 - aw) / 2, ay = cyTop + cardH + 14;
    var aChip = MDC.g(g3, {});
    MDC.el('rect', { x: ax, y: ay, width: aw, height: 34, rx: 17, fill: P.bg2, stroke: P.amber, 'stroke-width': 1.2 }, aChip);
    MDC.el('text', { x: ax + aw / 2, y: ay + 22, 'text-anchor': 'middle', 'font-size': 12.5, 'font-weight': 700, fill: P.greenDeep, text: 'pre-registered α = 0.5%' }, aChip);
    add(g3, 3);

    // step 4: robustness band, connected by one clean dashed elbow from the meta card
    var g4 = MDC.g(s, {});
    var bandY = 300, mcx = x4 + w4 / 2;               // meta card centre x
    arrow(g4, 'M' + mcx + ',' + (cyTop + cardH) + ' V' + (bandY - 1), { stroke: P.amber, dash: '5 4', m: 'ma' });
    MDC.el('rect', { x: 24, y: bandY, width: VBW - 48, height: 96, rx: 12, fill: '#FBF8F0', stroke: P.line }, g4);
    MDC.el('text', { x: VBW / 2, y: bandY + 26, 'text-anchor': 'middle', 'font-size': 12, 'font-weight': 700, 'letter-spacing': 1.5, fill: P.amber, text: 'ROBUSTNESS CHECKS' }, g4);
    // three chips evenly distributed and centred across the full band width
    var rcW = [232, 186, 226];
    var rcLab = ['Multiverse — 32 specifications', 'Leave-one-out', 'GOSH — 1M subsets'];
    var rcCenters = [243, 600, 957];   // symmetric about the band centre (600)
    var rcY = bandY + 46;
    for (var ri = 0; ri < 3; ri++) chip(g4, rcCenters[ri] - rcW[ri] / 2, rcY, rcW[ri], rcLab[ri]);
    add(g4, 4);

    function apply(i) { reg.forEach(function (r) { r.el.style.opacity = (r.step <= i) ? '1' : '0'; }); }
    return { steps: 4, play: apply, reset: function () { apply(0); } };
  };
})();
