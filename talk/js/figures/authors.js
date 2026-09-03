/* ============================================================
   Figure: authors — Co-author wall (backup slide)
   Tidy flowing multi-column grid of all co-author names with a
   header strip. Auto-fits font/columns so everything fits.
   steps = 1: names fade in (staggered cascade by column).
   reset() = header + accent rule only.
   ============================================================ */
(function () {
  var MDC = window.MDC;

  MDC.figures['authors'] = function (mount, opts) {
    var P = opts.palette || MDC.palette;
    var VBW = 1180, VBH = 560;
    var s = MDC.svg(mount, VBW, VBH);

    var co = (MDC.coauthors) || (MDC.data && MDC.data.coauthors) || {};
    var names = (co.authors || []).slice();
    var dedup = co.deduped_count || names.length;

    /* ---------- layout geometry ---------- */
    var padX = 70, padTop = 22;
    var headerH = 70;            // header strip height
    var gridTop = padTop + headerH + 30;
    var gridBottom = VBH - 34;
    var gridLeft = padX;
    var gridRight = VBW - padX;
    var gridW = gridRight - gridLeft;
    var gridH = gridBottom - gridTop;

    var N = names.length;

    /* Auto-fit: try 3 then 4 columns; pick rows from count and size
       the row height to fill the grid; cap font so long names fit col. */
    var COLS = (N > 90) ? 4 : 3;
    var rows = Math.ceil(N / COLS);
    var colW = gridW / COLS;
    var rowH = gridH / rows;

    // font: bounded by row height and by column width vs longest name.
    var maxLen = 1;
    for (var m = 0; m < N; m++) maxLen = Math.max(maxLen, names[m].length);
    var fsByRow = rowH * 0.62;
    var fsByCol = (colW - 26) / (maxLen * 0.50); // ~0.50 em avg glyph width
    var fs = Math.max(11, Math.min(20, Math.min(fsByRow, fsByCol)));

    /* ---------- header ---------- */
    var head = MDC.g(s);
    MDC.el('rect', {
      x: padX - 18, y: padTop, width: VBW - 2 * (padX - 18), height: headerH,
      rx: 8, fill: P.bg2, stroke: P.line, 'stroke-width': 1
    }, head);

    MDC.el('text', {
      x: VBW / 2, y: padTop + 34, 'text-anchor': 'middle',
      'font-family': 'Montserrat, sans-serif', 'font-size': 24, 'font-weight': 700,
      fill: P.greenDeep, text: 'The Crowd'
    }, head);

    var sub = '55 research teams  ·  ' + dedup + ' co-authors  ·  University of Innsbruck';
    MDC.el('text', {
      x: VBW / 2, y: padTop + 57, 'text-anchor': 'middle',
      'font-family': 'Montserrat, sans-serif', 'font-size': 14.5, 'font-weight': 500,
      fill: P.ink2, 'letter-spacing': '0.4', text: sub
    }, head);

    // faint green accent rule under the header
    var ruleY = padTop + headerH + 13;
    MDC.el('line', {
      x1: VBW / 2 - 150, y1: ruleY, x2: VBW / 2 + 150, y2: ruleY,
      stroke: P.green, 'stroke-width': 2, 'stroke-linecap': 'round', opacity: 0.55
    }, head);
    MDC.el('circle', { cx: VBW / 2, cy: ruleY, r: 3.2, fill: P.green }, head);

    /* ---------- names grid ---------- */
    var nameG = MDC.g(s);
    var nodes = [];   // { el, col }
    // column-major fill so each column reads top-to-bottom, balanced
    var perCol = Math.ceil(N / COLS);
    for (var i = 0; i < N; i++) {
      var col = Math.floor(i / perCol);
      var rowInCol = i % perCol;
      var cx = gridLeft + col * colW + 14;
      var cy = gridTop + rowH * (rowInCol + 0.5) + fs * 0.34;

      var t = MDC.el('text', {
        x: cx, y: cy, 'text-anchor': 'start',
        'font-family': 'Montserrat, sans-serif', 'font-size': fs.toFixed(1),
        'font-weight': 400, fill: P.ink2, text: names[i]
      }, nameG);
      t.style.opacity = '0';
      t.style.transition = 'opacity .45s ease';
      nodes.push({ el: t, col: col });
    }

    /* ---------- controller ---------- */
    function setStep(i) {
      var show = i >= 1;
      for (var k = 0; k < nodes.length; k++) {
        var nd = nodes[k];
        if (show) {
          // cascade: stagger by column, then by position within column
          var idxInCol = k % perCol;
          nd.el.style.transitionDelay = (nd.col * 0.10 + idxInCol * 0.012) + 's';
          nd.el.style.opacity = '1';
        } else {
          nd.el.style.transitionDelay = '0s';
          nd.el.style.opacity = '0';
        }
      }
    }

    return {
      steps: 1,
      play: function (i) { setStep(i); },
      reset: function () { setStep(0); }
    };
  };
})();
