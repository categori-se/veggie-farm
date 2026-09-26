# Linking existing Notebook records to a garden

On My Garden, load an account save and choose a garden. Open **Link older notebook observations**, load the saved notebook, select a source observation and destination planting, review the original crop/variety/bed, and explicitly confirm the association. The original Notebook is never modified. The garden receives a linked copy with a source observation ID, Notebook revision and original descriptive fields.

Each source note may be linked once within an account save. This prevents counting one recorded harvest against multiple plantings in the same save. A link can be removed before assigning the note elsewhere. Removing a link deletes only that linked copy from the garden; ordinary garden observations and the original Notebook note are preserved. A copied harvest without quantity remains an unmeasured harvest event.

The saved Notebook profile may also be explicitly associated with the selected garden. Only known context fields are copied into `property.gardenContext`; missing or invalid values remain unknown, and no frost dates or light measurements are invented. Existing garden context cannot be silently overwritten. Removing the association leaves the original profile and garden geometry unchanged. This saved copy does not automatically follow later Notebook edits. It survives normal garden backup/account payloads because the existing property object is retained.

Both operations use the account save’s revision check and owner guards. Loading another account/save clears the cached Notebook to prevent cross-owner linking. Conflicts retain the form and require reload. The interface reads saved account notes, not unsent browser drafts. The Notebook profile, plans, actions and soil reports are not bulk-migrated or automatically matched.

The main-site garden home shows the linked conditions and observation provenance. Studio retains these fields on import, but its older deployed garden-home module may not yet display the new context section. Main-site browser acceptance uses mocked account responses; no real authenticated-account write is claimed by that test.
