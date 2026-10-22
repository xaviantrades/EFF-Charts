/* ---------------------------------------------------------------------
   6.1  QUOTES
   --------------------------------------------------------------------- */
PAGES.quotes = gated((() => {
  let off = null; // unsubscribe handle

  // Update ONE row's numbers in place (no full re-render = smooth, no flicker)
  function paintRow(sym) {
    const m = MAP[sym], q = Q[sym], S = State.settings;
    const set = (id, html) => { const el = $(`#${id}-${sym}`); if (el) el.innerHTML = html; };
    const pts = Math.round((q.bid - q.open) / m.point);
    const pct = (q.bid - q.open) / q.open * 100;
    const cls = pts < 0 ? 'dn' : 'up';
    set('chg',  `<span class="${cls}">${pts > 0 ? '+' : ''}${pts} &nbsp;${pct > 0 ? '+' : ''}${pct.toFixed(2)}%</span>`);
    set('time', clock(q.time));
    set('spr',  S.showSpread ? `${icon('spread', 18, 1.6)} ${m.spread}` : '');
    ['bid', 'ask'].forEach(side => {
      const el = $(`#${side}-${sym}`);
      if (el) { el.className = 'px ' + (q.dir > 0 ? 'up' : 'dn'); el.innerHTML = pxHTML(q[side], m.digits); }
    });
    set('lh', S.showHL ? `<span>L: ${q.lo.toFixed(m.digits)}</span><span>H: ${q.hi.toFixed(m.digits)}</span>` : '');
  }
  const paintAll = () => State.watchlist.forEach(paintRow);

  return {
    parent: 'quotes', nav: true,
    header: () => ({ left: 'menu', title: 'Quotes', actions: [
      { icon: 'plus', action: 'addSymbol', label: 'Add symbol' },
      { icon: 'edit', action: 'toast', msg: 'Edit mode: coming soon', label: 'Edit' }
    ]}),
    render: () => State.watchlist.map(sym => `
      <div class="q-row" data-action="symbolMenu" data-sym="${sym}">
        <div>
          <div class="q-chg" id="chg-${sym}"></div>
          <div class="q-sym">${sym}</div>
          <div class="q-meta"><span id="time-${sym}"></span><span id="spr-${sym}" style="display:flex;align-items:center;gap:4px"></span></div>
        </div>
        <div class="q-right">
          <div class="q-prices"><span id="bid-${sym}" class="px"></span><span id="ask-${sym}" class="px"></span></div>
          <div class="q-lh" id="lh-${sym}"></div>
        </div>
      </div>`).join('') || '<div class="empty">Your list is empty. Tap + to add symbols.</div>',
    mount() { paintAll(); off = Feed.on(paintAll); },
    unmount() { if (off) off(); off = null; }
  };
})());

/* ---------------------------------------------------------------------
   6.2  CHARTS  (uses the Lightweight Charts library)
   --------------------------------------------------------------------- */
const TF = { M1:60, M5:300, M15:900, M30:1800, H1:3600, H4:14400, D1:86400 }; // timeframe -> seconds

// Make fake history that ENDS at the current price (replace with real candles later)
function genCandles(sym, tfSec, n = 300) {
  const m = MAP[sym], r = x => +x.toFixed(m.digits);
  const end = Math.floor(Date.now() / 1000 / tfSec) * tfSec;      // start of the current candle
  const sigma = Q[sym].bid * 0.0004 * Math.sqrt(tfSec / 300);      // typical candle size
  const out = []; let close = Q[sym].bid;
  for (let i = n - 1; i >= 0; i--) {                               // build backwards from "now"
    const open = close - (Math.random() - 0.5) * 2 * sigma;
    const high = Math.max(open, close) + Math.random() * sigma * 0.6;
    const low  = Math.min(open, close) - Math.random() * sigma * 0.6;
    out.push({ time: end - (n - 1 - i) * tfSec, open: r(open), high: r(high), low: r(low), close: r(close) });
    close = open;                                                  // this open = previous candle's close
  }
  return out.reverse();
}

PAGES.charts = gated((() => {
  let chart = null, series = null, cur = null, off = null;

  return {
    parent: 'quotes', nav: true,
    header: () => ({ left: 'menu', title: '', actions: [
      { icon: 'crosshair', action: 'toast', msg: 'Crosshair: tap and hold on the chart', label: 'Crosshair' },
      { icon: 'indicator', action: 'toast', msg: 'Indicators: coming soon', label: 'Indicators' },
      { text: State.chart.tf, action: 'pickTf' },
      { icon: 'clock', action: 'toast', msg: 'Objects: coming soon', label: 'Objects' },
      { icon: 'filePlus', action: 'newOrder', label: 'New order' }
    ]}),
    render: () => {
      const m = MAP[State.chart.sym];
      return `<div class="chart-wrap">
        <div id="chart"></div>
        <button class="chart-label" data-action="pickChartSymbol">
          <b>${m.sym}</b> ▾ ${State.chart.tf}<br><span>${m.name}</span>
        </button>
      </div>`;
    },
    mount() {
      if (!window.LightweightCharts) { $('#chart').innerHTML = '<div class="empty">The chart library could not load. Check your internet connection.</div>'; return; }
      const L = window.LightweightCharts, m = MAP[State.chart.sym], tf = TF[State.chart.tf];
      const css = getComputedStyle(document.documentElement), col = n => css.getPropertyValue(n).trim();

      chart = L.createChart($('#chart'), {
        autoSize: true,                                            // fill the container
        layout: { background: { type: L.ColorType.Solid, color: col('--bg') }, textColor: col('--muted'), fontFamily: 'Roboto' },
        grid: { vertLines: { color: col('--grid'), style: L.LineStyle.Dashed }, horzLines: { color: col('--grid'), style: L.LineStyle.Dashed } },
        rightPriceScale: { borderColor: col('--line') },
        timeScale: { borderColor: col('--line'), timeVisible: true, secondsVisible: false, rightOffset: 6 }
      });
      series = chart.addSeries(L.CandlestickSeries, {
        upColor: col('--cup'), downColor: col('--cdn'), borderVisible: false,
        wickUpColor: col('--cup'), wickDownColor: col('--cdn'),
        priceFormat: { type: 'price', precision: m.digits, minMove: m.point }
      });

      const data = genCandles(m.sym, tf);          // REAL FEED: replace with candles from your API
      series.setData(data);
      cur = { ...data[data.length - 1] };          // the candle currently forming
      chart.timeScale().setVisibleLogicalRange({ from: data.length - 60, to: data.length + 6 });

      // Live: every tick either updates the current candle or starts a new one
      off = Feed.on(() => {
        const bid = Q[m.sym].bid, t = Math.floor(Date.now() / 1000 / tf) * tf;
        if (t > cur.time) cur = { time: t, open: bid, high: bid, low: bid, close: bid };
        else { cur.high = Math.max(cur.high, bid); cur.low = Math.min(cur.low, bid); cur.close = bid; }
        series.update(cur);
      });
    },
    unmount() {
      if (off) off(); off = null;
      if (chart) { chart.remove(); chart = null; }          // free the chart's memory
    }
  };
})());

