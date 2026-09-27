# Saved garden handoff from Plan to Today

After creating, updating or restoring a current account copy, Plan offers a link to continue with that saved garden in Today. It uses the saved payload's active garden identity. Demo saves and historical restores do not offer this link. Unsaved later edits still require an explicit account update.

The link carries only save and garden IDs in its URL fragment, which is not sent in the page request. Today loads the save through the existing authenticated account client, verifies the garden belongs to that save, and only then writes the owner-scoped selection. Successful loading consumes the fragment without navigating; forgetting selection also consumes a pending handoff. An unavailable or missing garden does not overwrite the remembered selection. Signed-out visitors see a sign-in instruction without a garden request.

The existing account API controls access; identifiers do not confer access. No garden data or credentials are embedded in the link. This adds no service, background request or synchronization job. The link deliberately opens the current saved copy, not an unsaved Studio draft. Reverse navigation into the exact Studio workspace and authenticated cross-device acceptance remain incomplete.

Source browser acceptance uses synthetic account clients at desktop and phone widths. It covers save → link → exact garden → remembered selection, fragment consumption, missing gardens and signed-out requests. This is not proof of real account authentication across domains.

## Return to Plan

The saved garden card offers Open this garden in Plan even for an empty garden. The same destination is used inside garden history. Studio authenticates the requested copy and validates the garden before showing a restore confirmation. The confirmation names the garden and makes clear that this restores the full account copy and replaces local personal gardens; local demo edits remain. Cancelling does not call restore. A missing garden or changed account cannot restore. The requested workspace and its top-level fields are activated together, avoiding a mismatch with the save's previously active garden.

Signed-out arrivals retain their fragment in the sign-in return destination. This is explicit account-copy restoration, not automatic synchronization or a merge of unsaved local edits. After cancellation or successful restore, the fragment is consumed. Real authenticated cross-device verification remains outstanding.

## Missing destination recovery

If an account copy no longer contains the linked garden or bed, validation leaves the local workspace untouched. The planning tray retains the crop and planned date and offers either a return to Account saves to retry, or Choose another garden. Choosing another destination explicitly consumes only the garden handoff identifiers, preserves the crop fragment, and starts with empty garden and bed selectors. Cancelling a restore uses the same explicit destination selection. Nothing is planted by recovering the link; dimensions, destination and placement still require user actions. Successful retry selects the originally linked bed.

Component and full-page browser checks cover desktop and phone widths with synthetic account data, including Today → missing bed → another local bed → explicit placement → reload. This is not verification of real authenticated synchronization.
