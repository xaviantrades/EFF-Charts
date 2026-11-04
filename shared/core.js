'use strict';

/* =====================================================================
   KILELE TRADER  -  CORE  (shared/core.js)
   =====================================================================
   Loaded by EVERY page, FIRST (before shell.js and the page's own js).

   This file is the "engine" that all pages share. Read it in order:

     0) SMALL HELPERS        $, money(), Store ...
     1) ICONS                inline SVG icons + hydrateIcons()
     2) STATE + FEED         the data: symbols, account, fake price engine
     2e) SESSION             NEW: keeps the data alive between pages
     2f) TRADING MATHS       profit / margin / totals
     3) THEME                light / dark / system
     4) UI HELPERS           toast, bottom sheet, dialog, drawer
     5) PRICE RENDERING      pxHTML()
     6) ACCOUNT GATING       emptyAccount(), gated()

   IMPORTANT DIFFERENCE FROM THE ORIGINAL SINGLE-PAGE APP
   ------------------------------------------------------
   Originally the whole app was ONE html page. Moving between "pages" only
   swapped content with JavaScript, so the State object (account, open
   positions, prices ...) simply stayed in memory.

   Now every page is a REAL separate .html file. When you go to another page
   the browser throws away all JavaScript memory and loads the new page.
   To make the app behave exactly the same, State is saved into the browser's
   sessionStorage right before leaving a page and loaded again when the next
   page starts (see section 2e).
   ===================================================================== */


/* =====================================================================
   0) SMALL HELPERS
   ===================================================================== */
const $  = (sel, root = document) => root.querySelector(sel);        // find one element
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)]; // find many (as a real array)
const pad = n => String(n).padStart(2, '0');                          // 5 -> "05"
const clock = d => `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;                   // 14:05:09
const stamp = d => `${d.getFullYear()}.${pad(d.getMonth() + 1)}.${pad(d.getDate())} ${clock(d)}`;          // 2026.10.23 14:05:09

// Money like 100 000.00 (space as thousands separator)
function money(n) {
  const [i, d] = Math.abs(n).toFixed(2).split('.');                   // split "100000.00" into "100000" and "00"
  return (n < 0 ? '-' : '') + i.replace(/\B(?=(\d{3})+$)/g, ' ') + '.' + d; // insert a space every 3 digits
}
// 100000 -> "100K" (shown in the bottom nav pill)
const compact = n => n >= 1000 ? Math.round(n / 1000) + 'K' : Math.round(n) + '';

// Safe wrapper around localStorage (it can be blocked in some previews).
// This is the LONG-TERM store: it survives closing the browser.
// Used for: theme/settings and the "I accepted the terms" flag.
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

// NEW: lets plain HTML files use icons without copy-pasting SVG code.
// In an .html file write:   <i data-icon="chevron" data-size="24" data-stroke="2"></i>
// and this function swaps that tag for the real <svg>. size/stroke are optional.
// Called once at startup by App.start() in shell.js.
function hydrateIcons(root = document) {
  $$('[data-icon]', root).forEach(el => {
    el.outerHTML = icon(el.dataset.icon, +el.dataset.size || 24, +el.dataset.stroke || 2);
  });
}


/* =====================================================================
   2) STATE + FEED  (the data layer)
   ===================================================================== */

// ---- 2a) The symbols we offer. EDIT to add instruments. ----
// digits  = decimals in the price      spread = in "points" (smallest price step)
// contract= units per 1.00 lot         usdBase= true when USD is the FIRST currency (USDJPY...)
const MARKET = [
  {
    sym: "EURUSD",
    price: 1.11990,
    exchange: "FX",
    name: "Euro vs US Dollar",
    digits: 5,
    spread: 1,
    contract: 100000,
    usdBase: false
  },
  {
    sym: "GBPUSD",
    price: 1.33708,
    exchange: "FX",
    name: "Great Britain Pound vs US Dollar",
    digits: 5,
    spread: 0,
    contract: 100000,
    usdBase: false
  },
  {
    sym: "USDJPY",
    price: 157.003,
    exchange: "FX",
    name: "US Dollar vs Japanese Yen",
    digits: 3,
    spread: 2,
    contract: 100000,
    usdBase: true
  },
  {
    sym: "USDCHF",
    price: 0.82218,
    exchange: "FX",
    name: "US Dollar vs Swiss Franc",
    digits: 5,
    spread: 2,
    contract: 100000,
    usdBase: true
  },
  {
    sym: "USDCAD",
    price: 1.40362,
    exchange: "FX",
    name: "US Dollar vs Canadian Dollar",
    digits: 5,
    spread: 1,
    contract: 100000,
    usdBase: true
  },
  {
    sym: "AUDUSD",
    price: 0.70078,
    exchange: "FX",
    name: "Australian Dollar vs US Dollar",
    digits: 5,
    spread: 1,
    contract: 100000,
    usdBase: false
  },
  {
    sym: "NZDUSD",
    price: 0.56781,
    exchange: "FX",
    name: "New Zealand Dollar vs US Dollar",
    digits: 5,
    spread: 1,
    contract: 100000,
    usdBase: false
  },
  {
    sym: "XAUUSD",
    price: 2650.00,
    exchange: "OANDA",
    name: "Gold vs US Dollar",
    digits: 2,
    spread: 25,
    contract: 100,
    usdBase: false
  }
];

const MAP = {};   // MAP['EURUSD'] -> its definition (fast lookup)
const Q   = {};   // Q['EURUSD']   -> its LIVE quote {bid, ask, open, lo, hi, dir, time}
MARKET.forEach(m => {
  m.point = Math.pow(10, -m.digits);   // smallest step, e.g. 0.00001
  m.vol   = m.price * 0.00004;         // typical movement per tick (volatility)
  MAP[m.sym] = m;
  Q[m.sym] = {
    bid: m.price,
    ask: +(m.price + m.spread * m.point).toFixed(m.digits),
    open: m.price * (1 + (Math.random() - 0.5) * 0.008),  // pretend "today's open"
    lo: m.price * 0.9955, hi: m.price * 1.0045,           // pretend day low / high
    dir: 1, time: new Date()
  };
});

// ---- 2b) App state: everything the UI needs lives here ----
const State = {
  account: null,   // null = logged out. Otherwise { name, login, server, demo, balance, positions[], closed[], orders[], deals[] }
  settings: Object.assign({ theme: 'dark', showHL: true, showSpread: true }, Store.get('settings', {})),
  watchlist: MARKET.map(m => m.sym),    // which symbols appear on the Quotes page
  chart: { sym: 'EURUSD', tf: '5' },   // what the Charts page is showing
  journal: [],                          // log lines for the Journal page
  unread: 2,                            // mailbox badge
  nextId: 1000001,                      // ticket numbers for orders
  // ---- NEW fields, needed because pages are now separate html files ----
  histTab: 'positions',                 // which tab the History page shows (used to be a variable inside the page)
  consent: false,                       // "accepted terms" remembered for this tab even if localStorage is blocked
  pendingToast: null                    // a toast { msg, left } that must appear on the NEXT page, "left" = ms still to show (see go() in shell.js)
};
const log = msg => State.journal.unshift({ t: new Date(), msg });

// ---- 2c) The FEED: pages subscribe to be told when prices change ----
const Feed = {
  subs: new Set(),
  on(fn)  { this.subs.add(fn); return () => this.subs.delete(fn); },
  emit()  {
    // A page listener must never prevent the other listeners or the quote
    // persistence step from running when one renderer throws.
    this.subs.forEach(fn => {
      try { fn(); }
      catch (error) { console.error("Live feed subscriber failed:", error); }
    });
  }
};

// ---- Yahoo Finance WebSocket market data ----
// Keep this endpoint and protocol aligned with the tested Yahoo reference page.
const Yahoo = {
  url: "wss://streamer.finance.yahoo.com/?version=2",
  socket: null,
  reconnectTimer: null,
  heartbeatTimer: null,
  silenceTimer: null,
  reconnectDelay: 5000,
  connected: false,
  manualClose: false,
  attempts: {},
  lastTickAt: {},
  ticks: {},
  subscriptions: [],
  subscriptionInterval: 15000,
  silenceMs: 12000,
  frameSilenceMs: 45000,
  lastFrameAt: 0,
  frameCount: 0,
  decodeErrors: 0,
  unknownSymbols: 0
};

// Yahoo's FX symbols are not consistent: USD-base pairs commonly use
// CHF=X, JPY=X and CAD=X rather than USDCHF=X, USDJPY=X and USDCAD=X.
const YAHOO_CANDIDATES = {
  EURUSD: ["EURUSD=X"],
  GBPUSD: ["GBPUSD=X"],
  USDJPY: ["JPY=X"],
  USDCHF: ["CHF=X"],
  USDCAD: ["CAD=X"],
  AUDUSD: ["AUDUSD=X"],
  NZDUSD: ["NZDUSD=X"],
  XAUUSD: ["XAUUSD=X", "GC=F"]
};
const YAHOO_TO_APP = {};
Object.keys(YAHOO_CANDIDATES).forEach(symbol => {
  YAHOO_CANDIDATES[symbol].forEach(ticker => { YAHOO_TO_APP[ticker] = symbol; });
  Yahoo.ticks[symbol] = 0;
});
Object.keys(YAHOO_CANDIDATES).forEach(symbol => {
  Yahoo.subscriptions.push(YAHOO_CANDIDATES[symbol][0]);
});

// Decode Yahoo's PricingData protobuf message. Field 1 is ticker ID,
// field 2 price, 3 time, 8 change %, 10 high, 11 low, 12 change,
// 15 open, 23 bid and 25 ask.
function yahooDecodePricing(base64Message) {
  const binary = atob(base64Message);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const decoder = new TextDecoder();
  const result = {};
  let offset = 0;

  function readVarint() {
    let value = 0n;
    let shift = 0n;
    while (true) {
      if (offset >= bytes.length || shift >= 70n) throw new Error("Invalid or truncated Yahoo varint");
      const byte = bytes[offset++];
      value |= BigInt(byte & 0x7f) << shift;
      if (!(byte & 0x80)) return value;
      shift += 7n;
    }
  }

  while (offset < bytes.length) {
    const tag = Number(readVarint());
    const field = tag >>> 3;
    const wire = tag & 7;
    let value;

    if (wire === 0) {
      const raw = readVarint();
      value = Number(raw);
      if (field === 3 || field === 9 || field === 24 || field === 26) {
        value = Number((raw >> 1n) ^ -(raw & 1n));
      }
    } else if (wire === 1) {
      if (offset + 8 > bytes.length) throw new Error("Truncated Yahoo 64-bit field");
      value = view.getFloat64(offset, true);
      offset += 8;
    } else if (wire === 2) {
      const length = Number(readVarint());
      if (length < 0 || offset + length > bytes.length) throw new Error("Truncated Yahoo text field");
      value = decoder.decode(bytes.subarray(offset, offset + length));
      offset += length;
    } else if (wire === 5) {
      if (offset + 4 > bytes.length) throw new Error("Truncated Yahoo float field");
      value = view.getFloat32(offset, true);
      offset += 4;
    } else {
      throw new Error("Unsupported Yahoo protobuf wire type: " + wire);
    }

    const fields = {
      1: "id", 2: "price", 3: "time", 8: "changePercent",
      10: "dayHigh", 11: "dayLow", 12: "change",
      15: "openPrice", 23: "bid", 25: "ask"
    };
    if (fields[field]) result[fields[field]] = value;
  }
  return result;
}

function yahooUpdateQuote(data) {
  const symbol = YAHOO_TO_APP[data.id];
  if (!symbol) {
    Yahoo.unknownSymbols++;
    if (Yahoo.unknownSymbols <= 5) console.warn("Yahoo sent an unrecognised ticker:", data.id);
    return;
  }

  const market = MAP[symbol];
  const quote = Q[symbol];
  const previousMid = (quote.bid + quote.ask) / 2;
  const price = Number(data.price);
  const bid = Number(data.bid);
  const ask = Number(data.ask);
  const hasPrice = (Number.isFinite(price) && price > 0) ||
    (Number.isFinite(bid) && bid > 0) ||
    (Number.isFinite(ask) && ask > 0);
  if (!hasPrice) {
    console.warn("Yahoo pricing frame did not contain a usable price:", data);
    return;
  }

  if (Number.isFinite(bid) && bid > 0) quote.bid = bid;
  else if (Number.isFinite(price) && price > 0) quote.bid = price;
  if (Number.isFinite(ask) && ask > 0) quote.ask = ask;
  else quote.ask = quote.bid + market.spread * market.point;

  quote.bid = +quote.bid.toFixed(market.digits);
  quote.ask = +quote.ask.toFixed(market.digits);
  const mid = (quote.bid + quote.ask) / 2;
  if (Math.abs(mid - previousMid) > 1e-12) quote.dir = mid > previousMid ? 1 : -1;

  if (Number(data.openPrice) > 0) quote.open = Number(data.openPrice);
  if (Number(data.dayHigh) > 0) quote.hi = Number(data.dayHigh);
  else quote.hi = quote.hi == null ? quote.ask : Math.max(quote.hi, quote.ask);
  if (Number(data.dayLow) > 0) quote.lo = Number(data.dayLow);
  else quote.lo = quote.lo == null ? quote.bid : Math.min(quote.lo, quote.bid);

  quote.time = Number(data.time) > 0 ? new Date(Number(data.time)) : new Date();
  Yahoo.lastTickAt[symbol] = Date.now();
  Yahoo.ticks[symbol] = (Yahoo.ticks[symbol] || 0) + 1;

  Feed.emit();
  Session.save();
}

function yahooHandleMessage(raw) {
  let envelope;
  try {
    envelope = typeof raw === "string" ? JSON.parse(raw) : raw;
  } catch (error) {
    console.warn("Yahoo sent a non-JSON frame:", error);
    return;
  }
  if (!envelope || envelope.type !== "pricing" || typeof envelope.message !== "string") return;

  try {
    yahooUpdateQuote(yahooDecodePricing(envelope.message));
  } catch (error) {
    console.warn("Could not decode Yahoo Finance pricing message:", error);
  }
}

function yahooSendSubscriptions(tickers) {
  const socket = Yahoo.socket;
  if (!socket || socket.readyState !== WebSocket.OPEN) return false;
  const symbols = tickers || Object.keys(YAHOO_CANDIDATES).map(symbol => {
    const index = Yahoo.attempts[symbol] || 0;
    return YAHOO_CANDIDATES[symbol][index];
  });
  socket.send(JSON.stringify({ subscribe: symbols }));
  return true;
}

function yahooTryNextCandidate(symbol) {
  const candidates = YAHOO_CANDIDATES[symbol];
  const next = (Yahoo.attempts[symbol] || 0) + 1;
  if (!candidates || next >= candidates.length) return;
  Yahoo.attempts[symbol] = next;
  const ticker = candidates[next];
  Yahoo.lastTickAt[symbol] = Date.now();
  console.warn("No Yahoo ticks for " + symbol + "; trying " + ticker);
  yahooSendSubscriptions([ticker]);
}

function yahooCheckSilence() {
  const now = Date.now();
  // A socket can remain in OPEN state after the browser/network has stopped
  // delivering frames. Refreshing the page used to be the only way to recover.
  // Recycle that stale connection so the existing reconnect/backoff path runs.
  if (Yahoo.connected && Yahoo.openedAt &&
      now - (Yahoo.lastFrameAt || Yahoo.openedAt) > Yahoo.frameSilenceMs) {
    console.warn("Yahoo feed has received no frames; reconnecting stale socket.");
    if (Yahoo.socket && Yahoo.socket.readyState === WebSocket.OPEN) {
      Yahoo.socket.close(4000, "No Yahoo frames received");
    }
    return;
  }

  Object.keys(YAHOO_CANDIDATES).forEach(symbol => {
    const last = Yahoo.lastTickAt[symbol] || Yahoo.openedAt || now;
    if (!Yahoo.ticks[symbol] && now - last > Yahoo.silenceMs) yahooTryNextCandidate(symbol);
  });
}

function connectYahoo() {
  clearTimeout(Yahoo.reconnectTimer);
  clearInterval(Yahoo.heartbeatTimer);
  clearInterval(Yahoo.silenceTimer);
  if (Yahoo.socket && (Yahoo.socket.readyState === WebSocket.OPEN || Yahoo.socket.readyState === WebSocket.CONNECTING)) return;

  Yahoo.manualClose = false;
  Yahoo.attempts = {};
  Yahoo.lastTickAt = {};
  Object.keys(Yahoo.ticks).forEach(symbol => { Yahoo.ticks[symbol] = 0; });

  let socket;
  try {
    socket = new WebSocket(Yahoo.url);
    Yahoo.socket = socket;
  } catch (error) {
    console.error("Could not create Yahoo Finance WebSocket:", error);
    yahooScheduleReconnect();
    return;
  }

  socket.addEventListener("open", () => {
    if (Yahoo.socket !== socket) return;
    Yahoo.connected = true;
    Yahoo.openedAt = Date.now();
    Yahoo.lastFrameAt = Yahoo.openedAt;
    Yahoo.frameCount = 0;
    Yahoo.reconnectDelay = 5000;
    yahooSendSubscriptions();
    Yahoo.heartbeatTimer = setInterval(() => yahooSendSubscriptions(), Yahoo.subscriptionInterval);
    Yahoo.silenceTimer = setInterval(yahooCheckSilence, 3000);
    console.log("Yahoo Finance WebSocket connected:", Yahoo.url);
  });

  socket.addEventListener("message", event => {
    if (Yahoo.socket !== socket) return;
    Yahoo.lastFrameAt = Date.now();
    Yahoo.frameCount++;
    yahooHandleMessage(event.data);
  });

  socket.addEventListener("error", event => {
    // Browsers intentionally expose little detail in WebSocket error events.
    console.error("Yahoo Finance WebSocket error; inspect the Network > WS entry for the close/handshake reason.", event);
  });

  socket.addEventListener("close", event => {
    if (Yahoo.socket !== socket) return;
    Yahoo.socket = null;
    Yahoo.connected = false;
    clearInterval(Yahoo.heartbeatTimer);
    clearInterval(Yahoo.silenceTimer);
    console.warn("Yahoo Finance WebSocket closed:", event.code, event.reason || "(no reason)");
    yahooScheduleReconnect();
  });
}

function yahooScheduleReconnect() {
  if (Yahoo.manualClose || Yahoo.reconnectTimer) return;
  const delay = Yahoo.reconnectDelay;
  Yahoo.reconnectTimer = setTimeout(() => {
    Yahoo.reconnectTimer = null;
    Yahoo.reconnectDelay = Math.min(Yahoo.reconnectDelay * 2, 30000);
    connectYahoo();
  }, delay);
}

function disconnectYahoo() {
  Yahoo.manualClose = true;
  clearTimeout(Yahoo.reconnectTimer);
  clearInterval(Yahoo.heartbeatTimer);
  clearInterval(Yahoo.silenceTimer);
  Yahoo.reconnectTimer = null;
  if (Yahoo.socket) {
    const socket = Yahoo.socket;
    Yahoo.socket = null;
    socket.close();
  }
  Yahoo.connected = false;
}

// Recover after mobile browsers suspend or drop a background connection.
window.addEventListener("online", () => {
  if (!Yahoo.socket || Yahoo.socket.readyState === WebSocket.CLOSED) connectYahoo();
});
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState !== "visible") return;
  const socket = Yahoo.socket;
  if (!socket || socket.readyState === WebSocket.CLOSED) connectYahoo();
  else if (socket.readyState === WebSocket.OPEN &&
           Date.now() - (Yahoo.lastFrameAt || Yahoo.openedAt || 0) > Yahoo.frameSilenceMs) {
    socket.close(4000, "Feed stale after tab became visible");
  }
});
window.addEventListener("pagehide", disconnectYahoo);

// Start the live feed for the instruments already configured in MARKET.
connectYahoo();
/* ---------------------------------------------------------------------
   2e) SESSION  (NEW - keeps State alive when moving between html pages)
   ---------------------------------------------------------------------
   Store (above)   = localStorage   -> survives closing the browser.
   Session (here)  = sessionStorage -> lives only in THIS browser tab,
                     exactly like the original app whose data lived in
                     memory until you closed the tab.

   What is saved: the account (balance, positions, history), the watchlist,
   the chart choice, the journal, the unread badge, ticket counter, the
   History tab, and the live quotes (so prices don't jump when a new page
   loads).

   Dates: JSON cannot store Date objects, so each Date is saved as
   { "$date": milliseconds } and turned back into a real Date on load.

   Fallback: if sessionStorage is blocked, the same text is kept in
   window.name, which the browser also keeps across pages in one tab.
   --------------------------------------------------------------------- */
const Session = {
  KEY: 'kt_session',              // sessionStorage key
  NAME_PREFIX: 'KT_SESSION:',     // marker so we never read somebody else's window.name

  // --- low level: read / write the saved text ---
  read() {
    try { const raw = sessionStorage.getItem(this.KEY); if (raw !== null) return raw; } catch { /* blocked */ }
    if (typeof window.name === 'string' && window.name.startsWith(this.NAME_PREFIX)) return window.name.slice(this.NAME_PREFIX.length);
    return null;
  },
  write(text) {
    try { sessionStorage.setItem(this.KEY, text); return; } catch { /* blocked, use fallback */ }
    window.name = this.NAME_PREFIX + text;
  },

  // --- JSON with Date support ---
  encode(obj) {
    // "this[k]" is the ORIGINAL value (a Date), before JSON turned it into a string
    return JSON.stringify(obj, function (k, v) { return this[k] instanceof Date ? { $date: this[k].getTime() } : v; });
  },
  decode(text) {
    return JSON.parse(text, (k, v) => (v && typeof v === 'object' && '$date' in v) ? new Date(v.$date) : v);
  },

  // --- save: copy the important parts of State (and the quotes) into storage ---
  save() {
    try {
      this.write(this.encode({
        account: State.account, watchlist: State.watchlist, chart: State.chart, journal: State.journal,
        unread: State.unread, nextId: State.nextId, histTab: State.histTab, consent: State.consent,
        pendingToast: State.pendingToast, quotes: Q
      }));
    } catch { /* never let saving break the app */ }
  },

  // --- load: put saved values back into State and Q. Returns true if something was restored ---
  load() {
    const raw = this.read();
    if (!raw) return false;                                   // first page of a new session
    let s;
    try { s = this.decode(raw); } catch { return false; }     // damaged data: start fresh
    if (!s || typeof s !== 'object') return false;
    State.account   = s.account || null;
    State.watchlist = Array.isArray(s.watchlist) ? s.watchlist : State.watchlist;
    State.chart     = s.chart || State.chart;
    State.journal   = Array.isArray(s.journal) ? s.journal : State.journal;
    State.unread    = typeof s.unread === 'number' ? s.unread : State.unread;
    State.nextId    = s.nextId || State.nextId;
    State.histTab   = s.histTab || State.histTab;
    State.consent   = !!s.consent;
    State.pendingToast = s.pendingToast || null;
    // restore the live quotes so prices continue instead of resetting
    Object.keys(s.quotes || {}).forEach(sym => { if (Q[sym]) Object.assign(Q[sym], s.quotes[sym]); });
    return true;
  }
};

// Runs once per page load: bring back the data saved by the previous page.
// If there was nothing saved, this is a brand-new session, so write the first journal line
// (the original app wrote "Terminal started" once when it started).
if (!Session.load()) log('Terminal started');

// Safety nets: save whenever the page is being left (link click, back button, reload, tab close).
window.addEventListener('pagehide', () => Session.save());
// If the browser restores this page from its back/forward cache, our in-memory State is stale
// (another page may have changed the saved data), so reload to read the fresh copy.
window.addEventListener('pageshow', e => { if (e.persisted) location.reload(); });


/* ---------------------------------------------------------------------
   2f) TRADING MATHS (simplified for a demo: leverage 1:100, USD account)
   --------------------------------------------------------------------- */
const profitOf = p => {
  const m = MAP[p.sym], q = Q[p.sym];
  const closePx = p.side === 'buy' ? q.bid : q.ask;           // buys close at bid, sells at ask
  const diff = p.side === 'buy' ? closePx - p.price : p.price - closePx;
  const raw = diff * p.vol * m.contract;
  return m.usdBase ? raw / q.bid : raw;                       // convert to USD for USD-base pairs
};
const marginOf = p => {
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

  TOAST_MS: 2200,   // how long a toast stays visible
  // ms = how long to show it. Normally the default; only App.start() passes a shorter time
  // when it re-shows a toast that was already on screen for a while on the previous page.
  toast(msg, ms = UI.TOAST_MS) {
    const t = $('#toast'); t.textContent = msg; t.classList.add('show');
    UI._msg = msg; UI._at = Date.now() - (UI.TOAST_MS - ms);  // NEW: remember it (and when it began) so go() can carry it to the next page
    clearTimeout(UI._t); UI._t = setTimeout(() => t.classList.remove('show'), ms);
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

// The side menu. The list of entries below links to the other pages.
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
              <div class="d-name">${a ? a.name : 'Kilele Trader'}</div>
              <small class="muted">${a ? a.login + ' - ' + a.server : 'No account connected'}</small>
            </div>
          </div>
          <button class="link d-manage" data-action="go" data-to="login">Manage accounts</button>
          ${a && a.demo ? '<div class="ribbon">Demo</div>' : ''}
        </div>
        ${[
          // [page id, label, icon name, optional red badge number]
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


/* =====================================================================
   6) ACCOUNT GATING
   Some pages (Quotes, Charts, Trade, History) need a logged-in account.
   ===================================================================== */

// Shown by pages that need a logged-in account
const emptyAccount = () => `
  <div class="empty">
    <div class="circle-plus">${icon('plus', 40, 1.6)}</div>
    <p>No trading accounts to show</p>
    <button class="btn plain" data-action="go" data-to="login">Add Trading Account</button>
  </div>`;

// Wrap a page so it shows emptyAccount() until the user logs in.
// Usage in a page file:   App.start(gated(PAGE));
function gated(p) {
  return { ...p,
    render: () => State.account ? p.render() : emptyAccount(),
    mount:  r  => { if (State.account && p.mount) p.mount(r); },
    unmount: () => { if (p.unmount) p.unmount(); }
  };
}
