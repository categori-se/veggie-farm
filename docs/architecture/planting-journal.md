# Planting-linked garden history

Studio’s **My garden · Log** workspace projects the active garden’s existing beds and planting IDs into a garden home. It never reads another domain’s local storage or imports another account’s Notebook. It is the first shared-identity foundation, not a completed merger of the Notebook and Studio services.

Quick Log selects a specific planting and defaults to today. Events include sowing, transplanting, emergence, flowering, fruit set, harvest, watering, pests, possible disease, frost damage, bolting, end of planting, and a note. The selected placement is preselected where available. Optional harvest quantity supports count, g, oz, lb and kg, plus quality. Notes are plain text, capped at 2,000 characters; each planting accepts at most 1,000 events without silent pruning.

Each observation stores its own ID, planting ID, catalog plant ID at recording, calendar date, recording timestamp and explicit gardener-observation source. Logging does not alter planned planting or removal dates and does not unlock spatial editing. A storage failure retains the form and rolls back the in-memory append so a retry cannot silently duplicate an event.

The year filter applies to observed events. Planned dates remain labeled separately. Weight totals convert to kilograms; item counts and harvest events without quantity remain separate. Missing quantities are never treated as zero yield. Displayed totals represent recorded harvest, not complete production. Current workspaces can include plans spanning multiple years; full season-specific plan identities and next-year cloning are still required.

Observations reside on the existing placement records, travel with garden backups, and survive the existing personal-account payload projection. Public example history remains excluded from account garden exports under existing rules. This increment does not copy observations into Notebook or claim cross-domain synchronization. Photos, observation correction/deletion, Notebook reconciliation and a unified account garden selector remain unfinished.

## Common observation shortcuts

The shared garden log offers explicit buttons for germination, transplanting, flowering, harvest, pests, watering, frost damage and notes. They select the existing event type without saving or recreating the form, so the selected planting/date and entered notes, harvest values and photo remain intact. Harvest focuses quantity; Note focuses the note field. The complete event selector remains available and keeps the buttons’ pressed state synchronized. Save remains explicit, with the existing account/local failure handling and independent planned dates. The same component serves My Garden, Journal, Today’s garden prompts and Studio.

## Unsubmitted observation drafts

Each open garden-log window keeps a separate in-memory draft per stable planting ID. Plant, bed, year and workspace changes retain event/date, notes, harvest fields and the prepared photo. New contexts do not inherit another planting’s unsaved values. Today’s suggested type fills an empty event choice; it does not replace a chosen type.

Saving captures the target ID and inputs, disables that draft while pending, and clears only its draft on success. Failed saves retain the draft and error. Completing a save while another planting is being edited does not erase that other draft. Asynchronous photo completion updates the original draft rather than the currently selected plant. These drafts are scoped to the open window and are cleared on close; they are not persisted, uploaded, or shared across account sessions. Save before closing or leaving the page.
