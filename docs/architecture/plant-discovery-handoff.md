# Find Plants to a garden plan

Find Plants now offers a direct link into Studio’s planning tray. The link fragment contains a bounded projection of public catalog fields: record ID, name, common name, cultivar, scientific name, HTTPS source and recorded upper spacing. Garden identity, bed identity, account information and notes are never put in this link. Imported dimensions are reviewed by the gardener; missing height and width are not invented.

In Studio, choose a garden, bed and planning year. Create a 4 × 8 garden if needed, or close the panel and load an existing account save before reopening Planning tray in the Plants workspace. Adding a choice stores it under that garden’s property.planningTray and retains the exact catalog identity on a separate planner plant record. It does not create a placement. Arrange in this bed opens the usual planting workspace with that choice selected.

Choices are unique per catalog record, garden bed and year. Removing a choice does not delete plantings. A separate plant ID prevents imported dimensions from changing existing library plants. Backups and personal-account payloads retain the tray and plant definitions using their existing schema. Account upload remains explicit. Storage failure rolls back the tray update and retains the form.

The selected year is a planning intention. New placements from these catalog choices have no invented sowing date. They retain planYear; users enter exact planting/occupancy dates through existing controls. Illustrative geometry is not an authenticated cultivar model or measured mature size. Bed area shown in the chooser is total area, not a claim of available space or suitability.

Remaining integration work includes condition-aware fit recommendations, calculated available space, first-class season objects and annual/perennial copying, and direct selection of an account save from the main-site chooser. The existing Notebook intention form remains under a secondary disclosure.

## Create a destination bed

The planning tray can create a named rectangular bed in the selected garden without leaving the crop form. Width is 2–50 feet and depth 1.5–50 feet, matching the planner’s minimum dimensions. The new bed is placed beside existing beds as an initial layout; users can adjust its position in Plan. Creation selects the new bed while preserving the crop, date, year and entered plant dimensions. It does not create a planting or upload an account copy. Explicit tray submission and placement remain separate actions.

The operation uses the planner’s storage transaction: save failure restores the prior workspace. Desktop/mobile full-page checks use synthetic accounts and cover creation in the selected garden, unchanged other gardens, failed-storage rollback, explicit planting and reload. Real authenticated synchronization remains unverified.
