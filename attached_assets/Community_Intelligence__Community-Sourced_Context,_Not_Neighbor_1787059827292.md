# Community Intelligence: Community-Sourced Context, Not Neighborhood Judgment

## Required product correction

Replace the product term **Community Safety** with **Community Intelligence** across the website, mobile app, API labels, navigation, page titles, map legends, empty states, Kinfolk instructions, release copy, and tests.

The preferred language is:

> **Community Intelligence** is community-sourced context for informed choices.

It communicates that Mapping with Melanin helps members understand places through shared experience, practical context, access, community connection, and trusted local resources. It must not suggest that communities of color, minority neighborhoods, or less-diverse neighborhoods are inherently safe or unsafe.

## What Community Intelligence can contain

| Appropriate community-sourced context | Prohibited conclusion |
|---|---|
| A moderated member observation about a business entrance, event arrival, accessibility, hours, transit, welcome, or practical experience. | A demographic, diversity, race, or ethnicity-based safety judgment. |
| A dated, attributed description of a specific local condition with clear limits. | A neighborhood “safety score” based on who lives there. |
| A link to an official emergency source where a member explicitly requests emergency help. | A claim that Community Intelligence replaces emergency services or official alerts. |
| Culturally relevant places and resources requested by a member. | Inferring the member’s identity from the requested characteristic. |

## Exact implementation sequence

1. Copy `server/communityIntelligence/policy.ts` into the API service.
2. Replace any shared copy constants with `client/src/features/community-intelligence/communityIntelligenceCopy.ts`.
3. Apply the route/header/map replacements shown in `communityIntelligence.patch.tsx`.
4. Update map/directory/Kinfolk data contracts from terms such as `neighborhoodSafetyScore`, `safeStay`, or `safetyContext` to source-backed `communityIntelligenceSignals`.
5. Do not perform a blind database rename if the existing table has production dependencies. First add the new application-facing field/view, migrate callers, verify production traffic, and only then retire the old internal name.
6. Copy `replit.md` to the project root so the wording and anti-inference rule survive future Replit changes.
7. Run the included tests and repository-wide wording scan before release.

## Required wording scan

Run a scan outside node modules and generated output:

```bash
grep -RniE "community safety|safety hub|neighborhood safety score|safe stay" client server mobile --exclude-dir=node_modules --exclude-dir=dist
```

Every remaining result requires a decision. Replace product language with Community Intelligence. Keep only genuine emergency, official-alert, or personal-safety wording where it remains truthful and necessary; those must never be rebranded as Community Intelligence.

## Kinfolk instruction

Include `communityIntelligencePromptRules()` when Kinfolk summarizes community signals. Kinfolk may say, for example:

> “Based on community-sourced reports, members have shared practical information about arrival and access here. These experiences are context, not a rating of the neighborhood or its residents.”

Kinfolk must not make a judgment about a neighborhood from its racial, ethnic, minority, or diversity makeup.

## Acceptance checks

Before deployment, verify all of the following:

- Navigation reads **Community Intelligence**, never Community Safety.
- The page hero uses **Community-sourced context for informed choices**.
- Community items have a source type, date, moderation status, and clear limitation.
- No map recommendation, filter, rank, or label receives demographics/diversity as a risk input.
- Empty states invite members to build shared context; they do not label a place unsafe.
- Emergency resources remain separately and accurately labeled.
- The policy tests pass.
