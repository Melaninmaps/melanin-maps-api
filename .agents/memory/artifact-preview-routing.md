---
name: Artifact preview routing
description: How root web preview forwarding interacts with legacy port mappings and visual verification tools.
---

## Rule

For this multi-artifact workspace, the root web service must own the sole legacy external port-80 mapping when the application router is not forwarding managed artifact paths. Do not map the mockup sandbox to port 80.

**Why:** The web and API services can be fully healthy on their local ports while the public development domain returns 502 for `/`, `/map`, and canonical place routes. In that state, browser evidence is impossible even though curl to the listeners succeeds. Giving port 80 to the root web service restores public preview reachability.

**How to apply:** If public preview fails, first verify the direct web/API listeners, then inspect the root port mappings for conflicting port-80 ownership. Use the validated `.replit` replacement flow. Do not declare visual verification complete if the screenshot adapter or a real browser remains unavailable after routing is restored.