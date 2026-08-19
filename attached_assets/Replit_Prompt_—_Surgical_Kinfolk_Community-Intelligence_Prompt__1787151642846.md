# Replit Prompt — Surgical Kinfolk Community-Intelligence Prompt Template

## Owner-authorized outcome

Implement the supplied **shared Kinfolk community-intelligence prompt policy** for all Kinfolk first turns. It covers music, art, market pricing, housing, health, legal, education, home service, and ordinary questions.

Kinfolk must consistently:

1. understand the actual question;
2. ask one clarification only when the core subject is materially ambiguous;
3. answer first;
4. offer only topic-relevant, optional next paths;
5. retrieve local/current/community content only after the member selects a path;
6. use the permanent diaspora-first research plan before any web research;
7. show a source note only when a current/live or high-stakes limit is material; and
8. never turn an ordinary question into a generic business guide or sales experience.

This is a **prompt-template and response-contract patch**. It does not authorize an application redesign, a generic recommendation rewrite, a schema change, a migration, a mobile change, or a deployment.

## Exact behavior examples

| Member question | Required first response behavior |
|---|---|
| `what rappers are from ATL` | Direct Atlanta hip-hop answer; no generic source disclaimer; no `Your Guide To`; no food/bookstore/business cards; optional paths are music events, music venues/underground clubs, artist context, or not right now. |
| `What is the ATL art scene like?` | Direct cultural overview; optional art events, galleries/studios/art walks, local artists, or not right now; no generic shopping/restaurant guide. |
| `What is ATL market pricing?` | Ask only: `When you say market pricing, do you mean housing, groceries, art, or retail pricing?` No prices, businesses, guide, or option cards before the answer. |
| `What are Atlanta housing market prices?` | Direct, dated/source-aware explanation; optional neighborhood trends, homebuyer resources, local housing support, or not right now; no preloaded realtor/business list. |
| `What should I consider about thinning hair?` | Educational, non-diagnostic answer; brief contextual health note; optional basics, clinician questions, community-informed support, local professional options, or not right now. |

## Absolute scope lock

Do not change any source file until you report the exact active paths that will be used.

You are allowed to change only:

```text
1. The supplied server/kinfolk/communityIntelligence/* files
2. One active server-side Kinfolk LLM prompt/orchestration file
3. One active server-side Kinfolk chat handler, only to call the shared policy before generic guidance/guide logic
4. One focused Kinfolk test registration/import file if the existing test runner requires it
```

You are **not** authorized to change:

```text
any client UI or Kinfolk response renderer
any generic guide component
any map or directory ranking code
any business, restaurant, bookstore, event, or venue query outside the existing member-selected action paths
Living Library data/schema
mobile source
API contract outside the existing Kinfolk chat response envelope
App.tsx or global routes
database schema/migrations
deployment configuration/environment variables
preview, QR, waitlist, or release files
```

The previously supplied music-exploration package owns the **post-selection music paths**. This prompt-template patch owns only the shared first-turn policy and structured response contract. Do not merge them into a broad rewrite.

## Supplied files to add exactly

Copy these files into the active server structure:

```text
server/kinfolk/communityIntelligence/types.ts
server/kinfolk/communityIntelligence/communityIntelligencePolicy.ts
server/kinfolk/communityIntelligence/communityIntelligencePrompt.ts
server/kinfolk/communityIntelligence/communityIntelligenceAnswerer.ts
server/kinfolk/communityIntelligence/communityIntelligencePolicy.test.ts
```

Do not edit the policy text, forbidden generic-disclaimer check, source-note policy, optional-path catalog, response schema, or validation guard unless the owner explicitly approves a policy change.

## Required discovery report — stop before source changes

Before adding or editing code, report:

1. The exact active path where the Kinfolk system prompt and LLM completion are built.
2. The exact active path of the `POST /api/kinfolk/chat` handler.
3. The existing server-side LLM client shape and its structured-output capability.
4. The exact existing retrieval functions that provide Living Library context, verified current events, verified directory data, and moderated Community-Sourced signals.
5. The exact `git diff --name-only` expected before generated output.

If the live LLM client cannot use JSON-schema structured output, stop and report it. Do not replace it, change models, expose it to the client, or create a regex-only substitute without new owner approval.

## Required server integration

### 1. Add a server-only structured-model adapter

In the one active Kinfolk LLM orchestration file, adapt the existing server-side client to the supplied `KinfolkStructuredModel` interface. The adapter must remain server-side.

For an OpenAI-compatible existing client, the shape is:

```ts
const communityIntelligenceModel = {
  async complete({ messages, responseFormat }) {
    const completion = await existingKinfolkOpenAIClient.chat.completions.create({
      model: existingKinfolkModelId,
      messages,
      response_format: responseFormat,
    });
    const content = completion.choices[0]?.message?.content;
    if (!content) throw new Error("Kinfolk model returned no community-intelligence content.");
    return content;
  },
};
```

If the active project uses the Manus server helper instead, preserve its existing model choice and pass the supplied schema through its supported structured-output field. Do not change the model catalog, API key, or client-side architecture.

### 2. Build the plan before generic Kinfolk behavior

In the active chat handler, after extracting the member question, location, and tone but **before** generic LLM output, generic guide construction, directory/business recommendation, or auto-result retrieval, add:

```ts
import { answerWithCommunityIntelligencePrompt } from "./kinfolk/communityIntelligence/communityIntelligenceAnswerer";
```

Then call the shared prompt layer. Substitute only the actual existing names for member location, preferred tone, LLM adapter, and pre-existing retrieved context.

```ts
const communityResponse = await answerWithCommunityIntelligencePrompt({
  model: communityIntelligenceModel,
  request: {
    question,
    memberCity: member.profileCity ?? null,
    memberStateCode: member.profileStateCode ?? null,
    preferredTone: member.kinfolkTonePreference ?? "warm_standard",
    retrievedContext: approvedRetrievedContext,
  },
});

return res.status(200).json({
  ...existingChatEnvelope,
  ...communityResponse,
  message: communityResponse.answer,
});
```

The early `return` is mandatory for all first-turn questions handled by this policy. It prevents the existing generic guide/business code from appending unrelated cards after the direct answer.

### 3. Diaspora-first research ordering

When `communityResponse` requires retrieved context, use `resolveCommunityIntelligencePlan(...).researchPlan.queryGuidance` as the research-query order. The first query is the permanent Black-women lens; the second query is the Black-diaspora context. Run them in that order before any general search.

Only supply results from real, approved retrieval. If the retrieval layer has no supported evidence, provide an answer that omits unsupported details. Do **not** add the generic “could not verify” disclaimer.

Do not run post-answer event, venue, business, or directory retrieval. Those occur only after a member selects one of the already-approved optional action paths.

### 4. Failure behavior

If JSON parsing or validation fails, return a short truthful first-turn response that preserves the direct-answer contract. Do not call the old generic guide, business recommender, or fallback result list.

Example safe failure message:

```text
I want to answer that carefully. I can share the clearest general context I have right now, and you can choose a relevant next step if you want to explore further.
```

The failure path must have:

```ts
sourceNote: null
guide: null
autoResults: []
```

## Mandatory response rules

The response schema and validator enforce the following. Do not work around them:

| Rule | Required behavior |
|---|---|
| **Answer first** | The `answer` field directly answers the member’s question. |
| **Clarify narrowly** | If `needsClarification` is true, show exactly the policy’s one question and no options/results. |
| **No boilerplate disclaimer** | Never append “I can give general context, but I could not verify a source for the specific factual details.” |
| **Material-only source note** | `sourceNote` is null for ordinary cultural/general answers; only current/live or high-stakes policy text is allowed. |
| **No preloaded results** | `autoResults` is always `[]`; `guide` is always `null`. |
| **No guide/sales language** | The response may not use `Your Guide To`, `Must-Visit Spots`, generic business promotion, or unrelated directory cards. |
| **Consent** | Optional paths require member selection. |
| **Local truthfulness** | Never label national/distant inventory as local; never request city again when already resolved. |
| **Community safety** | Use `Community Intelligence` and `Community-Sourced`, never language that labels a minority community or neighborhood as unsafe. |
| **Diaspora first** | Begin every external research sequence with the Black-women lens, then Black-diaspora context. |

## Required tests and proof

Run the supplied tests and add only the imports/configuration needed for the project’s existing test runner. Tests must prove:

1. ATL music question receives a direct answer, no generic disclaimer, no guide, no results, and only music-specific optional paths.
2. ATL art question offers only art-specific paths.
3. Ambiguous ATL market pricing asks the one clarification and nothing else.
4. Specified Atlanta housing prices receive a current-detail policy and no preloaded realtors/businesses.
5. Health receives a non-diagnostic, high-stakes policy with consent-gated options.
6. A model response containing the forbidden generic disclaimer is rejected.
7. A model response attempting a guide or preloaded result is rejected.
8. A compliant direct-answer response is accepted.

Before asking for owner deployment approval, return:

```text
- exact active-file discovery report
- final git diff --name-only
- final git diff --stat
- passing focused test output
- passing type-check output
- four captures: ATL music, ATL art, ambiguous market pricing, and health
- explicit proof that no generic business/guide card appeared in any capture
```

If any extra source file is needed, if a test fails, or if the first-turn response still creates a guide/card, stop. Do not broaden scope, deploy, or create a workaround without new written owner approval.
