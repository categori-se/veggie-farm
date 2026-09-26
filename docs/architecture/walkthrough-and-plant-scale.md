# Walking, bed planning and plant scale

Studio’s Walk through workspace starts beside the selected bed at a 66-inch eye height. Keyboard steps are 12 inches (6 inches for repeated keys); turns are 5 degrees. Wheel travel is proportional to scroll input and limited to 36 inches per second during sustained scrolling. Dragging turns the view. These are navigation controls, not geometry edits.

Click a bed or one of its plants to open its planting workspace. The plant library opens, while existing geometry remains locked. Back to walk restores the previous position and heading for that garden. A drag beyond five pixels does not open a bed.

The 3D plant library is available above the canvas and within the Plants tool. It offers a searchable preview, a six-foot human reference, and selection for the current bed. Mature height and crown width use catalog dimensions. Unknown height is explicitly shown as an 18-inch preview fallback. Imported models and procedural forms use the same physical units as the beds; these are representative forms, not surveyed reconstructions.

The preview size slider is bounded to 5–100% of mature dimensions and does not change a planting. A selected planting’s **Size through the season** editor saves an explicit start date, full-size date, starting percentage, and reference or assumption. Date preview interpolates the dimensions within those bounds. This is a geometric scenario, not a prediction of biological growth. Mature spacing checks remain unchanged. Catalog values do not establish cultivar-specific minimum and maximum sizes where those data are absent.

Buildings retain recorded height estimates where provided and existing illustrative fallbacks otherwise. Specimen-tree symbols now respect their recorded height estimate (20 feet if absent). This does not turn illustrative public gardens into field-verified models.

## Esri references reviewed

[Generating 3D vegetation in ArcGIS Pro](https://resources.esri.ca/arcgis-pro/generating-3d-vegetation-in-arcgis-pro) describes using species, height, trunk diameter, real-world units and grounded placement. Those principles inform our dimension handling.

[Open 3D Trees](https://www.arcgis.com/home/item.html?id=1bb46484c2174872a46507c60781175c) is an Esri scene service derived from geographic source features, rather than a freely reusable individual-model pack. [3D Vegetation — Low Poly](https://www.arcgis.com/home/item.html?id=ab539371054b437081926736a0969c11) is a PDF style reference. Both item records cite the Esri Master License Agreement. No model binaries were copied from these references. Self-deployers supply their own appropriately licensed assets; procedural previews work without them.
