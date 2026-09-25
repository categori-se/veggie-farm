# Extension contracts

These are the existing versioned boundaries, not a promise of an independently versioned SDK.

## Garden backups

Use `parsePlannerBackup` from `src/lib/garden/plannerBackup.js`. The explicit format is `veggie.farm/planner`, version 1; legacy unversioned backups are accepted. Preserve IDs, named layouts, provenance, unknown fields supported by the schema and garden/bed relationships. Reject oversized or invalid data before changing local work. Never upload a reference/demo implicitly.

## Optional hosting

`/auth-config.json` configures a public Cognito client; `/account-config.json` supplies `{ "version": 1, "apiBaseUrl": "https://api.example.org" }`. These files are deployment output, not committed defaults. No client secret is permitted. The service must verify JWT issuer/audience/expiry and derive the owner from the validated identity, never the request's claimed owner.

`plannerCloudClient.js` defines plans and notebook requests. Creates use POST; updates use PUT with a revision; stale writes return HTTP 409. Deletes use an explicit revision. Client or server errors must retain local work and exports. `collectionClient.js` describes optional workspaces, grants, drafts and public editions. Public visibility requires explicit publication, never a save side effect. A commercial service must preserve these semantics rather than add authorization checks solely to the UI.

## Notebook storage

`runtime-capabilities.js` selects `local` or `account`. Local mode needs no identity and never calls the hosting API. Account mode retains owner-isolated drafts and conditional writes. Changing modes does not silently transfer data; use explicit notebook export/import. Local records and Studio backups are separate formats. Clearing browser data destroys unexported local work.

## Data providers

Provider-specific extraction remains outside the core. Extensions can supply normalized catalog records following `data/reference/datasets.json`, or environmental observations with source URL, timestamp, units, geographic scope and uncertainty. Do not represent a vendor cultivar as a generic crop or copy privately licensed photographs into the public catalog. No provider credential may appear in a URL, asset, browser config or source archive in the public repository.

## Private local projects

Set `VEGGIE_FARM_DATA_DIR` to an existing absolute path outside the source directory. Run `node scripts/import-private-garden.mjs backup.json project-name` to validate and store a new project backup. Existing files are never replaced. The browser loads the chosen file through Studio's import control; it cannot automatically read that directory. No directory is mounted into the static web server. The import command stores files with owner-only permissions where supported.

See the [worked extension walkthrough](extension-walkthrough.md), [Studio integration](studio-integration.md), and [two-repository workflow](community-workflow.md) for concrete examples and operator steps.
