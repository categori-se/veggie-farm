# Deploying the community site on AWS

The baseline is a single static build at one domain: gardening resource `/`, Studio `/studio`, bounded demo `/demo`. No Cognito, Lambda, account database, media bucket or private repository is required. See [Studio integration](../../docs/architecture/studio-integration.md) before choosing a second hostname.

## Files and responsibilities

| File | Purpose | What the operator supplies |
| --- | --- | --- |
| `static-site.yaml` | Private S3 bucket, CloudFront OAC/distribution, clean HTML route function, cache policy | Stack name/region; optional custom-domain changes after initial setup |
| `github-deploy-role.yaml` | Narrow OIDC role for reviewed static releases | Existing GitHub OIDC provider, exact repository, site bucket and distribution |
| `accounts.yaml` | Reference for the separate optional hosted account service | Service artifact, user pool, exact origins; excluded backend and its own review |
| `studio-router.js` | Optional second-hostname routing example | Your Studio hostname; compose with the static clean-path function |
| `scripts/deploy-community.mjs` | Offline release plan and explicit apply | External destination JSON; AWS CLI v2 credentials only when applying |

The static and OIDC templates are newly prepared community references; the account/router examples derive from the owner's hosting configuration. They are not a full export of the live AWS account. Local validation is recorded, but no stack has been deployed or accepted by this preparation task.

## Build and review locally

Use Node/npm from `.nvmrc`/`package.json`, Python 3 for notice tests, AWS CLI v2 for deployment, and optionally `cfn-lint` for templates. From the community repository:

```sh
npm ci --ignore-scripts
npm run build:dependency-notices
npm test
npm run test:notices
npm run validate:data
npm run validate:plants
npm run build
npm run verify:community
```

The source-only verification gate accounts for two documented build-tool notice gaps while excluding those tools from redistribution; it still requires complete runtime/browser notices. The broader `validate:dependency-notices` check remains incomplete. See [the precise scope](../../docs/licenses/NOTICE-GAPS.md); do not bundle build tools or bypass the release checks. Serve `dist/` with a local server for acceptance; a basic server may require `/studio.html` rather than `/studio` unless it implements the documented rewrites.

## Establish static hosting

When you have explicitly authorized AWS provisioning, use CloudFormation to review/create `static-site.yaml` in your chosen region. Use a short stack name (under 50 characters). CloudFormation generates the bucket name; do not insert one from the owner's deployment. The outputs are `BucketName`, `DistributionId`, `OriginId` and `SiteUrl`. The distribution initially points at `releases/unpublished`, so it does not serve an unintended build before the first reviewed upload. No account ID or credential is a template default.

For example, these are operator-run provisioning commands, **not part of build or tests**:

```sh
aws cloudformation deploy --template-file examples/aws/static-site.yaml --stack-name community-site --region YOUR_REGION
aws cloudformation describe-stacks --stack-name community-site --region YOUR_REGION --query 'Stacks[0].Outputs'
```

Keep outputs in an external private deployment directory. The bucket blocks public access; CloudFront reads only `releases/*` through OAC. Use its regular S3 origin, not an S3 website endpoint. The release tool uploads checksummed objects to a new prefix, switches that configured origin with an ETag, waits for propagation and invalidates cached paths. It never deletes the bucket contents. Versions/old prefixes accrue storage costs until the operator deliberately applies a retention policy.

The release tool changes CloudFront OriginPath directly, so it creates intentional CloudFormation drift. Before later stack updates, set the `ActiveReleasePrefix` parameter to the currently serving prefix recorded in the latest receipt; review the change set. Reapplying `releases/unpublished` or a stale prefix could take the site back to an empty/old release.

Create an external `deploy-config.json` (not inside either repository):

```json
{"accountId":"123456789012","bucket":"your-generated-site-bucket","distributionId":"E123EXAMPLE12","originId":"community-site","region":"us-east-1"}
```

These are nonfunctional placeholders. Configure your AWS identity using the AWS CLI's supported mechanisms; never put credentials into this JSON. Planning needs no AWS credentials and makes no AWS calls. Apply checks that the current identity's account and the distribution's origin match the explicit destination.

```sh
node scripts/deploy-community.mjs --plan --config /outside/source/deploy-config.json --output /outside/source/reviewed-plan.json
# Only after approval of that commit, destination and plan:
node scripts/deploy-community.mjs --apply --config /outside/source/deploy-config.json --plan-file /outside/source/reviewed-plan.json
```

Apply requires clean committed `main` and all strict checks. Editing source or output after planning invalidates the release. A partially uploaded release is not silently reused; inspect the receipt and prepare a new plan. Private receipts are retained beside the plan and in the bucket's `operations/` prefix, which the CloudFront bucket policy does not expose.

## GitHub-managed deployment

Create the GitHub OIDC identity provider in the AWS account if one is not already present, then review/provision `github-deploy-role.yaml` with that provider ARN, the exact `owner/repository`, and the static stack outputs. IAM creation requires your explicit provisioning permission and `CAPABILITY_IAM`. The role can upload only release/receipt objects and update only the chosen distribution; it cannot delete S3 data or administer the account service.

Set repository variables `AWS_ACCOUNT_ID`, `AWS_REGION`, `COMMUNITY_BUCKET`, `COMMUNITY_DISTRIBUTION_ID`, and `COMMUNITY_ORIGIN_ID`. These destination identifiers are not secrets, but keep actual deployment configuration out of Git. Create environment `community-production`, restrict it to `main`, enable required reviewers (and prevent self-review where available), and put `COMMUNITY_DEPLOY_ROLE_ARN` in that environment's secrets. The OIDC trust's environment subject must match exactly. Do not rely on that subject alone to enforce a branch: the GitHub environment's branch restriction is necessary.

Enable the branch protections described in [community workflow](../../docs/architecture/community-workflow.md). Then manually dispatch `Deploy community` for the reviewed main commit. Its unprivileged preparation job produces an upload plan artifact before the environment approval. The deploy job rebuilds/verifies the same source and checks it against that plan before the actual upload. No deployment runs on an ordinary pull request or push. No long-lived AWS access key is stored in GitHub.

## Routes, domains and optional accounts

The route function maps `/studio` and `/studio/` to `/studio.html`, root to `/index.html`, directory index pages to their own `index.html`, and leaves real file extensions alone. Query strings remain available to the browser. If adding an index-page directory, update the route function's directory list and run the route tests. Do not use an SPA fallback that returns the homepage for every missing file; Framework emits distinct HTML pages and missing JavaScript must remain an error.

First test the CloudFront-generated hostname. For a custom domain, obtain an ACM viewer certificate in `us-east-1`, add CloudFront aliases/certificate configuration, and point DNS to the distribution. Those optional DNS/certificate resources are not automatically created by the baseline. A real Studio subdomain additionally needs the host rewrite and deliberate origin-specific navigation/auth setup. A redirect to the main site's `/studio` avoids splitting local browser storage.

Only enable the account reference after separately preparing its backend, IAM, identity pool/client configuration and server acceptance. The community static deployer never deploys it. Optional media stays in separate storage with applicable permissions; it is not uploaded by this release workflow.

## Hosted acceptance and rollback

After a deployment, check `/`, `/studio`, `/demo`, a deep guide and the notebook on desktop/mobile. Check module requests/content types, local save/reload/export/reimport, missing-media fallback, demo reset and expiry. Verify the S3 origin denies unauthenticated reads and that `/operations/` is not public. A local test or AWS update response is not hosted acceptance.

For rollback, use the private receipt's `previousOriginPath`. Fetch the current CloudFront configuration and ETag, change only the matching origin's path back to that retained release, apply with the current ETag, wait and invalidate. Do not replay an old whole-distribution configuration over newer settings. Keep previous release objects until rollback acceptance. Stack deletion retains the bucket; lifecycle/cleanup is an explicit operations task.

The baseline does not provision WAF, budgets, access-log retention, monitoring, alarms, domain registration or backups of user-owned browser data. Configure appropriate host-level abuse limits before advertising the demo widely. The demo's client quotas do not rate-limit static asset traffic.

Official references: [S3 origin access control](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/private-content-restricting-access-to-s3.html), [CloudFront URL rewrites](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/example_cloudfront_functions_url_rewrite_single_page_apps_section.html), [CloudFront certificates](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/cnames-and-https-requirements.html), [AWS credentials action and OIDC](https://github.com/aws-actions/configure-aws-credentials).

For development-time agent access, see [Connect Codex to your own AWS account](../../docs/architecture/codex-aws.md). Keep that read role separate from deployment credentials.
