---
title: Map data for your garden
toc: false
---

# Map data for your garden

Choose your state, find its parcel and imagery sources, and look for elevation data around your garden. Planning and journal records remain yours; map coverage does not establish local planting dates or suitability.

```js
import {regionalGardenData} from "../components/regional-garden-data.js";
display(regionalGardenData({invalidation}));
```

## Bring a site into Studio

1. Open the state catalog. Find your parcel and dated aerial imagery; check local coverage and reuse terms. Parcel boundaries are planning context, not a survey.
2. Export only your selected geometry as **GeoJSON in WGS84 longitude/latitude (CRS84)**. Remove owner names, mailing addresses and tax attributes. Reproject projected coordinates before import; changing a CRS label is insufficient.
3. In [Studio](/studio), create or select your own garden, open the spatial import/review interface, and review the features before applying them. Keep a backup first. Compare several landmarks against the imagery before drawing beds.
4. Add planting beds and choose plants yourself. A parcel polygon is not a bed; LiDAR cannot identify crop varieties.

State catalogs are connected as source links. Automatic state parcel search, imagery streaming and one-click LiDAR-to-3D import are not yet implemented here. Massachusetts retains its existing integrated tools; its terrain service is not used for other states.

## What elevation can tell you

**Bare-earth terrain** supports ground level, slopes and terraces. **Classified LiDAR points** can support building and canopy heights above that ground after processing. Retain flight date, horizontal/vertical datum and classification; check gaps and seasonal foliage. An elevation model alone cannot provide tree heights. Inferred species and illustrative planting arrangements stay separate from measured features.

The USGS search returns up to 20 matching catalog records without downloading large source tiles. The soil lookup sends a point directly to USDA only on request; missing coverage stays unknown. Soil map units are landscape estimates, not garden soil tests.

Massachusetts gardening articles and seasonal defaults have not been validated for the added states. Set your own frost dates and measured conditions in your Notebook.
