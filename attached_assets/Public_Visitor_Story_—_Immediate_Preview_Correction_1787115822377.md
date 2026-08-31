# Public Visitor Story — Immediate Preview Correction

## Remove the current page completely

The current `/preview` is not a public-facing experience. It exposes implementation copy, QR-route language, pause/resume controls, numbered feature cards, and a sentence about a national list. Remove all of it:

- `QR-stable preview`
- `/preview` or any route/version language
- `Resume preview`
- `See local discovery`
- numbered `Discover nearby`, `Share context`, and `Official alerts` cards
- footer/return-link content inside the experience
- any search, chat, location, map, upload, or API operation

None of those words or controls belong in a visitor preview.

## Replace it with VisitorStory

Mount `VisitorStory` at the unchanged `/preview` destination:

```tsx
import { visitorStoryRoute } from "./features/preview/visitorStoryRouting.patch";

<Routes>
  {/* existing public routes */}
  {visitorStoryRoute}
</Routes>
```

This preserves every existing printed QR code without exposing a QR message to the visitor.

## What the visitor sees

The page automatically moves through five quiet, visual moments:

1. **Find what feels familiar.** Nearby places appear as useful local context.
2. **Put your people on.** A shared experience becomes something another person can find.
3. **Follow the story, not just the street.** Culture connects people to place.
4. **Keep knowledge within reach.** Source-cited information remains available.
5. **Made for how we move through the world.** The experience closes with the MWM purpose.

The visitor never has to type, click, ask Kinfolk, grant a permission, or trust a live backend response. The story loops quietly and requires zero operation.

## Mobile requirements

The page uses `100svh`, safe-area padding, and no document footer, preventing the browser viewport from showing an oversized footer, route detail, or a stack of controls. It uses one brand mark, one animated visual, short copy, and five progress marks only.

## Release checks

1. Scan the existing QR code. It must continue to open `https://mappingwithmelanin.com/preview`.
2. On iPhone Safari, no visible text contains `QR`, `preview`, `route`, `version`, `resume`, `demo`, `feature`, or `national dump`.
3. No input, button, chat, location control, map control, footer, or API-loaded content appears.
4. The story advances automatically across all five scenes and loops.
5. The page remains legible at narrow mobile widths with browser safe areas.
6. Reduced-motion mode keeps the scene visible without animated transitions.
