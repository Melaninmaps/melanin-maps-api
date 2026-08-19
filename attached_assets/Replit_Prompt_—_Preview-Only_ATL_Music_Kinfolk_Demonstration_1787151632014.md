# Replit Prompt — Preview-Only ATL Music Kinfolk Demonstration

## Owner-authorized purpose

Update the existing **additive Kinfolk AI panel only** in the seven-panel preview so visitors can watch the intended Community Intelligence behavior in action.

The preview must show this three-slide, **watch-only** ATL-music demonstration:

1. **Answer first:** a member asks, `What rappers are from ATL?` Kinfolk gives a direct cultural answer.
2. **Relevant optional paths:** Kinfolk offers only `Local music events`, `Music venues & underground clubs`, `Learn about these artists`, and `Not right now`.
3. **Community Intelligence:** the answer grows richer through research-backed artist context and moderated Community-Sourced local context, without inventing a live event, club, or business.

This is a **preview-only copy/markup update**. It does not make the preview interactive and it must not create a second Kinfolk implementation. The real Kinfolk behavior is implemented separately through the approved Kinfolk music-exploration and community-intelligence prompt patches.

## Exact allowed scope

Apply only this package’s unified diff:

```text
preview-kinfolk-atl-music.patch
```

It changes only one source file:

```text
artifacts/web/public/approved-preview-8-5.html
```

Within that file, it changes **only Panel 7 (`#card-kinfolk`)**:

```text
Slide 7-A content
Slide 7-B content
Slide 7-C content
Panel 7 card-label copy
```

No CSS, JavaScript, animation engine, cycle timing, route, wrapper, waitlist logic, query-string forwarding, first five protected panels, Living Library panel, mobile artifact, API, database, QR URL, or deployment configuration may change.

## Explicitly prohibited

Do not change any of the following:

```text
The protected original five preview panels
The Living Library panel
The preview phone-frame CSS, dark-brown/gold design tokens, icons, dimensions, or animation timing
The 3.5-second cycle engine
ApprovedAnimatedPreview.tsx
preview.tsx
App.tsx
any preview route, redirect, or iframe behavior
any existing waitlist form/endpoint/success behavior
any mobile, API, Kinfolk server, map, directory, database, or deployment file
```

Do not add a new preview screen, create a new preview component, rewrite the preview in React, replace the static artifact, change QR behavior, or introduce live API calls from the preview.

## Apply procedure

1. Confirm the active baseline is the current seven-panel artifact with:

   ```text
   SHA-256: acc09ec56a04c5c6d34a12fe202b288a267b68d1ed2eaf3e2a3e4d9a5a10ec9f
   preview-card count: 7
   preview-slide count: 21
   ```

2. Apply `preview-kinfolk-atl-music.patch` to `artifacts/web/public/approved-preview-8-5.html`.

3. Do not hand-edit other parts of the artifact after applying the patch.

4. Run the project’s normal web production build. Do not deploy yet.

## Required pre-deployment proof

Before asking for deployment approval, provide:

```bash
# Only one source file may change.
git diff --name-only
# Required source result:
# artifacts/web/public/approved-preview-8-5.html

# The preview remains seven panels and 21 slides.
grep -c 'class="preview-card"' artifacts/web/public/approved-preview-8-5.html
grep -c 'class="preview-slide"' artifacts/web/public/approved-preview-8-5.html
# Required: 7 and 21

# The original five protected panels remain identical to the current baseline.
# Compare the Card 1–5 markup ranges before/after; report a clean diff.

# The cycle engine remains unmodified.
grep -n 'CYCLE_INTERVAL_MS = 3500' artifacts/web/public/approved-preview-8-5.html
# Required: exactly the existing declaration, unchanged.
```

Also provide a `git diff --stat` and the full unified diff. The diff must contain only Panel 7 markup/copy. If it includes CSS, JavaScript, the first five panels, Living Library, a route, wrapper, or any other file, stop and do not continue.

## Required public verification after owner deployment approval

After a separately authorized production release, verify the exact public QR URL:

```text
https://www.mappingwithmelanin.com/preview
```

Provide desktop and mobile captures showing all of the following:

| Slide | Required visible result |
|---|---|
| 7-A | `What rappers are from ATL?` and a direct Atlanta hip-hop answer. No generic source disclaimer. No business cards. |
| 7-B | Only the four music-relevant optional paths. No `Your Guide To`, `Must-Visit Spots`, restaurants, bookstores, or generic business cards. |
| 7-C | `Community Intelligence makes the answer richer.` with research-backed and Community-Sourced language. No invented live event/venue/business. |

The seven-panel count and 21-slide count must remain unchanged. The new panel content must preserve existing phone-frame presentation and three-dot auto-cycle behavior.

## Completion statement

Reply only when all checks pass, with this statement and proof:

> “The preview-only ATL music demonstration now updates only Panel 7 of `approved-preview-8-5.html`. The artifact remains seven panels and 21 slides; its original five protected panels, Living Library panel, CSS, animation engine, 3.5-second cycle, route, QR destination, waitlist, mobile artifact, API, database, and deployment configuration were not changed.”

If any check fails, revert the one preview artifact file to its current baseline and report the failed check. Do not broaden scope or make a workaround without new owner approval.
