---
name: Artifact preview routing
description: How root web preview forwarding interacts with legacy port mappings and visual verification tools.
---

## Rule

For this multi-artifact workspace, the root web service must own the sole legacy external port-80 mapping when the application router is not forwarding managed artifact paths. Do not map the mockup sandbox to port 80.

**Why:** The web and API services can be fully healthy on their local ports while the public development domain returns 502 for `/`, `/map`, and canonical place routes. In that state, browser evidence is impossible even though curl to the listeners succeeds. Giving port 80 to the root web service restores public preview reachability.

**How to apply:** If public preview fails, first verify the direct web/API listeners, then inspect the root port mappings for conflicting port-80 ownership. Use the validated `.replit` replacement flow. Do not declare visual verification complete if the screenshot adapter or a real browser remains unavailable after routing is restored.

## Artifact-manifest recovery

Any malformed artifact manifest can prevent the artifact router from loading the entire workspace route map, including otherwise healthy root web routes. The normal manifest validator may be unable to replace an invalid current file because it parses that file before applying the candidate.

**Why:** Local Vite can return HTTP 200 while the Replit proxy still routes root traffic to the mockup sandbox and returns 404 for web subroutes. The failure is router configuration, not an SPA fallback.

**How to apply:** Preserve a backup, recover only the known-valid TOML portion through an explicitly authorized filesystem recovery, then validate the repaired manifest. If the external proxy retains a legacy binding after the router can parse all artifacts, treat it as a Replit preview-service state issue; do not alter preview source to work around it.