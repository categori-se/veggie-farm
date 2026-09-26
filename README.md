# veggie.farm

A data-driven gardening resource and Garden Planning Studio for Massachusetts gardeners. Explore crop guides and seasonal tools, keep a notebook, plan beds and plants in 2D/3D, and save or exchange your garden plans.

Both the resource site (`/`) and Studio (`/studio`) are open-source applications. Local gardens and notebook records require no account. They stay in your browser until you explicitly export them; keep backups before clearing browser data. Public-garden reconstructions are incomplete examples, not surveyed plans or verified planting inventories. Recommendations retain horticultural uncertainty.

## Run locally

Use Node 24.18.0 and npm 11.16.0 (see `.nvmrc` and the lockfile). Python 3 is needed for the optional notice regression suite (`npm run test:notices`):

```sh
npm ci --ignore-scripts
npm run build:dependency-notices
npm run dev
```

Open the preview URL printed by Observable, then `/studio` for the planner. Try the [bounded account sandbox](/demo), start a practice garden or import `data/demo/community-garden.json` with Studio's backup import control. The fixture is synthetic, uses local inch coordinates and contains no address, parcel ID or geographic location.

```sh
npm test
npm run validate:data
npm run validate:plants
npm run build
```

Build output is `dist/`. The public build uses only bundled community inputs; no AWS account, private repository, database, map token or raw dataset is required. Browser libraries may be fetched during Observable builds. A browser dependency hash gate detects upstream drift; do not rewrite it blindly to silence a failure. Optional map/forecast/soil lookups require their public services. The local planner does not require those lookups.

## Where things live

| Directory | Purpose |
| --- | --- |
| `src/content`, `src/tools`, `src/plants` | Articles, seasonal/decision tools and plant discovery |
| `src/components`, `src/styles` | Shared UI and Studio rendering |
| `src/lib/garden`, `src/lib/spatial` | Garden state, persistence, geometry and interchange |
| `src/lib/environment`, `src/lib/recommendations` | Environmental observations and evidence-based rules |
| `src/lib/account` | Optional public clients and deployment-selected persistence |
| `data/demo`, `data/reference` | Independent examples and data provenance |
| `scripts`, `tests` | Build, safety checks and tests |

The community catalog uses generic crop guides and botanical references. Partner-specific descriptions and photographs are not redistributed. Unknown cultivar facts remain unknown. Curated public-garden geometry and source records retain lineage. All media files, raw GIS/imagery, credentials and user projects belong outside source control. See [data sources](data/reference/datasets.json).

[Open-core boundary](docs/architecture/open-core-boundary.md) · [extension contracts](docs/architecture/extension-contracts.md) · [contributing](CONTRIBUTING.md) · [security](SECURITY.md).

Original code is [GPL-3.0-only](LICENSE); [NOTICE](NOTICE.md) describes separate content/asset terms and outstanding review. Monetization focuses on optional managed hosting, synchronization, team administration, premium integrations and processing. There is no artificial limit on local projects or portable backups.

This is a locally prepared community release candidate. No public repository or publication approval is implied by its existence.

No media files are included in this repository. Photographs, illustrations, fonts and 3D model files belong on separately operated storage; see [optional media](docs/architecture/media.md). Core planning uses procedural shapes without them.

## Acknowledgments and licensing

See [software acknowledgments and licenses](docs/licenses/README.md) for upstream credits, complete collected dependency notices, remaining gaps and [warranty/liability terms](docs/licenses/PROJECT-RIGHTS.md). The project integrates existing software and AWS configuration; it does not claim ownership of upstream components.

## Maintain, extend and deploy

[What the core offers and how to extend it](docs/architecture/extension-walkthrough.md) · [Studio paths/subdomains/components](docs/architecture/studio-integration.md) · [Protected two-repository workflow](docs/architecture/community-workflow.md) · [AWS deployment guide](examples/aws/DEPLOYMENT.md). Install local hooks with `npm run hooks:install`; run `npm run verify:community` before pushing. Source verification checks runtime/browser notices and the bounded source-only tooling policy. No remote or AWS action is part of a normal build.

## AWS and coding-agent evidence

See [the documented build and agent usage](src/about/build-evidence.md), linked from the deployed site’s About section. The authentic redacted console screenshot is hosted separately from GitHub. See [dated hosted verification](docs/architecture/build-evidence.json). Publication of the updated Builder project and event submission must be verified separately; this repository does not certify acceptance.

Source repository: [categori-se/veggie-farm](https://github.com/categori-se/veggie-farm). This source release excludes installed dependencies, build artifacts, media and private comparison inputs. See the [source distribution notice policy](docs/licenses/NOTICE-GAPS.md#distribution-scope).

[Build evidence pack](docs/evidence/README.md): console method, dated development records, fresh AWS/browser observations, CI proof and submission-ready text. Screenshots are hosted separately.

Develop with your own agent and account: [Connect Codex to AWS](docs/architecture/codex-aws.md).

## Your deployment, your information

The images, 3D model files and deployment-specific datasets used by veggie.farm are separately managed private hosting inputs, not bundled with this repository or granted under its source-code license. A public link does not itself grant permission to copy or reuse them. Bundled community examples and individually licensed open data retain their stated terms. Self-hosters supply, license, secure and maintain their own media, data and account services; the core works with its documented community fixtures and procedural shapes.

For guided setup after creating your own static stack, run `npm run setup:deploy`. It asks for your stack outputs and creates an external private configuration directory and next-step guide. It makes no AWS calls, creates no cloud resources and never overwrites an existing directory. Start with the [AWS deployment guide](examples/aws/DEPLOYMENT.md).

See [reviewed 3D source candidates and structural-plant priorities](docs/architecture/3d-model-sources.md). No third-party models were added by this review.

[Garden GIS layers and shared 2D/3D records](docs/architecture/garden-layer-model.md) · [Studio navigation and walking](docs/architecture/studio-navigation.md).
