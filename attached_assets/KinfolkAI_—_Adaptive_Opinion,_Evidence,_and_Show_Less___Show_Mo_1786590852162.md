# KinfolkAI — Adaptive Opinion, Evidence, and Show Less / Show More Package

**Owner direction:** Kinfolk must be a culturally aware general companion, not a directory-only bot. It must give clear, grounded cultural-consensus answers when a member asks a legitimate opinion question, use evidence-first delivery for high-consequence questions such as diabetes, and let the member control response depth without lowering truth, source, safety, or privacy standards.

**Implementation order:** Replit must complete the **read-only capability audit in Part I** and return its findings before changing prompts, code, model selection, data, tools, or production configuration. Part II is the approved architecture to implement only after the founder accepts that audit.

> **Universal decision rule:** Kinfolk may give a conclusion when the answer is an identified cultural/public consensus or a clearly labeled synthesis. It must distinguish consensus from objective fact, evidence from analysis, and current verified information from general model knowledge. If it cannot establish the answer with adequate context, it asks one useful question or says what it cannot confirm. It never fills gaps with an unrelated business, a stale Library node, or a fabricated citation.

---

## Part I — Copy/paste Replit prompt: READ-ONLY capability audit

```text
READ-ONLY KINFOLKAI CAPABILITY AUDIT — NO CODE, CONFIGURATION, DATABASE, PROMPT, OR DEPLOYMENT CHANGES

Purpose
KinfolkAI is intended to combine normal conversational intelligence, general knowledge, cultural context, Mapping With Melanin community/business/Library data, explicit member preferences, and live verified information when current facts matter. It must not be limited to MWM’s database, and it must not route benign cultural or opinion questions to irrelevant business listings or Library nodes.

Diagnostic prompt set — do not hard-code these questions or answers
1. Who won the beef between Drake and Kendrick?
2. Who directed the movie Sinners?
3. Tell me about Michelle Williams from Destiny’s Child.
4. What colleges are near me in Philadelphia? Include HBCUs too.
5. Tell me about African Diaspora History.
6. What should I know about diabetes?
7. Show me Philadelphia nightlife.

For each, record the full request path with secrets and personal data redacted:
1. The exact production model and model configuration.
2. Complete ordered system/developer prompt layers that affect the request.
3. The deterministic intent classifier result and all extracted entities/locations.
4. The member context read, identifying which fields were explicit preferences versus inferred values.
5. Every MWM retrieval call, external/current-information retrieval call, and tool call.
6. Every source/document/result returned before ranking.
7. The exact assembled model input after truncation.
8. The raw model response before response post-processing.
9. Every post-processing filter, rewrite, Library action, business recommendation, source attachment, or suppression decision.
10. Final API response.

Audit these architecture questions:
A. Is the request restricted to Mapping With Melanin database data? If yes, name every restriction and why it exists.
B. When MWM has no matching result, does Kinfolk fall back to normal general model knowledge? If not, identify where it stops.
C. Does Kinfolk have permitted live/current retrieval? If yes, identify source rules and query controls. If no, identify the exact missing capability.
D. Are safety rules blocking benign cultural conversation, or are deterministic classification/retrieval/post-processing layers creating the failure?
E. Why does “Sinners” repeat the same option, why does Michelle Williams classify as business discovery, why does African Diaspora History fail despite a visible Library topic, and why does Philadelphia nightlife attach Los Angeles food results?
F. Can Kinfolk deliver a direct but qualified cultural-consensus answer without presenting it as an objective fact?
G. Can response-depth preferences change presentation only, without changing evidence standards or hiding material safety information?

Return one report with:
- Root cause table, file and line references, and evidence for each observed failure.
- Exact distinction between general knowledge, MWM proprietary data, explicit member preferences, current retrieval, and cultural context.
- Proposed minimal implementation sequence.
- Explicit list of code/prompt/configuration changes that are NOT recommended.
- No implementation. No production mutation. No deployment.
```

### Audit acceptance condition

The audit is incomplete if it provides a conclusion without the raw pre/post-processing evidence. Replit must show why the current layers transform a normal conversational request into a duplicate clarification, irrelevant directory recommendation, stale action, or refusal.

---

## Part II — Approved implementation architecture after the read-only audit

### 1. Response modes

Add a deterministic `responseMode` before the language model is asked to write. The mode controls **answer composition**, not the model’s underlying truthfulness.

| Response mode | Example | Required behavior |
| --- | --- | --- |
| `consensus_analysis` | “Who won Drake vs Kendrick?” | Clear conclusion labelled as cultural/public consensus; reasons; reasonable disagreement; current sources where material. |
| `general_explainer` | “What is the difference between Creole and Cajun?” | Direct educational answer with cultural context; no directory retrieval unless asked. |
| `local_discovery` | “Where should I go in Houston if I do not want a club full of 21-year-olds?” | Explicit city/category/age-vibe filters; MWM results only if they satisfy filters; no national fallback. |
| `education_discovery` | “Colleges near me in Philadelphia, including HBCUs” | Nearby institutions, then separately labeled HBCU exploration; facts/link sources; age/guardian safety where relevant. |
| `high_consequence_evidence` | “What should I know about diabetes?” | Authoritative health sources, scope disclaimer, urgent-care guard, no diagnosis, no cultural-opinion style. |
| `current_events` | “What is happening with a bill in New Orleans?” | Dated verified reporting, jurisdiction/source labels, uncertainty and update time. |
| `cultural_entity` | “Michelle Williams from Destiny’s Child” | Entity resolve first; answer about the named person/work; no business search. |
| `needs_clarification` | “Natalie” | Ask one precise question only when verified context cannot resolve the entity. |

### 2. Cultural-consensus answer contract

For `consensus_analysis`, Kinfolk may answer directly when credible public coverage, cultural outcome signals, and available current sources support a consensus. It must never present a subjective judgment as an empirically objective fact.

```ts
export type ConsensusAnswer = {
  responseMode: 'consensus_analysis';
  directAnswer: string;              // e.g. “Kendrick Lamar.”
  framing: 'broad_cultural_consensus' | 'critical_consensus' | 'mixed_consensus';
  basis: Array<{
    claim: string;
    evidenceType: 'release_impact' | 'critical_coverage' | 'award' | 'public_reception' | 'performance' | 'timeline';
    sourceIds: string[];
  }>;
  reasonableDisagreement: string | null;
  currentAsOf: string | null;
  sources: PublicSource[];
  showMoreAvailable: true;
};
```

Required rendered structure:

1. **Direct answer.** One clear sentence.
2. **Frame.** “This reflects broad public and cultural consensus, not an objective fact or a rule about personal taste.”
3. **Why.** Three to five source-backed reasons.
4. **Nuance.** One short paragraph acknowledging a reasonable competing view.
5. **Depth controls.** `Show less`, `Show more`, and one conversational follow-up.
6. **Sources.** Visible titles/publishers/date; never fake links.

### 3. Example: Kendrick/Drake behavior

This is a **regression fixture**, not a hard-coded answer. When current verified sources support it, the response should be structurally equivalent to:

> **Kendrick Lamar.** If the question is who won in broad public and cultural consensus, Kendrick is widely regarded as the winner. That does not make it an objective fact or mean every listener must prefer the same records.

The body should explain relevant, verifiable outcomes such as release impact, the battle sequence, professional/critical coverage, awards, and later cultural reach; it should identify dates and sources. It may say Drake had strong moments, including “Family Matters,” and that a user may prefer Drake’s records on individual bars or taste. It must not invent an award, performance, release, quote, source, or statistic.

**Forbidden behavior:** generic refusal, “I only know MWM data,” an unrelated business recommendation, an unrelated Library action, or a fabricated neutral tie where a well-supported consensus exists.

### 4. High-consequence evidence contract: diabetes and other health topics

A medical question is not an opinion mode. `high_consequence_evidence` must preserve medical safety at every depth.

```ts
export type EvidenceAnswer = {
  responseMode: 'high_consequence_evidence';
  plainLanguageSummary: string;
  evidenceLevel: 'authoritative';
  sourceGroups: Array<'government' | 'public_health' | 'professional_medical_association' | 'peer_reviewed'>;
  urgentCareMessage?: string;
  whatThisCannotDo: string;
  sources: PublicSource[];
  showMoreAvailable: true;
};
```

| Control | Required behavior |
| --- | --- |
| Sources | Use current government/public-health/professional medical/peer-reviewed sources appropriate to the question. Do not use social posts, business reviews, or generic web snippets as medical evidence. |
| Personalization | Do not infer diagnosis, race, pregnancy, finances, or risk from profile/history. Use explicit, present-query context only. |
| Safety | Keep emergency/urgent-care guidance visible even after `Show less`; never hide it due to a brevity preference. |
| Recommendation boundary | Explain general education; do not diagnose, prescribe, or replace a clinician. |
| Cultural context | It may explain documented disparities only with authoritative sources and only when relevant; it must not stereotype. |

### 5. Use normal model knowledge, MWM data, and live retrieval in the correct order

```ts
export type KnowledgePlan = {
  responseMode: ResponseMode;
  useGeneralModelKnowledge: boolean;
  useMwmData: boolean;
  useExplicitPreferences: boolean;
  useCurrentRetrieval: boolean;
  sourceMinimum: 'none' | 'reputable' | 'authoritative' | 'two_independent';
};

export function buildKnowledgePlan(ctx: QueryContext): KnowledgePlan {
  switch (ctx.responseMode) {
    case 'consensus_analysis':
      return { responseMode: ctx.responseMode, useGeneralModelKnowledge: true, useMwmData: false,
        useExplicitPreferences: true, useCurrentRetrieval: ctx.isTimeSensitive,
        sourceMinimum: ctx.isTimeSensitive ? 'two_independent' : 'reputable' };
    case 'high_consequence_evidence':
      return { responseMode: ctx.responseMode, useGeneralModelKnowledge: true, useMwmData: false,
        useExplicitPreferences: false, useCurrentRetrieval: true, sourceMinimum: 'authoritative' };
    case 'local_discovery':
      return { responseMode: ctx.responseMode, useGeneralModelKnowledge: true, useMwmData: true,
        useExplicitPreferences: true, useCurrentRetrieval: false, sourceMinimum: 'reputable' };
    default:
      return { responseMode: ctx.responseMode, useGeneralModelKnowledge: true, useMwmData: true,
        useExplicitPreferences: true, useCurrentRetrieval: false, sourceMinimum: 'none' };
  }
}
```

**Hard rule:** MWM data can enrich a response. It must never act as a blanket gate that prevents general conversation, ordinary knowledge, cultural interpretation, or a current-information answer.

### 6. Show less / Show more: explicit delivery controls

Add a presentation-only control to every completed Kinfolk response except when prohibited by safety/age rules.

```ts
export type DeliveryOverride = 'brief' | 'standard' | 'deep';

export type KinfolkDeliveryPreference = {
  defaultDetailLevel: DeliveryOverride;      // explicit member selection
  allowAdaptiveDetail: boolean;              // explicit member selection
  updatedAt: string;
};

export type MessageDeliveryEvent = {
  messageId: string;
  requestedLevel: DeliveryOverride;
  // Do not store raw sensitive query text, medical topic, legal issue, or private search detail.
  domainClass: 'general' | 'culture' | 'local' | 'education' | 'high_consequence';
  createdAt: string;
};
```

**Button rules:**

| User control | Server behavior | Learning rule |
| --- | --- | --- |
| `Show less` | Re-render from the already validated response evidence with a concise template; do not perform lower-quality retrieval. | Count a non-sensitive delivery preference signal. |
| `Show more` | Expand verified reasoning, source detail, alternatives, and next questions from the same answer plan; retrieve current material only if needed. | Count a non-sensitive delivery preference signal. |
| `Always keep it brief` / `I like detail` | Save an explicit preference through the existing preference envelope. | Persist only with a direct confirmation/toggle. |
| Medical/legal/safety topic | Change length only; preserve source, urgency, and limitation notice. | Do not use topic content as a preference-memory signal. |

**Client contract:**

```ts
POST /api/kinfolk/messages/:messageId/delivery
{ "level": "brief" | "standard" | "deep" }

// Response
{
  "messageId": "...",
  "level": "brief",
  "reply": "...",
  "sources": [...],
  "safetyNotice": null,
  "canShowMore": true,
  "canShowLess": false
}
```

Do not make `Show less` silently set a permanent preference. Offer a separate, explicit `Use this style by default` control.

### 7. Exact implementation files

Replit must inspect results from Part I before finalizing exact line patches. The expected limited scope is:

| File / area | Change |
| --- | --- |
| `artifacts/api-server/src/kinfolk/intent-router.ts` | Add response-mode selection. Cultural entity context must precede business-discovery classification. |
| `artifacts/api-server/src/routes/kinfolk.ts` | Build `KnowledgePlan`; invoke permitted retrieval; preserve raw source/evidence metadata; prevent irrelevant MWM actions. |
| `artifacts/api-server/src/kinfolk/*` | Add `response-composer.ts`, `consensus-answer.ts`, and `delivery-level.ts`; do not place this logic solely in a giant system prompt. |
| `lib/db/src/schema/*` | Add only additive delivery-event/preference fields; no raw sensitive-query retention. |
| `artifacts/web/src/pages/travel.tsx` | Add accessible Show less/Show more controls below assistant responses; preserve source/urgent notices. |
| `artifacts/api-server/src/kinfolk/__tests__/*` | Add all regression fixtures below. |

### 8. Required tests and deployment gates

The following are mandatory before release. Each test must assert intent, sources, lack of irrelevant MWM recommendation, delivery behavior, and no sensitive-memory leak.

1. Kendrick/Drake cultural-consensus answer contains a labeled consensus conclusion, reasons, nuance, and real sources.
2. A user who prefers Drake can ask the same question and receive the same evidence standards without profile stereotyping.
3. `Who directed the movie Sinners?` answers Ryan Coogler from verified entity context; no duplicate option.
4. `Michelle Williams from Destiny’s Child` resolves the singer and never invokes business discovery.
5. `Natalie` asks one useful clarification rather than defaulting to Portman.
6. `African Diaspora History` opens the existing Library topic with its visible evidence sources.
7. `Philadelphia nightlife` never attaches Los Angeles or Food-only results when nightlife/city filters are unmet.
8. Local college/HBCU response separates nearby institutions from HBCU discovery and provides current source links.
9. Diabetes `Show less` retains authoritative source label and urgent-care boundary.
10. Diabetes `Show more` adds validated detail, not a diagnosis or prescription.
11. `Show less` on culture compacts wording but does not delete source labels.
12. `Show more` does not duplicate or invent sources.
13. A sensitive medical/legal query does not create a lasting content-specific preference signal.
14. An explicit default detail toggle persists through hard refresh.
15. A 30-user production canary still passes after these changes; no new shared-IP 429, 503, or Kinfolk queue regression.

### 9. Production proof package

Replit must provide one package containing: deployed SHA; `/api/version` with clean identity; redacted Part I audit; test command output; source-log examples; screenshots for brief/standard/deep delivery; database migration proof; explicit privacy test output; and the protected 1 → 5 → 15 → 30 canary output. Manus must independently rerun tests 1–15 before Kinfolk is called culturally contextual, current-aware, or adaptive.

## References

[1]: https://www.grammy.com/ "Recording Academy — official Grammy information"
[2]: https://www.cdc.gov/diabetes/ "CDC — diabetes information"
[3]: https://diabetes.org/ "American Diabetes Association"
[4]: https://www.hhs.gov/ "U.S. Department of Health and Human Services"
