# MWM v4 Live Preview Findings

**URL tested:** https://ac64a230-72f5-4194-b8b4-3ca827a772f9-00-ufj5aspnoap8.riker.replit.dev/

## Results

- `GET /api/healthz` returned **404 Not Found**.
- `POST /api/auth/login-email` returned **404 Not Found**.
- `GET /` returned **302 Found** and redirected to `/__mockup`.
- `/__mockup` loaded a **Component Preview Server** page, not the Mapping With Melanin application.
- The page states that it renders individual component previews at `/__mockup/preview/ComponentName`.

## Audit consequence

The supplied v4 URL cannot support the requested live audit of 30 tester accounts, map search, library, KinfolkAI, flywheel actions, or business-owner features. The v4 package therefore contains a stale or incorrect deployment URL, or the current Replit preview is pointed at a component mockup server rather than the application server. No live pass/fail results should be reported until Replit supplies a functioning application URL whose health and authentication endpoints respond as documented.
