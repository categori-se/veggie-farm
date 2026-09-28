# Continued agent-assisted AWS deployment — September 28, 2026

This update records the completed publication of the [visual guide](https://veggie.farm/guide): seven real interface screenshots, each in light and dark mode, with desktop and mobile verification. Making the interface understandable before installation supports the project's aim of inviting everyday gardeners to explore. It is an accessibility and discoverability improvement; its effect on adoption or gardening outcomes has not been measured.

## Three distinct forms of agent evidence

| Date | Connection and work | Direct evidence |
| --- | --- | --- |
| September 22 | Codex-controlled Chromium inspected the AWS console using temporary read-only federation | [Console method](console-connection.json) and [authentic redacted capture](https://veggie.farm/evidence/aws-console-connection.png) |
| September 25 | A shell-launched MCP client authenticated through the official AWS MCP Proxy and read the application's stack | [MCP request, response and method](aws-toolkit-connection.json) |
| September 28 | Codex authored and executed Python AWS SDK deployment scripts, then checked the published guide | [Dated deployment record](deployment-update-2026-09-28.json), [screenshot hashes and checks](guide-themes.json), and the procedure below |

The September 28 work used the AWS SDK through the agent's shell. It does not establish another console session, a native conversation MCP integration or a continuously connected agent. The original console and MCP records retain their own dates and scope.

## From an approved change to verified delivery

1. The owner authorized publication of the prepared themed screenshots and live guide. Codex captured the real application in fresh anonymous browser contexts with synthetic garden data, inspected the results, and corrected framing. Media bytes remain outside Git.
2. Agent-authored Python scripts checked AWS identity through STS and used conditional S3 writes. Fourteen new screenshot objects used `IfNoneMatch='*'`; the two guide routes used `IfMatch` against their previous ETags. Candidate manifests and rollback copies were retained.
3. The guide figures and captions were updated while retaining existing runtime and stylesheet references. A build exposed an existing 3D section-anchor mismatch; a second narrow update corrected both HTML routes. This totals 18 S3 writes to 16 distinct objects, with no deletions or infrastructure changes.
4. CloudFront invalidation completed. Anonymous HTTP checks matched all 14 screenshot hashes and both final HTML hashes. The screenshots total 709,962 bytes; the two final HTML objects total 40,576 bytes.
5. Hosted Chromium checks passed at 1280px and 390px in light and dark themes. Each case decoded seven images, selected the expected theme and had no horizontal overflow or page errors. Final checks also resolved the guide's in-page links.

## Source checks and publication state

The prepared public-source branch passed local community verification: 443 application tests, seven notice tests, data validation, source/Git distribution checks and the build. The final anchor-corrected build also passed. Five existing unrelated link warnings and two documented tooling-only notice gaps remain. These are local results; the [earlier GitHub CI record](github-verification.json) belongs to its dated source snapshot.

The live guide and screenshots were published. The corresponding source branch and this documentation update are prepared locally; GitHub push and PR publication still require explicit owner authorization. Builder project publication, event submission and organizer acceptance must be checked separately.

## Evidence boundaries

The [machine-readable update](deployment-update-2026-09-28.json) records the final page hashes, hosted checks, and SHA-256 references to retained deployment scripts, manifests and receipts. Public connection records and screenshot evidence are linked and hashed separately. Private records retain operational identifiers and rollback details; the public summary excludes account identifiers, credentials, local paths and private user data. Their hashes identify bytes, not independent verification or a full agent transcript.

This is a retrospective summary of retained observations, not a new deployment or a reconstructed conversation. The original [evidence manifest](manifest.json) remains a historical snapshot; it is not a current checksum list for this updated index and subsequent additions.

## Subsequent publication — September 28, 2026

The source and documentation described above were subsequently pushed and merged to main in [PR #16](https://github.com/categori-se/veggie-farm/pull/16) at 08:26:31 UTC, merge commit `5a5b4c793c6e36624e5423c993c2f7122f483f3f`. [CI for that exact main commit](https://github.com/categori-se/veggie-farm/actions/runs/36397381023) then passed. The preceding publication-state paragraph and JSON record retain the earlier observation; this addendum records the later event without rewriting those historical bytes.
