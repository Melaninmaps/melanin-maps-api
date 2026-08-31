# Replit Instruction — Publish the Verified Seven-Panel Preview at the Existing QR URL

**Owner priority:** The existing QR code already resolves to `https://www.mappingwithmelanin.com/preview`. Do **not** create a new QR code, a new destination URL, a redirect, a second preview route, or a parallel preview implementation.

The only required outcome is that the existing QR destination, **`https://www.mappingwithmelanin.com/preview`**, renders the verified seven-panel public preview currently served at the Replit Preview URL:

`https://ac64a230-72f5-4194-b8b4-3ca827a772f9-00-ufj5aspnoap8.riker.replit.dev/preview`

## What is currently wrong

The QR destination is no longer a 404; it currently returns HTTP 200. However, its production bundle still contains the older interactive/guided-preview implementation whose visible hero begins:

> “See the community in motion.”

That is the layout shown in the owner’s screenshot. It is **not** the owner-approved phone-frame preview, and it must not be represented as the approved 8/5 layout.

The Replit Preview URL instead serves the intended public artifact at `/approved-preview-8-5.html`. Its current verified signature is:

| Required property | Verified public-Replit value |
|---|---|
| Artifact URL | `/approved-preview-8-5.html` |
| SHA-256 | `acc09ec56a04c5c6d34a12fe202b288a267b68d1ed2eaf3e2a3e4d9a5a10ec9f` |
| Phone-frame panels | `7` |
| Auto-cycling demonstrations | `21` |
| Panel sequence | Original five protected panels, then **Living Library**, then **Kinfolk AI** |
| Slide cycle | `3.5 seconds` |

The production server currently sends its SPA HTML document, rather than this static preview artifact, when asked for `/approved-preview-8-5.html`. That is proof that production is still deploying a different preview implementation or is omitting the static artifact from its published web build.

## Required action — deployment promotion only

**Promote the exact current Replit web revision that serves the verified seven-panel artifact to production.** This is a production publication task, not permission to redesign, rebuild, merge, migrate, or refactor the preview.

The expected production route chain after publication is:

```text
Existing QR code
  → https://www.mappingwithmelanin.com/preview
  → existing React /preview route
  → ApprovedAnimatedPreview wrapper
  → /approved-preview-8-5.html
  → seven-panel, 21-slide phone-frame preview
```

The existing QR graphic remains valid because its destination URL does not change.

## Absolute scope lock

Before making any action, report the exact deployment revision and exact source files that differ between the currently live production web build and the verified Replit web build. **Stop and ask for owner approval if the differing source scope exceeds the allowlist below.**

| Permitted source scope | Rule |
|---|---|
| `artifacts/web/public/approved-preview-8-5.html` | This must be the seven-panel, 21-slide artifact with the required SHA-256 above. Do not alter its first five protected panels while promoting it. |
| `artifacts/web/src/features/preview/ApprovedAnimatedPreview.tsx` | Inspect only. It may be included in the deployment only if it already wraps the static artifact full-height and passes query parameters through. Do not redesign or rewrite it. |
| `artifacts/web/src/pages/preview.tsx` | Inspect only. It may be included in the deployment only if it already exports the approved wrapper. Do not replace it with `PreviewTour`, `OutcomeLedPreview`, `VisitorStory`, or any new interactive/canvas page. |
| Build output generated from the allowed source | Generated output may change only as a direct result of building the allowed web revision. Do not hand-edit generated files. |

**Explicitly prohibited:** any modification to the five original preview panels, `App.tsx`, router behavior beyond the existing `/preview` route, the mobile artifact, API, database, deployment configuration, environment variables, QR code image, CSS/design system outside the approved artifact, waitlist API, unrelated pages, or any unrelated source file.

If a deployment system claims a configuration or unrelated source change is necessary, **do not make it**. Stop and report the exact reason and file first. The owner must explicitly authorize it.

## Non-negotiable implementation rules

1. Do **not** publish the old guided-preview experience. A bundle that contains or renders the hero “See the community in motion.” at `/preview` fails this task.
2. Do **not** make a new preview page and do not point the QR code to Replit’s temporary preview domain. The QR must keep using `https://www.mappingwithmelanin.com/preview`.
3. Do **not** use a redirect to a different experience. The production route must serve the same approved static phone-frame artifact through the existing wrapper.
4. Do **not** alter the first five protected panels during this promotion. The only approved additive content is the new **Living Library** panel and new **Kinfolk AI** panel, each with three slides.
5. Do **not** replace the polished gold-outline, dark-brown/cream visual language with the older interactive canvas or any redesigned layout.
6. Do **not** change or create any QR graphic. The URL currently encoded by the QR is correct.

## Required pre-deployment proof

Do not deploy until all checks below are reported and pass.

| Check | Required pass condition |
|---|---|
| Source scope | `git diff --name-only` contains only the permitted source scope above, or the task is a pure revision promotion with no source edits. |
| Protected first five panels | Demonstrate that the original five card sections in `approved-preview-8-5.html` are unchanged from the protected baseline. |
| New artifact | `sha256sum artifacts/web/public/approved-preview-8-5.html` equals `acc09ec56a04c5c6d34a12fe202b288a267b68d1ed2eaf3e2a3e4d9a5a10ec9f`. |
| Panel count | The artifact contains exactly `7` `preview-card` elements and exactly `21` `preview-slide` elements. |
| Wrapper | `/preview` continues to load the existing approved wrapper, not `PreviewTour` or another preview component. |
| Static inclusion | The production build output contains `approved-preview-8-5.html` as a real static file; it must not fall through to the SPA HTML document. |
| Build | The web production build passes with no preview-source changes outside the scope lock. |

## Required post-deployment proof

After production publication, run and report each result. Do not say “fixed” before every item passes.

```bash
# 1. The exact QR destination must be live and canonical.
curl -sS -L -o /dev/null -w 'status=%{http_code}\nurl=%{url_effective}\n' \
  'https://www.mappingwithmelanin.com/preview'
# Required: status=200 and url=https://www.mappingwithmelanin.com/preview

# 2. The static file must be the actual seven-panel artifact, not SPA fallback HTML.
curl -sS --max-time 90 \
  'https://www.mappingwithmelanin.com/approved-preview-8-5.html' \
  -o /tmp/production-approved-preview-8-5.html
sha256sum /tmp/production-approved-preview-8-5.html
grep -c 'class="preview-card"' /tmp/production-approved-preview-8-5.html
grep -c 'class="preview-slide"' /tmp/production-approved-preview-8-5.html
# Required SHA: acc09ec56a04c5c6d34a12fe202b288a267b68d1ed2eaf3e2a3e4d9a5a10ec9f
# Required counts: 7 cards and 21 slides

# 3. Verify the protected route is not serving the older guided-preview copy.
curl -sS -L 'https://www.mappingwithmelanin.com/preview' -o /tmp/production-preview.html
# Inspect the production preview bundle that this document references.
# Required: the active /preview route resolves to ApprovedAnimatedPreview → approved-preview-8-5.html,
# not the older PreviewTour experience.
```

Finally provide the following exact completion statement, with the command outputs attached:

> “The existing QR code destination `https://www.mappingwithmelanin.com/preview` now serves the verified seven-panel, 21-slide approved preview. The production static artifact SHA-256 is `acc09ec56a04c5c6d34a12fe202b288a267b68d1ed2eaf3e2a3e4d9a5a10ec9f`. No QR image, API, mobile artifact, database, route outside `/preview`, or unrelated source file was changed.”

If any check fails, roll back the production publication to the last working production revision and report the failed condition. Do not attempt an unapproved redesign or workaround.

## References

[1]: https://www.mappingwithmelanin.com/preview "Existing QR destination; currently returns the older production preview bundle"
[2]: https://ac64a230-72f5-4194-b8b4-3ca827a772f9-00-ufj5aspnoap8.riker.replit.dev/preview "Verified Replit public preview route"
[3]: https://ac64a230-72f5-4194-b8b4-3ca827a772f9-00-ufj5aspnoap8.riker.replit.dev/approved-preview-8-5.html "Verified public-Replit seven-panel static artifact"
