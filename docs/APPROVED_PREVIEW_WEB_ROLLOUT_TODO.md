# Approved Kinfolk Preview — Web Route Rollout Checklist

- [x] Publish the existing founder-approved preview suite under the web application’s same-origin static path, retaining the approved suite, Everyday Life, Travel, Business Owner, Safety, and Explore experiences with their referenced artwork and interactions unchanged.
- [x] Point the existing `/preview` React wrapper to the same-origin suite entry point while retaining `/app-preview` and `/tour` alias behavior.
- [x] Build and synchronize the web output into both Railway-served static directories, preserving the active release branch’s unrelated waitlist work and avoiding all native, API, database, business-data, or TestFlight changes.
- [ ] Validate the local route aliases and the approved suite’s public-facing interaction assets; publish only the web route to the active Railway service and confirm the public aliases return the approved suite after deployment.
