# Copy and paste this entire prompt to Replit

```text
OWNER-APPROVED TASK — FULL LIBRARY EVIDENCE SEED (DATA-ONLY PRODUCTION OPERATION)

## Decision and purpose

Execute the **Full Library Evidence Seeding** now.

The Library currently has 256 enabled topic cards, but many have only titles, descriptions, and optional `trustedSources` display metadata. That metadata is not the same as real evidence. The live Library graph for `African Diaspora History` proves the defect:

GET /api/knowledge/graph/fbfbc161-5121-4eca-a0a4-c35731b010f6?surface=library
→ published topic returned, but `sources: []` and `articles: []`.

The Library must become a real evidence layer. Every published/enabled topic must have actual, verified source records and direct topic-to-source mappings so a member opening the Book sees real sources—not “We’re building this Book.”

This is an **owner-approved, data-only production exception**. Treat it as separate from the current Kinfolk/capacity P0 work. Do not combine code changes, feature work, or UI work into this operation.

## Absolute no-touch boundary

Touch only Library evidence data, the source-to-topic mapping job/runbook, and narrowly related data validation.

DO NOT touch or modify:
- login, authentication, sessions, subscriptions, or accounts;
- Kinfolk prompts, model configuration, routing, behavior, or capacity work;
- map rendering, map search, safety features, Safety Hub, community, Circles, marketplace, business pages, or mobile app;
- any Library UI, topic-card wording, styling, route, Follow behavior, contribution form, or frontend bundle;
- source code unrelated to an idempotent Library data seeding/validation utility;
- user-created content, follows, saves, notifications, analytics, demand signals, or test accounts.

No broad migration. No redesign. No “cleanup” outside Library evidence tables.

## Required outcome

For every enabled/published topic, create enough real evidence to make the Library useful and truthful.

A topic is not complete until its live graph endpoint returns active, direct sources and the Library topic panel renders those sources after a hard refresh.

Minimum evidence standard:

| Topic class | Minimum directly mapped active sources |
|---|---:|
| Medical / health / mental-health / recovery | 3, with at least 2 institutional or public-health sources |
| Legal / financial | 3, with at least 2 primary government, regulator, or recognized legal-aid sources |
| Travel / country / geography / relocation | 2, with at least 1 official destination, government, or intergovernmental source |
| History / diaspora / culture / education / faith | 2, with at least 1 museum, archive, university, or intergovernmental source |
| Employment / career / skills / home / housing / business | 2, with at least 1 government, recognized professional body, official program, or recognized public-service source |
| Community / lifestyle / entertainment / family | 2, using reputable institutional, public-service, archival, or established editorial sources appropriate to the claim |

Do not pretend all sources carry the same authority. Store authority tier and mapping scope honestly.

## Source governance rules

1. **Never invent a source, URL, title, author, claim, or authority tier.** Every canonical URL must be opened/verified before it is inserted.
2. **Do not treat `trustedSources` metadata as completed evidence.** It is only a lead. Resolve it to a canonical, relevant URL, create a source record, then create a direct mapping.
3. Use sources suited to the topic’s consequence level:
   - Health: CDC, NIH, NIMHD, MedlinePlus, state/local health departments, WHO, recognized clinical/professional organizations.
   - Legal: official statutes/courts/agencies, USCIS, state/local government, Legal Services Corporation grantees, established bar/legal-aid resources.
   - Financial: CFPB, IRS, SEC, FINRA, SBA, Federal Reserve, state regulator resources.
   - Employment: U.S. Department of Labor, Bureau of Labor Statistics, O*NET, state workforce agencies, accredited education institutions.
   - Home / housing: HUD, fair-housing agencies, state/local housing agencies, recognized tenant/legal-aid organizations, public-service home-maintenance and utility-assistance resources when relevant.
   - Travel/country/geography: official tourism authorities, destination governments, foreign ministries/embassies, UNESCO, World Bank, reputable intergovernmental institutions.
   - Diaspora/history/culture: Smithsonian, Library of Congress, NMAAHC, National Archives, UNESCO, universities, recognized museums and archives.
   - Faith/spirituality: academic, museum/archive, or official tradition/community sources; do not present a single viewpoint as universal.
   - Community/lifestyle/entertainment/family: public institutions, recognized nonprofits, archives, established editorial organizations, or carefully labeled community sources.
4. Do not use Facebook, Reddit, unsourced blogs, SEO farms, anonymous social posts, or LLM-generated pages as verified evidence.
5. Community contributions remain a separate layer. They may supplement but never replace the verified starting evidence layer.
6. Do not copy source text into the database beyond a brief factual relevance note needed for discovery. Store canonical URLs and attribution.
7. Do not create medical, legal, financial, safety, political, or historical claims that the source does not directly support.

## Production database procedure

### Step 1 — use the correct production database

Run this against the database used by the Railway API service in production—not local, preview, development, or a separate migration target. Return only a redacted database fingerprint/name and the Railway deployment SHA; never return a connection string, password, token, cookie, or user data.

### Step 2 — discover the actual evidence schema first

Use read-only schema inspection before writing anything. Expected names may be:

- `knowledge_nodes`
- `knowledge_sources`
- `knowledge_topic_sources`

If production uses different names, adapt only the Library evidence table names. Do not infer or alter unrelated tables.

### Step 3 — inventory before writes

Return baseline counts for:

1. every enabled/published topic by category;
2. topics with zero active direct source mappings;
3. active sources and mappings by category;
4. duplicate canonical source URLs;
5. duplicate topic-to-source mappings;
6. invalid/inactive mappings.

The initial live catalog currently contains 256 enabled topics. At a minimum, verify the following visible diaspora topics all receive direct evidence mappings:

- African Diaspora History (`fbfbc161-5121-4eca-a0a4-c35731b010f6`)
- Black & Diaspora Foodways
- Cultural Etiquette & Customs
- Cultural Preservation & Oral History
- Festivals & Cultural Celebrations
- Genealogy & Family History
- Heritage Language Learning

### Step 4 — create an idempotent data-only seed utility

Create a reviewable, idempotent Library evidence seed job/runbook. It must:

1. normalize canonical URLs before inserting;
2. upsert sources by normalized canonical URL rather than creating duplicates;
3. upsert topic-to-source mappings by `(topic_id, source_id, scope)`;
4. mark valid records `active` and use direct verified mapping scope (for example, `verified_topic`) only when the source directly supports that topic;
5. store source name, canonical URL, authority tier, status, `last_verified`, and a concise relevance note;
6. record inserted/reused/skipped/duplicate/failed totals by topic and category;
7. continue to the next topic if one source fails, but flag that topic as incomplete instead of falsely marking it seeded;
8. never overwrite user content, community evidence, or any non-Library record;
9. be safe to rerun without duplicating sources or mappings;
10. be committed as a narrow, auditable data utility/runbook only if source code is needed.

Do not write a startup migration that seeds unknown sources on every boot. The source selection must remain auditable and reviewable.

## Rollout order — execute all, but prove each batch

Execute this work in the following order, returning a report after every batch. Do not wait for another owner decision between successful batches; this task is approved now.

### Batch A — immediate proof (visible diaspora Books)

Seed the seven visible diaspora topics first. For **African Diaspora History**, first create actual direct mappings to these verified institutional sources:

1. UNESCO — General History of Africa
   https://www.unesco.org/en/general-history-africa

2. Smithsonian Folklife Festival — African Diaspora
   https://festival.si.edu/past-program/1976/african-diaspora

3. National Museum of African American History and Culture — Digital Resource Guide
   https://nmaahc.si.edu/explore/nmaahc-digital-resource-guide

After inserting, verify that the live graph endpoint returns at least these three sources for African Diaspora History. Then seed the other six diaspora topics using topic-appropriate verified sources.

### Batch B — high-consequence Books

Seed health, legal, financial, recovery, housing, employment, education, and relocation topics next. These require the stricter source standard above.

### Batch C — geography, country, travel, diaspora, history, and culture

Seed country, geography, travel, history, culture, faith, family, and diaspora topics. Use official tourism/government/intergovernmental and cultural-heritage sources appropriate to each topic.

### Batch D — remaining published Books

Seed the remaining business, community, community_culture, digital, entertainment, lifestyle, home, skills_trades, and related topics under the same canonical-source and direct-mapping rules. `community_culture` must use the culture/community source standard; `home` must use the home/housing source standard above.

## Completion definition

Do not declare “Library seeded” because topic cards have descriptions or because `trustedSources` metadata is populated.

The full task passes only when:

1. Every enabled/published topic has the required minimum number of **active direct graph sources** for its topic class, or is explicitly listed as an exception with a real research reason.
2. The count of published/enabled topics with zero active direct sources is **zero**, except for an owner-approved exception list.
3. The graph API returns the expected sources for the sampled topics.
4. The Library UI renders those sources after a hard refresh and does not show “We’re building this Book” for seeded topics.
5. There are no duplicate canonical source URLs or duplicate topic-source mappings.
6. The report distinguishes verified institutional evidence from community evidence.

## Required production proof back to the owner and Manus

Return all of the following:

1. Railway deployment SHA and redacted production database fingerprint used for the operation.
2. Baseline and final coverage table by category:

| Category | Enabled/published topics | Topics with ≥ required direct sources | Topics with zero direct sources | Exceptions |

3. Machine-readable topic coverage manifest (CSV or JSON) containing:
   - topic ID;
   - topic name;
   - category;
   - source count;
   - source names;
   - canonical source URLs;
   - authority tier;
   - mapping scope/status;
   - last verified date;
   - incomplete/exception reason if any.

4. A compact duplicate/failed-source report.
5. Live graph API payloads for:
   - African Diaspora History;
   - one health topic;
   - one legal topic;
   - one financial topic;
   - one country/travel topic;
   - one culture/history topic.

6. Screenshots or live browser evidence after hard refresh showing African Diaspora History and at least one other Book rendering real verified sources.
7. Exact list of files changed. It should be data/runbook-only; if any unrelated source/UI file changes, stop and explain before proceeding.

## Founder notification rule

If a batch fails, source verification cannot be completed, the schema differs in a way that risks unrelated data, or production data integrity is uncertain: stop that batch, do not guess, and notify the founder first within five minutes with the affected topic count and exact blocker.

Begin now with Batch A, then continue through B, C, and D. Do not touch unrelated platform features.
```
