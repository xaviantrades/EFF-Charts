KILELE TRADER — ORGANIZED STATIC PROJECT

Files:
- index.htm: app shell, original CSS, external Lightweight Charts library, and ordered JS imports.
- js/01-core.js: helpers, icons, state, simulated price feed, theme and shared UI helpers.
- js/02-pages-base.js: shared page registry and account-gating helpers.
- js/03-pages-market.js: Quotes and Charts pages.
- js/04-pages-trading.js: Trade and History pages.
- js/05-pages-other.js: remaining page definitions.
- js/06-actions.js: order ticket and app actions.
- js/07-router-startup.js: shell, router, consent dialog and startup.

Run:
Open index.htm in a browser. The chart library and Google Fonts are loaded from online CDNs,
so those features need an internet connection.

No intended app behavior or UI logic was changed; the original inline JavaScript was
separated into ordered files by functional section.
