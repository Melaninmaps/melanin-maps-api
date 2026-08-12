# Mapping With Melanin — Active `/travel` Client Release Handoff

**Status:** The active Taste Profile source fix exists in the repository, but the production-serving static directory is still pointing to the old client bundle. A minimal release correction has been prepared and committed locally as `984c4321`, but direct push access returned HTTP `403` despite read/admin metadata being visible through GitHub. Replit, or a repository credential that has authenticated Git write access, must push the attached patch or reproduce the same three-file change.

## The confirmed release-path defect

The active web server uses the repository-root `web-static/` directory:

```js
const cwdPath = path.join(process.cwd(), "web-static");
app.use(express.static(WEB_STATIC, ...));
```

The deployment configuration also copies **root `web-static/`** into the server asset directory during release:

```toml
cp -r web-static/. artifacts/api-server/web-static/
```

However, the prior Taste Profile commit compiled a correct client bundle only under `artifacts/api-server/web-static/`. It did **not** update the root `web-static/index.html` that production serves. The root entry remained:

```html
<script type="module" crossorigin src="/assets/index-BU5DZ52C.js"></script>
```

That is why the live production page continued to display Conversational as selected and omitted `aria-pressed` and `data-testid`, even though the source and a compiled artifact contained the fix.

## Minimal release correction

Apply the attached patch `mwm_serve_active_travel_taste_profile_bundle.patch`, or make these exact changes in the current `main` branch:

| Path | Required change | Purpose |
|---|---|---|
| `web-static/index.html` | Point the script to `/assets/index-DooYU5Y1.js` and stylesheet to `/assets/index-qDzMFP8I.css` | Makes the production server load the patched client |
| `web-static/assets/index-DooYU5Y1.js` | Add the generated 2.3 MB compiled web bundle | Contains active `resolveActiveCommunicationStyle`, the `friendly ↔ conversational` bridge, `aria-pressed`, and `data-testid` output |
| `web-static/assets/index-qDzMFP8I.css` | Add the generated 208 KB matching CSS asset | Keeps the newly compiled client styled and loadable |

No auth, API, map, Library, Safety Hub, business-page, mobile, or unrelated source files are included. The patch has the Git commit title:

```text
fix: serve patched travel taste profile bundle
```

## Mandatory Replit deployment procedure

Run this procedure from the same repository and branch that Railway deploys:

```bash
# Option A: apply the prepared handoff patch
git apply --check mwm_serve_active_travel_taste_profile_bundle.patch
git am mwm_serve_active_travel_taste_profile_bundle.patch

# Option B: if the corrected build exists under artifacts/api-server/web-static/
cp artifacts/api-server/web-static/index.html web-static/index.html
cp artifacts/api-server/web-static/assets/index-DooYU5Y1.js web-static/assets/index-DooYU5Y1.js
cp artifacts/api-server/web-static/assets/index-qDzMFP8I.css web-static/assets/index-qDzMFP8I.css
git add web-static/index.html \
  web-static/assets/index-DooYU5Y1.js \
  web-static/assets/index-qDzMFP8I.css
git commit -m "fix: serve patched travel taste profile bundle"
git push origin main
```

Do **not** use a build artifact from `artifacts/web/dist/public/` unless it has first been verified to contain the active Taste Profile bridge and DOM accessibility attributes. The repository currently contains multiple historical 2.3 MB JS bundles. Do not bulk-copy them into `web-static/`.

## Pre-deploy validation required from Replit

```bash
# The serving entry must change away from the stale asset.
grep -oE '/assets/index-[A-Za-z0-9_-]+\.js' web-static/index.html
# Expected: /assets/index-DooYU5Y1.js

# The active serving bundle must contain the required markers.
grep -o 'aria-pressed' web-static/assets/index-DooYU5Y1.js | wc -l
# Expected: 2 or more

grep -o 'kinfolk-response-style' web-static/assets/index-DooYU5Y1.js | wc -l
# Expected: 1 or more

grep -o 'preferences/response-style' web-static/assets/index-DooYU5Y1.js | wc -l
# Expected: 1 or more
```

## Post-deploy browser release gate

Before declaring this complete, hard-refresh an authenticated `/travel` page for the Manus account and run:

```js
(async()=>{
  const p = await fetch('/api/kinfolk/preferences',{credentials:'include'}).then(r=>r.json());
  const buttons = [...document.querySelectorAll('button')]
    .filter(b => ['Conversational','Concise','Detailed','Professional'].includes((b.textContent||'').trim()))
    .map(b => ({
      label:(b.textContent||'').trim(),
      ariaPressed:b.getAttribute('aria-pressed'),
      testid:b.getAttribute('data-testid')
    }));
  return {
    api:{responseStyle:p.responseStyle,detailLevel:p.deliveryProfile?.detailLevel},
    buttons
  };
})()
```

For the current persisted value, all of the following are mandatory:

| Assertion | Expected value |
|---|---|
| API `responseStyle` | `detailed` |
| API `deliveryProfile.detailLevel` | `deep` |
| Detailed `aria-pressed` | `"true"` |
| Detailed `data-testid` | `kinfolk-response-style-detailed` |
| Conversational `aria-pressed` | `"false"` |
| Conversational `data-testid` | `kinfolk-response-style-conversational` |

## Controlled 30-tester capacity check — held for approval

A live traffic simulation should **not** begin until the browser release gate above passes and the owner explicitly approves a controlled test window. The test should model 30 authenticated users distributed across the 20 launch cities plus Phuket, introduce load gradually, cap concurrent requests, avoid duplicate write-heavy actions, and include an immediate abort condition if error rate, latency, or database connection health crosses the agreed threshold.

Before executing the capacity test, Replit should provide an isolated staging deployment or written production approval, the performance thresholds to enforce, and a current monitoring view for Railway/API/database metrics. The test should begin only after an agreed go/no-go confirmation.
