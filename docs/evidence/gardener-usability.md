# Small-garden usability exercise

**Status: prepared protocol; no participant sessions or results recorded.** This is separate from automated tests and synthetic browser acceptance. The aim is to learn whether gardeners unfamiliar with Studio can create and recover a useful plan.

## Run a session

Invite 5–10 gardeners unfamiliar with the project, with their agreement to take part. Use a fresh browser profile and a synthetic practice garden; no login, home address or private garden data is needed. Explain that the interface is being tested, that they may stop, and that recording or quoting them requires separate consent. Do not publish names, contact details or raw session recordings.

Give this task without coaching the controls: “Create a bed, choose three plants, explain their spacing, look at the plan in 3D, save and export it, then return to the same garden after reloading. Restore the backup in another empty browser profile.” If WebGL is unavailable, mark 3D as unavailable and test the 2D route separately.

Start timing when the participant begins; stop when they finish or choose to stop. Record interruptions. Let them attempt the task before helping, and record each hint or intervention. A prompted completion must not be counted as unassisted.

| Step | Observable completion |
| --- | --- |
| Bed | A named practice bed exists. |
| Three plants | Three intended plantings are saved in that bed. |
| Spacing | Participant can point to the spacing information and explain what it means for their arrangement; record their explanation. |
| 3D | Participant opens 3D and recognizes the same plantings, or WebGL is recorded as unavailable. |
| Save/export | The local plan is saved and a backup file is downloaded. |
| Return/recover | Reload and backup import preserve the bed and three plantings. |

Keep raw observations outside Git. Suggested fields: anonymous session ID, date, tested release/URL, prior familiarity, browser/device/WebGL, task start/end, interruptions, each step outcome, assistance, recovery outcome, observed friction, and quote consent. Blank fields mean missing data, not success.

## Report only observed results

Report participant count, completed/attempted tasks, unassisted completions, assisted completions, incomplete sessions and unavailable steps. State the denominator and timing basis; report median completion time only for clearly identified completed sessions. Summarize recurring friction with counts, and link any resulting changes to their verification. Do not turn this small convenience sample into claims about all gardeners, adoption, yields or environmental outcomes.

Publish a short aggregate report only after sessions occur and any quoted feedback has consent. Until then, the repository's impact claims describe available functionality and reusable materials, not demonstrated gardener outcomes.
