## Cultivating an Understanding of Gardening

I love gardening, but over the years I have relied on more trial and error than I would like. When I look online for help, I often find myself working through pages crowded with ads, trying to distinguish general advice from information backed by data and research. I want to spend more time understanding my garden and less time sorting through search results.

I built veggie.farm to give me more immediate access to useful, source-linked plant information and a means of applying that information to understand and improve my own garden. To this end, I compiled and structured a number of credible plant datasets and used them to build several targeted gardening resources and seasonal planning tools.

Because I am a visual learner and gardening is a multidimensional art, I also created an interactive Garden Planning Studio where gardeners can re-create parcels, plots, and garden beds in 2D and 3D and use time as another planning dimension. Gardeners can also keep planting records and observations so they can compare what they planned with what actually happened and learn from one season to the next.

**[Explore veggie.farm](https://veggie.farm/) · [Try Studio](https://studio.veggie.farm/) · [Visual walkthrough](https://veggie.farm/guide) · [Source](https://github.com/categori-se/veggie-farm)**

![Synthetic kitchen bed with tomato, basil and lettuce in Studio’s 3D view.](https://veggie.farm/media/builder/20260930/01-studio-hero.png)

A synthetic kitchen garden in Studio: tomato, basil and lettuce share one bed, with spacing footprints and illustrative procedural forms.


## A Fitting Plot

One of the most fun parts of veggie.farm is that the same garden model can work from a single bed up to a much larger mapped property. [Try it out!](https://studio.veggie.farm/)

Visitors can start without logging in or creating an account: create a bed, choose plants, arrange them, inspect their spacing, and compare the same garden in 2D and 3D. Gardeners can also move through dates to explore seasonal plans, then save, reload, and download a portable backup of the garden.

![Season panel with month controls, planned date and three visible plantings.](https://veggie.farm/media/user-guide/20260927-themes/05-plan-the-season-light.png)


Plan through the season: date controls preview the plantings scheduled to occupy the bed. This retained September 28 UTC capture uses an example garden.

**AWS Zero to Shipped evidence:** See the [full AWS and coding-agent evidence pack](https://github.com/categori-se/veggie-farm/tree/main/docs/evidence) for the authentic agent-controlled console connection, official AWS MCP records, deployment observations and source verification. The [public-access checks](https://github.com/categori-se/veggie-farm/blob/main/docs/evidence/judging-access.md) document anonymous app access. The no-account experience provides the quickest demonstration path, while work continues on persistent and collaborative spaces for authenticated users.


## A Garden by Any Other View

One contribution I hope to make with veggie.farm is connecting information that normally lives in very different places and formats. I drew from horticultural data and guidance from universities and Cooperative Extension programs, including UMass and other land-grant institutions, alongside state GIS data, NOAA/NWS environmental data, open plant catalogs, and open-source 3D and visualization libraries.

I then normalized those inputs into a shared plant and garden data model designed around consistent attributes, portable structures, source provenance, and evolving open-data and interoperability conventions. See the [acknowledgments](https://github.com/categori-se/veggie-farm/blob/main/ACKNOWLEDGMENTS.md) and [data sources](https://veggie.farm/about/data-sources) for details.

The goal is simple: **one garden record, many views.** Rather than maintaining separate versions of a garden for mapping, planting plans, 3D visualization, seasonal analysis, or observations, veggie.farm treats them as different views of the same underlying information. Plants, beds, site features, dates, observations, and sources retain consistent identities, attributes, units, and spatial relationships so they can be interpreted by different tools without losing their meaning.

![The same synthetic kitchen garden in 2D, showing tomato, basil and lettuce with spacing footprints.](https://veggie.farm/media/builder/20260930/07-same-garden-2d.png)

The same garden as the 3D view above, now in 2D: the planting identities, positions and spacing footprints come from the same records.

*For example:* a tomato record carries its identity, source information, dimensions, spacing, and visual characteristics. When a gardener places that tomato in a bed, the garden adds its position and rotation. Those same records can describe its footprint in a 2D plan, generate a schematic form in 3D, locate it within a mapped garden, connect it to dated observations, and preserve it as part of the garden over time. Change the underlying record and each view can respond to the same change.

![Explore and compare tomatoes in the plant list, with recorded light, maturity, spacing, source details and Add to plan controls.](https://veggie.farm/media/builder/20260930/03-plant-data.png)

Explore the plant list: compare recorded growing facts, inspect source details and add a choice to the garden plan. Missing facts remain labeled rather than guessed.

The [procedural plant library](https://github.com/categori-se/veggie-farm/tree/main/src/lib/plants) demonstrates this approach. Reusable plant profiles translate structured dimensions and visual attributes into shared procedural forms rather than requiring a separate 3D model for every species. The broader model applies the same principle to horticultural guidance, geographic information, modeled environmental conditions, and gardeners' own observations: each retains its source and role while remaining interoperable with the rest of the garden.

This is the part of veggie.farm that interests me most technically. The model makes information gathered for one purpose useful in others: the same plant can serve as research material, planning geometry, a mapped feature, a 3D representation, or the subject of a seasonal observation while retaining a consistent identity and source history. The garden becomes the common foundation, while the tools become different ways of understanding it.


## From Zero to Shipped

veggie.farm is a project I have wanted to build for years. I even had the domain waiting for it—one of several I keep *meaning to* do something with. Discovering the AWS Zero to Shipped challenge gave me the catalyst to finally build it.

AI-assisted development has changed what I feel able to make. I used to sketch ideas for complex data applications like veggie.farm and assume they would require more engineering time and expertise than I had available. Now I can open VS Code, work with Codex, and describe what I want to build in ordinary language.

I set the product direction, bring my experience with data, mapping, visualization and user needs, and continuously steer and critique the result. The agent helps translate those ideas into architecture and code, implement features, run tests, investigate failures and iterate with me.

That workflow has let me spend more of my time thinking about the application itself: what information should connect, what the garden model should represent, how someone should move between maps and 3D views, and whether the result is actually useful.

AWS provides the other half of that experiment. S3 and CloudFront deliver the public application, while I have also been developing optional persistent account services with Cognito, API Gateway, Lambda and private S3 storage.

For Zero to Shipped, I documented that development process in a small [evidence pack](https://github.com/categori-se/veggie-farm/tree/main/docs/evidence). It includes the September 22 agent-controlled AWS Console connection, a September 25 interaction through AWS's official MCP Proxy and managed MCP Server, and subsequent agent-assisted AWS deployment and verification.

The [authentic redacted console capture](https://veggie.farm/evidence/aws-console-connection.png) provides direct connection evidence, while the dated records preserve what each interaction actually demonstrated. A [fresh September 30 evidence record](https://github.com/categori-se/veggie-farm/blob/main/docs/evidence/aws-session-2026-09-30.md) combines an official AWS MCP read-only inspection and successful public Studio HTTPS request from one agent session, with the exact source revision and tool versions recorded.

![Redacted AWS CloudFormation console showing the application stack CREATE_COMPLETE on September 22.](https://veggie.farm/evidence/aws-console-connection.png)

AWS Console Connection Verification — September 22, 2026. Codex-controlled Chromium inspected the application’s CloudFormation stack through a temporary read-only federated session. Account, stack and session identifiers were masked; restricted-access warnings remain visible. [Original method and provenance](https://github.com/categori-se/veggie-farm/blob/main/docs/evidence/console-connection.json).

The separate [September 30 MCP record](https://github.com/categori-se/veggie-farm/blob/main/docs/evidence/aws-session-2026-09-30.json) reports three successful read operations, stack UPDATE_COMPLETE, CloudFront Deployed/enabled and a same-session public Studio HTTP 200 check. It is a structured tool record, not a new console screenshot.

I also wanted the experiment to be useful beyond this submission. The repository includes a [guide for connecting Codex to your own AWS account](https://github.com/categori-se/veggie-farm/blob/main/docs/architecture/codex-aws.md), using short-lived credentials, scoped permissions and the official AWS MCP connection.

My hope is that veggie.farm can be both a gardening application and an example of how someone with an idea can use open-source tools, an AI coding agent and AWS to start building applications they might previously have left sitting in their imagination.


## Nurtured by Community: Gardeners and Builders

Massachusetts and New England home gardeners are my starting community because this is where I am learning to garden. The planning tools work without an account, and public GIS-data discovery is already expanding beyond Massachusetts to several additional states.

![Berkshire Botanical Garden site map in Studio, showing parcel context, beds, paths, buildings and illustrative vegetation.](https://veggie.farm/media/builder/20260930/08-mapped-garden-site.png)

From one bed to a mapped site: the Berkshire Botanical Garden study brings parcel context, beds, paths, buildings and illustrative vegetation into Studio. This public example is an incomplete reconstruction; the aerial layer is switched off.

Gardeners can create a spatial plan, keep observations, and carry a portable copy of their garden with them. Connecting public knowledge to a place someone can inspect and change makes that information much more useful.

User run-throughs and feedback during development helped shape the personas I used to refine the app. I want to build on that participation: more people trying veggie.farm in their own gardens, telling me what is confusing, and suggesting features that would make it more useful for their records and work.

I also owe an enormous debt to the open-source and data-visualization communities. Observable Framework, D3, Three.js, public agencies, university researchers, and many individual developers provided the foundations that made this experiment possible.

I have been especially influenced by the work and generosity of **Mike Bostock, Philippe Rivière, Tom Larkworthy, Saneef H. Ansari, and Ananya Roy**, whose work, examples, and experiments have shaped how I think about interactive data, maps, visualization, and what can be built in the browser. The [acknowledgments](https://github.com/categori-se/veggie-farm/blob/main/ACKNOWLEDGMENTS.md) credit these foundations in more detail.

Open-sourcing veggie.farm is one way I can return some of that value. The repository includes the garden data structures, procedural plant system, tests, a [runnable builder walkthrough](https://github.com/categori-se/veggie-farm/blob/main/docs/building/README.md), and a [guide for connecting Codex to AWS](https://github.com/categori-se/veggie-farm/blob/main/docs/architecture/codex-aws.md) so other people can inspect the approach, adapt it, and build on it.

I want veggie.farm to encourage developers—and people who do not yet think of themselves as developers—to experiment. AI-assisted development and open-source tools make it possible to start with a question, work alongside an agent, connect data and services, and gradually turn an idea into a working application.

A garden is my starting point. Someone else's could be a completely different collection of data, questions, and possibilities.


## Growing Beyond the Challenge

Zero to Shipped gave me the push to build the first working version of veggie.farm. After the challenge, I plan to expand the plant and spatial data, improve the planning experience, bring in more regional GIS sources, and learn from gardeners using the tool in places and ways I did not design for myself.

Massachusetts is the starting point, not the boundary. I want to extend support to more states as suitable public data become available and, over time, work toward an application that can help gardeners anywhere in the world.

That means designing the core garden model, plant data, spatial records, and source metadata so they can adapt to different geographies, climates, data systems, and local knowledge rather than being tied to a single place.

Just as importantly, I want the project to remain something other people can inspect, adapt and build on. The open repository, reusable data structures, procedural plant library and agent-connection guide are intended to make that possible.


## Design → Tend → Remember → Grow

Gardening gives me a reason to leave the computer and pay attention to something alive. A plant thrives, another struggles, a tree casts more shade, or something gets to the berries before I do.

I want software that helps me imagine, plan, go outside, observe, and return with better questions. Zero to Shipped gave me the push to turn that idea into something real.

Now I have a garden I can return to—outside and online—and an open-source project that other people can explore, adapt, and make their own. I intend to keep tending both, and I hope others will join me.
