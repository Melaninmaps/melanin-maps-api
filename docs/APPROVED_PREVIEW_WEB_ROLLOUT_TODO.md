# Approved Kinfolk Preview — Web Route Rollout Checklist

- [x] Publish the existing founder-approved preview suite under the web application’s same-origin static path, retaining the approved suite, Everyday Life, Travel, Business Owner, Safety, and Explore experiences with their referenced artwork and interactions unchanged.
- [x] Point the existing `/preview` React wrapper to the same-origin suite entry point while retaining `/app-preview` and `/tour` alias behavior.
- [x] Build and synchronize the web output into both Railway-served static directories, preserving the active release branch’s unrelated waitlist work and avoiding all native, API, database, business-data, or TestFlight changes.
- [x] Validate the local route aliases and the approved suite’s public-facing interaction assets.
- [x] Open every suite journey card in the top-level browser document, rather than leaving a visitor inside the `/preview` iframe. This retains the approved full-screen experience while making Everyday Life, Travel, Business Owner, Safety, and Explore navigation usable from the public suite.
- [ ] Publish the corrected top-level suite navigation to the active Railway web service and confirm the public aliases return the approved suite after deployment.
