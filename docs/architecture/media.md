# Separately hosted media

No media files are part of the public source distribution: no photographs, illustrations, raster previews, font binaries, audio/video or 3D model files. Harvesting scripts and permission records remain private. Source code that draws interface icons, diagrams or procedural garden shapes is ordinary app code, not a media archive.

A site operator may serve an optional `/media-config.json` outside Git:

```json
{"version":1,"assets":{"images/illustrations/raised-bed-anatomy.webp":{"url":"https://media.example.org/raised-bed.webp","alt":"Raised bed cross-section"},"model:quaternius-tomato":{"url":"https://media.example.org/tomato.glb"}}}
```

This is a schema example, not authorization to host those assets. URLs must be HTTPS and contain no credentials, query tokens or fragments. The source build never fetches or copies the media. A missing/invalid manifest produces text alternatives and procedural planning shapes. Image loading uses no-referrer; the media host must configure CORS if GLB loading needs it.

For partner media, the owner's agreements permit the owner's use, prohibit direct attribution back to the partner, and prohibit publishing harvesting implementations. Do not infer a downstream redistribution grant. Keep acquisition records and provider identities in private provenance. A caption in the optional manifest is rendered as plain text only and is entirely operator supplied; the client adds no provider attribution. Unrelated third-party assets may impose different credit obligations and must be handled according to their own terms.

Media availability is not a paid-feature gate. Anyone can host media they are permitted to use, and both applications work without it.
