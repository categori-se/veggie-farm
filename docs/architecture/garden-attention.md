# Garden attention from planting records

My Garden shows date-based prompts for the active year, scoped to the selected bed. The same component serves Studio and explicitly loaded account gardens. It reads the current workspace; it creates no background jobs, weather requests or additional account services.

Prompts identify the exact planting and bed. They cover planned starts within seven days, entered harvest estimates, planned endings, missing completion records and a fourteen-day observation gap. Invalid date ranges request review. Unknown dates remain unknown. A recorded planting end suppresses reminders. Foreign, changed-crop and future observations do not suppress today's prompts.

“Why this appears” explains the dates and rule behind each prompt. Planned completion never proves that space is empty; a harvest estimate never proves ripeness. Observation intervals are journal reminders, not watering or care instructions. Weather, soil and light suitability are not evaluated here.

Logging selects the associated planting without changing planned dates or geometry. Event type requires an explicit choice, except that Record a harvest selects Harvested. Save failures retain entered fields. Successful saves refresh the prompts through the existing local/account persistence callback. Open bed returns to the existing planning workflow.

Verification: pure helper tests cover identity, date boundaries, entered estimates, unknown values, observation matching and plan/actual separation. Desktop and mobile component acceptance covers failed saves, required event choice, historical years, bed filtering, contextual harvest and reload. Full Studio acceptance creates a practice garden, logs its actual transplant, verifies the prompt disappears, preserves planned dates/geometry and reloads the record. Live deployment is recorded separately in launch status.

Still incomplete: a personalized main-site Today page, condition-aware actions, weather integration, unified garden selection and authenticated cross-device acceptance.
