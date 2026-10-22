/* =====================================================================
   6) PAGES
   Each page is an object:
     parent  : where the back arrow goes
     nav     : true = show bottom navigation
     header(): returns what the top bar shows
     render(): returns the page HTML (a string)
     mount() : runs AFTER render, attach timers / subscriptions here
     unmount(): runs when leaving, clean up here
   ===================================================================== */
const PAGES = {};

// Shown by pages that need a logged-in account
const emptyAccount = () => `
  <div class="empty">
    <div class="circle-plus">${icon('plus', 40, 1.6)}</div>
    <p>No trading accounts to show</p>
    <button class="btn" data-action="go" data-to="login" style="text-transform:none;font-weight:500">Add Trading Account</button>
  </div>`;

// Wrap a page so it shows emptyAccount() until the user logs in
function gated(p) {
  return { ...p,
    render: () => State.account ? p.render() : emptyAccount(),
    mount:  r  => { if (State.account && p.mount) p.mount(r); },
    unmount: () => { if (p.unmount) p.unmount(); }
  };
}

