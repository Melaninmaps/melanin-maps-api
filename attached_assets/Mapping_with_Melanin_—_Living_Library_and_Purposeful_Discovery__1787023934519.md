# Mapping with Melanin — Living Library and Purposeful Discovery Patch

This patch replaces the static Library model with a **living community knowledge system**. Kinfolk researches a question through a defined community lens and approved source hierarchy, produces a concise answer in chat, and saves the fuller source-cited entry into a reusable Library topic book. A later member can search, open, and expand that entry without needing to recreate the original conversation.

A question such as **“STEM opportunities”** is researched with the explicit `#Black women and minority women` prefix before web retrieval. The resulting entry is stored in the **STEM** book. A later question such as **“STEM in Charlotte”** becomes another STEM entry with `Charlotte` retained as its location label. This creates a durable topic book with nationwide and location-specific knowledge rather than a static, city-limited list.

> The Library stores reviewed, source-cited knowledge entries—not raw personal chat transcripts. It records the question, the concise answer, expandable full explanation, source citations, topic, and optional location label.

## What this patch corrects

| Current problem | Required behavior | Implementation in this package |
|---|---|---|
| Topic cards are static and some controls do nothing. | Every card opens a routed, live topic book; follow controls persist; counts come from the database. | `LivingLibraryPages.tsx`, `libraryRouting.patch.tsx`, `postgresLibraryRepository.ts` |
| History is limited to two Philadelphia links. | History is a nationwide living book whose entries can carry location labels; it grows whenever Kinfolk researches a relevant question. | `library_entries.location_label`, dynamic topic queries, `livingLibrary.ts` |
| Kinfolk answers may be lost after chat. | A safe research answer becomes a source-cited Library entry and exposes a **Read the full source-cited entry** link in chat. | `kinfolkLibraryBridge.ts`, `livingLibrary.ts` |
| Research does not consistently use the intended community lens or trusted source policy. | Kinfolk applies the `#Black women and minority women` lens when the member has not supplied one, then searches only sources appropriate to the subject. | `researchPolicy.ts`, `tavilyResearchProvider.ts` |
| Medical/legal/financial answers could be indistinct from ordinary recommendations. | Domain policies require approved source patterns and place the right educational disclaimer with each stored entry. | `researchPolicy.ts`, `openAiLibraryWriter.ts` |
| MWM system visuals use mismatched Unicode emoji. | All MWM-owned Library, Kinfolk, discovery, navigation, and system accents use the polished gold-brushed feather mark. Member-authored emoji stay untouched. | `GoldFeatherMark.tsx`, `LivingLibraryPages.tsx`, `ExploreAndDirectoryPages.tsx` |
| Explore and Businesses both show an overlapping list of listings. | Directory is direct business lookup; Explore is a small mixed discovery plan. | `ExploreAndDirectoryPages.tsx`, `explorePlanner.ts` |

## Page responsibilities: no duplication

| Page | Member’s job | Data returned | What it must not do |
|---|---|---|---|
| **Business Directory** (`/businesses`) | Find a specific business, service, or provider. | Active verified business records, filters, distance, ownership details, and business detail links. | It must not attempt to build an itinerary or mix cultural-site/event cards into business results. |
| **Explore With Purpose** (`/explore`) | Build a cultural or community-oriented outing, such as “Black art, good food, and history in Charlotte this weekend.” | A small ordered plan containing at most two relevant businesses plus cultural places, events, and appropriate context. | It must not display the full business grid or reproduce the Directory’s category/ownership filter wall. |
| **Living Library** (`/library`) | Recall and explore source-cited Kinfolk research already created for the community. | Topic books, searchable entries, expandable explanations, citations, and follow controls. | It must not become a static set of hard-coded city links or a stream of raw chat transcripts. |
| **Kinfolk** | Ask a new question and receive a concise, current, source-bounded response. | Short answer, applicable disclaimer, citations, and a link to the full Library entry. | It must not claim that an answer is authoritative without sources or keep a research result only inside a transient chat. |

## Research policy

The policy intentionally uses different source rules by subject. The approved medical list begins with government/public-health and clinical authority sources such as MedlinePlus, NIH, CDC, and specialty professional organizations. MedlinePlus identifies itself as a health-information resource for patients, families, and friends operated by the National Library of Medicine within NIH.[1] Legal research prioritizes jurisdiction-specific government/court resources and public legal-help sources such as LawHelp. LawHelp describes state-based legal-help discovery and guides maintained with nonprofit legal-aid, pro bono, court-based, and library partners.[2]

| Domain | Community pre-search behavior | Source priority | Required presentation rule |
|---|---|---|---|
| Medical | Prefix non-self-identified queries with `#Black women and minority women`. | MedlinePlus, NIH, CDC, WHO, professional clinical bodies. | Educational disclaimer; no diagnosis or treatment directive. |
| Legal | Apply the same community lens while preserving jurisdiction in the query. | Court/government sources, Legal Services Corporation, LawHelp, vetted legal aid. | General-information disclaimer; never personalized legal advice. |
| Financial | Apply the same community lens. | CFPB, SEC/Investor.gov, IRS, USA.gov. | General education disclaimer; never individualized investment, tax, or financial advice. |
| STEM and education | Apply the same community lens. | NSF, NASA, NIH, education agencies, universities, vetted community experts. | Source-cited pathways, opportunities, and context; no invented programs. |
| History | Apply the same community lens. | Library of Congress, National Archives, National Park Service, museums, universities, community archives. | Location labels support national and local history without narrowing the whole book to one city. |

## Installation sequence

### 1. Apply the Library database migration

Run `db/migrations/20260817_living_library.sql` through the project’s existing migration process. It creates topic books, entries, citations, and topic follows. The migration assumes the user table is called `users` with a UUID `id`; adjust only that foreign-key reference if the application uses another name.

The seed creates starting books for Medical & Wellness, Legal Information & Access, Financial Foundations, Education & Opportunity, STEM, History & Heritage, and Community. These are not static article collections. The entries and counts are live database values.

### 2. Configure server-only secrets

Add the following values in Replit Secrets. None belongs in the React application.

| Secret | Purpose |
|---|---|
| `TAVILY_API_KEY` | Server-side web research retrieval. |
| `OPENAI_API_KEY` | Server-side structured synthesis. Use your own approved provider key. |
| `OPENAI_API_BASE` | The provider’s OpenAI-compatible API base URL. |
| `LIBRARY_RESEARCH_MODEL` | A structured-output-capable model identifier approved for the project. |

The patch’s research writer is source-bounded: it receives only retrieved, policy-approved source material and is told never to follow instructions contained in website text. Its structured output requires a title, summary, full body, and source indexes.

### 3. Register the living-Library services

In the server bootstrap file, instantiate and register the services before the front-end fallback route.

```ts
import { createPostgresLibraryRepository } from "./library/postgresLibraryRepository";
import { createTavilyResearchProvider } from "./library/tavilyResearchProvider";
import { createOpenAiLibraryWriter } from "./library/openAiLibraryWriter";
import { registerLivingLibraryRoutes } from "./library/registerLivingLibraryRoutes";

const libraryRepository = createPostgresLibraryRepository(dbPool);
const researchProvider = createTavilyResearchProvider(process.env.TAVILY_API_KEY!);
const libraryWriter = createOpenAiLibraryWriter({
  apiKey: process.env.OPENAI_API_KEY!,
  baseUrl: process.env.OPENAI_API_BASE!,
  model: process.env.LIBRARY_RESEARCH_MODEL!,
});

registerLivingLibraryRoutes(app, {
  repository: libraryRepository,
  researchProvider,
  writer: libraryWriter,
});
```

### 4. Connect Kinfolk to the Library lifecycle

Insert `answerWithLivingLibrary(...)` from `server/kinfolk/kinfolkLibraryBridge.ts` in Kinfolk’s research-answer path. The in-chat response shows the concise summary and two or fewer source links. The full explanation lives at the entry’s Library URL, where the member can choose **Read more** or **Read less**.

```ts
const response = await answerWithLivingLibrary({
  memberQuestion: message,
  locationLabel: resolvedLocation?.label ?? null,
  repository: libraryRepository,
  researchProvider,
  writer: libraryWriter,
});
```

Existing purpose-built Kinfolk flows, such as closest-bookstore discovery and city-aware nightlife retrieval, remain direct flows. Route questions that require source-backed explanation, opportunity research, legal information, medical education, STEM, history, or financial education through the Library bridge.

### 5. Replace the static Library UI

Add the routes from `client/src/features/library/libraryRouting.patch.tsx` before the catch-all route. Mount `LibraryHomePage` at `/library` and `LibraryTopicPage` at `/library/topics/:slug`. Replace all static category button or `href="#"` implementations with `Link` components pointing to the correct topic slug.

Import `GoldFeatherMark.tsx` and use it for all MWM-owned accent locations. Do not put Unicode emoji back into category configuration. The `GoldFeatherMark` is the only approved MWM emoji-style mark. Preserve community members’ original text exactly, including any emoji they choose to use.

### 6. Separate Explore from Directory

Mount the two pages in `ExploreAndDirectoryPages.tsx` at `/explore` and `/businesses`. Register `/api/explore/plan` through `registerExploreRoutes.ts`. The Directory keeps the precise business-search endpoint. Explore gets a separate small-plan endpoint and must never call the same “fetch all businesses” routine used by the Directory.

## Release acceptance checks

| Check | Expected result |
|---|---|
| Ask Kinfolk `STEM opportunities`. | The research query uses `#Black women and minority women STEM opportunities`; the response has citations and a link to `/library/topics/stem`. |
| Ask Kinfolk `STEM in Charlotte`. | A STEM entry is stored with `Charlotte` as its location label and is recallable in the STEM book. |
| Open the History book. | Entries are loaded from all stored history research, not a fixed Philadelphia-only array. |
| Search the Library and click a topic card. | The card opens the relevant topic route; it is never a no-op control. |
| Expand an entry. | **Read more** reveals the fuller explanation, disclaimer where required, and sources; **Read less** collapses it. |
| Ask a medical, legal, or financial question. | The response uses the correct source policy and includes the proper educational disclaimer. |
| Visit Explore With Purpose. | It presents a prompt-driven mixed plan with no more than two business stops, rather than a full business listing grid. |
| Visit Business Directory. | It performs direct business/service lookup with verified listing results; it does not present an itinerary. |
| Review all MWM Library and discovery accents. | They use the gold-brushed feather mark; only member-authored text may display Unicode emoji. |

## References

[1]: https://medlineplus.gov/ "MedlinePlus — National Library of Medicine"
[2]: https://www.lawhelp.org/ "LawHelp.org — Legal information and aid resources"
