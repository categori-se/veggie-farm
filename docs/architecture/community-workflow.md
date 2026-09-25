# Maintaining separate public and private repositories

The canonical arrangement is two repositories: public community core (both the resource site and Studio) and private hosting implementation. User gardens, media, acquisition scripts, credentials and operational receipts belong outside both. The original mixed workspace is a migration source, never a push target.

## One-time transition

Prepare a new public candidate with `scripts/prepare-community-source.py` and a new private source candidate with `scripts/prepare-private-hosting.py`, each into a new external directory. These scripts never push, create remotes, rewrite the original history or deploy. Review their manifests before giving either a remote. The public candidate has no private service implementation. The private packager accepts an explicit `--core-source` checkout and records the included validator hashes; it does not fork the core.

After migration, edit community features in the public repository. Edit service code in the private repository. Do not repeatedly synchronize the old mixed tree over either repository, and do not copy files automatically from the private repository into the public one. Use a reviewed change to the public core when a shared contract needs improvement.

## Normal community edit/push flow

```sh
npm ci --ignore-scripts
npm run hooks:install
# create a feature branch, edit, inspect git diff and stage explicit paths
npm run verify:community
# commit and push the reviewed feature branch to your configured public remote
```

The local pre-commit hook checks the working tree and indexed/history content. The pre-push hook runs the complete verification command. Git hooks are optional local controls and can be bypassed; required GitHub checks are the enforcement layer. The Git gate checks every local commit tree and every blob, including unreachable blobs, for prohibited paths, media, binaries and sensitive patterns. It refuses non-commit refs. It does not prove that arbitrary prose contains no confidential information. Real exposed credentials require revocation in addition to cleanup.

`verify:community` runs privacy/history gates, tests, data checks, source-distribution notice checks and a build. The source-only gate permits the two explicitly documented build-tool notice gaps while excluding those tools from redistribution; runtime/browser notice completeness remains required. The broader `validate:dependency-notices` check still fails until the upstream texts are resolved. See [notice gaps](../licenses/NOTICE-GAPS.md); do not generalize the exception to other packages or redistribute a dependency bundle. Generated notice inventories are platform-specific: prepare release evidence on the documented Linux CI platform and review differences rather than blindly committing another platform's inventory.

On GitHub, configure a ruleset for `main`: require pull requests, require the `Community checks / core` job, require the branch to be current, block force pushes/deletion, and require review for `.github/`, `.githooks/`, `scripts/`, dependency locks and licensing changes. Enable available secret scanning/push protection. These settings live on GitHub; committing a workflow does not enable branch protection. Configure these protections on your own repository; the upstream repository’s settings do not transfer with a clone.

## Reviewed deployment

See [AWS deployment](../../examples/aws/DEPLOYMENT.md). `Deploy community` is manually dispatched on `main`; a preparation job verifies the source and produces an exact upload plan. A separate `community-production` environment must have required reviewers and allow only `main`. Review the plan and the commit before approving. Restrict the AWS OIDC trust to that repository and environment; use no long-lived AWS keys.

The deployer also works locally:

```sh
node scripts/deploy-community.mjs --plan --config /outside/source/deploy-config.json --output /outside/source/new-plan.json
# inspect the plan and destination, then explicitly apply when authorized:
node scripts/deploy-community.mjs --apply --config /outside/source/deploy-config.json --plan-file /outside/source/new-plan.json
```

Planning makes no AWS calls. Apply requires a committed, clean `main`, strict checks, the same destination and unchanged build bytes. It checks AWS account identity and the distribution's S3/OAC origin. Files upload to a new release prefix with SHA-256 checks; no sync deletion occurs. After uploads, the distribution origin is updated using its ETag, then invalidated. Concurrent distribution changes cause the update to fail instead of overwriting another operator's work. Old releases remain for rollback. Receipts live outside source and under private `operations/` in the bucket; the public CloudFront policy grants only `releases/`.

These are safeguards, not an atomic distributed transaction: upload failures can leave an unused prefix; an interruption after switching requires inspecting the receipt and distribution before retrying. Reusing an existing prefix/receipt is refused. CloudFront changes propagate and require acceptance checks; neither a passed build nor an update request proves the hosted site works.

## Private-hosting flow

The private companion keeps its own service lockfile, infrastructure and backend tests. Its README documents locked install, packaging against an explicit community checkout and running the synthetic backend tests in the isolated package. Pin the reviewed core commit in private release records. The private pre-push hook also queries GitHub with `gh` and refuses any destination not confirmed private; unknown visibility fails closed. Restrict administrative visibility changes separately. Private deployment has separate identities/data/IAM and is not performed by the community static-site workflow. Do not enable a generic push/deploy mirror of this repository.

The upstream community source is public. Your repository visibility, GitHub rulesets, environments, OIDC roles, AWS resources and real deployment acceptance still require operator setup and publication/deployment authorization.

For local agent setup, scoped AWS inspection and a worked verification example, see [Connect Codex to your own AWS account](codex-aws.md).
