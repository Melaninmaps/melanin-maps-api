# Mapping with Melanin — Page and Flywheel Audit

## Executive finding

The observed pages are not failing because the platform lacks listings. They are failing because **location, inventory type, filters, and fallback state are handled independently by each page**. This creates a global listing dump on the Map, a Directory selection that can yield no visible results, an Explore page that repeats directory behavior, and an Events page that stops at an empty city state.

The corrective rule is:

> **Every page is a different purpose-driven view of the same canonical records, scoped first by the member’s chosen location.**

A business, cultural place, event, community organization, or community signal is stored once. Map, Businesses, Explore, Events, Guides, and Kinfolk determine **why and how** that record is shown; they do not create separate inventories.

## Observed gaps

| Page | Observed behavior | Why it conflicts with the intended experience | Required correction |
|---|---|---|---|
| **Map** | The map viewport is Charlotte while the left panel shows 84 Markets including Philadelphia, Mobile, Birmingham, Baton Rouge, and New Orleans. | Pins/list rows are being loaded as a global category result rather than a Charlotte-scoped result. The map becomes a free-for-all rather than “what is around me.” | Require a location context for every result query. Return exact local matches first; if none exist, display a coverage-gap state and let the member intentionally expand to nearest or all locations. |
| **Map → Businesses layer** | Selecting Businesses reportedly produces no visible content. | The selected layer, API entity type, or map/list state is not reliably connected. An empty layer has no transparent reason or recovery action. | Use a typed layer contract (`business`, `cultural_site`, `event`, etc.), fetch the selected layer with the current location/filter state, show a populated result list, or explicitly show “none nearby” plus selectable expansion options. |
| **Businesses** | The page states “200 businesses in directory,” and filters are global rather than clearly location-scoped. | The page promotes total inventory before answering “what is available for me here?” | Default to a saved/chosen location or location permission. Show **“X verified businesses in Charlotte”** with category, specialty, ownership, distance, and community-context filters. Include **Barbers** as a first-class specialty/category. |
| **Explore** | Category and ownership filters resemble the Business Directory; results look like a listing grid. | Explore duplicates the Directory’s job. | Reposition Explore around heritage, arts, neighborhoods, cultural districts, HBCUs, faith/community landmarks, outdoors, family, nightlife, and living culture. Businesses appear only as contextual stops within an experience. |
| **Events** | Default city is Philadelphia; no events creates a large dead end. | Events is time-specific but lacks a local fallback and contribution loop. | Use shared member location. If no local events exist, offer nearby cities, this-weekend browsing, relevant community happenings, and **Add an event**. Record the coverage gap. |
| **Kinfolk** | The assistant exists visually but page activity does not consistently enrich its understanding. | Kinfolk becomes a separate chat surface instead of the intelligence layer over shared activity. | Feed explicit, privacy-bounded signals from searches, filter selection, gap states, event fallback, saves, and optional “show nearest” choices. Never infer sensitive identity/health facts without direct member input. |

## Purpose boundaries

| Surface | Member question | Canonical records it may use | What it must not become |
|---|---|---|---|
| **Map** | “What is around me?” | All geo-locatable record types. | A global directory list detached from the viewport/location. |
| **Businesses** | “Who can I support, hire, book, or visit?” | Businesses, professionals, organizations, verified service providers. | A cultural itinerary or a global total-count page. |
| **Explore** | “What should I experience or learn here?” | Cultural places, neighborhoods, heritage, experiences, contextual businesses/events. | A duplicate business directory with ownership chips as the main function. |
| **Events** | “What is happening, and when?” | Time-bounded events linked to businesses, circles, organizations, or cultural places. | A city dropdown with an empty dead end. |
| **Kinfolk** | “Help me navigate what fits me.” | Safe, permissioned retrieval across all canonical record types plus Library knowledge. | A duplicate record database or surveillance profile. |

## Location-first result policy

1. A member’s explicit city/neighborhood always wins over a saved location. A saved location wins over a coarse device location only when the member has chosen it.
2. Results are requested with an explicit location scope; the API never silently substitutes all-national inventory for an empty local result.
3. When exact-local results are absent, the response includes a **coverage gap** and offers three non-forced choices: expand radius, browse nearest city, or help add a missing provider/place/event.
4. The system records only aggregate gap telemetry: service/category, city/neighborhood, and counts. It does not store a member’s exact travel history or expose private requests.
5. A map pin is a rendered view of a canonical record in the selected location/filter context. Pins cannot be treated as untyped decorative markers.

## Required shared flywheel

| Input | Shared signal | Immediate page behavior | Kinfolk / operations use |
|---|---|---|---|
| Search: “barber in Charlotte” | Intent = business/service; category = barber; location = Charlotte. | Directory and Map show only local barber results. | Kinfolk can offer a local, optional concierge follow-up; operations sees aggregate barber coverage. |
| No local result | Coverage gap for the specific category and location. | Offer nearest/expanded search or add-a-listing path. | Prioritize city/category outreach; never pretend a global result is local. |
| Map layer selected | `surface=map`, selected record type, active location/filters. | Fetch/reconcile pins and the left result panel together. | Reveals demand for map layers and category discovery. |
| Business saved/contacted/directions | Explicit engagement with canonical business ID. | Keeps the member’s saved list current. | Can improve ranking within the same declared location and category; not a hidden identity inference. |
| Event-empty state | City/time/category coverage gap. | Shows nearby/this-weekend/submit-event options. | Operations can target event intake and event-partner outreach. |
| Community tag confirmed | Moderated, location-specific tag aggregate. | Explains why a local record is relevant. | Kinfolk can interpret community context without exposing individual reviewers. |

## Priority implementation order

1. Make the API and PostgreSQL migration state healthy; resolve the observed missing-column errors and stale dynamic cache behavior.
2. Introduce one `LocationContext` across Map, Businesses, Explore, Events, and Kinfolk.
3. Replace global map/category loads with typed, location-scoped discovery queries.
4. Repair Map Businesses selection and Directory specialty filters, including Barbers.
5. Build coverage-gap/nearest/expand controls before expanding global inventory views.
6. Reposition Explore and Events around their distinct jobs and connect their empty states to the flywheel.
7. Add privacy-bounded telemetry and moderator dashboards for coverage gaps and community tags.

## Ecosystem-wide page audit

| Surface | Required job | Current or likely gap to prevent | Shared-data connection |
|---|---|---|---|
| **Safety** | Give community-informed, location-specific preparation and safety context. | It must not become a duplicate Map or a source of unverified danger claims. | Reads canonical places, approved safety context, and member-selected location; Kinfolk may explain available information with appropriate uncertainty. |
| **Community** | Broad visible conversation and local recommendations. | Posts should not create duplicate business/place profiles or automatically become public recommendation tags. | A post may reference a canonical record; a separate moderated process turns recurring eligible feedback into a location-specific aggregate tag. |
| **Circles** | Smaller affinity/community spaces. | It must not duplicate public Community or become an unstructured directory. | Circle events, guides, and recommendations link to canonical records with circle visibility and consent rules. |
| **Guides** | Curated journeys, such as “48 Hours in Black Atlanta.” | A Guide must not copy every business or cultural record into a separate table. | Ordered guide stops reference canonical records; location and date context determine availability. |
| **Library** | Source-cited knowledge and resources. | It must not become a static city-link page or a raw chat archive. | Kinfolk research saves reusable cited entries; relevant local services are an optional connection, not medical/legal advice. |
| **Marketplace** | Products, offers, packages, booking, and transactions. | It should not expose unverified booking/payment state through generic discovery cards. | A business can own a marketplace offer; the offer is a separate canonical transaction record linked to the business. |
| **Connections** | Consent-based individual relationship building. | It must not expose location history or use hidden discovery activity to recommend people. | Member chooses what profile/location context to share; Kinfolk may help with an explicitly requested introduction path. |
| **For Business Owners** | Claim, update, and verify listings; understand demand. | It needs a clear, non-identifying coverage-demand view rather than raw member searches. | Shows aggregated gaps by city/category/specialty, listing verification status, and selected community-tag moderation outcomes. |
| **Profile** | Let a member control location, tone, saved places, and privacy. | A missing or hidden location preference causes every surface to choose unrelated default cities. | Is the source for saved location and explicit preferences; every page reads it through `LocationContextProvider`. |

## Cross-page language corrections

| Current ambiguous language | Required language |
|---|---|
| “200 businesses in directory” | “12 verified businesses in Charlotte” or “No verified barbers in Charlotte yet.” |
| “No upcoming events found in Philadelphia” | “Nothing is listed in Philadelphia this weekend yet. See nearby events, change the date, or add an event.” |
| Global Map category count | “8 Markets near Charlotte” with a visible location label and an intentional **Search all locations** control only after the local result is understood. |
| Explore category/ownership filter wall | “Heritage, Culture, Neighborhoods, HBCUs, Living Culture, Family, Nightlife, Faith & Community.” |

## Non-negotiable data rule

A canonical entity may have many **references** but never many duplicate profiles. A single verified barber can be seen as a Map pin, Business result, Guide stop, contextual Explore suggestion, event host, saved place, and Kinfolk recommendation. Each surface keeps its own context and presentation; all write back to the same canonical record and location-aware aggregate signals.
