---
title: How veggie.farm was built
---

# How veggie.farm was built

veggie.farm brings plant information, seasonal guidance and an editable garden plan together for Massachusetts gardeners. The contribution is the integration: shared data, practical configuration and recoverable planning workflows built on existing open-source software. Codex assisted development; it is not an in-product gardening adviser.

## Try the application

Start with [gardening questions and tools](/tools), then [open Studio](/studio), start a sample garden, edit a bed or plant, save, reload, and export a backup. Local plans belong to this browser and device; keep an export before clearing browser storage. Parcel context and plant spacing are estimates, not surveyed boundaries or promises of yield.

The separately prepared community edition includes both the resource site and Studio. Its bounded account demonstration simulates account behavior in memory; it does not establish a real authenticated cloud session. The hosted publication keeps media and operating configuration separate from this source edition.

## Built on AWS with Codex

Amazon S3 stores the static application and CloudFront delivers it. Optional personal account saves use Cognito for sign-in, API Gateway for JWT authorization, Lambda for ownership and backup validation, and encrypted, versioned private S3 storage. CloudFormation describes the account infrastructure. Browsers receive no direct S3 write credentials.

Codex helped inspect the existing application, implement recovery and account controls, adapt a small authentication component from the owner's OpenGeo project, run focused browser checks, and prepare deployment manifests and rollback records. Recorded examples include restoring the extensionless Studio route, protecting plans against conflicting account updates, and correcting the mobile toolbar. These are development and test observations, not invented user feedback.

On September 22, 2026, the agent controlled Chromium connected to the actual AWS Management Console through a 15-minute federated session restricted to reading this project's CloudFormation stack. The stack showed `CREATE_COMPLETE`. Broader listing was denied and ancillary traffic was blocked, explaining the visible console warnings. This was a bounded console session, not a persistent MCP integration.

[View the actual redacted console screenshot](https://veggie.farm/evidence/aws-console-connection.png). Account identifiers, stack ARN and session name were masked during capture. The preserved screenshot SHA-256 is `fd6adbc179d7d43b0b25708e7ae06a08c4d9d5e3c7f0f5d70c7969061d7fa159`. The image is hosted separately from the source repository. It documents an observation; AWS decides whether this method meets the event requirement.

![Actual redacted AWS console capture from the Codex-controlled browser, September 22](https://veggie.farm/evidence/aws-console-connection.png)

### Official AWS MCP connection

On September 25, Codex also connected through AWS's official MCP Proxy to the managed AWS MCP Server, a component of Agent Toolkit for AWS. A successful `aws___run_script` call executed `CloudFormation.DescribeStacks` and returned `UPDATE_COMPLETE`. Authentication used a 15-minute STS session restricted to reading this application's stack; no resources were changed. Codex launched a Python MCP client through its shell tool. This documents an actual MCP interaction, not native MCP tool availability in the existing conversation or installation of the complete Toolkit plugin.

[Inspect the actual request and result](https://github.com/categori-se/veggie-farm/blob/main/docs/evidence/aws-toolkit-connection.json), or browse the [public evidence pack](https://github.com/categori-se/veggie-farm/tree/main/docs/evidence) for dated development records, live browser checks, screenshots, architecture and GitHub CI. The connection follows [AWS's documented SigV4 method](https://docs.aws.amazon.com/agent-toolkit/latest/userguide/getting-started-aws-mcp-server.html).

## Implementation and evidence

| Claim | What supports it | Limits |
| --- | --- | --- |
| AWS hosting | Retained September 22–24 deployment and hosted acceptance records describe S3 and CloudFront delivery | These dated observations do not guarantee current availability; check the live journey before submission |
| Optional personal cloud saves | Recorded hosted checks cover Cognito sign-in, API Gateway/Lambda ownership checks and versioned private S3 storage | Cloud services and private operating configuration are separate from the community source; local planning needs no account |
| Coding-agent console connection | The retained September 22 method record describes agent-controlled Chromium using a 15-minute federated session restricted to reading the project’s CloudFormation stack, with an actual redacted screenshot | The screenshot must be attached and verified in the Builder project; acceptance of the method is AWS’s decision |
| Recoverable planning | Recorded browser acceptance covers sample editing, saving, reloading and backup interchange | A test observation is not a gardener testimonial or a guarantee against all data loss |
| Community impact | The public application offers a concrete gardening workflow without requiring a home address for the sample | No measured adoption, yield improvement or consented pilot results are claimed |

Development combined owner direction, agent-assisted implementation, automated checks and browser acceptance. Existing software retains its own rights. Media is distributed separately and is not part of the public source repository. Harvesting implementations and private operational records are excluded.

## Zero to Shipped status

As of September 25, 2026, the owner reports **registered, not submitted**. An earlier local record describes a published Builder project; that alone does not establish a completed entry in this event. Neither this page nor a GitHub release certifies eligibility or official inclusion.

The intended category is **Daily Life Enhancement**, with the **Community** track. The [official event rules](https://builder.aws.com/build/hackathons/e83e84e5-4f4c-383b-bbe9-4a15ac195d55/zero-to-shipped?tab=rules) require a published Builder project, an accessible live AWS application and documented coding-agent console connection, along with eligibility and originality requirements. Current rules were checked September 25. The deadline is October 2, 2026, at 11:59 p.m. Pacific.

Before submission, attach the authentic redacted console proof, verify event association and required tags, review development/publication chronology against the originality requirement, and test the live site anonymously. Keep it available for evaluation. AWS determines whether an entry qualifies; this page makes no claim of acceptance or endorsement.

<style>
#observablehq-main table { display: block; max-width: 100%; overflow-x: auto; }
#observablehq-main code { overflow-wrap: anywhere; white-space: normal; }
</style>
