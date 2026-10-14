# Cinematic Website Preview — Implementation Direction

## Product position

> **Mapping With Melanin is the living community ecosystem where everyday life, culture, business, knowledge, and shared care meet. KinfolkAI is the companion that helps a person find their way through it.**

This founder-review website is a **slow, cinematic editorial scroll**, not a feature tour. The visitor controls the pace. Every scene receives enough screen time to read, absorb, and connect emotionally before the next chapter appears.

## Design system

| Dimension | Direction |
| --- | --- |
| Design movement | Cinematic editorial storytelling: intimate documentary imagery, ample negative space, restrained motion, and high-contrast copy. |
| Core principles | Start with a human need; show relationships rather than isolated tools; earn trust through clear boundaries; let people control the pace. |
| Color philosophy | Espresso brown holds the page in warmth and seriousness; cream makes reading feel human; amber marks the path forward; muted sage signals collective care without alarm. |
| Layout paradigm | Full-viewport story chapters with alternating copy placement over original cinematic scenes. A small navigable chapter rail and reading-progress line orient visitors without interrupting the story. |
| Signature elements | A fine amber path line; numbered chapter labels; glassy copy panels against photographic scenes; concentric circles at the closing invitation. |
| Interaction philosophy | **Scroll sets the pace; the phone carries the action.** There is no forced auto-scroll or stand-alone feature tour. Scroll proximity, subtle image drift, chapter activation, progress, and chapter anchors keep the reader in control; every suite story also includes visible in-phone choices and next-step controls so a viewer can actively progress the practical moment without claiming a live session. |
| Animation | Scene copy rises and resolves only when its chapter enters view; background movement is slow and tied to reader scroll. Reduced-motion preferences remove transitions and parallax. |
| Typography | Playfair Display carries the emotional narrative at large scale; DM Sans provides readable supporting copy and quiet navigation. |
| Brand essence | A place to make everyday life feel more connected — grounded, thoughtful, and culturally alive. |
| Brand voice | Warm, precise, non-transactional, and candid. Example: “No one starts with a feature. They start with a life.” Example: “Let’s make this smaller together.” |

## Story architecture

| Chapter | Human moment | Role in the interconnected story |
| --- | --- | --- |
| Opening | A person walks toward a familiar gathering at dusk. | Establishes that MWM is about life, not a map product. |
| Everyday life | Someone is trying to find their footing. | Names the real starting point: care, work, belonging, or a place to gather. |
| KinfolkAI | A companion helps make an overwhelming question smaller. | Kinfolk holds the context around a question and guides the next step. |
| Community knowledge | Lived experience is shared across generations. | A recommendation becomes useful through people, story, memory, and context. |
| Business | An owner is known for more than a listing. | A business becomes visible inside a relationship with the community, not just through traffic. |
| Shared care | Friends leave a gathering together. | Safety is framed as belonging, familiar places, trusted relationships, and collective care. |
| Knowledge carried forward | The story closes as a living loop. | Learning from members, businesses, and community returns to help the next person begin. |

## Business-owner treatment

Do not publish a speculative tier comparison. The inspected source maps business memberships to member tiers, but it does not provide an approved, differentiated business-tier benefit matrix.

The narrative can responsibly describe an owner direction: a richer business identity; profile and hours management; community feedback and reviews with governance; events and participation; views, saves, clicks, and owner insights where access is available; and Kinfolk-supported improvement planning. The page must not guarantee grants, results, analytics eligibility, performance numbers, safety scores, verification, or membership entitlements.

A claim is never described as verification. Claimed ownership control, ownership designation, and verification are separate states.

## Technical implementation

- Single static `preview-founder-review.html` delivered from the isolated local static server.
- Five original 16:9 cinematic images reside in `assets/cinematic/` and are used in deliberate, non-repeating roles.
- CSS uses viewport-sized story chapters, `scroll-snap-type: y proximity`, dark readability gradients, responsive typography, and `prefers-reduced-motion` support.
- JavaScript observes chapters with `IntersectionObserver`, updates the chapter rail and status line, and ties a subtle visual shift to manual scroll position.
- Three CSS-built “app in motion” screens are embedded in the Kinfolk, Community, and business-owner chapters. Larger 0.49 portrait devices use staged scroll-triggered reveals: a source-informed Kinfolk public-listing search, contextual Community note, and owner response/Broadcasts compose flow. The source-backed business response is moderated; Kinfolk draft help is marked as proposed. Local controls change only illustrative state and never submit or publish data.
- Two larger, three-screen practical journeys make the immediate value legible before any feature list: **remember → ask → find** for a member, and **plan → promote → review** for an owner. The memory and public-listing patterns are source-informed; the Phoenix dialogue, blurred profile, Kinfolk proposal helper, and promotion copy are explicitly illustrative founder-review concepts. Stage controls preserve reader pacing and never save, generate, or send data.
- No live search, map, profile, form submission, real-time data, or Safety event is simulated.

## Everyday-product story revision

The next isolated preview is a **separate, product-first story** that keeps the accepted cinematic backdrops but replaces abstract app fragments with full-screen, sequential app states grounded in the existing Replit mockup and web/mobile source.

- **Member arc — Atlanta before, during, and after the meeting:** Kinfolk remembers only what the member chooses; a full conversation starts with “I’m excited for my trip to Atlanta—what should I know before I go?”; a selectable **pre-departure hair-planning** screen becomes part of the same conversation; Kinfolk moves through an itinerary/context view; an **arrival-day emergency nail** request adds a second selectable fictional appointment decision; a long-night request combines an email-support concept with a source-backed task/reminder action and dinner discovery; the real Replit-style visitor profile is shown in full; the source-backed Safety Hub closes the loop with Community Intelligence, private reporting controls, and location-led alert context. Appointment choices are labelled fictional previews—never live availability, a booking, a price, or a payment.
- **Owner arc — make the work visible:** the existing Replit dashboard, Broadcasts composer, and visitor-facing profile appear as clean source renders. New screens between them follow the actual business-plan and moderated-response structures: issue/goal → action plan, then statement → corrective action → trust plan. In-phone actions now carry the owner from dashboard to plan, promotion, moderated response, member view, and restart; selectable plan priorities make the workflow feel held rather than watched. The story makes the owner’s practical workflow legible without publishing an unapproved tier matrix.
- **Screen behavior:** a reader scrolls through labeled story beats while a large device changes screens. Screens slide/fade on each beat, are directly selectable from the accompanying story rail, and include an in-phone next-step control on every Travel and Business Owner state. This lets the viewer progress the full app context rather than watch a condensed miniature UI.
- **Visual sources:** copy and interaction states follow the existing Kinfolk travel page, Safety Hub, business-improvement flow, and Replit screen artifacts. Clean screenshots of the existing Replit dashboard, Broadcasts, visitor profile, and discovery map are bundled into the isolated preview rather than redrawn.

## One problem, whole day — additional Kinfolk preview

A second, separate mobile-first demonstration will let a visitor guide one connected Kinfolk conversation: **“My check-engine light came on, and I still need to get to work.”** It will retain the warm brown, cream, and gold visual language and a cinematic car/garage backdrop, but its center of gravity is a realistic phone the viewer actively advances.

- **Understand:** photo-upload state, a concise explanation of a warning light, and a safe follow-up question that distinguishes a flashing indicator from a routine inspection. It does not diagnose a vehicle or say it is safe to drive.
- **Evaluate money:** an explicitly illustrative repair-cost / diagnostic explainer and concrete questions to ask before authorizing work; no invented current prices.
- **Find support:** a directory-style mechanic discovery state with a map and business-profile affordance. It carries the member’s ownership preference and vehicle need, but uses a clearly marked illustrative result until verified live directory data is connected.
- **Keep the workday moving:** a context-preserving transportation comparison state. It uses no real routing or fare data and is visibly labeled as an illustrative integration preview.
- **Carry on:** a local-only boss-message draft and nearby-breakfast discovery state that remembers the car and work context. The viewer taps a guided control to advance each natural next question.

The final line is: **“Life doesn’t happen one question at a time. Neither should your AI.”** Existing production behavior, business records, safety guidance, membership rules, routing, and integrations remain unchanged.

### Memory-and-schedule revision for scenes 3 and 4

The car-day preview now treats the member context as **explicitly fictional but member-approved demo data**: a Black-owned-business preference, a Honda vehicle profile, saved home/work places, and a 9:00 AM calendar call authorized for the preview. Scene 3 will visibly use the preference and vehicle context without asking the member to repeat them; its cards, ownership/verification field, service-evidence field, and pins remain marked as fictional sample directory records until real verified data is connected. Scene 4 will proactively use the selected demo mechanic, saved workplace, and authorized demo calendar event to evaluate the next decision. It will never promise a before-9:00 arrival or show an actual route, fare, or transit prediction without a live routing integration; instead it makes the fallback behavior explicit.

## Fourth preview: Safety & Peace of Mind — *Move Through Life With Confidence*

Add a standalone, five-scene mobile-first Safety preview and a suite landing page that selects among four individually shareable stories: **Everyday Life** (the car-day page), **Travel** (the existing Kinfolk trip story), **Business Owners** (the existing owner story), and **Safety & Peace of Mind**. The Safety story is a freelance photographer deciding how to meet a new client. Its visual language keeps the warm brown, cream, gold, and deep-green brand palette but treats safety as agency, participation, and practical options—not alarm.

- **Opportunity:** a fictional new client’s requested meetup is considered alongside nearby public places, transportation, and available community context. No incident, location, score, or safety rating is invented.
- **Public alternative:** Kinfolk helps the member choose an open, staffed meeting alternative; every place/result stays visibly fictional until verified sources are connected.
- **Trusted check-in:** the member deliberately chooses details-only or temporary-location sharing, a named fictional trusted contact, an expiry, and a 7:00 PM check-in. Nothing is sent by the preview.
- **Community experience:** an anonymous-report draft shows what will be shared, consent, moderation, and a privacy limitation; it avoids a promise of absolute anonymity and never submits.
- **What comes next:** a job-exploration surface separates verified employer facts from individual community experiences, with no fabricated employer or report.
- **Separate safety boundary:** an optional serious-threat illustration uses only a fictional general-area notice and a separately opted-in trusted-contact preference. Routine police/ICE notifications stay within the member’s configured radius and never auto-notify trusted contacts; scheduled check-in escalation is separate consent workflow.

The preview will label each state **Available now**, **In development**, or **Coming soon** where appropriate, and it will never send a report, alert, message, notification, emergency signal, calendar event, or location update.

## Fifth preview: Explore Your Way — *Take as much or as little as you like*

Add a fifth standalone, mobile-first interactive concept that demonstrates Mapping With Melanin as an app someone can open and use without starting a long Kinfolk conversation. Its central app navigation is directly clickable: **Map**, **Discover**, **Events**, **Community**, and **Resources**. Each route includes a visible in-app back arrow after a detail is opened, a route title at the top, and a forward experience affordance; the page ends with “A quick search or a whole journey. Kinfolk meets you where you are.”

- **Map:** Near Me → Food → a fictional sample restaurant card → detail surface with menu/hours/directions placeholders; directory ownership/verification fields remain fictional until live data is connected.
- **Discover:** Vibe Search → “Chill, grown, good music” → visually browse fictional sample place cards; no live listing or availability is implied.
- **Events:** This Weekend → fictional cultural festival, community market, and networking event → detail and local-only RSVP acknowledgement.
- **Community:** browse a social feed → open an apartment-complex question → view fictional member responses → save/join acknowledgement, never a live post.
- **Resources:** Housing or Healthcare → sample resource/provider surfaces; provider facts and individual experiences remain visibly separate and fictional.

Every suite page will receive a consistent exterior experience bar: **back to All Experiences**, the current numbered experience title, and a tappable next-experience route. The combined Travel / Business page keeps direct internal links to each of its two experience sections. No active app page will send, save, publish, book, charge, or otherwise mutate production data.

### Direct-use content revision: complete business pages and interactive events

Replace generic “fictional” labels inside **Explore Your Way** with complete, named preview content while retaining one honest preview boundary at the app level. **Mapping With Melanin** becomes the default community-business profile shown from Map and Discover: its full profile includes the purpose statement, navigation, community conversation, local save/follow acknowledgements, and the user-supplied concept signals **“342 community members said it’s a vibe”** and **“657 said worth the wait.”** These signals are displayed as approved preview content—not live analytics, a rating, verification, or an independently measured claim.

The Events route becomes a true in-app filter experience: **This Weekend**, **Culture**, **Community**, **Networking**, **Family**, and **Food & Drink** each render a different set of named preview events and event details. A local RSVP acknowledgement changes only screen state; it never creates a reservation or attendee record. Other in-app routes similarly replace placeholder labels with complete sample business, community, housing, and healthcare pages, keeping provider facts separate from individual experiences and avoiding any claim of live listings, hours, availability, verification, safety, or clinical advice.

### Travel, business-card, and creator-loop revision

The Atlanta trip uses **demonstration business cards** instead of generic placeholder slots. The member asks for **braids before leaving** and can tap Crown & Coil Braiding Studio or Rooted Braid Bar; after arrival, the member says, **“I broke my nail when I got to Atlanta. I need to get it fixed.”** Kinfolk responds that it found a **verified minority-owned** nail studio near the hotel, then offers Peach City Nail Room and Glossed in the City as tappable business cards. Every card opens an in-app profile pop-out, never an external website. The profile states that its name, verification marker, service details, location relationship, availability, price, scheduling, and booking are demonstration-only—so the interaction can show the intended experience without asserting a live fact.

The owner journey expands from plan to a creator loop: **business plan → “your supporters are online” post nudge → video preview and selectable captions → “community members have been searching for happy hour near you” menu idea → accountable response → member view.** The new post nudge and community loop explicitly state that uploads, captions, search signals, menu creation, promotion, and publishing are demonstrations only. Explore entry links route directly to the interactive app surface, where every Map result card is interactive and opens a complete in-app profile; the default remains Mapping With Melanin.

### Mapping With Melanin app-surface alignment and release review

Only the **interactive Explore app shell** changes visual identity. The cinematic page retains Kinfolk’s small utility color pops, while the app surface is now anchored in the established Mapping With Melanin palette: **espresso `#3A1F0E`** for primary actions and high-emphasis brand surfaces, **cream `#FAF6EF`** for the application canvas, **gold `#CA922B`** for selected/progress emphasis, and **community green `#2D7A4F`** for helpful supporting context. A limited clay utility accent remains for map pins and attention cues.

The checked-out native app does contain the **actual Mapping With Melanin logo assets**. The review suite and Explore app shell must use those assets directly, never a recreated text wordmark or an invented `MWM` monogram. `preview-mwm-brand-front-page.html` remains a responsive review route with the real brand logo and a live embedded Explore app shell at desktop and mobile breakpoints. It is a local preview only, not a publication or production deployment.

### Corrective Kinfolk layout revision

The native mobile work is limited to **Kinfolk’s visual presentation** on an isolated branch: the existing chat launch affordance, chat header, assistant avatar, typing state, and Kinfolk settings header use the actual Mapping With Melanin assets and the current MWM color system. The chat, memory consent, preferences, task saving, recommendation sheet, voice controls, and settings routes remain functionally identical. The current business card, business preview modal, business profile, and business-owner dashboard files are protected and unchanged, so the colorful cards, copy, pop-up behavior, tabs, and owner workflow remain exactly the current application’s experience.

The Everyday Life review adds one readable, user-sent dashboard image attachment in the Kinfolk thread. It makes the upload-to-Kinfolk moment obvious without asserting a vehicle diagnosis or changing any real image-upload flow. A small `verify:kinfolk-layout` script verifies the retained Kinfolk entry points, brand assets, and untouched business UI paths before handoff.

### Universal Kinfolk business-preview correction

Every **business** presented in a Kinfolk preview must be tappable and reveal a preview sheet *inside its phone frame*, following the existing native `BusinessPreviewModal` hierarchy: drag handle, hero image, close affordance, rating/pinned row, community-rating chips, community voice, profile action, and return control. This is a presentation-only wrapper around existing visual language—not a redesign of the real business modal, business cards, business profile, owner dashboard, their tabs, or their actions.

- The Everyday Life mechanic choices gain this embedded sheet on selection.
- The Travel and Owner demonstration cards move their existing current-style sheet into the relevant phone frame rather than opening an unrelated page-level overlay.
- Explore directory cards use the same local in-phone sheet for preview business records; Mapping With Melanin retains its existing direct profile route.
- Every result remains demonstration-only unless a supported live directory supplies its details. No sheet opens an external site, fetches, saves, claims, follows, publishes, books, or alters production data.

Every preview business sheet uses a **category-matched gold Feather-style icon** against the existing dark/gold modal treatment rather than unrelated category photography: beauty uses scissors/comb visual language, automotive uses a tool, dining uses a coffee/food visual, and other categories map to their corresponding utility symbol. The native app follows the same visual-only fallback treatment when a business has no real `imageUrl`; a real business-supplied image remains intact. The actual Mapping With Melanin logo remains exclusive to the application shell, and category icons never replace a business logo or claim a real business identity.

## Railway staging publication

Publish the accepted review suite as a **separate Railway preview service**, never as a production Mapping With Melanin deployment. The service will be pinned to the committed `feature/website-preview-founder-review` Git branch and serve only `artifacts/api-server/web-static/` through a minimal Node static server that honors Railway’s assigned `PORT`.

- The new Railway project/service uses a neutral preview name and a Railway-generated domain; it does not attach a custom domain, production alias, database, volume, environment secret, webhook, or existing live service.
- The published suite includes both review surfaces requested: the responsive **web front-page preview** and the interactive **in-phone app preview**. They are browser-delivered concept experiences, not an iOS/Android release build.
- The native visual-only Kinfolk change is integrated separately through the current-main pull request; its next mobile build can consume the merged code without the Railway service changing the native app.
- A `package.json` and `server.mjs` are added only under the static preview directory. They have no runtime dependencies, data mutations, API calls, or fallback routing to production pages.

## Scope boundary

This prototype changes only the isolated founder-review preview and its dedicated Railway preview service. It does not change the live `/preview` route, native onboarding, business tiers, APIs, claims, Safety implementation, database data, any existing Railway service, custom domain, deployment, or production content.
