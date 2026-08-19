# Owner Authorization — Stage 1 Only: Apply ATL Music Preview Patch, Do Not Deploy

I authorize **Stage 1 only** of the ATL music preview update.

Apply `preview-kinfolk-atl-music.patch` from `mwm-replit-preview-kinfolk-atl-music-patch.zip` to the current seven-panel preview artifact **only if** the following preflight is an exact match:

```text
File: artifacts/web/public/approved-preview-8-5.html
SHA-256: acc09ec56a04c5c6d34a12fe202b288a267b68d1ed2eaf3e2a3e4d9a5a10ec9f
preview-card count: 7
preview-slide count: 21
```

The only authorized source edit is the markup/copy inside the existing Panel 7:

```text
artifacts/web/public/approved-preview-8-5.html → #card-kinfolk only
```

Replace the current three-slide hair-care example with the supplied three-slide ATL music Community Intelligence example. Do not add a panel or component. Do not change any other preview panel.

Do **not** change CSS, JavaScript, the 3.5-second cycle engine, preview route/wrapper, iframe behavior, QR URL/destination, waitlist, Living Library panel, the original five protected panels, live Kinfolk code, mobile, API, database, configuration, build profiles, or deployment settings.

**Do not deploy, publish, submit, or release anything in Stage 1.**

Before asking me for deployment approval, return all of the following:

```bash
git diff --name-only
git diff --stat
git diff -- artifacts/web/public/approved-preview-8-5.html
grep -c 'class="preview-card"' artifacts/web/public/approved-preview-8-5.html
grep -c 'class="preview-slide"' artifacts/web/public/approved-preview-8-5.html
grep -n 'CYCLE_INTERVAL_MS = 3500' artifacts/web/public/approved-preview-8-5.html
sha256sum artifacts/web/public/approved-preview-8-5.html
```

The result must prove:

| Check | Required result |
|---|---|
| Changed source files | Exactly one: `artifacts/web/public/approved-preview-8-5.html` |
| Changed content | `#card-kinfolk` only |
| All other panels | No change, including the first five protected panels and Living Library panel |
| Preview structure | 7 panels and 21 slides remain |
| Animation | Existing `CYCLE_INTERVAL_MS = 3500` unchanged |
| Post-patch SHA-256 | `8aed162ca668a2889a69e68705f1912bbd9736e9ba311f64b9a0786887eb5b7a` |

If any check differs, stop and report the difference. Do not broaden scope, work around the check, or deploy.
