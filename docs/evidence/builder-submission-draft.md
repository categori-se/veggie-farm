# Builder Center replacement draft — September 29, 2026

Prepared replacement text for owner review. Publishing this file does not update the Builder project or submit it to the competition. The personal account and development-feedback description reflect the owner’s statements.

## Project fields

- Title: veggie.farm — a garden to return to
- Category / track: Daily Life Enhancement / Community (both visible on the published project)
- Demo: https://studio.veggie.farm/
- Resource site: https://veggie.farm/
- Repository: https://github.com/categori-se/veggie-farm
- Visual walkthrough: https://veggie.farm/guide
- Build evidence: https://veggie.farm/about/build-evidence

Short description:

> Less guesswork, more gardening. Explore source-linked plant data, plan your garden and learn over time with an open-source app built on AWS.

## Body to paste

### A garden to return to

I love gardening, but over the years I have relied on more trial and error than I would like. When I look online for help, I often find myself working through pages crowded with ads, trying to distinguish general advice from information backed by data and research. I want to spend more time understanding my garden and less time sorting through search results.

I built veggie.farm to give me more immediate access to useful, source-linked plant information and a place to apply it to my own garden. The main site brings together plant data, gardening resources and seasonal tools. Garden Planning Studio lets me explore an arrangement in 2D and 3D, keep planting records and observations, and track what happens over time so I can learn from one season to the next.

**[Try Studio](https://studio.veggie.farm/) · [Explore veggie.farm](https://veggie.farm/) · [Visual walkthrough](https://veggie.farm/guide) · [Source](https://github.com/categori-se/veggie-farm)**

### Try a small garden

**Primary demo:** [studio.veggie.farm](https://studio.veggie.farm/) · **No login:** Start with a 4 × 8 bed · **Fallback and access evidence:** [judging access](https://github.com/categori-se/veggie-farm/blob/main/docs/evidence/judging-access.md).

1. Open Studio, open the **•••** garden menu beside **Save**, and choose **Start with a 4 × 8 bed**. No account or home address is required.
2. Choose plants, inspect their spacing and arrange them in the bed.
3. Compare the same garden in 2D and 3D, then explore the date preview.
4. Save, reload and download a JSON backup. Restore it in a separate empty browser profile.

The visual guide follows this journey in light and dark themes. The 3D view requires WebGL; 2D remains available without it. Keep a backup before clearing browser storage.

### What makes it different: one garden record, many views

To bring those pieces together, I built on existing open-source technologies and developed a plant and garden data model inspired by open standards. Plant identities, source references, spatial records and portable data give the different parts of the app a common foundation.

**One garden record, many views:** plant research, layout, 3D visualization, seasonal timing and observations connect to the same editable garden.

A tomato's plant record supplies dimensions, spacing and visual form. Placing it adds a bed, position and rotation. Its identity connects the 2D footprint, procedural 3D representation, date preview, map context and saved plan. The gardener can change the arrangement and return to it across views and sessions.

The [procedural plant library](https://github.com/categori-se/veggie-farm/tree/main/src/lib/plants) includes [50 reusable plant profiles](https://github.com/categori-se/veggie-farm/blob/main/docs/architecture/common-plant-shapes.md) with plant-specific dimensions and colors across seven shared shape families. Deterministic geometry keeps the core usable without external models. Optional size scenarios interpolate between gardener-specified dates and sizes; a planting date alone does not predict growth. These are schematic planning forms, not biological growth simulations.

Evidence keeps its context: 165 normalized horticultural entries from seven reviewed Extension snapshots, MassGIS geographic information, opt-in NWS forecasts and NOAA-based sunlight scenarios. Sourced guidance, modeled conditions and gardeners' observations remain distinguishable, so the assumptions behind a decision can be inspected. Sun position and mapped obstructions support questions such as “What might shade this bed at this time?” Estimated tree heights and simplified opaque crowns limit the answer; modeled shade is not measured garden light.

### From concept to a shipped AWS application

veggie.farm is one of several project concepts I have carried in my head for years. I had registered the domain and imagined what it might become, but it had never turned into a real application. Discovering AWS Zero to Shipped on September 21, 2026 gave me the catalyst to build it.

I brought the product direction and experience with data, mapping and visualization. Codex helped implement, test, debug and verify the application on AWS; I reviewed results and authorized publication. S3 and CloudFront deliver the public app. Optional account services use Cognito, API Gateway, Lambda and private versioned S3 storage.

The latest guide release shows that process in practice: a build exposed an in-page navigation error, we corrected it, and hosted checks verified the delivered pages and themed screenshots on desktop and mobile. The [evidence pack](https://github.com/categori-se/veggie-farm/tree/main/docs/evidence) documents the September 22 agent-controlled AWS console connection, September 25 official AWS MCP interaction and September 28 SDK deployment. The [authentic redacted console screenshot](https://veggie.farm/evidence/aws-console-connection.png) provides direct connection proof; each record preserves its method and scope. A [fresh September 30 record](aws-session-2026-09-30.md) links an official AWS MCP read-only inspection to a successful public Studio HTTPS request in the same agent session, with exact source revision and tool versions.

### Built to survive beyond the demo

Recovery is part of the product. Stable garden identities, validated JSON backups and browser checks exercise editing, export, reload and reimport. Source validation, explicit unknown values and privacy checks support plans that can be inspected and kept.

The September 28 revision passed **443 application tests**, seven notice tests, data/citation validation, public-source checks and its build. [GitHub CI passed](https://github.com/categori-se/veggie-farm/actions/runs/36397381023), and the revision is merged. The evidence distinguishes synthetic browser tests, account-service checks and deployment observations; the no-account garden is the demonstration path.

### Community value: gardeners and builders

Massachusetts and New England home gardeners are my starting community because this is where I am learning to garden. Someone can explore without sharing an address, keep a local plan and carry a portable backup. Public knowledge becomes more useful when connected to a space they can inspect and change.

The result is already usable without an account: a gardener can explore plants, make a spatial plan, keep observations and take a portable copy of the garden with them.

User run-throughs and feedback during development helped shape the personas we used to refine the app over the last few days. I want to build on that participation: more people trying it in their own gardens, telling us what is confusing and asking for features that would help with their records and work.

Observable Framework, D3, Three.js, public agencies, Extension specialists and visualization developers made this possible; the [acknowledgments](https://github.com/categori-se/veggie-farm/blob/main/ACKNOWLEDGMENTS.md) credit those foundations. Open-sourcing veggie.farm returns an inspectable planning system, reusable plant structures and a [runnable builder walkthrough](https://github.com/categori-se/veggie-farm/blob/main/docs/building/README.md) that others can learn from and extend.

I want this project to raise awareness of what open-source software makes possible and encourage developers—and people who do not yet think of themselves as developers—to play and experiment. Connecting an AI agent to the AWS ecosystem gives more people a way to turn an idea into a working data application without arriving with expert-level knowledge of every language or infrastructure service. The [agent connection guide](https://github.com/categori-se/veggie-farm/blob/main/docs/architecture/codex-aws.md) and open repository offer a starting point for adapting a version around your own records, questions and work.

veggie.farm is meant to be a fun demonstration of that possibility. In roughly two weeks of development, drawing on open software, public data and prior experience, I brought together a gardening resource, spatial editor, procedural plant views and persistent records. Scoped access, private storage, automated checks and cost monitoring are part of that work: agents help make those practices approachable, while we still review what we build and operate.

I want more people to feel they can “vibe code” an idea to life: follow their curiosity, learn with an agent, test what happens and share something useful back. A garden is my starting point. Someone else's could be a completely different collection of data, questions and possibilities.

### Design → Tend → Remember → Grow

Gardening gives me a reason to leave the computer and pay attention to something alive. A plant thrives, another struggles, a tree casts more shade, or something gets to the berries before I do.

I want software that helps me imagine, plan, go outside, observe and return next season with better questions. Zero to Shipped gave me the push to turn that idea into something real. I now have a garden I can return to—outside and online—and an open-source project other people can make their own. I intend to keep tending both, and I hope others will join in.
