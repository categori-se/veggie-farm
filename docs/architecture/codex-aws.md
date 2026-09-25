# Continue developing with Codex and your own AWS account

Both the resource site and Studio run locally without AWS credentials. Start there; connect an agent to AWS when you need to inspect your deployment. Your AWS account, credentials, private hosting configuration and media stay outside the public core repository. The [deployment guide](../../examples/aws/DEPLOYMENT.md) explains the templates and optional hosted services; [extension contracts](extension-contracts.md) explain where your own integrations fit.

## Start with a local change

Use the Node/npm versions in `.nvmrc` and `package.json`, install Codex following its official setup instructions, then:

```sh
npm ci --ignore-scripts
npm run hooks:install
npm run dev
```

Open a feature branch and ask for one specific change. A useful starting prompt is:

> Read the repository documentation and inspect the existing implementation. Improve [one behavior] in both the resource site and Studio where relevant. Preserve the browser-local sample → edit → save → reload → export/reimport journey. Keep media, credentials, real gardens and private hosting files outside this repository. Implement the change, run the relevant checks and explain the observed result. Do not deploy.

Before pushing, inspect the diff, stage explicit files and run `npm run verify:community`. Use a pull request and required CI checks. [The two-repository workflow](community-workflow.md) describes the public/private boundary and reviewed deployment flow.

## Connect the official AWS MCP component

AWS supports Codex through its managed MCP Server and official MCP Proxy. This is a component of Agent Toolkit for AWS; installing this connection alone does not install the complete Toolkit plugin. The steps below follow [AWS's SigV4 setup](https://docs.aws.amazon.com/agent-toolkit/latest/userguide/getting-started-aws-mcp-server.html) and [Codex MCP configuration](https://developers.openai.com/learn/docs-mcp). Commands were checked against Codex CLI 0.154.0 and proxy 1.7.0 on September 25, 2026; consult those sources when upgrading.

1. Install AWS CLI v2 and `uv` using their official installation instructions. The AWS MCP guide requires CLI 2.32.0 or newer. Keep this tooling separate from the application's dependencies.
2. Have your AWS administrator provide a development role with only the read operations you need. Prefer short-lived IAM Identity Center/SSO credentials. Creating an SSO profile selects an existing permission set; it does not restrict an administrator role automatically.
3. Configure a **new named profile** for your own account, verify the account and role privately, then register the proxy. Substitute your actual profile and region consistently:

```sh
aws configure sso --profile veggie-dev-readonly
aws sso login --profile veggie-dev-readonly
aws sts get-caller-identity --profile veggie-dev-readonly
codex mcp add aws-veggie \
  --env AWS_MCP_PROXY_PROFILES=veggie-dev-readonly \
  -- uvx mcp-proxy-for-aws-cli@1.7.0 \
  https://aws-mcp.us-east-1.api.aws/mcp \
  --region us-east-1 --disable-telemetry \
  --metadata AWS_REGION=us-east-1
codex mcp list
```

Do not publish the identity output. Use your account, never the veggie.farm operator's account or resource identifiers. The proxy profile setting is intentional: it prevents an unrelated default profile from selecting another account. No secret values belong in `codex mcp add --env`, Git, prompts, screenshots or a repository `.env` file.

Restart Codex or start a fresh session so it can load the newly configured server. A server appearing in `codex mcp list` proves configuration only. Verify a successful authenticated tool call next. A local IDE and CLI can have different configuration homes; register the server in the Codex installation you actually use.

For documentation-only access, add `--read-only` to the proxy arguments. This filters tools using their read-only annotations. In proxy 1.7.0 the general `aws___run_script` tool is write-capable and is hidden by that filter, even if the script you intend to run only reads. To inspect a stack through that tool, enforce the read boundary in IAM/session permissions, as in the next section. A prompt saying “read only” is not a permission boundary.

AWS also documents OAuth and a complete `aws-core` Toolkit plugin. Those are alternatives, not additional steps required for this connection. See [Toolkit quick start](https://docs.aws.amazon.com/agent-toolkit/latest/userguide/quick-start.html). Review plugin permissions before installing; avoid configuring duplicate AWS MCP servers.

## Restrict and verify a stack read

An administrator can adapt this policy to an existing development role or a temporary session. Replace every placeholder. It grants inspection of one stack only, not general account listing, resource creation, deployment or private garden reads:

```json
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Action": ["cloudformation:DescribeStacks", "cloudformation:ListStackResources"],
    "Resource": "arn:aws:cloudformation:YOUR_REGION:YOUR_ACCOUNT_ID:stack/YOUR_STACK_NAME/*"
  }]
}
```

Attaching this policy to a role with broader permissions does **not** remove those permissions. Use a dedicated role with no broader grants, or a restrictive STS session policy intersected with the source role's permissions. Organization policies and explicit denies still apply. AWS documents [temporary credentials and IAM behavior](https://docs.aws.amazon.com/agent-toolkit/latest/userguide/security_iam_service-with-iam.html).

Ask Codex:

> Use the AWS MCP connection to inspect only CloudFormation stack YOUR_STACK_NAME in YOUR_REGION. Call DescribeStacks once. Return stack status and creation time, omit account identifiers, ARNs, outputs and parameters. Do not change resources or expand permissions. Confirm the returned api_calls entry succeeded; report a denial or error honestly.

The server's `aws___run_script` tool currently accepts code shaped like this (use your own stack/region):

```python
response = await call_boto3(
    service_name="cloudformation",
    operation_name="DescribeStacks",
    region_name="YOUR_REGION",
    params={"StackName": "YOUR_STACK_NAME"},
)
result = {"stacks": [
    {"status": s["StackStatus"], "createdAt": str(s["CreationTime"])}
    for s in response["Stacks"]
]}
result
```

Use the tool's current schema. This helper takes AWS API operation names (`DescribeStacks`), not the boto3 method spelling (`describe_stacks`). Inspect the returned `status` **and** `api_calls`: a successful MCP transport response can still contain a failed AWS operation.

Our [actual September 25 connection record](../evidence/aws-toolkit-connection.json) is a worked example: Codex launched a Python MCP client through its shell, authenticated through the official proxy with a 15-minute restricted STS session, and verified `UPDATE_COMPLETE`. It is not a claim that native AWS MCP tools were loaded into that already-running conversation. The [earlier console screenshot](../evidence/README.md) records a separate browser session.

## Keep development and deployment separate

Use your AWS connection to understand the deployment, then implement and test source changes locally. Keep separate deployment credentials and an explicit reviewed upload plan. The [community deployment workflow](../../examples/aws/DEPLOYMENT.md) uses GitHub OIDC and an approval environment; do not give a public pull request access to AWS credentials. Optional private account services belong in your private hosting repository.

For evidence, retain the date, exact source commit, tool/version, submitted read operation, sanitized result and CI link. Keep raw operational receipts private. Real screenshots can be hosted separately and linked; do not generate or reconstruct screenshots as proof of an agent interaction.

If authentication expires, refresh your named SSO profile and restart the connection. If an operation is denied, verify the account, region and exact stack scope before requesting an additional permission. Do not resolve a read failure by granting AdministratorAccess. Remove this local connection when no longer needed:

```sh
codex mcp remove aws-veggie
```

Removing the configuration does not revoke AWS sessions; use your organization's session-revocation process if credentials were exposed.
