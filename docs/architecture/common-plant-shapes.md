# 50 common-garden plant shapes

[Back to the project](../../README.md) · [Visual app walkthrough](../user-guide/README.md) · [Download the JSON definitions](../../src/data/common-plant-shapes.json)

This starter collection lets you explore the procedural plant library without downloading photographs or GLB models. It contains 50 plant profiles selected by the owner's common-garden priority list. “Common” describes that product selection, not a measured popularity ranking.

The profiles use seven of the renderer's eight shared shape families, with plant-specific planning dimensions and colors. They are not 50 independently modeled botanical meshes. Trees, vines and crops remain schematic; cultivar form, training and growth may differ. The source planning ranges are user-supplied references with horticultural verification pending. The JSON preserves that status, source identifiers and dimension basis.

## Use the shapes

The collection is plain JSON. The rendering code is original project source under GPL-3.0-only; no external media is required. Dimensions are in inches. The same specification feeds both renderers:

```js
import {plantVisualGeometry} from '../../src/lib/plants/plantVisualGeometry.js';
import {renderPlantVisual2d} from '../../src/lib/plants/plantVisual2d.js';
import {addPlantVisual3d} from '../../src/lib/plants/plantVisual3d.js';

// Load src/data/common-plant-shapes.json through your app's JSON loader.
const plant = shapes.plants[0];
const placement = {id: plant.id, rotation: 0};
const primitives = plantVisualGeometry(plant.spec, placement.id);
// With an existing D3 selection and Three.js group:
renderPlantVisual2d(svgGroup, plant.spec, placement);
addPlantVisual3d(THREE, sceneGroup, plant.spec, placement, 1 / 12);
// The 3D unit factor above converts inches to scene feet.
```

Use a stable placement ID for repeatable geometry. These internal source APIs are examples, not a separately versioned SDK. The pack references the shared renderer rather than duplicating mesh bytes for every plant.

## Included profiles

The display uses the upper bounds of supplied mature-size ranges, as a planning scenario rather than a measurement. Width × height below is in inches; plant spacing is retained separately in each specification.

| Priority | Plant | Shared shape family | Width × height (in) |
| --- | --- | --- | --- |
| 1 | Tomatoes | upright-fruiting | 36 × 96 |
| 2 | Cucumbers | upright-fruiting | 96 × 24 |
| 3 | Peppers | upright-fruiting | 30 × 48 |
| 4 | Beans | upright-fruiting | 24 × 120 |
| 5 | Carrots | fine-tuft | 8 × 18 |
| 6 | Zucchini | low-rosette | 60 × 36 |
| 7 | Onions | fine-tuft | 8 × 24 |
| 8 | Lettuce | low-rosette | 14 × 16 |
| 9 | Peas | upright-fruiting | 18 × 72 |
| 10 | Basil | paired-herb | 24 × 36 |
| 11 | Potatoes | paired-herb | 30 × 36 |
| 12 | Strawberries | low-rosette | 24 × 12 |
| 13 | Corn | fine-tuft | 24 × 108 |
| 14 | Spinach | low-rosette | 12 × 12 |
| 15 | Garlic | fine-tuft | 8 × 36 |
| 16 | Radishes | fine-tuft | 12 × 18 |
| 17 | Blueberries | rounded-shrub | 72 × 84 |
| 18 | Kale | low-rosette | 30 × 36 |
| 19 | Mint | low-rosette | 60 × 30 |
| 20 | Apples | broadleaf-tree | 300 × 300 |
| 21 | Parsley | paired-herb | 14 × 24 |
| 22 | Cilantro | paired-herb | 12 × 24 |
| 23 | Rosemary | paired-herb | 48 × 60 |
| 24 | Thyme | paired-herb | 18 × 12 |
| 25 | Raspberries | rounded-shrub | 48 × 84 |
| 26 | Winter Squash | low-rosette | 180 × 24 |
| 27 | Beets | fine-tuft | 12 × 18 |
| 28 | Dill | paired-herb | 18 × 60 |
| 29 | Sage | paired-herb | 30 × 30 |
| 30 | Swiss Chard | low-rosette | 18 × 30 |
| 31 | Arugula | low-rosette | 12 × 18 |
| 32 | Garden Peony | rounded-shrub | 36 × 36 |
| 33 | Black-eyed Susan | fine-tuft | 24 × 36 |
| 34 | Pears | broadleaf-tree | 240 × 300 |
| 35 | Plums | broadleaf-tree | 240 × 240 |
| 36 | Sour Cherries | broadleaf-tree | 180 × 180 |
| 37 | Bok Choy | low-rosette | 14 × 18 |
| 38 | Collards | low-rosette | 30 × 36 |
| 39 | Turnips | fine-tuft | 12 × 18 |
| 40 | Butterfly Weed | fine-tuft | 24 × 36 |
| 41 | Wild Bergamot | fine-tuft | 30 × 48 |
| 42 | Blazing Star | fine-tuft | 24 × 72 |
| 43 | Red Columbine | flowering-perennial | 18 × 36 |
| 44 | Wild Geranium | low-rosette | 24 × 24 |
| 45 | Blue Flag Iris | flowering-perennial | 30 × 36 |
| 46 | Cardinal Flower | fine-tuft | 24 × 48 |
| 47 | Wild Blue Phlox | low-rosette | 24 × 18 |
| 48 | Smooth Aster | fine-tuft | 48 × 48 |
| 49 | Wrinkle-leaved Goldenrod | fine-tuft | 36 × 60 |
| 50 | Virginia Rose | rounded-shrub | 72 × 72 |

## Reproduce and check

Run `node scripts/build-common-plant-shapes.mjs` to regenerate from the ranked Common 100 inputs, or add `--check` to detect stale output. Normal Common 100 builds also refresh the pack. Run `node --test tests/commonPlantShapes.test.mjs tests/plantVisuals.test.mjs` for deterministic geometry and renderer checks.

See [reusable data and review boundaries](reusable-plant-data.md) for source rights, unknown fields and the wider collection. Optional image and model media remains separate; see [media boundaries](media.md).
