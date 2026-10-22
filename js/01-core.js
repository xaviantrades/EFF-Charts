'use strict';

/* =====================================================================
   0) SMALL HELPERS
   ===================================================================== */
const $  = (sel, root = document) => root.querySelector(sel);   // find one element
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)]; // find many
const pad = n => String(n).padStart(2, '0');                     // 5 -> "05"
const clock = d => `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
const stamp = d => `${d.getFullYear()}.${pad(d.getMonth() + 1)}.${pad(d.getDate())} ${clock(d)}`;

// Money like 100 000.00 (space as thousands separator)
function money(n) {
  const [i, d] = Math.abs(n).toFixed(2).split('.');
  return (n < 0 ? '-' : '') + i.replace(/\B(?=(\d{3})+$)/g, ' ') + '.' + d;
}
// 100000 -> "100K" (shown in the bottom nav pill)
const compact = n => n >= 1000 ? Math.round(n / 1000) + 'K' : Math.round(n) + '';

// Safe wrapper around localStorage (it can be blocked in some previews)
const Store = {
  get(k, fallback) { try { const v = localStorage.getItem('kt_' + k); return v === null ? fallback : JSON.parse(v); } catch { return fallback; } },
  set(k, v)        { try { localStorage.setItem('kt_' + k, JSON.stringify(v)); } catch { /* ignore */ } }
};

/* =====================================================================
   1) ICONS  (original inline SVGs, drawn with currentColor so they
      follow the theme automatically)
   ===================================================================== */
const ICONS = {
  menu:'<path d="M4 6h16M4 12h16M4 18h16"/>',
  plus:'<path d="M12 5v14M5 12h14"/>',
  edit:'<path d="M4 20l4-1 11-11a2.1 2.1 0 00-3-3L5 16l-1 4z"/>',
  back:'<path d="M19 12H5M11 6l-6 6 6 6"/>',
  close:'<path d="M6 6l12 12M18 6L6 18"/>',
  quotes:'<path d="M8 20V5M4 9l4-4 4 4M16 4v15M12 15l4 4 4-4"/>',
  charts:'<path d="M7 3v18M17 3v18"/><rect x="4.5" y="8" width="5" height="7" rx=".6"/><rect x="14.5" y="6" width="5" height="9" rx=".6"/>',
  trade:'<path d="M4 18l5-6 4 3 7-9"/><circle cx="4" cy="18" r="1.7"/><circle cx="9" cy="12" r="1.7"/><circle cx="13" cy="15" r="1.7"/><circle cx="20" cy="6" r="1.7"/>',
  history:'<path d="M4 12a8 8 0 108-8 8 8 0 00-6 2.7M4 4v4h4M12 8v4l3 2"/>',
  messages:'<path d="M4 5h12a1 1 0 011 1v7a1 1 0 01-1 1H9l-4 3v-3H4a1 1 0 01-1-1V6a1 1 0 011-1z"/><path d="M20 9v8h-2"/>',
  crosshair:'<path d="M12 3v6M12 15v6M3 12h6M15 12h6"/>',
  indicator:'<path d="M3 16c3-8 5 2 8-4s5 4 9-6"/>',
  clock:'<circle cx="12" cy="12" r="8"/><path d="M12 8v4l3 2"/>',
  news:'<rect x="4" y="4" width="16" height="16" rx="2"/><path d="M8 9h8M8 13h8M8 17h5"/>',
  mail:'<rect x="3" y="6" width="18" height="13" rx="2"/><path d="M3 8l9 6 9-6"/>',
  journal:'<rect x="4" y="4" width="16" height="16" rx="2"/><path d="M12 4v16M7 9h2M7 13h2M15 9h2M15 13h2"/>',
  settings:'<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M19 5l-2 2M7 17l-2 2"/>',
  calendar:'<rect x="4" y="5" width="16" height="15" rx="2"/><path d="M4 10h16M8 3v4M16 3v4"/>',
  community:'<circle cx="7" cy="6" r="2"/><circle cx="17" cy="6" r="2"/><path d="M3 20v-4a3 3 0 013-3h2M21 20v-4a3 3 0 00-3-3h-2M9 20v-3a3 3 0 016 0v3"/>',
  trophy:'<path d="M8 4h8v5a4 4 0 01-8 0V4zM8 6H5v1a3 3 0 003 3M16 6h3v1a3 3 0 01-3 3M12 13v4M8 20h8"/>',
  help:'<circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.5 2.5 0 115 .5c0 1.5-2.5 2-2.5 3.5M12 17h.01"/>',
  info:'<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5h.01"/>',
  filePlus:'<path d="M6 3h8l5 5v13H6z"/><path d="M12 11v6M9 14h6"/>',
  refresh:'<path d="M20 12a8 8 0 11-3-6.2M20 4v5h-5"/>',
  chevron:'<path d="M9 6l6 6-6 6"/>',
  down:'<path d="M6 9l6 6 6-6"/>',
  grad:'<path d="M2 9l10-5 10 5-10 5-10-5zM6 11v5c0 1.5 3 3 6 3s6-1.5 6-3v-5"/>',
  mountain:'<path d="M3 20L10 7l4 7 3-4 4 10z" fill="currentColor"/>',
  chat:'<path d="M5 6h14a2 2 0 012 2v7a2 2 0 01-2 2h-7l-5 4v-4H5a2 2 0 01-2-2V8a2 2 0 012-2z"/><path d="M8 11h.01M12 11h.01M16 11h.01" stroke-width="3"/>',
  spread:'<path d="M5 8v8M19 8v8M5 12h14"/>'
};
// icon('menu') -> a ready <svg> string. size and stroke are optional.
const icon = (name, size = 24, stroke = 2) =>
  `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${stroke}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name] || ''}</svg>`;

/* =====================================================================
   2) STATE + FEED  (the data layer)
   ===================================================================== */

// ---- 2a) The symbols we offer. EDIT to add instruments. ----
// digits  = decimals in the price      spread = in "points" (smallest price step)
// contract= units per 1.00 lot         usdBase= true when USD is the FIRST currency (USDJPY...)

const MAP = {};
const Q = {};
MARKET.forEach(m => {
  m.point = Math.pow(10, -m.digits);
  MAP[m.sym] = m;
  // These are hidden placeholders only; quotes are not displayed as live until received.
  Q[m.sym] = {
    bid: m.price, ask: +(m.price + m.spread * m.point).toFixed(m.digits),
    open: m.price, lo: m.price, hi: m.price, dir: 0, time: new Date(),
    last: null, change: null, changePct: null, ready: false
  };
});






// ---- 2b) App state: everything the UI needs lives here ----
const State = {
  account: null,   // null = logged out. Otherwise { name, login, server, demo, balance, positions[], closed[], orders[], deals[] }
  settings: Object.assign({ theme: 'dark', showHL: true, showSpread: true }, Store.get('settings', {})),
  watchlist: MARKET.map(m => m.sym),    // which symbols appear on the Quotes page
  chart: { sym: 'EURUSD', tf: 'M5' },   // what the Charts page is showing
  journal: [],                          // log lines for the Journal page
  unread: 2,                            // mailbox badge
  nextId: 1000001                       // ticket numbers for orders
};
const log = msg => State.journal.unshift({ t: new Date(), msg });
log('Terminal started');

// ---- 2c) LIVE TRADINGVIEW FEED ----
// Implements the quote-session WebSocket protocol used in the supplied index.html.
// This endpoint is unofficial and may be restricted by TradingView.
const TV_URL = "wss://data.tradingview.com/socket.io/websocket";
const TV_SYMBOLS = {
  EURUSD:"FX:EURUSD", GBPUSD:"FX:GBPUSD", USDCHF:"FX:USDCHF",
  USDJPY:"FX:USDJPY", USDCNH:"FX:USDCNH", AUDUSD:"FX:AUDUSD",
  NZDUSD:"FX:NZDUSD", USDCAD:"FX:USDCAD", USDSEK:"FX:USDSEK",
  XAUUSD:"OANDA:XAUUSD"
};
const TV_TO_APP = Object.fromEntries(Object.entries(TV_SYMBOLS).map(([app,tv]) => [tv,app]));
const TV_FIELDS = ["lp","bid","ask","ch","chp"];
const Feed = {
  subs:new Set(), socket:null, quoteSession:null, reconnectTimer:null,
  manuallyClosed:false, status:"disconnected",
  on(fn) { this.subs.add(fn); return () => this.subs.delete(fn); },
  emit() { this.subs.forEach(fn => { try { fn(); } catch (e) { console.error("Feed subscriber error:",e); } }); },
  setStatus(status,message) {
    this.status = status;
    if (message) {
      log("TradingView: " + message);
      window.dispatchEvent(new CustomEvent("market-feed-status",{detail:{status,message}}));
    }
  },
  frame(payload) { return `~m~${payload.length}~m~${payload}`; },
  send(method,params) {
    if (this.socket && this.socket.readyState === WebSocket.OPEN)
      this.socket.send(this.frame(JSON.stringify({m:method,p:params})));
  },
  randomSession(prefix) {
    const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
    let result = prefix;
    for (let i=0;i<12;i++) result += chars[Math.floor(Math.random()*chars.length)];
    return result;
  },
  connect() {
    if (this.socket && [WebSocket.OPEN,WebSocket.CONNECTING].includes(this.socket.readyState)) return;
    this.manuallyClosed = false;
    clearTimeout(this.reconnectTimer);
    this.quoteSession = this.randomSession("qs_");
    this.setStatus("connecting","connecting to quote WebSocket…");
    let socket;
    try { socket = new WebSocket(TV_URL); this.socket = socket; }
    catch (error) { this.setStatus("error","WebSocket could not be created: "+error.message); this.scheduleReconnect(); return; }
    socket.addEventListener("open",() => {
      if (this.socket !== socket) return;
      this.setStatus("connected","WebSocket connected; subscribing to market quotes.");
      this.send("set_auth_token",["unauthorized_user_token"]);
      this.send("quote_create_session",[this.quoteSession]);
      this.send("quote_set_fields",[this.quoteSession,...TV_FIELDS]);
      this.send("quote_add_symbols",[this.quoteSession,...Object.values(TV_SYMBOLS)]);
    });
    socket.addEventListener("message",event => this.handleRaw(String(event.data)));
    socket.addEventListener("error",() => {
      if (this.socket === socket) this.setStatus("error","WebSocket error; live prices may be unavailable.");
    });
    socket.addEventListener("close",event => {
      if (this.socket === socket) this.socket = null;
      this.setStatus("disconnected","connection closed ("+event.code+").");
      if (!this.manuallyClosed) this.scheduleReconnect();
    });
  },
  scheduleReconnect() {
    if (this.manuallyClosed || this.reconnectTimer) return;
    this.reconnectTimer = setTimeout(() => { this.reconnectTimer=null; this.connect(); },5000);
  },
  disconnect() {
    this.manuallyClosed = true;
    clearTimeout(this.reconnectTimer); this.reconnectTimer=null;
    if (this.socket) { const socket=this.socket; this.socket=null; socket.close(); }
    this.setStatus("disconnected","feed disconnected.");
  },
  handleRaw(raw) {
    let pos=0;
    while (pos<raw.length) {
      if (raw.startsWith("~h~",pos)) {
        const nextFrame=raw.indexOf("~m~",pos);
        const heartbeat=nextFrame<0 ? raw.slice(pos) : raw.slice(pos,nextFrame);
        if (this.socket && this.socket.readyState===WebSocket.OPEN) this.socket.send(heartbeat);
        pos += heartbeat.length; continue;
      }
      const match=raw.slice(pos).match(/^~m~(\d+)~m~/);
      if (!match) break;
      const start=pos+match[0].length, end=start+Number(match[1]);
      if (end>raw.length) break;
      const payload=raw.slice(start,end); pos=end;
      if (payload.startsWith("~h~")) {
        if (this.socket && this.socket.readyState===WebSocket.OPEN) this.socket.send(payload);
        continue;
      }
      let data; try { data=JSON.parse(payload); } catch { continue; }
      if (data && data.m==="qsd") this.handleQuote(data.p);
    }
  },
  handleQuote(params) {
    if (!Array.isArray(params) || !params[1]) return;
    const quote=params[1];
    if (quote.s!=="ok") {
      log("TradingView quote status: "+(quote.s||"unknown")+" for "+(quote.n||"unknown symbol"));
      return;
    }
    const sym=TV_TO_APP[quote.n] || Object.keys(TV_SYMBOLS).find(key => quote.n===key);
    if (!sym || !Q[sym]) return;
    const values=quote.v||{}, q=Q[sym];
    const num=value => {
      if (value===undefined || value===null || value==="") return null;
      const n=Number(value); return Number.isFinite(n) ? n : null;
    };
    const lp=num(values.lp), bid=num(values.bid), ask=num(values.ask);
    const change=num(values.ch), changePct=num(values.chp);
    if (lp===null && bid===null && ask===null) return;
    const previous=q.last;
    const mid=lp ?? (bid!==null && ask!==null ? (bid+ask)/2 : bid ?? ask);
    q.bid=bid ?? lp ?? q.bid;
    q.ask=ask ?? lp ?? q.ask;
    if (previous!==null && mid!==null && mid!==previous) q.dir=mid>previous ? 1 : -1;
    q.last=mid; q.change=change; q.changePct=changePct;
    q.open=lp!==null && change!==null ? lp-change : (q.open || mid);
    if (!q.ready) { q.lo=q.bid; q.hi=q.ask; }
    else { q.lo=Math.min(q.lo,q.bid); q.hi=Math.max(q.hi,q.ask); }
    q.time=new Date(); q.ready=true;
    Feed.emit();
  }
};

// ---- 2d) Trading maths (simplified for a demo: leverage 1:100, USD account) ----
const profitOf = p => {\n  if (!Q[p.sym] || !Q[p.sym].ready) return 0;
  const m = MAP[p.sym], q = Q[p.sym];
  const closePx = p.side === 'buy' ? q.bid : q.ask;           // buys close at bid, sells at ask
  const diff = p.side === 'buy' ? closePx - p.price : p.price - closePx;
  const raw = diff * p.vol * m.contract;
  return m.usdBase ? raw / q.bid : raw;                       // convert to USD for USD-base pairs
};
const marginOf = p => {\n  if (!Q[p.sym] || !Q[p.sym].ready) return 0;
  const m = MAP[p.sym], q = Q[p.sym];
  return (m.usdBase ? p.vol * m.contract : p.vol * m.contract * q.bid) / 100;
};
function totals() {
  const a = State.account;
  const profit = a.positions.reduce((s, p) => s + profitOf(p), 0);
  const margin = a.positions.reduce((s, p) => s + marginOf(p), 0);
  const equity = a.balance + profit;
  return { profit, margin, equity, free: equity - margin };
}

/* =====================================================================
   3) THEME  (light / dark / system)
   ===================================================================== */
const mq = window.matchMedia('(prefers-color-scheme: dark)');
function applyTheme() {
  const mode = State.settings.theme;                          // 'dark' | 'light' | 'system'
  const dark = mode === 'system' ? mq.matches : mode === 'dark';
  document.documentElement.dataset.theme = dark ? 'dark' : 'light'; // CSS variables react to this
  $('meta[name=theme-color]').content = dark ? '#000000' : '#ffffff'; // colours the phone's browser bar
}
mq.addEventListener('change', () => { if (State.settings.theme === 'system') applyTheme(); });
const saveSettings = () => Store.set('settings', State.settings);
applyTheme(); // run immediately so there is no flash of the wrong theme

/* =====================================================================
   4) UI HELPERS: toast, bottom sheet, dialog, drawer
   ===================================================================== */
const UI = {
  live: null,   // optional function run on every price tick while a sheet is open

  toast(msg) {
    const t = $('#toast'); t.textContent = msg; t.classList.add('show');
    clearTimeout(UI._t); UI._t = setTimeout(() => t.classList.remove('show'), 2200);
  },
  // Bottom sheet (menus, order ticket)
  sheet(html) {
    const o = $('#overlay');
    o.innerHTML = `<div class="scrim" data-action="closeOverlay"></div><div class="sheet">${html}</div>`;
    o.classList.add('open');
  },
  // Centered dialog. dismiss:false means tapping outside does nothing.
  modal(html, dismiss = true) {
    const o = $('#overlay');
    o.innerHTML = `<div class="scrim" ${dismiss ? 'data-action="closeOverlay"' : ''}></div><div class="modal">${html}</div>`;
    o.classList.add('open');
  },
  close() { const o = $('#overlay'); o.classList.remove('open'); o.innerHTML = ''; UI.live = null; }
};

const Drawer = {
  open() {
    const a = State.account;
    $('#drawer').innerHTML = `
      <div class="scrim" data-action="closeDrawer"></div>
      <div class="panel">
        <div class="d-head">
          <div class="d-user">
            <div class="logo">${icon('mountain', 34)}</div>
            <div>
              <div style="font-size:20px">${a ? a.name : 'Kilele Trader'}</div>
              <small class="muted">${a ? a.login + ' - ' + a.server : 'No account connected'}</small>
            </div>
          </div>
          <button class="link" style="text-align:left;padding:14px 0 0" data-action="go" data-to="login">Manage accounts</button>
          ${a && a.demo ? '<div class="ribbon">Demo</div>' : ''}
        </div>
        ${[
          ['trade','Trade','trade'], ['news','News','news'], ['messages','Mailbox','mail', State.unread],
          ['journal','Journal','journal'], ['settings','Settings','settings'],
          ['calendar','Economic calendar','calendar'], ['community','Traders Community','community'],
          ['challenges','My Challenges','trophy'], ['help','User guide','help'], ['about','About','info']
        ].map(([to, label, ic, badge]) => `
          <button class="d-item" data-action="go" data-to="${to}">
            ${icon(ic, 26, 1.7)} ${label}
            ${badge ? `<span class="badge">${badge}</span>` : ''}
          </button>`).join('')}
      </div>`;
    requestAnimationFrame(() => $('#drawer').classList.add('open')); // next frame so the slide animates
  },
  close() { $('#drawer').classList.remove('open'); }
};

/* =====================================================================
   5) PRICE RENDERING HELPERS
   ===================================================================== */
// 1.11990 -> small "1.11", big "99", tiny raised "0"  (like pro terminals)
function pxHTML(v, d) {
  const s = v.toFixed(d);
  if (d < 3) return `<span class="pre">${s.slice(0, -2)}</span><span class="big">${s.slice(-2)}</span>`;
  return `<span class="pre">${s.slice(0, -3)}</span><span class="big">${s.slice(-3, -1)}</span><sup>${s.slice(-1)}</sup>`;
}

