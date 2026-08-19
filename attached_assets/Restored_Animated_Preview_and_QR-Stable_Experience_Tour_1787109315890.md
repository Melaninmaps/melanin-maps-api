# Restored Animated Preview and QR-Stable Experience Tour

## Required outcome

The preview is an animated, interactive product tour again. It has two modes:

1. **Guided preview** automatically advances through demonstrations every 4.8 seconds and can be paused. This is the QR-friendly tour mode.
2. **Explore the experiences** lets a visitor select an experience and manually choose every demo. This is the requested second preview option.

Both modes live at the same permanent route: **`/preview`**. Existing QR codes continue working because the route does not change. The mode and selected experience are query parameters only; the QR itself must never contain a build ID, preview deployment hostname, or a time-limited URL.

## The five experiences and fifteen required demonstrations

| Experience | Demo 1 | Demo 2 | Demo 3 |
|---|---|---|---|
| Community Member | Discover nearby local results | Share community context | Official alerts with Community Intelligence context |
| Business | Build a listing | Claim a listing | Understand community-sourced insight |
| Cultural Ambassador | Create a cultural trail | Share a local story | Grow a campaign through a share link/QR |
| Living Library | Start with foundations | Search prior Kinfolk research | Grow reusable community knowledge |
| Kinfolk AI | Ask with diaspora-first context | Speak a question | Choose optional relevant next steps |

Every demo button has a real product destination. The tour should never contain decorative controls that do nothing.

## 1. Install the restored route

Copy `PreviewTour.tsx`, `previewTour.css`, and `previewTourData.ts` into the web client. Add `previewTourRoutes` inside the main React Router route tree.

```tsx
import { previewTourRoutes } from "./features/preview/previewRouting.patch";

<Routes>
  {/* existing routes */}
  {previewTourRoutes}
</Routes>
```

Do not change the `/preview` route. If an earlier QR code used `/app-preview` or `/tour`, keep the included redirects in place.

## 2. Preserve the QR destination

Use this exact QR value:

```ts
const qrValue = new URL("/preview", window.location.origin).toString();
```

If QR artwork already exists, do not regenerate it until it is scanned and confirmed to resolve to `/preview`. The server/web host must keep a refresh-safe SPA fallback for `/preview`, as with the cultural-site canonical route fix; otherwise a scan may hit a host-level 404 even though in-app navigation works.

## 3. Restore motion without harming accessibility

The guided mode advances every 4.8 seconds. It must expose a visible **Pause preview** button and automatically start paused for people who enable reduced motion in their device/browser settings. The visitor can always choose Explore mode and control each demo manually.

Do not use video or external animation hosting for the core preview. The included CSS shapes and transitions keep the tour lightweight and reliable for presentations, QR scans, and slower connections.

## 4. Acceptance tests

Before release, verify all of the following:

1. Scan the existing QR with a phone; it opens `https://mappingwithmelanin.com/preview`.
2. Paste `/preview` into a new browser tab and refresh; it does not 404.
3. Guided mode animates through all three demos for the selected experience.
4. Pause/resume works; reduced-motion mode does not autoplay.
5. Explore mode exposes all 15 demonstrations across the five experiences.
6. Each demo action reaches its named route.
7. The Community Member alert demo uses **Official alerts** and **Community Intelligence** language, never Community Safety.
8. At mobile width, the experience switcher and demos remain tappable and readable.

## Replit guardrail

Do not replace the preview with a static screenshot, a broken carousel, or a temporary deployment-specific destination. `/preview` is a presentation asset and a public QR destination. Every deployment must retain its animation, both modes, all 15 demos, pause control, and refresh-safe routing.
