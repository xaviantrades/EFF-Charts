/* =====================================================================
   7) ORDER TICKET (bottom sheet) + account actions
   ===================================================================== */
function orderHTML() {
  const o = UI.order, m = MAP[o.sym], q = Q[o.sym];
  return `
    <h3>New order</h3>
    <div class="o-row"><span class="muted">Symbol</span>
      <select id="o-sym" data-change="orderSymbol">${MARKET.map(x => `<option ${x.sym === o.sym ? 'selected' : ''}>${x.sym}</option>`).join('')}</select></div>
    <div class="o-row"><span class="muted">Volume (lots)</span>
      <div class="stepper"><button data-action="vol" data-d="-0.01">−</button><input id="o-vol" inputmode="decimal" value="${o.vol.toFixed(2)}"><button data-action="vol" data-d="0.01">+</button></div></div>
    <div class="trade-btns">
      <button class="tb sell" data-action="placeOrder" data-side="sell"><small>SELL</small><span id="o-bid">${q.bid.toFixed(m.digits)}</span></button>
      <button class="tb buy"  data-action="placeOrder" data-side="buy"><small>BUY</small><span id="o-ask">${q.ask.toFixed(m.digits)}</span></button>
    </div>`;
}
function openOrder(sym) {
  if (!State.account) { UI.toast('Add a trading account first'); return go('login'); }
  UI.order = { sym: sym || State.chart.sym, vol: 0.10 };
  UI.sheet(orderHTML());
  UI.live = () => {                     // keep the buy/sell prices live while the sheet is open
    const m = MAP[UI.order.sym], q = Q[UI.order.sym];
    const b = $('#o-bid'), a = $('#o-ask');
    if (b) b.textContent = q.bid.toFixed(m.digits);
    if (a) a.textContent = q.ask.toFixed(m.digits);
  };
}
Feed.on(() => UI.live && UI.live());    // run the sheet's live function on every tick

function createAccount({ name, login, server, demo }) {
  State.account = { name, login, server, demo, balance: 100000, positions: [], closed: [], orders: [],
    deals: [{ type: 'balance', time: new Date(), amount: 100000 }] };
  log(`'${login}': authorized on ${server}`);
  UI.toast('Connected to ' + server);
  go('quotes');
}

/* =====================================================================
   8) ACTIONS  (what happens when you tap something)
   Any element with data-action="foo" calls Actions.foo(element, event).
   Extra info travels in data- attributes (data-to, data-sym, data-id...).
   ===================================================================== */
const Actions = {
  // ---- navigation ----
  go(el)         { Drawer.close(); go(el.dataset.to); },
  back()         { go((PAGES[current.id] || {}).parent || 'quotes'); },
  openDrawer()   { Drawer.open(); },
  closeDrawer()  { Drawer.close(); },
  closeOverlay() { UI.close(); },
  toast(el)      { UI.toast(el.dataset.msg); },

  // ---- quotes ----
  symbolMenu(el) {
    const s = el.dataset.sym;
    UI.sheet(`<h3>${s}</h3>
      <button class="item" data-action="orderFor" data-sym="${s}">New order</button>
      <button class="item" data-action="chartFor" data-sym="${s}">Chart</button>
      <button class="item" data-action="removeSymbol" data-sym="${s}"><span class="dn">Remove from list</span></button>`);
  },
  orderFor(el)  { UI.close(); openOrder(el.dataset.sym); },
  chartFor(el)  { UI.close(); State.chart.sym = el.dataset.sym; go('charts'); },
  removeSymbol(el) { State.watchlist = State.watchlist.filter(s => s !== el.dataset.sym); UI.close(); renderRoute(); },
  addSymbol() {
    const left = MARKET.filter(m => !State.watchlist.includes(m.sym));
    UI.sheet(`<h3>Add symbol</h3>` + (left.length
      ? left.map(m => `<button class="item" data-action="addThis" data-sym="${m.sym}"><span>${m.sym}<br><small class="muted">${m.name}</small></span>${icon('plus', 20)}</button>`).join('')
      : '<p class="muted" style="text-align:center;padding:16px">All symbols are already in your list.</p>'));
  },
  addThis(el) { State.watchlist.push(el.dataset.sym); UI.close(); renderRoute(); },

  // ---- charts ----
  pickTf() {
    UI.sheet(`<h3>Timeframe</h3>` + Object.keys(TF).map(t =>
      `<button class="item" data-action="setTf" data-tf="${t}"><span>${t}</span>${t === State.chart.tf ? icon('chevron', 20) : ''}</button>`).join(''));
  },
  setTf(el) { State.chart.tf = el.dataset.tf; UI.close(); renderRoute(); },
  pickChartSymbol() {
    UI.sheet(`<h3>Symbol</h3>` + State.watchlist.map(s => `<button class="item" data-action="chartFor" data-sym="${s}">${s}</button>`).join(''));
  },

  // ---- trading ----
  newOrder() { openOrder(); },
  vol(el) {
    const input = $('#o-vol'), v = Math.max(0.01, Math.min(100, (parseFloat(input.value) || 0.01) + parseFloat(el.dataset.d)));
    UI.order.vol = v; input.value = v.toFixed(2);
  },
  placeOrder(el) {
    const a = State.account, o = UI.order, m = MAP[o.sym], q = Q[o.sym];
    const vol = Math.max(0.01, parseFloat($('#o-vol').value) || 0.01);
    const p = { id: State.nextId++, sym: o.sym, side: el.dataset.side, vol, price: el.dataset.side === 'buy' ? q.ask : q.bid, time: new Date() };
    if (marginOf(p) > totals().free) return UI.toast('Not enough free margin');
    a.positions.push(p); a.orders.push(p);
    a.deals.push({ type: 'trade', sym: p.sym, side: p.side, dir: 'in', vol, price: p.price, time: p.time, profit: 0 });
    log(`'${a.login}': market ${p.side} ${vol.toFixed(2)} ${p.sym} at ${p.price.toFixed(m.digits)}`);
    UI.close(); UI.toast(`Order #${p.id} executed`);
    renderRoute();
  },
  positionMenu(el) {
    const p = State.account.positions.find(x => x.id == el.dataset.id); if (!p) return;
    UI.sheet(`<h3>${p.sym}, ${p.side} ${p.vol.toFixed(2)}</h3>
      <button class="item" data-action="closePosition" data-id="${p.id}"><span class="dn">Close position</span></button>
      <button class="item" data-action="chartFor" data-sym="${p.sym}">Chart</button>`);
  },
  closePosition(el) {
    const a = State.account, i = a.positions.findIndex(x => x.id == el.dataset.id); if (i < 0) return;
    const p = a.positions[i], q = Q[p.sym], profit = profitOf(p);
    const closePrice = p.side === 'buy' ? q.bid : q.ask;
    a.positions.splice(i, 1);
    a.balance += profit;
    a.closed.unshift({ ...p, closePrice, closeTime: new Date(), profit });
    a.deals.unshift({ type: 'trade', sym: p.sym, side: p.side === 'buy' ? 'sell' : 'buy', dir: 'out', vol: p.vol, price: closePrice, time: new Date(), profit });
    log(`'${a.login}': position #${p.id} closed, profit ${money(profit)}`);
    UI.close(); UI.toast(`Closed ${p.sym}: ${profit >= 0 ? '+' : ''}${money(profit)}`);
    renderNav(); renderRoute();
  },

  // ---- history ----
  histTab(el) { PAGES.history.setTab(el.dataset.tab); },

  // ---- login / account ----
  demoDialog() {
    UI.modal(`<h3>Open a demo account</h3>
      <p style="text-align:center">Kilele Capital<br><span class="up">www.example.com</span></p>
      <p class="muted" style="text-align:center">By opening an account you agree to the account opening terms and the data protection policy.</p>
      <button class="btn block plain" data-action="openDemo">Open an Account</button>
      <p class="muted" style="margin-top:14px;font-size:14px">To trade using real money, you need to apply for a real trading account by entering into a separate agreement with a financial services company.</p>`);
  },
  openDemo() { UI.close(); createAccount({ name: 'Demo Trader', login: String(10000000000 + Math.floor(Math.random() * 9e9)), server: 'Kilele-Demo', demo: true }); renderNav(); },
  doLogin() {
    const login = $('#l-login').value.trim();
    if (!login) return UI.toast('Enter your login number');
    const server = $('#l-server').value;
    createAccount({ name: 'Trader ' + login.slice(-4), login, server, demo: /demo/i.test(server) });
    renderNav();
  },
  logout() { log(`'${State.account.login}': disconnected`); State.account = null; UI.toast('Logged out'); renderNav(); go('quotes'); },

  // ---- settings ----
  setTheme(el) { State.settings.theme = el.dataset.mode; saveSettings(); applyTheme(); renderRoute(); },
  toggleSetting(el) { const k = el.dataset.key; State.settings[k] = !State.settings[k]; saveSettings(); renderRoute(); },

  // ---- first-run consent dialog ----
  accept()  { Store.set('consent', true); UI.close(); },
  decline() { UI.toast('You need to accept to use the app'); }
};

// ONE click listener for the whole app (event delegation).
// closest() walks up from the tapped element to find the nearest data-action.
document.addEventListener('click', e => {
  const el = e.target.closest('[data-action]');
  if (el && Actions[el.dataset.action]) Actions[el.dataset.action](el, e);
});
// Inputs that use data-change (e.g. the symbol dropdown in the order sheet)
document.addEventListener('change', e => {
  if (e.target.dataset.change === 'orderSymbol') {
    UI.order.vol = parseFloat($('#o-vol').value) || UI.order.vol;
    UI.order.sym = e.target.value;
    $('#overlay .sheet').innerHTML = orderHTML();      // redraw the ticket for the new symbol
  }
});

