# FSR-002 — Heritage Support Links

| Field | Value |
|-------|-------|
| **Reference ID** | FSR-002 |
| **Date Recorded** | July 26, 2026 |
| **Feature Name** | Heritage Support Links — Scholarship, Alumni, and Preservation Giving |
| **Product Area** | Heritage Map / Community Giving |
| **Status** | PARTIALLY BUILT |
| **Priority** | Medium |
| **Proposed Phase** | Post-launch, Phase 1 Heritage expansion |
| **Approved for Implementation** | No — data and API exist; UI requires separate approval |
| **Implemented** | No |

---

## Original Founder Intent

Heritage sites — especially HBCUs and civil rights institutions — should connect members to meaningful ways to support them. Giving links, scholarship funds, alumni associations, preservation funds, and nonprofit organizations should appear contextually within a site's detail view, not as generic donation buttons.

---

## Full Suggestion

Each heritage site detail page should surface:
- Links to scholarship funds specific to that institution
- Alumni fund donation pages
- Preservation or restoration donation links
- Nonprofit organizations affiliated with the site
- General giving pages

Links must be verified before display. Each link should have a short description explaining why it matters in the context of that specific place.

---

## User Benefit

Members visiting a heritage site profile can take immediate meaningful action — donating, joining an alumni association, or supporting preservation efforts — without leaving the platform or needing to search externally.

---

## Community and Cultural Purpose

Many culturally significant institutions face funding challenges. Connecting member enthusiasm directly to giving opportunities serves both the member (actionable engagement) and the institution (increased awareness and donations).

---

## Current Implementation Status

**PARTIALLY BUILT.**

- `heritage_support_links` DB table: `siteId`, `title`, `description`, `url`, `category` (scholarship/alumni_fund/giving/preservation/nonprofit), `isVerified`, `displayOrder`
- `GET /api/cultural-sites/:id/support-links` — returns verified links ordered by displayOrder
- 18 seeded support links for 8 institutions (Howard, Spelman, Morehouse, Hampton, Tuskegee, FAMU, NC A&T, EJI/Montgomery, Whitney Plantation, National Civil Rights Museum, DuSable, National Underground Railroad Freedom Center, UNCF, King Center, Selma Trail, Anacostia Museum)

**Not yet built:**
- Mobile UI displaying support links within the heritage site detail view
- Web UI for support links
- Admin UI for adding/editing support links
- Link verification refresh workflow

---

## Dependencies

- Heritage Sites re-enabled (HERITAGE_SITES_ENABLED = true)
- Heritage site detail view UI (cultural-heritage.tsx modal expansion)

---

## Related Existing Features

- `heritage_support_links` table (lib/db/src/schema/heritage-support-links.ts)
- `GET /api/cultural-sites/:id/support-links` (artifacts/api-server/src/routes/cultural-sites.ts lines 290–308)
- External click tracking (`/api/external-clicks`) — already used for heritage site website visits

---

## Relevant Database Tables and Code

- `lib/db/src/schema/heritage-support-links.ts`
- `artifacts/api-server/src/routes/cultural-sites.ts` (lines 59–94 seed, 290–308 route)

---

## Privacy Considerations

- Links go to external verified institutions — no member data is transmitted
- Click tracking records institution name, URL, and referral source (no PII)

## Safety Considerations

- Links must be verified before display — no user-submitted giving links without admin review
- Link verification should be refreshed periodically (URLs may change)

## Moderation Considerations

- `isVerified` flag gates display — unverified links are not shown
- Admin workflow for adding new links and re-verifying existing ones needed

## Accessibility Considerations

- External links must open with appropriate accessibility labels
- Descriptions must make clear what the member is clicking through to

## Legal and Policy Considerations

- Platform should not imply endorsement of any specific giving platform or payment processor
- Links to external giving pages are referrals; platform does not process the transaction

---

## Open Questions

- Should members be able to suggest new giving links for institutions not yet seeded?
- Should link click analytics be surfaced to institutions as a partnership feature?

## Founder Decisions Required

- Confirm: should Heritage Support Links eventually be a monetization or partnership feature (institutions pay for priority placement)?

---

## Source of Suggestion

Heritage Map audit and future-state session, July 26, 2026. Links were identified as partially built infrastructure requiring UI surfacing.

## Related Prompts and Specifications

- Heritage Map Audit (July 26, 2026)
- FSR-004 (Alumni Profiles — related alumni giving angle)
