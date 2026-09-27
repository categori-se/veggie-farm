# Photos in planting observations

The shared garden log offers Choose photo and Take photo. JPEG, PNG and WebP inputs up to 15 MB and 40 megapixels are decoded and drawn into a new canvas, then encoded as a JPEG no larger than 960 pixels on either side and 90,000 bytes. Only this copy is stored; filenames and original image metadata are not copied. Keep original photographs separately. A camera picker is a browser/device capability, not an in-app camera service.

Each observation may contain one `photo` with version, dimensions and a raster data URL. Photo-only notes are allowed. The photo is part of the same planting observation, backup and account payload; it uses existing private storage with no separate upload service or public media URL. Existing browser quotas and the 2 MiB account-save limit still apply. Failed saves retain the photo draft for retry or removal.

History renders validated raster copies and labels them by observation date and crop. Invalid imported photo records are not rendered as arbitrary URLs or markup. Existing JSON export/import and account projection preserve valid photos. Photo dates come from the entered observation date, not inferred EXIF dates.

Tests cover validation, stable planting identity, JSON/account round trips, photo-only notes, browser conversion, failed-save retention, history reload and invalid formats at desktop/phone widths. Synthetic image/account fixtures do not prove a physical mobile camera or real authenticated cross-device synchronization. Legacy standalone Notebook observations do not yet have this photo control.
