# Kinfolk Community Intelligence — Market Pricing and Art Scene Query Analysis

## Core conclusion

The community-intelligence standard applies cleanly to both market-pricing and art-scene questions, but the two categories need different safeguards.

**Market pricing** is often ambiguous and time-sensitive. Kinfolk must identify which market the member means, then ground current claims in a dated source. It must not turn a price question into a realtor, lender, or generic-business list.

**Art-scene questions** are usually broad cultural-context questions. Kinfolk should answer the question directly, then offer culturally relevant local paths such as exhibits, galleries/studios/art walks, or local artists. It must not turn an art question into a restaurant/shopping guide or pretend it knows every independent artist, pop-up, or event.

> The consistent rule is: **answer first; clarify only when needed; offer only relevant options; retrieve only after the member chooses; label current or Community-Sourced information honestly.**

## 1. Market-pricing queries

### Why “market pricing” is different

The phrase **“ATL market pricing”** does not identify a single subject. It could mean housing, rent, groceries, retail, art, or another market. Giving a housing answer, a grocery-price list, or local businesses before the member specifies the meaning would be another form of the same misrouting shown in the ATL-rappers screen.

For this narrow case, a clarification is the correct first response—not a failure to answer. It is the minimum question required to avoid giving the wrong answer.

| Member question | First Kinfolk response | What must not happen |
|---|---|---|
| `What is ATL market pricing?` | `When you say market pricing, do you mean housing, groceries, art, or retail pricing?` | No price figures, no “Your Guide To,” no businesses, no optional cards, and no web-research claim before the member clarifies. |
| `What are Atlanta housing market prices?` | Plain-language, dated explanation of the relevant city/metro/neighborhood measure, using actual retrieved sources. | No individual investment, tax, financial, or mortgage advice; no automatic realtor/lender list. |
| `What are Atlanta grocery prices like?` | Plain-language current affordability context, clearly distinguishing a price index or survey from a member’s own grocery bill. | No invented average basket prices; no automatic grocery-store list. |
| `What is the ATL art market like?` | Direct cultural/economic context about the art market, with careful source/date treatment for current sales or fair information. | No art appraisal, investment recommendation, or gallery promotion before the member chooses a path. |

### Correct first-turn flow for a specified market

When the member has named the market, Kinfolk should provide a **brief direct answer** before it offers paths. The response must include the geographic scope and time period for any current figure. “Atlanta” can mean city limits, the metro, or a specific neighborhood; Kinfolk must state which measurement the source supports instead of quietly treating them as the same market.

For example, a housing answer should read conceptually like this:

> “Atlanta housing prices vary widely by neighborhood and by whether a source measures the city or the metro area. I can summarize the latest available trend with its date and source, then you can choose whether to look at neighborhood trends, homebuyer resources, or local housing support.”

This is information and context—not an instruction to buy, sell, borrow, or invest. The current-detail footer should be small and exact:

> `Current details can change. Confirm with the original source before acting.`

### Allowed market-pricing next paths

| Resolved market | Optional paths after direct answer | Allowed information sources | Community role |
|---|---|---|---|
| **Housing/rent** | `See neighborhood trends` · `Explore homebuyer resources` · `Find local housing support` · `Not right now` | Dated public market data, housing agencies, reputable research, and relevant Living Library topics. | Moderated local context about navigating neighborhoods and resources; never unverified property values or discriminatory neighborhood labels. |
| **Groceries/affordability** | `See current price sources` · `Explore affordability resources` · `Find community food resources` · `Not right now` | Public price/consumer data, official food-resource directories, and current local resource information. | Moderated Community-Sourced context may identify access barriers or resource experiences, but it never replaces dated price data. |
| **Art market** | `Learn about the local art market` · `See current art events` · `Explore galleries, studios & art walks` · `Not right now` | Research-backed cultural/economic sources, verified art-event sources, and Living Library entries. | Moderated artist/ambassador contributions can reveal independent artists and under-covered spaces. |
| **Retail/other** | Clarify the product/category if still too broad, then offer source-appropriate paths. | Original/current price sources, public data, and reputable research. | Community signals may add practical context, but never create unsupported prices. |

### Market-pricing failure cases to block

| Failure | Why it fails | Required guard |
|---|---|---|
| Housing answer given to an ambiguous “market pricing” question | Kinfolk guessed the domain. | One exact clarification question; no retrieval or options until answered. |
| Current price shown without date, geography, or source | The number is unusable and can mislead decisions. | A current-data citation/source marker plus the small current-detail footer. |
| Realtor, lender, retail, or grocery cards shown automatically | The member asked for information, not a sales list. | `autoResults: []`; consent-gated option paths only. |
| Neighborhood characterized as “safe” or “unsafe” from demographics | Violates the Community Intelligence language and can cause harm. | Only use moderated Community-Sourced context and neutral, evidence-based wording. |
| Nationwide figure labeled as Atlanta local pricing | The location claim is false. | Require the source’s actual geography; label metro/city/neighborhood precisely. |

## 2. Art-scene queries

### What Kinfolk should do for “What is the ATL art scene like?”

This is primarily a cultural-context question. Kinfolk should give a short, thoughtful overview of Atlanta’s art ecosystem before it asks the member to choose anything. The answer may cover the existence of galleries, studios, public art, artist collectives, university/cultural institutions, and neighborhood-scale activity—but it must be based on supplied research context, not invented names or live details.

The next line should be optional and specific:

> `Would you like to explore more of the local art scene?`

| Optional path | What appears after member selection | What must not appear |
|---|---|---|
| `See current art events` | Verified, date-specific exhibits, openings, art walks, fairs, or talks; each has original organizer/source details. | An undated event, a fake current listing, or a generic nightlife/food guide. |
| `Explore galleries, studios & art walks` | Verified cultural sites and appropriately categorized spaces with canonical detail URLs. | Restaurants, bookstores, unrelated retail, or a nationwide list labeled local. |
| `Learn about local artists` | Research-backed artist context plus moderated Community-Sourced/ambassador content when verified. | Invented biographies, representation claims, or unsourced labels. |
| `Not right now` | The direct cultural answer remains. No retrieval occurs. | A replacement promotion or a generic business list. |

### Art scene as a living community record

Art is a strong example of why Kinfolk is more than a standard search box. Formal cultural sources often cover established institutions but may miss independent galleries, murals, pop-ups, artist-run studios, and emerging artists. Kinfolk should not pretend that omission means those communities do not exist.

Instead, it should treat thin coverage as a **moderated coverage gap**. A cultural ambassador or community member can contribute a lead, event, artist, or place. After moderation and verification, that information may become Community-Sourced local context, a cultural-site record, an event entry, or a Living Library topic. The next member gets a richer answer without Kinfolk turning an unverified submission into a fact.

### Art-scene source-note rules

| Content type | Source-note behavior |
|---|---|
| General cultural overview | No generic source disclaimer. Answer directly. |
| Current exhibition, opening, art walk, fair, ticket, or hours | Small footer: `Current details can change. Confirm with the original source before acting.` |
| Artist biography or representation | Omit an unsupported claim; provide a source link when one is available. Do not use a boilerplate limitation sentence. |
| Community contribution | Clearly label `Community-Sourced` and show only moderated/approved context. |

## 3. Shared intelligence and retrieval contract

The first-turn model response is never a place to dump results. It communicates an answer and the correct choices. Actual retrieval happens only after the member selects one.

```text
Question
  → classify topic + intent + freshness + risk + location state
  → answer or one essential clarification
  → optional topic-specific paths
  → member selects a path
  → retrieve only the permitted local/current/research/community source set
  → display clearly labeled result + material-only source note
  → store reusable research / moderated signal / coverage gap where appropriate
```

| Contract field | Market pricing | Art scene |
|---|---|---|
| **Topic** | `market_pricing` or `housing` | `art` |
| **Clarification threshold** | High: clarify if market type is unclear. | Low: a broad cultural question can usually be answered directly. |
| **Freshness need** | Usually `current`; prices and trends age quickly. | `durable` for cultural overview; `current` for events/hours/exhibitions. |
| **Risk level** | `decision_support`; avoid individual investment/tax/financial advice. | Usually `ordinary`; source/dates matter for live details. |
| **First-turn result** | Explanation or one precise clarification. | Direct cultural overview. |
| **Auto results** | Never. | Never. |
| **Community learning destination** | Living Library for durable concepts; moderated context for resource-navigation gaps. | Living Library, Cultural Ambassador/Community-Sourced signal, or cultural-coverage gap. |

## 4. Acceptance tests

| Test case | Required result |
|---|---|
| `What is ATL market pricing?` | Exactly one clarification: housing, groceries, art, or retail. No guide, options, results, businesses, or source note. |
| `What are Atlanta housing market prices?` | Direct answer with a dated/geographically precise source context; small current-detail footer; only housing-specific optional paths; no realtors preloaded. |
| `What are Atlanta grocery prices like?` | Direct current-affordability context; no invented basket price or grocery-store cards; affordability paths only after selection. |
| `What is the ATL art market like?` | Direct art-market context; no appraisal/investment advice; art-specific optional paths only. |
| `What is the ATL art scene like?` | Direct cultural overview; art events, galleries/studios/art walks, local artists, and not-right-now options only. |
| Art events selected | Only verified/date-specific local art events with source/organizer information and the current-detail footer. |
| Galleries/studios selected | Only appropriately categorized Atlanta/explicit-metro cultural places with canonical detail URLs. |
| Local artists selected | Research-backed or moderated Community-Sourced artist context; no invented biographical claim or unrelated business cards. |
| `Not right now` on either category | No retrieval occurs; the answer remains; no replacement promotion appears. |
| Regression | No `Your Guide To`, `Must-Visit Spots`, restaurant, bookstore, generic business, nationwide-as-local result, or generic “could not verify” disclaimer appears. |

## Recommended implementation sequence

The supplied community-intelligence prompt package already contains the shared policy rules for these categories. Before broadening live behavior, Replit should implement and verify the music path first, because it has a concrete visible failure and a separate focused patch. The next owner-approved incremental change should add **market-pricing and art-scene retrieval adapters** behind the same first-turn contract, with their own limited source scope and acceptance tests.

That sequence keeps the platform crisp: one shared intelligence standard, but no large unreviewed rewrite and no promise of current local information until the correct source path exists.
