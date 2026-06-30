/* fig1 — "Design and outcome features of the included studies"
   Hand-built animated lollipop chart matching published Figure 1.
   Panel a (left): intervention features.  Panel b (right): outcome features.
   NOTE: this module also (re)defines MDC._embed, the shared PNG-embed helper
   that fig2/fig4/figS8 rely on — kept here so those siblings keep working. */
(function () {
  window.MDC = window.MDC || {}; MDC.figures = MDC.figures || {};

  /* ---- shared embed helper (preserved for sibling modules) ---- */
  if (!MDC._embed) {
    MDC._embed = function (mount, srcs) {
      mount.innerHTML = '';
      var wrap = document.createElement('div');
      wrap.style.cssText = 'position:absolute;inset:0;display:flex;gap:1.6%;align-items:stretch;justify-content:center;'
        + 'opacity:0;transform:scale(.99);transition:opacity .6s ease,transform .6s ease;';
      var w = srcs.length > 1 ? (100 / srcs.length - 1) : 100;
      srcs.forEach(function (src) {
        var d = document.createElement('div');
        d.style.cssText = 'flex:0 0 ' + w + '%;height:100%;background:center/contain no-repeat url("' + src + '");';
        wrap.appendChild(d);
      });
      mount.appendChild(wrap);
      return {
        steps: 1,
        play: function (i) { var on = i >= 1; wrap.style.opacity = on ? '1' : '0'; wrap.style.transform = on ? 'none' : 'scale(.99)'; },
        reset: function () { wrap.style.opacity = '0'; wrap.style.transform = 'scale(.99)'; }
      };
    };
  }

  /* ============================================================ */
  MDC.figures['fig1'] = function (mount, opts) {
    var P = (opts && opts.palette) || MDC.palette;
    var D = MDC.fig1;
    var el = MDC.el, g = MDC.g;

    var VBW = 1520, VBH = 820;
    var s = MDC.svg(mount, VBW, VBH);

    // lighten a hex colour toward white by amt (0..1) — panel-a subcategory bars
    function lighten(hex, amt) {
      var c = hex.replace('#', '');
      var r = parseInt(c.substr(0, 2), 16), g2 = parseInt(c.substr(2, 2), 16), b = parseInt(c.substr(4, 2), 16);
      r = Math.round(r + (255 - r) * amt); g2 = Math.round(g2 + (255 - g2) * amt); b = Math.round(b + (255 - b) * amt);
      return 'rgb(' + r + ',' + g2 + ',' + b + ')';
    }

    // ---------- layout ----------
    var topY = 70;                 // top of plot rows
    var botY = VBH - 70;           // axis baseline
    // Panel a occupies left ~57%, panel b right ~43%
    var aL = 12, aLabelW = 420;    // left label gutter for panel a (wide enough for the
                                   // long category/sub labels to clear the new main bars)
    var aPlotX0 = aL + aLabelW;    // x where panel-a track/axis starts
    var aPlotX1 = 840;             // x where panel-a plot ends
    var aStatX = aPlotX1 + 14;     // "k = .. | ..%" stats column for panel a

    var bL = 940, bLabelW = 150;
    var bPlotX0 = bL + bLabelW;
    var bPlotX1 = VBW - 110;       // leave room for stat text on the right
    var bStatPad = 12;

    // panel-a axis now spans the largest MAIN category total (k = 30) so the main
    // category bars fit; subcategory bars (max k = 9) read as the lighter breakdown.
    var xa = MDC.scale(0, 30, aPlotX0, aPlotX1);
    var xb = MDC.scale(0, 40, bPlotX0, bPlotX1);

    var animated = {};             // step -> [els]
    function tag(node, step) { (animated[step] = animated[step] || []).push(node); return node; }

    // ---------- panel titles ----------
    elA('text', { x: aL, y: 34, 'font-size': 26, 'font-weight': 800, fill: P.ink,
      text: 'a' }, s);
    elA('text', { x: aL + 26, y: 34, 'font-size': 21, 'font-weight': 700, fill: P.ink2,
      text: 'Intervention features of the included studies' }, s);
    elB('text', { x: bL, y: 34, 'font-size': 26, 'font-weight': 800, fill: P.ink,
      text: 'b' }, s);
    elB('text', { x: bL + 26, y: 34, 'font-size': 21, 'font-weight': 700, fill: P.ink2,
      text: 'Outcome features of the included studies' }, s);

    // ======================================================
    //  GENERIC LOLLIPOP ROW
    //  scale x, value k, color, full track 0..max
    // ======================================================
    function trackRow(cx0, cx1, y, color, k, scaleFn, step, opts2) {
      opts2 = opts2 || {};
      var h = opts2.h || 13;
      var trackColor = opts2.track || P.line;
      var barColor = opts2.barColor || color;
      // faint full-width track — part of the DISTRIBUTION (tagged to the bars' step)
      tagShow(el('rect', { x: cx0, y: y - h / 2, width: cx1 - cx0, height: h, rx: h / 2,
        fill: trackColor, opacity: 0.6 }, s), step);
      // grown colored bar
      var xv = scaleFn(k);
      var bar = el('rect', { x: cx0, y: y - h / 2, width: 0.0001, height: h, rx: h / 2,
        fill: barColor }, s);
      var dot = el('circle', { cx: cx0, cy: y, r: h / 2 + 3, fill: barColor,
        stroke: '#fff', 'stroke-width': 2.2, opacity: 0 }, s);
      bar.style.transition = 'width .6s ease';
      dot.style.transition = 'opacity .35s ease';
      tagNode(bar, step, function () { bar.setAttribute('width', Math.max(0.001, xv - cx0)); },
        function () { bar.setAttribute('width', 0.0001); });
      tagNode(dot, step, function () { dot.setAttribute('cx', xv); dot.style.opacity = '1'; },
        function () { dot.setAttribute('cx', cx0); dot.style.opacity = '0'; });
      return { bar: bar, dot: dot, endX: xv };
    }

    // node-based tagging with explicit on/off
    function tagNode(node, step, onFn, offFn) {
      (animated[step] = animated[step] || []).push(node);
      node._onStep = step; node._on = onFn; node._off = offFn;
      return node;
    }

    // simple show/hide tagging: node is hidden until its panel's step.
    // Used for the "static" panel scaffolding (headers, axes, glyphs, tracks,
    // sub-labels, stat captions) so an entire panel appears on a single click.
    function tagShow(node, step) {
      (animated[step] = animated[step] || []).push(node);
      node._onStep = step;
      node._on = function () { node.style.visibility = ''; };
      node._off = function () { node.style.visibility = 'hidden'; };
      return node;
    }
    // panel-scoped element factories: every HEADER element created through them
    // is auto-tagged for show/hide on that panel's HEADER step
    // (panel a header => step 1, panel b header => step 3). The DISTRIBUTION
    // (tracks, bars, dots, NGO bar fill) is tagged separately to steps 2 / 4.
    // panel HEADERS (title + axis) only: panel a header => step 1, panel b header => step 4.
    function elA(tag, attrs, parent) { return tagShow(el(tag, attrs, parent || s), 1); }
    function elB(tag, attrs, parent) { return tagShow(el(tag, attrs, parent || s), 4); }
    // step-scoped factory so each CATEGORY (its header glyph/label/stats + bars) reveals on
    // its own click: panel a upper(Info+Behavioral)=2, lower(Strategic+AI)=3;
    // panel b upper(Donation+Contact)=5, lower(Petition+Market)=6.
    function elS(step) { return function (tag, attrs, parent) { return tagShow(el(tag, attrs, parent || s), step); }; }

    // ============================================================
    //  AXES  (step 1)
    // ============================================================
    function drawAxis(x0, x1, scaleFn, tickStep, dmax, label, elf) {
      // gridlines
      var tks = MDC.ticks(0, dmax, tickStep);
      tks.forEach(function (t) {
        var gx = scaleFn(t);
        elf('line', { x1: gx, y1: topY - 6, x2: gx, y2: botY,
          stroke: P.line, 'stroke-width': 1, opacity: 0.85 }, s);
        elf('text', { x: gx, y: botY + 26, 'font-size': 15, fill: P.muted,
          'text-anchor': 'middle', text: '' + t }, s);
      });
      // axis baseline
      elf('line', { x1: x0, y1: botY, x2: x1, y2: botY, stroke: P.line2, 'stroke-width': 1.4 }, s);
      // axis title
      elf('text', { x: (x0 + x1) / 2, y: botY + 54, 'font-size': 16, 'font-weight': 600,
        fill: P.ink2, 'text-anchor': 'middle', text: label }, s);
    }

    drawAxis(aPlotX0, aPlotX1, xa, 10, 30, 'Number of studies (k)', elA);
    drawAxis(bPlotX0, bPlotX1, xb, 10, 40, 'Number of studies (k)', elB);

    // ============================================================
    //  PANEL A
    // ============================================================
    // category glyph drawer
    function catGlyph(cx, cy, key, color, ef) {
      if (key === 'info') {
        // cross / dagger (blue) — use a small cross
        ef('text', { x: cx, y: cy + 7, 'font-size': 22, 'font-weight': 800,
          fill: color, 'text-anchor': 'middle', text: '†' }, s);
      } else if (key === 'beh') {
        ef('text', { x: cx, y: cy + 7, 'font-size': 22, 'font-weight': 800,
          fill: color, 'text-anchor': 'middle', text: '‡' }, s);
      } else if (key === 'strat') {
        ef('text', { x: cx, y: cy + 7, 'font-size': 19, 'font-weight': 800,
          fill: color, 'text-anchor': 'middle', text: '✕' }, s);
      } else { // ai
        ef('circle', { cx: cx, cy: cy, r: 7, fill: color }, s);
      }
    }

    function statText(x, k, pct, anchor) {
      return el('text', { x: x, y: 0, 'font-size': 14, fill: P.muted,
        'text-anchor': anchor || 'start',
        text: 'k = ' + k + '  |  ' + pct.toFixed(1) + '%' }, s);
    }

    // vertical rhythm for panel a
    var cats = D.intervention.categories;
    var headH = 34, subH = 40, gapAfterHead = 30, gapBetweenCats = 34;
    var y = topY + 10;

    // staging by HIERARCHY (author feedback): step 2 = all main category rows; step 3 = their
    // sub-rows. Compact categories (no sub-rows) show their bar with the main row at step 2.
    var eH = elS(2);   // panel-a main category rows
    var eS = elS(3);   // panel-a sub-rows
    cats.forEach(function (cat, idx) {
      var headY = y;
      // glyph + bold category label (gutter)
      catGlyph(aL + 12, headY, cat.key, cat.color, eH);
      // shrink an over-long header label so it never runs into the new main bar
      var headFs = 18;
      while (headFs > 12.5 && measureText(cat.label, headFs, 700) > (aPlotX0 - (aL + 32) - 12)) headFs -= 0.5;
      eH('text', { x: aL + 32, y: headY + 6, 'font-size': headFs, 'font-weight': 700,
        fill: P.ink, text: cat.label }, s);
      // MAIN category bar on the header row — full category colour, thicker (step 2)
      trackRow(aPlotX0, aPlotX1, headY, cat.color, cat.k, xa, 2, { h: 15, track: '#E7E2D6' });
      eH('text', { x: aStatX, y: headY + 5, 'font-size': 14, fill: P.muted,
        'text-anchor': 'start', text: 'k = ' + cat.k + '  |  ' + cat.pct.toFixed(1) + '%' }, s);

      if (cat.sub && cat.sub.length) {
        var subColor = lighten(cat.color, 0.45);   // subcategories: lighter than the main bar
        y = headY + headH + gapAfterHead;
        cat.sub.forEach(function (sub) {
          var ry = y;
          // sub-label on LEFT (right-aligned to gutter edge) — sub-rows reveal at step 3
          var subFs = 14;
          while (subFs > 11 && measureText(sub.label, subFs, 400) > (aPlotX0 - 16 - 6)) subFs -= 0.5;
          eS('text', { x: aPlotX0 - 16, y: ry + 5, 'font-size': subFs, fill: P.ink2,
            'text-anchor': 'end', text: sub.label }, s);
          // lighter, thinner lollipop (sub-row distribution => step 3)
          trackRow(aPlotX0, aPlotX1, ry, subColor, sub.k, xa, 3, { h: 11, track: '#E7E2D6' });
          eS('text', { x: aStatX, y: ry + 5, 'font-size': 14, fill: P.muted,
            'text-anchor': 'start', text: 'k = ' + sub.k + '  |  ' + sub.pct.toFixed(1) + '%' }, s);
          y += subH;
        });
        y += gapBetweenCats;
      } else {
        y = headY + headH + gapBetweenCats;
      }
    });

    // ============================================================
    //  PANEL B
    // ============================================================
    var ocats = D.outcome.categories;
    var ngo = D.outcome.ngo;

    // outcome glyphs
    function ocatGlyph(cx, cy, label, ef) {
      if (label === 'Donation') {
        ef('text', { x: cx, y: cy + 8, 'font-size': 24, 'font-weight': 800,
          fill: P.ink, 'text-anchor': 'middle', text: '+' }, s);
      } else if (label === 'Political Contact') {
        ef('rect', { x: cx - 7, y: cy - 7, width: 14, height: 14, fill: P.ink2 }, s);
      } else if (label === 'Petition') {
        ef('path', { d: 'M' + cx + ' ' + (cy - 8) + ' L' + (cx + 8) + ' ' + (cy + 7) +
          ' L' + (cx - 8) + ' ' + (cy + 7) + ' Z', fill: P.muted }, s);
      } else { // Market Price — diamond
        ef('path', { d: 'M' + cx + ' ' + (cy - 9) + ' L' + (cx + 8) + ' ' + cy +
          ' L' + cx + ' ' + (cy + 9) + ' L' + (cx - 8) + ' ' + cy + ' Z', fill: P.amber }, s);
      }
    }

    var by = topY + 22;
    var bHeadH = 34, bSubH = 42, bGapHead = 30, bGapCat = 46;
    var ngoBarY = 0;

    // measure rendered text width (in viewBox units) for a given size/weight
    function measureText(str, size, weight) {
      var t = el('text', { x: -9999, y: -9999, 'font-size': size,
        'font-weight': weight || 400, text: str }, s);
      var w = t.getComputedTextLength ? t.getComputedTextLength() : str.length * size * 0.55;
      s.removeChild(t);
      return w;
    }
    // bold category header that wraps to two lines when it would overflow the
    // left label gutter (so it never runs into its lollipop track/bar).
    function drawWrappedCatHeader(label, x, baseY, maxW, ef) {
      if (measureText(label, 18, 700) <= maxW) {
        ef('text', { x: x, y: baseY + 2, 'font-size': 18, 'font-weight': 700,
          fill: P.ink, text: label }, s);
        return;
      }
      // split into two balanced lines, keeping each within maxW where possible
      var words = label.split(' ');
      var best = words.length > 1 ? 1 : 0, bestDiff = Infinity;
      for (var i = 1; i < words.length; i++) {
        var w1 = measureText(words.slice(0, i).join(' '), 18, 700);
        var w2 = measureText(words.slice(i).join(' '), 18, 700);
        var over = Math.max(0, w1 - maxW) + Math.max(0, w2 - maxW);
        var diff = over * 1000 + Math.abs(w1 - w2); // prefer fitting, then balance
        if (diff < bestDiff) { bestDiff = diff; best = i; }
      }
      var l1 = words.slice(0, best).join(' ');
      var l2 = words.slice(best).join(' ');
      ef('text', { x: x, y: baseY - 7, 'font-size': 18, 'font-weight': 700,
        fill: P.ink, text: l1 }, s);
      ef('text', { x: x, y: baseY + 13, 'font-size': 18, 'font-weight': 700,
        fill: P.ink, text: l2 }, s);
    }

    // panel-b staging by hierarchy: step 5 = main category rows; step 6 = sub-rows (Donation recipients + sub-types)
    var bEH = elS(5);   // panel-b main category rows
    var bES = elS(6);   // panel-b sub-rows / Donation detail
    ocats.forEach(function (cat, idx) {
      var headY = by;
      ocatGlyph(bL + 12, headY, cat.label, bEH);
      var headTextX = bL + 32;
      var headMaxW = bPlotX0 - headTextX - 8;   // clear space before the lollipop track
      var headWrapped = cat.label !== 'Donation' && measureText(cat.label, 18, 700) > headMaxW;
      drawWrappedCatHeader(cat.label, headTextX, headY, headMaxW, bEH);
      // push the k|pct caption below a two-line wrapped header so they don't collide
      bEH('text', { x: headTextX, y: headY + (headWrapped ? 30 : 20), 'font-size': 13,
        'font-weight': 600, fill: P.muted,
        text: 'k = ' + cat.k + '  |  ' + cat.pct.toFixed(1) + '%' }, s);

      if (cat.label === 'Donation') {
        // plain Donation total bar on the header row (step 5) — like the other categories
        trackRow(bPlotX0, bPlotX1, headY, cat.color, cat.k, xb, 5, { h: 13, track: '#E2DDD0' });
        bEH('text', { x: xb(cat.k) + 16, y: headY + 5, 'font-size': 14, fill: P.muted,
          'text-anchor': 'start', text: 'k = ' + cat.k + '  |  ' + cat.pct.toFixed(1) + '%' }, s);
        // NGO stacked recipient bar ABOVE the sub-rows — Donation DETAIL, so step 6.
        // pushed down to clear the new header bar and its staggered callouts.
        ngoBarY = headY + bHeadH + 44;
        var barX0 = bPlotX0, barX1 = xb(cat.k);
        var totalW = barX1 - barX0;
        // "Recipient NGO" small caption above the bar
        bES('text', { x: barX0, y: ngoBarY - 12, 'font-size': 12, 'font-weight': 600,
          fill: P.muted, text: 'Recipient NGO' }, s);
        var bh = 16;
        var segX = barX0;
        var ngoColors = { CCL: P.ink2, CTC: '#5C625A', Other: '#8A8F86', Mix: '#B9BDB4' };
        ngo.forEach(function (seg, i) {
          var w = totalW * (seg.pct / 100);
          var rect = el('rect', { x: segX, y: ngoBarY, width: 0.001, height: bh,
            fill: ngoColors[seg.label] || P.muted }, s);
          rect.style.transition = 'width .55s ease';
          var sw = w;
          tagNode(rect, 6, (function (rr, ww) { return function () { rr.setAttribute('width', Math.max(0.001, ww)); }; })(rect, sw),
            (function (rr) { return function () { rr.setAttribute('width', 0.001); }; })(rect));
          // callout label
          if (seg.label === 'CCL') {
            // inside the big segment
            var lbl = el('text', { x: segX + w / 2, y: ngoBarY + bh - 4, 'font-size': 11,
              'font-weight': 700, fill: '#fff', 'text-anchor': 'middle',
              text: 'CCL ' + seg.pct + '%' , opacity: 0 }, s);
            lbl.style.transition = 'opacity .4s ease .25s';
            tagNode(lbl, 6, function () { lbl.style.opacity = '1'; }, function () { lbl.style.opacity = '0'; });
          } else {
            // staggered callouts above the bar with a small leader line
            var stagger = (seg.label === 'CTC') ? -30 : (seg.label === 'Other') ? -46 : -62;
            var lx = segX + w / 2;
            var lbl = el('text', { x: lx, y: ngoBarY + stagger + 8, 'font-size': 11,
              'font-weight': 600, fill: P.ink2, 'text-anchor': 'middle',
              text: seg.label + ' ' + seg.pct + '%', opacity: 0 }, s);
            var lead = el('line', { x1: lx, y1: ngoBarY + stagger + 12, x2: lx, y2: ngoBarY,
              stroke: P.line2, 'stroke-width': 1, opacity: 0 }, s);
            lbl.style.transition = 'opacity .4s ease .3s';
            lead.style.transition = 'opacity .4s ease .3s';
            tagNode(lbl, 6, function () { lbl.style.opacity = '1'; }, function () { lbl.style.opacity = '0'; });
            tagNode(lead, 6, function () { lead.style.opacity = '0.8'; }, function () { lead.style.opacity = '0'; });
          }
          segX += w;
        });

        // sub-rows under the NGO bar — step 6
        var sy = ngoBarY + bh + 30;
        cat.sub.forEach(function (sub) {
          var ry = sy;
          // sub-label on left (right aligned to plot start)
          drawWrappedLeftLabel(sub.label, bPlotX0 - 16, ry, bES);
          trackRow(bPlotX0, bPlotX1, ry, P.muted, sub.k, xb, 6, { h: 13, track: '#E2DDD0', barColor: '#7C817A' });
          bES('text', { x: xb(sub.k) + 16, y: ry + 5, 'font-size': 14, fill: P.muted,
            'text-anchor': 'start', text: 'k = ' + sub.k + '  |  ' + sub.pct.toFixed(1) + '%' }, s);
          sy += bSubH;
        });
        by = sy + bGapCat;
      } else {
        // compact categories: lollipop IS the category — draw on the main row at step 5
        trackRow(bPlotX0, bPlotX1, headY, P.muted, cat.k, xb, 5, { h: 13, track: '#E2DDD0' });
        bEH('text', { x: xb(cat.k) + 16, y: headY + 5, 'font-size': 14, fill: P.muted,
          'text-anchor': 'start', text: 'k = ' + cat.k + '  |  ' + cat.pct.toFixed(1) + '%' }, s);
        by = headY + bHeadH + bGapCat;
      }
    });

    // wrapped 2-line left labels for panel b sub-rows (right aligned)
    function drawWrappedLeftLabel(label, xRight, yMid, ef) {
      var words = label.split(' ');
      // simple 2-line split near the middle
      var mid = Math.ceil(words.length / 2);
      var l1 = words.slice(0, mid).join(' ');
      var l2 = words.slice(mid).join(' ');
      if (words.length <= 2) { l1 = label; l2 = ''; }
      if (l2) {
        ef('text', { x: xRight, y: yMid - 4, 'font-size': 13, fill: P.ink2,
          'text-anchor': 'end', text: l1 }, s);
        ef('text', { x: xRight, y: yMid + 12, 'font-size': 13, fill: P.ink2,
          'text-anchor': 'end', text: l2 }, s);
      } else {
        ef('text', { x: xRight, y: yMid + 5, 'font-size': 13, fill: P.ink2,
          'text-anchor': 'end', text: l1 }, s);
      }
    }

    // ---------- initial hidden state for animated nodes ----------
    function applyOff(node) { if (node && node._off) node._off(); }
    function applyOn(node) { if (node && node._on) node._on(); }

    Object.keys(animated).forEach(function (step) {
      animated[step].forEach(function (n) { if (n && n._off) n._off(); });
    });

    var maxStep = 6;

    function play(i) {
      for (var stp = 1; stp <= maxStep; stp++) {
        var on = stp <= i;
        (animated[stp] || []).forEach(function (n) {
          if (!n) return;
          if (on) { if (n._on) n._on(); }
          else { if (n._off) n._off(); }
        });
      }
    }

    return {
      steps: maxStep,
      play: play,
      reset: function () { play(0); }
    };
  };
})();
