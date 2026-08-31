# Mapping With Melanin — Restored 8/5 Preview Visitor Audit

**Audit date:** August 19, 2026  
**Scope:** Read-only, source-level audit of the externally served restored 8/5 visitor preview. No source, route, visual, animation, deployment, data, waitlist, or browser changes were made.  
**Artifact verified:** `approved-preview-8-5.html`, SHA-256 `9ba88b4871a5ebe026fdc3ec608e6ebb6913320bc7b6a0994bb6735f2c600b48`.[1]

## Executive conclusion

The restored artifact is the approved five-card, fifteen-demonstration version. It is correctly mounted at `/preview` through a full-height iframe wrapper, and the recovered static artifact is byte-identical to the previously documented approved SHA-256. The five cards contain exactly three demonstrations each and each card advances automatically on a **3.5-second cycle**.[1] [2]

For a first-time visitor, the preview communicates a compelling individual benefit in four areas: receiving real-time community context, finding culturally relevant businesses, participating in culture and events, and growing a business or creator practice through community demand. It also makes the platform’s community value visible: member reports influence recommendations, searches become business insight, cultural detail is preserved, and creator coverage follows community demand.

However, the preview does **not** currently present the **Living Library** as a named or distinct experience. It also does not make **Kinfolk AI** a standalone visitor experience; Kinfolk appears only inside the Business Owner and Cultural Ambassador demonstrations. Accordingly, the source does not support the claim that the current approved preview shows the requested five experiences of **Community Member, Business, Cultural Ambassador, Living Library, and Kinfolk AI**. Its actual five cards are **Stay Safe Everywhere You Go, Grow Your Business with Your Community, Discover Businesses That Get You, Connect with Your Culture,** and **Create What Your People Are Looking For**.[1]

> **Visitor takeaway:** The current preview answers “Why might I need this?” well. It only partially answers “How does the knowledge I receive become stronger for my community over time?” The missing bridge is the Living Library and an explicit member-facing Kinfolk journey.

## Verification of the restored experience cards and demonstrations

| Verified card in approved artifact | Demonstration 1 | Demonstration 2 | Demonstration 3 | Visitor benefit conveyed |
|---|---|---|---|---|
| **Stay Safe Everywhere You Go** | Community Alert: a community-verified ICE activity report | Discrimination report followed by a nearby recommended alternative | Weather alert and reroute on the member’s trip | The app provides real-time, community-informed context and alternatives while a person is moving through the world. |
| **Grow Your Business with Your Community** | Owner dashboard with profile views, saves, monthly views, and a flash deal | Local demand signal for brunch near the owner | Kinfolk drafts a review response in the owner’s brand voice | The business receives demand intelligence, visibility measures, and time-saving support. |
| **Discover Businesses That Get You** | Search filters by vibe, price, and distance | Community Voice reviews | Travel-mode recommendations in Atlanta | The visitor can choose places through cultural fit and community experience, not only generic ratings or distance. |
| **Connect with Your Culture** | Community events near Charlotte | Heritage sites near the visitor | Cultural detail connected to an Ethiopian bakery | The platform links local participation, place-based history, and cultural learning. |
| **Create What Your People Are Looking For** | Kinfolk demand-matched creator opportunity | Engagement analytics and an Atlanta cultural-trip opportunity | Community content gap and nearby business target | A cultural ambassador can create useful content where community demand is strongest. |

The source contains **five** `.preview-card` elements and **fifteen** `.preview-slide` elements. The animation engine initializes every card and advances the active slide at `CYCLE_INTERVAL_MS = 3500`; active-dot state changes with each slide.[1]

## Visitor-story assessment

| Story question | Assessment | Evidence in the approved artifact | Conclusion |
|---|---|---|---|
| **Is the personal benefit immediately clear?** | **Yes, mostly.** | The hero asks “What brings you to the map?” and immediately demonstrates routes, trusted alternatives, culturally relevant discovery, events, and opportunities. | Each major visitor type can identify an immediate practical reason to join. |
| **Is community value visible?** | **Yes.** | Community verification, reports, Community Voice reviews, local demand, heritage sites, and creator content gaps show contributions changing what others see. | The preview conveys the flywheel through examples rather than technical explanation, which is the correct direction. |
| **Does the preview make the Living Library distinct?** | **No.** | The text contains no “Living Library,” “library,” “topic,” “saved research,” “citation,” or reusable knowledge experience. The cultural-detail slide is adjacent to the concept but does not establish an evolving library. | A visitor cannot understand that Kinfolk research becomes a reusable, cited, discoverable resource that grows nationally and locally. |
| **Is Kinfolk AI a distinct member benefit?** | **Only partially.** | Kinfolk appears as an owner review-response tool and ambassador intelligence label. | The visitor does not see Kinfolk answering a member question, surfacing appropriate next steps, or optionally connecting them to a local resource. |
| **Does the preview preserve the desired non-technical flywheel story?** | **Partially.** | Search demand feeds businesses; community reviews feed discovery; cultural detail gives context; creator coverage responds to a content gap. | The current cards show four flywheel links. The knowledge-retention link—the Living Library—is absent. |

## Read-only interaction and conversion checks

The route wrapper passes URL query parameters through to the artifact, preserving UTM values. Selecting a card sets a corresponding preview choice, updates the waitlist badge, and scrolls to the form. The form submits to `/api/waitlist`, shows a success section on a successful response, and creates a social-share link.[1] [2]

Because this was a **read-only** audit, no waitlist record was submitted, and the live API success response was not exercised. The approved HTML contains **no QR-code, QR, scan, or QR-destination implementation**. Therefore, a QR destination cannot be verified from the restored artifact; if a QR code is visible elsewhere in a surrounding Replit surface, it is not part of this exact approved static preview source.[1]

## Required additive screens — no redesign of the approved five-card baseline

The approved card grid should remain untouched unless the owner explicitly authorizes a change. To complete the visitor story, add exactly the following two **additive, full-width phone-frame story screens** in the same dark-brown and polished gold visual language, placed after the existing five-card grid and before the waitlist. They should use the same 3.5-second auto-cycle behavior and existing card typography, spacing, device frame, dots, and CTA pattern. No existing card should be renamed, removed, recolored, reordered, or reinterpreted.

| Additive screen | Three 3.5-second demonstrations | What the visitor learns | Required language and guardrails |
|---|---|---|---|
| **Living Library — What We Learn, We Keep** | **1.** A member asks about a topic such as heart health, housing, education, trades, or alopecia. **2.** Kinfolk returns a readable, cited answer shaped first by diaspora-relevant research. **3.** The answer becomes a reusable topic entry that can grow from “Heart Health” to “Heart Health in Charlotte.” | Information does not disappear after one conversation; it becomes a living, cited community resource that is easier for the next person to find. | Use subject-specific polished gold-outline icons, not repeated feathers. Show citations as readable source markers. Do not make health, legal, or other professional information sound diagnostic or definitive. |
| **Kinfolk AI — Help That Knows the Next Step** | **1.** A member asks a practical question in their natural tone. **2.** Kinfolk responds with respectful, culturally aware guidance and community-sourced context. **3.** Kinfolk asks permission before offering relevant nearby professionals, businesses, or next steps. | Kinfolk is not merely a chat box: it understands context, gives useful guidance, and makes optional local connections without pressure. | Apply the permanent diaspora-first research behavior. Use **Community Intelligence** and **Community-Sourced** language. Show consent before professional or local recommendations. |

These additions close the only material narrative gap: the visitor sees that community experiences and questions create better local guidance, cited knowledge, business demand, and cultural context for the next person. They do this without turning the flywheel into a technical explanation or altering the approved 8/5 visual foundation.

## Copy and terminology compliance issue to queue separately

No source was changed during this audit. Nevertheless, the approved baseline contains several instances of **“safety”** language, including the first card title, “safety-rated businesses,” and the waitlist share text. That conflicts with the standing product-language requirement to use **Community Intelligence** and **Community-Sourced** framing rather than language that could imply minority communities or neighborhoods are inherently unsafe.[1]

This is a copy-compliance issue, not a reason to redesign the baseline. It should be changed only through an explicitly authorized, file-scoped copy patch after the owner approves the two additive screens.

## Recommendation and release decision

Keep the restored 8/5 preview as the protected visual baseline. It is functional at the artifact and routing level, and it has a strong conversion-oriented story for immediate personal value. Do **not** represent it as already containing a standalone Living Library or standalone Kinfolk AI experience.

Authorize a narrowly scoped follow-up only if desired: add the two defined screens, then apply a separate copy-only Community Intelligence terminology correction. Once those are present, the preview will clearly demonstrate both the immediate value to an individual and the long-term value created for the community.

## References

[1]: https://ac64a230-72f5-4194-b8b4-3ca827a772f9-00-ufj5aspnoap8.riker.replit.dev/approved-preview-8-5.html "Approved restored 8/5 static preview artifact"
[2]: https://ac64a230-72f5-4194-b8b4-3ca827a772f9-00-ufj5aspnoap8.riker.replit.dev/preview "Canonical restored preview route"
