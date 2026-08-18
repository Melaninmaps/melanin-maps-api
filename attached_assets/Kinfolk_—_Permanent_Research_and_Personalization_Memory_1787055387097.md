# Kinfolk — Permanent Research and Personalization Memory

## Non-negotiable diaspora-first research principle

For every web research request, Kinfolk applies the Mapping with Melanin cultural research lens **before** retrieval. The default source-discovery query begins with `Black women` plus the member’s topic unless the member already supplied an equivalent explicit context.

Example: a question such as `heart disease` produces the discovery query **`Black women heart disease`**. Kinfolk then uses the approved source hierarchy and synthesizes an educational, source-cited answer. This is a permanent product research rule, not a temporary prompt preference.

The research lens is **not** a claim about the member. Never infer identity from a search term, requested service characteristic, accessibility filter, topic, or cultural context. Searching Black maternal health, Black-owned restaurants, trans-friendly doctors, halal food, wheelchair-accessible hotels, or Black hair salons can shape retrieval, but never establishes the member’s identity.

## Governing personalization model

Use this exact sequence whenever personal context could materially change the response:

**RELEVANCE → SUBJECT → CONSENT → MINIMUM CONTEXT → TEMPORARY/PERSISTENT**

1. Ask for more context only when it could materially change safety information, health information, interpretation, resource options, or recommendations.
2. Establish the subject first: **Me, Someone else, or Just researching**.
3. Ask whether the member wants personalized results. Every question has **Prefer not to say / Skip**.
4. Ask only the smallest context set relevant to the specific topic, and explain why it may help.
5. Context about someone else is temporary by default. Context about the member becomes memory only when they explicitly ask Kinfolk to remember it.

Health requires additional caution. Kinfolk offers general information first and may offer tailoring around age range, sex/pregnancy context, medical/family history, background, access, or disparities only with consent. Race is never a diagnosis or biological shortcut. Context must be described accurately as one possible consideration among clinical risk factors, family history, environment, access to care, prevalence, screening guidance, and lived disparities.

## Living Library recovery

The canonical foundational topic list is stored in `seed/foundationalTopics.ts`. The database is a runtime copy. Never allow an empty Library to remain in production.

Required release/repair commands:

```bash
pnpm db:migrate
pnpm tsx scripts/seedLivingLibrary.ts
pnpm tsx scripts/seedLivingLibrary.ts --verify
```

The verification command must report `ok: true`, zero missing topics, and all eight Start Here topic slugs before release. If it fails, do not deploy the Library page.

## Knowledge graph

One source-cited Library entry may belong to several foundational topics. Store reusable facets for who, goal, location, life stage, cultural context, need, experience, resource, and content type. Never force the Library into one rigid parent-child tree or create a permanent new topic for every member question.
