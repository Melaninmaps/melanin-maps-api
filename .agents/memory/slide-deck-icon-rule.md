---
name: Slide deck icon rule
description: No emoji in any slide deck — always use SVG line-art icons matching the style established in SlideInv34ProductEcosystem.tsx
---

# Slide Deck Icon Rule

**Rule:** Never use emoji characters in any slide (investor, biz, community, or any future deck). Always use inline SVG line-art icons.

**Why:** Emoji render inconsistently across PDF export and look unprofessional compared to the sleek gold SVG icons. The user explicitly confirmed the SVG icon approach is preferred ("so sleek and elegant you nailed it").

**How to apply:** Match the icon style from `artifacts/investor-deck/src/pages/slides/SlideInv34ProductEcosystem.tsx`:
- `fill="none"` — always outline, never filled
- `stroke="#CA922B"` for active/gold icons; `stroke="#7B5408"` for inactive/muted
- `strokeWidth="1.6"` (card icons at 1.75vw) or `strokeWidth="1.8"` (phone nav icons at 1.1vw)
- `strokeLinecap="round" strokeLinejoin="round"` — always rounded joins
- Size: `1.75vw × 1.75vw` for card-level icons; `1.1vw × 1.1vw` for phone nav icons

Common icon paths already established (copy these directly):
- **House/Home:** `<path d="M3 21h18"/><path d="M5 21V9l7-5 7 5v12"/><path d="M9 21v-5h2v5M13 21v-5h2v5"/>`
- **Shield/Safety:** `<path d="M12 22s8-4 8-10V5l-8-2-8 2v7c0 6 8 10 8 10z"/><polyline points="9 12 11 14 15 10"/>`
- **People/Community:** `<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>`
- **Business:** `<rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5c0-1.1-.9-2-2-2h-4c-1.1 0-2 .9-2 2v2"/>`
- **Calendar:** `<rect x="3" y="4" width="18" height="18" rx="2"/>`
- **Search:** `<circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>`
- **Map:** `<polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/><line x1="8" y1="2" x2="8" y2="18"/><line x1="16" y1="6" x2="16" y2="22"/>`
- **Star:** `<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>`
