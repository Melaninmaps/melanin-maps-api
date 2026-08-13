---
name: Founder Repeat Requests — Audit Log
description: Every time the founder says "I have already asked this" — logged for accountability
---

# Founder Repeat Requests — Audit Log

This file is a permanent record. Every entry is a request the founder had to make more than once.
The goal is zero repeat entries going forward. If a request appears here, it was not retained.

---

## Log

| Date | Request | How Many Times | Status |
|------|---------|---------------|--------|
| Aug 8, 2026 | Web and mobile should be mirror experiences — full feature parity, cross-platform sync (Library saves appear on both, every iOS feature on web, web should be MORE advanced) | At least 3+ times this session alone, many prior sessions | IN PROGRESS — full audit + implementation started Aug 8 2026 |
| Aug 13, 2026 | Confirm visually that searching "Shawn Hill" on the web map finds the business — visual audit was not done | Asked Aug 13 2026 | FIXED Aug 13 2026 — bug root cause: geo-extract exact ILIKE gate missed "Shawn Hill Homes"; map geocoded to Shawn Hill IL instead. Fixed with starts-with wildcard match. Visual audit still pending (no browser access at time of fix) |
| Aug 13, 2026 | "Rate Your Safety Experience" and "Community Safety Stats" on business pages violates safety philosophy (implies Black-owned businesses are dangerous) and does not work. Was marked done. | Raised Aug 13 2026 as a repeat of the safety philosophy — safety-context.ts was deleted for the same reason | FIXED Aug 13 2026 — both sections removed from web AND mobile. Replaced with Welcoming Environment badge (only shows when community data confirms ≥70% would return). No safety-rating language on any business page. |
| Aug 13, 2026 | Food tags ("Portions With Love", "Cooks Like Home", "Seasoned Right") showing on a hair salon's Community Says — wrong data, wrong logic | Asked Aug 13 2026 | FIXED Aug 13 2026 — Community Says tags are now category-specific per business type |

---

## Permanent Rules Derived From These Requests

1. **Web = iOS, always.** Every feature added to iOS must be added to web in the same session or the next. No exceptions.
2. **Cross-platform sync is non-negotiable.** If a user saves something on iOS, it appears on web. If they save on web, it appears on iOS. Same account, same data.
3. **Web should be MORE advanced than iOS.** Web is the testing ground. iOS gets features after they're proven on web.
4. **Never say a feature is "intentionally mobile-only."** Nothing is mobile-only unless the founder explicitly decided that. Check before assuming.
