---
name: Community Intelligence — permanent product rule
description: Product term is "Community Intelligence" not "Community Safety"; prohibited inferences; language rules; scope of implementation needed.
---

## The Rule

**Never use "Community Safety" as a product term.** The product term is **Community Intelligence**.

Definition: Community Intelligence = community-sourced context for informed choices. It describes moderated shared experiences about arrival, access, atmosphere, local connection, practical conditions, business experience, events, and verified local resources.

## Prohibited

- Implying or calculating that a location is unsafe because it has minority residents, is predominantly minority, has a particular race/ethnicity, is diverse, or lacks diversity.
- Demographic composition as a safety signal of any kind — not as input to map pins, recommendations, rankings, labels, filters, Kinfolk responses, or neighborhood scores.
- Turning a search term into a profile fact about the member's identity.
- "Safety score", "safe/unsafe neighborhood" labels, "diverse/less-diverse as risk proxy", blanket neighborhood judgments.

## Approved language

Use: **Community Intelligence**, **Community-sourced context**, **Community-sourced insight**, **Shared local experience**, **Practical local context**, **What community members have shared**.

Avoid: Community Safety, safety score, safe/unsafe neighborhood labels, diverse/less-diverse as risk proxy.

Emergency help stays separately and accurately labeled — pointing to official emergency services or official alerts. It is NOT Community Intelligence and must never be rebranded as such.

## Implementation scope (awaiting "Please implement.")

Surfaces requiring the rename:
- Web: nav item "Safety Hub" → "Community Intelligence"; `/safety` page hero; `features.tsx`; `community-guidelines.tsx`; `privacy-policy.tsx`; `terms.tsx`; `rate-neighborhood.tsx`; `roadmap.tsx`; `welcome.tsx`; `membership.tsx`; `home.tsx`
- Mobile: `safety-hub.tsx` (tabs + root); `index.tsx` tab label; `compare-neighborhoods.tsx`; `kinfolk-settings.tsx`; `components/SafetyPulseWidget.tsx`; `components/MapTabView.tsx/.native.tsx`; `notifications-settings.tsx`; `privacy-policy.tsx`; `roadmap.tsx`
- API: `email.ts` ("Community Safety Intel"); `library-evidence-seed.ts` (DOJ source label); API response field names like `neighborhoodSafetyScore` → `communityIntelligenceSignals`
- Keep: genuine emergency labels ("In a life-threatening emergency, always call 911"), official alert wording.

Files from the zip to install when authorized:
- `server/communityIntelligence/policy.ts` (to create)
- `client/src/features/community-intelligence/communityIntelligenceCopy.ts` (to create)
- `client/src/features/community-intelligence/communityIntelligence.patch.tsx` (reference patch — already in zip)
- `tests/communityIntelligencePolicy.test.ts` (to wire into vitest)

**Why:** Mapping With Melanin serves communities of color. Framing community data as "safety" signals — which historically correlates with minority presence — is the opposite of the mission. "Community Intelligence" names what the feature actually is: shared lived context, not risk scoring.

**How to apply:** Every new route, copy line, API field, Kinfolk instruction, or test that touches neighborhood/community context must use the approved language. Do not rename internal DB columns until callers are migrated. Add the application-facing view first.
