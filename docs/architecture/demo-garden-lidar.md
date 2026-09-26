# Demo garden LiDAR discovery

USGS National Map catalog queries against the four existing demo garden bounding boxes returned **MA_Western_B24** point-cloud products and 1 m terrain products. These are catalog intersections, not yet clipped, processed or applied to the live gardens.

| Garden | 2024 point-cloud tiles returned |
| --- | --- |
| Berkshire Botanical Garden | 18TXM636683, 18TXM636684 |
| The Mount | 18TXM640687 |
| Naumkeag | 18TXM637681, 18TXM637683, 18TXM639681 |
| Ashintully | 18TXM649674, 18TXM651674 |

Raw catalog responses, exact bounding queries and download URLs are retained privately in `.launch-private/lidar-research/`. Individual point-cloud files are roughly 339–640 MB; no large tiles were downloaded automatically. Existing demo bounding boxes can include land outside the designed garden and multiple parcels. Review exact tile coverage and clip to the selected site before processing.

The [NOAA Western MA metadata](https://www.fisheries.noaa.gov/inport/item/78679) identifies a spring 2024 collection, NAD83(2011) UTM18N horizontal coordinates and NAVD88/Geoid18 vertical elevations in meters. Its original DEM product has 0.5 m cells; the National Map search here located separate 1 m products. Do not confuse these resolutions or publication year with flight date. [Full metadata](https://www.fisheries.noaa.gov/inport/item/78679/full-list) states CC0 for that DEM record; inspect each point-cloud product's metadata before redistribution.

## Application pipeline

1. Keep source files in the private data archive with hashes, bounds, flight date, classifications, units and horizontal/vertical datums.
2. Clip ground-class points/DEM to the garden plus a small context buffer. Preserve missing coverage; generate a bounded terrain mesh with no fabricated fill across gaps.
3. Normalize vegetation/building points against the same ground surface. Review canopy outlines and robust height estimates against dated imagery. Individual tree species and bed crops remain inferred or field-verified separately.
4. Preview proposed terrain, buildings and canopy against the current garden. Apply as a new reference revision without overwriting user beds or plantings.
5. Make walkthrough eye height relative to sampled ground. Use canopy/structure geometry in light estimates, showing collection season and uncertainty. Ground resolution does not equal horizontal placement or canopy-height accuracy.

Studio currently uses the older MassGIS 2013–2021 terrain service and a coarse sampled grid. **The new 2024 data has not replaced that service or changed the demo geometry.** Point processing, mesh rendering and measured-canopy application remain implementation work.
