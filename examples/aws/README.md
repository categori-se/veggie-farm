# AWS configuration references

Start with the [step-by-step deployment guide](DEPLOYMENT.md). The community static site needs no private backend.

`static-site.yaml` and `github-deploy-role.yaml` are new community hosting references. The account and Studio-router files are parameterized copies of the project's account stack and Studio routing configuration, shared as part of the integration work under GPL-3.0-only to the extent the contributors hold the relevant rights. They are not AWS-authored software or exports of a live account. Upstream software keeps its own license. See [acknowledgments](../../docs/licenses/README.md) and [warranty/liability](../../docs/licenses/PROJECT-RIGHTS.md).

- `accounts.yaml`: SAM/CloudFormation configuration for Cognito, HTTP API Gateway, Lambda, CloudWatch Logs and versioned private S3 storage. Supply your own origins, user pool and artifact bucket/key. The Lambda handler is in the separately maintained hosted implementation and is **not included in the community repository**. This template alone does not provide account services or change the local community build.
- `studio-router.js`: CloudFront viewer-request URI routing. Replace the reserved example hostname with your own; no deployment identifier or credential is included.

The static-site and GitHub role templates cover a baseline S3/CloudFront release path. Custom DNS/certificates, monitoring, budgets, abuse protection and retention still need operator configuration. They are not a one-command deployment or a certification of security or production readiness. AWS service usage is governed separately by AWS agreements and charges; software licensing does not provide an AWS account or service entitlement. No resources are provisioned by reading, building or testing this repository.

For custom Cognito domains, add the explicit `customHostedUi` hostname/region/pool binding described in [configuration](../README.md) to deployed browser configuration. The template output is only a starting point. Never commit filled deployment parameters, authentication tokens, data, account IDs, stack outputs or private endpoints. Actual media, account records, harvesting code and operational receipts remain outside this repository.
