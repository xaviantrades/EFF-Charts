'use strict';

/* =====================================================================
   CHARTS PAGE  (pages/charts/charts.js)
   =====================================================================
   A live candlestick chart embedded from TradingView's widget.
   (Loaded by a <script> tag in charts.html.)

   Uses from shared scripts:
     core.js  -> State, Q, MAP, Feed, $, icon, UI
     shell.js -> Actions, App, renderRoute
   ===================================================================== */

// Timeframe labels for the header picker. Keys are TradingView interval values.
const TF = {
  '1':  '1m',  '5':  '5m',  '15': '15m', '30': '30m',
  '60': '1h', '240': '4h', 'D': '1D'
};

/* ---------------------------------------------------------------------
   1) THE PAGE DESCRIPTION
   --------------------------------------------------------------------- */
const PAGE = (() => {
  return {
    id: 'charts', parent: 'quotes', nav: true,
    // Header: crosshair, indicators, the timeframe as TEXT (e.g. "M5"), objects, new order
    header: () => ({ left: 'menu', title: '', actions: [
      { icon: 'crosshair', action: 'toast', msg: 'Crosshair: tap and hold on the chart', label: 'Crosshair' },
      { icon: 'indicator', action: 'toast', msg: 'Indicators: coming soon', label: 'Indicators' },
      { text: TF[State.chart.tf] || State.chart.tf, action: 'pickTf' },
      { icon: 'clock', action: 'toast', msg: 'Objects: coming soon', label: 'Objects' },
      { icon: 'filePlus', action: 'newOrder', label: 'New order' }
    ]}),
    // The empty chart box + the label on top (tapping the label opens the symbol picker)
    render: () => {
      const m = MAP[State.chart.sym];
      return `<div class="chart-wrap">
        <div id="chart"></div>
        <button class="chart-label" data-action="pickChartSymbol" style="display:none;">
          <b>${m.sym}</b> ▾ ${TF[State.chart.tf] || State.chart.tf}<br><span>${m.name}</span>
        </button>
      </div>`;
    },
    // Runs after render(): create the TradingView iframe inside #chart
    mount() {
      const container = $('#chart');

      // Clear previous content
      container.innerHTML = '';

      const m = MAP[State.chart.sym];
      const tf = State.chart.tf;

      // Build the TradingView widget embed URL
      const url = new URL('https://s.tradingview.com/widgetembed/');
      url.searchParams.set('symbol', 'OANDA:' + m.sym);
      url.searchParams.set('interval', tf);
      url.searchParams.set('theme', 'dark');
      url.searchParams.set('style', '1');
      url.searchParams.set('locale', 'en');
      url.searchParams.set('toolbar_bg', '#0a0a0a');
      url.searchParams.set('hide_side_toolbar', 'false');
      url.searchParams.set('allow_symbol_change', 'true');
      url.searchParams.set('save_image', 'true');
      url.searchParams.set('hideideas', 'true');

      const iframe = document.createElement('iframe');
      iframe.src = url.toString();
      iframe.title = `${m.name} ${tf} timeframe chart`;
      iframe.style.width = '100%';
      iframe.style.height = '100%';
      iframe.style.border = 'none';
      iframe.style.display = 'block';
      // Allow full interaction inside the iframe (touch, scroll, zoom, etc.)
      iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture;';
      iframe.scrolling = 'auto';

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
      // Nothing to teardown: the iframe is removed when the page unloads.
    }
  };
})();

/* ---------------------------------------------------------------------
   2) ACTIONS ONLY THIS PAGE USES
   (chartFor and newOrder are shared and live in shell.js)
   --------------------------------------------------------------------- */
Object.assign(Actions, {
  // Header timeframe button: sheet listing the timeframes, a chevron marks the current one
  pickTf() {
    UI.sheet(`<h3>Timeframe</h3>` + Object.keys(TF).map(t =>
      `<button class="item" data-action="setTf" data-tf="${t}"><span>${TF[t]}</span>${t === State.chart.tf ? icon('chevron', 20) : ''}</button>`).join(''));
  },
  setTf(el) { State.chart.tf = el.dataset.tf; UI.close(); renderRoute(); },
  // Tap the label at the top-left: sheet listing the watch-list symbols
  pickChartSymbol() {
    UI.sheet(`<h3>Symbol</h3>` + State.watchlist.map(s => `<button class="item" data-action="chartFor" data-sym="${s}">${s}</button>`).join(''));
  }
});

/* ---------------------------------------------------------------------
   3) START  (gated: needs a logged-in account)
   --------------------------------------------------------------------- */
App.start(gated(PAGE));