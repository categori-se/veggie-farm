# Saved garden handoff from Plan to Today

After creating, updating or restoring a current account copy, Plan offers a link to continue with that saved garden in Today. It uses the saved payload's active garden identity. Demo saves and historical restores do not offer this link. Unsaved later edits still require an explicit account update.

The link carries only save and garden IDs in its URL fragment, which is not sent in the page request. Today loads the save through the existing authenticated account client, verifies the garden belongs to that save, and only then writes the owner-scoped selection. Successful loading consumes the fragment without navigating; forgetting selection also consumes a pending handoff. An unavailable or missing garden does not overwrite the remembered selection. Signed-out visitors see a sign-in instruction without a garden request.

The existing account API controls access; identifiers do not confer access. No garden data or credentials are embedded in the link. This adds no service, background request or synchronization job. The link deliberately opens the current saved copy, not an unsaved Studio draft. Reverse navigation into the exact Studio workspace and authenticated cross-device acceptance remain incomplete.

Source browser acceptance uses synthetic account clients at desktop and phone widths. It covers save → link → exact garden → remembered selection, fragment consumption, missing gardens and signed-out requests. This is not proof of real account authentication across domains.
