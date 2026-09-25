# Software acknowledgments and licenses

veggie.farm is an integration of existing software with project-specific gardening behavior and configuration. Credit belongs to the authors and maintainers of each upstream component. Project contributors claim only the rights they hold in their contributions, not ownership of the underlying ecosystem.

## Principal foundations

| Component | Role | License / evidence |
| --- | --- | --- |
| Observable Framework 1.13.4 | Markdown/JavaScript site build and browser integration | ISC; build-tool inventory and browser map below |
| Observable Runtime 6.0.0, Inspector 5.0.1, Inputs 0.12.0 | Reactive execution, display and controls | ISC; exact package versions and verbatim texts in build-tool notices |
| D3 7.9.0 and its component packages | Data visualization, scales, selection and geometry | ISC; runtime notices preserve each component's copyright and terms |
| Three.js 0.184.0 | Studio procedural 3D rendering | MIT; runtime notices |
| HTL 1.0.0 | Safe HTML template construction in browser code | ISC; [archived package license](browser/htl-1.0.0/LICENSE) and browser package inventory |
| Rollup 4.62.2 | Bundling, including native build helpers | MIT and included third-party notices; exact-commit supplemental text in build-tool notices |
| esbuild 0.27.7 and 0.28.1 | Build transformations, directly and through tooling | MIT; exact-commit supplemental text for installed native packages |
| Other npm dependencies | Parsing, Markdown, syntax highlighting, utilities and transitive functionality | Individual terms and copyright notices in the inventories below; this table is not the complete dependency list |
| Node.js and npm | Development/install runtime | External tools, not vendored in this source repository; their own distributions contain their licenses |
| AWS SDK for JavaScript v3 | Optional hosted service's S3/Cognito integrations | Apache-2.0 declarations; hosted inventory in the mixed development workspace, excluded from the community runtime inventory |
| Amazon Web Services | Optional managed hosting and data services | Service agreements, not the project's open-source license; [AWS configuration references](../../examples/aws/README.md) |
| Owner's OpenGeo authentication work | Adapted browser authentication helpers | Adaptation comments retained in `src/lib/account/`; no blanket license claim over the separate OpenGeo repository or its dependencies |

Acknowledgment does not imply sponsorship, endorsement or affiliation. Names identify dependencies and services; no trademark license is granted.

## Verbatim notices and provenance

- [Runtime dependency notices](runtime-npm-notices.md) and [machine-readable inventory](runtime-npm-notices.json): installed, locked runtime packages. The community profile includes only the root lock; the mixed workspace also inventories its optional account service.
- [Build-tool notices](build-tool-npm-notices.md) and [inventory](build-tool-npm-notices.json): installed build tooling, including libraries that also contribute to browser bundles. Optional platform packages absent from the installation are listed separately and are not claimed covered.
- [Browser notice map](browser-notice-map.md) and [exact-version/hash map](browser-notice-map.json): 42 emitted browser files mapped to version-matched notice evidence, including reviewed generated bundles. Lazy dependencies not emitted by this build are outside that count.
- [Supplemental upstream registry](npm-upstream-notices.json): exact npm metadata, locked archive integrity, upstream commit URLs and SHA-256 for additional license texts. These are upstream text, not licenses invented by this project.
- [Embedded notice excerpts](npm-notice-excerpts.json): reviewed byte ranges from exact installed README files. A license identifier or a link alone is not treated as a full notice.
- [Outstanding gaps](NOTICE-GAPS.md): remaining evidence limitations and release consequences.

License text is preserved unchanged and deduplicated by digest. MIT/ISC and other upstream obligations still apply where their code is redistributed; the project's GPL declaration does not replace them. Media and datasets have separate terms and are not covered by these software notices. All media files and harvesting implementations are excluded from the community source.

## Refresh and verify

In the community repository, after the locked `npm ci --ignore-scripts` installation:

```sh
npm run build:dependency-notices
npm run check:dependency-notices
npm run validate:dependency-notices
```

Generation is offline. Review changed package identities, integrity values, license declarations, verbatim texts and gaps before accepting regenerated files. `check` verifies freshness and complete browser-file mapping. `validate` additionally refuses missing collected runtime/build-tool texts; it intentionally fails while the documented two build-tool gaps remain. Do not copy a newer package’s license to make it pass. For a source-only Git release, `npm run validate:source-notices` checks complete runtime/browser notices and permits only the two exact recorded MIT build-tool gaps, with development-only lock entries, no bundled dependency/artifact paths, and no application imports of those tools. The complete-tooling validator remains required before distributing a development container, dependency archive or build-tool bundle.

The mixed development workspace retains separate runtime/build-tool npm commands. Its runtime inventory includes the excluded hosted service and therefore has additional AWS notice gaps. Never present that service as a community build prerequisite. Run `node scripts/build-browser-notice-map.mjs --check --require-complete` to check browser mapping there.

Notice evidence is not an audit of vulnerabilities, a compatibility ruling or proof of every redistribution right. See [project rights and warranty](PROJECT-RIGHTS.md) for the project's scope and disclaimer.
