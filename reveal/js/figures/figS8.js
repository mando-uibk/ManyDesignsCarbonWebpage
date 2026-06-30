/* figS8 — multiverse ridgeline (PORTRAIT). 55 RT rows, gaussian ridges with
   green-darkening fill toward large-positive bottom rows; diamond = No controls (d_uni),
   square = Controls (d_ctrl). Single staggered step. */
(function () {
  window.MDC = window.MDC || {}; MDC.figures = MDC.figures || {};

  MDC.figures['figS8'] = function (mount, opts) {
    var P = (opts && opts.palette) || MDC.palette;
    var DATA = (MDC.figS8 || []).slice();
    // sorted ascending by d_uni already; reference: most-negative at TOP, largest-positive BOTTOM
    var N = DATA.length;

    var VBW = 860, VBH = 1060;
    var s = MDC.svg(mount, VBW, VBH);

    // ---- layout ----
    var mL = 92, mR = 34, mT = 24, mB = 110;
    var plotW = VBW - mL - mR;
    var plotH = VBH - mT - mB;

    var D0 = -0.5, D1 = 0.75;
    var x = MDC.scale(D0, D1, mL, mL + plotW);

    // row baseline spacing; ridges overlap (true ridgeline)
    var rowStep = plotH / N;
    function baseY(i) { return mT + rowStep * (i + 0.5); }   // i=0 top
    var ridgeH = rowStep * 1.2;   // low ridges: peak barely reaches the row above (slight overlap)

    // ---- background plot frame ----
    var defs = MDC.el('defs', {}, s);

    // dashed vertical gridlines
    var gridVals = MDC.ticks(D0, D1, 0.1);
    gridVals.forEach(function (gv) {
      var isZero = Math.abs(gv) < 1e-9;
      MDC.el('line', {
        x1: x(gv), x2: x(gv), y1: mT - 4, y2: mT + plotH + 6,
        stroke: isZero ? P.ink : P.line2,
        'stroke-width': isZero ? 1.4 : 0.8,
        'stroke-dasharray': isZero ? 'none' : '3 4',
        opacity: isZero ? 0.85 : 0.7
      }, s);
    });

    // x-axis ticks + labels (bottom)
    var axY = mT + plotH + 6;
    gridVals.forEach(function (gv) {
      MDC.el('line', { x1: x(gv), x2: x(gv), y1: axY, y2: axY + 6, stroke: P.ink2, 'stroke-width': 0.9 }, s);
      MDC.el('text', {
        x: x(gv), y: axY + 22, 'text-anchor': 'middle',
        'font-size': 15, fill: P.ink2, text: (gv === 0 ? '0.0' : gv.toFixed(1))
      }, s);
    });
    // axis title
    MDC.el('text', {
      x: mL + plotW / 2, y: axY + 50, 'text-anchor': 'middle',
      'font-size': 18, 'font-style': 'italic', fill: P.ink, text: "Cohen's d"
    }, s);

    // ---- gaussian helper ----
    function gauss(xv, mu, sd) {
      var z = (xv - mu) / sd;
      return Math.exp(-0.5 * z * z);
    }

    // group for animated rows (drawn bottom-first so top ridges overlap on TOP visually)
    var rowG = MDC.g(s, {});
    var rows = [];

    // We append from bottom row up so that earlier (top) rows paint last and sit above.
    for (var ord = N - 1; ord >= 0; ord--) {
      (function (i) {
        var d = DATA[i];
        var bY = baseY(i);
        var mu = (d.d_uni + d.d_ctrl) / 2;
        // cap sd so wide-d rows (e.g. WFQ37) become narrow discrete bumps, not wide slabs
        var sd = Math.min(Math.max(d.se_uni, Math.abs(d.d_uni - d.d_ctrl), 0.03), 0.06);

        // fill: near-zero & negative rows essentially unfilled (pale outline only);
        // green appears only for clearly-positive rows and deepens toward the bottom.
        var fillCol, fillOp;
        var thr = 0.12;                       // below this -> basically white
        if (mu <= thr) {
          fillCol = P.greenLight;
          fillOp = 0.0;                       // no fill, ridge reads as thin grey outline
        } else {
          // tent mapping: darkness rises to a peak at the ATY04..EUZ78 cluster (mu~0.40),
          // then EASES BACK for very large mu so WFQ37 (mu~0.64) reads medium-green, not darkest.
          var peak = 0.40;                    // mu where green is deepest
          var t;
          if (mu <= peak) {
            t = (mu - thr) / (peak - thr);    // 0 at threshold -> 1 at the cluster
          } else {
            t = 1 - 0.45 * ((mu - peak) / (0.65 - peak)); // ease back toward medium beyond the cluster
          }
          t = Math.max(0, Math.min(1, t));
          fillCol = lerpGreen(t, P);
          fillOp = 0.18 + 0.72 * t;           // pale near thr -> deep at cluster -> medium for WFQ37
        }

        var rg = MDC.g(rowG, {});
        rg.style.opacity = '0';
        rg.style.transform = 'translateY(10px)';
        rg.style.transition = 'opacity .55s ease, transform .55s ease';
        rg.style.transitionDelay = (i * 0.018) + 's';   // top rows first

        // build smooth ridge polyline
        var pts = [];
        var steps = 60;
        var xL = mL, xR = mL + plotW;
        for (var k = 0; k <= steps; k++) {
          var xv = D0 + (D1 - D0) * (k / steps);
          var px = x(xv);
          var h = gauss(xv, mu, sd) * ridgeH;
          pts.push(px + ',' + (bY - h));
        }
        var area = 'M' + xL + ',' + bY + ' L' + pts.join(' L') + ' L' + xR + ',' + bY + ' Z';

        MDC.el('path', {
          d: area, fill: fillCol, 'fill-opacity': fillOp,
          stroke: P.muted, 'stroke-width': 0.7, 'stroke-opacity': 0.85
        }, rg);

        // baseline tick line (subtle)
        MDC.el('line', { x1: xL, x2: xR, y1: bY, y2: bY, stroke: P.line, 'stroke-width': 0.4, opacity: 0.4 }, rg);

        // RT label at left
        MDC.el('text', {
          x: mL - 10, y: bY - 1, 'text-anchor': 'end',
          'font-size': 11.5, fill: P.ink2, text: d.tid
        }, rg);

        // markers — halo first, then shape
        var msz = 6.4;
        // green DIAMOND = No controls (d_uni)
        var dx = x(d.d_uni), dyM = bY - 4.5;
        diamond(rg, dx, dyM, msz + 1.6, '#FFFDF7', 0.95, 0);              // halo
        diamond(rg, dx, dyM, msz, P.green, 1, 1.0, P.greenDeep);          // fill
        // orange SQUARE = Controls (d_ctrl)
        var sx = x(d.d_ctrl), syM = bY - 4.5;
        var sH = msz * 1.55;
        square(rg, sx, syM, sH + 3, '#FFFDF7', 0.95);                     // halo
        square(rg, sx, syM, sH, P.amber, 1, '#9A5E14');                   // fill

        rows.push(rg);
      })(ord);
    }

    // legend (centred, on its own line below the axis title) -----------------
    var lgY = axY + 84;
    var lg = MDC.g(s, {});
    // two items centred together around plot centre
    var cx0 = mL + plotW / 2 - 110;
    diamond(lg, cx0, lgY - 5, 7, P.green, 1, 1.0, P.greenDeep);
    MDC.el('text', { x: cx0 + 14, y: lgY, 'font-size': 15, fill: P.ink2, text: 'No controls' }, lg);
    var cx1 = mL + plotW / 2 + 50;
    square(lg, cx1, lgY - 5, 11, P.amber, 1, '#9A5E14');
    MDC.el('text', { x: cx1 + 13, y: lgY, 'font-size': 15, fill: P.ink2, text: 'Controls' }, lg);

    // ---------- shape helpers ----------
    function diamond(parent, cx, cy, r, fill, op, sw, stroke) {
      var p = MDC.el('path', {
        d: 'M' + cx + ',' + (cy - r) + ' L' + (cx + r) + ',' + cy + ' L' + cx + ',' + (cy + r) + ' L' + (cx - r) + ',' + cy + ' Z',
        fill: fill, 'fill-opacity': (op == null ? 1 : op)
      }, parent);
      if (sw) { p.setAttribute('stroke', stroke || fill); p.setAttribute('stroke-width', sw); }
      return p;
    }
    function square(parent, cx, cy, side, fill, op, stroke) {
      var h = side / 2;
      var p = MDC.el('rect', {
        x: cx - h, y: cy - h, width: side, height: side,
        fill: fill, 'fill-opacity': (op == null ? 1 : op)
      }, parent);
      if (stroke) { p.setAttribute('stroke', stroke); p.setAttribute('stroke-width', 1.0); }
      return p;
    }
    function lerpGreen(t, P) {
      // greenLight (#8DBF6F) -> green (#1B5E3A) -> greenDeep (#0E3D24)
      function hex(h){return [parseInt(h.slice(1,3),16),parseInt(h.slice(3,5),16),parseInt(h.slice(5,7),16)];}
      function mix(a,b,u){return a.map(function(v,i){return Math.round(v+(b[i]-v)*u);});}
      function toHex(c){return '#'+c.map(function(v){return ('0'+v.toString(16)).slice(-2);}).join('');}
      var a=hex('#8DBF6F'),b=hex('#1B5E3A'),c=hex('#0E3D24');
      if(t<0.5) return toHex(mix(a,b,t/0.5));
      return toHex(mix(b,c,(t-0.5)/0.5));
    }

    // ---------- controller ----------
    function play(i) {
      var show = i >= 1;
      rows.forEach(function (rg) {
        rg.style.opacity = show ? '1' : '0';
        rg.style.transform = show ? 'translateY(0)' : 'translateY(10px)';
      });
    }
    function reset() { play(0); }
    reset();
    return { steps: 1, play: play, reset: reset };
  };
})();
