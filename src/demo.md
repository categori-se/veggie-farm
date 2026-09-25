---
title: "Try an account sandbox"
toc: false
---

# Try an account sandbox

Explore Studio editing and simulated account saves without signing up. This demo uses the real planner and account-save controls, with an isolated in-memory service. It is **not a real signed-in account**. No credentials, cloud writes or shared user data are involved.

The session lasts 15 minutes, holds at most 3 account copies and 4 versions per copy, uses at most 512 KiB of saved demo data, and permits 60 account operations. Requests must be at least 250 ms apart. Closing or reloading the page clears everything. Do not enter personal information. Sharing, invitations, external maps and imports are unavailable here.

```js
import {gardenPlanner} from "./components/gardenPlanner.js";
import {createAccountSandbox} from "./lib/demo/sandbox.js";
const fixture = await FileAttachment("./data/community-garden.json").json();
const sandbox = createAccountSandbox();
const controls = document.createElement("div");
const reset = document.createElement("button");reset.textContent="Reset demo";
reset.onclick=()=>{sandbox.close();location.reload();};controls.append(reset);display(controls);
const planner=gardenPlanner({initialState:fixture,storage:sandbox.storage,accountAdapter:{client:sandbox.client,session:sandbox.session,demo:true},sandbox:true});
// No imports or remote lookup actions are offered by this bounded demonstration.
for(const node of planner.querySelectorAll('input[type=file],[data-action="import-spatial"],[data-role="restore-backup"],[data-role="start-practice-garden"]'))node.hidden=true;
planner.addEventListener('click',event=>{const target=event.target.closest('button');if(target&&/map|parcel|public demo|reference|lookup|look up|new garden|copy garden/i.test(target.textContent)){event.preventDefault();event.stopImmediatePropagation();}},true);
display(planner);
const expiry=setTimeout(()=>{sandbox.close();planner.inert=true;planner.replaceChildren(document.createTextNode('This demo has expired. Reset to begin again.'));},15*60*1000);
invalidation.then(()=>{clearTimeout(expiry);sandbox.close();});
```

[Use the full local Studio](/studio) · [Explore gardening guides](/)
