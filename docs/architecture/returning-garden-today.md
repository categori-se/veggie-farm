# Returning to a selected garden on Today

Today and Notebook share the account garden selector. An explicit garden selection remembers only its save and garden identifiers under the signed-in owner's browser key. It does not cache the garden, its name or observations. Returning to either page makes one load request for that save, then restores the selected garden if it still exists. Lists and additional pages load only on request.

Today displays up to three planting-record prompts from that garden and opens the exact planting in Quick Log. Successful account logging updates the prompt summary; failed saves retain the form. Forget garden selection clears the browser preference without deleting the account garden. Storage failure does not prevent manual selection.

Owner changes clear the visible garden and loaded session before another owner's remembered selection can load. Responses remain guarded by owner identity and request generation. A failed load does not show stale garden data, and the Load saved gardens action provides recovery. Anonymous visitors make no automatic garden request.

The component uses existing account read/update services and existing optimistic revision checks. No background AWS job or new service is introduced. The component's local session-change checks do not poll the network. The static deployment mounts the same component on Today as the source Observable cell.

Verification uses owner-isolated selection unit tests and real browser modules with an injected synthetic account client at desktop/mobile widths: return visit with one load, exact planting log, failed save, owner switch, failed restore, retry, forget without deletion and Today mounting. This does not prove authenticated cross-device behavior against a real account.

Remaining: homepage personalization, a selector shared with Studio across domains, account-wide preferences, and applying the selected garden's conditions to the planting calculator. The calculator remains explicitly labeled with its own Notebook/starter settings; record-based prompts do not claim weather or horticultural suitability.
