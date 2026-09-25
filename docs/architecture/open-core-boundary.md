# Open core and sustainable services

No media files or harvesting implementations belong in the public repository. Optional media is supplied separately at runtime; agreement records remain private.

Both the veggie.farm gardening resource and the entire Studio interface belong in the community product. The code remains GPL-3.0-only. Community users can browse guides and plants, use seasonal tools, keep a notebook, create multiple gardens, edit beds and plantings, use 2D/3D, save locally and export/reimport their work without an account or subscription. There is no project-count paywall.

## Models considered

- [Ghost](https://ghost.org/about/) funds its free core through managed hosting. This is the closest starting point: sell reliable operation, backups and convenience while keeping the product useful when self-hosted.
- [OpenProject](https://www.openproject.org/community-edition/) offers a free self-hosted community edition and enterprise services/add-ons. Its distinction supports optional organization administration and support after there is real demand.
- [PostHog's repository license](https://github.com/PostHog/posthog/blob/master/LICENSE) separates its MIT code from an explicitly licensed enterprise directory. It illustrates the importance of visible license boundaries, but we prefer a separate private services repository rather than putting restricted source into this public tree.

Sources consulted September 25, 2026. This is a business-model comparison, not a recommendation to copy another project's licensing or pricing.

## Product boundary

| Community, kept open | Potential paid service | Interface and data ownership |
| --- | --- | --- |
| Resource site, articles, plant discovery, local evidence/rules | Maintained premium data feeds or specialist integrations | Normalized records retain source/terms; independent community inputs remain available |
| Studio, unlimited local gardens, beds, plants, 2D/3D | Managed encrypted backup and cross-device synchronization | Versioned backup API; users retain portable exports |
| Browser-local notebook and observations | Hosted notebook recovery and synchronization | Storage capability selected at deployment, not scattered premium checks |
| JSON backups, GeoJSON/KML interchange, schema validators | Scheduled bulk processing and specialist enterprise delivery | Public formats; never charge merely to retrieve one's own data |
| Public API clients and account/grant contracts | Team workspaces, organization administration, managed sharing and audit retention | Remote service derives authorization; no secrets in browser builds |
| Local geometry and publicly accessible contextual sources | Large imagery/terrain processing, managed tile services | Bounded job API and normalized results; no automatic private upload |
| Community contribution and self-hosting | Hosting, migration, support, training, reliability commitments | Operational implementation and credentials outside the community source |

These are monetization options, not current paid plans or implemented billing. Start with hosting/sync and support; validate demand before building enterprise features. Do not sell confidence in uncertain horticultural predictions or artificially withhold basic security, accessibility, backups or local storage.

## Structural boundary

The public candidate contains `src/` for both applications, public domain libraries and optional service clients. It contains no `services/`, `infrastructure/`, private vendor implementation or partner harvester. The existing hosted service remains intact in the private working source; its separation is performed by explicit source selection, not by deleting it from the running application.

For future development, treat the clean community repository as the canonical core. Put hosted implementations, deployment tooling, billing and private integrations in a sibling private repository. Do not fork Studio or copy its domain logic there; import an explicitly versioned core package when a real consumer warrants packaging, or validate the documented exchange formats over HTTP. Keep user data in neither repository.

The current account service imports core validators and an independently sourced workspace grant evaluator. Its public redistribution/extension licensing is not resolved by directory separation. Existing GPL declarations are preserved. Consult the [GNU guidance on separate programs and combinations](https://www.gnu.org/licenses/gpl-faq.html#GPLInProprietarySystem) when deciding whether a distributed extension is a separate work; a private repository or HTTP connection is not by itself a licensing determination. No source-available restrictions are added to community code and no dual-licensing rights are presumed.

## Implemented seams

- `src/data/runtime-capabilities.js`: deployment-selected notebook persistence (`local` or `account`), independent of payments. Community output selects local storage. Hosting can select account storage without changing notebook domain records.
- `src/lib/account/`: optional HTTP clients, same-origin configuration, PKCE authentication, explicit backup transfer. Custom Cognito domains are bound explicitly to a configured region/pool; no owner-specific host is privileged.
- `src/lib/garden/plannerBackup.js`: public, versioned planner validation; same domain data in local and hosted flows.
- `scripts/build-community-data.mjs`: independent crop/reference catalog; private provider archives are not build inputs.
- `scripts/lib/private-data.mjs`: CLI-only external data-root resolution, with path traversal and escaping symlink checks. `scripts/import-private-garden.mjs` validates and stores a backup there without bundling it.

No plugin marketplace, license server, new cloud service or billing dependency is introduced. Shared core security and contract improvements remain public.

See the [worked extension walkthrough](extension-walkthrough.md), [Studio integration](studio-integration.md), and [two-repository workflow](community-workflow.md) for concrete examples and operator steps.
