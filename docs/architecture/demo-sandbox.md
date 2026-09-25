# Bounded account demonstration

`/demo` uses the actual Studio editor and account-save component with an injected, in-memory service. It demonstrates save, update, stale-revision protection, restore, history and deletion without signup. It is explicitly labeled simulated; it does not prove hosted authentication or server authorization.

The service has no network client, credentials, identity provider, localStorage or remote persistence. Planner draft storage is injected separately and never reads existing personal gardens. Sharing/public collection clients are not constructed in the demo. No other visitor can read or change this instance. Reloading resets it; closing the page drops its memory.

Limits: 15-minute lifetime, 512 KiB combined serialized draft/account state, 3 copies, 4 versions per copy, 60 account operations and 250 ms minimum between operations. Quota failures preserve existing records. Expiry clears in-memory records and disables the view. Imports and remote lookups are unavailable in the demo. Its page CSP restricts connections to the same origin and prohibits frames, objects and form submission. Never enter personal data in the demo.

These client limits bound the supplied demonstration; visitors control their own browsers and can restart or alter client code. That does not grant any backend privileges, because there are no demo credentials or writable demo server endpoints. Static asset traffic still needs ordinary host-level rate limits if publicly deployed. No CDN/WAF or cloud configuration has been deployed by this work.

If a genuinely authenticated hosted trial is added later, use a separate origin, identity pool, storage and IAM roles; create per-visitor sessions with server-enforced TTL, request quotas, payload limits, tenant isolation and automatic deletion. Deny mail, invitations, public publishing, external processing and cross-tenant access. Do not turn this simulated demo into a shared production account. That implementation requires separate authorization and hosted security acceptance.
