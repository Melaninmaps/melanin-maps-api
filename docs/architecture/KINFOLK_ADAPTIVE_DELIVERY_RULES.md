# Kinfolk Adaptive Delivery Rules

## Core Requirement

Kinfolk must decide **what to deliver, how much to deliver, how to say it, and whether to deliver it at all**. It must never become a feed that overwhelms people with Phuket, politics, health content, or other information merely because they once searched it.

## Delivery Profile

The router may use only explicit, non-sensitive preferences to create a delivery profile:

```ts
type DeliveryProfile = {
  detailLevel: 'quick' | 'standard' | 'deep';
  tonePreference: 'default' | 'warm' | 'professional' | 'plain_language' | 'regional_opt_in';
  learningMode: 'guided' | 'self_directed';
  notificationCadence: 'none' | 'essential_only' | 'weekly_digest' | 'opt_in_updates';
  ageBand: 'under_13' | '13_17' | '18_24' | '25_plus' | 'unknown';
  regionalLanguageOptIn: boolean;
  regionalReference: string | null;
};
```

The profile is not a personality score. It does not infer intelligence, culture, political belief, mental health, relationship status, religion, or economic condition.

## Progressive Disclosure

Every non-emergency answer should support depth without forcing depth:

| Detail level | Kinfolk behavior |
|---|---|
| `quick` | A direct answer, two or three key points, and one optional “learn more” path. |
| `standard` | A concise overview, practical context, and two to four vetted next paths. |
| `deep` | A structured explanation, sources, historical/technical context, distinctions, and optional related branches. |

A Phuket search may show a simple answer and an optional “Explore more about Phuket” branch. It must not automatically push beaches, politics, history, weather, restaurants, safety, and nightlife into the conversation.

## Tone Adaptation

Tone follows explicit user preference and conversation context—not demographic assumptions.

- A Philadelphian who opts into regional language can receive relaxed phrasing such as “this jawn was established in …” in a casual cultural or neighborhood context.
- A person in Philadelphia who selects professional tone receives a neutral, structured response for the same request.
- Safety, medical, legal, financial, and emergency content always overrides slang/performance and uses clear, plain language.
- Kinfolk must never imitate an accent, perform identity, or force AAVE/regional language on someone who did not select it.

## Branch & Save Rules

Kinfolk may suggest a related branch or Library save only if all conditions are met:

1. The user’s delivery profile permits suggestions;
2. The branch is directly relevant to the current question or an explicit saved topic;
3. The branch is not sensitive or high-stakes unless the user asked for it;
4. The suggestion is displayed as optional—not as an inference about the user;
5. The suggestion includes provenance: verified Library, current web research, business directory, or community experience.

## Age-Aware Safety

The router must apply age bands as a safety and delivery constraint—not an identity label.

| Age band | Politics/police brutality | Delivery rule |
|---|---|---|
| `under_13` | No unsolicited civic-violence or traumatic-event alerts. | Only show age-appropriate, guardian-enabled safety information when directly relevant. |
| `13_17` | Do not send graphic, fear-inducing, or political engagement content by default. | If the user asks, provide age-appropriate, factual, non-graphic context, trusted adult/resource options, and clear safety support. |
| `18_24` | May receive opt-in local civic/safety summaries. | Never auto-enroll based on location alone. |
| `25_plus` | May receive opt-in local civic/safety summaries. | Use explicit topic and notification preferences. |

An event such as police brutality in Philadelphia must never be pushed to every local member. Eligible audience requires: age-appropriate policy, explicit civic/safety notification opt-in, geographic relevance, non-sensitive preference compatibility, and an official/credible source threshold.

## Safety Is Multi-Dimensional

Kinfolk must recognize that safety may be:

- **Physical:** weather, emergency alerts, unsafe locations, community safety reports;
- **Mental/emotional:** stressful or traumatic subject matter, overwhelm, resource navigation;
- **Financial:** scams, sudden financial risk, exploitative offers, cost clarity;
- **Spiritual/cultural:** culturally significant spaces, faith/community support, identity-respecting context.

This does not authorize Kinfolk to diagnose, surveil, or intervene. Kinfolk provides a bounded, user-controlled pathway to relevant, vetted resources.

## Notification Policy

```text
No proactive notification unless:
  1. user opted into that category and cadence;
  2. message passes age policy;
  3. message passes consequence/source policy;
  4. message is relevant to approximate permitted location or explicit saved topic;
  5. message is not based on a sensitive inference;
  6. user has not reached the configured frequency cap.
```

Emergency alerts are the only category that may override normal cadence, but only when the user enabled emergency alerts or a mutually consented Trusted Safety Share applies.
