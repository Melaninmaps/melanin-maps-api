# What the Release Gate Means — Plain Language and Exact Owner Approval

## Plain-language explanation

There are currently **two different versions** of the website.

| Version | What it is | What it does at the preview URL |
|---|---|---|
| **Live production revision** `c5e6bd7729abfc64df80ab9e3a3b2aac7221491d` | The version the public domain and existing QR code use today. | `www.mappingwithmelanin.com/preview` opens the older **“See the community in motion”** guided-preview design. It does not serve the seven-panel phone-frame preview. |
| **Verified workspace revision** `a2a09eba28a87d8f90c02d9a76eff979035b7f21` | A newer working copy inside Replit. | The public Replit Preview URL serves the intended seven-panel, 21-slide phone-frame preview: the five protected original panels plus Living Library and Kinfolk AI. |

A **revision** is simply a saved snapshot of the project. Production is on one snapshot; the Replit workspace is on a later snapshot.

The correct seven-panel preview exists in the newer workspace, but that workspace is not clean. It contains **198 changed paths** compared with production. Of those, **189 are unrelated to this QR-preview request**. They include API, Kinfolk, map, mobile, library, and other web changes. If Replit published that whole workspace just to fix the preview, all of those unrelated changes could go live too.

That is exactly the type of broad, unexpected change you have been trying to prevent. The release gate blocked publication to protect you from it.

> **The good news is that the QR code itself is not the problem.** It already points to the correct permanent URL: `https://www.mappingwithmelanin.com/preview`. The problem is that production is still serving an older page at that address.

The technical wording about a **“SPA fallback”** means production cannot currently find the actual preview HTML file. Instead, it sends the website’s standard app page, and that page loads the older interactive preview code. That is why the QR URL can return “200” (the page technically loads) while still showing the wrong screen.

The safe solution is to create a **small clean release** from the currently live production version. Replit will bring in only the three files that make `/preview` load the seven-panel static preview, build only that small change, and publish it. Everything else—API, mobile app, map, Kinfolk, database, other pages, and QR image—stays exactly as it is in production.

After that clean release, the existing QR code will still open the same URL, but the URL will show the correct **seven-panel phone-frame preview**.

## The exact approval message to send Replit

Copy and send the following message exactly:

---

**Owner approval — isolated preview-only production release**

I approve **only** the isolated release described below. This approval does **not** authorize publication of the current workspace, its 198 changed paths, or any unrelated API, Kinfolk, map, mobile, library, web, database, routing, configuration, QR, or deployment changes.

### Objective

Keep the existing QR code and its existing destination unchanged:

`https://www.mappingwithmelanin.com/preview`

Make that exact production URL serve the verified **seven-panel, 21-slide phone-frame preview** now present in workspace revision:

`a2a09eba28a87d8f90c02d9a76eff979035b7f21`

The public production URL must **not** show the older interactive preview whose hero says:

> “See the community in motion.”

### Mandatory isolated-release procedure

1. Start from the **currently live production revision only**:

   `c5e6bd7729abfc64df80ab9e3a3b2aac7221491d`

2. Create a new, clean, temporary release branch or release revision from that production revision. Do **not** deploy the existing workspace directly. Do **not** merge or cherry-pick all workspace changes.

3. Bring forward only these three source files from workspace revision `a2a09eba28a87d8f90c02d9a76eff979035b7f21`:

   ```text
   artifacts/web/public/approved-preview-8-5.html
   artifacts/web/src/features/preview/ApprovedAnimatedPreview.tsx
   artifacts/web/src/pages/preview.tsx
   ```

4. Build the web app from that isolated release. The only additional changed files allowed are the **directly generated web build-output files** created by this build.

5. Do **not** change, add, delete, or deploy any other source file. In particular, you are not authorized to change:

   ```text
   artifacts/web/src/App.tsx
   any API or Kinfolk source
   any map, library, travel, or legacy preview component
   any mobile source or artifact
   any database schema or migration
   any environment variable or deployment configuration
   the QR image or QR URL
   any route other than preserving the existing /preview route
   the existing five protected preview panels
   ```

6. Do **not** replace the preview with PreviewTour, OutcomeLedPreview, VisitorStory, the old four-card version, an interactive canvas, a redirect, or a new URL. The existing `/preview` route must continue through `ApprovedAnimatedPreview` to the static artifact.

### Required source and artifact checks before deployment

Do not deploy until every item below passes and the command output is provided.

| Check | Required result |
|---|---|
| Base revision | The isolated release begins from `c5e6bd7729abfc64df80ab9e3a3b2aac7221491d`. |
| Source scope | Before build, `git diff --name-only c5e6bd7729abfc64df80ab9e3a3b2aac7221491d` contains only the three permitted source files listed above. |
| Protected panels | The first five original preview panels in `approved-preview-8-5.html` are unchanged from the protected baseline. |
| Seven-panel artifact | `sha256sum artifacts/web/public/approved-preview-8-5.html` equals exactly `acc09ec56a04c5c6d34a12fe202b288a267b68d1ed2eaf3e2a3e4d9a5a10ec9f`. |
| Panel count | The artifact contains exactly `7` `preview-card` elements and exactly `21` `preview-slide` elements. |
| Route source | `artifacts/web/src/pages/preview.tsx` exports `ApprovedAnimatedPreview`; it does not import or render PreviewTour or any older preview component. |
| Post-build scope | After the web build, the only additions beyond the three permitted source files are build files directly generated by that exact web build. |
| Build | The isolated web production build passes. |

If **any** extra non-generated source file appears in the diff, stop immediately. Do not make a workaround, do not broaden scope, and do not deploy. Report the file list and wait for a new owner approval.

### Required public production checks after deployment

Do not call this complete until all of the following pass from the public domain, not only local development.

```bash
# Existing QR destination must remain the canonical production URL and return 200.
curl -sS -L -o /dev/null -w 'status=%{http_code}\nurl=%{url_effective}\n' \
  'https://www.mappingwithmelanin.com/preview'

# Production must expose the actual static seven-panel artifact, not SPA fallback HTML.
curl -sS --max-time 90 \
  'https://www.mappingwithmelanin.com/approved-preview-8-5.html' \
  -o /tmp/production-approved-preview-8-5.html
sha256sum /tmp/production-approved-preview-8-5.html
grep -c 'class="preview-card"' /tmp/production-approved-preview-8-5.html
grep -c 'class="preview-slide"' /tmp/production-approved-preview-8-5.html
```

The required public results are:

```text
https://www.mappingwithmelanin.com/preview → HTTP 200
artifact SHA-256 → acc09ec56a04c5c6d34a12fe202b288a267b68d1ed2eaf3e2a3e4d9a5a10ec9f
preview-card count → 7
preview-slide count → 21
```

Also capture a public desktop and mobile rendering of the exact production URL to confirm that it is the phone-frame preview with the five protected original panels followed by Living Library and Kinfolk AI. It must not show the “See the community in motion” interactive layout.

### Failure rule

If any check fails, roll back to production revision:

`c5e6bd7729abfc64df80ab9e3a3b2aac7221491d`

Then report the failed check and the exact files in the isolated release. Do not attempt another release or any redesign unless I explicitly approve it.

### Completion statement required

When all checks pass, reply with the following statement and attach the command outputs, changed-file list, final release revision, and public desktop/mobile captures:

> “The existing QR code destination `https://www.mappingwithmelanin.com/preview` now serves the verified seven-panel, 21-slide phone-frame preview. The production static artifact SHA-256 is `acc09ec56a04c5c6d34a12fe202b288a267b68d1ed2eaf3e2a3e4d9a5a10ec9f`. No QR image, API, Kinfolk, mobile artifact, map, library, database, route outside `/preview`, configuration, or unrelated source file was changed.”

---

## What you are approving—and what you are not

| You are approving | You are **not** approving |
|---|---|
| A small clean release based on the version that is already live. | Publishing the whole newer Replit workspace. |
| The seven-panel preview at the old QR destination. | A new QR code or a new URL. |
| Exactly three preview files plus generated build output. | The 189 unrelated changes, including API, mobile, map, Kinfolk, database, and other web work. |
| Public proof before Replit declares it complete. | A verbal assurance based only on local development. |
| Rollback if a check fails. | A workaround, redesign, or widened scope without your written approval. |
