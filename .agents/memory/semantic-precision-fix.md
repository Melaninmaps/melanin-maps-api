---
name: Universal Search semantic precision fix
description: Root cause of cross-category contamination in universal-search.ts and the extractConcepts fix applied Aug 2026.
---

## The Bug

`extractConcepts()` in universal-search.ts line 323 (before fix):
```typescript
if (cats.length > 0) searchTokens.push(word);  // BUG
if (bigram && ...) searchTokens.push(bigram);
```

When `bigram` matched (e.g. "black church"), `cats` was populated from the bigram — but `word` ("black") was pushed to `searchTokens`. PASS 1 then ran `name ILIKE '%black%'`, causing "Black Dragon Take Out" to appear at `exact_name` tier for "historic Black church" queries.

## The Fix

Separated bigram/trigram/word matching so ONLY the matched n-gram level is pushed — never its sub-tokens:

```typescript
const wordCats    = CONCEPT_TO_CATEGORY[word]    ?? [];
const bigramCats  = bigram  ? (CONCEPT_TO_CATEGORY[bigram]  ?? []) : [];
const trigramCats = trigram ? (CONCEPT_TO_CATEGORY[trigram] ?? []) : [];

if (wordCats.length  > 0)  searchTokens.push(word);     // only if WORD matched
if (bigramCats.length > 0) searchTokens.push(bigram);   // only if BIGRAM matched
if (trigramCats.length > 0) searchTokens.push(trigram); // only if TRIGRAM matched
```

## Defense in Depth

Added faith category post-filter after `searchBusinesses()`: for `intentType === "faith"`, filters results to faith-related categories. Falls back to unfiltered if no faith businesses would remain.

## Acceptance Tests (all pass Aug 2026)

- "historic Black church" → Black Dragon Take Out NOT present at exact_name tier ✅
- "Black Catholic church" → No cross-category contamination ✅
- "Black-owned restaurant" → Only food businesses ✅
- "Black hair salon" → Only beauty businesses ✅
- "Black history museum" → Heritage intent with museum results ✅

**Why:** The `??` operator on line 323 evaluated cats from the bigram but still pushed the WORD to searchTokens. Any CONCEPT_TO_CATEGORY key that is a bigram where the first word is a common modifier (Black, historic, traditional) causes the modifier to become a name-search token.
