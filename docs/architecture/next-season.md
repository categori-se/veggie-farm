# Start next year in the same garden

My Garden → Plan next year reviews plantings overlapping the selected year, including undated records. It preserves the same garden, beds, structures, site geometry and conditions.

Each planting has three explicit choices:

- Leave it as it is: no dates or records change.
- Keep growing: retain its identity and observation history, clearing its planned end. A recorded finished planting cannot continue; repeat it instead.
- Repeat: create a new planting at the same position, with reviewed next-year start/end dates and a link to the previous planting. Observations, harvest totals, harvest estimates and size scenarios are not copied. The original's planned last day must precede the new start.

Only an explicit catalog perennial life cycle suggests Keep growing; other plantings start as Leave. All choices are reviewable. Date suggestions shift the previous dates by one year, clamping February 29 to February 28. They are not seasonal suitability recommendations. Existing spacing and date-preview tools remain the place to review the repeated layout.

A `property.seasonPlans` record identifies the target year, source year, new planting IDs and continuing IDs. A second creation for the same year is refused. Source observations and original planting IDs remain intact. This is a new plan within the same garden, not a copied garden or an observed growing season.

Studio saves the transition through its existing browser-local workspace save. Failure restores the previous state and leaves the review form open. Export/account backup uses the existing workspace payload. The account-loaded Notebook currently links users to Plan; authenticated cross-device next-year creation still needs acceptance.

Verification covers explicit selection, date validation, leap years, independent identities, prior harvest history, persistent infrastructure, finished perennials, duplicate season protection and input nonmutation. Browser acceptance covers the actual first-plan → observation → next-year → save failure → retry → reload journey at desktop and phone widths. Deployment and hosted evidence are tracked separately in launch status.

Remaining: dedicated season switching across all pages, multi-year outcome comparisons, richer perennial lifespan controls, account-native next-year review and the full annual learning loop.
