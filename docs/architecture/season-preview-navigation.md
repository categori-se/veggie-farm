# Seasonal preview navigation

Studio exposes its planned occupancy controls beneath the map/2D/3D workspace, rather than behind the upper preview disclosure. The schedule starts open and can be collapsed. Month buttons preview the first day of the named month, not a monthly average. The date field and day slider offer finer control. Year changes preserve month/day when possible and clamp leap-day/month-end dates to a valid day. Supported navigation years are 1900–2200.

The preview uses the existing shared `previewDate`. In the bed workspace, counts and schedule use that bed's plantings; garden views use active-garden plantings. Turning Date preview off restores all plantings. The same entered occupancy controls both renderers. Neither changing the preview nor moving across years changes planting dates, identity, geometry or observations.

Unknown/invalid planting bounds remain visible and are counted explicitly. Missing end dates stay open-ended. A preview year does not clone annual plants, create a season, or reconstruct historical conditions. Manual size scenarios remain illustrative; no biological growth model is implied. Spacing diagnostics still inspect the full plan, including plantings absent from the current date.

Browser acceptance enters separate tomato and lettuce date ranges through the inspector, previews April/June/November, checks actual 2D objects and 3D placement groups, changes a leap-year date, clears a date field, restores all plants, and compares saved records at desktop and phone widths. Calendar unit tests cover invalid input and month/year boundaries. Mobile occupancy bands stack beneath their labels rather than requiring horizontal table scrolling.

Remaining journey work includes adding a crop after an earlier crop, first-class seasons and selective year cloning, overlap-aware spacing, explicit illustrative growth stages, and comparing observations/weather across years. This navigation does not complete those requirements.
