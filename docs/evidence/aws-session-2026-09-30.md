# AWS MCP and public Studio check — September 30, 2026

In one Codex session, the existing native AWS Core MCP connection successfully ran CloudFormation `DescribeStacks`, CloudFront `ListDistributions` and `GetDistribution`. Discovery selected the distribution by its public `studio.veggie.farm` alias. All three API calls reported success; no AWS writes or invalidations occurred.

At **2026-10-01 01:40:24 UTC** (September 30, 9:40 p.m. New York), the stack was **UPDATE_COMPLETE** and the matching CloudFront distribution was **Deployed**, **enabled**. AWS reported stack `LastUpdatedTime` **2026-09-25T11:37:51.154000+00:00** and distribution `LastModifiedTime` **2026-09-24T23:46:31.823000+00:00**. These are infrastructure update timestamps, not the deployment timestamp of the current application content, which this check does not establish.

The same session requested [public Studio](https://studio.veggie.farm/) using curl: **HTTP 200**, no redirects, successful TLS verification, and the title **Garden Studio | veggie.farm**. The 43,267-byte HTML response has SHA-256 `84d96adaacbc6f496bedf4b019b87fc3459687164b6ba3aa6e6218a922f7a108`. This establishes public HTTPS reachability; JavaScript and garden editing were not exercised.

The evidence branch starts at freshly fetched public-main commit **`0c5177f9fc08823f9fa9d8ca7c0bd3123561b02b`**. The original mixed workspace has no commit; the existing dirty community checkout is at `0bdd0b832f83d17c2f48304a31d85792d5d8490e`. An isolated worktree preserves those edits. No claim ties the served HTML to either revision.

[Machine-readable record](aws-session-2026-09-30.json) includes exact installed tool versions, the successful MCP API-call ledger, sanitized observations and the HTTP body hash. Git 2.55.0, Node 24.18.0, npm 11.16.0, Python 3.14.6, curl 8.15.0 and Codex CLI 0.154.0 were observed locally. The AWS plugin package is 1.0.0; the connected MCP server does not expose its version. Two connector authentication responses and an initial sandbox DNS failure preceded successful checks; they are recorded as attempts, not successes.

Only allowlisted results are retained. Account IDs, ARNs, resource identifiers, private configuration and credentials are omitted. This record is dated September 30 in **America/New_York**; exact observation timestamps remain UTC. It does not establish a new console session, deployment, Builder publication, full browser acceptance or organizer approval.
