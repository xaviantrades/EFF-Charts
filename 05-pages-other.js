/* ---------------------------------------------------------------------
   6.5  MESSAGES (empty state + register / sign in)
   --------------------------------------------------------------------- */
PAGES.messages = {
  parent: 'quotes', nav: true,
  header: () => ({ left: 'menu', title: 'Messages', actions: [{ icon: 'info', action: 'toast', msg: 'Search: coming soon', label: 'Search' }] }),
  render: () => `
    <div style="display:flex;flex-direction:column;height:100%">
      <div class="empty" style="flex:1">
        <div style="color:#3c4046">${icon('chat', 130, 1.2)}</div>
        <p class="muted" style="font-size:16px">No messages</p>
      </div>
      <div style="display:flex;gap:10px;padding:12px 14px">
        <button class="btn" style="flex:1" data-action="go" data-to="login">Register</button>
        <button class="btn sec" style="flex:0 0 36%" data-action="go" data-to="login">Sign in</button>
      </div>
    </div>`
};

/* ---------------------------------------------------------------------
   6.6  LOGIN  (open demo account or log in)
   --------------------------------------------------------------------- */
PAGES.login = {
  parent: 'quotes', nav: false,
  header: () => ({ left: 'back', title: 'Kilele Capital' }),   // EDIT: firm name
  render: () => `
    <button class="opt" data-action="demoDialog">
      <div class="opt-ic">${icon('grad', 28)}</div>
      <div style="flex:1"><h4>Open a demo account</h4><p>To learn trading and to test your strategies</p></div>
      <span class="muted">${icon('chevron')}</span>
    </button>
    <button class="opt off">
      <div class="opt-ic" style="background:#2a4a7a">${icon('trade', 28)}</div>
      <div style="flex:1"><h4>Open a real account</h4><p>For live trading, additional identification is required</p></div>
      <span class="muted">${icon('chevron')}</span>
    </button>
    <p style="text-align:center;font-weight:700;padding:16px;border-bottom:1px solid var(--line);font-family:var(--cond);font-size:19px">Login to an existing account</p>
    <label class="field">Type <select id="l-type"><option>Trade account</option><option>Investor (read only)</option></select></label>
    <label class="field">Login <input id="l-login" inputmode="numeric" autocomplete="username" placeholder=""></label>
    <label class="field">Password <input id="l-pass" type="password" autocomplete="current-password"></label>
    <label class="field">Server <select id="l-server"><option>Kilele-Demo</option><option>Kilele-Live</option></select></label>
    <label class="field">Save password <input type="checkbox" checked></label>
    <button class="link" data-action="toast" data-msg="Password reset: coming soon">Forgot password?</button>
    <div style="padding:0 18px 30px"><button class="btn block" data-action="doLogin">Login</button></div>`
};

/* ---------------------------------------------------------------------
   6.7  SETTINGS  (theme switch lives here)
   --------------------------------------------------------------------- */
PAGES.settings = {
  parent: 'quotes', nav: false,
  header: () => ({ left: 'back', title: 'Settings' }),
  render() {
    const S = State.settings;
    const sw = (key, on) => `<button class="switch ${on ? 'on' : ''}" role="switch" aria-checked="${on}" data-action="toggleSetting" data-key="${key}"></button>`;
    return `
      <div class="section">Appearance</div>
      <div class="row"><div>Theme<small>Choose light, dark, or follow your device</small></div>
        <div class="seg">${['dark', 'light', 'system'].map(m => `<button class="${S.theme === m ? 'on' : ''}" data-action="setTheme" data-mode="${m}">${m[0].toUpperCase() + m.slice(1)}</button>`).join('')}</div>
      </div>

      <div class="section">Quotes</div>
      <div class="row"><div>Show high / low</div>${sw('showHL', S.showHL)}</div>
      <div class="row"><div>Show spread</div>${sw('showSpread', S.showSpread)}</div>

      <div class="section">Account</div>
      ${State.account
        ? `<button class="row" data-action="logout"><span class="dn">Log out of ${State.account.login}</span></button>`
        : `<button class="row" data-action="go" data-to="login"><span>Add trading account</span>${icon('chevron')}</button>`}

      <div class="section">More</div>
      <button class="row" data-action="go" data-to="journal"><span>Journal</span>${icon('chevron')}</button>
      <button class="row" data-action="go" data-to="about"><span>About</span>${icon('chevron')}</button>`;
  }
};

/* ---------------------------------------------------------------------
   6.8  NEWS, JOURNAL, ABOUT and simple placeholder pages
   --------------------------------------------------------------------- */
PAGES.news = {
  parent: 'quotes', nav: false,
  header: () => ({ left: 'back', title: 'News' }),
  // EDIT: sample headlines. Replace with a real news API later.
  render: () => [
    ['Dollar steadies as traders wait for central bank signals', 'Sample · 12 min ago'],
    ['Gold holds near recent range ahead of inflation data', 'Sample · 1 hr ago'],
    ['Pound edges higher after upbeat services survey', 'Sample · 3 hrs ago'],
    ['Yen weakens as yields climb', 'Sample · 5 hrs ago'],
    ['Weekly outlook: what moves markets next', 'Sample · Yesterday']
  ].map(([h, t]) => `<div class="news"><div>${h}</div><small>${t}</small></div>`).join('')
};

PAGES.journal = {
  parent: 'settings', nav: false,
  header: () => ({ left: 'back', title: 'Journal' }),
  render: () => State.journal.map(j => `<div class="log"><small>${stamp(j.t)}</small>${j.msg}</div>`).join('')
};

PAGES.about = {
  parent: 'settings', nav: false,
  header: () => ({ left: 'back', title: 'About' }),
  render: () => `
    <div class="empty" style="min-height:auto;padding-top:50px">
      <div class="logo" style="width:84px;height:84px">${icon('mountain', 52)}</div>
      <h2 style="font-family:var(--cond);color:var(--text)">Kilele Trader</h2>
      <p class="muted">Version 1.0 (demo)</p>
      <p class="muted" style="font-size:14px;max-width:320px">Trading involves risk. Demo accounts use simulated money and simulated prices.</p>
      <p class="muted" style="font-size:14px">Charts by <a href="https://www.tradingview.com/" target="_blank" rel="noopener" style="color:var(--accent)">TradingView</a></p>
    </div>`
};

// A reusable "coming soon" page
const stub = (title, text) => ({
  parent: 'quotes', nav: false,
  header: () => ({ left: 'back', title }),
  render: () => `<div class="empty"><p>${text}</p></div>`
});
PAGES.calendar   = stub('Economic calendar', 'Economic calendar goes here. EDIT me.');
PAGES.community  = stub('Traders Community', 'Community feed goes here. EDIT me.');
PAGES.challenges = stub('My Challenges', 'Show the trader’s challenge progress here (targets, drawdown, days). EDIT me.');
PAGES.help       = stub('User guide', 'Help articles go here. EDIT me.');

Object.entries(PAGES).forEach(([id, p]) => p.id = id); // give each page its own id

