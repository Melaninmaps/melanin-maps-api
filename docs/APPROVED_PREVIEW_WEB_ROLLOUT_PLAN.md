# Approved Kinfolk Preview — Web Route Rollout

## Scope

Publish the founder-approved, cinematic Kinfolk preview suite through the existing public website route at `/preview`. The existing web aliases `/app-preview` and `/tour` already redirect to `/preview`, so they inherit the same web experience.

This rollout is **web-only**. The installed iOS and Android `/preview` screen is a separately bundled Expo route (`artifacts/mobile/app/preview.tsx`) and remains unchanged; no mobile source, build, TestFlight action, or app release is part of this rollout.

## Approved source boundary

- Source suite: the committed founder-review suite on `feature/website-preview-founder-review`, including the approved five experience paths and their supporting artwork.
- Production base: `release/waitlist-founder-notification-20261013` at `61563bed` — the branch presently connected to the public Railway `api-server` service.
- Existing app behavior: retain the current React route and aliases; replace only the iframe target and static preview assets.

## Implementation

1. Copy the already approved, self-contained HTML preview pages and only the assets they reference into `artifacts/web/public/kinfolk-preview/` without redesigning or rewriting their interaction behavior.
2. Point `ApprovedAnimatedPreview.tsx` at the local, same-origin suite entry point `/kinfolk-preview/kinfolk-preview-suite.html`. The suite remains full-viewport in the existing `/preview` route.
3. Build the existing Vite web application and synchronize its generated output to both release-serving static locations (`artifacts/api-server/web-static/` and root `web-static/`), preserving the active Railway serving contract.
4. Validate `/preview`, `/app-preview`, `/tour`, suite entry assets, and core interactive pages locally before integration.
5. Integrate only this additive website-route change into the active release branch, deploy through its existing Railway source connection, and verify the public aliases after the Railway service is healthy.

## Boundaries

- No change to native `app/preview.tsx`, native tabs, Kinfolk settings, profile behavior, API, database, business data, or release/TestFlight state.
- No deletion or replacement of non-preview website routes.
- No external capability represented by the preview becomes live product functionality through this rollout.
