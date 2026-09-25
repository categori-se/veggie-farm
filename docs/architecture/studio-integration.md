# Studio pages, domains and components

Both interfaces ship together in the community build. `src/index.md` is the gardening resource; `src/studio.md` is the complete Studio page; `src/demo.md` is its bounded account simulation. Observable Framework turns these Markdown pages into HTML. Studio is not a second server or a separately licensed closed application.

`gardenPlanner(options)` in `src/components/gardenPlanner.js` builds the planner UI. The Studio page is the composition layer: it loads public catalog/reference data and optional media, creates the surrounding controls and calls `display(gardenPlanner(...))`. A different Framework page can import the component and display it. Copy the relevant composition from `src/studio.md`, adjusting relative imports/FileAttachments for that page's location. `src/demo.md` demonstrates an alternative composition with injected in-memory storage and account behavior.

Use one planner instance per page for now. DOM IDs, styles and browser storage keys were designed around a single application instance; this is not yet an independently versioned multi-instance widget SDK. Multiple pages on the same origin share the default planner storage. Use an explicit storage adapter if isolation is required, and test its save/reload/export behavior.

## Recommended community URLs

| URL | Behavior |
| --- | --- |
| `/` | Gardening resource |
| `/studio` | Full local planner |
| `/demo` | Expiring account-save simulation |
| `/tools/my-garden` | Browser-local notebook |

This is the simplest sharing/deployment default: one build, one origin and no required accounts or paid services. The community header uses same-origin links. Build output uses `.html`; the hosting route function maps clean paths to those files. The app contains root-relative URLs and is currently intended for a domain root. Serving it at a GitHub Pages project subpath such as `/repository-name/` is not automatically supported; use a root/custom-domain deployment or perform a separate base-path refactor and acceptance test.

## Optional Studio subdomain

The owner's `studio.veggie.farm` arrangement is an example of hosting the same Studio page at a second hostname. A CloudFront viewer-request function maps that hostname's `/` to `/studio.html`. DNS, certificate aliases and CloudFront routing provide the subdomain; Framework's component code does not require it.

The separate origins have separate localStorage. Moving from `example.org/studio` to `studio.example.org` does not migrate browser gardens or notebook records. Export/import explicitly, or use a separately implemented authenticated synchronization service. For account deployments, configure both exact callback/logout URLs, CORS origins and each origin's same-origin auth configuration; never assume shared credentials/storage merely because the domains are related.

For a public community deployment, keep `/studio` canonical unless there is a specific branding or isolation reason to use a subdomain. A redirect from a convenience subdomain to `/studio` keeps one storage origin. If retaining a true separate Studio origin, compose the host rewrite with the generic clean-path routing and review navigation links back to the resource site. A CloudFront cache key must distinguish rewrites of `/` into `/index.html` and `/studio.html`.

References: [Framework project structure](https://observablehq.github.io/framework/project-structure), [Framework Markdown/components](https://observablehq.github.io/framework/markdown), and the repository's [AWS guide](../../examples/aws/DEPLOYMENT.md).
