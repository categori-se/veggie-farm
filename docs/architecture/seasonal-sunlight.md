# Seasonal sunlight and bed comparisons

Open **Date & sunlight previews → Sun preview** in Studio. Choose an exact date or move the month slider, then move the Eastern-time slider from 04:00 to 22:00. The same calculated solar direction drives Map, 2D and 3D. Site-shadow polygons are also clipped into a selected bed's 2D/3D frame. These controls change the viewing scenario, not saved planting dates.

**Compare bed light for this date** opens a closable comparison dialog, preserving space for the garden. It samples up to nine positions per bed at 20-minute intervals. It reports mean unblocked and shaded hours and the range of unblocked hours across sampled positions. Daylight below 5° solar elevation is reported separately because this model suppresses the very long near-horizon shadows. Changing the date, mapped geometry or height scenario clears stale results; moving the clock leaves the daily comparison intact.

Unblocked means not covered by a modeled obstruction. It does not establish measured full sun, crop suitability, irradiance or weather. The default calculation uses entered heights only and counts omitted objects. Unknown and unmapped obstructions can make unblocked hours optimistic. Trees are opaque crown-shaped columns, including in winter: branches, crown gaps, crown base and seasonal leaf loss are not modeled. Terrain and nearby off-parcel obstructions are not inferred; courtyard holes are treated as filled. Irregular beds without usable sample positions report Not sampled.

For incomplete example gardens, **Try illustrative heights where missing** uses a temporary scenario: 20 ft trees/canopies, 4 ft shrubs, 12 ft buildings and 6 ft hedges/walls/fences. Entered heights take precedence. Assumed heights are counted in the result and never written into saved garden objects. These values are design prompts, not observations or species growth models.

Calculations remain browser-local and run only when requested. The comparison caps input at 200 beds, 500 mapped obstructions and bounded geometry size. It makes no network requests. Use smaller reviewed areas for larger gardens. The model uses the mapped Massachusetts origin and date-aware America/New_York offsets, independently of the viewer's browser timezone.

## Basis and inspiration

Solar position uses the [NOAA General Solar Position Calculations](https://gml.noaa.gov/grad/solcalc/solareqns.PDF). Daily exposure is our independent sampling of the existing flat-ground shadow model.

The owner supplied notebook archives for inspection. They remain private reference material; no notebook code, bundled model, texture, data or service credential was copied into the public source or deployed assets:

- [Visualizing Seasonal Daylight — Dan Bridges](https://observablehq.com/@dbridges/visualizing-seasonal-daylight): linked date/time exploration. Studio uses Eastern civil time rather than the notebook's local solar time.
- [Visualizing wind turbines in 3D using Threebox — Christoph Pahmeyer](https://observablehq.com/@chrispahm/visualizing-wind-turbines-in-3d-using-threebox): coordinating map location, model scale and a sunlight scenario.
- [3D Virtual Gallery — Claudio Esperança](https://observablehq.com/@esperanc/3d-virtual-gallery): moving between visitor viewpoints and contextual interactions.
- [Deckgl, Mapbox and 3D tiles — Tom van Tilburg](https://observablehq.com/@tomvantilburg/deckgl-mapbox-and-3d-tiles): terrain and model-coordinate integration considerations. No Mapbox/DeckGL dependency or paid service was added.

The next accuracy improvements are explicit deciduous/evergreen canopy observations, crown-base heights and terrain-aware horizons. A seasonal comparison must not silently convert generic display trees into field-verified shade evidence.


## Visible controls and monthly bed comparison

Sun & shade is a dedicated strip above the planning canvases, outside the collapsed planting-date preview. Enable it to expose an exact date, month slider, Eastern-time slider, optional illustrative heights and light comparison actions. The same direction and obstruction-shadow estimate drives Map, 2D and 3D.

Compare months for selected bed samples the selected calendar day across all twelve months (clamped for February and other short months). Each row gives estimated mean unblocked and shaded hours across the bed's sample points; View opens that date in the scene so the time slider can explore it. These are representative-day calculations, not monthly averages. Computation yields between months and cancels stale work when the garden, selected bed or model inputs change, or the dialog closes. Results never change saved heights, plantings or measured sun hours.

Missing heights remain omitted unless illustrative heights are explicitly enabled. Flat terrain, opaque vegetation, excluded low-angle sunlight and no inferred seasonal leaf loss remain model limitations. This release does not use the newly discovered LiDAR data or establish measured sunlight.
