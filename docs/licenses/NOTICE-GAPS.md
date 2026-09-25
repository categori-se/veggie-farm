# Notice evidence still requiring attention

Reviewed September 25, 2026. The versioned JSON inventories, not this prose, are the authoritative package lists.

## Community build tools

Four missing installed-native-package notices were recovered: `@esbuild/linux-x64` 0.27.7 and 0.28.1, and `@rollup/rollup-linux-x64-gnu` / `-musl` 4.62.2. Exact-version npm metadata identifies upstream commits; their complete license files, including Rollup's bundled third-party notices, are archived and checked by hash.

Two full upstream-text gaps remain:

| Package | Evidence found | Missing evidence / action |
| --- | --- | --- |
| `eastasianwidth@0.2.0` | Installed package and exact npm metadata declare MIT and identify Masaki Komagata; exact repository commit `b89f04d44dc786885615e94cd6e2ba1ef7866fa4` inspected | No full license file in that package or commit. Obtain authoritative applicable copyright/license text or assess a dependency replacement in a separate change. |
| `is-reference@1.2.1` | Package identifies Rich Harris and MIT; README says MIT; exact commit `9d2719fbcc2059567203063f1e7b65d7831bfd64` inspected | No full license file at that version. A later version's text is not silently substituted. Obtain version-applicable evidence or assess replacement. |

Do not interpret these gaps as a finding that the packages have no license. They mean the project's full-text notice collection is incomplete. The strict completeness command fails until resolved; routine source/build checks must not relabel it as passed. No maintainers were contacted and no dependency upgrades were made by this notice work.

## Excluded hosted implementation

The mixed workspace's account-service lock also lacks collected full text for `@aws-sdk/credential-provider-http@3.972.73`, `@aws-sdk/credential-provider-login@3.972.78` and `@aws-sdk/nested-clients@3.997.45`. Exact npm metadata declares Apache-2.0 but does not supply a `gitHead` or provenance attestation linking these releases to an upstream commit. Their installed packages have no standalone license/notice file. Do not fabricate that link or treat generic Apache text as proof of all applicable upstream NOTICE obligations.

These packages and the hosted implementation are not distributed in the community source and do not block its runtime-notice completeness. Resolve their package-specific evidence before distributing that service or its packaged artifact. Acknowledging AWS services or including parameterized configuration does not distribute the AWS SDK.

## Coverage limits

Absent optional platform binaries are enumerated separately; repeat inventory collection on the platform actually distributed. All 42 recorded browser files have exact-version/package or reviewed-bundle notice evidence. That bounded result does not establish coverage of future dynamic imports, manually added extensions or separate deployments. Original article/data rights and adaptation provenance remain distinct from npm notice coverage.

## Distribution scope

The Git source release distributes project sources and lockfile metadata, not installed build tools. `validate:source-notices` permits only the two exact tooling records above; new gaps, runtime use, application imports, or tracked dependency/artifact directories fail. Runtime and browser notice completeness remains required. `validate:dependency-notices` still fails for full tooling redistribution until the missing texts are obtained. See [npm’s lockfile documentation](https://docs.npmjs.com/cli/v11/configuring-npm/package-lock-json/) for the distinction between a dependency manifest and committed installed packages. This is a scoped release policy, not a claim that the two missing texts have been recovered.
