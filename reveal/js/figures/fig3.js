/* ============================================================
   FIG 3 — Centerpiece forest plot (the belief-vs-reality plot)
   Two panels: LEFT "General support (observed)", RIGHT "(stated)".
   55 studies each, ranked ascending by d. Per-study 95% CI + circle
   coloured by significance; LEFT also shows self-assessed (blue ▲)
   and peer-assessed (red ■ + CI). Bottom: meta diamond + predictive
   distribution with 95% PI shading. steps=6.

   Reveal order builds the LEFT panel fully first, THEN the RIGHT panel:
     step 0 (reset) = LEFT frame + axis + RT row-labels + header visible;
                      the ENTIRE RIGHT panel hidden.
     step 1 = LEFT expectations — self-assessed blue triangles AND
              peer-assessed red squares (+ their CIs).
     step 2 = LEFT actual effects — study circles + 95% CIs.
     step 3 = LEFT meta-effect diamond + predictive distribution + 95% PI.
     step 4 = RIGHT panel appears — frame, axis, RT labels, header, and
              study circles + CIs (all at once).
     step 5 = RIGHT meta-effect diamond + predictive distribution + PI.
     step 6 = grey cross-panel connector lines.
   play(i) is cumulative/idempotent; reset() == step 0.
   ============================================================ */
(function () {
  var MDC = window.MDC;

  MDC.figures['fig3'] = function (mount, opts) {
    var P = opts.palette || MDC.palette;
    var obs = (window.MDC.forest_observed || []).slice();
    var sta = (window.MDC.forest_stated || []).slice();
    var metaArr = window.MDC.meta_primary || [];

    function findMeta(varName) {
      for (var i = 0; i < metaArr.length; i++) {
        var m = metaArr[i];
        if (m.controls === 0 && m.variable === varName) return m;
      }
      return null;
    }
    var metaL = findMeta('dv');          // observed
    var metaR = findMeta('cp_support');  // stated

    // sort each panel ascending by d (top row = most negative)
    obs.sort(function (a, b) { return a.d - b.d; });
    sta.sort(function (a, b) { return a.d - b.d; });

    // ---- intervention / outcome glyphs ----
    var IV = {
      'Information Treatment': '†',                       // dagger
      'Behavioral Biases/Reflective Thinking': '‡',       // double dagger
      'Strategic Group Interactions': '×',                // times
      'Use of AI': '•'                                    // bullet
    };
    var OUT = {
      'Donation': '+',
      'Political Contact': '■',   // filled square
      'Petition': '▲',            // filled triangle
      'Market Price': '◆'         // filled diamond
    };

    // ---- significance fill ----
    function sigStyle(p) {
      if (p < 0.005) return { fill: P.green, stroke: P.green };          // dark green filled
      if (p < 0.05)  return { fill: P.greenLight, stroke: P.greenLight }; // light green filled
      return { fill: '#FFFFFF', stroke: P.green2 };                       // hollow
    }

    // ============ GEOMETRY ============
    // VBW grown to 1940 (aspect 2.11) so the figure FILLS the actual slide
    // figmount, whose box is ~2.08:1 (1280x720 slide minus header + slidepad
    // padding). At the old 1.90 aspect the SVG fit-to-HEIGHT and was pillarboxed
    // (~9% horizontal slack each side), which read as the left panel's id-label
    // column being pushed/clipped against the letterbox edge. At >=2.08 aspect the
    // SVG now fits-to-WIDTH and uses the full mount width, leaving a little
    // vertical slack — nothing is cut on any edge.
    // The extra width is spent on wider forest panels (more room for the Cohen's d
    // axis + markers) and the wider central gap. Panel x-ranges derive from
    // VBW/labelW/panelGap below, so they widen automatically.
    // VBH stays 920: rowGap (12.6) and labelFont (7.56) are UNCHANGED so the row
    // pitch and the 55 per-row ID labels keep their enlarged, legible size.
    // VBH grown from 920 -> 1040 so the LARGER RT-id row labels (author feedback:
    // make them clearly more legible) get a bigger row pitch without overlapping,
    // and the enlarged legend below the axis still clears the viewBox bottom.
    // VBH grown again 1040 -> 1160 to host the MUCH larger ID labels (labelFont
    // ~13.5, rowGap 17): 55 rows + 3-line header + meta diamond + predictive
    // curves + bottom legend all fit with clear air at every edge. The figure is
    // shown near-full-bleed; the SVG fits-to-WIDTH (1740 px) so displayed height
    // is 1740*VBH/VBW ≈ 1040 px, inside the 1120 px render window.
    var VBW = 1940, VBH = 1250;
    var s = MDC.svg(mount, VBW, VBH);

    // top header band, then plot rows, then meta/PI band at bottom, axis below
    var headerH = 30;
    var topY = 66;            // first study row baseline (pushed 56 -> 66 to clear the 3-line header incl. two-sided sub-note)
    var rowsTop = topY;
    var n = 55;
    var rowGap = 18.0;        // 55 rows — row pitch (widened 15.0 -> 17.0 so the MUCH larger ID labels keep clear air)
    // label font-size set to ~0.79x the row pitch (~13.5) so adjacent ID labels
    // (glyph + 5-char id + glyph) are clearly legible; line-height < 17.0 pitch ->
    // no vertical overlap between rows.
    var labelFont = 15.0;                    // enlarged 13.5 -> 15 (author feedback: bigger once more)
    var labelDy = labelFont * 0.35;          // vertical-center offset on row baseline
    var rowsBottom = rowsTop + (n - 1) * rowGap;   // 56 + 54*12.6 = 736.4
    var metaY = rowsBottom + 26;       // meta diamond row
    var piY = metaY + 22;              // predictive distribution row
    var axisY = piY + 30;              // x axis baseline

    // panel x-geometry
    var labelW = 96;         // id label gutter (outer) — widened a touch for the larger ID labels
    var panelGap = 150;      // center gutter between panels (room for the cross-panel connectors + r annotation)
    var leftLabelOuter = 10; // left panel ids on the left? ref: left ids on LEFT, right ids on RIGHT
    // In the reference: LEFT panel ids are on the LEFT edge, RIGHT panel ids on the RIGHT edge.
    // marginOuter widened 18->34 so the LEFT id-label column (anchored at Lx0-12)
    // and its longest "† T-xxxxx ◆" strings keep clear air from the viewBox edge —
    // this is the side margin that prevents the left labels reading as clipped.
    var marginOuter = 28;

    // Available width split into two plot areas + label gutters
    // [outerMargin][L labels][L plot][centerGap][R plot][R labels][outerMargin]
    var totalInner = VBW - 2 * marginOuter - 2 * labelW - panelGap;
    var plotW = totalInner / 2;

    var Lx0 = marginOuter + labelW;
    var Lx1 = Lx0 + plotW;
    var Rx0 = Lx1 + panelGap;
    var Rx1 = Rx0 + plotW;

    // x scales (Cohen's d)
    // Left domain widened to -0.55 .. 1.6 so the most extreme self-assessed
    // triangle (~1.35) has headroom inside the frame instead of touching it.
    var sxL = MDC.scale(-0.55, 1.6, Lx0, Lx1);
    // IDENTICAL scale to the left panel (author feedback) so the stated-support CIs are
    // directly comparable — on its old, more-zoomed axis they read as spuriously larger.
    var sxR = MDC.scale(-0.55, 1.6, Rx0, Rx1);

    // Belief-marker clamp: keep self triangles / peer squares strictly inside
    // [domainMin + inset, domainMax - inset] (in DATA space) so no marker can
    // reach the panel frame. Returns a clamped pixel x.
    var beliefInset = 0.04;                  // in Cohen's d units
    function clampBelief(sx, v) {
        var lo = sx.domain[0] + beliefInset;
        var hi = sx.domain[1] - beliefInset;
        return sx(Math.max(lo, Math.min(hi, v)));
    }

    var rowY = function (i) { return rowsTop + i * rowGap; };

    // ============ ANIMATED ELEMENTS (registry) ============
    // Declared up front so the per-panel FRAME builders below can register
    // RIGHT-panel chrome (axis, header, labels) to appear at step 4, while the
    // LEFT-panel chrome stays static (visible from step 0).
    // Each entry gets a .step number; play(i) shows everything with step<=i.
    var anim = []; // {node, step}

    function reg(node, step) {
      node.style.opacity = '0';
      node.style.transition = 'opacity .5s';
      anim.push({ node: node, step: step });
      return node;
    }
    // regStep: null -> leave element static in `frame` (always visible);
    //          number -> hide it and reveal it at that step (used for the RIGHT panel).
    function regOpt(node, regStep) {
      if (regStep != null) reg(node, regStep);
      return node;
    }

    // ---------- background frames + gridlines + axis ----------
    var frame = MDC.g(s, {});

    // buildAxis/header/etc. take a `regStep`: pass null for the LEFT (static)
    // panel, 4 for the RIGHT panel so its whole frame appears together at step 4.
    function buildAxis(sx, ticksArr, dec, regStep) {
      // gridlines
      ticksArr.forEach(function (t) {
        var x = sx(t);
        var isZero = Math.abs(t) < 1e-9;
        regOpt(MDC.el('line', {
          x1: x, x2: x, y1: rowsTop - 14, y2: axisY,
          stroke: isZero ? P.ink2 : P.line,
          'stroke-width': isZero ? 1.6 : 0.8,
          'stroke-dasharray': isZero ? '' : '2 3'
        }, frame), regStep);
      });
      // tick labels
      ticksArr.forEach(function (t) {
        var x = sx(t);
        regOpt(MDC.el('text', {
          x: x, y: axisY + 20, 'text-anchor': 'middle',
          'font-size': 14.5, fill: P.muted, text: MDC.fmt(t, dec)
        }, frame), regStep);
      });
    }
    buildAxis(sxL, MDC.ticks(-0.5, 1.5, 0.25), 2, null);   // LEFT — static
    buildAxis(sxR, MDC.ticks(-0.5, 1.5, 0.25), 2, 4);      // RIGHT — identical scale, appears at step 4

    // baseline axis lines (LEFT static, RIGHT at step 4)
    MDC.el('line', { x1: Lx0, x2: Lx1, y1: axisY, y2: axisY, stroke: P.ink2, 'stroke-width': 1 }, frame);
    regOpt(MDC.el('line', { x1: Rx0, x2: Rx1, y1: axisY, y2: axisY, stroke: P.ink2, 'stroke-width': 1 }, frame), 4);

    // x-axis title (LEFT static, RIGHT at step 4)
    MDC.el('text', {
      x: (Lx0 + Lx1) / 2, y: axisY + 42, 'text-anchor': 'middle',
      'font-size': 18, 'font-style': 'italic', fill: P.ink, text: "Cohen's d"
    }, frame);
    regOpt(MDC.el('text', {
      x: (Rx0 + Rx1) / 2, y: axisY + 42, 'text-anchor': 'middle',
      'font-size': 18, 'font-style': 'italic', fill: P.ink, text: "Cohen's d"
    }, frame), 4);

    // ---------- headers ----------
    function header(cx, title, meta, regStep) {
      regOpt(MDC.el('text', {
        x: cx, y: 20, 'text-anchor': 'middle',
        'font-size': 19, 'font-weight': 700, fill: P.greenDeep, text: title
      }, frame), regStep);
      var sub = 'Q=' + MDC.fmt(meta.Q, 2) + '**,  I²=' + MDC.fmt(meta.I2, 1) +
        '%,  τ=' + MDC.fmt(meta.tau, 3);
      regOpt(MDC.el('text', {
        x: cx, y: 41, 'text-anchor': 'middle',
        'font-size': 14, 'font-style': 'italic', fill: P.ink2, text: sub
      }, frame), regStep);
      // sub-note: significance throughout is from TWO-SIDED tests (author feedback)
      regOpt(MDC.el('text', {
        x: cx, y: 54, 'text-anchor': 'middle',
        'font-size': 11.5, 'font-style': 'italic', fill: P.muted, text: 'significance from two-sided t-tests'
      }, frame), regStep);
    }
    header((Lx0 + Lx1) / 2, 'General support (observed)', metaL, null);  // LEFT — static
    header((Rx0 + Rx1) / 2, 'General support (stated)', metaR, 4);       // RIGHT — step 4

    // meta-effect / pred-distribution row labels (LEFT side — static)
    MDC.el('text', { x: marginOuter, y: metaY + 4, 'font-size': 11.5, fill: P.muted, text: 'Meta-effect' }, frame);
    MDC.el('text', { x: marginOuter, y: piY + 14, 'font-size': 11.5, fill: P.muted, text: 'Pred. Distribution' }, frame);
    // mirror on the RIGHT — part of the right panel, so appears at step 4
    regOpt(MDC.el('text', { x: VBW - marginOuter, y: metaY + 4, 'text-anchor': 'end', 'font-size': 11.5, fill: P.muted, text: 'Meta-effect' }, frame), 4);
    regOpt(MDC.el('text', { x: VBW - marginOuter, y: piY + 14, 'text-anchor': 'end', 'font-size': 11.5, fill: P.muted, text: 'Pred. Distribution' }, frame), 4);

    // ---- study rows ----
    // circleStep: when the study circles + 95% CIs reveal (LEFT=2 "actual effects",
    //             RIGHT=4 "whole right panel at once").
    // labelStep:  when the per-row id labels reveal (LEFT=null -> static/step 0,
    //             RIGHT=4 -> hidden until the right panel appears).
    // withBeliefs: LEFT only — self triangles + peer squares (+CIs) at step 1.
    function buildStudyRows(data, sx, panelGroup, idAnchor, idX, withBeliefs, circleStep, labelStep) {
      data.forEach(function (row, i) {
        var y = rowY(i);
        var g = MDC.g(panelGroup, {});
        // clamp helper to panel bounds (so out-of-range CIs don't spill)
        var clamp = function (v) {
          return Math.max(sx.range[0], Math.min(sx.range[1], sx(v)));
        };

        // --- CI line (the actual observed/stated effect) ---
        var ci = MDC.el('line', {
          x1: clamp(row.ci_low), x2: clamp(row.ci_high), y1: y, y2: y,
          stroke: P.ink2, 'stroke-width': 0.9, 'stroke-opacity': 0.55
        }, g);

        // --- point circle (the actual observed/stated effect) ---
        var st = sigStyle(row.p_two);
        var c = MDC.el('circle', {
          cx: sx(row.d), cy: y, r: 3.9,
          fill: st.fill, stroke: st.stroke, 'stroke-width': 1.2
        }, g);

        reg(ci, circleStep);
        reg(c, circleStep);

        // staggered cascade top->bottom
        var delay = (i / n) * 0.55;
        ci.style.transitionDelay = delay + 's';
        c.style.transitionDelay = delay + 's';

        // --- id label with glyphs ---
        var ivG = IV[row.category] || '';
        var outG = OUT[row.outcome] || '';
        var labelText = ivG + ' ' + row.tid + ' ' + outG;
        // LEFT labels are static (visible from step 0); RIGHT labels reveal at step 4.
        regOpt(MDC.el('text', {
          x: idX, y: y + labelDy, 'text-anchor': idAnchor,
          'font-size': labelFont, fill: P.ink2, text: labelText
        }, frame), labelStep);

        if (withBeliefs) {
          // small within-row vertical offsets so the self triangle, peer square
          // and study circle can't fully overprint when they share an x.
          var voff = rowGap * 0.18;          // ~1.6px
          var peerY = y + voff;              // peer square nudged DOWN
          var selfY = y - voff;              // self triangle nudged UP

          // --- peer CI (step 1 — expectations: peers' expectations) ---
          var pci = MDC.el('line', {
            x1: clamp(row.peer_low), x2: clamp(row.peer_high), y1: peerY, y2: peerY,
            stroke: P.red, 'stroke-width': 0.9, 'stroke-opacity': 0.55
          }, g);
          // --- peer square (step 1 — expectations) — clamped inside the frame ---
          var pxv = clampBelief(sx, row.peer);
          var psq = MDC.el('rect', {
            x: pxv - 3.7, y: peerY - 3.7, width: 7.4, height: 7.4,
            fill: P.red, stroke: '#FFFFFF', 'stroke-width': 0.7
          }, g);
          reg(pci, 1); reg(psq, 1);
          var pd = (i / n) * 0.5;
          pci.style.transitionDelay = pd + 's';
          psq.style.transitionDelay = pd + 's';

          // --- self triangle (step 1 — expectations: each team's for its OWN design) — clamped inside the frame ---
          var sxv = clampBelief(sx, row.self), syv = selfY;
          var tri = MDC.el('path', {
            d: 'M ' + sxv + ' ' + (syv - 4.4) + ' L ' + (sxv + 4.1) + ' ' + (syv + 3.4) +
              ' L ' + (sxv - 4.1) + ' ' + (syv + 3.4) + ' Z',
            fill: P.blue, stroke: '#FFFFFF', 'stroke-width': 0.7, 'fill-opacity': 0.95
          }, g);
          reg(tri, 1);
          tri.style.transitionDelay = ((i / n) * 0.5) + 's';
        }
      });
    }

    // ---- cross-panel RT connector lines (step 6) ----
    // Inserted into the SVG BEFORE the panel point groups so the connectors
    // render UNDERNEATH all circles/CIs/markers/diamonds (DOM order = z-order).
    // Endpoints are computed from the SAME per-panel scales + row geometry the
    // points use: left point = (sxL(obs[i].d), rowY(i)); right point matched by
    // tid = (sxR(sta[j].d), rowY(j)). A tid present in only one panel is skipped.
    var gConn = MDC.g(s, {});
    (function buildConnectors() {
      // right-panel index lookup by team id (sta is already sorted ascending)
      var rightByTid = {};
      sta.forEach(function (row, j) {
        rightByTid[row.tid] = { x: sxR(row.d), y: rowY(j) };
      });
      obs.forEach(function (row, i) {
        var rp = rightByTid[row.tid];
        if (!rp) return;                       // tid missing from right panel — skip
        var lp = { x: sxL(row.d), y: rowY(i) };
        var ln = MDC.el('line', {
          x1: lp.x, y1: lp.y, x2: rp.x, y2: rp.y,
          stroke: '#9A9A8E', 'stroke-width': 0.6, 'stroke-opacity': 0.35
        }, gConn);
        reg(ln, 6);
      });

      // observed-vs-stated correlation annotation (paper reports Pearson r = 0.174).
      // Centred in the panel gap, near the TOP of the connector band so it sits in
      // open space above the densest connector crossings; revealed with the
      // connectors at step 6. Drawn after the lines so it reads on top.
      var gapCx = (Lx1 + Rx0) / 2;
      var annY = rowsTop - 4;                  // just above the first study row
      // subtle background so the annotation stays legible over the connector crossings
      var annBg = MDC.el('rect', {
        x: gapCx - 74, y: annY - 16, width: 148, height: 84, rx: 9,
        fill: P.bg, 'fill-opacity': 0.82, stroke: P.line, 'stroke-width': 1
      }, gConn);
      var annNote = MDC.el('text', {
        x: gapCx, y: annY, 'text-anchor': 'middle',
        'font-size': 14, 'font-weight': 700, fill: P.ink, text: 'Observed vs stated'
      }, gConn);
      var annStat = MDC.el('text', {
        x: gapCx, y: annY + 20, 'text-anchor': 'middle',
        'font-size': 16, 'font-weight': 800, 'font-style': 'italic', fill: P.greenDeep, text: 'r = 0.17'
      }, gConn);
      var annCIa = MDC.el('text', {
        x: gapCx, y: annY + 38, 'text-anchor': 'middle',
        'font-size': 12, 'font-style': 'italic', fill: P.muted, text: '99.5% CI'
      }, gConn);
      var annCIb = MDC.el('text', {
        x: gapCx, y: annY + 54, 'text-anchor': 'middle',
        'font-size': 13, 'font-style': 'italic', 'font-weight': 600, fill: P.ink2, text: '[−0.21, 0.51]'
      }, gConn);
      reg(annBg, 6); reg(annNote, 6); reg(annStat, 6); reg(annCIa, 6); reg(annCIb, 6);
    })();

    var gL = MDC.g(s, {});
    var gR = MDC.g(s, {});
    // LEFT: ids on the LEFT edge (static), study circles+CIs reveal at step 2.
    buildStudyRows(obs, sxL, gL, 'end', Lx0 - 12, true, 2, null);
    // RIGHT: ids on the RIGHT edge + circles+CIs ALL reveal together at step 4.
    buildStudyRows(sta, sxR, gR, 'start', Rx1 + 12, false, 4, 4);

    // ---- meta diamonds (LEFT=step 3, RIGHT=step 5) ----
    function metaDiamond(sx, meta, metaStep) {
      var xc = sx(meta.d), xl = sx(meta.ci_low), xr = sx(meta.ci_high);
      var h = 8.5;
      var d = 'M ' + xl + ' ' + metaY + ' L ' + xc + ' ' + (metaY - h) +
        ' L ' + xr + ' ' + metaY + ' L ' + xc + ' ' + (metaY + h) + ' Z';
      var dm = MDC.el('path', { d: d, fill: P.green, stroke: P.greenDeep, 'stroke-width': 1 }, s);
      reg(dm, metaStep);
      // pooled Cohen's d printed beside the diamond (author feedback), 3 decimals.
      var lbl = MDC.el('text', {
        x: xr + 12, y: metaY + 5, 'text-anchor': 'start',
        'font-size': 16, 'font-weight': 800, fill: P.greenDeep,
        text: 'd = ' + MDC.fmt(meta.d, 3)
      }, s);
      reg(lbl, metaStep);
    }
    metaDiamond(sxL, metaL, 3);   // LEFT meta-effect
    metaDiamond(sxR, metaR, 5);   // RIGHT meta-effect

    // ---- predictive distribution + PI shading (LEFT=step 3, RIGHT=step 5) ----
    function predDist(sx, meta, predStep) {
      var mu = meta.d, tau = meta.tau;
      var piLo = meta.pi_low, piHi = meta.pi_high;
      var amp = 18; // peak height of the curve in px
      // build curve over the visible domain
      var x0 = sx.domain[0], x1 = sx.domain[1];
      var pts = [];
      var N = 90;
      var peak = 1 / (tau * Math.sqrt(2 * Math.PI));
      for (var k = 0; k <= N; k++) {
        var xv = x0 + (x1 - x0) * (k / N);
        var z = (xv - mu) / tau;
        var dens = Math.exp(-0.5 * z * z) / (tau * Math.sqrt(2 * Math.PI));
        var yy = piY + 6 - (dens / peak) * amp;
        pts.push([sx(xv), yy]);
      }
      // PI shaded region (clip the density area between piLo..piHi)
      var shadePts = [];
      var M = 60;
      for (var j = 0; j <= M; j++) {
        var xv2 = piLo + (piHi - piLo) * (j / M);
        var z2 = (xv2 - mu) / tau;
        var dens2 = Math.exp(-0.5 * z2 * z2) / (tau * Math.sqrt(2 * Math.PI));
        var yy2 = piY + 6 - (dens2 / peak) * amp;
        shadePts.push(sx(xv2) + ',' + yy2);
      }
      // close along baseline
      shadePts.push(sx(piHi) + ',' + (piY + 6));
      shadePts.push(sx(piLo) + ',' + (piY + 6));
      var shade = MDC.el('polygon', {
        points: shadePts.join(' '),
        fill: P.greenLight, 'fill-opacity': 0.35, stroke: 'none'
      }, s);
      reg(shade, predStep);

      // baseline for the PI
      var base = MDC.el('line', {
        x1: sx(piLo), x2: sx(piHi), y1: piY + 6, y2: piY + 6,
        stroke: P.green2, 'stroke-width': 1
      }, s);
      reg(base, predStep);

      // curve outline
      var dPath = 'M ' + pts.map(function (p) { return p[0].toFixed(1) + ' ' + p[1].toFixed(1); }).join(' L ');
      var curve = MDC.el('path', {
        d: dPath, fill: 'none', stroke: P.green2, 'stroke-width': 1.4
      }, s);
      reg(curve, predStep);

      // PI endpoint ticks
      [piLo, piHi].forEach(function (v) {
        var t = MDC.el('line', {
          x1: sx(v), x2: sx(v), y1: piY + 2, y2: piY + 10,
          stroke: P.green2, 'stroke-width': 1
        }, s);
        reg(t, predStep);
      });
    }
    predDist(sxL, metaL, 3);   // LEFT predictive distribution
    predDist(sxR, metaR, 5);   // RIGHT predictive distribution

    // ============ LEGEND ============
    // Place the legend on its own baseline BELOW the "Cohen's d" axis title
    // (title sits at axisY + 42). +30 clears it with a clear gap; with VBH 1160
    // the legend baseline sits well inside the viewBox bottom (clear air below).
    var lg = MDC.g(frame, {});
    var lgY = axisY + 42 + 30;
    var lgX = marginOuter;
    var lgFont = 15.5;        // enlarged for legibility (author feedback: bigger once more)
    function legendItem(x, drawFn, label) {
      drawFn(x);
      MDC.el('text', { x: x + 16, y: lgY + 5, 'font-size': lgFont, fill: P.ink2, text: label }, lg);
      return x + 16 + label.length * 7.4 + 22;
    }
    var x = lgX;
    x = legendItem(x, function (xx) { MDC.el('circle', { cx: xx, cy: lgY, r: 3.4, fill: P.green, stroke: P.green }, lg); }, 'p<0.005');
    x = legendItem(x, function (xx) { MDC.el('circle', { cx: xx, cy: lgY, r: 3.4, fill: P.greenLight, stroke: P.greenLight }, lg); }, 'p<0.05');
    x = legendItem(x, function (xx) { MDC.el('circle', { cx: xx, cy: lgY, r: 3.4, fill: '#fff', stroke: P.green2, 'stroke-width': 1.1 }, lg); }, 'p>0.05 (95% CI)');
    x = legendItem(x, function (xx) {
      MDC.el('path', { d: 'M ' + xx + ' ' + (lgY - 4) + ' L ' + (xx + 3.6) + ' ' + (lgY + 3) + ' L ' + (xx - 3.6) + ' ' + (lgY + 3) + ' Z', fill: P.blue }, lg);
    }, 'Self-assessed');
    x = legendItem(x, function (xx) { MDC.el('rect', { x: xx - 3.2, y: lgY - 3.2, width: 6.4, height: 6.4, fill: P.red }, lg); }, 'Peer-assessed');
    x = legendItem(x, function (xx) {
      MDC.el('path', { d: 'M ' + (xx - 5) + ' ' + lgY + ' L ' + xx + ' ' + (lgY - 4) + ' L ' + (xx + 5) + ' ' + lgY + ' L ' + xx + ' ' + (lgY + 4) + ' Z', fill: P.green, stroke: P.greenDeep }, lg);
    }, 'Meta-effect');
    // significance note: all p-values are from TWO-SIDED t-tests (author feedback).
    // Placed at the end of the marker legend row, before the glyph key.
    MDC.el('text', {
      x: x, y: lgY + 5, 'font-size': lgFont, 'font-style': 'italic', fill: P.muted,
      text: 'p-values: two-sided t-tests'
    }, lg);

    // intervention/outcome glyph key (enlarged 10.5 -> 12.5 for legibility)
    MDC.el('text', {
      x: VBW - marginOuter, y: lgY + 5, 'text-anchor': 'end', 'font-size': 13.5, fill: P.muted,
      text: '† Info  ‡ Behavioral  × Strategic  • AI   |   + Donation  ■ Contact  ▲ Petition  ◆ Market'
    }, lg);

    // ============ CONTROLLER ============
    function apply(i) {
      for (var k = 0; k < anim.length; k++) {
        anim[k].node.style.opacity = (anim[k].step <= i) ? '1' : '0';
      }
    }

    return {
      steps: 6,
      play: function (i) { apply(i); },
      reset: function () { apply(0); }
    };
  };
})();
