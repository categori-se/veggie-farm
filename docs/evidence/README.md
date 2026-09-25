# AWS and coding-agent evidence

This pack documents how veggie.farm and Garden Planning Studio were developed and verified. It combines a retained console observation with fresh AWS API and browser checks and independently accessible GitHub CI. Records and captions identify their dates and scope; screenshots are actual captures hosted separately from this media-free repository.

## Visible console proof

![Actual redacted AWS console capture from the Codex-controlled browser, September 22](https://veggie.farm/evidence/aws-console-connection.png)

This is the retained console capture, not a generated illustration. Read the dated method record below for its scope.

## Official AWS MCP connection — September 25

Codex also executed an authenticated MCP verification through **AWS's official MCP Proxy and managed AWS MCP Server**, a component of Agent Toolkit for AWS. The actual `aws___run_script` response confirms `CloudFormation.DescribeStacks` succeeded and returned `UPDATE_COMPLETE`. [Read the request, response and connection record](aws-toolkit-connection.json).

The connection used a 15-minute STS session restricted to two read actions on the application's account stack. No resources were changed. Codex launched an MCP client through its shell tool; this was not a native MCP tool loaded into this already-running conversation. The official proxy was installed; the complete Agent Toolkit plugin was not installed. [AWS documents this SigV4 connection method for Codex](https://docs.aws.amazon.com/agent-toolkit/latest/userguide/getting-started-aws-mcp-server.html).

| Claim | Evidence | What it establishes |
| --- | --- | --- |
| Codex connected to the AWS console | [September 22 method record](console-connection.json) · [redacted screenshot](https://veggie.farm/evidence/aws-console-connection.png) | An agent-controlled Chromium session inspected the account CloudFormation stack through temporary, read-only federation; it does not imply a continuously open console session |
| Coding agent used the official AWS MCP connection | [Successful MCP request and response](aws-toolkit-connection.json) | Authenticated initialize, tool listing and one successful stack read through the official proxy; distinct from the September 22 console session |
| The application uses deployed AWS infrastructure | [Fresh read-only AWS observations](aws-readonly.json) | Account stack UPDATE_COMPLETE; deployed, enabled CloudFront distribution for veggie.farm and studio.veggie.farm; recorded AWS resource types |
| Development involved implementation and verification over multiple days | [Dated development records](development-records.json) | Selected summaries of retained routing, deployment and account-recovery observations; these are not reconstructed chat transcripts |
| The published source builds and passes its checks | [GitHub verification](github-verification.json) · [actual successful CI run](https://github.com/categori-se/veggie-farm/actions/runs/36186691611) | A clean hosted runner checked the published source snapshot; GitHub attributes the initial commit to aaronkyle |
| The live Studio supports a recoverable planning task | [Fresh anonymous browser checks](hosted-browser.json) · [desktop capture](https://veggie.farm/evidence/studio-sample-desktop-20260925.png) · [mobile capture](https://veggie.farm/evidence/studio-sample-mobile-20260925.png) | A synthetic practice garden, planting-date edit, export, reload and reimport preserved the original bed/planting fields; no real account or cloud save was used |

[Architecture and agent workflow](architecture.md) explains the system. [Submission-ready wording](submission.md) provides a short description to adapt for Builder Center. [Manifest](manifest.json) records SHA-256 hashes for this pack and its separately hosted screenshots. Hashes establish byte identity, not independent endorsement.

The original console screenshot shows CREATE_COMPLETE on September 22. The new API observation shows UPDATE_COMPLETE on September 25. These are separate observations of evolving infrastructure, not conflicting versions of the same capture. The console screenshot's red warnings reflect denied broader listing and blocked ancillary requests; it has not been retouched to remove them.

## Recheck the browser journey

The [capture script](../../scripts/check-hosted-evidence.mjs) uses disposable browser contexts, a request ceiling, same-origin GET requests and synthetic browser-local data. It blocks server writes and external services. Run it with a separately installed Playwright module and Chromium, supplying `PLAYWRIGHT_MODULE`, `CHROMIUM_PATH` and an absolute `EVIDENCE_OUTPUT_DIR` outside the checkout. Keep screenshots outside Git. A later run creates new evidence; it does not change the dates or results recorded here.

To inspect source verification, open the linked GitHub run or clone its exact commit, install the locked dependencies, and run `npm run verify:community`. The approved source-only distribution documents two build-tool notice gaps; it does not redistribute those tools. This pack makes no claim of AWS organizer acceptance, human usability feedback or measured gardening outcomes.
