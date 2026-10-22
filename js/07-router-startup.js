/* =====================================================================
   9) SHELL + ROUTER
   ===================================================================== */
let current = PAGES.quotes;   // the page being shown right now

function buildShell() {
  $('#app').innerHTML = `
    <header id="hdr"></header>
    <main id="main"></main>
    <nav id="nav"></nav>
    <div id="drawer"></div>
    <div id="overlay"></div>
    <div id="toast" role="status"></div>`;
}

// Top bar: built from the page's header() description
function renderHeader(page) {
  const h = page.header();
  $('#hdr').innerHTML = `
    <button class="hbtn" data-action="${h.left === 'back' ? 'back' : 'openDrawer'}" aria-label="${h.left === 'back' ? 'Back' : 'Menu'}">${icon(h.left === 'back' ? 'back' : 'menu')}</button>
    <div class="title ${h.sub ? 'two' : ''}">${h.sub ? `<small>${h.title}</small><span>${h.sub}</span>` : h.title}</div>
    <div class="actions">${(h.actions || []).map(a => a.text
      ? `<button class="hbtn txt" data-action="${a.action}">${a.text}</button>`
      : `<button class="hbtn" data-action="${a.action}" ${a.msg ? `data-msg="${a.msg}"` : ''} aria-label="${a.label || ''}">${icon(a.icon)}</button>`).join('')}</div>`;
}

// Bottom navigation (hidden on sub-pages like Settings)
function renderNav() {
  const nav = $('#nav');
  nav.style.display = current.nav ? 'flex' : 'none';
  const a = State.account;
  nav.innerHTML = [
    ['quotes', 'Quotes', 'quotes'], ['charts', 'Charts', 'charts'],
    ['trade', a ? `<span class="pill">${compact(a.balance)}</span>` : 'Trade', 'trade'],
    ['history', 'History', 'history'], ['messages', 'Messages', 'messages']
  ].map(([id, label, ic]) => `
    <button class="nav-item ${current.id === id ? 'active' : ''}" data-action="go" data-to="${id}">${icon(ic, 26, 1.8)}<span>${label}</span></button>`).join('');
}

// Show the page that matches the URL hash. Called on load, on hash change, and whenever a page needs a full refresh.
function renderRoute() {
  const id = location.hash.replace('#/', '') || 'quotes';
  const page = PAGES[id] || PAGES.quotes;
  if (current && current.unmount) current.unmount();   // let the old page clean up
  current = page;
  renderHeader(page);
  const main = $('#main');
  main.innerHTML = page.render();                      // 1) draw the HTML
  if (page.mount) page.mount(main);                    // 2) then start timers / subscriptions
  renderNav();
}
window.addEventListener('hashchange', renderRoute);

// go('settings') -> changes the hash (which triggers renderRoute)
function go(id) {
  const h = '#/' + id;
  if (location.hash === h) renderRoute(); else location.hash = h;
}

/* =====================================================================
   10) FIRST RUN CONSENT DIALOG
   ===================================================================== */
function maybeWelcome() {
  if (Store.get('consent', false)) return;
  UI.modal(`
    <h3>Welcome to Kilele Trader!</h3>
    <p>To operate and provide services through the application, we ask for your consent to collect certain data, such as app performance information and device identifiers, as described in the Privacy Policy. <b>(EDIT with your real legal text)</b></p>
    <p><b>By pressing ACCEPT you agree to the Terms and the Privacy Policy.</b></p>
    <div class="btns"><button class="btn" data-action="accept">Accept</button><button class="btn out" data-action="decline">Decline</button></div>
    <p class="muted" style="font-size:14px">Demo accounts use simulated money. To trade real money you need a separate agreement with a financial services company.</p>`, false);
}

/* =====================================================================
   11) START THE APP
   ===================================================================== */
buildShell();
renderRoute();
maybeWelcome();
