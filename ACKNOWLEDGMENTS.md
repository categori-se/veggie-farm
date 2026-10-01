# Acknowledgments and software licenses

veggie.farm combines existing open-source software with gardening-specific integration, application logic and AWS configuration. We thank the upstream authors and maintainers whose work makes the resource site and Studio possible. We do not claim authorship or ownership of their software.

## Observable

A special thank-you to the **Observable team ([observablehq](https://github.com/observablehq))** for Observable Framework and for making interactive, data-driven publishing accessible. Their tools, examples and community help make veggie.farm possible.

## Universities and Cooperative Extension

Thank you to the researchers, educators and Extension specialists whose published guidance supplies the reviewed plant facts in veggie.farm. The [active evidence sources](src/data/evidence-sources.json) and [normalized plant evidence](src/data/horticultural-evidence.json) trace 165 facts to seven retained source snapshots from these institutions:

| University / Extension program | Guidance used |
| --- | --- |
| **University of Maine Cooperative Extension** | [Home vegetable planting chart](https://extension.umaine.edu/gardening/2021/05/01/maine-home-garden-news-may-2021/#planting-chart-for-the-home-vegetable-garden), [Plant from Spring to Fall](https://extension.umaine.edu/gardening/manual/propagation/plant-from-spring-to-fall/) and [Growing Garlic in Maine](https://extension.umaine.edu/publications/2063e/): planting windows, spacing, depth, yield and garlic care |
| **University of Minnesota Extension** | [Growing collards and kale in home gardens](https://extension.umn.edu/vegetables/growing-collards-and-kale): planting and care guidance |
| **University of Maryland Extension** | [When to Plant Vegetables](https://extension.umd.edu/resource/when-plant-vegetables): a regional vegetable planting calendar |
| **Utah State University Extension** | [Leafy Greens: Planting and Spacing](https://extension.usu.edu/vegetableguide/leafy-greens/planting-spacing): leafy-green spacing benchmarks |
| **Penn State Extension** | [Mizuna: an Asian Green](https://extension.psu.edu/mizuna-an-asian-green): mizuna planting and care guidance |

These regional sources retain their geographic context and page-level reuse terms. The source records distinguish retained factual values from article prose and record where each benchmark applies.

We also acknowledge **UMass Amherst**, credited with **The Trustees of Reservations** in the [Naumkeag landscape-tour reference](src/data/garden-reference-sources.json). That contribution informs the public-garden landscape study rather than the plant-fact collection above.

## State geographic data, weather and climate

Massachusetts was our starting point in part because its excellent public geographic data makes it possible to connect a garden to its wider landscape. Thank you to **MassGIS (Bureau of Geographic Information), Commonwealth of Massachusetts, Executive Office of Technology Services and Security (EOTSS)** and the state and local teams that create and maintain these resources. Their parcel, building, aerial-imagery, land-cover and open-space datasets give the Massachusetts tools a strong foundation.

| Provider | Contribution |
| --- | --- |
| [MassGIS](https://www.mass.gov/info-details/massgis-data-layers), [MassDOT](https://www.mass.gov/info-details/massgis-data-massgis-massdot-roads) and Massachusetts environmental agencies | Geographic context, including parcels, buildings, roads, imagery, land cover and protected open space; dataset-specific partners and credits are retained in the [GIS source records](src/data/public-gis-sources.json) |
| [NOAA National Centers for Environmental Information (NCEI)](https://www.ncei.noaa.gov/) | Historical station observations and climate-normal reference data for seasonal weather comparisons; retained snapshots, dates and methods are recorded in the [weather dataset](src/data/season-weather.json) |
| [NOAA National Weather Service (NWS)](https://www.weather.gov/documentation/services-web-api) | Opt-in local forecasts that add current weather context to gardening decisions |
| [U.S. Geological Survey (USGS), The National Map](https://www.usgs.gov/programs/national-geospatial-program/national-map) | LiDAR and elevation-product discovery through the regional data tools |
| [OpenStreetMap contributors](https://www.openstreetmap.org/copyright) | Additional map and site context, with separate attribution and service-use terms |

We have also added **regional data discovery** for eight other states, linking gardeners to their public catalogs and supporting USGS elevation searches: [Vermont (VCGI)](https://vcgi.vermont.gov/data-and-programs/data-status), [Connecticut](https://geodata.ct.gov/), [New Jersey (NJGIN)](https://nj.gov/njgin/), [North Carolina (NC OneMap)](https://www.nconemap.gov/), [Wisconsin](https://www.sco.wisc.edu/data/), [New York](https://data.gis.ny.gov/), [Minnesota](https://gis.data.mn.gov/) and [Maine (GeoLibrary)](https://www.maine.gov/geolib/). Thank you to these state programs and their local contributors for making geographic information accessible.

Massachusetts retains the deepest integration. Support elsewhere currently centers on finding data; parcel availability, imagery dates, elevation coverage and reuse terms vary by location and provider. The [regional source definitions](src/lib/spatial/regionalSources.js) record that scope. Weather observations, climate normals and forecasts serve different purposes, and mapped context does not establish surveyed boundaries or conditions measured in an individual garden.

The dedicated [software acknowledgments and license directory](docs/licenses/README.md) identifies major components and links complete collected license texts, versioned dependency inventories, browser-bundle evidence and outstanding notice gaps.

Our contributions remain GPL-3.0-only to the extent we hold the rights; upstream components retain their own terms. See [project rights, warranty and liability](docs/licenses/PROJECT-RIGHTS.md), [NOTICE](NOTICE.md) and the unmodified [GPL license](LICENSE). No warranty, support commitment or AWS service entitlement is provided by this source release.

Spatial reference credit: Bureau of Geographic Information (MassGIS), Commonwealth of Massachusetts, Executive Office of Technology and Security Services. [Data-use policy](https://www.mass.gov/info-details/learn-about-massgis-data) permits redistribution and derivative works. Project interpretations retain per-feature source lineage.

Interface and visualization references, including the owner-supplied Observable notebooks and NOAA solar equations, are recorded in [seasonal sunlight design notes](docs/architecture/seasonal-sunlight.md). These references are not bundled dependencies or model assets.
