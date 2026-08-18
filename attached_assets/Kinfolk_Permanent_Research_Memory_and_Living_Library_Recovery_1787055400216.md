# Kinfolk Permanent Research Memory and Living Library Recovery

## Product rule

Kinfolk is permanently diaspora-first in its **research retrieval**. Before searching the web, it applies the cultural research lens for Mapping with Melanin. A member question such as:

```text
heart disease
```

produces the source-discovery query:

```text
Black women heart disease
```

Kinfolk then uses the established approved-source policy for the domain, writes a source-cited educational answer, and can store the verified result in the Living Library.

> The diaspora-first lens is a retrieval policy. It is **not** a statement that the member is a Black woman. Kinfolk must never infer identity from a question, location, requested business characteristic, accessibility filter, or cultural search term.

## Required source files

| File | Purpose |
|---|---|
| `seed/foundationalTopics.ts` | Canonical, recoverable list of all 28 foundational Library topics. |
| `server/library/seedFoundationalTopics.ts` | Idempotent seed and verification service. |
| `scripts/seedLivingLibrary.ts` | Command-line recovery command. |
| `server/kinfolk/diasporaFirstResearchPolicy.ts` | Permanent retrieval lens and strict non-inference boundary. |
| `server/kinfolk/intentClarification.ts` | Topic-specific, optional minimum-context questions. |
| `server/kinfolk/prepareResearchPlan.ts` | One planning entry point for Kinfolk requests. |
| `client/src/features/kinfolk/KinfolkContextClarifier.tsx` | Member-facing optional clarification interface. |
| `replit.md` | Persistent Replit project instructions that must remain at the project root. |

## Exact Replit setup sequence

### 1. Apply database migrations

Run the Living Library foundation migration first, then the context-boundaries migration from this package:

```bash
pnpm db:migrate
```

The migrations must create or retain `library_topics`, `library_entry_topic_links`, `library_entry_facets`, `library_topic_relationships`, `kinfolk_member_memory`, and `kinfolk_search_context`.

### 2. Seed the foundation on every new environment and recover it if needed

Add these package scripts:

```json
{
  "scripts": {
    "library:seed": "tsx scripts/seedLivingLibrary.ts",
    "library:verify": "tsx scripts/seedLivingLibrary.ts --verify"
  }
}
```

Run the following **before the Library web deployment starts**:

```bash
pnpm library:seed
pnpm library:verify
```

The verification output must report:

```json
{
  "ok": true,
  "expectedTopicCount": 28,
  "missing": [],
  "missingFeatured": []
}
```

If a migration, restore, reset, or new environment leaves the Library topics empty, run the same two commands. The seed is idempotent: it restores/updates the canonical foundation but does not delete Kinfolk’s source-cited entries.

### 3. Make seeding a release gate

Set the web/API release command to stop if verification fails:

```bash
pnpm db:migrate && pnpm library:seed && pnpm library:verify && pnpm build && pnpm start
```

Do not deploy a Library page with zero foundation topics or missing Start Here topics.

### 4. Use Kinfolk’s research planning step before web retrieval

For every Kinfolk research request:

```ts
const plan = prepareKinfolkResearchPlan(memberQuestion, {
  subject: "unknown",
  memberContext: loadOnlyExplicitRememberedMemberContext(memberId),
});

// For "heart disease", plan.researchQuery is "Black women heart disease".
const sourceResults = await approvedResearchProvider.search(plan.researchQuery);
const answer = await sourceBoundWriter.write({ question: memberQuestion, sourceResults });
```

Then show the concise answer with sources. If `plan.clarification` has steps, show `KinfolkContextClarifier` as an **optional offer**, not as a gate that blocks general information.

### 5. Apply the consent model exactly

Use the following order:

| Step | Kinfolk behavior |
|---|---|
| Relevance | Ask for added context only if it could materially improve the answer, resource, safety guidance, or interpretation. |
| Subject | Ask whether the question is for **Me**, **Someone else**, or **Just researching**. |
| Consent | Ask whether the member wants the answer tailored. Offer Skip/Prefer not to say. |
| Minimum context | Ask only topic-relevant details and explain why. |
| Storage | Keep someone-else and unapproved context temporary. Remember member context only with explicit permission. |

For a health topic, Kinfolk provides general information and may offer optional tailoring around age range, sex/pregnancy context, history, or background. It must not demand demographics, treat race as a diagnosis, or suggest that a search has disclosed the member’s identity.

### 6. Persist knowledge without creating a rigid hierarchy

After a safe, source-cited answer is approved for the Library, store it once and attach every relevant foundation and facet through `persistFacetedKinfolkResearch`. For example, a Black maternal-health resource can link to Health, Family, Rights, Legal Information, and Community Resources, with facets such as location, provider search, lived disparity, and professional resource.

Guides, businesses, events, people, historic places, organizations, and personal stories are **content types/facets**. They are not replacement foundation topics.

## Required non-negotiables

1. The permanent retrieval lens is **Black women** plus the question unless an equivalent context is already stated.
2. Search context informs retrieval but does not become profile identity.
3. Information about another person is temporary and expires within 24 hours.
4. Kinfolk uses only member attributes that were explicitly volunteered and explicitly approved for future memory.
5. Every clarification question can be skipped; the member still receives useful general results.
6. Cultural context crosses every topic. Do not put all culturally relevant knowledge in a single isolated resource branch.
7. Health, legal, and financial material remains educational and source-cited; Kinfolk must not diagnose, provide individualized legal advice, or replace professional care.

## Release checks

Run the included test suite and manually verify these cases:

| Member question | Required behavior |
|---|---|
| `heart disease` | Research query begins `Black women heart disease`; Kinfolk gives a cited general answer and offers optional subject/personalization clarification. |
| `Black women heart disease` | Does not duplicate the prefix. |
| `Black-owned restaurants in Charlotte` | Uses the requested business characteristic; does not set a Black identity attribute for the member. |
| `my father has high blood pressure` | Treats father context as temporary, asks only optional relevant details, and does not add it to member memory. |
| `solo travel Morocco` | Offers optional trip context only if the member wants safer/tailored guidance. |
| Fresh or restored database | `pnpm library:seed && pnpm library:verify` restores 28 topics and all eight Start Here topics. |
