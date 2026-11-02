'use strict';

/* =====================================================================
   CHARTS PAGE  (pages/charts/charts.js)
   =====================================================================
   A live candlestick chart using the Lightweight Charts library
   (loaded by a <script> tag in charts.html, available as window.LightweightCharts).

   Uses from shared scripts:
     core.js  -> State, Q, MAP, Feed, $, icon, UI
     shell.js -> Actions, App, renderRoute
   ===================================================================== */



/* ---------------------------------------------------------------------
   2) THE PAGE DESCRIPTION
   --------------------------------------------------------------------- */
const PAGE = (() => {
  // chart  = the library's chart object        series = the candle series inside it
  // cur    = the candle that is forming NOW    off    = Feed unsubscribe handle
  let chart = null, series = null, cur = null, off = null;

  return {
    id: 'charts', parent: 'quotes', nav: true,
    // Header: crosshair, indicators, the timeframe as TEXT (e.g. "M5"), objects, new order
    header: () => ({ left: 'menu', title: '', actions: [
      { icon: 'crosshair', action: 'toast', msg: 'Crosshair: tap and hold on the chart', label: 'Crosshair' },
      { icon: 'indicator', action: 'toast', msg: 'Indicators: coming soon', label: 'Indicators' },
      { text: State.chart.tf, action: 'pickTf' },
      { icon: 'clock', action: 'toast', msg: 'Objects: coming soon', label: 'Objects' },
      { icon: 'filePlus', action: 'newOrder', label: 'New order' }
    ]}),
    // The empty chart box + the label on top (tapping the label opens the symbol picker)
    render: () => {
      const m = MAP[State.chart.sym];
      return `<div class="chart-wrap" >
        <div id="chart"></div>
        <button class="chart-label" data-action="pickChartSymbol" style="display:none;">
          <b>${m.sym}</b> ▾ ${State.chart.tf}<br><span>${m.name}</span>
        </button>
      </div>`;
    },
    // Runs after render(): create the chart inside #chart
   
mount() {
    const container = $('#chart');

    // Clear previous content
    container.innerHTML = '';

    const m = MAP[State.chart.sym];
    const tf = State.chart.tf;

    // Create the TradingView iframe
    const iframe = document.createElement('iframe');

    // Build the URL dynamically using the selected symbol and timeframe
    const url = new URL('https://s.tradingview.com/widgetembed/');

    url.searchParams.set('symbol', 'OANDA:' + m.sym);
    url.searchParams.set('interval', tf);
    url.searchParams.set('theme', 'dark');
    url.searchParams.set('style', '1');
    url.searchParams.set('locale', 'en');

    iframe.src = url.toString();
    iframe.title = `${m.name} ${tf} timeframe chart`;
    iframe.style.width = '100%';
    iframe.style.height = '99%';
    iframe.style.border = 'none';
    iframe.scrolling = 'no';
iframe.style.overflow = 'hidden';
iframe.style.border = 'none';
    

    // Display an error if loading takes too long
    let loaded = false;

    const timeout = setTimeout(() => {
        if (!loaded) {
            container.innerHTML =
                '<div class="empty">The chart could not load. Check your internet connection.</div>';
        }
    }, 10000);

    iframe.onload = () => {
        loaded = true;
        clearTimeout(timeout);
    };

    iframe.onerror = () => {
        clearTimeout(timeout);
        container.innerHTML =
            '<div class="empty">The chart could not load. Check your internet connection.</div>';
    };

    container.appendChild(iframe);
},

unmount() {
    if (off) off();
    off = null;

    if (chart) {
        chart.remove();
        chart = null;
    }
},

    // Runs when the page redraws or closes: stop listening and free the chart's memory
    unmount() {
      if (off) off(); off = null;
      if (chart) { chart.remove(); chart = null; }
    }
  };
})();

/* ---------------------------------------------------------------------
   3) ACTIONS ONLY THIS PAGE USES
   (chartFor and newOrder are shared and live in shell.js)
   --------------------------------------------------------------------- */
Object.assign(Actions, {
  // Header "M5" button: sheet listing the timeframes, a chevron marks the current one
  pickTf() {
    UI.sheet(`<h3>Timeframe</h3>` + Object.keys(TF).map(t =>
      `<button class="item" data-action="setTf" data-tf="${t}"><span>${t}</span>${t === State.chart.tf ? icon('chevron', 20) : ''}</button>`).join(''));
  },
  setTf(el) { State.chart.tf = el.dataset.tf; UI.close(); renderRoute(); },   // remember the choice, redraw the chart
  // Tap the label at the top-left: sheet listing the watch-list symbols
  pickChartSymbol() {
    UI.sheet(`<h3>Symbol</h3>` + State.watchlist.map(s => `<button class="item" data-action="chartFor" data-sym="${s}">${s}</button>`).join(''));
  }
});

/* ---------------------------------------------------------------------
   4) START  (gated: needs a logged-in account)
   --------------------------------------------------------------------- */
App.start(gated(PAGE));
