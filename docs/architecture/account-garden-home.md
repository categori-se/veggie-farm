# Shared saved garden home

The main-site My Garden page can explicitly open a Studio account save, select one of its personal gardens, and use the same garden home and planting journal. It reads and updates the existing `/plans` API rather than copying private Studio local storage into Notebook. The selected account save and garden remain explicit; legacy Notebook profile and observations are left unassigned.

The session preserves stable garden, bed, planting and observation IDs. On log, it clones the selected save, appends an observation to only the selected garden, refreshes the active-workspace mirror through the existing account payload function, and submits the current revision. Other gardens, saved versions and planned dates are preserved. Local cached data changes only after a successful response.

A revision conflict leaves the form and note intact and blocks retry until reload. Simultaneous submissions are rejected. Owner changes clear the displayed garden and invalidate outstanding reads; private data is not written to unscoped browser storage. Network failures are reported without claiming success. The existing cloud request size limit still applies.

The shared garden-home form supports asynchronous persistence and reports the correct local-draft or account-save result. Local community deployments link to their own `/studio` instead of offering an unavailable account service.

This connects the same saved plan and its journal across the site and Studio. It does not yet reconcile legacy Notebook observations or its single profile, automatically open a selected account bed in Studio, or synchronize unsaved Studio drafts. Those remain part of the active goal. Tests cover selected-garden isolation, conflicts, owner changes, delayed responses and double submits; browser tests use a mocked service and must not be described as real authenticated hosted acceptance.
