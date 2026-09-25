# Mapped soil context

Studio's Map view now includes **USDA mapped soil context**. The same explicit coordinate lookup appears in the soil-testing guide. It queries USDA Soil Data Access directly only after the gardener chooses Look up; no location permission or automatic query is used. Studio can fill its current garden origin, which remains editable and is not a bed sample location.

The lookup returns map-unit names, component proportions, drainage class, representative slope and survey-version dates. Component proportions describe the entire mapped unit, not the component at the query point. Texture and available-water estimates are not yet included. The geographic input gate covers the Massachusetts bounding region, not an exact administrative border.

An optional dashed orange outline displays up to five point-intersecting USDA polygons in Studio's Map view, using the planner's existing WGS84/local coordinate transform. It preserves polygon holes and rejects unsupported geometry types. These are map-unit boundaries, not surveyed bed boundaries. Changing gardens clears lookup results, coordinates and overlays. The lookup and overlay never enter editable garden geometry, notebook laboratory reports or recommendation inputs.

Download source record retains the submitted numerical coordinates, exact SQL queries, raw JSON responses, retrieval timestamp, limits and normalized display data. It stays with the gardener; the application does not upload it to an account or archive private coordinates centrally. Public-reference testing responses and official service documents are retained in `data/raw/soil-context-20260925/` with checksums. `saverest` is presented as a survey-version date, not a sampling date.

Queries use a fixed USDA endpoint, finite numeric coordinates, two bounded requests, credentials omitted, explicit timeout, row limits and response-size checks. A failed service produces a visible error. Source: [USDA service documentation](https://sdmdataaccess.nrcs.usda.gov/WebServiceHelp.aspx) and [spatial-query documentation](https://sdmdataaccess.sc.egov.usda.gov/documents/AdvancedQueries.html).

Acceptance distinguishes a real public-point service query from browser checks using those archived responses. No private account save or gardener usability result is implied. Next work: reviewed texture/water units and depth semantics, broader boundary geometry support, and better bed-specific point selection.
