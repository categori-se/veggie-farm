# Studio navigation and editing

Use **Pan** to explore without moving garden elements. It closes editing panels
and cancels unfinished bed drawing. Drag with one finger or the mouse; use +/−
to zoom, the north arrow to reset bearing, and the fit buttons to recover the
parcel, mapped features or selection. On desktop, Ctrl-drag or right-drag changes
bearing and pitch; middle-drag pans even while an editing tool is selected.

The same camera controls serve the map, 2D and 3D views. These are orbit/plan
cameras, not a first-person walking simulation. Garden geometry is separate
from camera position. Cameras reset to the parcel on reload; bed camera state
is scoped to the bed.

## Choose what to edit

- **Beds:** place and shape beds on the parcel. Select a bed and choose
  **Plan selected bed** for its dedicated planting view.
- **Plants / Flowers:** choose crops and place them in the selected bed.
- **Site:** edit non-bed structural features, including paths and their geometry.
- **Canopy:** work with trees and vegetation in parcel space rather than forcing
  them into a planting bed. Available geometry fields depend on the feature.
- **Garden:** parcel context and garden-level settings.

Only the selected tool's feature layer is editable. Inspecting a different
layer does not unlock it; use its explicit edit action. Return to **Pan** before
exploring. Trees and structural elements remain useful spatial context while
planning a bed. Hedges, vegetation polygons and paths are not interchangeable
with crop beds; preserve their feature types and geometry when editing.

On narrow screens, Pan remains in the bottom tool bar. Camera buttons have a
separate row and 44-pixel touch targets. Tool/inspector sheets have bounded
height, scrollable contents and a visible close button; opening a tool replaces
the inspector. The map remains accessible after closing the sheet.

## Verification

`scripts/check-studio-navigation.mjs` runs against a local build. It checks
mouse/touch camera motion in map, 2D and 3D views, unchanged garden geometry,
uncovered camera buttons and access to bed, site, canopy and plant tools at
portrait, landscape and desktop sizes. It requires Playwright and Chromium;
set `PLAYWRIGHT_MODULE` and `CHROMIUM_PATH` if these are outside the repository.

A future walkthrough camera should retain these explicit editing boundaries,
provide an obvious way back to an overhead view, and keep height/perspective
changes separate from tree, bed and path geometry.
