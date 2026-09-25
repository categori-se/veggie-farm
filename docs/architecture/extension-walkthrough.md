# Core capabilities and a worked extension

Start with [open-core boundaries](open-core-boundary.md) and [exchange contracts](extension-contracts.md). The running source examples are `src/studio.md` and `src/demo.md`; neither requires a private repository to build.

| Capability | Community offering | Extension boundary | Current example |
| --- | --- | --- | --- |
| Gardening resource | Guides, crop/reference records, tools, uncertainty/evidence | Normalized provider records with source/units/terms | Community catalog builder; unknown fields stay unknown |
| Local Studio | Multiple gardens, beds/plants, 2D/3D, local drafts, backup/interchange | `gardenPlanner(options)` composition and versioned backups | `/studio` |
| Local notebook | Profile, observations, actions, plans and soil records | `runtime-capabilities.js` selects local/account persistence | Community local mode; existing hosted mode in private deployment |
| Account-save experience | Bounded simulated save/update/history/restore/delete | Injected account client, session and storage adapters | `/demo` |
| Real cloud saves/teams | Public clients and contracts; no bundled account backend | Authenticated HTTP service with server-enforced ownership/revisions | Private hosting companion and parameterized account template |
| Media | Text alternatives and procedural shapes | Optional external media manifest | `runtimeMedia.js`; no media files or harvesters in Git |
| Expensive processing/support | Local formats and useful core remain open | Future bounded job/integration services | Proposed commercial options, not a current SDK or marketplace |

## Worked adapter: account saves without a server

The actual demo imports `createAccountSandbox` from `src/lib/demo/sandbox.js` and supplies its adapters to the real planner:

```js
const sandbox = createAccountSandbox();
const planner = gardenPlanner({
  initialState: syntheticBackup,
  storage: sandbox.storage,
  accountAdapter: {
    client: sandbox.client,
    session: sandbox.session,
    demo: true
  },
  sandbox: true
});
display(planner);
invalidation.then(() => sandbox.close());
```

This snippet shows dependency injection, not the whole secure demo page: retain the expiry timer, disabled imports/lookups, CSP and cleanup in `src/demo.md` when reusing that demonstration. The synthetic fixture is `data/demo/community-garden.json`. Its account service uses no credentials, HTTP writes or persistent storage.

A storage adapter implements synchronous `getItem(key)`, `setItem(key, value)` and `removeItem(key)`; failures must be surfaced instead of falsely reporting a saved draft. The account adapter supplies async `list`, `create`, `load`, `update`, `history` and `remove` methods with the response shapes used by `plannerAccount.js` and `plannerCloudClient.js`. `session()` reports current availability. An expired session must not retain authorization. See `tests/demoSandbox.test.mjs` for isolation, revision conflict, history, quota rollback and expiry behavior.

To connect a real service, use the public HTTP client and safe runtime configuration in `examples/README.md`. Keep tokens and authorization semantics distinct from the demo's inert session marker. Validate backups through `parsePlannerBackup`, derive ownership from a verified identity on the server, enforce conditional revisions and quotas there, and preserve local work on failures. Do not implement access control with disabled UI buttons or a payment flag.

The private service packages the exact core backup/account/shared-garden modules from a separately selected community checkout. Its output manifest records their hashes. Changes to those contracts require core tests plus private consumer tests before deployment; neither party silently imports a moving upstream branch. These are tested source-level boundaries, not a promise that every internal function or data shape is stable across releases.

## Using the owner's publication as an example

The public resource domain, Studio subdomain and optional account service demonstrate three deployment roles, not three forks of the app. The community default combines the first two roles on one origin (`/` and `/studio`). The AWS examples show their configuration seams with real deployment identifiers removed. Public-garden reconstructions remain labeled incomplete and synthetic fixtures remain synthetic. Source examples and local tests are not presented as proof that a new user's AWS stack has been deployed or security-tested.

A contributed extension should state its input/output version, tests, offline/failure behavior, credentials location, data ownership/retention and applicable licenses. GPL and upstream obligations remain relevant; placing code in a private repository or behind HTTP is not itself a license exception. Hosting, synchronization, administration, processing and support can be monetized while local editing and portable exports remain open.
