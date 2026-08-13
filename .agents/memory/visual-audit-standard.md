---
name: Visual Production Self-Audit Standard
description: PERMANENT REQUIREMENT — must open and visually inspect the running application before declaring any user-facing change complete. Code inspection alone is never sufficient.
---

# Visual Production Self-Audit — PERMANENT REQUIREMENT

## The rule
"Code inspection proves implementation. Runtime testing proves execution. Visual inspection proves the user can actually experience it."

All three levels are required for every user-facing MWM change before declaring complete.

## The 8 steps

1. **OPEN THE ACTUAL APPLICATION** — Replit preview for dev, production URL for prod. Do NOT use dev preview as proof of production.
2. **ACTUALLY USE THE FEATURE** — navigate, click, enter data, submit, scroll. Button existing in DOM ≠ button works. 200 response ≠ user experience works.
3. **VISUALLY INSPECT THE RESULT** — check for white screens, blank sections, missing content, broken images, overlapping elements, cut-off text, hidden buttons, menus that don't open, bad spacing, mobile layout problems, loading screens that never resolve.
4. **TAKE SCREENSHOTS AS PROOF** — show WHAT was tested + WHERE + WHAT the user sees. BEFORE/AFTER/INTERACTION RESULT when applicable.
5. **VERIFY CORRECT ENVIRONMENT** — every evidence report must state: Environment / URL tested / Build SHA / Device+viewport.
6. **TEST RESPONSIVE BEHAVIOR** — desktop AND mobile when relevant. Pay attention to nav/menus, modals, maps, forms, floating buttons, bottom nav, headers, scrolling, content clipping.
7. **SCREENSHOT REVIEW IS PART OF THE TEST** — actually look at it. Ask: "If the Founder opened this screen right now, would she reasonably say this was completed?" If not, it is not complete.
8. **NO FALSE VISUAL CONFIRMATION** — never say "looks good / working correctly / UI verified / production verified / complete" unless you actually opened and visually inspected the running application.

## Required completion evidence format

```
Environment tested: [Development Preview / Production]
URL tested: [actual URL]
Feature/path tested: [specific page/flow]
Actions performed: [what was clicked/entered/submitted]
Expected behavior: [what should happen]
Observed behavior: [what actually happened]
Visual result: PASS / FAIL
Screenshot(s): [attached]
Build/SHA: [if applicable]
Remaining issues: [none OR explicitly listed]
```

## When production visual inspection is not possible

State explicitly: **PRODUCTION VISUAL VERIFICATION NOT COMPLETED**
Do not substitute another environment.

## When to apply
Every user-facing change. KinfolkAI changes require testing via the web chat interface or mobile app — HTTP 200 from /kinfolk/chat is NOT sufficient proof.

**Why:** Added because Replit can report a feature as technically present or responding while the actual site shows a white screen, broken dropdown, or bad layout that a user immediately sees.
