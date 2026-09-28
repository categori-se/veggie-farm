# Walkthrough screenshots

[Read the visual walkthrough](README.md) · [Open the app guide](https://veggie.farm/guide)

The walkthrough uses genuine browser captures of a synthetic kitchen garden. It contains no private garden, account or parcel data. Screenshots are first-party interface captures, separate from licensed plant photographs and downloaded model assets. The current light/dark pairs are hosted at `https://veggie.farm/media/user-guide/20260927-themes/`; their bytes are not stored in Git. The earlier September 26 image URLs remain available.

The GitHub walkthrough is generated from `src/guide.md` by `node scripts/build-user-guide.mjs`. Run it with `--check` after editing the app guide to catch divergence. README links to the walkthrough instead of leaving it as an unconnected implementation page.

## Light and dark screenshots

Capture the same visible interface state twice, using the browser's light and dark color schemes. Use a fresh, anonymous browser context and synthetic records. Preserve dates, crop choices and camera framing between the pair. Do not recolor screenshots or manufacture observations. Inspect both images for clipping, legibility and private information before publication.

GitHub supports theme-specific images through [`picture` and `prefers-color-scheme`](https://github.blog/changelog/2022-08-15-specify-theme-context-for-images-in-markdown-ga/). Use the same markup on the app guide, with descriptive alternative text and the light image as a fallback:

```html
<picture>
  <source media="(prefers-color-scheme: dark)" srcset="HOSTED-DARK-CAPTURE">
  <source media="(prefers-color-scheme: light)" srcset="HOSTED-LIGHT-CAPTURE">
  <img src="HOSTED-LIGHT-CAPTURE" alt="Describe the interface and example state.">
</picture>
```

The September 27 capture set was published with owner approval on September 28: seven light/dark pairs, 14 images, 709,962 bytes. All anonymous image hashes match the capture manifest. Future theme pairs should be prepared separately from the existing published images. Do not activate new image URLs until the images have been reviewed, uploaded to the approved media host and checked anonymously. A local capture is not a published screenshot. Keep a capture manifest with theme, viewport, app origin, date, hashes and synthetic-data scope. Check source selection and decoded images in both themes, plus a narrow viewport, before replacing the previous version.

[Publication and hosted verification record](../evidence/guide-themes.json).
