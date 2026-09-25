# Code and extension boundaries

veggie.farm is a gardening resource with an optional planning Studio. Keep the
current single application through the hackathon; split packages only when a real
consumer needs one. This document describes today's boundaries and the intended
open-source release, not a stable plugin API. Original code uses GPLv3 only;
see `LICENSE` and `NOTICE.md`.

| Area | Location | Responsibility |
| --- | --- | --- |
| Resource site | `src/content/`, `src/data/`, `src/index.md` | Guides, source records, plant discovery and seasonal tools |
| Planning core | `src/lib/garden/`, `src/lib/spatial/`, `src/lib/recommendations/` | Portable backups, local storage, geometry and evidence-based rules |
| User interface | `src/components/`, `src/styles/`, `src/studio.md` | Resource and planner controls, 2D/3D views and accessible feedback |
| Optional cloud client | `src/lib/account/` | Sign-in and explicit account saves through an HTTP API |
| Account service | `services/accounts/` | Server-enforced private ownership and shared collection grants, versioned drafts and published editions; separate dependency lockfile |
| Operations | `infrastructure/`, `scripts/` | Build, validation, import and deployment tooling |
| Local evidence | `.launch-private/`, `data/raw/`, `docs/launch/` | Operational receipts and source review; public export requires a separate allowlist |

The [community boundary](architecture/open-core-boundary.md), [extension contracts](architecture/extension-contracts.md), [media policy](architecture/media.md) and [demo sandbox](architecture/demo-sandbox.md) define the separately prepared public distribution. Service and operations directories listed above describe the mixed development workspace; they are excluded from that distribution.

## Studio model

See [Studio data and view boundaries](studio-data-model.md) for the distinction
between garden workspaces, physical parcel members, spatial collections, planting
beds and independent cameras. It also describes draft editing, reference-image
retention and compatibility constraints for bundled examples.

## Open-source core and commercial options

The intended core includes resource browsing, local planning, local save/reload,
and portable export/import. These must remain usable without a paid account.
Keep optional hosting, organization administration and future integrations behind
service boundaries. Do not add billing, a plugin loader, a marketplace, or a
monorepo framework to meet hypothetical future needs.

The existing account service demonstrates the boundary: the browser sends an
explicit personal-gardens backup (public demo edits remain browser-local); the server derives ownership from validated
identity and applies conditional revisions. It never replaces the local model
with a provider-specific representation. The account service currently imports
the core backup validator; deployment packages the validator and account-scope projection explicitly.
No published npm package or independently versioned SDK is implied.

The [hosting-failure browser check](../scripts/check-studio-account-boundary.mjs)
verifies this boundary against the frozen application: simulated save-service and
account-config failures preserve local gardens and named versions, backups remain
exportable, and a bed edit made during the outage survives reload. This is local
fault injection, not a live outage test or a claim of fully offline startup.


Future extensions should consume documented, versioned data or backup formats,
preserve source attribution and unknown values, and keep private credentials on
the server. New remote writes require an explicit user action; failure must leave
local work and export available. Define a plugin contract only after implementing
one concrete integration with compatibility tests. Hosting can be monetized
without putting license checks into local editing or portable backups. A separate
directory or HTTP boundary is not a license exception: assess each distributed
extension against GPLv3 and its dependencies before choosing its license.

## Source release

The owner selected GPLv3 (`GPL-3.0-only`) for original code. Third-party photos,
models, maps and source-derived content retain separate terms; a code license
must not be presented as covering them. Preserve original evidence privately and
export only reviewed files into a clean public candidate. See
[source preparation and attribution](source-release.md).

Run `npm run check:repository` before a baseline commit or release export. It
rejects indexed dependency trees, private working directories, generated output
and common environment files. It does not establish that the remaining files are
safe to publish. Review deployment defaults, rights, secrets and the candidate
manifest separately. Never mirror the working repository as a public release.

Optional account infrastructure inputs and artifact preparation are documented in
[the hosting guide](../infrastructure/README.md). Template validation is local;
existing deployed stacks and frozen releases retain their own reviewed bytes.
