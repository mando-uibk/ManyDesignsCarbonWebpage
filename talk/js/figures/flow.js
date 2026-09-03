/* flow — experimental procedure (study protocol). Clean orthogonal connectors. */
(function () {
  var MDC = (window.MDC = window.MDC || {}); MDC.figures = MDC.figures || {};

  MDC.figures['flow'] = function (mount, opts) {
    var P = (opts && opts.palette) || MDC.palette;
    var VBW = 1200, VBH = 510;
    var s = MDC.svg(mount, VBW, VBH);

    var defs = MDC.el('defs', {}, s);
    function marker(id, color) {
      var m = MDC.el('marker', { id: id, viewBox: '0 0 10 10', refX: 8.5, refY: 5,
        markerWidth: 7, markerHeight: 7, orient: 'auto-start-reverse' }, defs);
      MDC.el('path', { d: 'M0,0 L10,5 L0,10 Z', fill: color }, m);
    }
    marker('ah', P.muted); marker('ahg', P.green); marker('aha', P.amber);

    var reg = [];
    function add(el, step) { el.style.opacity = '0'; el.style.transition = 'opacity .5s ease'; reg.push({ el: el, step: step }); return el; }

    var cy = 158;
    // Centred text rendered via START-anchor at a *measured* x. text-anchor:middle inside
    // reveal's scaled/3D-perspective context hits a Chrome headless bug that anchors against
    // fallback-font metrics and won't re-layout, shifting box titles left; start-anchored text
    // is immune. getComputedTextLength gives the real Montserrat width (fonts are pre-loaded).
    function cText(parent, cx, y, str, attrs) {
      var size = attrs['font-size'], weight = attrs['font-weight'] || 400, ls = attrs['letter-spacing'] || 0;
      var m = MDC.el('text', { x: -9999, y: -9999, 'font-size': size, 'font-weight': weight,
        'letter-spacing': ls, 'font-family': "'Montserrat',sans-serif", text: str }, s);
      var w = (m.getComputedTextLength ? m.getComputedTextLength() : str.length * size * 0.55);
      s.removeChild(m);
      var a = {}; for (var k in attrs) a[k] = attrs[k];
      a.x = cx - w / 2; a.y = y; a['text-anchor'] = 'start'; a.text = str;
      return MDC.el('text', a, parent);
    }
    function node(x, y, w, h, title, sub, opt) {
      opt = opt || {};
      var g = MDC.g(s, {});
      MDC.el('rect', { x: x, y: y, width: w, height: h, rx: 11, fill: opt.fill || '#fff',
        stroke: opt.stroke || P.line2, 'stroke-width': opt.sw || 1.4, 'stroke-dasharray': opt.dash || 'none' }, g);
      if (opt.eyebrow) cText(g, x + w / 2, y + 17, opt.eyebrow,
        { 'font-size': 10.5, 'font-weight': 700, 'letter-spacing': 1, fill: opt.ec || P.muted });
      // Vertically centre the title (and sub, if any) within the body of the box,
      // i.e. the area below the eyebrow. This keeps every box's text optically aligned.
      var bodyTop = y + (opt.eyebrow ? 24 : 0);
      var bodyCy = (bodyTop + (y + h)) / 2;
      var titleY = sub ? bodyCy - 5 : bodyCy + 6;
      cText(g, x + w / 2, titleY, title,
        { 'font-size': opt.fs || 17, 'font-weight': 700, fill: opt.tc || P.greenDeep });
      if (sub) cText(g, x + w / 2, bodyCy + 15, sub,
        { 'font-size': 11, 'font-weight': 500, fill: opt.subc || P.muted });
      return g;
    }
    // build a connector path WITHOUT auto-appending, so callers can place it in a group
    function arrow(parent, d, opt) {
      opt = opt || {};
      var p = MDC.el('path', { d: d, fill: 'none', stroke: opt.stroke || P.muted, 'stroke-width': opt.sw || 2,
        'stroke-dasharray': opt.dash || 'none', 'marker-end': 'url(#' + (opt.m || 'ah') + ')' }, parent);
      return p;
    }

    var introX = 24, introW = 168, introR = introX + introW;
    var tX = 256, tW = 214, tR = tX + tW;
    var tCy = 92, cCy = 224, half = 32;
    var splitX = 222, mergeX = 506;
    var outX = 540, outW = 268, outR = outX + outW;   // wider boxes so the titles always sit clear
    var surX = 852, surW = 252, surR = surX + surW;
    var endCx = 1152, endR = 30;

    // step 1
    add(node(introX, cy - half, introW, 2 * half, 'Introduction', '& informed consent',
      { fill: P.bg2, stroke: P.line2 }), 1);

    // step 2 — split
    var g2 = MDC.g(s, {});
    arrow(g2, 'M' + introR + ',' + cy + ' H' + splitX + ' V' + tCy + ' H' + tX, { stroke: P.green, m: 'ahg' });
    arrow(g2, 'M' + splitX + ',' + cy + ' V' + cCy + ' H' + tX, { stroke: P.amber, m: 'aha' });
    // dashed container enclosing both TREATMENT and CONTROL boxes
    var encX = tX - 14, encY = tCy - half - 26, encW = tW + 28, encH = (cCy + half) - (tCy - half) + 40;
    MDC.el('rect', { x: encX, y: encY, width: encW, height: encH, rx: 16, fill: 'none',
      stroke: P.muted, 'stroke-width': 1.4, 'stroke-dasharray': '6 5' }, g2);
    // "55 designs" label centered on top of the dashed container
    var lblCx = encX + encW / 2, lblY = encY;
    MDC.el('rect', { x: lblCx - 52, y: lblY - 13, width: 104, height: 26, rx: 13, fill: P.bg }, g2);
    MDC.el('text', { x: lblCx, y: lblY + 5, 'text-anchor': 'middle', 'font-size': 14, 'font-weight': 700,
      fill: P.greenDeep, text: '55 designs' }, g2);
    g2.appendChild(node(tX, tCy - half, tW, 2 * half, 'TREATMENT', '',
      { fill: '#EAF3EC', stroke: P.green }));
    g2.appendChild(node(tX, cCy - half, tW, 2 * half, 'CONTROL', '',
      { fill: P.bg2, stroke: P.amber, dash: '5 4' }));
    // "random assignment" sits in the MIDDLE — centred in the clear gap between the
    // TREATMENT (above) and CONTROL (below) boxes, so it reads as the split that feeds both.
    var raCx = tX + tW / 2, raCy = cy, raW = 170;
    MDC.el('rect', { x: raCx - raW / 2, y: raCy - 15, width: raW, height: 30, rx: 15,
      fill: '#FFFFFF', stroke: P.green2, 'stroke-width': 1.4 }, g2);
    MDC.el('text', { x: raCx, y: raCy + 4.5, 'text-anchor': 'middle', 'font-size': 13,
      'font-style': 'italic', 'font-weight': 700, fill: P.greenDeep, text: 'random assignment' }, g2);
    add(g2, 2);

    // step 3 — merge to outcome
    var g3 = MDC.g(s, {});
    arrow(g3, 'M' + tR + ',' + tCy + ' H' + mergeX + ' V' + (cy - 12) + ' H' + outX, { stroke: P.green, m: 'ahg' });
    arrow(g3, 'M' + tR + ',' + cCy + ' H' + mergeX + ' V' + (cy + 12) + ' H' + outX, { stroke: P.amber, m: 'aha' });
    g3.appendChild(node(outX, cy - half, outW, 2 * half, 'Real-world outcome', '',
      { fill: P.greenDeep, stroke: P.greenDeep, tc: '#fff', subc: '#BFD6C6', eyebrow: 'TEAM-CHOSEN MEASURE', ec: '#9DBBA6', fs: 15.5 }));
    add(g3, 3);

    // step 4 — survey + end + callout
    var g4 = MDC.g(s, {});
    arrow(g4, 'M' + outR + ',' + cy + ' H' + surX, {});
    g4.appendChild(node(surX, cy - half, surW, 2 * half, 'Policy survey', '5 stated measures + beliefs',
      { fill: '#fff', stroke: P.line2, eyebrow: 'COMMON TO ALL TEAMS', ec: P.muted, fs: 15.5 }));
    arrow(g4, 'M' + surR + ',' + cy + ' H' + (endCx - endR), {});
    MDC.el('circle', { cx: endCx, cy: cy, r: endR, fill: P.green2 }, g4);
    MDC.el('text', { x: endCx, y: cy + 5, 'text-anchor': 'middle', 'font-size': 13, 'font-weight': 700, fill: '#fff', text: 'END' }, g4);
    add(g4, 4);

    // step 5 — bottom callout (RT assessments), revealed AFTER the flow-chart END
    g4 = MDC.g(s, {});
    // bottom callout — the actual questions teams answered, split Self vs Peer
    var calY = 348, calH = 146, calX = 24, calW = VBW - 48;
    // header for the whole assessments block (author feedback: state "RT assessments")
    MDC.el('text', { x: calX + calW / 2, y: calY - 30, 'text-anchor': 'middle', 'font-size': 15,
      'font-weight': 800, 'letter-spacing': 1.5, fill: P.greenDeep, text: 'RESEARCH-TEAM (RT) ASSESSMENTS' }, g4);
    MDC.el('text', { x: calX + calW / 2, y: calY - 13, 'text-anchor': 'middle', 'font-size': 11.5,
      'font-style': 'italic', fill: P.muted, text: 'collected up front — about a team’s own design, and about ten peer designs' }, g4);
    MDC.el('rect', { x: calX, y: calY, width: calW, height: calH, rx: 12, fill: P.bg2, stroke: P.line }, g4);
    var midX = calX + calW * 0.40;
    MDC.el('line', { x1: midX, y1: calY + 14, x2: midX, y2: calY + calH - 14, stroke: P.line2, 'stroke-width': 1 }, g4);

    // LEFT — Self-assessment (own design)
    var lx = calX + 26;
    MDC.el('rect', { x: calX, y: calY, width: 5, height: calH, rx: 2.5, fill: P.green }, g4);
    MDC.el('text', { x: lx, y: calY + 28, 'font-size': 13, 'font-weight': 700, 'letter-spacing': 0.5,
      fill: P.green2, text: 'SELF-ASSESSMENT' }, g4);
    MDC.el('text', { x: lx, y: calY + 45, 'font-size': 11, 'font-weight': 500, 'font-style': 'italic',
      fill: P.muted, text: 'own design' }, g4);
    MDC.el('text', { x: lx, y: calY + 72, 'font-size': 13.5, 'font-weight': 600, fill: P.greenDeep,
      text: 'How large do you expect the effect size of' }, g4);
    MDC.el('text', { x: lx, y: calY + 91, 'font-size': 13.5, 'font-weight': 600, fill: P.greenDeep,
      text: 'your intervention to be?' }, g4);
    MDC.el('text', { x: lx, y: calY + 110, 'font-size': 11.5, 'font-weight': 500, 'font-style': 'italic',
      fill: P.muted, text: '(Cohen’s d)' }, g4);

    // RIGHT — Peer-assessment (each team rated 10 other designs)
    var rx = midX + 26, ry = calY + 20, lh = 19;
    MDC.el('text', { x: rx, y: calY + 28, 'font-size': 13, 'font-weight': 700, 'letter-spacing': 0.5,
      fill: P.amber, text: 'PEER-ASSESSMENT' }, g4);
    MDC.el('text', { x: rx, y: calY + 45, 'font-size': 11, 'font-weight': 500, 'font-style': 'italic',
      fill: P.muted, text: 'each team rated 10 other designs' }, g4);
    var peerQ = [
      'How large do you expect this design’s effect size to be?  (Cohen’s d)',
      'How informative is the design for the research question?  (0–10)',
      'Which behavioral-intervention category does it fall under?'
    ];
    peerQ.forEach(function (q, k) {
      var qy = calY + 67 + k * (lh + 4);
      MDC.el('circle', { cx: rx + 4, cy: qy - 4, r: 2.6, fill: P.amber }, g4);
      MDC.el('text', { x: rx + 16, y: qy, 'font-size': 13, 'font-weight': 500, fill: P.ink2, text: q }, g4);
    });
    add(g4, 5);

    function apply(i) { reg.forEach(function (r) { r.el.style.opacity = (r.step <= i) ? '1' : '0'; }); }
    return { steps: 5, play: apply, reset: function () { apply(0); } };
  };
})();
