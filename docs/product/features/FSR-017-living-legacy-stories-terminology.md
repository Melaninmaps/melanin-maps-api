# FSR-017 — Platform Terminology: Living Legacy Stories

| Field | Value |
|-------|-------|
| **Reference ID** | FSR-017 |
| **Date Recorded** | July 26, 2026 |
| **Feature Name** | Approved Platform Terminology: "Living Legacy Stories" |
| **Product Area** | Platform / Language / Brand |
| **Status** | FOUNDER APPROVED |
| **Priority** | High — applies immediately to any implementation of FSR-001 and FSR-008 |
| **Approved for Implementation** | Yes — terminology decision is approved; no code required |
| **Implemented** | Partially — the term appears in one API response message (cultural-sites.ts) |

---

## Founder Decision (July 26, 2026)

**"Living Legacy Stories"** is the approved current working platform term for community-preserved profiles honoring people, places, institutions, neighborhoods, traditions, cultural events, ancestors, and current legacy builders.

This approval was explicit: "I also approve 'Living Legacy Stories' as the current official working platform term."

---

## Scope of the Term

Living Legacy Stories covers:
- Community-submitted memories connected to a heritage place (FSR-001)
- New place nominations created entirely by community contribution (FSR-008)
- Oral histories, personal reflections, and archival contributions
- Stories about people (ancestors, current leaders, elders)
- Stories about places (neighborhoods, landmarks, institutions)
- Stories about traditions and cultural events
- Stories about current legacy builders — not limited to those who have died

---

## Prior Terminology Preserved as Historical Reference

The following terms were considered before "Living Legacy Stories" was approved. They are preserved here as historical reference and must not be used as the current platform term:

- **"Living Memorials"** — considered but not approved. Limitation: implies the subject has died; does not cover current community leaders, institutions, or ongoing traditions.
- **"Living Memorial"** — same limitation as above.

The term "Living Legacy Stories" was preferred because it allows honoring ancestors, current community leaders, institutions, neighborhoods, alumni, traditions, and cultural movements — without implying death as a prerequisite.

---

## Application Rules

This term applies to:
- API response messages referencing this feature (currently: "Your Living Story has been submitted and is pending review." — cultural-sites.ts line 283; update to "Living Legacy Story" when UI is built)
- Mobile screen titles (cultural-heritage.tsx contribution section)
- Admin panel labels for the story moderation queue
- Marketing copy, onboarding, and help text
- The FSR-001 and FSR-008 feature entries in this register

The term should NOT be shortened to "Legacy Stories" or "Living Stories" without explicit founder approval of the shorter form.

---

## Relevant Code Location

- `artifacts/api-server/src/routes/cultural-sites.ts` line 283: current message uses "Living Story" — should be updated to "Living Legacy Story" when the full UI is implemented

---

## Related Entries

- FSR-001 (Living Legacy Stories — Community Submission) — primary implementation
- FSR-008 (Living Legacy Stories — Nominations) — secondary implementation

---

## Source of Decision

Founder approval, July 26, 2026, in response to the Heritage Map Audit and Future-State documentation session.
