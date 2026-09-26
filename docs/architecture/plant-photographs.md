# Plant photographs

Find Plants starts in Table view and shows one linked photograph per result. Grid and Compare remain available. Cycling through photographs belongs on the dedicated plant report, whose cultivar and reference images share a five-image display limit.

Optional plant-type references load from `/media/plant-types.json` only on a matching plant report. Deploy this JSON and its images separately from source control. A missing or malformed manifest leaves the report usable. Each `types` entry holds up to five reviewed photographs. Runtime display uses the remaining space after unique cultivar photographs; references never imply the named cultivar has been verified.

Each entry supplies `url` (a same-origin `/media/plant-types/` filename), `alt`, `credit`, `license`, `source` and `licenseUrl`. Sources/license links must be HTTPS. Retain original file hashes, author, license, retrieval metadata and visual review privately. Credit and license links remain visible beside displayed references. Species/crop matching is conservative; similar common names do not justify relabeling an image.

Prefer living plants in garden or habitat context, with a complementary whole-plant, foliage, flower, fruit and seasonal view when available. Five is a maximum, not a requirement to fill slots with redundant or weak images. Do not present generic species photographs as named-cultivar evidence.

The September 26 hosted collection reuses 43 previously approved photographs and adds one unmodified Stan Shebs purple-coneflower photograph (CC BY-SA 3.0), retaining original provenance and visible attribution. The collection records 16 plant-type groups; this is not complete catalog coverage. Some groups remain unused until an appropriate identity mapping exists.

The suggested [Kaggle flower dataset](https://www.kaggle.com/datasets/aksha05/flower-image-dataset) is labeled CC0 in its public metadata, but its description does not identify individual photographers or original image sources. It was reviewed as a candidate, not imported. Favor individually traceable records, such as [the reviewed Wikimedia photograph](https://commons.wikimedia.org/wiki/File:Echinacea_purpurea_flower.jpg), before selecting new images.
