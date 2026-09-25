# Supporting text for AWS Builder Center

Throughout development of this release, I worked with Codex to inspect and implement veggie.farm and Garden Planning Studio, test browser behavior and recovery, and prepare and verify AWS deployments. Retained dated records cover routing fixes, account-storage deployment, synthetic account ownership/recovery tests and release verification. These are technical development records, not user testimonials.

On September 22, 2026, Codex controlled Chromium connected to the AWS Management Console through a temporary 15-minute federated session restricted to reading the project's CloudFormation stack. The attached redacted screenshot shows CREATE_COMPLETE. A fresh September 25 read-only AWS API check separately observed UPDATE_COMPLETE and an enabled, deployed CloudFront distribution for the application domains.

On September 25, Codex additionally connected through AWS's official MCP Proxy to the managed AWS MCP Server, part of Agent Toolkit for AWS. Using a 15-minute STS session restricted to reading the application stack, Codex launched an MCP client and invoked `aws___run_script`. The returned API-call record confirms `CloudFormation.DescribeStacks` succeeded and reported `UPDATE_COMPLETE`. The public evidence pack includes the submitted code, returned result, timestamp, proxy version and permission scope. This supplements the earlier console screenshot; it does not claim native MCP tools were present in the existing Codex conversation.

The app uses S3 and CloudFront for delivery, with Cognito, API Gateway, Lambda and private versioned S3 storage for optional account saves. Fresh anonymous browser checks used a synthetic practice garden to verify editing, export, reload and reimport without cloud writes. The published community source has a successful GitHub CI run, with author and committer attribution to aaronkyle.

- Evidence index: https://github.com/categori-se/veggie-farm/tree/main/docs/evidence
- Original console proof: https://veggie.farm/evidence/aws-console-connection.png
- Live implementation explanation: https://veggie.farm/about/build-evidence
- Independent GitHub CI record: https://github.com/categori-se/veggie-farm/actions/runs/36186691611

Suggested additional screenshot captions:

- **Desktop Studio, September 25:** Fresh anonymous browser using a synthetic practice garden. The associated check verified a planting-date edit, export, reload and reimport. This is browser-local recovery, not cloud-account acceptance.
- **Mobile Studio, September 25:** The same bounded synthetic workflow at a 390-pixel viewport. This is browser emulation, not a report from a physical-device user study.

Attach the original console screenshot as console proof. Use the other records as supporting evidence; do not label them as additional historical console sessions.
