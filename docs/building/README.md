# Build something you care about

I chose gardening because it is fun for me, and because it is a place I love. I wanted a clean workspace that would remember my garden: plantings I could visualize, observations I could return to, and a plan that could evolve from one season to the next. The hackathon gave me a reason to start building it.

There is another contribution I hope this project makes. Public knowledge and community software put extraordinary building blocks within reach. With an AI assistant, a person who cares about a subject can explore those pieces, connect them and build something useful for their own purposes. You do not have to choose gardening. Choose a place, collection, hobby or question you want to spend time on.

This repository is meant to make that process inspectable and repeatable. The assistant helped me implement, debug and check the work; it did not supply the underlying scientific evidence or make upstream work mine. The human work remains choosing the purpose, checking meanings, reviewing rights and testing whether the result actually helps.

## Run one small, complete example

From a checkout of this public repository, with the Node version in `.nvmrc`:

```sh
node examples/building/walkthrough.mjs
node --test tests/builderWalkthrough.test.mjs
```

No package installation, account, API key or network is needed for this example. It reads bundled records and prints JSON; it does not write a garden or fetch data.

Read [the annotated code](../../examples/building/walkthrough.mjs) alongside its output. It follows three existing application paths:

1. **Evidence:** find tomato facts through `getCropEvidence`. The output carries source links, retrieval/review fields, units and geographic context. The facts remain separate assertions; the example does not invent a single best value.
2. **Interpretation:** take the synthetic fixture's tomato dimensions and choose an explicit visual archetype. `plantVisualSpec` and `plantVisualGeometry` produce the deterministic descriptors used by the 2D and 3D renderers. Fixture dimensions are labeled synthetic, not attributed to Extension sources.
3. **Continuity:** parse, serialize and revalidate the portable garden fixture. This proves a bounded data path, not browser persistence or real-world growth.

Try changing the placement seed passed to `plantVisualGeometry`. The arrangement of illustrative organs changes; the record's width, height and spacing do not. Then remove the plant height in your local copy: the specification refuses to invent a dimension. Those boundaries are part of the lesson.

## Open the application

Follow [the root setup instructions](../../README.md#run-locally) for the locked install, notice generation and `npm run dev`. Open `/studio`, make a practice bed, place plants, compare 2D and 3D, save and reload. Export a backup; restore it in a separate empty profile so you do not replace a garden you care about.

The community build uses bundled inputs and procedural shapes. It does not reproduce the hosted site's private media or optional account service. External maps and forecasts have their own availability and regional coverage. The [AWS example](../../examples/aws/DEPLOYMENT.md) is an optional later step, not a prerequisite to understand or run this project.

## Follow the code by purpose

| Question | Start here | Why it is separate |
| --- | --- | --- |
| Where did this fact come from? | [Evidence records](../../src/data/horticultural-evidence.json), [evidence reader](../../src/lib/evidence/horticulturalEvidence.js) | Claims retain source, units and scope |
| How do different sources become comparable? | [Assertion staging adapter](../../src/lib/plants/trefleAssertions.js) | Vocabulary normalization does not approve facts or resolve disagreements |
| What becomes a visual plant? | [Visual specification](../../src/lib/plants/plantVisualSpec.js), [shared geometry](../../src/lib/plants/plantVisualGeometry.js) | Measured/planning dimensions and illustrative form have different meanings |
| How do both views stay related? | [2D renderer](../../src/lib/plants/plantVisual2d.js), [3D renderer](../../src/lib/plants/plantVisual3d.js) | Views consume shared descriptors rather than owning separate garden records |
| Where do map coordinates enter? | [Spatial model](../../src/lib/spatial/gardenSpatial.js), [interchange](../../src/lib/spatial/spatialInterchange.js) | Local garden units and geographic coordinates need explicit conversion |
| Can someone keep their work? | [Backup validator](../../src/lib/garden/plannerBackup.js), [local store](../../src/lib/garden/localGardenStore.js) | Portable records and failure handling matter beyond a successful render |
| What does the public build actually ingest? | [Community builder](../../scripts/build-community-data.mjs), [dataset register](../../data/reference/datasets.json) | The public build uses reviewed bundled inputs, not private harvesting tools |

For deeper detail, continue to [plant visuals](../architecture/plant-visual-pipeline.md), [GIS records](../architecture/garden-layer-model.md) and [extension contracts](../architecture/extension-contracts.md).

## Reuse the method, not just the demo

Start with one meaningful task and one small dataset. Write down what the fields mean before asking an assistant to connect them. Keep the raw claim distinct from an interpretation and from a user's observation. Preserve missing values. Give records stable identities, state their units, and make export possible early.

Ask the assistant to inspect existing modules before generating another parallel implementation. For example:

> Trace one plant from its attributed evidence to a displayed planning dimension.
> Show which values are measured, source-reported, synthetic or unknown. Propose
> one small change, retain provenance, and verify save/reload still works.

Then inspect the patch and run the relevant checks. A plausible explanation or a successful screenshot is not evidence that the data means what the assistant thinks it means. The [build evidence pack](../evidence/README.md) records actual agent and AWS use; these example prompts are teaching suggestions, not invented conversation logs.

Use [the intake and attribution guide](data-intake.md) before adding a source. A new provider should not force changes to garden ownership or silently replace old observations. Build a small adapter, test unknowns and conflicting records, and only then connect it to a user-facing decision.

## The impact we can offer and what we still need to learn

The immediate contribution is a runnable application, an attributed code path and a method others can adapt. The intended broader impact is helping people make personal, useful applications from shared knowledge and open tools.

That is a contribution readers can inspect, not a claim that adoption or learning outcomes have already been measured. Useful next evidence is whether a new builder can run this example, explain a source-to-view boundary, and adapt a record without losing its provenance. Record environment, completion, help needed and sticking points. Gardener task testing remains a separate question.

The digital twin is a direction: a garden record that grows with its place. Broader imagery/lidar feature capture, richer ingestion and governance of competing assertions are future work. Keeping those boundaries visible makes this a more useful learning resource than presenting every ambition as finished.
