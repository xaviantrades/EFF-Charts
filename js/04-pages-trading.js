/* ---------------------------------------------------------------------
   6.3  TRADE  (balance, equity, open positions)
   --------------------------------------------------------------------- */
PAGES.trade = gated((() => {
  let off = null;
  function paint() {
    const a = State.account, t = totals();
    const set = (id, v) => { const el = $('#' + id); if (el) el.textContent = v; };
    set('t-bal', money(a.balance)); set('t-eq', money(t.equity));
    set('t-mar', money(t.margin));  set('t-free', money(t.free));
    a.positions.forEach(p => {
      const q = Q[p.sym], pr = profitOf(p), el = $('#pp-' + p.id);
      set('pc-' + p.id, (p.side === 'buy' ? q.bid : q.ask).toFixed(MAP[p.sym].digits));
      if (el) { el.textContent = money(pr); el.className = 'pos-r ' + (pr < 0 ? 'dn' : 'up'); }
    });
  }
  return {
    parent: 'quotes', nav: true,
    header: () => ({ left: 'menu', title: 'Trade', actions: [
      { icon: 'quotes', action: 'toast', msg: 'Sorting: by time', label: 'Sort' },
      { icon: 'filePlus', action: 'newOrder', label: 'New order' }
    ]}),
    render: () => `
      <div class="summary">
        <div class="dr"><b>Balance:</b><i></i><span id="t-bal"></span></div>
        <div class="dr"><b>Equity:</b><i></i><span id="t-eq"></span></div>
        <div class="dr"><b>Margin:</b><i></i><span id="t-mar"></span></div>
        <div class="dr"><b>Free margin:</b><i></i><span id="t-free"></span></div>
      </div>
      ${State.account.positions.map(p => `
        <div class="pos" data-action="positionMenu" data-id="${p.id}">
          <div>
            <b>${p.sym}, <span class="${p.side === 'buy' ? 'up' : 'dn'}">${p.side} ${p.vol.toFixed(2)}</span></b>
            <div class="sub">${p.price.toFixed(MAP[p.sym].digits)} → <span id="pc-${p.id}"></span></div>
          </div>
          <div class="pos-r" id="pp-${p.id}"></div>
        </div>`).join('')}
      ${State.account.positions.length ? '' : '<p class="muted" style="text-align:center;padding:40px 20px">No open positions.<br>Tap the + page icon to place an order.</p>'}`,
    mount() { paint(); off = Feed.on(paint); },
    unmount() { if (off) off(); off = null; }
  };
})());

/* ---------------------------------------------------------------------
   6.4  HISTORY  (closed positions, orders, deals)
   --------------------------------------------------------------------- */
PAGES.history = gated((() => {
  let tab = 'positions';

  function list() {
    const a = State.account;
    if (tab === 'positions') return a.closed.map(p => `
      <div class="deal"><div><b>${p.sym}, ${p.side} ${p.vol.toFixed(2)}</b>
        <div class="muted" style="font-family:var(--cond)">${p.price.toFixed(MAP[p.sym].digits)} → ${p.closePrice.toFixed(MAP[p.sym].digits)}</div></div>
        <div class="r"><div>${stamp(p.closeTime)}</div><div class="${p.profit < 0 ? 'dn' : 'up'}">${money(p.profit)}</div></div></div>`).join('');
    if (tab === 'orders') return a.orders.map(o => `
      <div class="deal"><div><b>${o.sym}, ${o.side} ${o.vol.toFixed(2)}</b><div class="muted" style="font-family:var(--cond)">Filled at ${o.price.toFixed(MAP[o.sym].digits)}</div></div>
        <div class="r"><div>${stamp(o.time)}</div><div>#${o.id}</div></div></div>`).join('');
    return a.deals.map(d => d.type === 'balance'
      ? `<div class="deal"><b>Balance</b><div class="r"><div>${stamp(d.time)}</div><div class="up">${money(d.amount)}</div></div></div>`
      : `<div class="deal"><div><b>${d.sym}, ${d.side} ${d.dir}</b><div class="muted" style="font-family:var(--cond)">${d.vol.toFixed(2)} at ${d.price.toFixed(MAP[d.sym].digits)}</div></div>
         <div class="r"><div>${stamp(d.time)}</div><div class="${d.profit < 0 ? 'dn' : d.profit > 0 ? 'up' : ''}">${money(d.profit)}</div></div></div>`).join('');
  }

  return {
    parent: 'quotes', nav: true,
    header: () => ({ left: 'menu', title: 'History', sub: 'All symbols', actions: [
      { icon: 'refresh', action: 'toast', msg: 'History updated', label: 'Refresh' },
      { icon: 'quotes', action: 'toast', msg: 'Sorting: by time', label: 'Sort' },
      { icon: 'calendar', action: 'toast', msg: 'Period: all time', label: 'Period' }
    ]}),
    render() {
      const a = State.account;
      const profit = a.closed.reduce((s, p) => s + p.profit, 0);
      const deposit = a.deals.filter(d => d.type === 'balance').reduce((s, d) => s + d.amount, 0);
      return `
        <div class="tabs">${['positions', 'orders', 'deals'].map(t => `<button class="tab ${t === tab ? 'on' : ''}" data-action="histTab" data-tab="${t}">${t}</button>`).join('')}</div>
        <div class="summary" style="border-bottom:1px solid var(--line)">
          <div class="dr"><b>Profit:</b><i></i><span class="${profit < 0 ? 'dn' : 'up'}">${money(profit)}</span></div>
          <div class="dr"><b>Deposit</b><i></i><span>${money(deposit)}</span></div>
          <div class="dr"><b>Swap:</b><i></i><span>0.00</span></div>
          <div class="dr"><b>Commission:</b><i></i><span>0.00</span></div>
          <div class="dr"><b>Balance:</b><i></i><span>${money(a.balance)}</span></div>
        </div>
        <div id="hist-list">${list()}</div>`;
    },
    setTab(t) { tab = t; renderRoute(); }   // re-render the page with the new tab
  };
})());

