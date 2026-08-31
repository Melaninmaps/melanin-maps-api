# Outcome-Led Animated Preview — Replacement Instructions

## The corrected purpose

The preview is **not** a product sandbox, a feature menu, or a live Kinfolk test. A visitor should not have to type, select filters, grant location permission, post, upload, or wait for a service response to understand why Mapping with Melanin matters.

The restored preview is a self-running guided story. It shows visible outcomes, one after another, using deliberate sample states that are embedded in the page and do not depend on an API, the map, the Library, Kinfolk, storage, location permission, or member data.

## The five visible value moments

| Scene | What a visitor sees | Why it matters without explaining the flywheel |
|---|---|---|
| **Need → Nearby** | Two nearby bookstores surface around a Charlotte point. | Local discovery feels useful immediately. |
| **Experience → Context** | A practical community note becomes an approved context signal. | People see that shared knowledge can help the next person. |
| **Business → Discovery** | A local business profile becomes a discoverable place. | Businesses see a reason to participate. |
| **Culture → Trail** | Heritage, living culture, and a local stop connect into a path. | Cultural ambassadors see their perspective has reach. |
| **Research → Library** | Source-cited research settles into a Living Library entry. | Visitors see that useful answers do not disappear. |

Do not add an in-preview chat box, search box, composer, upload button, live map, live pins, business query, Library query, or API request. The preview’s job is to **show the result of the system working**, not make a visitor operate the system.

## 1. Replace the existing preview

Mount `OutcomeLedPreview` at the existing canonical route:

```tsx
import { outcomePreviewRoutes } from "./features/preview/outcomePreviewRouting.patch";

<Routes>
  {/* existing product routes */}
  {outcomePreviewRoutes}
</Routes>
```

Remove the previous `PreviewTour` feature-menu implementation from `/preview`. Keep the `/app-preview` and `/tour` redirects if they existed, because older promotion materials may use them.

## 2. Preserve the QR code

The QR destination remains **exactly**:

```text
https://mappingwithmelanin.com/preview
```

Do not regenerate the QR code for a build, temporary Replit deployment, query string, staging site, or new subroute. The page’s content can improve forever while the QR route stays constant.

The web host must retain refresh-safe SPA routing for `/preview`. A person scanning a printed code must not land on a host-level 404.

## 3. Motion and accessibility

The preview automatically advances through five 6.6-second scenes. It includes visible **Pause demonstration**, **Play demonstration**, and **Restart** controls. For reduced-motion settings, it starts paused and all CSS animation is disabled. The progress bar doubles as a manual scene selector.

## 4. Release acceptance criteria

Before promoting this version, verify:

1. The printed/previous QR scans to `/preview` and loads the outcome-led preview.
2. The preview makes zero network calls beyond ordinary application boot assets.
3. No text field, search, chat composer, media upload, location control, or live product query appears.
4. The preview advances through all five outcome scenes without user action.
5. Pause, play, restart, and manual scene selection work.
6. The page behaves correctly with reduced motion enabled.
7. Pasting `/preview` into a new browser tab and refreshing does not 404.
8. Every scene visually communicates one outcome; the page never uses the term “flywheel” in visitor-facing copy.

## Permanent Replit rule

> The public preview is a curated proof of value, not a live reliability test. It shows the system’s visible outcomes with static demonstration states, preserves `/preview` for every QR code, and never asks a visitor to type or trust a live Kinfolk response.
