# Living Library Foundation: Diaspora-Relevant Topics That Grow

## What this correction changes

The current Library screen is not acceptable because the hero copy is too dark to read and the topic cards are blank except for an icon and “research entries.” A Living Library needs a meaningful place to begin even before Kinfolk has accumulated research.

This package seeds **28 durable foundational domains**, highlights eight Start Here topics, adds readable summaries and subject-specific gold-outline icons, and gives the Library a data model that grows through multi-topic links and reusable facets rather than a giant hard-coded subfolder tree.

## Start Here topics

The Library must show these eight populated cards on first load:

1. Housing & Home
2. Education & Learning
3. Trades, Skills & Certifications
4. Health & Wellness
5. Money & Economic Mobility
6. Careers & Professional Life
7. Business & Entrepreneurship
8. Community Resources & Help

Each card has a title, concise purpose, appropriate gold-outline icon, and either its real research-entry count or the honest call to action **“Explore this foundation.”** It must never show only a repeated icon and “research entries.”

## Architecture: foundation plus facets

| Data element | Role |
|---|---|
| `library_topics` | Durable domains such as Housing, Education, Health, and Culture. |
| `library_entry_topic_links` | Allows one source-cited entry to appear under many relevant domains. |
| `library_facet_definitions` | Defines reusable context such as goal, location, life stage, cultural context, need, resource, and content type. |
| `library_entry_facets` | Applies those contexts to one entry. |
| `library_topic_relationships` | Stores navigable connections among foundational domains without making a rigid parent-child tree. |

For example, Black maternal health may live simultaneously in **Health & Wellness, Family & Relationships, Rights & Advocacy, Legal Information, and Community Resources**, refined by facets such as `who:black-women`, `goal:find-provider`, `where:location-specific`, and `resource:professional`.

## Replit deployment sequence

1. Back up PostgreSQL.
2. Run `db/migrations/20260818_05_living_library_foundation.sql`.
3. Register `registerFoundationTopicRoutes(app, new FoundationTopicRepository(pool))`.
4. Replace the current Library landing page with `LivingLibraryHome.tsx`; import `living-library.css` and the prior `mwm-topic-icons.css`.
5. Use `persistFacetedKinfolkResearch` when Kinfolk stores a verified source-cited Library entry.
6. Copy `replit.md` to the project root. It is the permanent Library design and architecture memory for future Replit work.
7. Run the included Playwright checks before deployment.

## Visual acceptance

The hero title must render in ivory, the supporting paragraph in warm light text, and neither may inherit dark-brown color or low opacity. The screenshot’s unreadable hero copy is a release-blocking contrast failure. The topic cards must show readable titles and summaries, not blank placeholders.

## Growth rules

Kinfolk may add source-cited research, relationships, topic links, and facets as new questions arise. It must not create permanent duplicate topics for every query or fabricate entries simply to populate a card. The foundation is stable; discovery branches dynamically by **who, goal, where, life stage, cultural context, need, experience, resource, and content type**.
