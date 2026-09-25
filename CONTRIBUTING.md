# Contributing

Use the Node/npm versions in README and install with `npm ci`. Keep both the resource site and Studio useful without private services. Preserve Massachusetts scope, source attribution, unknown data and compatible backups.

Run `npm test` and the relevant validators. For a release candidate, run `npm run validate:data`, `npm run validate:plants`, `npm run build` and `npm run check:public`. Test the sample → edit → save → reload → export/reimport journey in a browser, along with resource browsing and notebook records. Browser scripts use Playwright/Chromium installed separately; `PLAYWRIGHT_MODULE` and `CHROMIUM_PATH` select an existing installation. Use loopback origins and synthetic data.

The public build validates shipped media derivatives. Private source-original provenance checks belong with the external acquisition archive; no contributor needs those originals to run the core. Do not fetch restricted sources just to make a test pass.

Observable browser imports resolve separately from the npm lock. `browser-dependencies.json` records reviewed bytes; inspect changed modules and their notices before explicitly updating the manifest. A passing hash gate is not license clearance.

Use `data/demo` for fixtures. Never add a real home address, private plan, token, raw provider dump or partner extraction implementation. Changes to persistence must cover failed writes, reload and backups. Changes to providers must preserve units, provenance and missing values.

Original code contributions use GPL-3.0-only. Retain third-party notices; confirm asset redistribution rights before adding assets. See the architecture documents before adding a hosted extension. This project does not require assignment of copyright or presume dual-licensing rights.
