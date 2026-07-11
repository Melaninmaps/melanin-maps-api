---
name: Investor Deck Format
description: Visual design system, colors, fonts, and export conventions for the Mapping With Melanin investor deck (artifacts/investor-deck).
---

## Slide canvas
- 1920×1080px, 16:9 widescreen
- Each slide is a full React component at `artifacts/investor-deck/src/pages/slides/Slide##Name.tsx`
- Registered in `artifacts/investor-deck/src/data/slides-manifest.json` — routing is position-based, do NOT rename files

## Color palette
| Token | Hex | Use |
|---|---|---|
| Background | `#3D2417` | Slide background (dark brown) |
| Gold | `#CA922B` | Headlines, accents, gold labels |
| Cream | `#F5EBD8` | Body text, white labels |
| Subtitle | `#D9C4A3` | Subheadings, captions |
| Glow | `rgba(202,146,43,0.18)` | Radial gradient overlay |

## Typography
- `font-display` — headings / labels (mapped in tailwind config)
- `font-body` — body / captions
- Slide number badge: `font-display`, `2vw`, gold `#CA922B`, `opacity: 0.35`, bottom-right `right-[5vw] bottom-[1.7vw]`

## Layout rules (PDF-safe)
- **Never use `top-1/2 -translate-y-1/2`** — Playwright `page.pdf()` ignores CSS transforms for clipping; use bounded `top/bottom %` containers with `flex flex-col justify-center` instead
- All sizing in `vw` units (not `px`) so it scales correctly at 1920px viewport
- Overflow: use `overflow-hidden` on the root, `overflow: visible` on SVG layers

## Flywheel diagram (Slide 25)
- SVG arcs in a 50vw×50vw container centered at `left:51%, top:44%`
- `ARC_RADIUS=36`, `GAP_DEG=5`, `OFFSET_DEG=20`, `strokeWidth=0.5`
- Labels use `LABEL_RADIUS_OVERRIDE` (per-label radius), `angleOffset` (rotational nudge), `dyOffset` (pure vertical px-free nudge in container %), `dxOffset` (pure horizontal nudge)
- Gold labels: Discovery, Community Grows. White labels: People, Recommendations, Thriving Businesses.

## PDF export
- Command: `exportSlides({ format: "pdf", presentationName: "Mapping With Melanin — Investor Deck", artifactDirName: "investor-deck" })`
- Output: `.local/outputs/Mapping-With-Melanin---Investor-Deck.pdf`
- 33 slides, ~3MB

**Why:** The PDF export uses Playwright headless Chrome at 1920×1080. CSS transform-based centering is unreliable — always use bounded percentage positioning for any element that must not be clipped.
