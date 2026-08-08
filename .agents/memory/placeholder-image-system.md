---
name: Business Placeholder Image System v1.0
description: Branded placeholder card + category SVG icon for businesses without owner photos; has_owner_photo DB field; 22 icon mappings; rules against cultural stereotyping.
---

# Business Placeholder Image System v1.0

**Status:** HIGH priority — design spec documented, not yet built.

## Core Rules
- NEVER use stock photos of people for placeholders (stereotyping risk)
- Use category-specific geometric SVG icons on a warm brand-colored background
- `has_owner_photo` boolean DB field gates which image shows
- 22 category-specific icon mappings defined in spec

**Why:** Businesses without photos need a dignified, branded placeholder that doesn't make assumptions about the owner's appearance or community.

**How to apply:** When implementing business card or business detail image display, check `has_owner_photo` and serve branded SVG placeholder if false.
