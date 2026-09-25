---
title: Plant report
toc: false
---

```js
import {plantReport} from "../components/plant-report.js";
display(await plantReport(new URLSearchParams(location.search).get("id")));
```
