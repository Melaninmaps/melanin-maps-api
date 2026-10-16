# Kinfolk Focused Business-Discovery Acceptance — 2026-10-16

**Status:** SOURCE COMPLETE / MEMBER ACCEPTANCE PENDING

## Scope

This focused correction validates Kinfolk discovery against controlled representative records only. It does **not** create, update, migrate, or delete production business data; it does not overwrite owner descriptions; and it does not call staging, deploy, or create a mobile build.

## Proven discovery paths

| Member request | Retrieval and hard exclusions | Fields used | Controlled result and explanation |
| --- | --- | --- | --- |
| `Find the restaurant called AMINA in Philadelphia` | Exact normalized-name lookup constrained by `city` and `stateCode`; no category broadening. | `name`, `city`, `stateCode`, canonical `businessId`. | Resolves the single canonical AMINA record. |
| `It's Friday night. I want dinner, but I don't want to wait.` | Subject is `restaurant` with `dining_now`; non-dining records (including caterer-only and bakery records) and cultural/map entities are excluded. Closed published Friday schedules are excluded. | `category`, `subcategory`, `name`, `description`, `tags`, `specialties`, `address`/`phone`/`website`, `hours`, owner-published `weeklySchedule`/`showAvailability`, and governed community signals. | **1. Cedar Supper** — documented evening service. **2. Juniper Table** — also has published Friday service, but its governed `Worth the Wait` signal is described as a possible tradeoff and ranks behind Cedar. The member-visible reason says to confirm current availability; it never claims a live wait, open-now status, or long line. |
| `Find a restaurant that is romantic but not loud` | `not loud` is a current-turn hard exclusion for a documented loud/noisy/high-energy/nightlife/live-music setting. | Current request plus `category`, `subcategory`, `name`, `specialties`, `tags`, `environmentTags`, and governed community signals. | **Candlelight Dining** remains. **Late Room** is excluded because its published profile says `high energy` / `live music`. |
| `Find a wig installation in Philadelphia that includes shampoo and detangling` | Requires salon subject **and** all documented service terms; a partial match is rejected. | Structured `category`/`subcategory`/`name`/`specialties` for subject classification; published `description`, `tags`, and `specialties` for the explicit service evidence. | **Complete Wig Studio** is retained because it documents wig installation, shampoo, and detangling. **Install Only Studio** is excluded because detangling is absent. |

## Ranking boundaries

1. **Current request before saved preferences.** The active request supplies current priority and exclusions; preferences remain a tie-breaker and never qualify an unrelated business type.
2. **Governed community evidence is supporting evidence, not a star rating or live operational fact.** `Worth the Wait` changes the rank as a documented tradeoff, while `Great Service` can support a match reason. Counts do not establish real-time availability or a precise wait.
3. **Published schedules are static owner-provided information.** They are only used when the owner opted to show availability and they result in `confirm current availability`, not a live-status claim.
4. **No content rewriting.** The correction reads existing structured fields and published description/tag/specialty evidence; it does not modify business records or user-authored reviews.

## Focused validation

```text
pnpm exec vitest run src/kinfolk/__tests__/local-business-discovery.test.ts --testNamePattern='immediate dining|wig-installation|Friday-night dinner'
pnpm exec vitest run src/kinfolk/__tests__/business-personalization.test.ts --testNamePattern='Friday-evening|romantic but not loud'
pnpm exec vitest run src/kinfolk/__tests__/business-reference.test.ts --testNamePattern='explicit exact-name lookup'
pnpm exec vitest run src/kinfolk/__tests__/governed-business-repository.test.ts --testNamePattern='Friday schedules|wash-service'
pnpm typecheck  # artifacts/api-server
```

All selected acceptance tests pass and API TypeScript typechecking passes.

## Release-gated member acceptance

When an integrated release is separately authorized, test through a real authenticated Kinfolk session and record the actual business IDs, retrieved evidence, exclusions, ranks, and displayed recommendations for:

1. Exact-name lookup.
2. Friday-night dinner with no-wait preference.
3. Romantic but not loud dining.
4. Wig installation with shampoo and detangling.

Exercise exact-name and natural-language paths in Web, iOS, and Android where each client is applicable. Verify that incomplete descriptions, absent VIBES, and absent published hours produce a clear evidence limitation—not a fabricated fact or irrelevant recommendation. No staging invocation, deployment, migration, production-data change, or mobile build has been performed for this source review.
