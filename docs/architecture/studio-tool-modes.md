# Studio tool modes

Studio defaults to Simple, including legacy saves without a mode preference. The Tools selector switches to Advanced and persists with local saves and planner backups. It is a presentation preference, not a new garden or a different data model.

Simple retains beds, plant choice, 2D/3D, walking, the seasonal calendar, garden history, saving and backup. Advanced exposes the parcel, site and canopy tools, map layers, sunlight analysis, mapped soils, terrain and spatial interchange. Existing site features remain in the scene in both modes. The Simple helper text explains where to find maps, trees and sunlight analysis.

Switching either way ends the explicit edit session, cancels unfinished drawing and closes the drawer/inspector. Returning to Simple from a site tool selects Beds. The camera, dates, garden geometry and planting records are preserved. Users can still inspect scene features; this is progressive disclosure, not an access-control boundary.

Verification: 482 application tests pass. Candidate browser acceptance at 1280px and 390px exercised first-bed creation with tomato, switching from an unlocked site tool, unchanged beds/plantings/structures/vegetation, access to Advanced sunlight controls, preference reload and no horizontal page overflow or runtime errors. Reload applies the existing default display name to unnamed plantings. This change is not yet deployed.
