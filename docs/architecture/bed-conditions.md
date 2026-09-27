# Bed conditions

My Garden → Garden context & storage includes a bed-specific form for recorded direct sun, soil description/drainage and dated soil temperature. Records use stable bed IDs under `property.bedConditions`; they preserve garden-wide profile links, soil reports, map geometry and planting identities. Blank inputs remain unknown. Editing a record replaces its current conditions; this is not a measurement history. Use soil reports and observations for historical evidence.

Studio saves through its existing local save and rollback path. Account gardens use revision-checked updates. Failed saves retain form values; switching beds retains pending drafts while the dialog remains open. Closing the dialog discards unsaved drafts.

Today’s Conditions for selector uses the chosen bed’s own temperature record, never another bed or the garden profile as a fallback. Garden-wide frost dates still apply. Only a same-day, dated reading within the existing control range enters guidance; stale/future/undated readings remain excluded. Direct sun is displayed as recorded context, not a new light suitability recommendation. Local scenario edits in Today do not overwrite saved records.

Real account synchronization, seasonal light measurements and an integrated light/soil suitability assessment remain separate acceptance work.
