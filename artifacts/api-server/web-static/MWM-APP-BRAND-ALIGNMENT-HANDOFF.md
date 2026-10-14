# Mapping With Melanin — App-Surface Brand Alignment Handoff

## Purpose

Use this handoff only for a **separate, scoped implementation task** after founder approval. Its job is to carry the approved Mapping With Melanin visual identity into the real application surfaces while preserving the useful, colorful Kinfolk moments of utility.

This document does **not** authorize deployment, changes to APIs, changes to native mobile builds, or replacement of existing product functionality.

## Approved visual direction

> **Mapping With Melanin owns the application canvas. Kinfolk provides helpful, purposeful color accents inside that canvas.**

The current review implementation demonstrates the approved balance in:

- `artifacts/api-server/web-static/preview-explore-your-way.html`
- `artifacts/api-server/web-static/preview-mwm-brand-front-page.html`

### Verified tokens

| Role | Token | Source evidence | Intended use |
| --- | --- | --- | --- |
| Primary brand / action | `#3A1F0E` | Existing web Kinfolk presentation classes | Primary buttons, high-emphasis navigation, dark app surfaces |
| Primary canvas | `#FAF6EF` | Existing web Kinfolk presentation classes | Readable application background |
| Progress / community emphasis | `#CA922B` | Existing web and mobile business screens | Selected states, badges, navigation emphasis, progress |
| Support / positive context | `#2D7A4F` | Existing mobile business screens | Helpful Kinfolk context, confirmation, trust-supporting utility cues |
| Utility pop | `#B45A45` | Preview alignment treatment | Maps, alerts, and limited attention signals—not the base brand |

The checked-out native source contains the official Mapping With Melanin logo assets: `artifacts/mobile/assets/images/logo-transparent.png` and `artifacts/mobile/assets/images/icon.png`. Use these assets directly wherever the current layout already presents the brand. Do **not** recreate a logo, build a text wordmark substitute, or introduce a compact-letter treatment.

## In scope for the separate task

1. Inventory the current web and native design-token sources before editing.
2. Replace generic or Kinfolk-dominant app-shell colors with the four approved roles above.
3. Preserve Kinfolk’s distinct contextual accents for maps, utility prompts, memories, travel, and safety only where they improve comprehension.
4. Reuse the existing official Mapping With Melanin logo assets; do not replace or redraw them.
5. Keep contrast at WCAG AA or better for standard text and interactive elements.
6. Retain every existing route, button action, data connection, consent behavior, and accessibility label unless a separately approved product requirement changes it.
7. Validate at desktop-web, mobile-web, and current supported native breakpoints.

## Explicitly out of scope

- Publishing or deploying any change.
- Editing business data, verification markers, community data, user accounts, memberships, or saved places.
- Rewriting Kinfolk conversations, changing recommendation logic, or changing memory/calendar permissions.
- Replacing the existing navigation model.
- Creating or deleting any content, event, booking, safety report, or business record.

## Ready-to-copy separate-task directive

```text
TASK: Apply Mapping With Melanin brand alignment to the existing app shell.

Read-only discovery first:
1. Identify the active design-token sources, wordmark/logo assets, web app entry points, and native theme providers.
2. Report the exact files and current values before editing.
3. Confirm the existing official logo assets at `artifacts/mobile/assets/images/logo-transparent.png` and `artifacts/mobile/assets/images/icon.png`; do not create a replacement logo.

After the founder approves the discovery report, make only the smallest necessary visual changes:
- Use #3A1F0E for primary app actions and high-emphasis brand surfaces.
- Use #FAF6EF for the primary application canvas.
- Use #CA922B for selected/progress/community emphasis.
- Use #2D7A4F for supportive Kinfolk utility and positive context.
- Preserve Kinfolk’s small utility pops; do not repaint the entire product as one flat color.
- Use the existing official Mapping With Melanin logo assets wherever the current layout shows the brand.

Do not change behavior, routes, APIs, data, permissions, business verification, community content, event content, onboarding, deployment configuration, or mobile build configuration.

Validate:
- desktop web at 1440px and 1280px;
- mobile web at 390px and 375px;
- keyboard focus, contrast, and reduced-motion behavior;
- existing navigation and buttons still work without console errors.

Deliver:
- a concise before/after token table;
- visual screenshots at each breakpoint;
- changed-file list;
- test results;
- a staging/preview URL only, never a production deployment.
```

## Approval gate

Treat the current brand-aligned front-page preview as a **visual approval gate**. Do not merge, deploy, publish, or apply these tokens outside the isolated preview until the founder explicitly approves the appearance and release scope.
