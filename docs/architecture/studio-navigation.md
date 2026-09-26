# Studio navigation and editing

Use **Pan** to explore without moving garden elements. It closes editing panels
and cancels unfinished bed drawing. Drag with one finger or the mouse; use +/−
to zoom, the north arrow to reset bearing, and the fit buttons to recover the
parcel, mapped features or selection. On desktop, Ctrl-drag or right-drag changes
bearing and pitch; middle-drag pans even while an editing tool is selected.

The same camera controls serve the map, 2D and 3D views. Aerial views use orbit/plan
cameras; the eye-level walking preview is described below. Garden geometry is separate
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

## Structural planting palette and camera

Open **Canopy**, choose Deciduous tree, Evergreen tree, Shrub, Hedge mass or
Canopy area, then click the map. The inspector edits that parcel-space object;
Escape cancels placement. Default sizes and heights are illustrative estimates,
not species identification or measured observations. Hedge masses are area
placeholders; they do not trace a hedge line. This compact select-and-place
workflow draws interaction inspiration from [Sweet Home 3D](https://www.sweethome3d.com/SweetHome3DJSOnline.jsp), without importing its code or model catalog.

**Camera** starts collapsed. Open it for heading, tilt, north/overhead reset,
fit controls and **Save 3D image** (PNG). The 2D plan and aerial 3D camera share
heading and garden coordinates; the perspective projection changes depth, not
handedness. A projection regression test covers seven compass headings.

Choose **Walk at eye level** in the 3D angle selector to land at the current
view center. Drag to look; with the canvas focused, W/S or up/down steps four
feet, A/D or left/right turns. Touch users can open Camera for step/turn buttons.
Choose Oblique/Overhead/Low angle to return to orbit; Escape on the canvas also
exits walking. This is a flat-surface 5½-foot eye-height preview, bounded by the
parcel view extent, without obstacle collision or terrain following. It does
not alter garden records. Walking is for garden context; entering a bed view
or another garden exits it.

The Studio brand and **← veggie.farm** return to the gardening resource. The
resource header features **Studio** on desktop and directly in mobile navigation.
Self-hosted community builds use local paths for both destinations.
