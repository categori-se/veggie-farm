# Light in Today’s comparison

Today sends the selected garden/bed's recorded direct sun hours into its existing crop comparison. Missing, invalid and out-of-range values stay unknown; zero is a recorded low-light value. No inference is made from map geometry or an unrelated bed. A six-hour general vegetable-site benchmark comes from University of Maryland Extension's [How to Start a Vegetable Garden](https://www.extension.umd.edu/resource/how-start-vegetable-garden), reviewed September 27, 2026 (page updated February 25, 2026).

The benchmark is site-selection guidance, not a crop-specific minimum or yield model. Below it, the UI says Check light and explains that shade-tolerant crops may remain useful. Matching it does not evaluate seasonal canopy changes, heat, water, soil chemistry or cultivar response. The comparison exposes the recorded hours and source. Unknown/check/match have text labels and symbols; no probability or confidence percentage is added.

In Today, missing or below-benchmark light downgrades an otherwise recommended result to caution. Existing early/late-season and protection statuses remain intact. Light never upgrades a timing/temperature/forecast restriction. Legacy callers that omit the light context retain their timing-only status; the returned Light comparison still says unknown. The rule version is garden-today/1.3.0. Saved measurements and plans are never changed by evaluation.

This is one transparent condition check, not completion of the full garden-fit model. Crop-specific shade tolerance, historical light measurements and integrated space/soil/moisture suitability remain unfinished.
